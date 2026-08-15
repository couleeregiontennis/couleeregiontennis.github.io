const { test, expect } = require('@playwright/test');

// Helper: build a YYYY-MM-DD date string `days` from "now".
function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// Helper: full month name for a date offset (a dynamic-text discriminator,
// since the default banner text hardcodes "June").
function monthNameForOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'long' });
}

async function mockCancellations(page, payload, status = 200) {
    await page.route(/\/assets\/cancellations\.json/, async route => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(payload),
        });
    });
}

test.describe('Shared Nav', () => {
    test('renders brand and all primary menu links on the home page', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: 'Teams', exact: true })).toBeVisible();

        await expect(page.locator('.navbar-brand')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Standings', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: /League Info/ })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Pay Registration Online' })).toBeVisible();
        await expect(page.getByRole('link', { name: /Donate/ })).toBeVisible();
        await expect(page.getByRole('link', { name: 'CRTA Website' })).toBeVisible();

        // The League Info dropdown items are hidden until hover; reveal them.
        await page.locator('.dropdown-trigger').hover();
        await expect(page.getByRole('link', { name: 'Rules', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Find a Sub', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Green Island', exact: true })).toBeVisible();
    });

    test('theme toggle flips data-theme and persists to localStorage', async ({ page }) => {
        await page.goto('/');
        const toggle = page.locator('#theme-toggle');
        await toggle.waitFor();
        const before = await page.locator('html').getAttribute('data-theme');
        const expectedAfter = before === 'dark' ? 'light' : 'dark';

        await toggle.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', expectedAfter);
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(expectedAfter);

        await toggle.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', before);
        expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(before);
    });
});

test.describe('Shared Nav Mobile', () => {
    test('hamburger toggles the menu and League Info dropdown opens on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.locator('.navbar-toggle').waitFor();

        await page.locator('.navbar-toggle').click();
        await expect(page.locator('.navbar-menu')).toHaveClass(/active/);

        await page.locator('.dropdown-trigger').click();
        await expect(page.locator('.navbar-dropdown')).toHaveClass(/active/);

        await page.locator('.navbar-toggle').click();
        await expect(page.locator('.navbar-menu')).not.toHaveClass(/active/);
    });

    test('registration modal opens, QR toggles, and closes via button and backdrop', async ({ page }) => {
        await page.goto('/');
        const payLink = page.locator('#pay-link');
        await payLink.waitFor();
        const modal = page.locator('#registration-modal');

        await expect(modal).toBeHidden();

        await payLink.click();
        await expect(modal).toBeVisible();

        const qrToggle = page.locator('#qr-toggle-btn');
        const qrContainer = page.locator('#qr-container');
        await expect(qrContainer).toBeHidden();
        await expect(qrToggle).toHaveText('Scan QR Instead');

        await qrToggle.click();
        await expect(qrContainer).toBeVisible();
        await expect(qrToggle).toHaveText('Hide QR Code');

        await qrToggle.click();
        await expect(qrContainer).toBeHidden();
        await expect(qrToggle).toHaveText('Scan QR Instead');

        await page.locator('.close-modal').click();
        await expect(modal).toBeHidden();

        await payLink.click();
        await expect(modal).toBeVisible();
        await modal.click({ position: { x: 10, y: 10 } });
        await expect(modal).toBeHidden();
    });
});

test.describe('Cancellation Banner', () => {
    test('shows the banner with rain reason when cancellations.json has a future date', async ({ page }) => {
        const futureDate = dateOffset(30);
        const futureMonth = monthNameForOffset(30);
        await mockCancellations(page, { cancelledDate: futureDate, reason: 'rain' });

        await page.goto('/');
        await page.waitForResponse(r => r.url().includes('cancellations.json'));

        await expect(page.locator('.announcement-banner')).toBeVisible();
        await expect(page.locator('.announcement-banner')).toContainText(futureMonth);
        await expect(page.locator('.announcement-banner')).toContainText(/rain/i);
    });

    test('shows the banner with heat reason when reason is heat', async ({ page }) => {
        await mockCancellations(page, { cancelledDate: dateOffset(30), reason: 'heat' });

        await page.goto('/');
        await page.waitForResponse(r => r.url().includes('cancellations.json'));

        await expect(page.locator('.announcement-banner')).toBeVisible();
        await expect(page.locator('.announcement-banner')).toContainText(/extreme heat/i);
    });

    test('removes the banner when the cancelled date is in the past', async ({ page }) => {
        await mockCancellations(page, { cancelledDate: '2020-01-01', reason: 'rain' });

        await page.goto('/');
        await page.waitForResponse(r => r.url().includes('cancellations.json'));

        await expect(page.locator('.announcement-banner')).toHaveCount(0);
    });

    test('removes the banner when cancellations.json returns 404', async ({ page }) => {
        await mockCancellations(page, {}, 404);

        await page.goto('/');
        await page.waitForResponse(r => r.url().includes('cancellations.json'));

        await expect(page.locator('.announcement-banner')).toHaveCount(0);
    });
});

test.describe('Nav Resilience', () => {
    test('degrades gracefully when the nav partial fails to load', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        await page.route('**/partials/nav.html**', async route => {
            await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' });
        });

        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'Teams', level: 1, exact: true })).toBeVisible();
        await expect(page.locator('#theme-toggle')).toHaveCount(0);
        await expect(page.locator('.navbar')).toHaveCount(0);
        expect(errors).toEqual([]);
    });
});
