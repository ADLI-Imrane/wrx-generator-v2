import { SELF } from 'cloudflare:test';

const BASE = 'https://wrx.test';
let ipSeq = 0;
export class Client {
  cookie = '';
  ip = `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
  constructor(public headers: Record<string, string> = {}) {}
  async req(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const res = await SELF.fetch(`${BASE}${path}`, {
      method,
      redirect: 'manual',
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(this.cookie ? { cookie: this.cookie } : {}), 'cf-connecting-ip': this.ip, ...this.headers, ...extra },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0]!;
    return res;
  }
  async json<T = any>(method: string, path: string, body?: unknown) {
    const res = await this.req(method, path, body);
    return { status: res.status, body: (res.status === 204 ? null : await res.json()) as T };
  }
}

let n = 0;
export async function signedIn() {
  const c = new Client();
  const r = await c.json('POST', '/api/v1/auth/register', { name: 'Test User', email: `user${++n}-${Date.now()}@test.dev`, password: 'correct-horse' });
  if (r.status !== 201) throw new Error(JSON.stringify(r.body));
  return c;
}
