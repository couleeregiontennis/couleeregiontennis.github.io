const { test, expect } = require('@playwright/test');

const LEVELS = ['Level 1 Subs', 'Level 2 Subs', 'Level 3 Subs', 'Level 4 & 5 Subs'];

test.describe('Subs Page', () => {
    test('renders all four GroupMe links with correct href, target, and rel', async ({ page }) => {
        await page.goto('/pages/subs.html');
        await expect(page.getByRole('heading', { level: 1, name: 'LTTA Sub GroupMe Links' })).toBeVisible();

        for (const level of LEVELS) {
            const link = page.getByRole('link', { name: level, exact: true });
            await expect(link).toBeVisible();
            await expect(link).toHaveAttribute('href', /^https:\/\/groupme\.com\/join_group/);
            await expect(link).toHaveAttribute('target', '_blank');
            const rel = await link.getAttribute('rel');
            expect(rel).toContain('noopener');
            expect(rel).toContain('noreferrer');
        }
    });

    test('renders all four QR images with non-empty alt text', async ({ page }) => {
        await page.goto('/pages/subs.html');
        const imgs = page.locator('.qr-img');
        await expect(imgs).toHaveCount(4);
        for (let i = 0; i < 4; i++) {
            await expect(imgs.nth(i)).toHaveAttribute('alt', /.+/);
        }
    });

    test('keeps alt text accessible even when a QR image source fails to load', async ({ page }) => {
        await page.route('**/resources/sub-1.jpeg', route =>
            route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' })
        );
        await page.goto('/pages/subs.html');
        const img = page.locator('.qr-img').first();
        await expect(img).toHaveAttribute('alt', /.+/);
    });
});
