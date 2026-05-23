const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
    test('Standings page renders correctly', async ({ page }) => {
        const mockCsvData = "Rank,Night,Team\n1,Tuesday,Team A\n2,Wednesday,Team B\n3,Tuesday,Team C";
        await page.route('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ09FIuDMkX5mmdp9e-szR15pWx2cp-YyqsYxoNBL4FM0y8v3Q_LKboCjAEcUyobbgwCCGQpSMT3bXh/pub?output=csv', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/csv',
                body: mockCsvData,
            });
        });

        await page.goto('/pages/standings.html');
        await expect(page.getByRole('heading', { level: 1, name: 'Standings' })).toBeVisible();

        // Verify placeholder message is displayed
        await expect(page.locator('#standings-table')).toContainText('2026 Standings will be updated once the season begins!');
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
