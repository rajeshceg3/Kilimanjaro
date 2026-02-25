import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { MathUtils, DoubleSide, Color, ShaderMaterial } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';

// --- Grass Material Shader ---
const GrassMaterial = shaderMaterial(
  {
    time: 0,
    color: new Color('#4a6741'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float time;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Simple wind sway
      // Only move the top of the blade (y > 0)
      if (pos.y > 0.0) {
        float sway = sin(time * 2.0 + instanceMatrix[3].x * 0.5) * 0.2; // instanceMatrix[3].x is world x position
        pos.x += sway * pos.y; // Sway more at the tip
      }

      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform vec3 color;

    void main() {
      // Simple gradient on the blade
      vec3 finalColor = mix(color * 0.5, color, vUv.y);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ GrassMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    grassMaterial: ThreeElement<typeof GrassMaterial>;
  }
}

const COUNT = 1000;
const RANGE_Y: [number, number] = [800, 1800]; // Cultivation Zone
const SCALE_FACTOR = 0.1;
const SPREAD = 60;

export const Grass = () => {
  const materialRef = useRef<ShaderMaterial & { time: number }>(null);

  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      const y = MathUtils.randFloat(RANGE_Y[0], RANGE_Y[1]) * SCALE_FACTOR;
      const angle = MathUtils.randFloat(0, Math.PI * 2);
      const radius = MathUtils.randFloat(5, SPREAD); // Don't spawn right on center path (0-5)
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0] as [number, number, number];
      const scale = MathUtils.randFloat(0.5, 1.2);
      return { position: [x, y, z] as [number, number, number], rotation, scale };
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
    }
  });

  return (
    <Instances range={COUNT}>
      <planeGeometry args={[0.5, 2, 1, 4]} /> {/* Width, Height, SegmentsX, SegmentsY (need Y segs for bend) */}
      <grassMaterial ref={materialRef} side={DoubleSide} />
      {data.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  );
};
