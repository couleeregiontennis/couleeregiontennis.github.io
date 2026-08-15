const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
    test('Standings page renders correctly', async ({ page }) => {
        // Must match CSV_URL in scripts/standings.js so the route actually intercepts it.
        const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRXXJgqymosDbuyhAHCpHHUqQsNxRk0B-3kBGWr7CuPymhKUpT83JKyN7DxkCiaPdKsZEeBaA3GDjH/pub?gid=1910758219&single=true&output=csv';
        const mockCsvData = 'Rank,Night,Team Name,Week 1\n1,Tuesday,Team A,6\n2,Tuesday,Team B,3';
        await page.route(csvUrl, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/csv',
                body: mockCsvData,
            });
        });

        await page.goto('/pages/standings.html');
        await expect(page.getByRole('heading', { level: 1, name: 'Standings' })).toBeVisible();

        // The standings container renders a populated table (smoke test).
        await expect(page.locator('#standings-root table')).toBeVisible();
    });

    test('Subs page renders correctly', async ({ page }) => {
        await page.goto('/pages/subs.html');
        await expect(page.getByRole('heading', { level: 1, name: 'LTTA Sub GroupMe Links' })).toBeVisible();
    });

    test('Rules page renders correctly', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        // The rules page usually has a specific header or title.
        await expect(page.getByRole('heading', { level: 1, name: 'La Crosse Team Tennis Association (LTTA) – Summer League 2026' })).toBeVisible();
    });
});
