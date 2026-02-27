import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { MathUtils, DoubleSide, Color, AdditiveBlending, ShaderMaterial } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';

// --- Cloud Material Shader ---
const CloudMaterial = shaderMaterial(
  {
    time: 0,
    color: new Color('#ffffff'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vAlpha;
    uniform float time;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Simple Billboard logic: Align with camera view roughly by not rotating with instance matrix fully?
      // Since we use Instances, we rely on the instance matrix for position.
      // To simulate billboard behavior in a vertex shader with instancing is tricky without passing camera up/right vectors.
      // Instead, let's keep it simple: Just render as flat planes that slowly rotate to face camera via JS or just "float" as 3D volumes (using multiple intersecting planes in one instance could work, but expensive).
      // Let's stick to simple planes but animate their vertices slightly to look like puffing clouds.

      float noise = sin(pos.x * 2.0 + time * 0.5) * cos(pos.y * 2.0 + time * 0.3) * 0.2;
      pos.z += noise;

      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);

      // Distance fade logic could go here if we passed camera pos, but let's keep it simple.
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform vec3 color;
    uniform float time;

    // Simple pseudo-random noise
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      // Radial gradient for soft puff
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);

      // Soft circle shape
      float alpha = smoothstep(0.5, 0.2, dist);

      // Add some internal noise texture
      float noise = sin(vUv.x * 10.0 + time * 0.2) * sin(vUv.y * 10.0 + time * 0.3);
      alpha *= (0.8 + noise * 0.2);

      // Edge fade
      alpha *= smoothstep(0.5, 0.45, dist);

      if (alpha < 0.01) discard;

      gl_FragColor = vec4(color, alpha * 0.3); // Low opacity
    }
  `
);

extend({ CustomCloudMaterial: CloudMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    customCloudMaterial: ThreeElement<typeof CloudMaterial>;
  }
}

const COUNT = 150; // Fewer but larger clouds
const RANGE_MOORLAND: [number, number] = [2800, 4200];
const RANGE_SUMMIT: [number, number] = [4800, 5800];
const SCALE_FACTOR = 0.1;
const SPREAD = 120; // Wider spread

export const Clouds = () => {
  const materialRef = useRef<ShaderMaterial & { time: number }>(null);

  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      // Distribute between Moorland (low clouds) and Summit (cloud sea below)
      const isSummit = MathUtils.randFloat(0, 1) > 0.5;
      const range = isSummit ? RANGE_SUMMIT : RANGE_MOORLAND;

      const y = MathUtils.randFloat(range[0], range[1]) * SCALE_FACTOR;

      // For Summit, push clouds lower relative to peak to create "sea of clouds" effect if possible,
      // or just floating around.
      // Let's just distribute them naturally.

      const angle = MathUtils.randFloat(0, Math.PI * 2);
      const radius = MathUtils.randFloat(40, SPREAD); // Further out
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const scale = MathUtils.randFloat(15, 30); // Much larger

      // Rotate to face roughly camera or random
      // We'll just use random rotation for now as they are "puffs"
      const rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0] as [number, number, number];

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
      <planeGeometry args={[1, 1, 8, 8]} /> {/* Increased segments for vertex noise */}
      <customCloudMaterial
        ref={materialRef}
        side={DoubleSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
      {data.map((props, i) => (
        <Instance key={i} {...props} />
      ))}
    </Instances>
  );
};
