import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Admin Match Result Override', () => {
  const adminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
  };

  test.beforeEach(async ({ page }) => {
    // Set the clock to Oct 2023 so the mocked match (Oct 1) is visible in the default "Month" view
    await page.clock.install({ time: new Date('2023-10-15T12:00:00') });

    // 1. Setup Auth (Admin)
    await mockSupabaseAuth(page, adminUser);

    // 2. Mock season
    await page.route('**/rest/v1/season*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'season-1',
          name: 'Fall 2023',
          start_date: '2023-09-01',
          end_date: '2023-12-31'
        })
      });
    });

    // 3. Mock 'player' table to confirm Admin role
    await page.route('**/rest/v1/player*', async (route) => {
      // Force return admin for any player query to rule out ID mismatch
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-user-id',
          name: 'Admin User',
          is_admin: true,
          is_captain: false
        }),
      });
    });

    // 4. Mock teams
    await page.route('**/rest/v1/team*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'team-1', name: 'Home Team', number: 1, play_night: 'Tuesday' },
          { id: 'team-2', name: 'Away Team', number: 2, play_night: 'Tuesday' }
        ]),
      });
    });

    // 5. Mock matches - MatchSchedule.jsx uses team_match with nested relations
    await page.route('**/rest/v1/team_match*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'match-1',
            date: '2023-10-01',
            time: '18:00',
            status: 'completed', // Important: status completed
            courts: '1-3',
            home_team: { id: 'team-1', name: 'Home Team', number: 1 },
            away_team: { id: 'team-2', name: 'Away Team', number: 2 }
          }
        ]),
      });
    });
  });

  test('Admin sees Edit button on completed match results', async ({ page }) => {
    await page.goto('/schedule');

    // Wait for the match to be visible
    // Use first() or specific locator to avoid strict mode violation with the filter dropdown option
    await expect(page.locator('.team-name').getByText('Home Team')).toBeVisible();
    await expect(page.locator('.team-name').getByText('Away Team')).toBeVisible();
    await expect(page.getByText('Final score submitted')).toBeVisible();

    // Now check for the Edit button.
    // It should be visible because we are logged in as Admin.
    // Use the class selector as fallback if getByRole is strict/flaky for some reason,
    // although getByRole is preferred.
    await expect(page.locator('.edit-result-btn')).toBeVisible();
  });

  test('Non-Admin does NOT see Edit button', async ({ page }) => {
      // Re-mock auth as non-admin for this test
      const regularUser = { id: 'reg-user', email: 'reg@example.com' };
      await mockSupabaseAuth(page, regularUser);

      await page.route('**/rest/v1/player*', async (route) => {
          // ... return non-admin
           const url = route.request().url();
          if (url.includes('id=eq.reg-user')) {
            // AuthProvider uses .single() so we must return an object, not an array
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                id: 'reg-user',
                name: 'Reg User',
                is_admin: false,
                is_captain: false
              }),
            });
          } else {
             // For .select() queries that might expect arrays (though .single might fail if called incorrectly)
             // But the else block here is generic. If AuthProvider calls it with .single(), this [] might fail it.
             // But for reg-user we are safe.
             await route.fulfill({ status: 200, body: '[]' });
          }
      });

      await page.goto('/schedule');
      await expect(page.locator('.team-name').getByText('Home Team')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit Result' })).not.toBeVisible();
  });
});
