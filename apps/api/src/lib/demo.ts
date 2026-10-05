import { hashPassword, newId, nowIso, randomToken } from './crypto';
import type { UserRow } from './mappers';

export const DEMO_EMAIL = 'demo@wrx.app';
export const COMMUNITY_EMAIL = 'community@wrx.app';

/** Deterministic PRNG so the demo looks the same shape every night. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rnd: () => number, items: readonly (readonly [T, number])[]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) { if ((r -= w) < 0) return v; }
  return items[items.length - 1]![0];
};
const q = (s: string | null) => (s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`);

const LINKS = [
  { slug: 'spring-sale', title: 'Spring sale — landing page', url: 'https://example.com/spring-sale', tags: ['campaign', 'ecommerce'], w: 18, utm: { source: 'instagram', medium: 'social', campaign: 'spring' } },
  { slug: 'app', title: 'Mobile app — smart store link', url: 'https://example.com/app', tags: ['product'], w: 14, rules: true },
  { slug: 'talk-slides', title: 'Conference talk slides', url: 'https://example.com/slides/edge-computing', tags: ['events'], w: 9 },
  { slug: 'menu', title: 'Restaurant menu (table QR)', url: 'https://example.com/menu', tags: ['qr', 'print'], w: 12 },
  { slug: 'pricing-test', title: 'Pricing page — A/B test', url: 'https://example.com/pricing', tags: ['growth'], w: 10, ab: true },
  { slug: 'newsletter', title: 'Weekly newsletter #42', url: 'https://example.com/newsletter/42', tags: ['email'], w: 7 },
  { slug: 'careers', title: 'We are hiring — careers page', url: 'https://example.com/careers', tags: ['hr'], w: 6 },
  { slug: 'webinar', title: 'Webinar registration', url: 'https://example.com/webinar', tags: ['events', 'campaign'], w: 5, expires: 6 },
  { slug: 'press-kit', title: 'Press kit (password)', url: 'https://example.com/press', tags: ['private'], w: 2, password: true },
  { slug: 'docs', title: 'API documentation', url: 'https://example.com/docs', tags: ['product'], w: 8 },
  { slug: 'yt-launch', title: 'Launch video on YouTube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', tags: ['video'], w: 6 },
  { slug: 'feedback', title: 'Customer feedback form', url: 'https://example.com/feedback', tags: ['product'], w: 3 },
] as const;

const COUNTRIES = [['MA', 26], ['FR', 18], ['US', 12], ['ES', 6], ['DE', 6], ['GB', 5], ['BE', 4], ['CA', 4], ['AE', 3], ['SA', 2], ['NL', 2], ['IT', 2], ['SN', 2], ['TN', 2], ['DZ', 2], ['IN', 2], ['BR', 1], ['JP', 1]] as const;
const CITIES: Record<string, readonly string[]> = {
  MA: ['Casablanca', 'Rabat', 'Marrakesh', 'Tangier', 'Fes', 'Agadir'], FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille'],
  US: ['New York', 'San Francisco', 'Austin', 'Chicago'], ES: ['Madrid', 'Barcelona'], DE: ['Berlin', 'Munich'], GB: ['London', 'Manchester'],
  BE: ['Brussels'], CA: ['Montreal', 'Toronto'], AE: ['Dubai'], SA: ['Riyadh'], NL: ['Amsterdam'], IT: ['Milan'], SN: ['Dakar'], TN: ['Tunis'], DZ: ['Algiers'], IN: ['Bengaluru'], BR: ['São Paulo'], JP: ['Tokyo'],
};
const DEVICES = [['mobile', 62], ['desktop', 33], ['tablet', 5]] as const;
const MOBILE_OS = [['iOS', 48], ['Android', 52]] as const;
const DESKTOP_OS = [['Windows', 52], ['macOS', 38], ['Linux', 10]] as const;
const BROWSERS: Record<string, readonly (readonly [string, number])[]> = {
  iOS: [['Safari', 80], ['Chrome', 20]], Android: [['Chrome', 75], ['Samsung Internet', 25]],
  Windows: [['Chrome', 65], ['Edge', 25], ['Firefox', 10]], macOS: [['Safari', 45], ['Chrome', 50], ['Firefox', 5]], Linux: [['Chrome', 60], ['Firefox', 40]],
};
const REFERRERS = [[null, 34], ['instagram.com', 16], ['linkedin.com', 13], ['t.co', 6], ['google.com', 9], ['facebook.com', 7], ['youtube.com', 4], ['mail.google.com', 5], ['news.ycombinator.com', 2]] as const;


type Seed = { handle: string; kind: 'person' | 'startup' | 'company'; title: string; headline: string; bio: string; theme: string; location: string; industry: string; skills: string[]; openTo: string[]; card: Record<string, string>; links: { label: string; url: string }[] };
/** Fictional sample profiles — clearly labelled as sample data in the UI. */
const PROFILES: Seed[] = [
  { handle: 'demo', kind: 'company', title: 'Studio Atlas', headline: 'Brand & product design studio', bio: 'Independent design studio in Casablanca. We craft brand identities, websites and print for startups across North Africa.', theme: 'route', location: 'Casablanca, Morocco', industry: 'Design', skills: ['Branding', 'Web design', 'Print'], openTo: ['hiring', 'internships', 'partnerships'], card: { email: 'hello@studio-atlas.example', phone: '+212 600 000 000', website: 'https://example.com', company: 'Studio Atlas', role: 'Design studio' }, links: [{ label: 'See our latest work', url: 'https://example.com/work' }, { label: 'Book a call', url: 'https://example.com/call' }] },
  { handle: 'ouma-climate', kind: 'startup', title: 'Ouma Climate', headline: 'Carbon tracking for SMEs — pre-seed', bio: 'We help small manufacturers measure and cut their emissions with plug-and-play sensors and a simple dashboard.', theme: 'signal', location: 'Casablanca, Morocco', industry: 'Climate tech', skills: ['IoT', 'SaaS', 'Sustainability'], openTo: ['cofounder', 'investment', 'hiring'], card: { website: 'https://example.com' }, links: [{ label: 'Pitch deck', url: 'https://example.com/deck' }] },
  { handle: 'tarik-freight', kind: 'company', title: 'Tarik Freight', headline: 'Cross-border logistics, Tangier ⇄ Europe', bio: 'A 120-person logistics company modernising its tracking platform. Our tech team is growing.', theme: 'ink', location: 'Tangier, Morocco', industry: 'Logistics', skills: ['Node.js', 'React', 'GCP'], openTo: ['hiring', 'partnerships'], card: { website: 'https://example.com' }, links: [{ label: 'Careers', url: 'https://example.com/careers' }] },
  { handle: 'sahla-health', kind: 'startup', title: 'Sahla Health', headline: 'Online booking for clinics', bio: 'Patients book, clinics stop losing calls. Live in 40 clinics, looking for partners and interns.', theme: 'paper', location: 'Rabat, Morocco', industry: 'Health tech', skills: ['Flutter', 'NestJS', 'PostgreSQL'], openTo: ['internships', 'partnerships'], card: {}, links: [{ label: 'Website', url: 'https://example.com' }] },
  { handle: 'yasmine-b', kind: 'person', title: 'Yasmine B.', headline: 'Full-stack developer · React, Node.js', bio: 'Three years building SaaS dashboards. Looking for a product team that ships every week.', theme: 'ink', location: 'Casablanca, Morocco', industry: 'Software', skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'], openTo: ['jobs', 'freelance'], card: { role: 'Full-stack developer' }, links: [{ label: 'GitHub', url: 'https://github.com' }] },
  { handle: 'karim-data', kind: 'person', title: 'Karim A.', headline: 'Data engineer · Spark, dbt, BigQuery', bio: 'I turn messy data into reliable pipelines. Open to freelance missions and full-time roles.', theme: 'route', location: 'Marrakesh, Morocco', industry: 'Data', skills: ['Python', 'dbt', 'BigQuery', 'Airflow'], openTo: ['jobs', 'freelance', 'mentoring'], card: { role: 'Data engineer' }, links: [] },
  { handle: 'sara-m', kind: 'person', title: 'Sara M.', headline: 'Product designer · design systems', bio: 'Product designer who loves design systems and accessibility. I mentor junior designers on weekends.', theme: 'paper', location: 'Paris, France', industry: 'Design', skills: ['Figma', 'Design systems', 'UX research'], openTo: ['freelance', 'mentoring'], card: { role: 'Product designer' }, links: [{ label: 'Portfolio', url: 'https://example.com' }] },
  { handle: 'atlas-angels', kind: 'company', title: 'Atlas Angels', headline: 'Angel network for North African founders', bio: 'Forty operators and angels backing pre-seed teams with tickets from 25k to 150k €.', theme: 'signal', location: 'Rabat, Morocco', industry: 'Investment', skills: ['Pre-seed', 'Mentoring'], openTo: ['investment', 'mentoring'], card: {}, links: [{ label: 'Apply for funding', url: 'https://example.com/apply' }] },
];
const OPPORTUNITIES = [
  { handle: 'demo', type: 'job', title: 'Junior front-end developer (React)', location: 'Casablanca', remote: false, tags: ['React', 'TypeScript', 'Junior'], description: 'Join a five-person studio and build fast, accessible websites for our clients. You will work with designers from the first sketch to launch. Six months of React experience is enough if you can show us something you shipped.' },
  { handle: 'demo', type: 'internship', title: 'Brand design internship — 6 months', location: 'Casablanca', remote: false, tags: ['Branding', 'Figma'], description: 'A paid end-of-studies internship on real client projects: logos, visual identities and campaign assets, with a senior designer reviewing your work every day.' },
  { handle: 'ouma-climate', type: 'cofounder', title: 'Technical co-founder (CTO)', location: 'Casablanca', remote: true, tags: ['IoT', 'Equity'], description: 'We have 6 paying pilots and a working prototype. We are looking for a technical co-founder to own the platform: sensor ingestion, the dashboard and the team you will hire.' },
  { handle: 'ouma-climate', type: 'investment', title: 'Pre-seed round — 300k €', location: 'Morocco', remote: true, tags: ['Climate', 'Pre-seed'], description: 'Raising 300k € to scale from 6 to 40 industrial customers in 18 months. Deck and data room available on request.' },
  { handle: 'tarik-freight', type: 'job', title: 'Backend engineer (Node.js, GCP)', location: 'Tangier', remote: true, tags: ['Node.js', 'GCP', 'PostgreSQL'], description: 'Rebuild our shipment-tracking platform on Google Cloud. You will design APIs, event pipelines and the monitoring around them, with a lot of ownership.' },
  { handle: 'sahla-health', type: 'internship', title: 'Flutter mobile internship (PFE)', location: 'Rabat', remote: false, tags: ['Flutter', 'Mobile'], description: 'End-of-studies internship on our patient app used in 40 clinics: appointment reminders, payments and offline mode.' },
  { handle: 'sahla-health', type: 'partnership', title: 'Partner clinics & insurers', location: 'Morocco', remote: true, tags: ['Health', 'B2B'], description: 'We are looking for clinic groups and insurers who want to pilot online booking and digital follow-up with their patients.' },
  { handle: 'atlas-angels', type: 'investment', title: 'Open call: pre-seed startups in North Africa', location: 'North Africa', remote: true, tags: ['Pre-seed', 'Angels'], description: 'We review applications every month. We back teams with a working product and early customers, in any sector, from 25k to 150k €.' },
] as const;
const INBOX: { intent: string; name: string; email: string; company?: string; profile?: string; message: string; status: string; forJob?: boolean }[] = [
  { intent: 'job', name: 'Yasmine B.', email: 'yasmine@example.com', profile: 'https://example.com', message: 'Hi! I just saw your junior front-end role. I build React apps daily and would love to show you a dashboard I shipped last month.', status: 'new', forJob: true },
  { intent: 'partnership', name: 'Omar T.', email: 'omar@example.com', company: 'Ouma Climate', message: 'We are preparing our seed rebrand and loved your work for local startups. Could we talk about a full identity package?', status: 'new' },
  { intent: 'hiring', name: 'Lina K.', email: 'lina@example.com', company: 'Tarik Freight', message: 'Our product team needs a design partner for a 3-month tracking app redesign. Are you open to a retainer?', status: 'in_progress' },
  { intent: 'job', name: 'Mehdi R.', email: 'mehdi@example.com', message: 'Final-year student, I would like to apply for the brand design internship. My portfolio is linked below.', status: 'new', profile: 'https://example.com' },
  { intent: 'collaboration', name: 'Sara M.', email: 'sara@example.com', message: 'Would you like to co-host a design-systems workshop in Casablanca next month?', status: 'closed' },
];

/**
 * Creates (or rebuilds) the public demo workspace. Free-plan Workers allow 50 D1 queries per
 * invocation, so clicks are written as a few large multi-row INSERTs (~25 queries in total).
 */
export async function ensureDemoWorkspace(db: D1Database, force = false): Promise<UserRow> {
  const existing = await db.prepare('SELECT * FROM users WHERE email = ?').bind(DEMO_EMAIL).first<UserRow>();
  const fresh = existing && Date.parse(existing.created_at) > Date.now() - 26 * 3600e3;
  if (existing && fresh && !force) return existing;
  await db.prepare('DELETE FROM users WHERE email IN (?, ?)').bind(DEMO_EMAIL, COMMUNITY_EMAIL).run();

  const now = Date.now();
  const userId = newId('usr');
  const rnd = mulberry32(42);
  const stmts: D1PreparedStatement[] = [
    db.prepare('INSERT INTO users (id, email, name, password_hash, plan, is_demo, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
      .bind(userId, DEMO_EMAIL, 'Demo workspace', `disabled$${randomToken(8)}`, 'pro', nowIso()),
  ];
  const pressHash = await hashPassword('wrx-demo');
  const linkIds: string[] = [];
  for (const [i, l] of LINKS.entries()) {
    const id = newId('lnk');
    linkIds.push(id);
    const created = new Date(now - (95 - i * 4) * 864e5).toISOString();
    const rules = 'rules' in l ? [{ type: 'device', devices: ['ios'], url: 'https://apps.apple.com/app/id000000' }, { type: 'device', devices: ['android'], url: 'https://play.google.com/store/apps/details?id=app.wrx.demo' }] : [];
    const variants = 'ab' in l ? [{ url: 'https://example.com/pricing-b', weight: 50 }] : [];
    const expires = 'expires' in l ? new Date(now + l.expires * 864e5).toISOString() : null;
    stmts.push(db.prepare(
      `INSERT INTO links (id, user_id, slug, url, title, tags, expires_at, password_hash, utm, rules, variants, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, userId, `demo-${l.slug}`, l.url, l.title, JSON.stringify(l.tags), expires, 'password' in l ? pressHash : null,
      'utm' in l ? JSON.stringify(l.utm) : null, JSON.stringify(rules), JSON.stringify(variants), created, created));
  }
  stmts.push(
    db.prepare('INSERT INTO qr_codes (id, user_id, link_id, name, design, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(newId('qr'), userId, linkIds[3], 'Table tent — menu',
      JSON.stringify({ fg: '#14213D', bg: '#FFFFFF', gradient: { to: '#3A5BFF', rotation: 45 }, dots: 'rounded', corners: 'extra-rounded', frame: 'ticket', frameText: 'Scan the menu', margin: 12 }), nowIso()),
    db.prepare('INSERT INTO qr_codes (id, user_id, link_id, name, design, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(newId('qr'), userId, linkIds[0], 'Shop window poster',
      JSON.stringify({ fg: '#0E1B33', bg: '#FFF7DB', dots: 'dots', corners: 'dot', frame: 'label', frameText: 'Spring sale', margin: 12 }), nowIso()),
  );

  // ---- Connect: the demo studio's own profile + a small community so the directory is alive ----
  const communityId = newId('usr');
  stmts.push(db.prepare('INSERT INTO users (id, email, name, password_hash, is_demo, created_at) VALUES (?, ?, ?, ?, 1, ?)')
    .bind(communityId, COMMUNITY_EMAIL, 'Sample community', `disabled$${randomToken(8)}`, nowIso()));
  const iso = (daysAgo: number) => new Date(now - daysAgo * 864e5).toISOString();
  const profiles = PROFILES.map((p, i) => ({ ...p, id: newId('bio'), owner: i === 0 ? userId : communityId }));
  stmts.push(db.prepare(`INSERT INTO bio_pages (id, user_id, handle, kind, title, headline, bio, theme, location, industry, skills, open_to, discoverable, card, links, views, created_at, updated_at) VALUES ${
    profiles.map((p, i) => `(${[p.id, p.owner, p.handle, p.kind, p.title, p.headline, p.bio, p.theme, p.location, p.industry, JSON.stringify(p.skills), JSON.stringify(p.openTo)].map(q).join(',')},1,${q(JSON.stringify(p.card))},${q(JSON.stringify(p.links))},${400 + i * 137},${q(iso(60 - i * 3))},${q(iso(i))})`).join(',')}`));
  const byHandle = new Map(profiles.map((p) => [p.handle, p]));
  const opps = OPPORTUNITIES.map((o, i) => ({ ...o, id: newId('opp'), page: byHandle.get(o.handle)!, age: i * 2 + 1 }));
  stmts.push(db.prepare(`INSERT INTO opportunities (id, user_id, page_id, type, title, location, remote, description, tags, views, created_at, updated_at) VALUES ${
    opps.map((o) => `(${[o.id, o.page.owner, o.page.id, o.type, o.title, o.location].map(q).join(',')},${o.remote ? 1 : 0},${q(o.description)},${q(JSON.stringify(o.tags))},${60 + o.age * 23},${q(iso(o.age))},${q(iso(o.age))})`).join(',')}`));
  const studio = profiles[0]!;
  const job = opps.find((o) => o.page === studio)!;
  stmts.push(db.prepare(`INSERT INTO contact_requests (id, user_id, page_id, opportunity_id, intent, from_name, from_email, from_company, from_profile, message, status, created_at) VALUES ${
    INBOX.map((r, i) => `(${[newId('req'), userId, studio.id, r.forJob ? job.id : null, r.intent, r.name, r.email, r.company ?? null, r.profile ?? null, r.message, r.status, iso(i * 0.7 + 0.1)].map((v) => (typeof v === 'string' || v === null ? q(v) : v)).join(',')})`).join(',')}`));

  // ~2,600 clicks over 90 days with a weekday rhythm and a campaign spike 12 days ago.
  const rows: string[] = [];
  const counts = new Map<string, number>();
  for (let day = 89; day >= 0; day--) {
    const date = new Date(now - day * 864e5);
    const weekday = [0.6, 1.1, 1.2, 1.15, 1.1, 1.0, 0.7][date.getUTCDay()]!;
    const spike = day >= 10 && day <= 13 ? 2.4 : 1;
    const growth = 0.55 + (90 - day) / 140;
    const n = Math.round(22 * weekday * spike * growth * (0.8 + rnd() * 0.4));
    for (let k = 0; k < n; k++) {
      const li = pick(rnd, LINKS.map((l, i) => [i, l.w] as const));
      const country = pick(rnd, COUNTRIES);
      const cities = CITIES[country] ?? ['—'];
      const device = pick(rnd, DEVICES);
      const os = device === 'desktop' ? pick(rnd, DESKTOP_OS) : pick(rnd, MOBILE_OS);
      const browser = pick(rnd, BROWSERS[os]!);
      const referrer = pick(rnd, REFERRERS);
      const source = li === 3 || (li === 0 && rnd() < 0.3) ? 'qr' : referrer ? 'referral' : 'direct';
      const hour = Math.min(23, Math.floor(8 + rnd() * 15));
      const ts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, Math.floor(rnd() * 60));
      if (ts > now) continue;
      const id = linkIds[li]!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
      rows.push(`(${q(id)},${q(userId)},${ts},${q(country)},${q(cities[Math.floor(rnd() * cities.length)]!)},${q(device)},${q(os)},${q(browser)},${q(source === 'qr' ? null : referrer)},${q(source)},${q(Math.floor(rnd() * 1e9).toString(36))})`);
    }
  }
  for (let i = 0; i < rows.length; i += 180) {
    stmts.push(db.prepare(`INSERT INTO clicks (link_id, user_id, ts, country, city, device, os, browser, referrer, source, visitor) VALUES ${rows.slice(i, i + 180).join(',')}`));
  }
  stmts.push(db.prepare(`UPDATE links SET clicks = CASE id ${[...counts].map(([id, n]) => `WHEN ${q(id)} THEN ${n}`).join(' ')} ELSE clicks END WHERE user_id = ?`).bind(userId));
  await db.batch(stmts);
  return (await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>())!;
}
