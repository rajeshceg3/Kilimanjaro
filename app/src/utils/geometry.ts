import { BufferGeometry, Float32BufferAttribute } from 'three';
import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

/**
 * Perturbs the vertices of a given geometry using simplex noise to make it look organic.
 * @param geometry The base BufferGeometry to modify
 * @param noiseAmplitude How much to displace the vertices
 * @param noiseFrequency How detailed the noise should be
 * @returns The modified geometry (modifies in place)
 */
export function createOrganicGeometry(
  geometry: BufferGeometry,
  noiseAmplitude: number = 0.5,
  noiseFrequency: number = 1.0
): BufferGeometry {
  const positionAttribute = geometry.getAttribute('position');

  if (!positionAttribute) {
    return geometry;
  }

  const vertex = new Float32Array(3);

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex[0] = positionAttribute.getX(i);
    vertex[1] = positionAttribute.getY(i);
    vertex[2] = positionAttribute.getZ(i);

    // Calculate noise based on vertex position
    const noise = noise3D(
      vertex[0] * noiseFrequency,
      vertex[1] * noiseFrequency,
      vertex[2] * noiseFrequency
    );

    // Apply displacement
    // We displace along the normal direction roughly, or just from the center.
    // For a sphere/icosahedron centered at origin, the vertex position itself is roughly the normal.
    // We normalize it to get a direction, then multiply by noise.
    const length = Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]) || 1;
    const nx = vertex[0] / length;
    const ny = vertex[1] / length;
    const nz = vertex[2] / length;

    positionAttribute.setXYZ(
      i,
      vertex[0] + nx * noise * noiseAmplitude,
      vertex[1] + ny * noise * noiseAmplitude,
      vertex[2] + nz * noise * noiseAmplitude
    );
  }

  // Ensure normal updates if lighting is used
  geometry.computeVertexNormals();
  positionAttribute.needsUpdate = true;

  return geometry;
}
