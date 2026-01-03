import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Desktop Navigation', () => {
  // Only run this test on desktop viewports (not mobile)
  test.skip(({ isMobile }) => isMobile, 'This test is only for desktop viewports');

  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
    await page.goto('/');
  });

  test('hamburger menu is hidden on desktop', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /Toggle navigation/i });

    // The hamburger button should be hidden on desktop
    await expect(toggleButton).toBeHidden();
  });

  test('navigation links are visible on desktop', async ({ page }) => {
    const navMenu = page.locator('.navbar-menu');

    // The navigation menu should be visible without clicking any toggle
    // Direct links like 'Schedule' should be visible
    await expect(page.getByRole('link', { name: 'Schedule' })).toBeVisible();

    // Dropdown links like 'Standings' require interaction
    // The button text is "League ▼", but getByRole('button', { name: 'League' }) should match.
    // Use a regex to be more flexible with the arrow character.
    const leagueDropdown = page.getByRole('button', { name: /League/i });
    await expect(leagueDropdown).toBeVisible();

    // Hover or click to open dropdown (CSS hover works on desktop, but click also toggles)
    await leagueDropdown.click();

    await expect(page.getByRole('link', { name: 'Standings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Rules' })).toBeVisible();
  });
});
