export const nf = (n: number, lang = 'en') => new Intl.NumberFormat(lang).format(n);
export const compact = (n: number, lang = 'en') =>
  new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export function relTime(iso: string, lang = 'en') {
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(Math.round(diff), 'second');
}

export const shortDate = (iso: string, lang = 'en') =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' });

export function delta(cur: number, prev: number) {
  if (!prev) return cur ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const flag = (cc?: string | null) =>
  cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐';

export const countryName = (cc: string, lang = 'en') => {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(cc) ?? cc;
  } catch {
    return cc;
  }
};
