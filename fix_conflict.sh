cat << 'INNER_EOF' > tests/team.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Team Page', () => {
    test('should populate team name and schedule table for a Tuesday team', async ({ page }) => {
        // Navigate to a specific team page
        await page.goto('/pages/team.html?day=tuesday&team=1');

        // Wait for the JS to populate the header
        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        // Wait for the match schedule rows to populate
        // We wait for the table row to be visible instead of using a lazy `not.toHaveCount(0)` wait
        await expect(page.locator('#matches-table tbody').getByRole('row').nth(0)).toBeVisible();

        // Check if table headers exist
        await expect(page.getByRole('columnheader', { name: 'Week' })).toBeVisible();

        // Check if the team roster table is populated
        await expect(page.locator('table:not(#matches-table) tbody').getByRole('row').nth(0)).toBeVisible();
    });

    test('should display error messages when match or roster data fails to load', async ({ page }) => {
        await page.goto('/pages/team.html?day=tuesday&team=invalid');

        await expect(page.getByRole('cell', { name: /Could not load match data\./i })).toBeVisible();
        await expect(page.getByRole('cell', { name: /Could not load roster data\./i })).toBeVisible();
    });

    test('should handle missing URL parameters gracefully', async ({ page }) => {
        await page.goto('/pages/team.html?day=invalid&team=invalid');

        await expect(page.getByRole('heading', { level: 2, name: 'Match Schedule' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Could not load match data.', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Could not load roster data.', exact: true })).toBeVisible();
    });
});
INNER_EOF
