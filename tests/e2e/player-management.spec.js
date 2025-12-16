import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseData } from '../utils/auth-mock';

test.describe('Player Management', () => {
  const adminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
  };

  const players = [
    {
      id: 'player-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      ranking: 3,
      is_captain: false,
      is_active: true,
      day_availability: { monday: true },
    },
    {
      id: 'player-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      ranking: 4,
      is_captain: true,
      is_active: true,
      day_availability: { tuesday: true },
    },
  ];

  test.beforeEach(async ({ page }) => {
    // 1. Mock Auth
    await mockSupabaseAuth(page, adminUser);

    // 2. Mock 'player' table requests
    await page.route('**/rest/v1/player*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Check if it's a request for the current user's profile (role check)
      // AuthProvider calls .eq('id', user.id).single()
      if (method === 'GET' && url.includes(`id=eq.${adminUser.id}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: adminUser.id,
            is_captain: true,
            is_admin: true
          }),
        });
        return;
      }

      // Check if it's the request for all players (for the list)
      // This is usually a simple GET without ID filter
      if (method === 'GET' && !url.includes('id=eq.')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(players),
        });
        return;
      }

      // Check for Update (PATCH)
      if (method === 'PATCH') {
        const body = JSON.parse(route.request().postData());
        const match = url.match(/id=eq\.([^&]+)/);
        const id = match ? match[1] : null;

        if (id) {
            const original = players.find(p => p.id === id) || {};
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ...original, ...body }),
            });
            return;
        }
      }

      await route.continue();
    });

    await page.goto('/admin/player-management');
    // Hide floating elements that might intercept clicks on mobile
    await page.addStyleTag({ content: '.umpire-trigger { display: none !important; }' });
  });

  test('should display list of players', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Player Management' })).toBeVisible();
    await expect(page.getByText('Doe, John')).toBeVisible();
    await expect(page.getByText('Smith, Jane')).toBeVisible();
  });

  test('should edit a player', async ({ page }) => {
    // Click edit on the first player (John Doe)
    await page.locator('button.edit-btn').first().click();

    await expect(page.getByRole('heading', { name: 'Edit Player: John Doe' })).toBeVisible();

    // Change first name
    await page.getByLabel('First Name').fill('Johnny');

    // Save
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify success
    await expect(page.getByText('Player updated successfully!')).toBeVisible();

    // Verify list is updated (UI update)
    await expect(page.getByText('Doe, Johnny')).toBeVisible();
  });

  test('should filter players', async ({ page }) => {
    await page.getByPlaceholder('Search by name or email...').fill('Jane');
    await expect(page.getByText('Smith, Jane')).toBeVisible();
    await expect(page.getByText('Doe, John')).not.toBeVisible();
  });
});
