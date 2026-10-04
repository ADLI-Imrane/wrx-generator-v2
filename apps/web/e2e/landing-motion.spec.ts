import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('workbench validates URLs, updates QR, copies the same destination and downloads SVG', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const input = page.getByLabel('Votre destination', { exact: true });
  await expect(input).toBeVisible();
  const originalQr = await page.locator('.pass-code svg').innerHTML();
  await input.fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Générer mon QR' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await page.locator('.pass-code svg').innerHTML()).toBe(originalQr);
  const destination = 'https://example.com/menu?source=wrx';
  await input.fill(destination);
  await page.getByRole('button', { name: 'Générer mon QR' }).click();
  await expect(page.getByRole('status')).toContainText('Votre QR est prêt');
  expect(await page.locator('.pass-code svg').innerHTML()).not.toBe(originalQr);
  await page.getByLabel('Une courte invitation').fill('Découvrez notre menu');
  await expect(page.locator('.pass-invitation')).toContainText('Découvrez notre menu');
  await page.getByRole('button', { name: 'Palette Corail' }).click();
  await expect(page.getByRole('button', { name: 'Palette Corail' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Retourner le QR', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.qr-pass-back')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.qr-pass-back p')).toHaveText(destination);
  await page.getByRole('button', { name: 'Copier la destination' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(destination);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le QR' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('wrx-qr.svg');
  const contents = await readFile((await download.path())!, 'utf8');
  expect(contents).toContain('<svg');
  expect(contents).toContain('#fa714f');
  expect(errors).toEqual([]);
});

test('desktop journey reaches all scenes, releases and cleans up on navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  const start = await page
    .locator('.pin-spacer')
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  for (const [index, selector] of ['.panel-paper', '.panel-route', '.panel-signal'].entries()) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      start + 1440 * index
    );
    await expect
      .poll(async () => Math.abs((await page.locator(selector).boundingBox())!.x))
      .toBeLessThan(3);
  }
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), start + 2880 + 950);
  await expect(page.locator('.workspace-section h2')).toBeInViewport();
  await page.goto('/login');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
});

for (const width of [390, 768]) {
  test(`layout at ${width}px exposes the complete story without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.locator('.destination-workbench')).toBeVisible();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    for (const panel of await page.locator('.journey-panel').all()) {
      expect((await panel.boundingBox())?.width).toBe(width);
    }
  });
}

test('reduced motion keeps all content and QR flip usable without pinning', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.journey-track')).toHaveCSS('display', 'block');
  await page.getByRole('button', { name: 'Retourner le QR', exact: true }).click();
  await expect(page.locator('.qr-pass-back')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.qr-pass-inner')).toHaveCSS('transition-duration', '0s');
});
