import { Instance, Instances } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, MathUtils, IcosahedronGeometry, CylinderGeometry, ConeGeometry, MeshStandardMaterial } from 'three';
import { createOrganicGeometry } from '../utils/geometry';
import { getTerrainZ } from '../utils/terrain';

// Define a local interface for the shader object to satisfy TypeScript,
// since 'three' doesn't export a 'Shader' type directly.
interface WebGLProgramParametersWithUniforms {
  uniforms: { [uniform: string]: { value: unknown } };
  vertexShader: string;
  fragmentShader: string;
}

// ==========================================
// 1. FLORA SCENE ASSEMBLY
// ==========================================

const COUNT = 150;
const SPREAD = 80;
const SCALE_FACTOR = 0.1;

interface FloraProps {
  range: [number, number];
  type: 'tree' | 'tall_tree' | 'groundsel' | 'rock' | 'ice';
}

const FloraZone = ({ range, type }: FloraProps) => {
  const materialRef = useRef<MeshStandardMaterial>(null);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.userData.shader) {
      materialRef.current.userData.shader.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  const data = useMemo(() => {
    return Array.from({ length: COUNT }).map(() => {
      const y = MathUtils.randFloat(range[0], range[1]) * SCALE_FACTOR;
      // We no longer spread them completely radially in a full circle, because our terrain is a forward-facing slope.
      // We will place them along the X axis and calculate Z based on the terrain function.
      const x = MathUtils.randFloat(-SPREAD, SPREAD);
      const z = getTerrainZ(x, y);

      const scale = MathUtils.randFloat(0.6, 1.4);

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

  const { parts } = useMemo(() => {
    switch (type) {
      case 'tree': {
        const trunkGeo = new CylinderGeometry(0.2, 0.4, 3, 16, 4);
        trunkGeo.translate(0, 1.5, 0);

        // High res for smooth normals
        // Increased geometry detail to 32 segments to ensure smooth shading after displacement
        let crownGeo = new IcosahedronGeometry(2.5, 32);
        crownGeo.scale(1, 0.5, 1);
        crownGeo.translate(0, 3.0, 0);
        // Soft displacement to make it organic, not spiky
        crownGeo = createOrganicGeometry(crownGeo, 0.5, 1.5) as IcosahedronGeometry;

        return {
          parts: [
            { geo: trunkGeo, matType: 'standard', color: '#5C4033', roughness: 0.9, transmission: 0, thickness: 0 },
            { geo: crownGeo, matType: 'foliage', color: '#4a6741', roughness: 0.8, transmission: 0, thickness: 0 }
          ]
        };
      }
      case 'tall_tree': {
        const trunkGeo = new CylinderGeometry(0.3, 0.6, 8, 16, 4);
        trunkGeo.translate(0, 4, 0);

        let crownGeo = new IcosahedronGeometry(3.5, 32);
        crownGeo.scale(1, 0.8, 1);
        crownGeo.translate(0, 8, 0);
        crownGeo = createOrganicGeometry(crownGeo, 0.8, 1.2) as IcosahedronGeometry;

        return {
          parts: [
            { geo: trunkGeo, matType: 'standard', color: '#3A2E24', roughness: 0.9, transmission: 0, thickness: 0 },
            { geo: crownGeo, matType: 'foliage', color: '#1a3c18', roughness: 0.7, transmission: 0, thickness: 0 }
          ]
        };
      }
      case 'groundsel': {
        let trunkGeo = new CylinderGeometry(0.4, 0.6, 2.5, 16, 8);
        trunkGeo.translate(0, 1.25, 0);
        trunkGeo = createOrganicGeometry(trunkGeo, 0.2, 3.0) as CylinderGeometry;

        let crownGeo = new ConeGeometry(1.8, 2.5, 32, 16);
        crownGeo.translate(0, 3.0, 0);
        // Moderate displacement for the spiky rosette
        crownGeo = createOrganicGeometry(crownGeo, 0.6, 2.0) as ConeGeometry;

        return {
          parts: [
            { geo: trunkGeo, matType: 'standard', color: '#6A5F52', roughness: 1.0, transmission: 0, thickness: 0 },
            { geo: crownGeo, matType: 'foliage', color: '#6b4c35', roughness: 0.9, transmission: 0, thickness: 0 }
          ]
        };
      }
      case 'rock': {
        let rockGeo = new IcosahedronGeometry(2.5, 32);
        // Higher res, smoother crags
        rockGeo = createOrganicGeometry(rockGeo, 1.0, 1.0) as IcosahedronGeometry;

        return {
          parts: [
            { geo: rockGeo, matType: 'standard', color: '#8c8c8c', roughness: 0.8, transmission: 0, thickness: 0 }
          ]
        };
      }
      case 'ice': {
        let iceGeo = new IcosahedronGeometry(2.5, 32);
        iceGeo = createOrganicGeometry(iceGeo, 0.8, 1.5) as IcosahedronGeometry;

        return {
          parts: [
            { geo: iceGeo, matType: 'physical', color: '#e6f7ff', roughness: 0.1, transmission: 0.8, thickness: 2.0 }
          ]
        };
      }
      default:
        return { parts: [] };
    }
  }, [type]);

  // Shared callback for foliage wind sway
  const onBeforeCompileFoliage = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.time = { value: 0 };
    shader.vertexShader = `
      uniform float time;
      ${shader.vertexShader}
    `;
    shader.vertexShader = shader.vertexShader.replace(
      `#include <begin_vertex>`,
      `
      #include <begin_vertex>
      // Sway based on world position (instanceMatrix[3].x) and height (position.y)
      if (position.y > 1.0) {
        float sway = sin(time * 1.5 + instanceMatrix[3].x * 0.5) * 0.05;
        transformed.x += sway * position.y;
      }
      `
    );
    if (materialRef.current) {
      materialRef.current.userData.shader = shader;
    }
  };

  return (
    <group>
      {parts.map((part, index) => (
        <Instances key={index} range={COUNT} castShadow receiveShadow geometry={part.geo}>
          {part.matType === 'foliage' && (
             <meshStandardMaterial
                ref={index === 1 ? materialRef : null}
                color={part.color}
                roughness={part.roughness}
                side={DoubleSide}
                onBeforeCompile={(shader) => onBeforeCompileFoliage(shader as WebGLProgramParametersWithUniforms)}
             />
          )}
          {part.matType === 'standard' && (
             <meshStandardMaterial
                color={part.color}
                roughness={part.roughness}
                side={DoubleSide}
             />
          )}
          {part.matType === 'physical' && (
             <meshPhysicalMaterial
                color={part.color}
                roughness={part.roughness}
                transmission={part.transmission}
                thickness={part.thickness}
                side={DoubleSide}
                clearcoat={1}
             />
          )}

          {data.map((props, i) => <Instance key={i} {...props} />)}
        </Instances>
      ))}
    </group>
  );
};

export const Flora = () => {
  return (
    <group>
      <FloraZone range={[800, 1800]} type="tree" />
      <FloraZone range={[1800, 2800]} type="tall_tree" />
      <FloraZone range={[2800, 4000]} type="groundsel" />
      <FloraZone range={[4000, 5000]} type="rock" />
      <FloraZone range={[5000, 6000]} type="ice" />
    </group>
  );
};
