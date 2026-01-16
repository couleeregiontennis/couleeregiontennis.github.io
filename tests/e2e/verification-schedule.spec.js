import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test('schedule screenshot', async ({ page }) => {
  // Disable navigator locks as per memory
  await disableNavigatorLocks(page);

  // Set fixed time so the month view shows the mocked matches
  await page.clock.install({ time: new Date('2023-10-01T12:00:00') });

  // Use a fixed viewport for consistency
  await page.setViewportSize({ width: 1280, height: 720 });

  // Mock data to ensure consistent screenshots
  await page.route('**/rest/v1/team*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Aces', number: 1 },
          { id: '2', name: 'Faults', number: 2 },
          { id: '3', name: 'Netters', number: 3 },
          { id: '4', name: 'Lobbers', number: 4 }
        ])
      });
  });

  await page.route('**/rest/v1/season*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'season-1',
          name: 'Summer 2023',
          start_date: '2023-05-01',
          end_date: '2023-12-31'
        }),
      });
  });

  await page.route('**/rest/v1/team_match*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            date: '2023-10-01',
            time: '18:00',
            home_team: { name: 'Aces', number: 1 },
            away_team: { name: 'Faults', number: 2 },
            courts: '1-3',
            status: 'upcoming',
            season_id: 'season-1'
          },
          {
            id: '2',
            date: '2023-10-02',
            time: '18:00',
            home_team: { name: 'Netters', number: 3 },
            away_team: { name: 'Lobbers', number: 4 },
            courts: '4-6',
            status: 'upcoming',
            season_id: 'season-1'
          }
        ]),
      });
  });

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Match Schedule');
  // Wait for content to load
  await expect(page.locator('.match-card').first()).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: 'verification/schedule-after.png', fullPage: true });
});
