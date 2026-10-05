import { Hono } from 'hono';
import { z } from 'zod';
import { parseUA, ContactInputSchema, PROFILE_KINDS, OPPORTUNITY_TYPES } from '@wrx/shared';
import type { AppEnv } from '../env';
import { HttpError, notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { verifyPassword, newId, nowIso } from '../lib/crypto';
import { rateLimit } from '../lib/ratelimit';
import { availability, chooseDestination } from '../lib/route';
import { loadLink, recordClick } from './redirect';
import { toBio, toOpp, OPP_SELECT, type BioRow, type OppRow } from '../lib/mappers';
import { originOf } from '../lib/origin';

export const pub = new Hono<AppEnv>();

/** Password-protected links: the visitor posts the password, we answer with the destination. */
pub.post('/unlock/:slug', rateLimit(8, 60_000), async (c) => {
  const slug = c.req.param('slug');
  const { password } = parse(z.object({ password: z.string().min(1).max(64) }), await body(c.req));
  const row = await c.env.DB.prepare('SELECT password_hash FROM links WHERE slug = ?')
    .bind(slug)
    .first<{ password_hash: string | null }>();
  const link = await loadLink(c, slug);
  if (!row || !link) throw notFound('Link');
  if (availability(link)) throw new HttpError(410, 'unavailable', 'This link is no longer available');
  if (!row.password_hash || !(await verifyPassword(password, row.password_hash)))
    throw new HttpError(401, 'wrong_password', 'That password is not right', {
      password: 'That password is not right',
    });
  const ua = parseUA(c.req.header('user-agent'));
  const cf = (c.req.raw as { cf?: IncomingRequestCfProperties }).cf;
  c.executionCtx.waitUntil(recordClick(c, link, ua));
  return c.json({ url: chooseDestination(link, { country: cf?.country as string | undefined, os: ua.os }) });
});

pub.get('/bio/:handle', async (c) => {
  const row = await c.env.DB.prepare('UPDATE bio_pages SET views = views + 1 WHERE handle = ? RETURNING *')
    .bind(c.req.param('handle').toLowerCase())
    .first<BioRow>();
  if (!row) throw notFound('Profile');
  const origin = originOf(c);
  const { results } = await c.env.DB.prepare(
    `${OPP_SELECT} WHERE o.page_id = ? AND o.status = 'open' ORDER BY o.created_at DESC LIMIT 20`,
  )
    .bind(row.id)
    .all<OppRow>();
  const { id: _id, views: _v, ...page } = toBio(row, origin);
  return c.json({
    ...page,
    openOpportunities: results.length,
    opportunities: results.map((r) => toOpp(r, origin)),
  });
});

/** Digital business card: scanning the profile QR offers to save the contact straight into the phone. */
pub.get('/bio/:handle/vcard', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM bio_pages WHERE handle = ?')
    .bind(c.req.param('handle').toLowerCase())
    .first<BioRow>();
  if (!row) throw notFound('Profile');
  const p = toBio(row, originOf(c));
  const esc = (s = '') =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/[,;]/g, (m) => `\\${m}`);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    p.kind === 'person'
      ? `N:${esc(p.title.split(' ').slice(1).join(' '))};${esc(p.title.split(' ')[0])};;;`
      : `N:${esc(p.title)};;;;`,
    `FN:${esc(p.title)}`,
    p.card.company || p.kind !== 'person' ? `ORG:${esc(p.card.company || p.title)}` : '',
    p.card.role || p.headline ? `TITLE:${esc(p.card.role || p.headline)}` : '',
    p.card.email ? `EMAIL;TYPE=INTERNET:${p.card.email}` : '',
    p.card.phone ? `TEL;TYPE=CELL:${esc(p.card.phone)}` : '',
    p.card.website ? `URL:${p.card.website}` : '',
    `URL:${p.publicUrl}`,
    p.location ? `ADR;TYPE=WORK:;;;${esc(p.location)};;;` : '',
    p.bio ? `NOTE:${esc(p.bio)}` : '',
    'END:VCARD',
  ].filter(Boolean);
  return c.body(lines.join('\r\n'), 200, {
    'Content-Type': 'text/vcard; charset=utf-8',
    'Content-Disposition': `attachment; filename="${p.handle}.vcf"`,
  });
});

