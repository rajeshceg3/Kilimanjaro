import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';
import { Atmosphere } from './Atmosphere';
import { PlaceholderTerrain } from './PlaceholderTerrain';

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
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      <PlaceholderTerrain />

      <mesh position={[0, 70, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </>
  );
};
