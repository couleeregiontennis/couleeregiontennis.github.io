import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseData } from '../utils/auth-mock';

test.describe('Public Pages', () => {

  test('Landing Page loads correctly', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveTitle(/LTTA App/);
    await expect(page.getByRole('heading', { name: 'Welcome to LTTA' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
  });

  test('Rules page content', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.getByRole('heading', { name: 'Rules' })).toBeVisible();
  });

  test('Courts & Locations page', async ({ page }) => {
    await page.goto('/courts-locations');
    await expect(page.getByRole('heading', { name: 'Courts & Locations' })).toBeVisible();
  });

  test('Player Resources page', async ({ page }) => {
    await page.goto('/player-resources');
    await expect(page.getByRole('heading', { name: 'Player Resources' })).toBeVisible();
  });

  test('404 Page', async ({ page }) => {
    await page.goto('/some-non-existent-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Teams/ })).toBeVisible();
  });

});
