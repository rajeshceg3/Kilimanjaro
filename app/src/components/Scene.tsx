import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';
import { Atmosphere } from './Atmosphere';
import { Sky } from './Sky';
import { Flora } from './Flora';
import { Particles } from './Particles';
import { Grass } from './ZoneDetails/Grass';
import { Clouds } from './ZoneDetails/Clouds';
import { Aurora } from './ZoneDetails/Aurora';

export const Scene = () => {
  useFrame((state, delta) => {
    const altitude = useStore.getState().altitude;
    const targetAltitude = useStore.getState().targetAltitude;
    const setAltitude = useStore.getState().setAltitude;

    // Smooth interpolation
    const smoothedAltitude = MathUtils.lerp(altitude, targetAltitude, delta * 2);

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
      <Flora />
      <Grass />
      <Clouds />
      <Aurora />
    </>
  );
};
