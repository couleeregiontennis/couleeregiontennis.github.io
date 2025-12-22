import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('UX: Add Score Spinner', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await mockSupabaseAuth(page);

    // Mock Initial Data Loading
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
        if (route.request().method() === 'POST') {
             // Delay response to check for spinner
             console.log('Intercepted POST line_results');
             await new Promise(resolve => setTimeout(resolve, 5000));
             await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'new-score-id' }]),
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
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'audit-id' }]),
        });
    });

    await page.goto('/add-score');
  });

  test('shows loading spinner during submission', async ({ page }) => {
    // Select match
    await page.selectOption('select[name="matchId"]', 'match-1');

    // Select match type
    await page.locator('select[name="matchType"]').selectOption('singles');

    // Select players
    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);
    await homePlayer1.selectOption('Player One');
    await awayPlayer1.selectOption('Player Two');

    // Fill scores
    const sets = page.locator('.score-group');
    const set1 = sets.nth(0);
    await set1.locator('select').nth(0).selectOption('6');
    await set1.locator('select').nth(1).selectOption('4');
    const set2 = sets.nth(1);
    await set2.locator('select').nth(0).selectOption('6');
    await set2.locator('select').nth(1).selectOption('4');

    // Click submit
    const submitBtn = page.locator('button[type="submit"]');

    // Start submission
    const submitPromise = submitBtn.click();

    // Wait for button to be disabled and show loading text
    // await page.waitForTimeout(500); // Give React time to render
    await expect(submitBtn).toBeDisabled();
    await expect(submitBtn).toContainText('Submitting...');

    // Check for spinner
    // The spinner has class 'loading-spinner'
    await expect(submitBtn.locator('.loading-spinner')).toBeVisible();

    // Take a screenshot of the loading state
    await page.screenshot({ path: 'add-score-loading.png' });

    // Wait for submission to complete
    await submitPromise;
  });
});
