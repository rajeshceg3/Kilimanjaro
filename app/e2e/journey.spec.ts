import { test, expect } from '@playwright/test';

test.describe('Mount Kilimanjaro Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initial render
    await expect(page.getByText('Altitude', { exact: true })).toBeVisible();
  });

  test('starts at Cultivation Zone', async ({ page }) => {
    await expect(page.getByText('800m')).toBeVisible();
    await expect(page.getByText('Cultivation Zone')).toBeVisible();
    await expect(page.getByText('"You begin where life already exists."')).toBeVisible();
  });

  test('ascends to Rainforest Zone on scroll', async ({ page }) => {
    // Current altitude 800. Target > 1800. Need +1000 altitude.
    // wheel delta is multiplied by 0.5. So 2000 delta.

    // We can simulate wheel event
    await page.mouse.wheel(0, 3000);

    // Wait for altitude to update. It interpolates, so might take a moment.
    // Check if altitude is updating
    // Wait for text change
    await expect(page.getByText('Rainforest Zone')).toBeVisible({ timeout: 10000 });
  });

  test('can reach the Summit', async ({ page }) => {
    // Go all the way up
    // Max altitude 6000. Start 800. Delta 5200.
    // Need wheel delta ~ 10400.

    // Scroll in steps to simulate journey. We scroll multiple times to ensure we hit it consistently.
    for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 5000);
        await page.waitForTimeout(300); // Give time for interpolation
    }

    // Since the main UI disappears when showSummitText is true,
    // "Arctic Summit" might not be visible if we reach the summit quickly.
    // We should directly look for the summit text.
    const summitContainer = page.getByTestId('summit-ui');
    await expect(summitContainer.getByText('"You are standing above weather."')).toBeVisible({ timeout: 15000 });
  });

  test('UI fades out and reappears', async ({ page }) => {
    // Initial state visible
    const altitudeLabel = page.getByText('Altitude', { exact: true });
    await expect(altitudeLabel).toBeVisible();

    // Wait for 3 seconds + buffer for fade out
    // The fade duration is 1000ms. Timeout is 3000ms.
    // We need to wait > 4s.
    await page.waitForTimeout(4500);

    // Check opacity using CSS class
    // We need to find the parent container of 'Altitude' text
    // The previous locator 'div.fixed.inset-0' was ambiguous.
    // We added data-testid="main-ui" to the main container.
    const container = page.getByTestId('main-ui');
    await expect(container).toHaveClass(/opacity-0/);

    // Scroll to trigger reappear
    await page.mouse.wheel(0, 100);
    await expect(container).toHaveClass(/opacity-100/);
  });
});
