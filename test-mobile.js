const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3001');
  
  await page.click('.navbar-toggle');
  await page.waitForSelector('.navbar-menu.active');
  
  const dropdown = await page.locator('.dropdown-menu');
  console.log('Dropdown display:', await dropdown.evaluate(el => window.getComputedStyle(el).display));
  
  const text = await page.locator('.navbar-menu').innerText();
  console.log('Menu text:\\n' + text);
  
  await browser.close();
})();
