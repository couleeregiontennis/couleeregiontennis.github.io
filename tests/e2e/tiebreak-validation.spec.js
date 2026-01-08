import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Add Score - Tiebreak Logic', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Mock Auth (User Login)
    await mockSupabaseAuth(page);

    // 2. Mock Initial Data Loading
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
          // Roster details
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
          // Roster fetch
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { player: { id: 'p1', first_name: 'Player', last_name: 'One', email: 'p1@test.com', ranking: 1 } },
                { player: { id: 'p2', first_name: 'Player', last_name: 'Two', email: 'p2@test.com', ranking: 2 } }
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
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    await page.goto('/add-score');
    await page.selectOption('select[name="matchId"]', 'match-1');
    await page.locator('select[name="matchType"]').selectOption('singles');

    // Select players
    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);
    await homePlayer1.selectOption('Player One');
    await awayPlayer1.selectOption('Player Two');

    // Set Sets 1 and 2 to split sets so we can test the 3rd set tiebreak
    const sets = page.locator('.score-group');
    const set1 = sets.nth(0);
    const set2 = sets.nth(1);

    await set1.locator('select').nth(0).selectOption('6');
    await set1.locator('select').nth(1).selectOption('4'); // Home wins set 1

    await set2.locator('select').nth(0).selectOption('4');
    await set2.locator('select').nth(1).selectOption('6'); // Away wins set 2
  });

  test('validates 3rd set tiebreak (first to 7, win by 2)', async ({ page }) => {
    const sets = page.locator('.score-group');
    const set3 = sets.nth(2);
    const submitBtn = page.getByRole('button', { name: 'Submit Scores' });
    const errorMessage = page.locator('.error-message');

    // Scenario: 7-5 (Valid)
    await set3.locator('select').nth(0).selectOption('7');
    await set3.locator('select').nth(1).selectOption('5');

    // Mock successful submission
    await page.route('**/rest/v1/line_results*', async (route) => {
       // Must match post
       if (route.request().method() === 'POST') {
           await route.fulfill({ status: 201, body: JSON.stringify([{ id: 'new-score' }]) });
       } else {
           // For GET requests (loading existing scores), return empty or existing
           await route.fulfill({ status: 200, body: JSON.stringify([]) });
       }
    });

    await page.route('**/rest/v1/line_result_audit*', async (route) => {
        await route.fulfill({ status: 201, body: JSON.stringify({}) });
    });

    await submitBtn.click();
    await expect(errorMessage).toBeHidden();
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('enforces correct error message for invalid tiebreak', async ({ page }) => {
     const sets = page.locator('.score-group');
     const set3 = sets.nth(2);
     const submitBtn = page.getByRole('button', { name: 'Submit Scores' });
     const errorMessage = page.locator('.error-message');

     // Try an invalid score: 5-5
     await set3.locator('select').nth(0).selectOption('5');
     await set3.locator('select').nth(1).selectOption('5');
     await submitBtn.click();

     await expect(errorMessage).toBeVisible();
     await expect(errorMessage).toContainText('Third set must be a valid tiebreak (first to 7, win by 2) or blank');
  });
});
