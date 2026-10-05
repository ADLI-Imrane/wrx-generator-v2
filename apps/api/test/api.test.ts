import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import { Client, signedIn } from './helpers';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

describe('auth', () => {
  it('registers, reads the session and logs out', async () => {
    const c = await signedIn();
    const me = await c.json('GET', '/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.name).toBe('Test User');
    await c.req('POST', '/api/v1/auth/logout');
    c.cookie = '';
    expect((await c.json('GET', '/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects a duplicate email with a field error', async () => {
    const c = new Client();
    const body = { name: 'Dup', email: 'dup@test.dev', password: 'long-enough' };
    expect((await c.json('POST', '/api/v1/auth/register', body)).status).toBe(201);
    const again = await new Client().json('POST', '/api/v1/auth/register', body);
    expect(again.status).toBe(409);
    expect(again.body.error.fields.email).toBeTruthy();
  });

  it('slows down brute force on login', async () => {
    const c = new Client();
    const codes: number[] = [];
    for (let i = 0; i < 11; i++)
      codes.push((await c.json('POST', '/api/v1/auth/login', { email: 'x@test.dev', password: 'y' })).status);
    expect(codes.at(-1)).toBe(429);
  });

  it('does not reveal which part of the credentials was wrong', async () => {
    const r = await new Client().json('POST', '/api/v1/auth/login', {
      email: 'nobody@test.dev',
      password: 'x',
    });
    expect(r.status).toBe(401);
    expect(r.body.error.message).toBe('Email or password is incorrect');
  });
});

describe('links', () => {
  it('creates a link and validates input', async () => {
    const c = await signedIn();
    const bad = await c.json('POST', '/api/v1/links', { url: 'not a url' });
    expect(bad.status).toBe(422);
    expect(bad.body.error.fields.url).toBeTruthy();
    const ok = await c.json('POST', '/api/v1/links', {
      url: 'https://example.com/a',
      title: 'A',
      tags: ['x'],
    });
    expect(ok.status).toBe(201);
    expect(ok.body.slug).toHaveLength(6);
    expect(ok.body.shortUrl).toBe(`https://wrx.test/${ok.body.slug}`);
  });

  it('refuses taken and reserved slugs', async () => {
    const c = await signedIn();
    await c.json('POST', '/api/v1/links', { url: 'https://example.com', slug: 'taken-one' });
    expect(
      (await c.json('POST', '/api/v1/links', { url: 'https://example.com', slug: 'taken-one' })).status,
    ).toBe(409);
    expect((await c.json('POST', '/api/v1/links', { url: 'https://example.com', slug: 'api' })).status).toBe(
      422,
    );
  });

  it('keeps users isolated from each other', async () => {
    const a = await signedIn();
    const b = await signedIn();
    const link = (await a.json('POST', '/api/v1/links', { url: 'https://example.com' })).body;
    expect((await b.json('GET', `/api/v1/links/${link.id}`)).status).toBe(404);
    expect((await b.json('DELETE', `/api/v1/links/${link.id}`)).status).toBe(404);
  });

  it('searches, filters by tag and archives', async () => {
    const c = await signedIn();
    await c.json('POST', '/api/v1/links', {
      url: 'https://example.com/1',
      title: 'Alpha launch',
      tags: ['launch'],
    });
    const two = (await c.json('POST', '/api/v1/links', { url: 'https://example.com/2', title: 'Beta' })).body;
    expect((await c.json('GET', '/api/v1/links?q=alpha')).body.total).toBe(1);
    expect((await c.json('GET', '/api/v1/links?tag=launch')).body.items[0].title).toBe('Alpha launch');
    await c.json('PATCH', `/api/v1/links/${two.id}`, { archived: true });
    expect((await c.json('GET', '/api/v1/links')).body.total).toBe(1);
    expect((await c.json('GET', '/api/v1/links?status=archived')).body.total).toBe(1);
  });

  it('imports links in bulk and reports bad rows', async () => {
    const c = await signedIn();
    const r = await c.json('POST', '/api/v1/links/bulk', {
      rows: [{ url: 'https://ok.test' }, { url: 'https://ok2.test', tags: 'a|b' }],
    });
    expect(r.body.created).toBe(2);
    const bad = await c.json('POST', '/api/v1/links/bulk', {
      rows: [{ url: 'https://ok3.test', slug: 'api' }],
    });
    expect(bad.body.failed[0].row).toBe(1);
  });
});

describe('redirects', () => {
  it('redirects, records the click and feeds analytics', async () => {
    const c = await signedIn();
    const link = (
      await c.json('POST', '/api/v1/links', { url: 'https://example.com/landing', utm: { source: 'test' } })
    ).body;
    const res = await new Client().req('GET', `/${link.slug}?r=qr`, undefined, {
      'user-agent': IPHONE,
      referer: 'https://www.instagram.com/p/1',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://example.com/landing?utm_source=test');
    await new Promise((r) => setTimeout(r, 50));
    const stats = (await c.json('GET', `/api/v1/analytics?range=7d&linkId=${link.id}`)).body;
    expect(stats.total).toBe(1);
    expect(stats.devices[0]).toEqual({ key: 'mobile', value: 1 });
    expect(stats.sources[0]).toEqual({ key: 'qr', value: 1 });
    expect(stats.series).toHaveLength(7);
  });

  it('routes iPhones with device rules', async () => {
    const c = await signedIn();
    const link = (
      await c.json('POST', '/api/v1/links', {
        url: 'https://example.com',
        rules: [{ type: 'device', devices: ['ios'], url: 'https://apps.apple.com/x' }],
      })
    ).body;
    const res = await new Client().req('GET', `/${link.slug}`, undefined, { 'user-agent': IPHONE });
    expect(res.headers.get('location')).toBe('https://apps.apple.com/x');
  });

  it('sends unknown slugs to the app with a 404', async () => {
    const res = await new Client().req('GET', '/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('protects links with a password', async () => {
    const c = await signedIn();
    const link = (
      await c.json('POST', '/api/v1/links', { url: 'https://secret.test/', password: 'opensesame' })
    ).body;
    expect(link.hasPassword).toBe(true);
    const res = await new Client().req('GET', `/${link.slug}`);
    expect(res.headers.get('location')).toBe(`/unlock/${link.slug}`);
    expect(
      (await new Client().json('POST', `/api/v1/public/unlock/${link.slug}`, { password: 'nope' })).status,
    ).toBe(401);
    expect(
      (await new Client().json('POST', `/api/v1/public/unlock/${link.slug}`, { password: 'opensesame' })).body
        .url,
    ).toBe('https://secret.test/');
  });

  it('closes links that reached their click limit', async () => {
    const c = await signedIn();
    const link = (await c.json('POST', '/api/v1/links', { url: 'https://example.com', maxClicks: 1 })).body;
    await new Client().req('GET', `/${link.slug}`, undefined, { 'user-agent': IPHONE });
    await new Promise((r) => setTimeout(r, 50));
    const res = await new Client().req('GET', `/${link.slug}`, undefined, { 'user-agent': IPHONE });
    expect(res.headers.get('location')).toContain('/p/unavailable?reason=limit');
  });
});

describe('qr codes, bio pages and api keys', () => {
  it('creates a dynamic QR code that points at a short link', async () => {
    const c = await signedIn();
    const r = await c.json('POST', '/api/v1/qr', { name: 'Poster', url: 'https://example.com/poster' });
    expect(r.status).toBe(201);
    expect(r.body.encodedUrl).toMatch(/^https:\/\/wrx\.test\/\w+\?r=qr$/);
    expect(r.body.design.dots).toBe('rounded');
  });

  it('publishes a bio page and counts views', async () => {
    const c = await signedIn();
    const r = await c.json('POST', '/api/v1/bio', {
      handle: 'imrane',
      title: 'Imrane',
      links: [{ label: 'Site', url: 'https://example.com' }],
    });
    expect(r.status).toBe(201);
    const pub = await new Client().json('GET', '/api/v1/public/bio/imrane');
    expect(pub.body.title).toBe('Imrane');
    expect((await c.json('POST', '/api/v1/bio', { handle: 'imrane', title: 'x' })).status).toBe(409);
  });

  it('authenticates the public API with a key that is shown once', async () => {
    const c = await signedIn();
    const key = (await c.json('POST', '/api/v1/keys', { name: 'CI' })).body;
    expect(key.secret).toMatch(/^wrx_/);
    const api = new Client({ authorization: `Bearer ${key.secret}` });
    expect((await api.json('POST', '/api/v1/links', { url: 'https://example.com/api' })).status).toBe(201);
    expect((await api.json('GET', '/api/v1/keys')).status).toBe(403);
    const list = (await c.json('GET', '/api/v1/keys')).body.items;
    expect(list[0]).not.toHaveProperty('secret');
    expect(
      (await new Client({ authorization: 'Bearer wrx_wrong' }).json('GET', '/api/v1/links')).status,
    ).toBe(401);
  });
});

describe('demo workspace', () => {
  it('seeds a realistic workspace within the free-plan query budget', async () => {
    const c = new Client();
    const r = await c.json('POST', '/api/v1/auth/demo');
    expect(r.body.isDemo).toBe(true);
    const links = (await c.json('GET', '/api/v1/links?limit=100')).body;
    expect(links.total).toBe(12);
    const stats = (await c.json('GET', '/api/v1/analytics?range=90d')).body;
    expect(stats.total).toBeGreaterThan(1500);
    expect(stats.countries[0].key).toBe('MA');
    expect((await c.json('POST', '/api/v1/keys', { name: 'x' })).status).toBe(403);
    const users = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE is_demo = 1').first<{
      n: number;
    }>();
    expect(users!.n).toBe(2);
  });
});

describe('api surface', () => {
  it('serves a valid OpenAPI document', async () => {
    const r = await new Client().json('GET', '/api/v1/openapi.json');
    expect(r.body.openapi).toBe('3.1.0');
    expect(r.body.paths['/links'].post).toBeTruthy();
  });
  it('rejects non-JSON mutations', async () => {
    const res = await new Client().req('POST', '/api/v1/auth/login', undefined, {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '3',
    });
    expect(res.status).toBe(415);
  });
});

describe('connect', () => {
  const profile = (handle: string, extra: Record<string, unknown> = {}) => ({
    handle,
    kind: 'startup',
    title: 'Rocket Labs',
    headline: 'We build rockets',
    location: 'Casablanca',
    skills: ['React'],
    openTo: ['hiring'],
    discoverable: true,
    card: { email: 'team@rocket.test', phone: '+212 600', company: 'Rocket Labs' },
    ...extra,
  });

  it('turns a profile into a downloadable business card', async () => {
    const c = await signedIn();
    await c.json('POST', '/api/v1/bio', profile('rocket'));
    const res = await new Client().req('GET', '/api/v1/public/bio/rocket/vcard');
    expect(res.headers.get('content-type')).toContain('text/vcard');
    const card = await res.text();
    expect(card).toContain('FN:Rocket Labs');
    expect(card).toContain('EMAIL;TYPE=INTERNET:team@rocket.test');
  });

  it('lists only discoverable profiles in the directory, with filters', async () => {
    const c = await signedIn();
    await c.json('POST', '/api/v1/bio', profile('visible-co'));
    await c.json('POST', '/api/v1/bio', profile('hidden-co', { discoverable: false }));
    const all = (await new Client().json('GET', '/api/v1/public/discover?q=rockets')).body.items.map(
      (p: any) => p.handle,
    );
    expect(all).toContain('visible-co');
    expect(all).not.toContain('hidden-co');
    const people = (await new Client().json('GET', '/api/v1/public/discover?kind=person&q=rockets')).body
      .items;
    expect(people).toHaveLength(0);
    expect(
      (await new Client().json('GET', '/api/v1/public/discover?q=rockets')).body.items[0],
    ).not.toHaveProperty('card');
  });

  it('publishes an opportunity and routes responses to the inbox', async () => {
    const owner = await signedIn();
    const page = (await owner.json('POST', '/api/v1/bio', profile('hiring-co'))).body;
    const opp = await owner.json('POST', '/api/v1/connect/opportunities', {
      pageId: page.id,
      type: 'job',
      title: 'Backend engineer',
      description: 'Build APIs with Node.js and PostgreSQL for our team.',
      tags: ['Node.js'],
    });
    expect(opp.status).toBe(201);
    const listed = (await new Client().json('GET', '/api/v1/public/opportunities?type=job&q=Backend')).body
      .items;
    expect(listed.some((o: any) => o.id === opp.body.id)).toBe(true);

    const visitor = new Client();
    const bad = await visitor.json('POST', '/api/v1/public/bio/hiring-co/contact', {
      intent: 'job',
      name: 'A',
      email: 'nope',
      message: 'hi',
    });
    expect(bad.status).toBe(422);
    const sent = await visitor.json('POST', '/api/v1/public/bio/hiring-co/contact', {
      intent: 'job',
      name: 'Ali Candidate',
      email: 'ali@test.dev',
      message: 'I would love to join your team!',
      opportunityId: opp.body.id,
    });
    expect(sent.status).toBe(201);

    const inbox = (await owner.json('GET', '/api/v1/connect/inbox')).body;
    expect(inbox.items[0]).toMatchObject({
      name: 'Ali Candidate',
      status: 'new',
      opportunity: { title: 'Backend engineer' },
    });
    expect(inbox.counts.new).toBe(1);
    await owner.json('PATCH', `/api/v1/connect/inbox/${inbox.items[0].id}`, { status: 'in_progress' });
    expect((await owner.json('GET', '/api/v1/connect/inbox?status=new')).body.items).toHaveLength(0);
    expect((await owner.json('GET', '/api/v1/connect/opportunities')).body.items[0].responses).toBe(1);
  });

  it('silently drops bot submissions caught by the honeypot', async () => {
    const owner = await signedIn();
    await owner.json('POST', '/api/v1/bio', profile('honey-co'));
    const r = await new Client().json('POST', '/api/v1/public/bio/honey-co/contact', {
      intent: 'other',
      name: 'Bot',
      email: 'bot@test.dev',
      message: 'Buy cheap stuff now!!!',
      website: 'x',
    });
    expect(r.status).toBe(422); // website must be empty → validation rejects, nothing stored
    expect((await owner.json('GET', '/api/v1/connect/inbox')).body.items).toHaveLength(0);
  });

  it('cannot publish on a profile you do not own', async () => {
    const a = await signedIn();
    const b = await signedIn();
    const page = (await a.json('POST', '/api/v1/bio', profile('owned-co'))).body;
    const r = await b.json('POST', '/api/v1/connect/opportunities', {
      pageId: page.id,
      type: 'job',
      title: 'Sneaky job',
      description: 'This should never be published anywhere.',
    });
    expect(r.status).toBe(404);
  });

  it('gives the demo workspace a live directory and inbox', async () => {
    const c = new Client();
    await c.json('POST', '/api/v1/auth/demo');
    expect((await c.json('GET', '/api/v1/connect/inbox')).body.items.length).toBe(5);
    expect(
      (await new Client().json('GET', '/api/v1/public/discover')).body.items.length,
    ).toBeGreaterThanOrEqual(8);
    expect(
      (await new Client().json('GET', '/api/v1/public/opportunities')).body.items.length,
    ).toBeGreaterThanOrEqual(8);
  });
});
