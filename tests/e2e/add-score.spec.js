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
        // Add delay for POST/PUT/PATCH to verify loading state
        if (['POST', 'PUT', 'PATCH'].includes(route.request().method())) {
            await new Promise(r => setTimeout(r, 3000));
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'mock-id' }]), // Return dummy row for select()
        });
    });

    await page.route('**/rest/v1/line_result_audit*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // We rely on mockSupabaseAuth injecting the session into localStorage.
    // No need for manual login steps here as they are slow and prone to UI changes.

    await page.goto('/add-score');
  });

  test('loads and allows match selection', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Submit Match Scores' })).toBeVisible();
    await expect(page.getByText('My Team', { exact: true })).toBeVisible();

    // Verify accessibility: inputs should be accessible by label
    await expect(page.getByLabel('Available Matches')).toBeVisible();
    await expect(page.getByLabel('Line Number')).toBeVisible();
    await expect(page.getByLabel('Match Type')).toBeVisible();

    // Wait for the select to populate
    const matchSelect = page.getByLabel('Available Matches');
    await expect(matchSelect).toBeVisible();
    await expect(matchSelect).toContainText('My Team vs Opponent Team');

    await page.screenshot({ path: 'frontend_verification_results/add_score_initial.png' });
  });

  test('validates invalid tennis scores', async ({ page }) => {
    // Select match
    await page.getByLabel('Available Matches').selectOption('match-1');

    // Wait for roster loading (indicated by players appearing or select being enabled)
    // We can select match type
    await page.getByLabel('Match Type').selectOption('singles');

    // Wait for player selects to populate with mock data
    await expect(page.getByLabel('Home Player 1')).toContainText('Player One');

    // Set invalid score for Set 1
    await page.getByLabel('Set 1 Home Score').selectOption('5');
    await page.getByLabel('Set 1 Away Score').selectOption('5');

    // Set valid score for Set 2 (required field)
    await page.getByLabel('Set 2 Home Score').selectOption('6');
    await page.getByLabel('Set 2 Away Score').selectOption('4');

    // Select players to pass that validation
    await page.getByLabel('Home Player 1').selectOption('Player One');
    await page.getByLabel('Away Player 1').selectOption('Player Two'); // Valid players

    await page.getByRole('button', { name: 'Submit Scores' }).click();
    await expect(page.locator('.error-message')).toContainText(/Sets 1 and 2 must be valid tennis scores/);
  });

  test('validates unique players', async ({ page }) => {
     await page.getByLabel('Available Matches').selectOption('match-1');
     await page.getByLabel('Match Type').selectOption('singles');

     // Wait for players to load
     await expect(page.getByLabel('Home Player 1')).toContainText('Player One');

     await page.getByLabel('Home Player 1').selectOption('Player One');
     await page.getByLabel('Away Player 1').selectOption('Player One'); // Duplicate player

     // Fill required scores (can be valid)
     await page.getByLabel('Set 1 Home Score').selectOption('6');
     await page.getByLabel('Set 1 Away Score').selectOption('4');
     await page.getByLabel('Set 2 Home Score').selectOption('6');
     await page.getByLabel('Set 2 Away Score').selectOption('4');

     await page.getByRole('button', { name: 'Submit Scores' }).click();
     await expect(page.locator('.error-message')).toContainText(/Players cannot appear on both sides/);
  });

  test('shows loading spinner during submission', async ({ page }) => {
     await page.getByLabel('Available Matches').selectOption('match-1');
     await page.getByLabel('Match Type').selectOption('singles');

     // Fill valid form data
     await page.getByLabel('Home Player 1').selectOption('Player One');
     await page.getByLabel('Away Player 1').selectOption('Player Two');

     // Scores
     await page.getByLabel('Set 1 Home Score').selectOption('6');
     await page.getByLabel('Set 1 Away Score').selectOption('0');
     await page.getByLabel('Set 2 Home Score').selectOption('6');
     await page.getByLabel('Set 2 Away Score').selectOption('0');

     // Submit
     const submitButton = page.getByRole('button', { name: 'Submit Scores' });
     await submitButton.click();

     // Verify loading state
     const submitBtn = page.locator('.submit-button');
     await expect(submitBtn).toBeVisible();
     await expect(submitBtn).toContainText('Submitting...');
     await expect(submitBtn.locator('.loading-spinner')).toBeVisible();
     await page.screenshot({ path: 'frontend_verification_results/add_score_loading.png' });

     if (await page.locator('.error-message').isVisible()) {
        console.log('Submission Error:', await page.locator('.error-message').textContent());
     }

     await expect(page.locator('.success-message')).toContainText(/submitted successfully/, { timeout: 10000 });
     await page.screenshot({ path: 'frontend_verification_results/add_score_success.png' });
  });

});
