import { Hono } from 'hono';
import { BioInputSchema, type BioInput } from '@wrx/shared';
import type { AppEnv } from '../env';
import { requireAuth } from '../lib/session';
import { HttpError, notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { newId, nowIso } from '../lib/crypto';
import { toBio, type BioRow } from '../lib/mappers';
import { originOf } from '../lib/origin';

export const bio = new Hono<AppEnv>();
bio.use('*', requireAuth);

bio.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM bio_pages WHERE user_id = ? ORDER BY created_at DESC').bind(c.get('session').userId).all<BioRow>();
  return c.json({ items: results.map((r) => toBio(r, originOf(c))) });
});

bio.post('/', async (c) => {
  const input = parse(BioInputSchema, await body(c.req));
  await assertHandleFree(c.env.DB, input.handle);
  const now = nowIso();
  const row = await c.env.DB.prepare(
    `INSERT INTO bio_pages (id, user_id, handle, kind, title, headline, bio, avatar, theme, location, industry, skills, open_to, discoverable, card, links, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(newId('bio'), c.get('session').userId, ...columns(input), now, now)
    .first<BioRow>();
  return c.json(toBio(row!, originOf(c)), 201);
});

bio.put('/:id', async (c) => {
  const { userId } = c.get('session');
  const cur = await c.env.DB.prepare('SELECT * FROM bio_pages WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first<BioRow>();
  if (!cur) throw notFound('Page');
  const input = parse(BioInputSchema, await body(c.req));
  if (input.handle !== cur.handle) await assertHandleFree(c.env.DB, input.handle);
  const row = await c.env.DB.prepare(
    `UPDATE bio_pages SET handle = ?, kind = ?, title = ?, headline = ?, bio = ?, avatar = ?, theme = ?, location = ?, industry = ?, skills = ?,
     open_to = ?, discoverable = ?, card = ?, links = ?, updated_at = ? WHERE id = ? RETURNING *`,
  )
    .bind(...columns(input), nowIso(), cur.id)
    .first<BioRow>();
  return c.json(toBio(row!, originOf(c)));
});

bio.delete('/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM bio_pages WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('session').userId).run();
  if (!r.meta.changes) throw notFound('Page');
  return c.body(null, 204);
});

const columns = (i: BioInput) => [
  i.handle, i.kind, i.title, i.headline, i.bio, i.avatar ?? null, i.theme, i.location, i.industry,
  JSON.stringify(i.skills), JSON.stringify(i.openTo), i.discoverable ? 1 : 0, JSON.stringify(i.card ?? {}), JSON.stringify(i.links),
] as const;

async function assertHandleFree(db: D1Database, handle: string) {
  if (await db.prepare('SELECT 1 FROM bio_pages WHERE handle = ?').bind(handle).first())
    throw new HttpError(409, 'handle_taken', `@${handle} is already taken`, { handle: 'Already taken — try another one' });
}
