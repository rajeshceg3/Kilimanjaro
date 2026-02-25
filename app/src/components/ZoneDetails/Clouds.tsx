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
    uniform float time;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Billboard behavior: cancel out rotation
      // Actually, since we use Instance with rotation, we can just face camera here if needed
      // But simpler: just use LookAt in JS or let them face a direction.
      // For now, let's assume they are billboards facing camera.
      // A full billboard shader is complex with instances.
      // Instead, we will rotate instances to face camera in JS or just let them be volumetric-ish planes.

      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform vec3 color;

    void main() {
      // Radial gradient for soft puff
      float dist = distance(vUv, vec2(0.5));
      float alpha = smoothstep(0.5, 0.0, dist);

      // Simple noise simulation (very basic)
      // float noise = sin(vUv.x * 10.0) * sin(vUv.y * 10.0);

      gl_FragColor = vec4(color, alpha * 0.4); // Low opacity
    }
  `
);

extend({ CustomCloudMaterial: CloudMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    customCloudMaterial: ThreeElement<typeof CloudMaterial>;
  }
}

const COUNT = 200;
const RANGE_MOORLAND: [number, number] = [2800, 4000];
const RANGE_SUMMIT: [number, number] = [5000, 5500];
const SCALE_FACTOR = 0.1;
const SPREAD = 100;

export const Clouds = () => {
  const materialRef = useRef<ShaderMaterial & { time: number }>(null);

  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      // Distribute between Moorland and Summit
      const isSummit = MathUtils.randFloat(0, 1) > 0.6; // 40% in Summit
      const range = isSummit ? RANGE_SUMMIT : RANGE_MOORLAND;

      const y = MathUtils.randFloat(range[0], range[1]) * SCALE_FACTOR;
      const angle = MathUtils.randFloat(0, Math.PI * 2);
      const radius = MathUtils.randFloat(20, SPREAD);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const scale = MathUtils.randFloat(5, 15);

      // Rotate to face roughly camera or random
      const rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0] as [number, number, number];

      return { position: [x, y, z] as [number, number, number], rotation, scale };
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
      // materialRef.current.uniforms.cameraPosition.value = state.camera.position; // If needed for billboard
    }
  });

  return (
    <Instances range={COUNT}>
      <planeGeometry args={[1, 1]} />
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
