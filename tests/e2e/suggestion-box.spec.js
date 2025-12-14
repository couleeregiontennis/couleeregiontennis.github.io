import { test, expect } from '@playwright/test';

test.describe('Suggestion Box', () => {
  test('should render the suggestion box page', async ({ page }) => {
    await page.goto('/feedback');

    await expect(page.getByRole('heading', { name: 'Anonymous Suggestion Box' })).toBeVisible();
    await expect(page.getByLabel('Your Suggestion (10-1000 characters)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('should validate input length', async ({ page }) => {
    await page.goto('/feedback');

    const textarea = page.getByLabel('Your Suggestion (10-1000 characters)');
    await textarea.fill('Short');

    // Button should still be disabled because of length check (and captcha)
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();

    await textarea.fill('This is a valid suggestion length that is over 10 characters.');

    // Button still disabled because of captcha
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
