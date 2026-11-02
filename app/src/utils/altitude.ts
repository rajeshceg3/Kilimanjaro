import { MathUtils } from 'three';

// Jank guard bounds: a frame gap on a slow device or after tab restore can
// span seconds. Feeding that raw delta into an exponential lerp makes its
// alpha exceed 1 and the smoothed altitude extrapolates into impossible
// values (observed in production code: -9265m, 7277m, 19881m renders).
export const MAX_FRAME_DT = 0.25;
export const MIN_ALTITUDE = 800;
export const MAX_ALTITUDE = 6000;

export function altitudeStep(altitude: number, targetAltitude: number, delta: number): number {
  const dt = MathUtils.clamp(delta, 0, MAX_FRAME_DT);
  const smoothingFactor = MathUtils.mapLinear(
    MathUtils.clamp(altitude, MIN_ALTITUDE, MAX_ALTITUDE),
    MIN_ALTITUDE,
    MAX_ALTITUDE,
    2.0,
    0.5
  );
  return MathUtils.clamp(
    MathUtils.lerp(altitude, targetAltitude, dt * smoothingFactor),
    MIN_ALTITUDE,
    MAX_ALTITUDE
  );
}
