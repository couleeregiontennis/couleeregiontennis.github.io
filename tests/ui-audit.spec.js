const { test, expect } = require('@playwright/test');

const BREAKPOINTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet-narrow', width: 1024, height: 768 },
  { name: 'tablet-mini', width: 850, height: 768 },
  { name: 'mobile', width: 375, height: 667 }
];

test.describe('UI Visual Audit', () => {
  for (const bp of BREAKPOINTS) {
    test(`Audit at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('http://localhost:3001/index.html');
      
      // Wait for nav to load
      await page.waitForSelector('#nav-placeholder nav');
      
      // Take screenshot of header
      await page.screenshot({ 
        path: `test-results/audit-${bp.name}.png`,
        fullPage: false 
      });

      // Check if nav brand is visible
      const brand = page.locator('.navbar-brand');
      await expect(brand).toBeVisible();

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (overflow) {
        console.warn(`[WARNING] Horizontal overflow detected at ${bp.name}`);
      }
    });
  }
});
