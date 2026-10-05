import { Hono } from 'hono';
import { z } from 'zod';
import { OpportunityInputSchema, CONTACT_STATUSES, type ContactRequest } from '@wrx/shared';
import type { AppEnv } from '../env';
import { requireAuth } from '../lib/session';
import { notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { newId, nowIso } from '../lib/crypto';
import { OPP_SELECT, toOpp, type OppRow } from '../lib/mappers';
import { originOf } from '../lib/origin';

/** Authenticated side of "Connect": the opportunities you publish and the requests you receive. */
export const connect = new Hono<AppEnv>();
connect.use('*', requireAuth);

connect.get('/opportunities', async (c) => {
  const { results } = await c.env.DB.prepare(`${OPP_SELECT} WHERE o.user_id = ? ORDER BY o.created_at DESC`)
    .bind(c.get('session').userId)
    .all<OppRow>();
  return c.json({ items: results.map((r) => toOpp(r, originOf(c))) });
});

connect.post('/opportunities', async (c) => {
  const { userId } = c.get('session');
  const input = parse(OpportunityInputSchema, await body(c.req));
  await ownPage(c.env.DB, input.pageId, userId);
  const id = newId('opp');
  const now = nowIso();
  await c.env.DB.prepare(
    'INSERT INTO opportunities (id, user_id, page_id, type, title, location, remote, description, tags, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      userId,
      input.pageId,
      input.type,
      input.title,
      input.location,
      input.remote ? 1 : 0,
      input.description,
      JSON.stringify(input.tags),
      input.status,
      now,
      now,
    )
    .run();
  return c.json(await oneOpp(c.env.DB, id, userId, originOf(c)), 201);
});

connect.put('/opportunities/:id', async (c) => {
  const { userId } = c.get('session');
  const cur = await oneOpp(c.env.DB, c.req.param('id'), userId, originOf(c));
  const input = parse(OpportunityInputSchema, await body(c.req));
  await ownPage(c.env.DB, input.pageId, userId);
  await c.env.DB.prepare(
    'UPDATE opportunities SET page_id = ?, type = ?, title = ?, location = ?, remote = ?, description = ?, tags = ?, status = ?, updated_at = ? WHERE id = ?',
  )
    .bind(
      input.pageId,
      input.type,
      input.title,
      input.location,
      input.remote ? 1 : 0,
      input.description,
      JSON.stringify(input.tags),
      input.status,
      nowIso(),
      cur.id,
    )
    .run();
  return c.json(await oneOpp(c.env.DB, cur.id, userId, originOf(c)));
});

connect.delete('/opportunities/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM opportunities WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), c.get('session').userId)
    .run();
  if (!r.meta.changes) throw notFound('Opportunity');
  return c.body(null, 204);
});

interface ContactRow {
  id: string;
  intent: ContactRequest['intent'];
  from_name: string;
  from_email: string;
  from_company: string | null;
  from_profile: string | null;
  message: string;
  status: ContactRequest['status'];
  created_at: string;
  handle: string;
  page_title: string;
  opp_id: string | null;
  opp_title: string | null;
}
const toContact = (r: ContactRow): ContactRequest => ({
  id: r.id,
  intent: r.intent,
  name: r.from_name,
  email: r.from_email,
  company: r.from_company,
  profileUrl: r.from_profile,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
  page: { handle: r.handle, title: r.page_title },
  opportunity: r.opp_id ? { id: r.opp_id, title: r.opp_title! } : null,
});

connect.get('/inbox', async (c) => {
  const status = c.req.query('status');
  const where = ['r.user_id = ?'];
  const args: unknown[] = [c.get('session').userId];
  if (status && (CONTACT_STATUSES as readonly string[]).includes(status)) {
    where.push('r.status = ?');
    args.push(status);
  }
  const [rows, counts] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT r.*, p.handle, p.title AS page_title, o.id AS opp_id, o.title AS opp_title FROM contact_requests r
      JOIN bio_pages p ON p.id = r.page_id LEFT JOIN opportunities o ON o.id = r.opportunity_id WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT 200`,
    ).bind(...args),
    c.env.DB.prepare(
      'SELECT status, COUNT(*) AS n FROM contact_requests WHERE user_id = ? GROUP BY status',
    ).bind(c.get('session').userId),
  ]);
  return c.json({
    items: (rows!.results as unknown as ContactRow[]).map(toContact),
    counts: Object.fromEntries(
      (counts!.results as { status: string; n: number }[]).map((r) => [r.status, r.n]),
    ),
  });
});

connect.patch('/inbox/:id', async (c) => {
  const { status } = parse(z.object({ status: z.enum(CONTACT_STATUSES) }), await body(c.req));
  const r = await c.env.DB.prepare('UPDATE contact_requests SET status = ? WHERE id = ? AND user_id = ?')
    .bind(status, c.req.param('id'), c.get('session').userId)
    .run();
  if (!r.meta.changes) throw notFound('Request');
  return c.body(null, 204);
});

connect.delete('/inbox/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM contact_requests WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), c.get('session').userId)
    .run();
  if (!r.meta.changes) throw notFound('Request');
  return c.body(null, 204);
});

async function ownPage(db: D1Database, pageId: string, userId: string) {
  if (
    !(await db.prepare('SELECT 1 FROM bio_pages WHERE id = ? AND user_id = ?').bind(pageId, userId).first())
  )
    throw notFound('Profile');
}
async function oneOpp(db: D1Database, id: string, userId: string, origin: string) {
  const r = await db
    .prepare(`${OPP_SELECT} WHERE o.id = ? AND o.user_id = ?`)
    .bind(id, userId)
    .first<OppRow>();
  if (!r) throw notFound('Opportunity');
  return toOpp(r, origin);
}
