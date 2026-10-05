import type { Context } from 'hono';
import type { AppEnv } from '../env';
export const originOf = (c: Context<AppEnv>) => c.env.APP_ORIGIN || new URL(c.req.url).origin;
