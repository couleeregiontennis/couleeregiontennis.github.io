import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'home', path: '/' },
  { name: 'standings', path: '/pages/standings.html' },
  { name: 'rules', path: '/pages/ltta-rules.html' },
  { name: 'subs', path: '/pages/subs.html' },
  { name: 'greenisland', path: '/pages/greenisland.html' },
  { name: 'team_tuesday', path: '/pages/team.html?day=tuesday&team=1' },
  { name: 'team_wednesday', path: '/pages/team.html?day=wednesday&team=2' },
  { name: 'all_tuesday', path: '/teams/tuesday/all.html' },
  { name: 'all_wednesday', path: '/teams/wednesday/all.html' }
];

test.describe('Visual and Functional Site Audit', () => {
  if (!fs.existsSync('audit-results')) {
    fs.mkdirSync('audit-results');
  }

  pages.forEach(p => {
    test(`Audit page: ${p.name} (${p.path})`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(p.path);
      
      // Wait for nav to load
      await page.waitForSelector('.navbar', { timeout: 10000 }).catch(() => {});
      
      // Special handling for standings page (async load)
      if (p.name === 'standings') {
        await page.waitForSelector('#standings-table tbody tr', { timeout: 10000 }).catch(() => {
          console.log('Warning: Standings table rows did not load within timeout.');
        });
      }

      // Basic sanity checks
      await expect(page).not.toHaveTitle(/404/);

      // Check for common "broken" indicators in data
      const bodyText = await page.innerText('body');
      expect(bodyText).not.toContain('undefined');
      
      // Take screenshot for visual inspection
      const screenshotPath = path.join('audit-results', `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}`);

      expect(errors).toHaveLength(0);
    });
  });
});
