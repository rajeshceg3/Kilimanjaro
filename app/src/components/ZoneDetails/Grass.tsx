import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { MathUtils, DoubleSide, MeshStandardMaterial } from 'three';
import { getTerrainZ } from '../../utils/terrain';

const COUNT = 1000;
const RANGE_Y: [number, number] = [800, 1800]; // Cultivation Zone
const SCALE_FACTOR = 0.1;
const SPREAD = 60;

export const Grass = () => {
  const materialRef = useRef<MeshStandardMaterial>(null);

  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      const y = MathUtils.randFloat(RANGE_Y[0], RANGE_Y[1]) * SCALE_FACTOR;

      // Keep clear of the center path (x between -5 and 5)
      let x = 0;
      do {
        x = MathUtils.randFloat(-SPREAD, SPREAD);
      } while (Math.abs(x) < 5);

      const z = getTerrainZ(x, y);

      const rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0] as [number, number, number];
      const scale = MathUtils.randFloat(0.5, 1.2);
      return { position: [x, y, z] as [number, number, number], rotation, scale };
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <Instances range={COUNT} castShadow receiveShadow>
      <planeGeometry args={[0.5, 2, 1, 4]} /> {/* Width, Height, SegmentsX, SegmentsY (need Y segs for bend) */}
      <meshStandardMaterial
        ref={materialRef}
        side={DoubleSide}
        color="#4a6741"
        roughness={0.8}
        onBeforeCompile={(shader) => {
          shader.uniforms.time = { value: 0 };
          shader.vertexShader = `
            uniform float time;
            ${shader.vertexShader}
          `;
          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            // Simple wind sway based on world position (instanceMatrix[3].x)
            if (position.y > 0.0) {
              float sway = sin(time * 2.0 + instanceMatrix[3].x * 0.5) * 0.2;
              transformed.x += sway * position.y; // Sway more at the tip
            }
            `
          );

          // Add gradient logic based on UV
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <color_fragment>`,
            `
            #include <color_fragment>
            diffuseColor.rgb = mix(diffuseColor.rgb * 0.5, diffuseColor.rgb, vUv.y);
            `
          );

          if (materialRef.current) {
            materialRef.current.userData.shader = shader;
          }
        }}
      />
      {data.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  );
};
