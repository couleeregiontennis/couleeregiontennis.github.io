import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Admin Audit Log Viewer', () => {

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page, { email: 'admin@example.com' });
  });

  test('Loads correctly for admin user', async ({ page }) => {
     // Mock player requests (both single user check and list)
     await page.route('**/rest/v1/player*', async (route) => {
        const url = route.request().url();
        if (url.includes('id=eq.fake-user-id') || url.includes('limit=1')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 'fake-user-id', is_captain: true, is_admin: true, first_name: 'Admin', last_name: 'User', email: 'admin@example.com' }),
            });
        } else {
            // List of players
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'fake-user-id', first_name: 'Admin', last_name: 'User', email: 'admin@example.com' },
                    { id: 'user-2', first_name: 'Regular', last_name: 'Player', email: 'player@example.com' }
                ]),
            });
        }
    });

    // Mock audit logs
    await page.route('**/rest/v1/audit_logs*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 1,
                    changed_at: new Date().toISOString(),
                    operation: 'UPDATE',
                    table_name: 'team',
                    record_id: 'team-123',
                    changed_by: 'fake-user-id',
                    old_data: { name: 'Old Team Name' },
                    new_data: { name: 'New Team Name' }
                }
            ]),
        });
    });

    await page.goto('/admin/audit-logs');
    await expect(page.getByRole('heading', { name: 'Audit Log Viewer' })).toBeVisible();
    await expect(page.getByText('Admin User (admin@example.com)')).toBeVisible();
    await expect(page.locator('.operation-badge', { hasText: 'UPDATE' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'team', exact: true })).toBeVisible();

    // Check View Details
    await page.getByRole('button', { name: 'View' }).click();
    await expect(page.getByRole('heading', { name: 'Change Details' })).toBeVisible();
    await expect(page.getByText('"Old Team Name"')).toBeVisible();
  });

  test('Access denied for non-admin user', async ({ page }) => {
     // Mock non-admin user
     await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-user-id', is_captain: false, first_name: 'Regular', last_name: 'User' }),
        });
    });

    await page.goto('/admin/audit-logs');
    await expect(page).toHaveURL('/');
  });

  test('Can filter logs', async ({ page }) => {
       // Mock admin user
     await page.route('**/rest/v1/player*', async (route) => {
        const url = route.request().url();
        if (url.includes('id=eq.fake-user-id') || url.includes('limit=1')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 'fake-user-id', is_captain: true, is_admin: true, first_name: 'Admin', last_name: 'User' }),
            });
        } else {
             await route.fulfill({ status: 200, body: '[]' });
        }
    });

    // Mock audit logs with filter
    let filtered = false;
    await page.route('**/rest/v1/audit_logs*', async (route) => {
        const url = route.request().url();
        if (url.includes('table_name=eq.team')) {
            filtered = true;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/admin/audit-logs');
    await page.getByLabel('Table').selectOption('team');
    // Wait for network request
    await expect.poll(() => filtered).toBe(true);
  });
});
