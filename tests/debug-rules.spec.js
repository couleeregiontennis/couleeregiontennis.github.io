const { test, expect } = require('@playwright/test');

test('Capture Rules page state', async ({ page }) => {
  await page.goto('http://localhost:8080/pages/ltta-rules.html');
  await page.waitForSelector('nav.toc');
  
  // Take screenshot of the top half of the rules page
  await page.screenshot({ 
    path: 'test-results/rules-page-audit.png',
    fullPage: false 
  });

  // Specifically check TOC list style and pseudo-elements
  const tocDebug = await page.evaluate(() => {
    const li = document.querySelector('nav.toc li');
    if (!li) return 'No LI found';
    
    const style = window.getComputedStyle(li);
    const beforeStyle = window.getComputedStyle(li, '::before');
    
    return {
      listStyleType: style.listStyleType,
      listStyleImage: style.listStyleImage,
      listStylePosition: style.listStylePosition,
      beforeContent: beforeStyle.content,
      display: style.display
    };
  });
  console.log('TOC Debug:', JSON.stringify(tocDebug, null, 2));

  // Check Nav dropdown state if possible (though we fixed that)
  await page.hover('.dropdown-trigger');
  await page.screenshot({ 
    path: 'test-results/nav-dropdown-audit.png',
    fullPage: false 
  });
});
