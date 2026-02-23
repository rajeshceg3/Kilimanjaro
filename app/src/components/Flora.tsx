import { Instance, Instances } from '@react-three/drei';
import { useMemo } from 'react';
import { DoubleSide, MathUtils } from 'three';

const COUNT = 300; // Number of instances per zone
const SPREAD = 80; // Horizontal spread
const SCALE_FACTOR = 0.1; // Matches Scene.tsx scale

interface FloraProps {
  range: [number, number];
  color: string;
  type: 'tree' | 'tall_tree' | 'groundsel' | 'rock' | 'ice';
}

const FloraZone = ({ range, color, type }: FloraProps) => {
  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      const y = MathUtils.randFloat(range[0], range[1]) * SCALE_FACTOR;
      // Simple cylindrical distribution to simulate mountain slope?
      // Or just random scatter. Let's do random scatter for now but keep center somewhat clear.
      const angle = MathUtils.randFloat(0, Math.PI * 2);
      const radius = MathUtils.randFloat(10, SPREAD); // Keep center clear (radius 0-10 empty)
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const scale = MathUtils.randFloat(0.5, 1.5);
      const rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0] as [number, number, number];

      return { position: [x, y, z] as [number, number, number], scale, rotation };
    });
  }, [range]);

  const materialProps = { color, side: DoubleSide };

  switch (type) {
    case 'tree': // Cone
      return (
        <Instances range={COUNT}>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'tall_tree': // Cylinder
      return (
        <Instances range={COUNT}>
          <cylinderGeometry args={[0.5, 1, 8, 8]} />
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'groundsel': // Cylinder with Sphere top - composed?
      // InstancedMesh only supports one geometry. We'll simulate with a specific shape or just use a group of two Instances?
      // For simplicity/performance in this "meditative" app, let's use a unique shape.
      // A capsule or just a cylinder for the stem and a sphere for the top.
      // Actually, we can just use a Cylinder for now, maybe taper it.
      return (
        <Instances range={COUNT}>
          <cylinderGeometry args={[0.8, 0.2, 6, 8]} />
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'rock': // Dodecahedron
      return (
        <Instances range={COUNT}>
          <dodecahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial {...materialProps} roughness={0.8} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'ice': // Octahedron
      return (
        <Instances range={COUNT}>
          <octahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            {...materialProps}
            transmission={0.6}
            thickness={1}
            roughness={0.1}
            clearcoat={1}
          />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    default:
      return null;
  }
};

export const Flora = () => {
  return (
    <group>
      {/* Cultivation Zone: 800-1800m */}
      <FloraZone range={[800, 1800]} color="#4a6741" type="tree" />

      {/* Rainforest Zone: 1800-2800m */}
      <FloraZone range={[1800, 2800]} color="#1a3c18" type="tall_tree" />

      {/* Moorland Zone: 2800-4000m */}
      <FloraZone range={[2800, 4000]} color="#6b4c35" type="groundsel" />

      {/* Alpine Desert: 4000-5000m */}
      <FloraZone range={[4000, 5000]} color="#8c8c8c" type="rock" />

      {/* Arctic Summit: 5000-6000m */}
      <FloraZone range={[5000, 6000]} color="#e6f7ff" type="ice" />
    </group>
  );
};
