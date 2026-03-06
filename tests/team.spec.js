const { test, expect } = require('@playwright/test');

test.describe('Team Page', () => {
    test('should populate team name and schedule table for a Tuesday team', async ({ page }) => {
        // Navigate to a specific team page
        await page.goto('/pages/team.html?day=tuesday&team=1');

        // Wait for the JS to populate the header
        await expect(page.locator('#team-name')).toHaveText('Spin Doctors');

        // Wait for the match schedule rows to populate
        const matchRows = page.locator('#matches-table tbody tr');
        await expect(matchRows).not.toHaveCount(0);

        // Check if table headers exist
        await expect(page.locator('#matches-table th').first()).toHaveText('Week');
    });

    test('should handle missing URL parameters gracefully', async ({ page }) => {
        await page.goto('/pages/team.html');

        // Depending on the implementation, it might show "Team not found" or leave it empty.
        // For now, let's just assert the page loads without crashing the core layout.
        await expect(page.locator('h2').filter({ hasText: 'Match Schedule' })).toBeVisible();
    });
});
