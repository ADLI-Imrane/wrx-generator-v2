/** Locale-aware percentage (French uses a non-breaking space before %). */
export function pct(lang: 'fr' | 'en', value: number) {
  return lang === 'fr' ? `${value}\u00a0%` : `${value}%`;
}

/** Accepts only http(s) URLs without embedded credentials, bounded in size. */
export function normaliseDestination(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 512) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (!url.hostname || url.username || url.password) return null;
    if (new TextEncoder().encode(url.href).length > 1200) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Deterministic sample series (identical on server and client, so hydration matches). */
export function sampleSeries(days: number) {
  const clicks: number[] = [];
  const scans: number[] = [];
  for (let d = 0; d < days; d += 1) {
    const wave = Math.sin(d / 2.3) * 0.5 + Math.sin(d / 6.1 + 1) * 0.35;
    const weekend = d % 7 === 5 || d % 7 === 6 ? 1.35 : 1;
    clicks.push(Math.round((22 + wave * 9 + (d % 5)) * weekend));
    scans.push(Math.round((11 + Math.cos(d / 3.1) * 5 + (d % 3)) * weekend));
  }
  return { clicks, scans };
}
