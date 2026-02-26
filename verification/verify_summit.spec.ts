import { test, expect } from '@playwright/test';

test('verify summit visuals', async ({ page }) => {
  // Go to app
  await page.goto('http://localhost:5173');

  // Wait for canvas
  await page.waitForSelector('canvas');

  // We need to scroll to the top to see the glacier and summit text
  // The altitude is mapped to scroll. Max altitude is ~6000m.
  // The scroll height is roughly related to altitude.
  // Let's scroll significantly.

  // Evaluation to scroll to bottom/top
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // Wait for scroll to settle and altitude to reach summit
  // The store uses lerp, so it takes time.
  await page.waitForTimeout(5000);

  // Take screenshot of the summit view
  await page.screenshot({ path: 'verification/summit_view.png' });
});
