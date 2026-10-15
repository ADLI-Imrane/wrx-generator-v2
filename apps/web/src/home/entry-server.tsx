import { renderToString } from 'react-dom/server';
import { HomePage } from './HomePage';
import { homeCopy } from './content';
import type { HomeLang } from './content';

/** Used at build time to prerender the homepage into dist/index.html and dist/en/index.html. */
export function renderHome(lang: HomeLang) {
  const copy = homeCopy[lang];
  return { html: renderToString(<HomePage copy={copy} />), meta: copy.meta };
}
