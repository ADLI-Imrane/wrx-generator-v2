import { Hono } from 'hono';
import { RANGES, type Analytics, type Range } from '@wrx/shared';
import type { AppEnv } from '../env';
import { requireAuth } from '../lib/session';
import { owned } from './links';

export const analytics = new Hono<AppEnv>();
analytics.use('*', requireAuth);

const RANGE_MS: Record<Range, number> = {
  '24h': 864e5,
  '7d': 7 * 864e5,
  '30d': 30 * 864e5,
  '90d': 90 * 864e5,
};

/** One endpoint, one round trip: every widget of the dashboard is computed in a single D1 batch. */
analytics.get('/', async (c) => {
  const { userId } = c.get('session');
  const range: Range = (RANGES as readonly string[]).includes(c.req.query('range') ?? '')
    ? (c.req.query('range') as Range)
    : '30d';
  const linkId = c.req.query('linkId');
  if (linkId) await owned(c.env.DB, linkId, userId);

  const now = Date.now();
  const span = RANGE_MS[range];
  const from = now - span;
  const scope = linkId ? 'link_id = ?' : 'user_id = ?';
  const id = linkId ?? userId;
  const W = `${scope} AND ts >= ?`;
  const db = c.env.DB;
  const bucket =
    range === '24h'
      ? `strftime('%Y-%m-%dT%H:00', ts / 1000, 'unixepoch')`
      : `strftime('%Y-%m-%d', ts / 1000, 'unixepoch')`;
  const top = (col: string, n = 8) =>
    db
      .prepare(
        `SELECT COALESCE(${col}, 'Unknown') AS key, COUNT(*) AS value FROM clicks WHERE ${W} GROUP BY key ORDER BY value DESC LIMIT ${n}`,
      )
      .bind(id, from);

  const res = await db.batch([
    db
      .prepare(`SELECT COUNT(*) AS total, COUNT(DISTINCT visitor) AS uniq FROM clicks WHERE ${W}`)
      .bind(id, from),
    db
      .prepare(`SELECT COUNT(*) AS total FROM clicks WHERE ${scope} AND ts >= ? AND ts < ?`)
      .bind(id, from - span, from),
    db
      .prepare(
        `SELECT ${bucket} AS t, COUNT(*) AS clicks, SUM(source = 'qr') AS qr FROM clicks WHERE ${W} GROUP BY t ORDER BY t`,
      )
      .bind(id, from),
    top('country', 60),
    top(`city || ', ' || country`),
    top('device'),
    top('browser'),
    top('os'),
    top('referrer'),
    top('source'),
    db
      .prepare(
        `SELECT l.id, l.slug, l.title, COUNT(*) AS clicks FROM clicks c JOIN links l ON l.id = c.link_id WHERE c.${scope} AND c.ts >= ? GROUP BY l.id ORDER BY clicks DESC LIMIT 8`,
      )
      .bind(id, from),
    db
      .prepare(
        `SELECT l.slug, c.country, c.city, c.device, c.browser, c.ts FROM clicks c JOIN links l ON l.id = c.link_id WHERE c.${scope} ORDER BY c.ts DESC LIMIT 12`,
      )
      .bind(id),
  ]);
  const rows = <T>(i: number) => res[i]!.results as T[];
  const head = rows<{ total: number; uniq: number }>(0)[0]!;

  const body: Analytics = {
    range,
    total: head.total,
    uniqueVisitors: head.uniq,
    previousTotal: rows<{ total: number }>(1)[0]!.total,
    series: fillSeries(rows<{ t: string; clicks: number; qr: number }>(2), range, now),
    countries: rows(3),
    cities: rows(4),
    devices: rows(5),
    browsers: rows(6),
    os: rows(7),
    referrers: rows(8),
    sources: rows(9),
    topLinks: rows(10),
    recent: rows<{
      slug: string;
      country: string | null;
      city: string | null;
      device: string;
      browser: string;
      ts: number;
    }>(11).map(({ ts, ...r }) => ({
      ...r,
      at: new Date(ts).toISOString(),
    })),
  };
  return c.json(body);
});

/** Returns a gap-free series so charts never jump over silent days. */
export function fillSeries(points: { t: string; clicks: number; qr: number }[], range: Range, now: number) {
  const hourly = range === '24h';
  const steps = hourly ? 24 : RANGE_MS[range] / 864e5;
  const byT = new Map(points.map((p) => [p.t, p]));
  const out: { t: string; clicks: number; qr: number }[] = [];
  for (let i = steps - 1; i >= 0; i--) {
    const d = new Date(now - i * (hourly ? 36e5 : 864e5));
    const t = hourly ? d.toISOString().slice(0, 13) + ':00' : d.toISOString().slice(0, 10);
    const p = byT.get(t);
    out.push({ t, clicks: p?.clicks ?? 0, qr: p?.qr ?? 0 });
  }
  return out;
}
