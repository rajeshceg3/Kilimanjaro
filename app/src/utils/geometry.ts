import { BufferGeometry } from 'three';
import { createNoise3D } from 'simplex-noise';
import { mergeVertices } from 'three-stdlib';

const noise3D = createNoise3D();

/**
 * Perturbs the vertices of a given geometry using multi-octave simplex noise to make it look organic, without sharp spikes.
 * @param geometry The base BufferGeometry to modify
 * @param noiseAmplitude How much to displace the vertices (scaled down relative to volume)
 * @param noiseFrequency How detailed the noise should be
 * @returns The modified geometry (modifies in place or returns new merged geometry)
 */
export function createOrganicGeometry(
  geometry: BufferGeometry,
  noiseAmplitude: number = 0.5,
  noiseFrequency: number = 1.0
): BufferGeometry {
  // Merge vertices to ensure shared vertices for smooth normals across faces
  const mergedGeo = mergeVertices(geometry);
  const positionAttribute = mergedGeo.getAttribute('position');

  if (!positionAttribute) {
    return mergedGeo;
  }

  const vertex = new Float32Array(3);

  // Compute bounding sphere radius to normalize noise relative to object size
  mergedGeo.computeBoundingSphere();
  const radius = mergedGeo.boundingSphere?.radius || 1.0;

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex[0] = positionAttribute.getX(i);
    vertex[1] = positionAttribute.getY(i);
    vertex[2] = positionAttribute.getZ(i);

    // Multi-octave noise for smoother, natural displacement
    // Low frequency, high amplitude
    let noise = noise3D(
      vertex[0] * noiseFrequency * 0.5,
      vertex[1] * noiseFrequency * 0.5,
      vertex[2] * noiseFrequency * 0.5
    ) * 1.0;

    // High frequency, low amplitude (detail)
    noise += noise3D(
      vertex[0] * noiseFrequency * 2.0,
      vertex[1] * noiseFrequency * 2.0,
      vertex[2] * noiseFrequency * 2.0
    ) * 0.25;

    // We displace along the normal direction.
    // Assuming vertices form a shape centered around origin, we normalize to get direction.
    // Better for cylinders and spheres.
    const length = Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]) || 1;
    const nx = vertex[0] / length;
    const ny = vertex[1] / length;
    const nz = vertex[2] / length;

    // Scale amplitude based on radius so we don't get wild spikes on small objects
    const finalAmplitude = noiseAmplitude * Math.min(1.0, radius * 0.5);

    positionAttribute.setXYZ(
      i,
      vertex[0] + nx * noise * finalAmplitude,
      vertex[1] + ny * noise * finalAmplitude,
      vertex[2] + nz * noise * finalAmplitude
    );
  }

  // Ensure normal updates if lighting is used
  mergedGeo.computeVertexNormals();
  positionAttribute.needsUpdate = true;

  return mergedGeo;
}
