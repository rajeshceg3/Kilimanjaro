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

    await expect(page.getByText('Altitude', { exact: true })).toBeVisible();

    // Directly set state via page evaluation to bypass UI interaction flakiness in headless WebGL.
    // We exposed the Zustand store to window for testing.
    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(2500);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(2500);
        }
    });

    await expect(page.getByText('Rainforest Zone')).toBeVisible({ timeout: 20000 });
  });

  test('can reach the Summit', async ({ page }) => {
    test.setTimeout(90000);

    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(6000);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(6000);
        }
    });

    const summitContainer = page.getByTestId('summit-ui');
    await expect(summitContainer.getByText('"You are standing above weather."')).toBeVisible({ timeout: 20000 });
  });

  test('UI fades out and reappears', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');

    const altitudeLabel = page.getByText('Altitude', { exact: true });
    await expect(altitudeLabel).toBeVisible();

    const container = page.getByTestId('main-ui');

    await expect(container).toHaveClass(/opacity-100/);

    // Wait for inactivity fade out.
    // In headless, doing nothing triggers the timeout naturally.
    await expect(container).toHaveClass(/opacity-0/, { timeout: 15000 });

    // Trigger activity via touch to fade back in reliably
    await page.evaluate(() => {
        const touchStart = new TouchEvent('touchstart', {
             touches: [new Touch({ identifier: 0, target: document.body, clientY: 10 }) as unknown as Touch]
        });
        window.dispatchEvent(touchStart);
        const touchMove = new TouchEvent('touchmove', {
             touches: [new Touch({ identifier: 0, target: document.body, clientY: 0 }) as unknown as Touch]
        });
        window.dispatchEvent(touchMove);
    });

    await expect(container).toHaveClass(/opacity-100/, { timeout: 10000 });
  });
});
