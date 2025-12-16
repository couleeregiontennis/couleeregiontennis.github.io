import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Hide floating elements for mobile tests
    await page.addStyleTag({ content: '.umpire-trigger { display: none !important; }' });
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome back to LTTA/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel('Password', { exact: true });
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await passwordInput.fill('secret123');

    // Click Show
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click Hide
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should toggle to sign up mode', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(page.getByRole('heading', { name: /Create your LTTA account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('should validate empty fields', async ({ page }) => {
    // HTML5 validation usually prevents submission, but we can check if the button is there.
    // Playwright can interact with validation, but for now let's just try to click and check if we are still on the same page/state.
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // Assuming the browser validation stops the request, we should still see the form.
    await expect(page.getByLabel(/Email/i)).toBeVisible();
  });

  test('should show error on failed login (Mocked)', async ({ page }) => {
    // Mock the Supabase Auth API call for failure
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.getByLabel(/Email/i).fill('wrong@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.locator('.form-error')).toContainText('Invalid login credentials');
  });

  test('should successfully login (Mocked)', async ({ page }) => {
    // Mock the Supabase Auth API call for success
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh-token',
          user: {
            id: 'fake-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
          },
        }),
      });
    });

    // Mock the user call which often happens after login to get details
    await page.route('**/auth/v1/user', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            id: 'fake-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@example.com',
        }),
      });
    });

    await page.getByLabel(/Email/i).fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Verify successful login state.
    // Since there is no automatic redirect in the current code, we assert the UI state change
    // or manually trigger navigation if the app relies on user action.
    // However, looking at Navigation.jsx, it updates based on auth state.
    // So the Login link should disappear and User icon/Logout should appear.
    // Note: The Navigation component is outside the <Routes>, so it's always present.

    // Check if the "Logout" button appears in the menu or the "Login" link disappears.
    // The Navigation has a mobile menu, but on desktop it might be visible or hidden.
    // Let's check for the "Logout" text or "My Hub" which only appears for logged in users.

    // We need to wait for the state to update.
    // Use toBeAttached() because on mobile these are hidden in the menu
    await expect(page.getByText('Logout')).toBeAttached();
    await expect(page.getByText('My Hub')).toBeAttached();
  });
});
