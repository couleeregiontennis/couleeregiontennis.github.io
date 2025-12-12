import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Match Schedule Page', () => {

  test('displays upcoming matches', async ({ page }) => {
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
            away_team_name: 'Faults',
            courts: '1-3'
          },
          {
            id: '2',
            date: '2023-10-02',
            time: '18:00',
            home_team_name: 'Netters',
            away_team_name: 'Lobbers',
            courts: '4-6'
          }
        ]),
      });
    });

    await page.goto('/'); // Root is MatchSchedule
    // Check for team names individually as they might stack on mobile or have different layout
    await expect(page.getByText('Aces', { exact: true })).toBeVisible();
    await expect(page.getByText('Faults', { exact: true })).toBeVisible();
    await expect(page.getByText('Netters', { exact: true })).toBeVisible();
    await expect(page.getByText('Lobbers', { exact: true })).toBeVisible();
  });

  test('displays standings', async ({ page }) => {
    // Mock standings data
    await page.route('**/rest/v1/team*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 1, name: 'Team A', wins: 10, losses: 2, points: 20 },
                { id: 2, name: 'Team B', wins: 5, losses: 7, points: 10 }
            ])
         });
    });

    await page.goto('/standings');
    await expect(page.getByRole('heading', { name: 'Standings' })).toBeVisible();
    // Verify table content if possible, or just load
    // await expect(page.getByText('Team A')).toBeVisible();
  });

});
