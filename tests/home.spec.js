const { test, expect } = require('@playwright/test');

test.describe('Home Page', () => {
    test('should display the main header', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1').first()).toHaveText('Teams');
    });

    test('should display both league sections', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'LTTA Tuesday Tennis – 2025' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'LTTA Wednesday Tennis – 2025' })).toBeVisible();
    });

    test('should navigate to team page when clicking a team link', async ({ page }) => {
        await page.goto('/');

        // Click on Team 1 for Tuesday
        await page.click('text=Team 1 – Spin Doctors');

        // Verify it navigates to the correct URL
        await expect(page).toHaveURL(/.*pages\/team\.html\?day=tuesday&team=1/);

        // Verify the team name is visible on the new page
        await expect(page.locator('#team-name')).toBeVisible();
    });
});
