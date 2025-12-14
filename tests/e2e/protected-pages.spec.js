import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Protected Pages', () => {

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);

    // Mock generic user data calls that might happen on any protected page load
    // We default to a user with NO special roles, unless overridden in specific tests
    await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'Test',
              last_name: 'User',
              is_captain: false,
              is_admin: false
            }),
        });
    });
  });

  test('Player Profile loads', async ({ page }) => {
    await page.goto('/player-profile');
    await expect(page.getByRole('heading', { name: 'Player Profile' })).toBeVisible();
    // Profile combines first and last name into Full Name field
    await expect(page.getByLabel('Full Name *')).toHaveValue('Test User');
  });

  test('My Schedule loads', async ({ page }) => {
    // Mock user's team
     await page.route('**/rest/v1/player_to_team*player=eq.fake-user-id*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
            {
                team: {
                    id: 'team-1',
                    name: 'My Team',
                    number: 5,
                    play_night: 'Monday'
                }
            }
        ]),
      });
    });

    // Mock matches (team_match table)
    await page.route('**/rest/v1/team_match*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 1,
                    date: '2025-11-01', // Future date
                    time: '18:00',
                    home_team: { id: 'team-1', name: 'My Team', number: 5 },
                    away_team: { id: 'team-2', name: 'Rivals', number: 6 },
                    courts: '1-3'
                }
            ]),
        });
    });

    await page.goto('/my-schedule');
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible();
    // Component displays "Team X - Name", not "My Team vs Rivals" directly
    await expect(page.getByText('Team 6 - Rivals')).toBeVisible();
  });

  test('Captain Dashboard loads', async ({ page }) => {
    // 1. Player check (needs is_captain=true)
    await page.route('**/rest/v1/player*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'Test',
              last_name: 'User',
              is_captain: true,
              is_admin: true
            }),
        });
    });

    // 2. Player to Team (to find which team captain belongs to)
    await page.route('**/rest/v1/player_to_team*player=eq.fake-user-id*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ team: 'team-1' }),
        });
    });

    // 3. Team Details
    await page.route('**/rest/v1/team*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'team-1', number: 1, name: 'The Aces', play_night: 'Monday' }),
        });
    });

    // 4. Team Roster (player_to_team with players)
    await page.route('**/rest/v1/player_to_team?select=*%2Cplayer%28*%29&team=eq.team-1*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // 5. Matches (season record, upcoming)
    await page.route('**/rest/v1/matches*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/captain-dashboard');
    await expect(page.getByRole('heading', { name: 'Captain Dashboard' })).toBeVisible();
  });

  test('Admin: Schedule Generator loads', async ({ page }) => {
    // Mock captain for this route
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
    await expect(page.getByRole('heading', { name: 'Schedule Generator' })).toBeVisible();
  });

  test('Admin: Player Management loads', async ({ page }) => {
    // Mock admin/captain
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
    // Mock list of players for the management page
    await page.route('**/rest/v1/player?select=*&order=last_name.asc', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/admin/player-management');
    await expect(page.getByRole('heading', { name: 'Player Management' })).toBeVisible();
  });

  test('Admin: Team Management loads', async ({ page }) => {
    // Mock admin/captain
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
    await page.goto('/admin/team-management');
    await expect(page.getByText('Team Management (Coming Soon)')).toBeVisible();
  });

});
