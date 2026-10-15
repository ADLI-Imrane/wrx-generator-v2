import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/schibsted-grotesk/wght.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './home.css';
import { HomePage } from './HomePage';
import { homeCopy } from './content';
import type { HomeLang } from './content';

export function mountHome(container: HTMLElement, lang: HomeLang) {
  const copy = homeCopy[lang];
  const root = document.documentElement;
  root.lang = lang;
  document.title = copy.meta.title;

  const app = (
    <StrictMode>
      <HomePage copy={copy} />
    </StrictMode>
  );

  const prerendered = container.querySelector('[data-home]');
  if (prerendered && prerendered.getAttribute('lang') === lang) {
    hydrateRoot(container, app);
  } else {
    container.replaceChildren();
    createRoot(container).render(app);
  }

  // Scroll choreography is decoration: load it after the page is interactive.
  const start = () =>
    import('./motion/scroll').then(({ setupScroll }) => {
      const page = container.querySelector<HTMLElement>('[data-home]');
      if (page) setupScroll(page);
      root.setAttribute('data-home-ready', '');
    });
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void start(), { timeout: 1200 });
  } else {
    setTimeout(() => void start(), 200);
  }
}
