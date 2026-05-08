const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3001');
  
  await page.click('.navbar-toggle');
  await page.waitForSelector('.navbar-menu.active');
  
  const dropdown = await page.locator('.dropdown-menu');
  console.log('Before click:', await dropdown.evaluate(el => window.getComputedStyle(el).display));
  
  await page.click('.dropdown-trigger');
  await page.waitForTimeout(500);
  console.log('After click:', await dropdown.evaluate(el => window.getComputedStyle(el).display));
  
  await page.click('.dropdown-trigger');
  await page.waitForTimeout(500);
  console.log('After second click:', await dropdown.evaluate(el => window.getComputedStyle(el).display));
  
  await browser.close();
})();
