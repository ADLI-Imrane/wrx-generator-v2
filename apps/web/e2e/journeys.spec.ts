import { expect, test } from '@playwright/test';

test('a visitor signs up, creates a link and is redirected through it', async ({ page, request }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`;
  await page.goto('/register');
  await page.getByLabel('Full name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('a-strong-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto('/app/links?new=1');
  await page.getByLabel('Destination URL').fill('https://example.com/e2e');
  const slug = `e2e-${Date.now().toString(36)}`;
  await page.getByLabel('Short name').fill(slug);
  await page.getByRole('button', { name: 'Create link' }).click();
  await expect(page.getByRole('link', { name: `/${slug}` })).toBeVisible();

  const res = await request.get(`/${slug}`, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers().location).toBe('https://example.com/e2e');
});

test('the demo shows analytics, the directory and the inbox', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the live demo' }).first().click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText('Unique visitors')).toBeVisible();
  await page.goto('/app/inbox');
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  await page.goto('/discover');
  await expect(page.getByRole('link', { name: /Studio Atlas/ })).toBeVisible();
});

test('a stranger contacts a startup from its public profile', async ({ page }) => {
  await page.request.post('/api/v1/auth/demo');
  await page.goto('/b/ouma-climate');
  await page.getByRole('button', { name: 'Get in touch' }).click();
  await page.getByLabel('Your name').fill('Visitor');
  await page.getByLabel('Your email').fill('visitor@test.dev');
  await page.getByLabel('Message').fill('I would love to talk about your CTO search.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Message sent')).toBeVisible();
});
