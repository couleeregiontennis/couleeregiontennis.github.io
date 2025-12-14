import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Admin Audit Log Viewer', () => {

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);

    // Mock login success
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Logout')).toBeAttached();
  });

  test('Loads correctly for admin user', async ({ page }) => {
     // Mock admin user check
     await page.route('**/rest/v1/player?select=id%2Cis_captain%2Cfirst_name%2Clast_name%2Cemail&id=eq.fake-user-id&limit=1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-user-id', is_captain: true, first_name: 'Admin', last_name: 'User', email: 'admin@example.com' }),
        });
    });

    // Mock all players fetch
     await page.route('**/rest/v1/player?select=id%2Cfirst_name%2Clast_name%2Cemail', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 'fake-user-id', first_name: 'Admin', last_name: 'User', email: 'admin@example.com' },
                { id: 'user-2', first_name: 'Regular', last_name: 'Player', email: 'player@example.com' }
            ]),
        });
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
    await expect(page.getByText('UPDATE')).toBeVisible();
    await expect(page.getByText('team')).toBeVisible();

    // Check View Details
    await page.getByRole('button', { name: 'View' }).click();
    await expect(page.getByRole('heading', { name: 'Change Details' })).toBeVisible();
    await expect(page.getByText('"Old Team Name"')).toBeVisible();
  });

  test('Access denied for non-admin user', async ({ page }) => {
     // Mock non-admin user
     await page.route('**/rest/v1/player?select=id%2Cis_captain%2Cfirst_name%2Clast_name%2Cemail&id=eq.fake-user-id&limit=1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-user-id', is_captain: false, first_name: 'Regular', last_name: 'User' }),
        });
    });

    await page.goto('/admin/audit-logs');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });

  test('Can filter logs', async ({ page }) => {
       // Mock admin user
     await page.route('**/rest/v1/player?select=id%2Cis_captain%2Cfirst_name%2Clast_name%2Cemail&id=eq.fake-user-id&limit=1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-user-id', is_captain: true, first_name: 'Admin', last_name: 'User' }),
        });
    });
     await page.route('**/rest/v1/player?select=id%2Cfirst_name%2Clast_name%2Cemail', async (route) => {
         await route.fulfill({ status: 200, body: '[]' });
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
