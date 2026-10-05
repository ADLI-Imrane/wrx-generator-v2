import type { MiddlewareHandler } from 'hono';
import { HttpError } from './errors';

/**
 * Best-effort fixed-window limiter, kept in isolate memory. It slows down brute force on auth
 * endpoints without spending KV writes; a production deployment would swap in the Rate Limiting binding.
 */
export function rateLimit(limit: number, windowMs: number): MiddlewareHandler {
  const hits = new Map<string, { n: number; reset: number }>();
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? 'local';
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || cur.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++cur.n > limit) {
      c.header('Retry-After', String(Math.ceil((cur.reset - now) / 1000)));
      throw new HttpError(429, 'rate_limited', 'Too many attempts. Wait a minute and try again.');
    }
    if (hits.size > 5000) hits.clear();
    await next();
  };
}
