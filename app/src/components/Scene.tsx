import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';
import { useRef } from 'react';
import { Atmosphere } from './Atmosphere';
import { ZONES } from '../config/zones';
import { Sky } from './Sky';
import { Flora } from './Flora';
import { Particles } from './Particles';
import { Grass } from './ZoneDetails/Grass';
import { Clouds } from './ZoneDetails/Clouds';
import { Aurora } from './ZoneDetails/Aurora';
import { Glacier } from './ZoneDetails/Glacier';
import { Terrain } from './Terrain';

export const Scene = () => {
  const tourSpeedRef = useRef(0);

  useFrame((state, delta) => {
    const altitude = useStore.getState().altitude;
    const targetAltitude = useStore.getState().targetAltitude;
    const setAltitude = useStore.getState().setAltitude;
    const isTourActive = useStore.getState().isTourActive;
    const isTourPaused = useStore.getState().isTourPaused;
    const setTargetAltitude = useStore.getState().setTargetAltitude;
    const setTourActive = useStore.getState().setTourActive;

    // Tour mode continuous ascent
    if (isTourActive) {
      // Ascend by ~20 meters per second at the bottom, slowing down to ~10 at the top
      let targetSpeed = 0;

      if (!isTourPaused) {
        targetSpeed = MathUtils.mapLinear(altitude, 800, 6000, 20, 10);

        // Dynamic deceleration near zone boundaries for progressive disclosure
        let closestBoundaryDistance = Infinity;
        for (const zone of ZONES) {
          // Check distance to the zone boundary (minAltitude)
          const dist = Math.abs(zone.minAltitude - altitude);
          if (dist < closestBoundaryDistance) {
            closestBoundaryDistance = dist;
          }
        }

        if (closestBoundaryDistance < 150) {
          // Slow down smoothly using smoothstep around the boundary (down to 2m/s)
          const t = MathUtils.smoothstep(closestBoundaryDistance, 0, 150);
          targetSpeed = MathUtils.lerp(2, targetSpeed, t);
        }
      }

      // Smooth acceleration/deceleration for the tour speed itself
      // When unpaused, gently accelerate to target speed. When paused, gently decelerate to 0.
      tourSpeedRef.current = MathUtils.lerp(tourSpeedRef.current, targetSpeed, delta * 2.0);

      if (tourSpeedRef.current > 0.05) {
        const newTarget = targetAltitude + tourSpeedRef.current * delta;

        if (newTarget >= 6000) {
          setTargetAltitude(6000);
          setTourActive(false); // End tour automatically at summit
        } else {
          setTargetAltitude(newTarget);
        }
      }
    } else {
      tourSpeedRef.current = 0; // reset momentum if tour is canceled
    }

    // Calculate smoothing factor based on altitude
    // Lower altitude = faster/normal (2.0)
    // Higher altitude = slower/heavier (0.5)
    const smoothingFactor = MathUtils.mapLinear(
        Math.min(altitude, 6000),
        800, 6000,
        2.0, 0.5
    );

    // Smooth interpolation
    const smoothedAltitude = MathUtils.lerp(altitude, targetAltitude, delta * smoothingFactor);

    if (Math.abs(smoothedAltitude - altitude) > 0.01) {
      setAltitude(smoothedAltitude);
    }

    const scale = 0.1;
    const yPos = smoothedAltitude * scale;

    state.camera.position.y = yPos;
    state.camera.position.z = 10;
    state.camera.lookAt(0, yPos, 0);
  });

  return (
    <>
      <Atmosphere />
      <Sky />
      {/* Enhanced lighting for more volume and richness */}
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#ffffff', '#444444', 0.4]} />
      <directionalLight position={[15, 25, 10]} intensity={1.2} color="#fff4e6" castShadow shadow-mapSize={[2048, 2048]} />
      {/* Subtle fill light from the opposite direction to soften harsh shadows */}
      <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#a1c4fd" />

      <Particles />
      <Terrain />
      <Flora />
      <Grass />
      <Clouds />
      <Glacier />
      <Aurora />
    </>
  );
};
