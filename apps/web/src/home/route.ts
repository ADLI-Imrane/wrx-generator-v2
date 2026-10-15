import type { HomeLang } from './content';

/** Returns the homepage language for a pathname, or null when the path belongs to the app. */
export function homeLangFromPath(pathname: string): HomeLang | null {
  if (pathname === '/' || pathname === '/index.html') return 'fr';
  if (pathname === '/en' || pathname === '/en/' || pathname === '/en/index.html') return 'en';
  return null;
}
