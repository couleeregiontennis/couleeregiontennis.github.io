import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Team & Rankings (Public)', () => {

  test('Player Rankings page loads', async ({ page }) => {
    // Mock players data
    await page.route('**/rest/v1/player*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
            { id: 'p1', first_name: 'Roger', last_name: 'Federer', ranking: 1, dynamic_rating: 5.0 },
            { id: 'p2', first_name: 'Rafael', last_name: 'Nadal', ranking: 2, dynamic_rating: 4.9 }
        ]),
      });
    });

    await page.goto('/player-rankings');
    await expect(page.getByRole('heading', { name: 'Player Rankings' })).toBeVisible();
    await expect(page.getByText('Roger Federer')).toBeVisible();
    await expect(page.getByText('Rafael Nadal')).toBeVisible();
  });

  test('Team Details page loads', async ({ page }) => {
    // Mock specific team fetch
    // Route: /team/:day/:teamId
    // App uses: select('*').eq('id', teamId).single()
    await page.route('**/rest/v1/team?id=eq.team-1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'team-1', name: 'The Aces', captain: 'Cap One', home_courts: 'Central Park' }),
      });
    });

    // Mock Roster (player_to_team -> player)
    await page.route('**/rest/v1/player_to_team?select=*,player(*)&team=eq.team-1*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { player: { id: 'p1', first_name: 'Player', last_name: 'One', ranking: 1 } },
                { player: { id: 'p2', first_name: 'Player', last_name: 'Two', ranking: 2 } }
            ]),
        });
    });

    // Mock Matches for team
    await page.route('**/rest/v1/matches*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/team/Monday/team-1');
    await expect(page.getByRole('heading', { name: 'The Aces' })).toBeVisible();
    await expect(page.getByText('Central Park')).toBeVisible();
    // Check roster
    await expect(page.getByText('Player One')).toBeVisible();
  });

});
