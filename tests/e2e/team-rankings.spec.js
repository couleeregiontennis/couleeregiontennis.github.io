import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Team & Rankings (Public)', () => {
  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
  });

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
    // Use integer ID in URL because component uses parseInt
    const teamId = '1';

    // 1. Team fetch: select=id,name & number=eq.1
    await page.route('**/rest/v1/team?select=id%2Cname&number=eq.1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'team-uuid-1', name: 'The Aces' }),
      });
    });

    // 2. Schedule fetch (matches table)
    await page.route('**/rest/v1/matches*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // 3. Roster IDs fetch: player_to_team?select=player&team=eq.team-uuid-1
    await page.route('**/rest/v1/player_to_team?select=player&team=eq.team-uuid-1*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { player: 'p1' },
                { player: 'p2' }
            ]),
        });
    });

    // 4. Roster details fetch: player?select=...&id=in.(p1,p2)
    // Note: URL encoded parenthesis %28 %29
    await page.route('**/rest/v1/player?select=id%2Cfirst_name%2Clast_name%2Cis_captain&id=in.%28p1%2Cp2%29*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 'p1', first_name: 'Player', last_name: 'One', is_captain: true },
                { id: 'p2', first_name: 'Player', last_name: 'Two', is_captain: false }
            ]),
        });
    });

    // 5. Match Results fetch (team_match) - empty for now
    await page.route('**/rest/v1/team_match*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/team/Monday/1');
    await expect(page.getByRole('heading', { name: 'The Aces' })).toBeVisible();
    // Check roster
    await expect(page.getByText('Player One')).toBeVisible();
  });

});
