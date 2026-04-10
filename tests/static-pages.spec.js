const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
    test('Standings page renders correctly', async ({ page }) => {
        await page.goto('/pages/standings.html');
        await expect(page.getByRole('heading', { level: 1, name: 'Standings' })).toBeVisible();
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

    test('Green Island page renders correctly', async ({ page }) => {
        await page.goto('/pages/greenisland.html');
        await expect(page.getByRole('heading', { level: 1, name: 'Green Island' })).toBeVisible();
    });
});
