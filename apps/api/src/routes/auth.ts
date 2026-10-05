import { Hono } from 'hono';
import { LoginSchema, RegisterSchema } from '@wrx/shared';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { HttpError } from '../lib/errors';
import { parse, body } from '../lib/validate';
import { hashPassword, verifyPassword, newId, nowIso } from '../lib/crypto';
import { startSession, endSession, requireAuth, blockDemo } from '../lib/session';
import { toUser, type UserRow } from '../lib/mappers';
import { rateLimit } from '../lib/ratelimit';
import { ensureDemoWorkspace } from '../lib/demo';

export const auth = new Hono<AppEnv>();
const limiter = rateLimit(10, 60_000);

auth.post('/register', limiter, async (c) => {
  const input = parse(RegisterSchema, await body(c.req));
  const exists = await c.env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(input.email).first();
  if (exists) throw new HttpError(409, 'email_taken', 'An account already uses this email', { email: 'An account already uses this email — sign in instead' });
  const user = await c.env.DB.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *')
    .bind(newId('usr'), input.email, input.name, await hashPassword(input.password), nowIso())
    .first<UserRow>();
  await startSession(c, user!);
  return c.json(toUser(user!), 201);
});

auth.post('/login', limiter, async (c) => {
  const input = parse(LoginSchema, await body(c.req));
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_demo = 0').bind(input.email).first<UserRow>();
  // Always run a hash so response time does not reveal whether the email exists.
  const ok = user ? await verifyPassword(input.password, user.password_hash) : (await hashPassword(input.password, 1000), false);
  if (!user || !ok) throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
  await startSession(c, user);
  return c.json(toUser(user));
});

auth.post('/demo', rateLimit(20, 60_000), async (c) => {
  const user = await ensureDemoWorkspace(c.env.DB);
  await startSession(c, user);
  return c.json(toUser(user));
});

auth.post('/logout', (c) => {
  endSession(c);
  return c.body(null, 204);
});

auth.get('/me', requireAuth, async (c) => {
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.get('session').userId).first<UserRow>();
  if (!user) { endSession(c); throw new HttpError(401, 'unauthorized', 'Sign in to continue'); }
  return c.json(toUser(user));
});

auth.patch('/me', requireAuth, blockDemo, async (c) => {
  const input = parse(z.object({ name: z.string().trim().min(2).max(60) }), await body(c.req));
  const user = await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ? RETURNING *').bind(input.name, c.get('session').userId).first<UserRow>();
  return c.json(toUser(user!));
});

auth.post('/password', requireAuth, blockDemo, limiter, async (c) => {
  const input = parse(z.object({ current: z.string(), next: z.string().min(8, 'Use at least 8 characters').max(128) }), await body(c.req));
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.get('session').userId).first<UserRow>();
  if (!user || !(await verifyPassword(input.current, user.password_hash))) throw new HttpError(422, 'validation_failed', 'Current password is incorrect', { current: 'Current password is incorrect' });
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(input.next), user.id).run();
  return c.body(null, 204);
});

auth.delete('/me', requireAuth, blockDemo, async (c) => {
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(c.get('session').userId).run();
  endSession(c);
  return c.body(null, 204);
});
