import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseData } from '../utils/auth-mock';

test.describe('Access Control Verification', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', exception => console.log(`PAGE ERROR: ${exception}`));

    await mockSupabaseAuth(page);
    await mockSupabaseData(page, 'matches', []);
    await mockSupabaseData(page, 'team', []);

    // Default: Mock generic user data - NOT admin, NOT captain
    await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'Regular',
              last_name: 'User',
              is_captain: false,
              is_admin: false
            }),
        });
    });
  });

  test('Non-Admin accessing Schedule Generator redirects to Home', async ({ page }) => {
    await page.goto('/admin/schedule-generator');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Match Schedule')).toBeVisible();
  });

  test('Non-Captain accessing Captain Dashboard redirects to Home', async ({ page }) => {
    await page.goto('/captain-dashboard');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Match Schedule')).toBeVisible();
  });

  test('Admin CAN access Schedule Generator', async ({ page }) => {
    // Override player mock
    await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'Admin',
              last_name: 'User',
              is_captain: true,
              is_admin: true
            }),
        });
    });

    await page.goto('/admin/schedule-generator');
    // URL should be preserved
    expect(page.url()).toContain('/admin/schedule-generator');
    // Content should be visible
    await expect(page.getByRole('heading', { name: 'Schedule Generator' })).toBeVisible();
  });

  test('Captain CAN access Captain Dashboard', async ({ page }) => {
     // Override player mock
    await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'Captain',
              last_name: 'User',
              is_captain: true,
              is_admin: false
            }),
        });
    });

    // Mock specific dashboard data to avoid errors
    await page.route('**/rest/v1/player_to_team*', async route => route.fulfill({ status: 200, body: JSON.stringify({ team: 'team-1' }) }));
    await page.route('**/rest/v1/team*', async route => route.fulfill({ status: 200, body: JSON.stringify([{ id: 'team-1', number: 1, name: 'Test Team', play_night: 'Tuesday' }]) }));

    await page.goto('/captain-dashboard');
    expect(page.url()).toContain('/captain-dashboard');
    await expect(page.getByRole('heading', { name: 'Captain Dashboard' })).toBeVisible();
  });

});
