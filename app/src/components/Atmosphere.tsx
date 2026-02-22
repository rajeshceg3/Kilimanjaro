/* eslint-disable */
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { getZoneAtAltitude } from '../config/zones';
import { Color, FogExp2 } from 'three';
import { useEffect } from 'react';

export const Atmosphere = () => {
  const { scene } = useThree();

  useEffect(() => {
    const alt = useStore.getState().altitude;
    const initialZone = getZoneAtAltitude(alt);
    scene.fog = new FogExp2(initialZone.fogColor, initialZone.fogDensity);
    scene.background = new Color(initialZone.fogColor);
  }, [scene]);

  useFrame((state, delta) => {
    const altitude = useStore.getState().altitude;
    const currentZone = getZoneAtAltitude(altitude);

    const targetColor = new Color(currentZone.fogColor);
    const targetDensity = currentZone.fogDensity;
    const currentScene = state.scene;

    if (currentScene.fog instanceof FogExp2) {
       const lerpFactor = delta * 1.0;

       currentScene.fog.color.lerp(targetColor, lerpFactor);
       currentScene.fog.density += (targetDensity - currentScene.fog.density) * lerpFactor;

       if (currentScene.background instanceof Color) {
          currentScene.background.lerp(targetColor, lerpFactor);
       } else {
          currentScene.background = new Color(targetColor);
       }
    }
  });

  return null;
};
