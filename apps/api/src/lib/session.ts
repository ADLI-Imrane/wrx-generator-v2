import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { AppEnv, Session } from '../env';
import { HttpError } from './errors';
import { sha256Hex, nowIso } from './crypto';

export const COOKIE = 'wrx_session';
const TTL = 60 * 60 * 24 * 14; // 14 days

export async function startSession(c: Context<AppEnv>, user: { id: string; is_demo: number }) {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const token = await sign({ sub: user.id, demo: !!user.is_demo, exp }, c.env.JWT_SECRET, 'HS256');
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: TTL,
  });
}

export const endSession = (c: Context) => deleteCookie(c, COOKIE, { path: '/' });

/** Accepts either the session cookie (web app) or `Authorization: Bearer wrx_…` (public API). */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await resolveSession(c);
  if (!session) throw new HttpError(401, 'unauthorized', 'Sign in to continue');
  c.set('session', session);
  await next();
};

/** Mutations from the shared demo account are allowed but some account-level ones are not. */
export const blockDemo: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get('session').isDemo)
    throw new HttpError(403, 'demo_read_only', 'This action is disabled in the demo workspace');
  await next();
};

async function resolveSession(c: Context<AppEnv>): Promise<Session | null> {
  const auth = c.req.header('authorization');
  if (auth?.startsWith('Bearer wrx_')) {
    const hash = await sha256Hex(auth.slice(7));
    const row = await c.env.DB.prepare(
      'SELECT k.id, k.user_id, u.is_demo FROM api_keys k JOIN users u ON u.id = k.user_id WHERE k.key_hash = ?',
    )
      .bind(hash)
      .first<{ id: string; user_id: string; is_demo: number }>();
    if (!row) return null;
    c.executionCtx.waitUntil(
      c.env.DB.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').bind(nowIso(), row.id).run(),
    );
    return { userId: row.user_id, via: 'api-key', isDemo: !!row.is_demo };
  }
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    return { userId: String(payload.sub), via: 'cookie', isDemo: !!payload.demo };
  } catch {
    return null;
  }
}
