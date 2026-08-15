const { test, expect } = require('@playwright/test');

async function mockCancellations(page, payload) {
    await page.route('**/assets/cancellations.json**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
    );
}

test.describe('Team Page', () => {
    test('should populate team name and schedule table for a Tuesday team', async ({ page }) => {
        // Navigate to a specific team page
        await page.goto('/pages/team.html?day=tuesday&team=1');

        // Wait for the JS to populate the header
        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        // Wait for the match schedule rows to populate
        // We wait for the table row to be visible instead of using a lazy `not.toHaveCount(0)` wait
        const matchesTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Opponent' }) });
        await expect(matchesTable.getByRole('row').nth(1)).toBeVisible();

        // Wait for the Team Roster rows to populate
        const rosterTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Position' }) });
        await expect(rosterTable.getByRole('row').nth(1)).toBeVisible();

        // Check if table headers exist
        await expect(page.getByRole('columnheader', { name: 'Week' })).toBeVisible();
    });

    test('should allow downloading the full season calendar', async ({ page }) => {
        await page.goto('/pages/team.html?day=tuesday&team=1');

        await expect(page.getByRole('heading', { level: 1, name: 'Spin Doctors' })).toBeVisible();

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('link', { name: /Download Full Season/i }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('team.ics');
    });

    test('should display error messages when match or roster data fails to load', async ({ page }) => {
        await page.goto('/pages/team.html?day=tuesday&team=invalid');

        await expect(page.getByRole('cell', { name: /Could not load match data\./i })).toBeVisible();
        await expect(page.getByRole('cell', { name: /Could not load roster data\./i })).toBeVisible();
    });

    test('should handle missing URL parameters gracefully', async ({ page }) => {
        await page.goto('/pages/team.html?day=invalid&team=invalid');

        await expect(page.getByRole('heading', { level: 2, name: 'Match Schedule' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Could not load match data.', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Could not load roster data.', exact: true })).toBeVisible();
    });

    test('should populate team name and schedule table for a Wednesday team', async ({ page }) => {
        await mockCancellations(page, { cancelledDate: '', reason: '' });
        await page.goto('/pages/team.html?day=wednesday&team=1');

        await expect(page.getByRole('heading', { level: 1, name: 'LAX-Winona Fusion' })).toBeVisible();

        const matchesTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Opponent' }) });
        await expect(matchesTable.getByRole('row').nth(1)).toBeVisible();

        const rosterTable = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Position' }) });
        await expect(rosterTable.getByRole('row').nth(1)).toBeVisible();
    });

    test('should highlight the next upcoming match row', async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-05-27T12:00:00'));
        await mockCancellations(page, { cancelledDate: '', reason: '' });
        await page.goto('/pages/team.html?day=wednesday&team=1');

        // Week 1 (2026-05-27) is "today", so it is the earliest upcoming match.
        await expect(page.locator('#matches-table tbody tr').nth(0)).toHaveClass(/highlight/);
    });

    test('should expose per-row ICS download links and a full season link', async ({ page }) => {
        await mockCancellations(page, { cancelledDate: '', reason: '' });
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('heading', { level: 1, name: 'LAX-Winona Fusion' })).toBeVisible();

        const dataRows = page.locator('#matches-table tbody tr');
        const icsLinks = page.locator('#matches-table td a[download]');
        const rowCount = await dataRows.count();
        await expect(icsLinks).toHaveCount(rowCount);
        await expect(icsLinks.first()).toHaveAttribute('download', /LTTA-Match-Week/);

        // The full season link resolves to a team.ics href.
        await expect(page.locator('#add-all-ics')).toHaveAttribute('href', /team\.ics/);
    });

    test('should navigate to the opponent team page via the team-link', async ({ page }) => {
        await mockCancellations(page, { cancelledDate: '', reason: '' });
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('heading', { level: 1, name: 'LAX-Winona Fusion' })).toBeVisible();

        // Week 1 opponent is Nothing But Net (team 12).
        await page.getByRole('link', { name: 'Nothing But Net' }).click();
        await expect(page).toHaveURL(/day=wednesday&team=12/);
        await expect(page.getByRole('heading', { level: 1, name: 'Nothing But Net' })).toBeVisible();
    });

    test('should show a rain cancellation badge on the cancelled match row', async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-06-15T12:00:00'));
        await mockCancellations(page, { cancelledDate: '2026-06-17', reason: 'rain' });
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('heading', { level: 1, name: 'LAX-Winona Fusion' })).toBeVisible();

        const week4Row = page.locator('#matches-table tbody tr').nth(3);
        await expect(week4Row).toHaveClass(/cancelled-match-row/);
        await expect(week4Row).toContainText('Canceled (Rain)');
    });

    test('should show a heat cancellation badge when reason is heat', async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-06-15T12:00:00'));
        await mockCancellations(page, { cancelledDate: '2026-06-17', reason: 'heat' });
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('heading', { level: 1, name: 'LAX-Winona Fusion' })).toBeVisible();

        const week4Row = page.locator('#matches-table tbody tr').nth(3);
        await expect(week4Row).toHaveClass(/cancelled-match-row/);
        await expect(week4Row).toContainText('Canceled (Heat)');
    });

    test('should show a match data error when the schedule JSON returns HTTP 500', async ({ page }) => {
        await page.route('**/teams/wednesday/schedules/1.json**', route =>
            route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' })
        );
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('cell', { name: /Could not load match data\./i })).toBeVisible();
    });

    test('should show a roster data error when the roster JSON returns HTTP 500', async ({ page }) => {
        await page.route('**/teams/wednesday/rosters/1.json**', route =>
            route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' })
        );
        await page.goto('/pages/team.html?day=wednesday&team=1');
        await expect(page.getByRole('cell', { name: /Could not load roster data\./i })).toBeVisible();
    });

    test('should render empty tables without crashing when the day param is missing', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('/pages/team.html?team=1');
        await expect(page.getByRole('heading', { level: 2, name: 'Match Schedule' })).toBeVisible();
        await expect(page.locator('#matches-table tbody tr')).toHaveCount(0);
        expect(errors).toEqual([]);
    });

    test('should render empty tables without crashing when the team param is missing', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('/pages/team.html?day=wednesday');
        await expect(page.getByRole('heading', { level: 2, name: 'Match Schedule' })).toBeVisible();
        await expect(page.locator('#matches-table tbody tr')).toHaveCount(0);
        expect(errors).toEqual([]);
    });
});
