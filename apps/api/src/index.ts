import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { swaggerUI } from '@hono/swagger-ui';
import type { AppEnv, Env } from './env';
import { HttpError, errorBody, sendError } from './lib/errors';
import { auth } from './routes/auth';
import { links } from './routes/links';
import { qr } from './routes/qr';
import { bio } from './routes/bio';
import { keys } from './routes/keys';
import { analytics } from './routes/analytics';
import { pub } from './routes/public';
import { connect } from './routes/connect';
import { handleRedirect, isSlugPath } from './routes/redirect';
import { openapi } from './openapi';
import { ensureDemoWorkspace } from './lib/demo';

export const app = new Hono<AppEnv>();

app.use('/api/*', secureHeaders({ crossOriginResourcePolicy: 'same-origin' }));
// Cookie auth + JSON-only mutations: a cross-site form post cannot send application/json without CORS preflight.
app.use('/api/*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) && c.req.header('content-length') !== '0' && c.req.header('content-type') && !c.req.header('content-type')!.includes('application/json'))
    throw new HttpError(415, 'unsupported_media_type', 'Send requests as application/json');
  await next();
});

const api = new Hono<AppEnv>();
api.get('/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));
api.route('/auth', auth);
api.route('/links', links);
api.route('/qr', qr);
api.route('/bio', bio);
api.route('/keys', keys);
api.route('/analytics', analytics);
api.route('/public', pub);
api.route('/connect', connect);
api.get('/openapi.json', (c) => c.json(openapi));
api.get('/docs', swaggerUI({ url: '/api/v1/openapi.json', title: 'WRX API' }));
api.all('*', () => { throw new HttpError(404, 'not_found', 'No such endpoint'); });
app.route('/api/v1', api);

// Short links live at the root: /abc123. Anything that is not a known slug falls through to the React app.
app.get('*', async (c) => {
  const path = new URL(c.req.url).pathname;
  if (isSlugPath(path)) {
    const res = await handleRedirect(c, decodeURIComponent(path.slice(1)));
    if (res) return res;
    const page = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
    return new Response(page.body, { status: 404, headers: page.headers });
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.onError((err, c) => {
  if (err instanceof HttpError) return sendError(c, err);
  console.error(err);
  return c.json(errorBody('internal', 'Something went wrong on our side. Try again in a moment.'), 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(ensureDemoWorkspace(env.DB, true));
  },
} satisfies ExportedHandler<Env>;
