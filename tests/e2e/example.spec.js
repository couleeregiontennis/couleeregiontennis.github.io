import { test, expect } from '@playwright/test';

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
