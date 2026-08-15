const { test, expect } = require('@playwright/test');

// This must match CSV_URL in scripts/standings.js exactly so page.route intercepts it.
const CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRXXJgqymosDbuyhAHCpHHUqQsNxRk0B-3kBGWr7CuPymhKUpT83JKyN7DxkCiaPdKsZEeBaA3GDjH/pub?gid=1910758219&single=true&output=csv';

// A fixture covering both nights, sortable, with a clear leader in each.
const TWO_NIGHT_CSV =
    'Rank,Night,Team Name,Week 1,Week 2,Week 3\n' +
    '1,Tuesday,Spin Doctors,12,9,6\n' +
    '2,Tuesday,Easy Overhead,6,3,3\n' +
    '3,Wednesday,Baseliners,12,12,12\n' +
    '4,Wednesday,Hit Squad,9,6,6';

// A fixture exercising every cell formatter: numeric, WEATHER, ?, and empty.
const CELL_FORMAT_CSV =
    'Rank,Night,Team Name,Week 1,Week 2,Week 3\n' +
    '1,Tuesday,Alpha,12,WEATHER,?\n' +
    '2,Tuesday,Bravo,,6,3';

async function mockCsv(page, body, status = 200) {
    await page.route(CSV_URL, async route => {
        await route.fulfill({
            status,
            contentType: 'text/csv',
            body,
        });
    });
}

test.describe('Standings Page', () => {
    test('renders both Tuesday and Wednesday league sections with tables', async ({ page }) => {
        await mockCsv(page, TWO_NIGHT_CSV);
        await page.goto('/pages/standings.html');

        await expect(page.getByRole('heading', { name: 'Tuesday League', level: 2 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wednesday League', level: 2 })).toBeVisible();
        await expect(page.locator('.night-section')).toHaveCount(2);
        await expect(page.locator('#standings-root table')).toHaveCount(2);
    });


    test('night filter buttons default to All active and filter sections correctly', async ({ page }) => {
        await mockCsv(page, TWO_NIGHT_CSV);
        await page.goto('/pages/standings.html');

        // Default: "All" is active, both sections present.
        await expect(page.locator('.night-filter.active', { hasText: 'All' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tuesday League', level: 2 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wednesday League', level: 2 })).toBeVisible();

        // Click Tuesday -> only Tuesday section, Tuesday button active, All inactive.
        await page.getByRole('button', { name: 'Tuesday', exact: true }).click();
        await expect(page.locator('.night-filter.active', { hasText: 'Tuesday' })).toBeVisible();
        await expect(page.locator('.night-filter:not(.active)', { hasText: 'All' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tuesday League', level: 2 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wednesday League', level: 2 })).toHaveCount(0);

        // Click Wednesday -> only Wednesday section.
        await page.getByRole('button', { name: 'Wednesday', exact: true }).click();
        await expect(page.locator('.night-filter.active', { hasText: 'Wednesday' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wednesday League', level: 2 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tuesday League', level: 2 })).toHaveCount(0);

        // Click All -> both sections restored.
        await page.getByRole('button', { name: 'All', exact: true }).click();
        await expect(page.locator('.night-filter.active', { hasText: 'All' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Tuesday League', level: 2 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wednesday League', level: 2 })).toBeVisible();
    });

    test('formats WEATHER, ?, and empty cells with the correct classes and titles', async ({ page }) => {
        await mockCsv(page, CELL_FORMAT_CSV);
        await page.goto('/pages/standings.html');

        const alphaRow = page.locator('#standings-root tbody tr').filter({ hasText: 'Alpha' });
        const bravoRow = page.locator('#standings-root tbody tr').filter({ hasText: 'Bravo' });

        // Week columns are at td index 2..n (after rank + team). Header order: W1, W2, W3.
        const weatherCell = alphaRow.locator('td').nth(3); // Week 2 = WEATHER
        await expect(weatherCell).toHaveText('WEATHER');
        await expect(weatherCell).toHaveClass(/cell-weather/);
        await expect(weatherCell).toHaveAttribute('title', 'Postponed due to weather');

        const unknownCell = alphaRow.locator('td').nth(4); // Week 3 = ?
        await expect(unknownCell).toHaveText('?');
        await expect(unknownCell).toHaveClass(/cell-unknown/);
        await expect(unknownCell).toHaveAttribute('title', 'Not yet reported');

        const emptyCell = bravoRow.locator('td').nth(2); // Week 1 = empty
        await expect(emptyCell).toHaveText('\u2014'); // em dash
        await expect(emptyCell).toHaveClass(/cell-empty/);
    });

    test('populates the Total and Win % columns', async ({ page }) => {
        await mockCsv(page, CELL_FORMAT_CSV);
        await page.goto('/pages/standings.html');

        const alphaRow = page.locator('#standings-root tbody tr').filter({ hasText: 'Alpha' });
        // Alpha: only Week 1=12 counted -> total 12, win% 100.0%
        await expect(alphaRow.locator('td.col-total')).toHaveText('12');
        await expect(alphaRow.locator('td.col-pct')).toHaveText('100.0%');

        const bravoRow = page.locator('#standings-root tbody tr').filter({ hasText: 'Bravo' });
        // Bravo: Week 2=6 + Week 3=3 -> total 9, win% 37.5%
        await expect(bravoRow.locator('td.col-total')).toHaveText('9');
        await expect(bravoRow.locator('td.col-pct')).toHaveText('37.5%');
    });

    test('shows an error message and Try Again button when the CSV fetch returns HTTP 500', async ({ page }) => {
        await page.route(CSV_URL, async route => {
            await route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' });
        });
        await page.goto('/pages/standings.html');

        await expect(page.locator('#standings-root .error-msg')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    });

    test('shows the empty-state message when the CSV has a header but no data rows', async ({ page }) => {
        // Header-only CSV: parseCSV returns no rows -> empty-msg.
        await mockCsv(page, 'Rank,Night,Team Name,Week 1');
        await page.goto('/pages/standings.html');

        await expect(page.locator('#standings-root .empty-msg')).toBeVisible();
        await expect(page.locator('#standings-root .empty-msg')).toHaveText(
            'No standings data available yet.'
        );
    });

    test('shows an error message when the CSV body is HTML instead of CSV', async ({ page }) => {
        await mockCsv(page, '<html><body>Not a CSV</body></html>');
        await page.goto('/pages/standings.html');

        await expect(page.locator('#standings-root .error-msg')).toBeVisible();
        await expect(page.locator('#standings-root .error-msg')).toContainText(
            'Received HTML instead of CSV'
        );
    });
    test('sorts teams by Win % descending within each night (leader row gets row-leader)', async ({ page }) => {
        await mockCsv(page, TWO_NIGHT_CSV);
        await page.goto('/pages/standings.html');

        const tuesdayRows = page
            .locator('.night-section', { hasText: 'Tuesday League' })
            .locator('tbody tr');
        await expect(tuesdayRows.nth(0)).toContainText('Spin Doctors');
        await expect(tuesdayRows.nth(0)).toHaveClass(/row-leader/);
        await expect(tuesdayRows.nth(1)).toContainText('Easy Overhead');
        await expect(tuesdayRows.nth(1)).not.toHaveClass(/row-leader/);

        const wednesdayRows = page
            .locator('.night-section', { hasText: 'Wednesday League' })
            .locator('tbody tr');
        await expect(wednesdayRows.nth(0)).toContainText('Baseliners');
        await expect(wednesdayRows.nth(0)).toHaveClass(/row-leader/);
    });
});
