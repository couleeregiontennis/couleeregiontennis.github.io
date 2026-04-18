const { test, expect } = require('@playwright/test');

test.describe('Team Page', () => {
    test('should populate team name and schedule table for a Tuesday team', async ({ page }) => {
        // Navigate to a specific team page
        await page.goto('/pages/team.html?day=tuesday&team=1');

        // Wait for the JS to populate the header
        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        // Wait for the match schedule rows to populate
        // We wait for the table row to be visible instead of using a lazy `not.toHaveCount(0)` wait
        const matchesTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Opponent' }) });
        await expect(matchesTable.getByRole('row').nth(1)).toBeVisible();

        // Wait for the Team Roster rows to populate
        const rosterTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Position' }) });
        await expect(rosterTable.getByRole('row').nth(1)).toBeVisible();

        // Check if table headers exist
        await expect(page.getByRole('columnheader', { name: 'Week' })).toBeVisible();
    });

    test('should allow downloading the full season calendar', async ({ page }) => {
        await page.goto('/pages/team.html?day=tuesday&team=1');

        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('link', { name: /Download Full Season/i }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('team.ics');
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
