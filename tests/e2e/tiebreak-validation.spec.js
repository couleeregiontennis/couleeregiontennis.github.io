import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Tiebreak Validation', () => {

  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page);

    // Mock initial data loading
    await page.route('**/rest/v1/player*', async (route) => {
      const url = route.request().url();
      if (url.includes('id=eq')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'fake-user-id',
              first_name: 'John',
              last_name: 'Doe',
              is_captain: true,
              is_admin: true
            }),
          });
      } else {
          // Roster
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 'p1', first_name: 'Player', last_name: 'One', ranking: 1 },
                { id: 'p2', first_name: 'Player', last_name: 'Two', ranking: 2 }
            ]),
          });
      }
    });

    await page.route('**/rest/v1/player_to_team*', async (route) => {
      const url = route.request().url();
      if (url.includes('player=eq')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ team: 'fake-team-id' }),
          });
      } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { player: { id: 'p1', first_name: 'Player', last_name: 'One', ranking: 1 } },
                { player: { id: 'p2', first_name: 'Player', last_name: 'Two', ranking: 2 } }
            ]),
          });
      }
    });

    await page.route('**/rest/v1/team*', async (route) => {
       const url = route.request().url();
       if (url.includes('id=eq')) {
           await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'fake-team-id', name: 'My Team', number: 1 }),
          });
       } else if (url.includes('number=eq')) {
           const match = url.match(/number=eq\.(\d+)/);
           const number = match ? match[1] : '1';
           await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: `team-${number}`, number: parseInt(number), name: `Team ${number}` }),
          });
       }
    });

    await page.route('**/rest/v1/matches*', async (route) => {
       await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
            {
                id: 'match-1',
                home_team_name: 'My Team',
                home_team_number: 1,
                home_team_night: 'Monday',
                away_team_name: 'Opponent Team',
                away_team_number: 2,
                away_team_night: 'Monday',
                date: '2023-10-10',
                time: '18:00',
                courts: '1-2'
            }
        ]),
      });
    });

    await page.route('**/rest/v1/line_results*', async (route) => {
        if (route.request().method() === 'POST') {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'mock-id', status: 'success' }]),
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        }
    });

    await page.route('**/rest/v1/line_result_audit*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'audit-id' }]),
        });
    });

    await page.goto('/add-score');
    await page.selectOption('select[name="matchId"]', 'match-1');
    await page.locator('select[name="matchType"]').selectOption('singles');

    // Wait for players to load
    const playerSelect = page.locator('select').filter({ hasText: 'Select Player 1' }).first();
    await expect(playerSelect).toContainText('Player One');

    // Select valid players
    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);
    await homePlayer1.selectOption('Player One');
    await awayPlayer1.selectOption('Player Two');

    // Fill valid first two sets (split sets to require a 3rd set)
    const sets = page.locator('.score-group');
    await sets.nth(0).locator('select').nth(0).selectOption('6');
    await sets.nth(0).locator('select').nth(1).selectOption('4'); // 6-4 Home
    await sets.nth(1).locator('select').nth(0).selectOption('4');
    await sets.nth(1).locator('select').nth(1).selectOption('6'); // 4-6 Away
  });

  test('validates 3rd set tiebreak (first to 7)', async ({ page }) => {
    const sets = page.locator('.score-group');
    const set3 = sets.nth(2);

    // Test case 1: 5-5 (invalid, game not over)
    await set3.locator('select').nth(0).selectOption('5');
    await set3.locator('select').nth(1).selectOption('5');
    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toContainText(/Third set must be a valid tiebreak/);

    // Test case 2: 7-5 (valid)
    await set3.locator('select').nth(0).selectOption('7');
    await set3.locator('select').nth(1).selectOption('5');
    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toBeHidden();
    await expect(page.locator('.success-message')).toContainText(/Scores submitted successfully/);
  });

  test('validates 3rd set tiebreak win by 2', async ({ page }) => {
    const sets = page.locator('.score-group');
    const set3 = sets.nth(2);

    // Test case: 7-6 (invalid, must win by 2)
    await set3.locator('select').nth(0).selectOption('7');
    await set3.locator('select').nth(1).selectOption('6');
    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toContainText(/Third set must be a valid tiebreak/);
  });

  test('validates 3rd set tiebreak extended play', async ({ page }) => {
    const sets = page.locator('.score-group');
    const set3 = sets.nth(2);

    // Test case: 8-6 (valid)
    await set3.locator('select').nth(0).selectOption('8');
    await set3.locator('select').nth(1).selectOption('6');
    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toBeHidden();
    await expect(page.locator('.success-message')).toContainText(/Scores submitted successfully/);
  });

   test('validates 3rd set tiebreak target', async ({ page }) => {
    const sets = page.locator('.score-group');
    const set3 = sets.nth(2);

    // Test case: 6-4 (invalid, must reach 7)
    await set3.locator('select').nth(0).selectOption('6');
    await set3.locator('select').nth(1).selectOption('4');
    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toContainText(/Third set must be a valid tiebreak/);
  });
});
