import { Hono } from 'hono';
import { ApiKeyInputSchema } from '@wrx/shared';
import type { AppEnv } from '../env';
import { requireAuth, blockDemo } from '../lib/session';
import { HttpError, notFound } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { newId, nowIso, randomToken, sha256Hex } from '../lib/crypto';
import { toKey, type KeyRow } from '../lib/mappers';

export const keys = new Hono<AppEnv>();
keys.use('*', requireAuth);
keys.use('*', async (c, next) => {
  if (c.get('session').via === 'api-key') throw new HttpError(403, 'forbidden', 'API keys cannot manage other API keys');
  await next();
});

keys.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(c.get('session').userId).all<KeyRow>();
  return c.json({ items: results.map(toKey) });
});

/** The plain key is returned exactly once; only its SHA-256 is stored. */
keys.post('/', blockDemo, async (c) => {
  const { name } = parse(ApiKeyInputSchema, await body(c.req));
  const secret = `wrx_${randomToken(24)}`;
  const id = newId('key');
  await c.env.DB.prepare('INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, c.get('session').userId, name, secret.slice(0, 10), await sha256Hex(secret), nowIso()).run();
  return c.json({ id, name, prefix: secret.slice(0, 10), secret, createdAt: nowIso(), lastUsedAt: null }, 201);
});

keys.delete('/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('session').userId).run();
  if (!r.meta.changes) throw notFound('API key');
  return c.body(null, 204);
});
