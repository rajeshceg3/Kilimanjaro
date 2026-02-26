import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Color, AdditiveBlending, ShaderMaterial } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';

// --- Aurora Material Shader ---
const AuroraMaterial = shaderMaterial(
  {
    time: 0,
    color1: new Color('#00ff88'), // Green
    color2: new Color('#8800ff'), // Purple
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vHeight;
    uniform float time;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Add wave motion
      float wave = sin(pos.y * 0.1 + time) * 5.0 + sin(pos.x * 0.05 + time * 0.5) * 5.0;
      pos.z += wave;
      pos.x += cos(pos.y * 0.1 + time) * 5.0;

      vHeight = pos.y; // Pass height for gradient

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying float vHeight;
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;

    void main() {
      // vertical gradient
      float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

      // Horizontal color shift
      float colorMix = sin(vUv.x * 5.0 + time * 0.5) * 0.5 + 0.5;
      vec3 finalColor = mix(color1, color2, colorMix);

      // Make it wispy
      float noise = sin(vUv.x * 20.0 + time) * 0.1;
      alpha *= (0.5 + noise);

      gl_FragColor = vec4(finalColor, alpha * 0.6);
    }
  `
);

extend({ AuroraMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    auroraMaterial: ThreeElement<typeof AuroraMaterial>;
  }
}

interface AuroraLayerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  args?: [number, number, number, number];
}

const AuroraLayer = ({ position, rotation, args }: AuroraLayerProps) => {
  const materialRef = useRef<ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={args} />
      <auroraMaterial
        ref={materialRef}
        side={DoubleSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
};

export const Aurora = () => {
  return (
    <group position={[0, 550, 0]}>
        <AuroraLayer position={[0, 0, -50]} args={[400, 150, 64, 32]} />
        <AuroraLayer position={[0, 10, -30]} rotation={[0, 0.2, 0]} args={[300, 120, 64, 32]} />
    </group>
  );
};
