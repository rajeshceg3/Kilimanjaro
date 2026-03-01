import { Instance, Instances } from '@react-three/drei';
import { useMemo } from 'react';
import { DoubleSide, MathUtils, IcosahedronGeometry, CapsuleGeometry, CylinderGeometry } from 'three';
import { createOrganicGeometry } from '../utils/geometry';

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
      const angle = MathUtils.randFloat(0, Math.PI * 2);
      const radius = MathUtils.randFloat(10, SPREAD);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const scale = MathUtils.randFloat(0.5, 1.5);

      // Full rotation for rocks/ice, Y-axis for plants
      let rotation: [number, number, number];
      if (type === 'rock' || type === 'ice') {
        rotation = [
            MathUtils.randFloat(0, Math.PI),
            MathUtils.randFloat(0, Math.PI),
            MathUtils.randFloat(0, Math.PI)
        ];
      } else {
        rotation = [0, MathUtils.randFloat(0, Math.PI * 2), 0];
      }

      return { position: [x, y, z] as [number, number, number], scale, rotation };
    });
  }, [range, type]);

  const materialProps = { color, side: DoubleSide };

  // Pre-compute geometries
  const treeGeo = useMemo(() => createOrganicGeometry(new CylinderGeometry(0.1, 1.5, 4, 16, 4), 0.3, 1.0), []);
  const tallTreeGeo = useMemo(() => createOrganicGeometry(new CylinderGeometry(0.8, 1.2, 8, 16, 4), 0.5, 0.8), []);
  const groundselGeo = useMemo(() => createOrganicGeometry(new CapsuleGeometry(0.6, 2, 16, 16), 0.4, 2.0), []);
  const rockGeo = useMemo(() => createOrganicGeometry(new IcosahedronGeometry(1.5, 2), 0.8, 1.5), []);
  const iceGeo = useMemo(() => createOrganicGeometry(new IcosahedronGeometry(1.5, 2), 0.5, 2.0), []);

  switch (type) {
    case 'tree':
      return (
        <Instances range={COUNT} castShadow receiveShadow geometry={treeGeo}>
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'tall_tree':
      return (
        <Instances range={COUNT} castShadow receiveShadow geometry={tallTreeGeo}>
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'groundsel':
      return (
        <Instances range={COUNT} castShadow receiveShadow geometry={groundselGeo}>
          <meshStandardMaterial {...materialProps} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'rock':
      return (
        <Instances range={COUNT} castShadow receiveShadow geometry={rockGeo}>
          <meshStandardMaterial {...materialProps} roughness={0.8} />
          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      );
    case 'ice':
      return (
        <Instances range={COUNT} castShadow receiveShadow geometry={iceGeo}>
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
