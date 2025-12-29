import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Match Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
  });

  test('displays upcoming matches', async ({ page }) => {
    // Set fixed time so the month view shows the mocked matches
    await page.clock.install({ time: new Date('2023-10-01T12:00:00') });

    // Mock team data (required for filter dropdown, otherwise fetch fails)
    await page.route('**/rest/v1/team*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Aces', number: 1 },
          { id: '2', name: 'Faults', number: 2 },
          { id: '3', name: 'Netters', number: 3 },
          { id: '4', name: 'Lobbers', number: 4 }
        ])
      });
    });

    // Mock the matches data
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            date: '2023-10-01',
            time: '18:00',
            home_team_name: 'Aces',
            home_team_number: 1,
            away_team_name: 'Faults',
            away_team_number: 2,
            courts: '1-3',
            status: 'upcoming'
          },
          {
            id: '2',
            date: '2023-10-02',
            time: '18:00',
            home_team_name: 'Netters',
            home_team_number: 3,
            away_team_name: 'Lobbers',
            away_team_number: 4,
            courts: '4-6',
            status: 'upcoming'
          }
        ]),
      });
    });

    await page.goto('/'); // Root is MatchSchedule
    // Check for team names individually as they might stack on mobile or have different layout
    await expect(page.locator('.team-name').getByText('Aces', { exact: true })).toBeVisible();
    await expect(page.locator('.team-name').getByText('Faults', { exact: true })).toBeVisible();
    await expect(page.locator('.team-name').getByText('Netters', { exact: true })).toBeVisible();
    await expect(page.locator('.team-name').getByText('Lobbers', { exact: true })).toBeVisible();
  });

  test('displays standings', async ({ page }) => {
    // Mock standings data
    await page.route('**/rest/v1/standings_view*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    team_id: '1',
                    team_number: 1,
                    team_name: 'Team A',
                    play_night: 'Tuesday',
                    wins: 10,
                    losses: 2,
                    ties: 0,
                    matches_played: 12,
                    sets_won: 20,
                    sets_lost: 4,
                    games_won: 120,
                    games_lost: 80,
                    win_percentage: 83.3,
                    set_win_percentage: 83.3
                },
                {
                    team_id: '2',
                    team_number: 2,
                    team_name: 'Team B',
                    play_night: 'Wednesday',
                    wins: 5,
                    losses: 7,
                    ties: 0,
                    matches_played: 12,
                    sets_won: 10,
                    sets_lost: 14,
                    games_won: 90,
                    games_lost: 100,
                    win_percentage: 41.7,
                    set_win_percentage: 41.7
                }
            ])
         });
    });

    // Mock other requests that Standings might make (player, matches for metrics)
    await page.route('**/rest/v1/player*', async (route) => {
        // Return count for player count
        await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify([]), // or handle count if needed, but [] is safe
             headers: {
                 'content-range': '0-0/100' // mock count header
             }
        });
    });

    await page.route('**/rest/v1/matches*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
         });
    });

    await page.goto('/standings');
    await expect(page.getByRole('heading', { name: 'Team Standings' })).toBeVisible();

    // Verify table content
    const table = page.locator('.standings-table');
    await expect(table.getByRole('cell', { name: 'Team A', exact: false })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Team B', exact: false })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Tuesday' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'Wednesday' })).toBeVisible();
  });

});
