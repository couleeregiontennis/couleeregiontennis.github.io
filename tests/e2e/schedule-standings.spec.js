import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Match Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
  });

  test('displays upcoming matches', async ({ page }) => {
    // Set fixed time so the month view shows the mocked matches
    await page.clock.install({ time: new Date('2023-10-01T12:00:00') });

    // Mock season data (required for MatchSchedule to load)
    await page.route('**/rest/v1/season*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'season-1',
          name: 'Fall 2023',
          start_date: '2023-09-01',
          end_date: '2023-12-31'
        })
      });
    });

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

    // Mock the matches data (team_match table with relations)
    await page.route('**/rest/v1/team_match*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            date: '2023-10-01',
            time: '18:00',
            status: 'upcoming',
            courts: '1-3',
            home_team: { id: '1', name: 'Aces', number: 1 },
            away_team: { id: '2', name: 'Faults', number: 2 }
          },
          {
            id: '2',
            date: '2023-10-02',
            time: '18:00',
            status: 'upcoming',
            courts: '4-6',
            home_team: { id: '3', name: 'Netters', number: 3 },
            away_team: { id: '4', name: 'Lobbers', number: 4 }
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
    // Mock standings_view data (correct endpoint for Standings.jsx)
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
                  games_lost: 50,
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
                  games_won: 80,
                  games_lost: 100,
                  win_percentage: 41.7,
                  set_win_percentage: 41.7
                }
            ])
         });
    });

    // Mock player count (required for League Overview)
    await page.route('**/rest/v1/player*', async (route) => {
       if (route.request().url().includes('count=exact')) {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': '0-0/100' }, // Mock total count
            body: JSON.stringify([])
         });
       } else {
         await route.continue();
       }
    });

    // Mock matches for recent matches in Overview
    await page.route('**/rest/v1/matches*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    await page.goto('/standings');
    await expect(page.getByRole('heading', { name: 'Team Standings' })).toBeVisible();

    // Assert visibility of team names scoped to the standings table
    const table = page.locator('.standings-table');
    await expect(table.getByText('Team A')).toBeVisible();
    await expect(table.getByText('Team B')).toBeVisible();
  });

});
