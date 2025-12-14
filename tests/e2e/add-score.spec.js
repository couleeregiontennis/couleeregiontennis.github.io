import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Add Score Page (Protected)', () => {

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
            body: JSON.stringify({ id: 'fake-user-id', first_name: 'John', last_name: 'Doe' }),
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
                { player: 'p1' }, { player: 'p2' }
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

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // Use toBeAttached() because on mobile the logout button is in the menu (hidden by default)
    await expect(page.getByText('Logout')).toBeAttached();
  });

  test('loads and allows match selection', async ({ page }) => {
    await page.goto('/add-score');
    await expect(page.getByRole('heading', { name: 'Submit Match Scores' })).toBeVisible();
    await expect(page.getByText('My Team', { exact: true })).toBeVisible();

    // Wait for the select to populate
    const matchSelect = page.locator('select[name="matchId"]');
    await expect(matchSelect).toBeVisible();
    await expect(matchSelect).toContainText('My Team vs Opponent Team');
  });

  test('validates invalid tennis scores', async ({ page }) => {
    await page.goto('/add-score');

    // Select match
    await page.selectOption('select[name="matchId"]', 'match-1');

    // Wait for roster loading (indicated by players appearing or select being enabled)
    // We can select match type
    await page.locator('select[name="matchType"]').selectOption('singles');

    // Wait for player selects to populate with mock data
    // Use first() or nth(0) for "Home Players" -> "Player 1"
    const playerSelect = page.locator('select').filter({ hasText: 'Select Player 1' }).first();
    await expect(playerSelect).toContainText('Player One');

    // Set invalid score for Set 1
    const sets = page.locator('.score-group');
    const set1 = sets.nth(0);
    await set1.locator('select').nth(0).selectOption('5');
    await set1.locator('select').nth(1).selectOption('5');

    // Set valid score for Set 2 (required field)
    const set2 = sets.nth(1);
    await set2.locator('select').nth(0).selectOption('6');
    await set2.locator('select').nth(1).selectOption('4');

    // Select players to pass that validation
    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);

    await homePlayer1.selectOption('Player One');
    await awayPlayer1.selectOption('Player Two'); // Valid players

    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toContainText(/Sets 1 and 2 must be valid tennis scores/);
  });

  test('validates unique players', async ({ page }) => {
     await page.goto('/add-score');
     await page.selectOption('select[name="matchId"]', 'match-1');
     await page.locator('select[name="matchType"]').selectOption('singles');

     // Wait for players to load
     const playerSelect = page.locator('select').filter({ hasText: 'Select Player 1' }).first();
     await expect(playerSelect).toContainText('Player One');

     const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
     const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);

     await homePlayer1.selectOption('Player One');
     await awayPlayer1.selectOption('Player One'); // Duplicate player

     // Fill required scores (can be valid)
     const sets = page.locator('.score-group');
     const set1 = sets.nth(0);
     await set1.locator('select').nth(0).selectOption('6');
     await set1.locator('select').nth(1).selectOption('4');
     const set2 = sets.nth(1);
     await set2.locator('select').nth(0).selectOption('6');
     await set2.locator('select').nth(1).selectOption('4');

     await page.getByRole('button', { name: 'Submit Scores' }).click();
     await expect(page.locator('.error-message')).toContainText(/Players cannot appear on both sides/);
  });

});
