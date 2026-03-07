import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

/**
 * Calculates the Z coordinate (depth/height relative to the camera face) for a given X and Y coordinate
 * to create a continuous, organic mountain slope.
 *
 * @param x Horizontal coordinate
 * @param y Vertical coordinate (altitude)
 * @returns The Z coordinate
 */
export function getTerrainZ(x: number, y: number): number {
  // Base slope: The mountain leans backward as it goes up.
  // We'll give it a gentle slope backward, so higher Y means deeper (more negative) Z.
  let z = -y * 0.15;

  // Add macro shape (large hills/valleys)
  z += noise2D(x * 0.005, y * 0.005) * 20.0;

  // Add mid-level detail
  z += noise2D(x * 0.02, y * 0.02) * 5.0;

  // Add fine detail (rocks, crevices)
  z += noise2D(x * 0.1, y * 0.1) * 1.0;

  // Add a slight curvature so it wraps around horizontally like a massive cone/mountain face
  // The further from the center (x=0), the further back it goes
  z -= Math.abs(x) * 0.2;

  // Shift everything back a bit so the camera is comfortably in front
  z -= 10.0;

  return z;
}
