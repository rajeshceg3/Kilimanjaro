import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { getZoneAtAltitude } from '../config/zones';
import { Color, AdditiveBlending, Points, MathUtils, PointsMaterial } from 'three';

const COUNT = 1000;
const RADIUS = 20; // Spread radius around camera

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

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const altitude = useStore.getState().altitude;
    const zone = getZoneAtAltitude(altitude);
    const cameraY = state.camera.position.y;

    // Determine behavior based on zone
    let speedY = -2.0; // Default drop speed
    let speedX = 0;
    let size = 0.05;
    let opacity = 0.5;

    // Mapping behavior to zones (simplified logic)
    if (zone.name.includes("Cultivation")) {
      speedY = -0.5;
      speedX = 0.2;
      opacity = 0.2; // Pollen
    } else if (zone.name.includes("Rainforest")) {
      speedY = -4.0;
      speedX = 0.1;
      opacity = 0.4; // Mist/Rain
    } else if (zone.name.includes("Moorland")) {
      speedY = -1.0;
      speedX = 1.5; // Wind
      opacity = 0.3;
    } else if (zone.name.includes("Alpine")) {
      speedY = -0.2;
      speedX = 0.5; // Dust
      opacity = 0.2;
    } else if (zone.name.includes("Summit")) {
      speedY = -0.5;
      speedX = 0.2; // Snow
      opacity = 0.6;
      size = 0.08;
    }

    const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      let x = currentPositions[i * 3];
      let y = currentPositions[i * 3 + 1];
      let z = currentPositions[i * 3 + 2];

      // Update position
      y += speedY * delta;
      x += speedX * delta;

      // Wrap around logic relative to CAMERA position
      // We want particles to stay within [cameraY - RADIUS, cameraY + RADIUS]
      if (y < cameraY - RADIUS) {
        y = cameraY + RADIUS;
        x = (Math.random() - 0.5) * RADIUS * 2; // Reset X to keep distribution
        z = (Math.random() - 0.5) * RADIUS * 2; // Reset Z
      }
      if (x > RADIUS) x = -RADIUS;
      if (x < -RADIUS) x = RADIUS;

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
      />
    </points>
  );
};
