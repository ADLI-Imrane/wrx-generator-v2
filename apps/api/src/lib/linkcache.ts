/**
 * Hot path cache for redirects, built on the per-colo Cache API (free, no KV write quota).
 * Entries live 60 s; edits purge the local colo immediately and other colos expire quickly.
 */
const key = (origin: string, slug: string) => new Request(`${origin}/__link-cache/${encodeURIComponent(slug)}`);

export async function cacheGet<T>(origin: string, slug: string): Promise<T | null> {
  const hit = await caches.default.match(key(origin, slug));
  return hit ? ((await hit.json()) as T) : null;
}
export async function cachePut(origin: string, slug: string, value: unknown) {
  await caches.default.put(key(origin, slug), new Response(JSON.stringify(value), { headers: { 'Cache-Control': 'max-age=60' } }));
}
export async function cachePurge(origin: string, slug: string) {
  await caches.default.delete(key(origin, slug));
}
