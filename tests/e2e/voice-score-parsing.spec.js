import { test, expect } from '@playwright/test';
import { mockSupabaseAuth } from '../utils/auth-mock';

const setupAuthAndData = async (page) => {
  await mockSupabaseAuth(page, { id: 'fake-user-id', email: 'captain@example.com' });

  // Player profile (AddScore) and role lookup (AuthProvider) both use the same id.
  await page.route('**/rest/v1/player*', async (route) => {
    const url = route.request().url();
    if (url.includes('id=eq.fake-user-id') || url.includes('user_id=eq.fake-user-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fake-user-id',
          user_id: 'fake-user-id',
          first_name: 'Captain',
          last_name: 'Test',
          is_captain: true,
          is_admin: true,
        }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/player_to_team*', async (route) => {
    const url = route.request().url();
    if (url.includes('player=eq.fake-user-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ team: 'fake-team-id' }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.route('**/rest/v1/team*', async (route) => {
    const url = route.request().url();
    if (url.includes('id=eq.fake-team-id')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'fake-team-id', name: 'My Team', number: 1 }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'team-1', number: 1, name: 'Team 1' }),
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
          courts: '1-2',
        },
      ]),
    });
  });

  await page.route('**/rest/v1/line_results*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
};

const injectSpeechRecognitionMock = async (page) => {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = true;
        this.lang = 'en-US';
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() {
        if (this.onstart) this.onstart();
        setTimeout(() => {
          if (this.onresult) {
            this.onresult({
              resultIndex: 0,
              results: [[{ transcript: 'Line one doubles, six four, six two', isFinal: true }]],
            });
          }
          if (this.onend) this.onend();
        }, 50);
      }
      stop() {
        if (this.onend) this.onend();
      }
    }
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });
};

test.describe('Voice score parsing', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthAndData(page);
    await injectSpeechRecognitionMock(page);
  });

  test('populates score fields from a successful voice parse', async ({ page }) => {
    await page.route('**/functions/v1/parse-score', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          lineNumber: 1,
          matchType: 'doubles',
          homeSet1: 6,
          awaySet1: 4,
          homeSet2: 6,
          awaySet2: 2,
          homeSet3: null,
          awaySet3: null,
          notes: '',
        }),
      });
    });

    await page.goto('/add-score');
    await expect(page.locator('text=Submit Match Scores')).toBeVisible();

    await page.locator('.microphone-button').click();
    await expect(page.locator('.success-message')).toContainText('Transcript parsed successfully');

    const scoreSelects = page.locator('.score-inputs select');
    await expect(scoreSelects.nth(0)).toHaveValue('6'); // homeSet1
    await expect(scoreSelects.nth(1)).toHaveValue('4'); // awaySet1
    await expect(scoreSelects.nth(2)).toHaveValue('6'); // homeSet2
    await expect(scoreSelects.nth(3)).toHaveValue('2'); // awaySet2
  });

  test('shows an actionable network error when the parsing service cannot be reached', async ({ page }) => {
    await page.route('**/functions/v1/parse-score', (route) => route.abort());

    await page.goto('/add-score');
    await expect(page.locator('text=Submit Match Scores')).toBeVisible();

    await page.locator('.microphone-button').click();
    await expect(page.locator('.error-message')).toContainText('Could not reach the score parsing service');
  });

  test('shows an actionable server error when the parsing service returns 500', async ({ page }) => {
    await page.route('**/functions/v1/parse-score', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to process transcript with AI', details: 'model unavailable' }),
      });
    });

    await page.goto('/add-score');
    await expect(page.locator('text=Submit Match Scores')).toBeVisible();

    await page.locator('.microphone-button').click();
    await expect(page.locator('.error-message')).toContainText('Server error');
  });
});
