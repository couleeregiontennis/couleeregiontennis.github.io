import { test, expect } from '@playwright/test';
import { disableNavigatorLocks } from '../utils/auth-mock';

test.describe('Ask the Umpire Security', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Disable locks to prevent hanging
    await disableNavigatorLocks(page);

    // Load page first
    await page.goto('/');

    // 2. Remove the style injected by disableNavigatorLocks that hides the button
    await page.evaluate(() => {
      const styles = document.querySelectorAll('style');
      styles.forEach(s => {
        if (s.innerHTML.includes('.umpire-trigger')) {
          console.log('Removing style:', s.innerHTML);
          s.remove();
        }
      });
    });
  });

  test('Input enforces character limit and shows counter', async ({ page }) => {
    // Debug info
    const count = await page.locator('.umpire-trigger').count();
    console.log(`Found ${count} triggers`);

    const isVisible = await page.locator('.umpire-trigger').isVisible();
    console.log(`Is visible: ${isVisible}`);

    if (!isVisible) {
         // Force show it
         await page.evaluate(() => {
             const btn = document.querySelector('.umpire-trigger');
             if (btn) btn.style.display = 'block';
         });
    }

    // Open the widget
    await page.locator('.umpire-trigger').click();

    const input = page.getByPlaceholder('e.g., Can I play down a level?');

    // Check for maxLength attribute
    await expect(input).toHaveAttribute('maxLength', '300');

    // Check for character counter
    // I'll assume the ID will be "umpire-query-counter"
    await expect(input).toHaveAttribute('aria-describedby', 'umpire-query-counter');

    // Check counter visibility
    const counter = page.locator('#umpire-query-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('/ 300');

    // Type and check counter update
    await input.fill('Hello');
    await expect(counter).toContainText('5 / 300');
  });
});
