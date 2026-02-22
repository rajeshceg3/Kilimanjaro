import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { MathUtils } from 'three';

export const useScroll = () => {
  const setTargetAltitude = useStore((state) => state.setTargetAltitude);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const currentTarget = useStore.getState().targetAltitude;
      // Scroll down (positive delta) -> increase altitude
      const delta = e.deltaY * 0.5;

      // Clamp between 800 and 6000
      const newAltitude = MathUtils.clamp(currentTarget + delta, 800, 6000);

      setTargetAltitude(newAltitude);
    };

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default if we are handling the scroll (which we are always doing here for the experience)
      // But we might want to allow other interactions?
      // For this app, it's immersive, so capturing touchmove is fine.
      // However, if we add UI buttons, we might need to be careful.
      if (e.target instanceof HTMLCanvasElement) {
         e.preventDefault();
      }

      const touchY = e.touches[0].clientY;
      const delta = (touchStartY - touchY) * 2; // Swipe up means ascend

      const currentTarget = useStore.getState().targetAltitude;
      const newAltitude = MathUtils.clamp(currentTarget + delta, 800, 6000);

      setTargetAltitude(newAltitude);
      touchStartY = touchY;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [setTargetAltitude]);
};
