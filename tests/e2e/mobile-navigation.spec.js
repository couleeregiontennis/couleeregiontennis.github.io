import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Mobile Navigation', () => {
  // Only run this test on mobile viewports
  test.skip(({ isMobile }) => !isMobile, 'This test is only for mobile viewports');

  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
    await page.goto('/');
  });

  test('hamburger menu toggles navigation', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /Toggle navigation/i });
    const navMenu = page.locator('.navbar-menu');

    // Initially, menu should be hidden (or at least not 'active')
    // CSS implementation usually hides it or moves it off-screen.
    // Navigation.jsx checks for 'active' class.
    await expect(navMenu).not.toHaveClass(/active/);

    // Click toggle
    await toggleButton.click();

    // Menu should be open
    await expect(navMenu).toHaveClass(/active/);
    await expect(navMenu).toBeVisible();

    // Click toggle again to close
    await toggleButton.click();
    await expect(navMenu).not.toHaveClass(/active/);
  });

  test('clicking a link closes the menu', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /Toggle navigation/i });
    const navMenu = page.locator('.navbar-menu');

    await toggleButton.click();
    await expect(navMenu).toHaveClass(/active/);

    // Click a link (e.g., Schedule which goes to root /)
    // Note: The link might trigger a navigation, but Navigation.jsx has onClick={closeMenu}
    await page.getByRole('link', { name: 'Schedule' }).click();

    // Menu should close
    await expect(navMenu).not.toHaveClass(/active/);
  });
});
