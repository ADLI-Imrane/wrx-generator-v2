import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests run against the real Worker (wrangler dev) serving the built app. */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8787', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command:
          'pnpm --filter @wrx/api exec wrangler d1 migrations apply wrx --local && pnpm --filter @wrx/api dev',
        url: 'http://localhost:8787/api/v1/health',
        reuseExistingServer: true,
        timeout: 120_000,
        cwd: '../..',
      },
});
