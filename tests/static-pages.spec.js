const { test, expect } = require('@playwright/test');

test.describe('Static Pages', () => {
    test('Standings page renders correctly', async ({ page }) => {
        await page.goto('/pages/standings.html');
        await expect(page.locator('h1').first()).toContainText('Standings');
    });

    test('Subs page renders correctly', async ({ page }) => {
        await page.goto('/pages/subs.html');
        await expect(page.locator('h1').first()).toContainText('LTTA Sub GroupMe Links');
    });

    test('Rules page renders correctly', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        // The rules page usually has a specific header or title.
        await expect(page.locator('h1').first()).toBeVisible();
    });
});
