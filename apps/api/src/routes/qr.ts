import { Hono } from 'hono';
import { QrInputSchema, QrDesignSchema } from '@wrx/shared';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { requireAuth } from '../lib/session';
import { notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { newId, nowIso } from '../lib/crypto';
import { toQr, type QrRow } from '../lib/mappers';
import { originOf } from '../lib/origin';
import { insertLink, owned } from './links';

export const qr = new Hono<AppEnv>();
qr.use('*', requireAuth);

const SELECT = `SELECT q.id, q.name, q.link_id, q.design, q.created_at, l.slug, l.url,
  (SELECT COUNT(*) FROM clicks c WHERE c.link_id = q.link_id AND c.source = 'qr') AS clicks_qr
  FROM qr_codes q JOIN links l ON l.id = q.link_id`;

qr.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`${SELECT} WHERE q.user_id = ? ORDER BY q.created_at DESC`).bind(c.get('session').userId).all<QrRow>();
  const origin = originOf(c);
  return c.json({ items: results.map((r) => toQr(r, origin)) });
});

qr.post('/', async (c) => {
  const { userId } = c.get('session');
  const input = parse(QrInputSchema, await body(c.req));
  const linkId = input.linkId
    ? (await owned(c.env.DB, input.linkId, userId)).id
    : (await insertLink(c.env.DB, userId, { url: input.url!, title: input.name, tags: ['qr'], rules: [], variants: [] })).id;
  const id = newId('qr');
  await c.env.DB.prepare('INSERT INTO qr_codes (id, user_id, link_id, name, design, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, userId, linkId, input.name, JSON.stringify(input.design), nowIso())
    .run();
  return c.json(await one(c.env.DB, id, userId, originOf(c)), 201);
});

qr.get('/:id', async (c) => c.json(await one(c.env.DB, c.req.param('id'), c.get('session').userId, originOf(c))));

qr.patch('/:id', async (c) => {
  const { userId } = c.get('session');
  const cur = await one(c.env.DB, c.req.param('id'), userId, originOf(c));
  const input = parse(z.object({ name: z.string().trim().min(1).max(80).optional(), design: QrDesignSchema.optional() }), await body(c.req));
  await c.env.DB.prepare('UPDATE qr_codes SET name = ?, design = ? WHERE id = ? AND user_id = ?')
    .bind(input.name ?? cur.name, JSON.stringify(input.design ?? cur.design), cur.id, userId)
    .run();
  return c.json(await one(c.env.DB, cur.id, userId, originOf(c)));
});

qr.delete('/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM qr_codes WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('session').userId).run();
  if (!r.meta.changes) throw notFound('QR code');
  return c.body(null, 204);
});

async function one(db: D1Database, id: string, userId: string, origin: string) {
  const row = await db.prepare(`${SELECT} WHERE q.id = ? AND q.user_id = ?`).bind(id, userId).first<QrRow>();
  if (!row) throw notFound('QR code');
  return toQr(row, origin);
}
