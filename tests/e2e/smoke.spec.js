import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.beforeEach(async ({ page }) => {
  await disableNavigatorLocks(page);
});

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/LTTA App/);
});

test('loads the app', async ({ page }) => {
  await page.goto('/');

  // Expect the root element to be visible
  await expect(page.locator('#root')).toBeVisible();
});
