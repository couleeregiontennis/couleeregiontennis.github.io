const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3001/index.html');
  
  await page.click('.navbar-toggle');
  await page.waitForSelector('.navbar-menu.active');
  await page.waitForTimeout(500);
  
  await page.click('.dropdown-trigger');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: 'test-results/mobile-dropdown.png' });
  
  await browser.close();
})();
