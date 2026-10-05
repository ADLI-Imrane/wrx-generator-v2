export type Device = 'mobile' | 'tablet' | 'desktop' | 'bot';
export interface ParsedUA { device: Device; os: string; browser: string }

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram|discord|curl|wget|python-requests|headless/i;

/** Tiny, dependency-free user-agent classifier — good enough for analytics buckets. */
export function parseUA(ua: string | null | undefined): ParsedUA {
  const s = ua ?? '';
  if (!s || BOT.test(s)) return { device: 'bot', os: 'Other', browser: 'Other' };
  const os = /iPhone|iPad|iPod/.test(s) ? 'iOS'
    : /Android/.test(s) ? 'Android'
    : /Windows/.test(s) ? 'Windows'
    : /Mac OS X|Macintosh/.test(s) ? 'macOS'
    : /CrOS/.test(s) ? 'ChromeOS'
    : /Linux/.test(s) ? 'Linux' : 'Other';
  const browser = /Edg\//.test(s) ? 'Edge'
    : /OPR\/|Opera/.test(s) ? 'Opera'
    : /SamsungBrowser/.test(s) ? 'Samsung Internet'
    : /Firefox\/|FxiOS/.test(s) ? 'Firefox'
    : /Chrome\/|CriOS/.test(s) ? 'Chrome'
    : /Safari\//.test(s) ? 'Safari' : 'Other';
  const device: Device = /iPad|Tablet/.test(s) || (/Android/.test(s) && !/Mobile/.test(s)) ? 'tablet'
    : /Mobi|iPhone|iPod|Android/.test(s) ? 'mobile' : 'desktop';
  return { device, os, browser };
}
