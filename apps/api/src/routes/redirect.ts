import type { Context } from 'hono';
import { parseUA, RESERVED_SLUGS, SLUG_PATTERN } from '@wrx/shared';
import type { AppEnv } from '../env';
import type { LinkRow } from '../lib/mappers';
import { availability, chooseDestination, type CachedLink } from '../lib/route';
import { cacheGet, cachePut } from '../lib/linkcache';
import { sha256Hex } from '../lib/crypto';
import { originOf } from '../lib/origin';

export function isSlugPath(pathname: string) {
  const seg = pathname.slice(1);
  return !!seg && !seg.includes('/') && SLUG_PATTERN.test(seg) && !RESERVED_SLUGS.has(seg.toLowerCase());
}

export async function loadLink(c: Context<AppEnv>, slug: string): Promise<CachedLink | null> {
  const origin = originOf(c);
  const cached = await cacheGet<CachedLink>(origin, slug);
  if (cached && cached.maxClicks == null) return cached;
  const r = await c.env.DB.prepare('SELECT * FROM links WHERE slug = ?').bind(slug).first<LinkRow>();
  if (!r) return null;
  const link: CachedLink = {
    id: r.id, userId: r.user_id, url: r.url, utm: r.utm ? JSON.parse(r.utm) : null, rules: JSON.parse(r.rules),
    variants: JSON.parse(r.variants), expiresAt: r.expires_at, maxClicks: r.max_clicks, clicks: r.clicks,
    hasPassword: !!r.password_hash, archived: !!r.archived,
  };
  c.executionCtx.waitUntil(cachePut(origin, slug, link));
  return link;
}

/** GET /:slug — the hot path. Never blocks on analytics: the click is written after the response. */
export async function handleRedirect(c: Context<AppEnv>, slug: string): Promise<Response | null> {
  const link = await loadLink(c, slug);
  if (!link) return null;
  const blocked = availability(link);
  if (blocked) return c.redirect(`/p/unavailable?reason=${blocked}&slug=${encodeURIComponent(slug)}`, 302);
  if (link.hasPassword) return c.redirect(`/unlock/${encodeURIComponent(slug)}`, 302);

  const ua = parseUA(c.req.header('user-agent'));
  const cf = (c.req.raw as { cf?: IncomingRequestCfProperties }).cf;
  const dest = chooseDestination(link, { country: cf?.country as string | undefined, os: ua.os });
  c.executionCtx.waitUntil(recordClick(c, link, ua));
  c.header('Cache-Control', 'private, max-age=0, no-store');
  c.header('Referrer-Policy', 'unsafe-url');
  return c.redirect(dest, 302);
}

export async function recordClick(c: Context<AppEnv>, link: Pick<CachedLink, 'id' | 'userId'>, ua = parseUA(c.req.header('user-agent'))) {
  if (ua.device === 'bot') return;
  const cf = (c.req.raw as { cf?: IncomingRequestCfProperties }).cf;
  const ref = c.req.header('referer');
  let referrer: string | null = null;
  try { referrer = ref ? new URL(ref).hostname.replace(/^www\./, '') : null; } catch { /* ignore malformed referrers */ }
  const src = c.req.query('r') === 'qr' ? 'qr' : c.req.query('r') === 'bio' ? 'bio' : referrer ? 'referral' : 'direct';
  // Daily-rotating, non-reversible visitor id: counts uniques without storing IPs.
  const day = new Date().toISOString().slice(0, 10);
  const visitor = (await sha256Hex(`${c.req.header('cf-connecting-ip') ?? ''}|${c.req.header('user-agent') ?? ''}|${day}|${link.id}`)).slice(0, 16);
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO clicks (link_id, user_id, ts, country, city, device, os, browser, referrer, source, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(link.id, link.userId, Date.now(), (cf?.country as string) ?? null, (cf?.city as string) ?? null, ua.device, ua.os, ua.browser, referrer, src, visitor),
    c.env.DB.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').bind(link.id),
  ]);
}
