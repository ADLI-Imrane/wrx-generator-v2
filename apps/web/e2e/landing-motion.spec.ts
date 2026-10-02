import { test, expect } from '@playwright/test';

test('desktop scroll moves all three scenes and releases the page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  const start = await page
    .locator('.pin-spacer')
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  for (const [index, selector] of ['.panel-link', '.panel-brand', '.panel-impact'].entries()) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      start + 1440 * index
    );
    await expect
      .poll(async () => Math.abs((await page.locator(selector).boundingBox())!.x))
      .toBeLessThan(3);
  }
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), start + 1440);
  await page.getByRole('button', { name: 'Palette Lavande' }).click();
  await expect(page.getByRole('button', { name: 'Palette Lavande' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.locator('.brand-composition .scan-ticket')).toHaveCSS(
    'background-color',
    'rgb(201, 185, 255)'
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    start + 1440 * 2 + 950
  );
  await expect(page.getByRole('heading', { name: 'De petites portes. Partout.' })).toBeInViewport();
  await page.goto('/login');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
});

test('mobile displays every scene without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  for (const panel of await page.locator('.journey-panel').all()) {
    await panel.scrollIntoViewIfNeeded();
    const box = await panel.boundingBox();
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(390);
  }
});

test('reduced motion exposes the complete story without pinning', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.journey-track')).toHaveCSS('display', 'block');
  await expect(page.locator('.wrx-ticker > div')).toHaveCSS('animation-name', 'none');
});
