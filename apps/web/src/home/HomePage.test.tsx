import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { HomePage } from './HomePage';
import { homeCopy } from './content';
import type { HomeLang } from './content';
import { homeLangFromPath } from './route';
import { normaliseDestination, sampleSeries } from './lib';
import { renderHome } from './entry-server';

const langs: HomeLang[] = ['fr', 'en'];

describe('homepage', () => {
  it.each(langs)('renders one h1 and a sensible heading order (%s)', (lang) => {
    const { container } = render(<HomePage copy={homeCopy[lang]} />);
    const headings = Array.from(container.querySelectorAll('h1, h2, h3')).map((h) =>
      Number(h.tagName[1])
    );
    expect(headings.filter((level) => level === 1)).toHaveLength(1);
    expect(headings[0]).toBe(1);
    headings.slice(1).forEach((level, index) => {
      // Never jump more than one level deeper than the previous heading.
      expect(level - headings[index]!).toBeLessThanOrEqual(1);
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      homeCopy[lang].hero.title.join('')
    );
  });

  it.each(langs)('keeps a single primary call to action, repeated only in the nav (%s)', (lang) => {
    const { container } = render(<HomePage copy={homeCopy[lang]} />);
    const ctas = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/register');
    expect(ctas).toHaveLength(2);
    const header = container.querySelector<HTMLElement>('[data-header]')!;
    expect(
      within(header)
        .getAllByRole('link')
        .filter((l) => l.getAttribute('href') === '/register')
    ).toHaveLength(1);
  });

  it('links each language to the other and to the app routes', () => {
    render(<HomePage copy={homeCopy.fr} />);
    expect(screen.getAllByRole('link', { name: homeCopy.fr.nav.switchLabel })[0]).toHaveAttribute(
      'href',
      '/en/'
    );
    expect(screen.getAllByRole('link', { name: homeCopy.fr.nav.login })[0]).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('labels illustrative data and does not render an empty proof section', () => {
    const { container } = render(<HomePage copy={homeCopy.fr} />);
    expect(screen.getAllByText(homeCopy.fr.sample).length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('.h-proof')).toBeNull();
  });

  it('has a skip link that targets the main content', () => {
    const { container } = render(<HomePage copy={homeCopy.en} />);
    expect(screen.getByRole('link', { name: homeCopy.en.nav.skip })).toHaveAttribute(
      'href',
      '#contenu'
    );
    expect(container.querySelector('main#contenu')).not.toBeNull();
  });

  it.each(langs)('prerenders the headline for %s', (lang) => {
    const { html, meta } = renderHome(lang);
    expect(html).toContain('<h1');
    expect(html).toContain(homeCopy[lang].hero.title[0]);
    expect(html).toContain(`lang="${lang}"`);
    expect(meta.title).toBe(homeCopy[lang].meta.title);
  });

  it('renders identically on the server and the client for hydration', () => {
    const server = renderToString(<HomePage copy={homeCopy.fr} />);
    expect(server).toContain('data-home');
    expect(server).not.toContain('Math.random');
  });
});

describe('try-it QR generator', () => {
  it('rejects unsafe or malformed destinations', () => {
    expect(normaliseDestination('javascript:alert(1)')).toBeNull();
    expect(normaliseDestination('https://user:pass@example.com')).toBeNull();
    expect(normaliseDestination('ftp://example.com')).toBeNull();
    expect(normaliseDestination('not a url')).toBeNull();
    expect(normaliseDestination(`https://example.com/${'a'.repeat(600)}`)).toBeNull();
    expect(normaliseDestination('  https://example.com/menu  ')).toBe('https://example.com/menu');
  });

  it('shows an error for an invalid address and encodes a valid one', async () => {
    const user = userEvent.setup();
    render(<HomePage copy={homeCopy.fr} />);
    const input = screen.getByLabelText(homeCopy.fr.tryIt.label);
    await user.type(input, 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: homeCopy.fr.tryIt.generate }));
    expect(screen.getByRole('alert')).toHaveTextContent(homeCopy.fr.tryIt.invalid);

    await user.clear(input);
    await user.type(input, 'https://example.com/menu?source=wrx');
    await user.click(screen.getByRole('button', { name: homeCopy.fr.tryIt.generate }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      screen.getByText('https://example.com/menu?source=wrx', { selector: 'code' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: `${homeCopy.fr.tryIt.qrAlt} https://example.com/menu?source=wrx`,
      })
    ).toBeInTheDocument();
  });

  it('switches the QR ink', async () => {
    const user = userEvent.setup();
    render(<HomePage copy={homeCopy.en} />);
    const blue = screen.getByRole('button', { name: homeCopy.en.tryIt.inks[1] });
    await user.click(blue);
    expect(blue).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('helpers', () => {
  it('routes only the homepage paths to the homepage', () => {
    expect(homeLangFromPath('/')).toBe('fr');
    expect(homeLangFromPath('/en')).toBe('en');
    expect(homeLangFromPath('/en/')).toBe('en');
    expect(homeLangFromPath('/login')).toBeNull();
    expect(homeLangFromPath('/dashboard')).toBeNull();
    expect(homeLangFromPath('/c/abc')).toBeNull();
  });

  it('produces deterministic sample analytics', () => {
    expect(sampleSeries(30)).toEqual(sampleSeries(30));
    expect(sampleSeries(7).clicks).toHaveLength(7);
  });
});
