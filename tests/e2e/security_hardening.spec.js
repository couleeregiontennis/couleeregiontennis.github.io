import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseData, disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Security Hardening Checks', () => {

  test.describe('Authenticated Pages', () => {
    test.beforeEach(async ({ page }) => {
        await mockSupabaseAuth(page);
        await mockSupabaseData(page, 'player', {
            id: 'fake-user-id',
            first_name: 'Test',
            last_name: 'User',
            is_captain: true,
            is_admin: false
        });
        await mockSupabaseData(page, 'team', { id: 'team-1', name: 'Test Team', number: 1 });
        await mockSupabaseData(page, 'player_to_team', { team: 'team-1' });
        await mockSupabaseData(page, 'matches', [{
            id: 'match-1',
            home_team_name: 'Test Team',
            away_team_name: 'Opponent',
            date: '2023-01-01',
            time: '18:00',
            courts: '1'
        }]);
        await disableNavigatorLocks(page);
    });

    test('AddScore notes textarea has maxLength', async ({ page }) => {
        await page.goto('/add-score');
        const notes = page.locator('textarea[name="notes"]');
        await expect(notes).toBeVisible();
        await expect(notes).toHaveAttribute('maxLength', '500');
        await page.screenshot({ path: 'verification/add_score.png' });
    });

    test('PlayerProfile inputs have maxLength', async ({ page }) => {
        await page.goto('/player-profile');
        await expect(page.getByRole('button', { name: 'Edit Profile' })).toBeVisible();
        await page.getByRole('button', { name: 'Edit Profile' }).click();

        const nameInput = page.locator('input#name');
        await expect(nameInput).toHaveAttribute('maxLength', '100');

        const phoneInput = page.locator('input#phone');
        await expect(phoneInput).toHaveAttribute('maxLength', '20');

        const emergencyName = page.locator('input#emergency_contact');
        await expect(emergencyName).toHaveAttribute('maxLength', '100');

        const emergencyPhone = page.locator('input#emergency_phone');
        await expect(emergencyPhone).toHaveAttribute('maxLength', '20');

        const notes = page.locator('textarea#notes');
        await expect(notes).toHaveAttribute('maxLength', '500');
        await page.screenshot({ path: 'verification/player_profile.png' });
    });
  });

  test.describe('Public Pages', () => {
    test.beforeEach(async ({ page }) => {
        await disableNavigatorLocks(page);
    });

    test('AskTheUmpire input has maxLength', async ({ page }) => {
        await page.goto('/');

        // Override the hiding style
        await page.addStyleTag({ content: '.umpire-trigger { display: block !important; }' });

        const button = page.getByRole('button', { name: 'Ask the Umpire' });
        await expect(button).toBeVisible();
        await button.click();

        const input = page.locator('.umpire-input');
        await expect(input).toBeVisible();
        await expect(input).toHaveAttribute('maxLength', '300');
        await page.screenshot({ path: 'verification/ask_umpire.png' });
    });
  });
});
