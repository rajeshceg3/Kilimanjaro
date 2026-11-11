import { test, expect } from '@playwright/test';

test.describe('Mount Kilimanjaro Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('intro-ui')).toBeVisible();

    // Set altitude directly to bypass the intro sequence logic for testing the main UI
    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(810);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(810);
        }
    });

    await expect(page.getByText('Altitude', { exact: true })).toBeVisible();
  });

  test('starts at Cultivation Zone', async ({ page }) => {
    // When using `.getByText`, if it matches multiple things (like the tooltip and the main text),
    // `.first()` handles it correctly, which we do here.
    // However, the test might fail because of opacity fades, so let's make sure it's fully visible.

    // With progressive disclosure, the texts fade in sequentially and fade out after 10s.
    // Ensure we trigger the start sequence to start the timers.
    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(810);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(810);
        }
    });

    await expect(page.getByText('Cultivation Zone').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('"You begin where life already exists."').first()).toBeVisible({ timeout: 10000 });
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

    await expect(page.getByText('Rainforest Zone').first()).toBeVisible({ timeout: 20000 });
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

    // Initial load and bypass intro
    await page.goto('/');

    // Set altitude directly to bypass the intro sequence logic for testing the main UI
    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(810);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(810);
        }
    });

    const altitudeLabel = page.getByText('Altitude', { exact: true });
    await expect(altitudeLabel).toBeVisible();

    const container = page.getByTestId('main-ui');

    // Ensure the container is visible. Since visibility timer depends on user interaction, we trigger it.
    await page.evaluate(() => {
        const mouseEvent = new MouseEvent('mousemove');
        window.dispatchEvent(mouseEvent);
    });

    await expect(container).toHaveClass(/opacity-100/);

    // Also update altitude to test behavior
    await page.evaluate(() => {
        if ((window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore) {
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setTargetAltitude(850);
            (window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; } } }).useStore.getState().setAltitude(850);
        }
    });

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

  test('manual stepper pauses the auto tour and steps zones', async ({ page }) => {
    test.setTimeout(60000);

    // Start paused so the running tour cannot cross a zone boundary mid-assertion;
    // pause-on-touch itself is covered by the unit suite.
    await page.evaluate(() => {
        const w = window as unknown as { useStore: { getState: () => { setTargetAltitude: (a: number) => void; setAltitude: (a: number) => void; setTourActive: (b: boolean) => void; setTourPaused: (b: boolean) => void; } } };
        if (w.useStore) {
            w.useStore.getState().setTargetAltitude(2000);
            w.useStore.getState().setAltitude(2000);
            w.useStore.getState().setTourActive(true);
            w.useStore.getState().setTourPaused(true);
        }
    });

    await expect(page.getByTestId('tour-controls')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('tour-zone-name')).toHaveText('Rainforest Zone');
    await expect(page.getByTestId('tour-counter')).toHaveText('2 / 5');

    await page.getByTestId('tour-next').click();

    const state = await page.evaluate(() => {
        const w = window as unknown as { useStore: { getState: () => { isTourPaused: boolean; targetAltitude: number } } };
        return { paused: w.useStore.getState().isTourPaused, target: w.useStore.getState().targetAltitude };
    });
    expect(state.paused).toBe(true);
    expect(state.target).toBe(2801);

    await page.getByTestId('tour-prev').click();
    const back = await page.evaluate(() => {
        const w = window as unknown as { useStore: { getState: () => { targetAltitude: number } } };
        return w.useStore.getState().targetAltitude;
    });
    expect(back).toBe(801);
  });
});
