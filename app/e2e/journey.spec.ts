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
    test.setTimeout(60000);
    // Playwright E2E tests simulating long scroll journeys should break the scroll events into smaller increments
    // with delays to allow state and UI interpolations to update correctly.
    for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(300);
    }
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
    // Start by making sure there's no ongoing interaction resetting the timeout
    const altitudeLabel = page.getByText('Altitude', { exact: true });
    await expect(altitudeLabel).toBeVisible();

    // Minor movement to ensure state is active
    await page.mouse.wheel(0, 10);

    // Wait for the inactivity timer to fire (3s) and the transition (1s) to finish
    await page.waitForTimeout(5000);

    const container = page.getByTestId('main-ui');
    await expect(container).toHaveClass(/opacity-0/);

    // Minor scroll to trigger activity
    await page.mouse.wheel(0, 100);
    // Wait slightly to let the class transition apply
    await page.waitForTimeout(500);
    await expect(container).toHaveClass(/opacity-100/);
  });
});
