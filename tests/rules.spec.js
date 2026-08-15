const { test, expect } = require('@playwright/test');

test.describe('Rules Page', () => {
    test('renders a Table of Contents with anchor links to each major section', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        const toc = page.locator('nav.toc');
        await expect(toc).toBeVisible();

        await expect(toc.getByRole('link', { name: 'Match Play Rules' })).toHaveAttribute('href', '#match-play-rules');
        await expect(toc.getByRole('link', { name: 'Scoring System' })).toHaveAttribute('href', '#scoring-system');
        await expect(toc.getByRole('link', { name: 'Weather & Cancellations' })).toHaveAttribute('href', '#weather-cancellations');
        await expect(toc.getByRole('link', { name: 'Team Organization' })).toHaveAttribute('href', '#team-organization');
    });

    test('contains the #weather-cancellations section used by the weather widget deep link', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        await expect(page.locator('#weather-cancellations')).toBeVisible();
    });

    test('clicking a TOC anchor navigates to the matching section id', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html');
        await page.getByRole('link', { name: 'Weather & Cancellations' }).click();
        await expect(page).toHaveURL(/#weather-cancellations$/);
        await expect(page.locator('#weather-cancellations')).toBeVisible();
    });

    test('lands on the weather-cancellations section when loaded via deep link', async ({ page }) => {
        await page.goto('/pages/ltta-rules.html#weather-cancellations');
        await expect(page).toHaveURL(/#weather-cancellations$/);
        await expect(page.locator('#weather-cancellations')).toBeVisible();
    });
});
