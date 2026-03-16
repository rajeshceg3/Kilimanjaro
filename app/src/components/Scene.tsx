import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';
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
  useFrame((state, delta) => {
    const altitude = useStore.getState().altitude;
    const targetAltitude = useStore.getState().targetAltitude;
    const setAltitude = useStore.getState().setAltitude;
    const isTourActive = useStore.getState().isTourActive;
    const isTourPaused = useStore.getState().isTourPaused;
    const setTargetAltitude = useStore.getState().setTargetAltitude;
    const setTourActive = useStore.getState().setTourActive;

    // Tour mode continuous ascent
    if (isTourActive && !isTourPaused) {
      // Ascend by ~20 meters per second at the bottom, slowing down to ~10 at the top
      let baseSpeed = MathUtils.mapLinear(altitude, 800, 6000, 20, 10);

      // Dynamic deceleration near zone boundaries for progressive disclosure
      const nextZone = ZONES.find(z => z.minAltitude > altitude);
      if (nextZone) {
        const distanceToNextZone = nextZone.minAltitude - altitude;
        if (distanceToNextZone < 150) {
           // Slow down significantly as we approach the boundary (down to 2m/s)
           // This allows the zone text to fade in smoothly
           baseSpeed = MathUtils.mapLinear(distanceToNextZone, 0, 150, 2, baseSpeed);
        }
      }

      const newTarget = targetAltitude + baseSpeed * delta;

      if (newTarget >= 6000) {
        setTargetAltitude(6000);
        setTourActive(false); // End tour automatically at summit
      } else {
        setTargetAltitude(newTarget);
      }
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />

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
