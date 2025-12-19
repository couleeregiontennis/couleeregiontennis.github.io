import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseData } from '../utils/auth-mock';

test.describe('Admin Access Control', () => {
  test('Captain (non-admin) cannot access Audit Log Viewer', async ({ page }) => {
    // 1. Mock Auth
    await mockSupabaseAuth(page, { id: 'captain-user' });

    // 2. Mock Player Data (Captain but NOT Admin)
    await mockSupabaseData(page, 'player', [
      {
        id: 'captain-user',
        first_name: 'Captain',
        last_name: 'Hook',
        is_captain: true,
        is_admin: false,
        email: 'captain@example.com'
      }
    ]);

    // 3. Navigate to Audit Log Viewer
    await page.goto('/admin/audit-logs');

    // 4. Verification
    await expect(page).toHaveURL('/');
  });

  test('Captain (non-admin) cannot access Player Management', async ({ page }) => {
    await mockSupabaseAuth(page, { id: 'captain-user' });

    await mockSupabaseData(page, 'player', [
      {
        id: 'captain-user',
        first_name: 'Captain',
        last_name: 'Hook',
        is_captain: true,
        is_admin: false,
        email: 'captain@example.com'
      }
    ]);

    await page.goto('/admin/player-management');
    await expect(page).toHaveURL('/');
  });
});
