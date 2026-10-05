const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Cloudflare Workers cap PBKDF2 at 100k iterations.
const ITERATIONS = 100_000;

/** PBKDF2-SHA256 password hash, encoded as `pbkdf2$<iter>$<salt>$<hash>`. */
export async function hashPassword(password: string, iterations = ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, iterations);
  return `pbkdf2$${iterations}$${b64(salt)}$${b64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iter || !salt || !hash) return false;
  const bits = new Uint8Array(await derive(password, unb64(salt), Number(iter)));
  return timingSafeEqual(bits, unb64(hash));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function sha256Hex(input: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** URL-safe random token. */
export function randomToken(bytes = 24) {
  return b64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const newId = (prefix: string) => `${prefix}_${randomToken(12)}`;
export const nowIso = () => new Date().toISOString();
