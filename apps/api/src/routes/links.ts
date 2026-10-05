import { Hono } from 'hono';
import { LinkInputSchema, LinkUpdateSchema, BulkImportSchema, randomSlug, isValidCustomSlug, type LinkInput } from '@wrx/shared';
import type { AppEnv } from '../env';
import { requireAuth } from '../lib/session';
import { HttpError, notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { hashPassword, newId, nowIso } from '../lib/crypto';
import { toLink, type LinkRow } from '../lib/mappers';
import { originOf } from '../lib/origin';
import { cachePurge } from '../lib/linkcache';

export const links = new Hono<AppEnv>();
links.use('*', requireAuth);

const SORTS = { recent: 'created_at DESC', clicks: 'clicks DESC', alpha: 'COALESCE(title, slug) COLLATE NOCASE ASC' } as const;

links.get('/', async (c) => {
  const { userId } = c.get('session');
  const q = c.req.query('q')?.trim();
  const tag = c.req.query('tag')?.trim();
  const status = c.req.query('status') ?? 'active';
  const sort = SORTS[(c.req.query('sort') as keyof typeof SORTS) ?? 'recent'] ?? SORTS.recent;
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 200);
  const offset = Math.max(Number(c.req.query('offset') ?? 0) || 0, 0);

  const where = ['user_id = ?'];
  const args: unknown[] = [userId];
  if (status === 'active') where.push('archived = 0');
  if (status === 'archived') where.push('archived = 1');
  if (q) { where.push('(slug LIKE ? OR url LIKE ? OR title LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (tag) { where.push('EXISTS (SELECT 1 FROM json_each(links.tags) WHERE value = ?)'); args.push(tag); }

  const [rows, count, tags] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT * FROM links WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT ? OFFSET ?`).bind(...args, limit, offset),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM links WHERE ${where.join(' AND ')}`).bind(...args),
    c.env.DB.prepare(`SELECT DISTINCT j.value AS tag FROM links, json_each(links.tags) j WHERE links.user_id = ? ORDER BY tag`).bind(userId),
  ]);
  const origin = originOf(c);
  return c.json({
    items: (rows!.results as unknown as LinkRow[]).map((r) => toLink(r, origin)),
    total: (count!.results[0] as { n: number }).n,
    tags: (tags!.results as { tag: string }[]).map((t) => t.tag),
  });
});

links.post('/', async (c) => {
  const { userId } = c.get('session');
  const input = parse(LinkInputSchema, await body(c.req));
  const row = await insertLink(c.env.DB, userId, input);
  return c.json(toLink(row, originOf(c)), 201);
});

links.post('/bulk', async (c) => {
  const { userId } = c.get('session');
  const { rows } = parse(BulkImportSchema, await body(c.req));
  const created: string[] = [];
  const failed: { row: number; reason: string }[] = [];
  for (const [i, r] of rows.entries()) {
    const res = LinkInputSchema.safeParse({ url: r.url, slug: r.slug || undefined, title: r.title || undefined, tags: r.tags ? r.tags.split(/[|;]/).map((t) => t.trim()).filter(Boolean) : [] });
    if (!res.success) { failed.push({ row: i + 1, reason: res.error.issues[0]?.message ?? 'Invalid row' }); continue; }
    try { created.push((await insertLink(c.env.DB, userId, res.data)).slug); }
    catch (e) { failed.push({ row: i + 1, reason: e instanceof HttpError ? e.message : 'Could not create link' }); }
  }
  return c.json({ created: created.length, failed }, 201);
});

links.get('/:id', async (c) => {
  const row = await owned(c.env.DB, c.req.param('id'), c.get('session').userId);
  return c.json(toLink(row, originOf(c)));
});

