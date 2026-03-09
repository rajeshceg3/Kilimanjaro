import { useStore } from '../store/useStore';
import { getZoneAtAltitude, ZONES } from '../config/zones';
import { useEffect, useState, useRef } from 'react';

export const UI = () => {
  const altitude = useStore((state) => Math.round(state.altitude));
  const currentZone = getZoneAtAltitude(altitude);

  const [visible, setVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Zone transition state
  const [displayZone, setDisplayZone] = useState(currentZone);
  const [fadeZone, setFadeZone] = useState(true);

  // Summit Specifics
  const isSummitReached = altitude >= 5890;
  const [showSummitText, setShowSummitText] = useState(false);

  // Intro Sequence
  useEffect(() => {
    if (altitude > 805) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasStarted(true);
    }
  }, [altitude]);

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
        {/* Intro Overlay */}
        <div data-testid="intro-ui" className={`fixed inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-[2000ms] ${!hasStarted ? 'opacity-100 backdrop-blur-sm bg-black/20' : 'opacity-0'}`}>
            <div className="text-center text-white mix-blend-difference px-6">
                <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.3em] mb-4 uppercase">
                    Mount
                    <br />
                    Kilimanjaro
                </h1>
                <p className="text-sm md:text-base opacity-60 font-light leading-relaxed italic max-w-md mx-auto font-serif tracking-widest mb-12">
                    An ascent through ecological time.
                </p>
            </div>
        </div>

        {/* Normal UI Overlay - Fades out at very top to reveal Summit Text cleanly */}
        {!showSummitText && hasStarted && (
          <div data-testid="main-ui" className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-8 left-8 md:top-12 md:left-12 text-white font-light tracking-widest mix-blend-difference">
                  <h1 className="text-[0.65rem] text-white/40 uppercase tracking-[0.5em] mb-1">Altitude</h1>
                  <p className="text-5xl md:text-6xl font-extralight tabular-nums tracking-wider">{altitude}<span className="text-3xl text-white/50 ml-1">m</span></p>
              </div>

              {/* Progress Bar */}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 h-[60vh] w-[1px] bg-white/10 hidden md:block">
                  <div
                    className="absolute bottom-0 w-full bg-white/70 transition-all duration-300 ease-out"
                    style={{ height: `${Math.max(0, Math.min(100, ((altitude - 800) / (6000 - 800)) * 100))}%` }}
                  ></div>
                  {ZONES.map((zone, idx) => (
                      <div
                        key={idx}
                        className="absolute w-2 h-[1px] bg-white/30 -left-[1px]"
                        style={{ bottom: `${((zone.minAltitude - 800) / (6000 - 800)) * 100}%` }}
                      ></div>
                  ))}
                  <div className="absolute -top-4 -left-3 text-[0.65rem] text-white/40 uppercase tracking-widest">5895</div>
                  <div className="absolute -bottom-4 -left-3 text-[0.65rem] text-white/40 uppercase tracking-widest">800</div>
              </div>

              {/* Zone Info - Hidden at very summit to show special text */}
              <div className={`absolute bottom-16 md:bottom-24 w-full text-center text-white px-4 mix-blend-difference transition-opacity duration-1000 ${fadeZone ? 'opacity-100' : 'opacity-0'}`}>
                  <h2 className="text-2xl md:text-4xl font-extralight tracking-[0.4em] text-white/80 mb-3 uppercase drop-shadow-sm">
                  {displayZone.name}
                  </h2>
                  <p className="text-sm md:text-lg opacity-70 font-light leading-relaxed italic max-w-md mx-auto font-serif">
                  "{displayZone.quote}"
                  </p>
              </div>

              {/* Simple scroll indicator if at start */}
              {altitude < 850 && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center opacity-60">
                      <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent animate-scroll-indicator mb-2"></div>
                      <div className="text-[0.6rem] text-white/50 uppercase tracking-[0.4em] font-light">
                          Scroll
                      </div>
                  </div>
              )}
          </div>
        )}

        {/* Summit Special Text - Centered */}
        <div data-testid="summit-ui" className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-[3000ms] ${showSummitText ? 'opacity-100 backdrop-blur-sm bg-black/10' : 'opacity-0'}`}>
            <div className="text-center text-white mix-blend-difference px-6">
                <p className="text-3xl md:text-5xl font-light tracking-widest mb-6 font-serif italic text-white/90">
                    "You are standing above weather."
                </p>
                <div className="w-24 h-px bg-white/40 mx-auto mb-6"></div>
                <p className="text-sm md:text-base uppercase tracking-[0.5em] opacity-70 font-extralight">
                    Uhuru Peak · 5,895m
                </p>
            </div>
        </div>
    </>
  );
};
