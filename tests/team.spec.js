const { test, expect } = require('@playwright/test');

test.describe('Team Page', () => {
    test('should populate team name and schedule table for a Tuesday team', async ({ page }) => {
        // Navigate to a specific team page
        await page.goto('/pages/team.html?day=tuesday&team=1');

        // Wait for the JS to populate the header
        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        // Wait for the match schedule rows to populate
        // We wait for the table row to be visible instead of using a lazy `not.toHaveCount(0)` wait
        await expect(page.locator('#matches-table').getByRole('row').nth(1)).toBeVisible();

        // Wait for the Team Roster rows to populate
        await expect(page.locator('table:not(#matches-table)').getByRole('row').nth(1)).toBeVisible();

        // Check if table headers exist
        await expect(page.getByRole('columnheader', { name: 'Week' })).toBeVisible();
    });

    test('should display error messages when match or roster data fails to load', async ({ page }) => {
        await page.goto('/pages/team.html?day=tuesday&team=invalid');

        await expect(page.getByRole('cell', { name: /Could not load match data\./i })).toBeVisible();
        await expect(page.getByRole('cell', { name: /Could not load roster data\./i })).toBeVisible();
    });

    test('should handle missing URL parameters gracefully', async ({ page }) => {
        await page.goto('/pages/team.html');

        // Depending on the implementation, it might show "Team not found" or leave it empty.
        // For now, let's just assert the page loads without crashing the core layout.
        await expect(page.getByRole('heading', { level: 2, name: 'Match Schedule' })).toBeVisible();
    });
});
