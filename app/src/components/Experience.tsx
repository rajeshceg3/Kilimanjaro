import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';

export const Experience = () => {
  return (
    <div className="w-full h-screen relative bg-black">
      <Canvas
        shadows
        camera={{
          position: [0, 2, 5],
          fov: 45,
          near: 0.1,
          far: 2000
        }}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};
