import { test as base, expect } from '@playwright/test';

/**
 * E2E Test Fixtures
 * Custom fixtures for WRX Generator testing
 */

export interface TestFixtures {
  /** Navigate to login page and wait for it to load */
  loginPage: void;
  /** Navigate to dashboard and wait for it to load */
  dashboardPage: void;
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await use();
  },

  dashboardPage: async ({ page }, use) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await use();
  },
});

export { expect };

/**
 * Mock Supabase auth for E2E tests
 */
export async function mockSupabaseAuth(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Date.now() + 3600 * 1000,
      user: mockUser,
    };

    localStorage.setItem(
      'sb-auth-token',
      JSON.stringify({
        currentSession: mockSession,
        expiresAt: mockSession.expires_at,
      })
    );
  });
}

/**
 * Clear auth state
 */
export async function clearAuth(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: import('@playwright/test').Page,
  urlPattern: string | RegExp
) {
  return page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) && response.status() === 200
  );
}
