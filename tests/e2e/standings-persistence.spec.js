import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Standings Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await disableNavigatorLocks(page);
  });

  test('persists league night filter selection', async ({ page }) => {
    // Mock standings view data
    await page.route('**/rest/v1/standings_view*', async (route) => {
         await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { team_id: 1, team_name: 'Team A', team_number: '1', wins: 10, losses: 2, points: 20, play_night: 'Monday', matches_played: 12, sets_won: 20, sets_lost: 4, games_won: 120, games_lost: 40, win_percentage: 83.3, set_win_percentage: 83.3 },
                { team_id: 2, team_name: 'Team B', team_number: '2', wins: 5, losses: 7, points: 10, play_night: 'Tuesday', matches_played: 12, sets_won: 10, sets_lost: 14, games_won: 60, games_lost: 70, win_percentage: 41.7, set_win_percentage: 41.7 }
            ])
         });
    });

    // Mock matches for recent matches
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Mock player count
     await page.route('**/rest/v1/player*', async (route) => {
        // Handle HEAD request for count
        if (route.request().method() === 'HEAD') {
             await route.fulfill({
                status: 200,
                headers: {
                    'Content-Range': '0-10/10'
                }
             });
        } else {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
             });
        }
    });

    await page.goto('/standings');

    // Select 'Tuesday' filter
    // Wait for the button to be visible to avoid timeout if loading takes time
    const tuesdayButton = page.getByRole('button', { name: 'Tuesday' });
    await expect(tuesdayButton).toBeVisible();
    await tuesdayButton.click();

    // Verify filter is active
    await expect(tuesdayButton).toHaveClass(/active/);

    // Reload page
    await page.reload();

    // Verify 'Tuesday' filter is still active
    // This assertion verifies that persistence is working
    await expect(page.getByRole('button', { name: 'Tuesday' })).toHaveClass(/active/);
  });
});
