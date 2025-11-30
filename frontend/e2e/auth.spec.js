import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Tests
 * Tests for user registration, login, logout, and token refresh
 */

test.describe('Authentication Flows', () => {
  const testUser = {
    username: `e2e_test_${Date.now()}`,
    email: `e2e_test_${Date.now()}@example.com`,
    password: 'SecurePass123!',
  };

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Should see welcome message or username
    await expect(page.locator('text=' + testUser.username)).toBeVisible({ timeout: 5000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=' + testUser.username)).toBeVisible();
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"]', 'invalid_user_123');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid credentials|Identifiants invalides/i')).toBeVisible({
      timeout: 5000,
    });

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Logout
    await page.click('button[aria-label="Account menu"], button:has-text("Logout"), a:has-text("Déconnexion")');

    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(login|home)?$/, { timeout: 5000 });

    // Token should be cleared - verify by trying to access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=' + testUser.username)).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should validate password requirements on registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak'); // Too weak
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');

    // Should show password strength error
    await expect(
      page.locator('text=/Password.*strong|Mot de passe.*fort|at least 8 characters/i')
    ).toBeVisible();
  });

  test('should validate email format on registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'invalid-email'); // Invalid format
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should show email validation error
    await expect(page.locator('text=/Invalid email|Email invalide/i')).toBeVisible();
  });
});
