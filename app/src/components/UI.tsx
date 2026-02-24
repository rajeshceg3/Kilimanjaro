import { useStore } from '../store/useStore';
import { getZoneAtAltitude } from '../config/zones';
import { useEffect, useState, useRef } from 'react';

export const UI = () => {
  const altitude = useStore((state) => Math.round(state.altitude));
  const currentZone = getZoneAtAltitude(altitude);

  const [visible, setVisible] = useState(true);

  // Zone transition state
  const [displayZone, setDisplayZone] = useState(currentZone);
  const [fadeZone, setFadeZone] = useState(true);

  // Handle visibility based on activity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const unsub = useStore.subscribe((state, prevState) => {
       if (state.altitude !== prevState.altitude) {
         setVisible(true);
         clearTimeout(timeout);
         timeout = setTimeout(() => setVisible(false), 3000);
       }
    });

    // Initial timeout
    timeout = setTimeout(() => setVisible(false), 3000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  // Handle zone text transition
  // We use a ref to prevent unnecessary re-renders or effect loops
  const prevZoneName = useRef(currentZone.name);

  useEffect(() => {
    if (currentZone.name !== prevZoneName.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFadeZone(false); // Start fade out

      const timer = setTimeout(() => {
        setDisplayZone(currentZone);
        setFadeZone(true); // Start fade in
        prevZoneName.current = currentZone.name;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentZone]);

  return (
    <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute top-8 left-8 text-white font-light tracking-widest mix-blend-difference">
        <h1 className="text-xs opacity-50 uppercase">Altitude</h1>
        <p className="text-4xl font-thin">{altitude}m</p>
      </div>

      <div className={`absolute bottom-20 w-full text-center text-white px-4 mix-blend-difference transition-opacity duration-1000 ${fadeZone ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-xl md:text-2xl font-light tracking-widest mb-2 uppercase">
          {displayZone.name}
        </h2>
        <p className="text-sm md:text-base opacity-70 italic max-w-md mx-auto font-serif">
          "{displayZone.quote}"
        </p>
      </div>

      {/* Simple scroll indicator if at start */}
      {altitude < 850 && (
         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs opacity-50 animate-bounce tracking-widest uppercase">
            Scroll to Ascend
         </div>
      )}
    </div>
  );
};
