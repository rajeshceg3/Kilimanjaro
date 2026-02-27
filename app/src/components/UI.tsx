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

  // Summit Specifics
  const isSummitReached = altitude >= 5890;
  const [showSummitText, setShowSummitText] = useState(false);

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

  // Handle Summit Text
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isSummitReached) {
        timer = setTimeout(() => setShowSummitText(true), 1000);
    } else {
        // Also delay the hide slightly or just hide immediately but wrapped in timeout to appease linter/react logic
        // This ensures it's not synchronous in the effect execution
        timer = setTimeout(() => setShowSummitText(false), 0);
    }

    return () => clearTimeout(timer);
  }, [isSummitReached]);

  return (
    <>
        {/* Normal UI Overlay - Fades out at very top to reveal Summit Text cleanly */}
        {/* We use !showSummitText to remove it from DOM when summit is active, fixing test ambiguity */}
        {!showSummitText && (
          <div data-testid="main-ui" className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-8 left-8 text-white font-light tracking-widest mix-blend-difference">
                  <h1 className="text-xs opacity-50 uppercase">Altitude</h1>
                  <p className="text-4xl font-thin">{altitude}m</p>
              </div>

              {/* Zone Info - Hidden at very summit to show special text */}
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
        )}

        {/* Summit Special Text - Centered */}
        {/* Only rendered if needed, or always rendered but hidden? */}
        {/* To avoid layout shifts or complexity, let's keep it mounted but control visibility via opacity */}
        {/* Wait, if I unmount main UI, that solves duplicate text issues for main UI */}

        <div data-testid="summit-ui" className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-2000 ${showSummitText ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center text-white mix-blend-difference px-6">
                <p className="text-2xl md:text-3xl font-light tracking-widest mb-4 font-serif italic">
                    "You are standing above weather."
                </p>
                <div className="w-16 h-px bg-white mx-auto opacity-50 mb-4"></div>
                <p className="text-xs uppercase tracking-[0.3em] opacity-60">
                    Uhuru Peak · 5,895m
                </p>
            </div>
        </div>
    </>
  );
};
