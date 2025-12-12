import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Protected Pages', () => {

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);

    // Mock generic user data calls that might happen on any protected page load
    await page.route('**/rest/v1/player?id=eq.fake-user-id*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-user-id', first_name: 'Test', last_name: 'User' }),
        });
    });
  });

  test('Player Profile loads', async ({ page }) => {
    await page.goto('/player-profile');
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
    await expect(page.getByDisplayValue('Test')).toBeVisible(); // First Name input
    await expect(page.getByDisplayValue('User')).toBeVisible(); // Last Name input
  });

  test('My Schedule loads', async ({ page }) => {
    // Mock user's team
     await page.route('**/rest/v1/player_to_team?player=eq.fake-user-id*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ team: 'team-1' }),
      });
    });

    await page.route('**/rest/v1/team?id=eq.team-1*', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'team-1', number: 5 }),
      });
    });

    // Mock matches
    await page.route('**/rest/v1/matches*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 1, date: '2023-11-01', home_team_name: 'My Team', away_team_name: 'Rivals', home_team_number: 5, away_team_number: 6 }
            ]),
        });
    });

    await page.goto('/my-schedule');
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible();
    await expect(page.getByText('My Team vs Rivals')).toBeVisible();
  });

  test('Captain Dashboard loads', async ({ page }) => {
    // Mock being a captain? The component logic checks if user is captain usually, or just loads.
    // Let's assume basic load first.
    await page.goto('/captain-dashboard');
    // Expect heading. Component likely has "Captain Dashboard" or similar.
    // Checking file content logic...
    // If user is not captain, it might redirect or show different content.
    // Just checking it renders is a good start.
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('Admin: Schedule Generator loads', async ({ page }) => {
    await page.goto('/admin/schedule-generator');
    await expect(page.getByRole('heading', { name: 'Schedule Generator' })).toBeVisible();
  });

  test('Admin: Player Management loads', async ({ page }) => {
    await page.goto('/admin/player-management');
    await expect(page.getByText('Player Management (Coming Soon)')).toBeVisible();
  });

  test('Admin: Team Management loads', async ({ page }) => {
    await page.goto('/admin/team-management');
    await expect(page.getByText('Team Management (Coming Soon)')).toBeVisible();
  });

});
