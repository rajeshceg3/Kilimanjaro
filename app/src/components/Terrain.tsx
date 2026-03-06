import { useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { getTerrainZ } from '../utils/terrain';

export const Terrain = () => {
  const terrainGeo = useMemo(() => {
    // Generate a large plane to cover the mountain face.
    // Width (X): Cover left-to-right spread
    // Height (Y): Cover altitude from 0 to top (600 in our scaled coordinates, or 6000m * 0.1)
    const width = 200;
    const height = 700;

    // High resolution for smooth rolling hills and detailed vertex modification
    const widthSegments = 128;
    const heightSegments = 256;

    const geometry = new PlaneGeometry(width, height, widthSegments, heightSegments);

    // Get the position attribute
    const positionAttribute = geometry.getAttribute('position');

    // The PlaneGeometry is centered at 0,0 by default.
    // We want the bottom edge at Y=0 and top edge at Y=height.
    geometry.translate(0, height / 2, 0);

    // Apply the noise displacement
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);

      // Calculate depth Z based on global terrain function
      const z = getTerrainZ(x, y);

      positionAttribute.setZ(i, z);
    }

    // Recompute normals so lighting interacts with our slopes correctly, avoiding faceted artifacts
    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;

    return geometry;
  }, []);

  return (
    <mesh geometry={terrainGeo} castShadow receiveShadow>
      {/* We use MeshStandardMaterial to let standard lighting, shadows, and fog work nicely */}
      <meshStandardMaterial
        color="#8B7355" // A general muted earthen brown
        roughness={0.9}
        onBeforeCompile={(shader) => {
          // We can add height-based color blending (Cultivation -> Forest -> Moorland -> Alpine -> Snow)
          shader.vertexShader = `
            varying vec3 vWorldPos;
            ${shader.vertexShader}
          `;
          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            vec4 myWorldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPos = myWorldPosition.xyz;
            `
          );

          shader.fragmentShader = `
            varying vec3 vWorldPos;
            ${shader.fragmentShader}
          `;

          // Blend colors based on altitude
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <color_fragment>`,
            `
            #include <color_fragment>

            float altitude = vWorldPos.y / 0.1; // Convert back to real meters (0-6000m)

            // Zone colors
            vec3 colCultivation = vec3(0.55, 0.45, 0.33); // #8B7355 (Dirt/warm earth)
            vec3 colForest      = vec3(0.18, 0.33, 0.22); // #2e5338 (Lush green)
            vec3 colMoorland    = vec3(0.35, 0.33, 0.29); // #5a544a (Muted brown)
            vec3 colAlpine      = vec3(0.40, 0.40, 0.42); // #66666b (Dusty grey)
            vec3 colSnow        = vec3(0.95, 0.98, 1.0);  // #f2faff (Ice/Snow)

            // Smoothstep transitions
            float t1 = smoothstep(1600.0, 2000.0, altitude);
            float t2 = smoothstep(2600.0, 3000.0, altitude);
            float t3 = smoothstep(3800.0, 4200.0, altitude);
            float t4 = smoothstep(4800.0, 5200.0, altitude);

            // Mix them
            vec3 finalColor = colCultivation;
            finalColor = mix(finalColor, colForest, t1);
            finalColor = mix(finalColor, colMoorland, t2);
            finalColor = mix(finalColor, colAlpine, t3);
            finalColor = mix(finalColor, colSnow, t4);

            diffuseColor.rgb = finalColor;
            `
          );
        }}
      />
    </mesh>
  );
};