pub.post('/bio/:handle/contact', rateLimit(5, 10 * 60_000), async (c) => {
  const input = parse(ContactInputSchema, await body(c.req));
  const page = await c.env.DB.prepare('SELECT id, user_id FROM bio_pages WHERE handle = ?')
    .bind(c.req.param('handle').toLowerCase())
    .first<{ id: string; user_id: string }>();
  if (!page) throw notFound('Profile');
  if (input.website) return c.json({ ok: true }, 201); // honeypot tripped: pretend success, store nothing
  let opportunityId: string | null = null;
  if (input.opportunityId) {
    const opp = await c.env.DB.prepare(
      `SELECT id FROM opportunities WHERE id = ? AND page_id = ? AND status = 'open'`,
    )
      .bind(input.opportunityId, page.id)
      .first<{ id: string }>();
    if (!opp) throw new HttpError(410, 'closed', 'This opportunity is closed');
    opportunityId = opp.id;
  }
  await c.env.DB.prepare(
    'INSERT INTO contact_requests (id, user_id, page_id, opportunity_id, intent, from_name, from_email, from_company, from_profile, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      newId('req'),
      page.user_id,
      page.id,
      opportunityId,
      input.intent,
      input.name,
      input.email,
      input.company || null,
      input.profileUrl || null,
      input.message,
      nowIso(),
    )
    .run();
  return c.json({ ok: true }, 201);
});

/** Public directory of people, startups and companies that chose to be discoverable. */
pub.get('/discover', async (c) => {
  const where = ['discoverable = 1'];
  const args: unknown[] = [];
  const kind = c.req.query('kind');
  if (kind && (PROFILE_KINDS as readonly string[]).includes(kind)) {
    where.push('kind = ?');
    args.push(kind);
  }
  const q = c.req.query('q')?.trim();
  if (q) {
    where.push('(title LIKE ? OR headline LIKE ? OR bio LIKE ? OR industry LIKE ? OR skills LIKE ?)');
    args.push(...Array(5).fill(`%${q}%`));
  }
  const loc = c.req.query('location')?.trim();
  if (loc) {
    where.push('location LIKE ?');
    args.push(`%${loc}%`);
  }
  const open = c.req.query('openTo');
  if (open) {
    where.push('EXISTS (SELECT 1 FROM json_each(bio_pages.open_to) WHERE value = ?)');
    args.push(open);
  }
  const { results } = await c.env.DB.prepare(
    `SELECT *, (SELECT COUNT(*) FROM opportunities o WHERE o.page_id = bio_pages.id AND o.status = 'open') AS open_opps
     FROM bio_pages WHERE ${where.join(' AND ')} ORDER BY open_opps DESC, updated_at DESC LIMIT 60`,
  )
    .bind(...args)
    .all<BioRow & { open_opps: number }>();
  const origin = originOf(c);
  return c.json({
    items: results.map((r) => {
      const { id: _id, views: _v, card: _card, ...p } = toBio(r, origin);
      return { ...p, openOpportunities: r.open_opps };
    }),
  });
});

pub.get('/opportunities', async (c) => {
  const where = [`o.status = 'open'`, 'p.discoverable = 1'];
  const args: unknown[] = [];
  const type = c.req.query('type');
  if (type && (OPPORTUNITY_TYPES as readonly string[]).includes(type)) {
    where.push('o.type = ?');
    args.push(type);
  }
  const q = c.req.query('q')?.trim();
  if (q) {
    where.push('(o.title LIKE ? OR o.description LIKE ? OR o.tags LIKE ? OR p.title LIKE ?)');
    args.push(...Array(4).fill(`%${q}%`));
  }
  if (c.req.query('remote') === '1') where.push('o.remote = 1');
  const { results } = await c.env.DB.prepare(
    `${OPP_SELECT} WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC LIMIT 60`,
  )
    .bind(...args)
    .all<OppRow>();
  return c.json({ items: results.map((r) => toOpp(r, originOf(c))) });
});

pub.get('/opportunities/:id', async (c) => {
  await c.env.DB.prepare('UPDATE opportunities SET views = views + 1 WHERE id = ?')
    .bind(c.req.param('id'))
    .run();
  const r = await c.env.DB.prepare(`${OPP_SELECT} WHERE o.id = ?`).bind(c.req.param('id')).first<OppRow>();
  if (!r) throw notFound('Opportunity');
  return c.json(toOpp(r, originOf(c)));
});

pub.get('/stats', async (c) => {
  const r = await c.env.DB.prepare(
    "SELECT (SELECT COUNT(*) FROM links) AS links, (SELECT COUNT(*) FROM clicks) AS clicks, (SELECT COUNT(*) FROM bio_pages WHERE discoverable = 1) AS profiles, (SELECT COUNT(*) FROM opportunities WHERE status = 'open') AS opportunities",
  ).first();
  c.header('Cache-Control', 'public, max-age=300');
  return c.json(r);
});
