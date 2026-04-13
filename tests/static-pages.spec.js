const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
    test('Standings page renders correctly', async ({ page }) => {
        const mockCSV = `Rank,Team,Night,Points\n1,Mock Team 1,Tuesday,10\n2,Mock Team 2,Wednesday,8`;
        await page.route('https://docs.google.com/spreadsheets/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/csv',
                body: mockCSV
            });
        });

        await page.goto('/pages/standings.html');
        await expect(page.getByRole('heading', { level: 1, name: 'Standings' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Mock Team 1' })).toBeVisible();
    });

    test('Subs page renders correctly', async ({ page }) => {
        await page.goto('/pages/subs.html');
        await expect(page.getByRole('heading', { level: 1, name: 'LTTA Sub GroupMe Links' })).toBeVisible();
    });

    test('Rules page renders correctly', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        // The rules page usually has a specific header or title.
        await expect(page.getByRole('heading', { level: 1, name: 'La Crosse Team Tennis Association (LTTA) – Summer League 2025' })).toBeVisible();
    });
});
