import { Instance, Instances } from '@react-three/drei';
import { DoubleSide } from 'three';

const terrainData = Array.from({ length: 500 }).map(() => ({
  position: [
    (Math.random() - 0.5) * 60,
    Math.random() * 600,
    (Math.random() - 0.5) * 60
  ] as [number, number, number],
  scale: Math.random() * 0.5 + 0.5,
  rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number]
}));

export const PlaceholderTerrain = () => {
  return (
    <Instances range={terrainData.length}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" side={DoubleSide} />
      {terrainData.map((d, i) => (
        <Instance
            key={i}
            position={d.position}
            scale={d.scale}
            rotation={d.rotation}
        />
      ))}
    </Instances>
  );
};
