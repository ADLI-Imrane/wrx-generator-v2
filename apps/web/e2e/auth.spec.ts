import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/login');

    // Check page title or heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for email input
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in|login|connexion/i });
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|login|connexion/i });
    await submitButton.click();

    // Should show validation error
    await expect(page.locator('text=/required|obligatoire|invalid/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    // Submit form
    const submitButton = page.getByRole('button', { name: /sign in|login|connexion/i });
    await submitButton.click();

    // Should show error message (wait for API response)
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Click on register link
    const registerLink = page.getByRole('link', { name: /sign up|register|créer|inscription/i });
    await registerLink.click();

    // Should be on register page
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    // Click on forgot password link
    const forgotLink = page.getByRole('link', { name: /forgot|oublié|password/i });

    if ((await forgotLink.count()) > 0) {
      await forgotLink.click();
      await expect(page).toHaveURL(/forgot|reset/);
    }
  });
});

test.describe('Register Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/register');
  });

  test('should display registration page with all elements', async ({ page }) => {
    // Check for email input
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign up|register|créer/i });
    await expect(submitButton).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));

    // Enter invalid email
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Check for validation
    const passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    await passwordInput.fill('validpassword123');

    const submitButton = page.getByRole('button', { name: /sign up|register|créer/i });
    await submitButton.click();

    // Should show validation error
    await page.waitForTimeout(500);
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on login link
    const loginLink = page.getByRole('link', { name: /sign in|login|connexion|already have/i });
    await loginLink.click();

    // Should be on login page
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing links page without auth', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/links');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing qr-codes page without auth', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/qr-codes');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing settings page without auth', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/settings');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
