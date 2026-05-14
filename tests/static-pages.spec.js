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
        await expect(page.getByRole('heading', { level: 1, name: '2025 Standings' })).toBeVisible();

        // Verify initial render (All)
        const teamARow = page.getByRole('row', { name: '1 Tuesday Team A' });
        const teamBRow = page.getByRole('row', { name: '2 Wednesday Team B' });
        const teamCRow = page.getByRole('row', { name: '3 Tuesday Team C' });

        await expect(teamARow).toBeVisible();
        await expect(teamBRow).toBeVisible();
        await expect(teamCRow).toBeVisible();

        // Test Tuesday filter
        await page.getByRole('button', { name: 'Tuesday' }).click();
        await expect(teamARow).toBeVisible();
        await expect(teamBRow).not.toBeVisible();
        await expect(teamCRow).toBeVisible();

        // Test Wednesday filter
        await page.getByRole('button', { name: 'Wednesday' }).click();
        await expect(teamARow).not.toBeVisible();
        await expect(teamBRow).toBeVisible();
        await expect(teamCRow).not.toBeVisible();

        // Test All filter
        await page.getByRole('button', { name: 'All' }).click();
        await expect(teamARow).toBeVisible();
        await expect(teamBRow).toBeVisible();
        await expect(teamCRow).toBeVisible();
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
