import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';

/** Dev serves a client-rendered page; wait until the homepage and its scroll setup are ready. */
async function ready(page: Page) {
  await page.waitForSelector('html[data-home-ready]', { state: 'attached', timeout: 15000 });
}

const widths = [390, 768, 1024, 1440];

for (const width of widths) {
  test(`no horizontal overflow and a visible headline at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await ready(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // Scroll the whole page down and back up; nothing should throw and the footer must be reachable.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    await expect(page.locator('.h-wordmark')).toBeInViewport({ ratio: 0.1 });
    for (let y = height; y > 0; y -= 900) await page.evaluate((top) => window.scrollTo(0, top), y);
    expect(errors).toEqual([]);
  });
}

test('touch targets are at least 44px on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.h a, .h button')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('h-skip'))
      .map((el) => ({ text: el.textContent?.trim(), h: el.getBoundingClientRect().height }))
      .filter((item) => item.h < 44)
  );
  expect(small).toEqual([]);
});

test('reduced motion: no pinning, everything visible', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForTimeout(2500);
  expect(await page.locator('.pin-spacer').count()).toBe(0);
  const hidden = await page.$$eval(
    '[data-reveal], [data-split], [data-settle]',
    (els) => els.filter((el) => getComputedStyle(el).opacity === '0').length
  );
  expect(hidden).toBe(0);
  await context.close();
});

test('the mechanism tabs move the horizontal chapter to their step', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await ready(page);
  await page.locator('#mecanisme').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.getByRole('link', { name: /Suivre/ }).click();
  await page.waitForTimeout(2200);
  await expect(page.locator('#etape-4')).toBeInViewport({ ratio: 0.6 });
  await expect(page.locator('[data-mech-tab="3"]')).toHaveAttribute('aria-current', 'step');
});

test('try-it generates and downloads the QR for a valid address only', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Votre adresse');
  await input.fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Générer' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await input.fill('https://example.com/menu?source=wrx');
  await page.getByRole('button', { name: 'Générer' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le SVG' }).click();
  const file = await (await download).path();
  const svg = await readFile(file!, 'utf8');
  expect(svg).toContain('<svg');
});

test('the English homepage is served at /en/', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Print once.Redirect later.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('app routes do not show the homepage', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('[data-home]')).toHaveCount(0);
});
