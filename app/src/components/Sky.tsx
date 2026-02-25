import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { Color, BackSide, ShaderMaterial, AdditiveBlending, MathUtils, Mesh, Points } from 'three';
import { useStore } from '../store/useStore';
import { getZoneAtAltitude } from '../config/zones';

// --- Custom Gradient Shader Material ---
// We use extend to make it available as a JSX element
import { extend } from '@react-three/fiber';
import type { ThreeElement } from '@react-three/fiber';

const GradientSkyMaterial = shaderMaterial(
  {
    topColor: new Color(0x0077ff),
    bottomColor: new Color(0xffffff),
    offset: 400,
    exponent: 0.6,
  },
  // Vertex Shader
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  // Fragment Shader
  `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize( vWorldPosition + vec3(0, offset, 0) ).y;
      gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
    }
  `
);

extend({ GradientSkyMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    gradientSkyMaterial: ThreeElement<typeof GradientSkyMaterial>;
  }
}

const SkyGradient = () => {
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  // Reusable color objects to avoid GC
  const targetBottom = useMemo(() => new Color(), []);
  const targetTop = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const altitude = useStore.getState().altitude;
    const zone = getZoneAtAltitude(altitude);

    // Move sky with camera to simulate infinite distance
    meshRef.current.position.copy(state.camera.position);

    targetBottom.set(zone.fogColor);

    // Define top colors
    if (altitude < 1800) targetTop.set("#4CA1AF"); // Soft Day
    else if (altitude < 2800) targetTop.set("#2C3E50"); // Forest Gloom
    else if (altitude < 4000) targetTop.set("#1a2a6c"); // High Altitude Blue
    else if (altitude < 5000) targetTop.set("#0f0c29"); // Near Space
    else targetTop.set("#000000"); // Space

    // Lerp colors
    materialRef.current.uniforms.bottomColor.value.lerp(targetBottom, delta * 0.5);
    materialRef.current.uniforms.topColor.value.lerp(targetTop, delta * 0.5);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1000, 32, 15]} />
      <gradientSkyMaterial
        ref={materialRef}
        side={BackSide}
        offset={100}
        exponent={0.6}
        attach="material"
      />
    </mesh>
  );
};

const Stars = () => {
  const ref = useRef<Points>(null);

  const [positions] = useState(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
        const r = 900; // Inside the sky sphere (1000)
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
    }
    return pos;
  });

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Follow camera
    ref.current.position.copy(state.camera.position);

    // Rotate stars slowly
    ref.current.rotation.y += delta * 0.01;

    // Fade in based on altitude
    const altitude = useStore.getState().altitude;
    let targetOpacity = 0;
    if (altitude > 3500) {
        targetOpacity = MathUtils.mapLinear(altitude, 3500, 5500, 0, 1);
    }
    // Using simple lerp on opacity property of material
    // Need to cast material to access opacity
    if (ref.current.material) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ref.current.material as any).opacity = MathUtils.lerp((ref.current.material as any).opacity, targetOpacity, delta);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.0}
        sizeAttenuation={false}
        color="white"
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export const Sky = () => {
  return (
    <group>
      <SkyGradient />
      <Stars />
    </group>
  );
};
