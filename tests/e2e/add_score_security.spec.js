import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Add Score Security Checks', () => {

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
  });

  test('enforces input limits on notes field', async ({ page }) => {
    // Select match to reveal form
    await page.selectOption('select[name="matchId"]', 'match-1');

    const notesArea = page.locator('textarea[name="notes"]');
    await expect(notesArea).toBeVisible();

    // Check for maxLength
    await expect(notesArea).toHaveAttribute('maxLength', '500');

    // Check for aria-describedby
    await expect(notesArea).toHaveAttribute('aria-describedby', 'notes-counter');

    // Check for counter
    const counter = page.locator('#notes-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('0 / 500 characters');

    // Type some text and check counter updates
    await notesArea.fill('Hello');
    await expect(counter).toContainText('5 / 500 characters');
  });

});
