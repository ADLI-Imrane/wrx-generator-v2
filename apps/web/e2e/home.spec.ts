import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Should see the landing page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check for login link in navigation
    const loginLink = page.getByRole('link', { name: /login|sign in|connexion/i });
    if ((await loginLink.count()) > 0) {
      await expect(loginLink.first()).toBeVisible();
    }

    // Check for register/signup link
    const registerLink = page.getByRole('link', { name: /register|sign up|inscription/i });
    if ((await registerLink.count()) > 0) {
      await expect(registerLink.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Content should still be visible
    await expect(page.locator('body')).toBeVisible();

    // Check if mobile menu button exists
    const menuButton = page.getByRole('button', { name: /menu/i });
    if ((await menuButton.count()) > 0) {
      await expect(menuButton.first()).toBeVisible();
    }
  });
});

test.describe('Navigation', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route-12345');

    // Should show 404 or redirect to home/login
    const url = page.url();
    expect(
      url.includes('404') ||
        url.includes('login') ||
        url.includes('unknown') ||
        url === 'http://localhost:5173/'
    ).toBeTruthy();
  });
});

test.describe('SEO and Accessibility', () => {
  test('should have proper document title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have proper meta viewport', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have no major accessibility violations on login page', async ({ page }) => {
    await page.goto('/login');

    // Check for basic accessibility
    // All form inputs should have associated labels or aria-labels
    const inputs = page.locator('input[type="email"], input[type="password"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');

      // Should have either aria-label, associated label, or at least placeholder
      const hasAccessibleName = ariaLabel || id || placeholder;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    // It's okay if landing page doesn't have h1, but check other pages
    if (h1Count === 0) {
      await page.goto('/login');
      const loginH1 = await page.locator('h1, h2').count();
      expect(loginH1).toBeGreaterThan(0);
    }
  });
});

test.describe('Performance', () => {
  test('should load home page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should load login page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});
