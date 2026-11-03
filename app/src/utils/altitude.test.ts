import { describe, it, expect } from 'vitest';
import { altitudeStep, MIN_ALTITUDE, MAX_ALTITUDE } from './altitude';

describe('altitudeStep jank guard', () => {
  it('never overshoots the target on a multi-second frame gap', () => {
    // 10s frame gap (tab restore): must approach, never pass, the target
    expect(altitudeStep(800, 6000, 10)).toBeLessThanOrEqual(MAX_ALTITUDE);
    expect(altitudeStep(6000, 800, 10)).toBeGreaterThanOrEqual(MIN_ALTITUDE);
  });

  it('stays inside bounds across repeated janky frames', () => {
    let a = 800;
    for (let i = 0; i < 200; i++) {
      a = altitudeStep(a, 6000, 5);
      expect(a).toBeGreaterThanOrEqual(MIN_ALTITUDE);
      expect(a).toBeLessThanOrEqual(MAX_ALTITUDE);
    }
    expect(a).toBeGreaterThan(5900); // still converging, not stuck
  });

  it('is monotonic toward the target under jank (no oscillation)', () => {
    let a = 800;
    for (let i = 0; i < 50; i++) {
      const next = altitudeStep(a, 6000, 3);
      expect(next).toBeGreaterThanOrEqual(a);
      a = next;
    }
  });

  it('behaves like the original smoothing on normal frames', () => {
    const a = altitudeStep(800, 6000, 1 / 60);
    // parity with the original smoothing: alpha = (1/60) * 2.0 -> +173.33m
    expect(a).toBeCloseTo(973.333, 2);
  });

  it('treats negative deltas as no time passing', () => {
    expect(altitudeStep(3000, 6000, -1)).toBe(3000);
  });
});
