/** Paths owned by the app itself — they can never be used as a short-link slug. */
export const RESERVED_SLUGS = new Set([
  'api', 'app', 'assets', 'b', 'docs', 'login', 'register', 'signup', 'logout', 'demo', 'settings',
  'admin', 'static', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'p', 'unlock',
  'health', 'openapi.json', 'privacy', 'terms', 'pricing', 'about',
]);

export const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,48}[a-zA-Z0-9]$/;

const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/l/I

/** Random, unambiguous slug (Crockford-like alphabet). 6 chars ≈ 3.2e10 combinations. */
export function randomSlug(length = 6, rand: (n: number) => Uint8Array = defaultRandom): string {
  const bytes = rand(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

function defaultRandom(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function isValidCustomSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Appends UTM parameters to a destination URL without clobbering existing query params. */
export function withUtm(url: string, utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>> | null) {
  if (!utm) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(utm)) if (v) u.searchParams.set(`utm_${k}`, v);
  return u.toString();
}
