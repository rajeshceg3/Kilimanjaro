import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Color, ShaderMaterial, FrontSide } from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';

// --- Glacier Material Shader ---
// Refractive/Icy look
const GlacierMaterial = shaderMaterial(
  {
    time: 0,
    color: new Color('#e0f7fa'),
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;

      vec4 mvPosition = viewMatrix * worldPosition;
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 color;
    uniform float time;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      // Fresnel effect
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);

      // Procedural icy noise
      float noise = sin(vWorldPosition.x * 0.5 + time * 0.1) * sin(vWorldPosition.y * 0.5) * sin(vWorldPosition.z * 0.5);

      // Cracks/Veins
      float cracks = smoothstep(0.95, 1.0, noise);

      // Base color with tint
      vec3 finalColor = mix(color, vec3(1.0), fresnel);
      finalColor = mix(finalColor, vec3(0.8, 0.9, 1.0), cracks * 0.5);

      // Transparent
      float alpha = 0.6 + fresnel * 0.4;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ GlacierMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    glacierMaterial: ThreeElement<typeof GlacierMaterial>;
  }
}

export const Glacier = () => {
  const materialRef = useRef<ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <group position={[0, 560, 0]}>
      {/* Background Wall - Cylinder */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[200, 200, 100, 32, 1, true]} />
        <glacierMaterial
            ref={materialRef}
            side={DoubleSide}
            transparent
            depthWrite={false}
        />
      </mesh>

      {/* Inner random chunks */}
       <mesh position={[40, -20, -20]} rotation={[0.2, 0.5, 0]}>
        <dodecahedronGeometry args={[15, 0]} />
         <glacierMaterial side={FrontSide} transparent depthWrite={false} />
      </mesh>

       <mesh position={[-50, 10, -10]} rotation={[-0.2, -0.3, 0]}>
        <icosahedronGeometry args={[20, 0]} />
         <glacierMaterial side={FrontSide} transparent depthWrite={false} />
      </mesh>
    </group>
  );
};