links.patch('/:id', async (c) => {
  const { userId } = c.get('session');
  const cur = await owned(c.env.DB, c.req.param('id'), userId);
  const input = parse(LinkUpdateSchema, await body(c.req));
  if (input.slug && input.slug !== cur.slug) await assertSlugFree(c.env.DB, input.slug);

  const sets: string[] = [];
  const args: unknown[] = [];
  const set = (col: string, v: unknown) => { sets.push(`${col} = ?`); args.push(v); };
  if (input.url !== undefined) set('url', input.url);
  if (input.slug !== undefined) set('slug', input.slug);
  if (input.title !== undefined) set('title', input.title || null);
  if (input.tags !== undefined) set('tags', JSON.stringify(input.tags));
  if (input.expiresAt !== undefined) set('expires_at', input.expiresAt);
  if (input.maxClicks !== undefined) set('max_clicks', input.maxClicks);
  if (input.utm !== undefined) set('utm', input.utm ? JSON.stringify(input.utm) : null);
  if (input.rules !== undefined) set('rules', JSON.stringify(input.rules));
  if (input.variants !== undefined) set('variants', JSON.stringify(assertWeights(input.variants)));
  if (input.archived !== undefined) set('archived', input.archived ? 1 : 0);
  if (input.removePassword) set('password_hash', null);
  else if (input.password) set('password_hash', await hashPassword(input.password));
  set('updated_at', nowIso());

  const row = await c.env.DB.prepare(`UPDATE links SET ${sets.join(', ')} WHERE id = ? AND user_id = ? RETURNING *`)
    .bind(...args, cur.id, userId)
    .first<LinkRow>();
  const origin = originOf(c);
  c.executionCtx.waitUntil(Promise.all([cachePurge(origin, cur.slug), cachePurge(origin, row!.slug)]));
  return c.json(toLink(row!, origin));
});

links.delete('/:id', async (c) => {
  const { userId } = c.get('session');
  const cur = await owned(c.env.DB, c.req.param('id'), userId);
  await c.env.DB.prepare('DELETE FROM links WHERE id = ? AND user_id = ?').bind(cur.id, userId).run();
  c.executionCtx.waitUntil(cachePurge(originOf(c), cur.slug));
  return c.body(null, 204);
});

/* ---------------- helpers ---------------- */
export async function owned(db: D1Database, id: string, userId: string) {
  const row = await db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?').bind(id, userId).first<LinkRow>();
  if (!row) throw notFound('Link');
  return row;
}

async function assertSlugFree(db: D1Database, slug: string) {
  if (!isValidCustomSlug(slug)) throw new HttpError(422, 'validation_failed', 'This short name is not allowed', { slug: 'This short name is not allowed' });
  const taken = await db.prepare('SELECT 1 FROM links WHERE slug = ?').bind(slug).first();
  if (taken) throw new HttpError(409, 'slug_taken', `/${slug} is already taken`, { slug: 'Already taken — try another one' });
}

function assertWeights<T extends { weight: number }>(variants: T[]) {
  const sum = variants.reduce((s, v) => s + v.weight, 0);
  if (sum > 95) throw new HttpError(422, 'validation_failed', 'Variants must leave at least 5% of traffic to the main link', { variants: 'Total weight must be 95% or less' });
  return variants;
}

export async function insertLink(db: D1Database, userId: string, input: LinkInput): Promise<LinkRow> {
  let slug = input.slug;
  if (slug) await assertSlugFree(db, slug);
  else {
    for (let i = 0; i < 5 && !slug; i++) {
      const s = randomSlug(i < 3 ? 6 : 8);
      if (!(await db.prepare('SELECT 1 FROM links WHERE slug = ?').bind(s).first())) slug = s;
    }
    if (!slug) throw new HttpError(503, 'slug_exhausted', 'Could not generate a short name, try again');
  }
  const now = nowIso();
  const row = await db
    .prepare(
      `INSERT INTO links (id, user_id, slug, url, title, tags, expires_at, max_clicks, password_hash, utm, rules, variants, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .bind(
      newId('lnk'), userId, slug, input.url, input.title || null, JSON.stringify(input.tags ?? []),
      input.expiresAt ?? null, input.maxClicks ?? null, input.password ? await hashPassword(input.password) : null,
      input.utm ? JSON.stringify(input.utm) : null, JSON.stringify(input.rules ?? []),
      JSON.stringify(assertWeights(input.variants ?? [])), now, now,
    )
    .first<LinkRow>();
  return row!;
}
