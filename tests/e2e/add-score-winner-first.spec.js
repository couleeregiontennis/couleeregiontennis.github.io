import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

test.describe('Add Score Winner-First Ordering and Cross-Match Persistence', () => {
  const setupMocks = async (page) => {
    await mockSupabaseAuth(page);

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
          body: JSON.stringify({ id: `team-${number}`, number: parseInt(number, 10), name: `Team ${number}` }),
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
          },
          {
            id: 'match-2',
            home_team_name: 'My Team',
            home_team_number: 1,
            home_team_night: 'Monday',
            away_team_name: 'Opponent Team',
            away_team_number: 2,
            away_team_night: 'Monday',
            date: '2023-10-17',
            time: '18:00',
            courts: '3-4'
          }
        ]),
      });
    });

    await page.route('**/rest/v1/line_results*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });
  };

  const fillSet = async (page, setIndex, winnerTeam, winnerScore, loserScore) => {
    const sets = page.locator('.score-group');
    const set = sets.nth(setIndex);
    await set.locator('select').nth(0).selectOption(winnerTeam);
    await set.locator('select').nth(1).selectOption(winnerScore.toString());
    await set.locator('select').nth(2).selectOption(loserScore.toString());
  };

  const getSetValues = async (page, setIndex) => {
    const sets = page.locator('.score-group');
    const set = sets.nth(setIndex);
    const winnerTeam = await set.locator('select').nth(0).inputValue();
    const winnerScore = await set.locator('select').nth(1).inputValue();
    const loserScore = await set.locator('select').nth(2).inputValue();
    return { winnerTeam, winnerScore, loserScore };
  };

  const selectPlayers = async (page) => {
    await page.locator('select[name="matchType"]').selectOption('singles');
    const playerSelect = page.locator('select').filter({ hasText: 'Select Player 1' }).first();
    await expect(playerSelect).toContainText('Player One');
    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);
    await homePlayer1.selectOption('Player One');
    await awayPlayer1.selectOption('Player Two');
    return { homePlayer1, awayPlayer1 };
  };

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page Console Error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.error(`Page Uncaught Exception: ${err.message}`);
    });
    await setupMocks(page);
    await page.goto('/add-score');
  });

  test('uses winner-first score inputs and labels', async ({ page }) => {
    await page.selectOption('select[name="matchId"]', 'match-1');
    await selectPlayers(page);

    const sets = page.locator('.score-group');
    const set1 = sets.nth(0);

    await expect(set1.locator('select').nth(1)).toContainText('Winner');
    await expect(set1.locator('select').nth(2)).toContainText('Loser');

    await set1.locator('select').nth(0).selectOption('away');
    await set1.locator('select').nth(1).selectOption('6');
    await set1.locator('select').nth(2).selectOption('4');

    await fillSet(page, 1, 'away', 6, 2);

    await expect(page.locator('.match-winner')).toContainText('Player Two');
  });

  test('preserves unsaved scores when switching between matches on different courts', async ({ page }) => {
    await page.selectOption('select[name="matchId"]', 'match-1');
    await selectPlayers(page);
    await fillSet(page, 0, 'away', 6, 4);
    await fillSet(page, 1, 'away', 6, 2);

    await page.selectOption('select[name="matchId"]', 'match-2');
    await selectPlayers(page);
    await fillSet(page, 0, 'home', 7, 5);
    await fillSet(page, 1, 'home', 6, 3);

    await page.selectOption('select[name="matchId"]', 'match-1');

    const sets = page.locator('.score-group');
    await expect(sets.nth(0).locator('select').nth(0)).toHaveValue('away');
    await expect(sets.nth(0).locator('select').nth(1)).toHaveValue('6');
    await expect(sets.nth(0).locator('select').nth(2)).toHaveValue('4');

    await expect(sets.nth(1).locator('select').nth(0)).toHaveValue('away');
    await expect(sets.nth(1).locator('select').nth(1)).toHaveValue('6');
    await expect(sets.nth(1).locator('select').nth(2)).toHaveValue('2');

    const homePlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(0);
    const awayPlayer1 = page.locator('select').filter({ hasText: 'Select Player 1' }).nth(1);
    await expect(homePlayer1).toHaveValue('Player One');
    await expect(awayPlayer1).toHaveValue('Player Two');
  });

  test('submits winner-first scores with correct home/away mapping', async ({ page }) => {
    let capturedPayload = null;

    await page.route('**/rest/v1/line_results*', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postData();
        capturedPayload = JSON.parse(body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'mock-line-result-id', status: 'success' }]),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/rest/v1/line_result_audit*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'audit-id' }]),
      });
    });

    await page.selectOption('select[name="matchId"]', 'match-1');
    await selectPlayers(page);

    await fillSet(page, 0, 'away', 6, 4);
    await fillSet(page, 1, 'away', 6, 2);

    await page.getByRole('button', { name: 'Submit Scores' }).click();

    await expect(page.locator('.success-message')).toContainText(/Scores submitted successfully/);

    expect(capturedPayload).toBeTruthy();
    const payload = Array.isArray(capturedPayload) ? capturedPayload[0] : capturedPayload;
    expect(payload.home_set_1).toBe(4);
    expect(payload.away_set_1).toBe(6);
    expect(payload.home_set_2).toBe(2);
    expect(payload.away_set_2).toBe(6);
    expect(payload.home_won).toBe(false);
  });

  test('rejects winner-first scores where the loser games exceed winner games', async ({ page }) => {
    await page.selectOption('select[name="matchId"]', 'match-1');
    await selectPlayers(page);

    await fillSet(page, 0, 'home', 4, 6);
    await fillSet(page, 1, 'home', 6, 2);

    await page.getByRole('button', { name: 'Submit Scores' }).click();

    await expect(page.locator('.error-message')).toContainText(/Sets 1 and 2 must be valid tennis scores/);
  });
});

