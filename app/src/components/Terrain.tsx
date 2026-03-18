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

            // Simple 3D noise function for texturing
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            float snoise(vec3 v) {
              const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
              const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
              vec3 i  = floor(v + dot(v, C.yyy) );
              vec3 x0 = v - i + dot(i, C.xxx) ;
              vec3 g = step(x0.yzx, x0.xyz);
              vec3 l = 1.0 - g;
              vec3 i1 = min( g.xyz, l.zxy );
              vec3 i2 = max( g.xyz, l.zxy );
              vec3 x1 = x0 - i1 + C.xxx;
              vec3 x2 = x0 - i2 + C.yyy;
              vec3 x3 = x0 - D.yyy;
              i = mod289(i);
              vec4 p = permute( permute( permute(
                         i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                       + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                       + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
              float n_ = 0.142857142857;
              vec3  ns = n_ * D.wyz - D.xzx;
              vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
              vec4 x_ = floor(j * ns.z);
              vec4 y_ = floor(j - 7.0 * x_ );
              vec4 x = x_ *ns.x + ns.yyyy;
              vec4 y = y_ *ns.x + ns.yyyy;
              vec4 h = 1.0 - abs(x) - abs(y);
              vec4 b0 = vec4( x.xy, y.xy );
              vec4 b1 = vec4( x.zw, y.zw );
              vec4 s0 = floor(b0)*2.0 + 1.0;
              vec4 s1 = floor(b1)*2.0 + 1.0;
              vec4 sh = -step(h, vec4(0.0));
              vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
              vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
              vec3 p0 = vec3(a0.xy,h.x);
              vec3 p1 = vec3(a0.zw,h.y);
              vec3 p2 = vec3(a1.xy,h.z);
              vec3 p3 = vec3(a1.zw,h.w);
              vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
              p0 *= norm.x;
              p1 *= norm.y;
              p2 *= norm.z;
              p3 *= norm.w;
              vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
              m = m * m;
              return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                            dot(p2,x2), dot(p3,x3) ) );
            }
            ${shader.fragmentShader}
          `;

            // Blend colors based on altitude and add procedural noise for richness
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

              // Add procedural noise to break up the uniform color and simulate texture
              float noiseVal = snoise(vWorldPos * 0.5) * 0.5 + 0.5;
              float microNoise = snoise(vWorldPos * 2.0) * 0.5 + 0.5;

              // Darken crevices, lighten bumps slightly
              vec3 textureOverlay = mix(vec3(0.8), vec3(1.2), noiseVal * 0.7 + microNoise * 0.3);

              // Apply texture, but keep snow relatively pure and bright
              float snowFactor = smoothstep(4500.0, 5500.0, altitude);
              textureOverlay = mix(textureOverlay, vec3(1.0), snowFactor * 0.5);

              diffuseColor.rgb = finalColor * textureOverlay;
            `
          );
        }}
      />
    </mesh>
  );
};
