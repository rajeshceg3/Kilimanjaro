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
    await page.mouse.wheel(0, 3000);
    await expect(page.getByText('Rainforest Zone')).toBeVisible({ timeout: 15000 });
  });

  test('can reach the Summit', async ({ page }) => {
    // Scroll in steps to simulate journey. Increase timeout to avoid failure on slower test runs.
    test.setTimeout(90000);

    // Evaluate a script to jump the scroll closer to the top to reduce test time
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight - 5000);
    });

    for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 5000);
        await page.waitForTimeout(300); // Give time for interpolation
    }

    const summitContainer = page.getByTestId('summit-ui');
    await expect(summitContainer.getByText('"You are standing above weather."')).toBeVisible({ timeout: 15000 });
  });

  test('UI fades out and reappears', async ({ page }) => {
    const altitudeLabel = page.getByText('Altitude', { exact: true });
    await expect(altitudeLabel).toBeVisible();

    await page.waitForTimeout(4500);

    const container = page.getByTestId('main-ui');
    await expect(container).toHaveClass(/opacity-0/);

    await page.mouse.wheel(0, 100);
    await expect(container).toHaveClass(/opacity-100/);
  });
});
