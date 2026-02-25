import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { getZoneAtAltitude } from '../config/zones';
import { Color, AdditiveBlending, Points, MathUtils, PointsMaterial } from 'three';

const COUNT = 1500; // Increased count for better density
const RADIUS = 30; // Increased radius

export const Particles = () => {
  const pointsRef = useRef<Points>(null);

  // Initialize particles with useState for lazy initialization (stable across renders)
  const [{ positions, scales }] = useState(() => {
    const pos = new Float32Array(COUNT * 3);
    const sc = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * RADIUS * 2;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * RADIUS * 2; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * RADIUS * 2; // z

      sc[i] = Math.random();
    }

    return { positions: pos, scales: sc };
  });

  const onBeforeCompile = useMemo(() => (shader: any) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
      `
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;
      float strength = 1.0 - (length(coord) * 2.0); // Soft edge
      strength = pow(strength, 0.5);
      gl_FragColor = vec4( outgoingLight, diffuseColor.a * strength );
      `
    );
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const altitude = useStore.getState().altitude;
    const zone = getZoneAtAltitude(altitude);
    const cameraY = state.camera.position.y;

    // Determine behavior based on zone
    let speedY = -2.0;
    let speedX = 0;
    let size = 0.05;
    let opacity = 0.5;

    // Mapping behavior to zones
    if (zone.name.includes("Cultivation")) {
      // Pollen / Insects
      speedY = -0.2;
      speedX = 0.1;
      opacity = 0.3;
      size = 0.08;
    } else if (zone.name.includes("Rainforest")) {
      // Heavy Mist / Droplets
      speedY = -0.5;
      speedX = 0.05;
      opacity = 0.4;
      size = 0.06;
    } else if (zone.name.includes("Moorland")) {
      // Wind / Thin Air
      speedY = -0.1;
      speedX = 0.8;
      opacity = 0.2;
      size = 0.04;
    } else if (zone.name.includes("Alpine")) {
      // Dust
      speedY = -0.1;
      speedX = 0.2;
      opacity = 0.15;
      size = 0.03;
    } else if (zone.name.includes("Summit")) {
      // Snow / Ice Crystals
      speedY = -0.8;
      speedX = 0.3;
      opacity = 0.7;
      size = 0.1;
    }

    const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      let x = currentPositions[i * 3];
      let y = currentPositions[i * 3 + 1];
      let z = currentPositions[i * 3 + 2];

      // Update position
      y += speedY * delta;
      x += speedX * delta;

      // Slight noise
      x += (Math.random() - 0.5) * 0.01;
      z += (Math.random() - 0.5) * 0.01;

      // Wrap around logic relative to CAMERA position
      // We want particles to stay within [cameraY - RADIUS, cameraY + RADIUS]
      if (y < cameraY - RADIUS) {
        y = cameraY + RADIUS;
        x = (Math.random() - 0.5) * RADIUS * 2; // Reset X to keep distribution
        z = (Math.random() - 0.5) * RADIUS * 2; // Reset Z
      }
      // Also check if too high above
      if (y > cameraY + RADIUS) {
         y = cameraY - RADIUS;
         x = (Math.random() - 0.5) * RADIUS * 2;
         z = (Math.random() - 0.5) * RADIUS * 2;
      }

      if (x > RADIUS) x = -RADIUS;
      if (x < -RADIUS) x = RADIUS;

      // Z Wrap
      if (z > RADIUS) z = -RADIUS;
      if (z < -RADIUS) z = RADIUS;

      currentPositions[i * 3] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update material properties
    const material = pointsRef.current.material as PointsMaterial;
    material.opacity = MathUtils.lerp(material.opacity, opacity, delta * 2);
    material.size = MathUtils.lerp(material.size, size, delta * 2);
    material.color.lerp(new Color(zone.fogColor), delta); // Tint with fog color
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={COUNT}
          args={[scales, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.5}
        blending={AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
};
