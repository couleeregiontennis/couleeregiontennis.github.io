const { test, expect } = require('@playwright/test');

test('Check mobile nav dropdown', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3001/index.html');
  
  // Click hamburger
  await page.click('.navbar-toggle');
  
  // Wait for menu to appear
  await page.waitForSelector('.navbar-menu.active');
  
  // Check dropdown
  const dropdown = await page.locator('.dropdown-menu');
  const display = await dropdown.evaluate(el => window.getComputedStyle(el).display);
  console.log('Dropdown display:', display);
  
  const text = await page.locator('.navbar-menu').innerText();
  console.log('Menu text:', text);
});
