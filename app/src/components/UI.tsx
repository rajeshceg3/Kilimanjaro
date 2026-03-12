import { useStore } from '../store/useStore';
import { getZoneAtAltitude, ZONES } from '../config/zones';
import { useEffect, useState, useRef } from 'react';

export const UI = () => {
  const altitude = useStore((state) => Math.round(state.altitude));
  const setTargetAltitude = useStore((state) => state.setTargetAltitude);
  const currentZone = getZoneAtAltitude(altitude);

  const [visible, setVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Zone transition state
  const [displayZone, setDisplayZone] = useState(currentZone);
  const [fadeZone, setFadeZone] = useState(true);

  // Summit Specifics
  const isSummitReached = altitude >= 5890;
  const [showSummitText, setShowSummitText] = useState(false);

  // Hover state for progress bar
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

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
        {/* Intro Overlay - First 5 seconds wow moment */}
        <div data-testid="intro-ui" className={`fixed inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-[2000ms] ${!hasStarted ? 'opacity-100 backdrop-blur-md bg-black/40' : 'opacity-0'}`}>
            <div className="text-center text-white mix-blend-difference px-6">
                <h1 className="text-5xl md:text-7xl font-extralight tracking-[0.3em] mb-4 uppercase animate-tracking-expand flex flex-col items-center">
                    <span className="font-serif italic text-white/80 text-4xl md:text-6xl mb-2 lowercase tracking-widest">mount</span>
                    <span>Kilimanjaro</span>
                </h1>
                <p className="text-sm md:text-base opacity-60 font-light leading-relaxed italic max-w-md mx-auto font-serif tracking-widest mb-12 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                    An ascent through ecological time.
                </p>
                <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-white/80 to-transparent mx-auto animate-scroll-indicator mt-8 opacity-0 animate-fade-in" style={{ animationDelay: '2s' }}></div>
            </div>
        </div>

        {/* Normal UI Overlay - Fades out at very top to reveal Summit Text cleanly */}
        {!showSummitText && hasStarted && (
          <div data-testid="main-ui" className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}>

              {/* Top Left: Altitude - Instant comprehension */}
              <div className="absolute top-8 left-8 md:top-12 md:left-12 text-white mix-blend-difference transition-opacity duration-1000">
                  <h1 className="text-xs opacity-50 uppercase tracking-[0.4em] mb-2 font-serif">Altitude</h1>
                  <p className="text-5xl md:text-7xl font-extralight tabular-nums tracking-[0.5em] drop-shadow-lg">{altitude}<span className="text-2xl md:text-3xl text-white/40 ml-2 font-serif font-light">m</span></p>
              </div>

              {/* Right: Progress Bar / Timeline - Discovery & Interaction */}
              <div className="absolute right-8 md:right-12 top-1/2 transform -translate-y-1/2 h-[60vh] w-4 hidden md:flex flex-col items-center pointer-events-auto group">
                  <div className="absolute w-[1px] h-full bg-white/10 group-hover:bg-white/20 transition-colors duration-500"></div>
                  <div
                    className="absolute bottom-0 w-[1px] bg-white/80 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ height: `${Math.max(0, Math.min(100, ((altitude - 800) / (6000 - 800)) * 100))}%` }}
                  ></div>

                  {ZONES.map((zone, idx) => {
                      const topPos = 100 - ((zone.minAltitude - 800) / (6000 - 800)) * 100;
                      return (
                      <div
                        key={idx}
                        className="absolute w-full group/zone cursor-pointer"
                        style={{ top: `${topPos}%`, transform: 'translateY(-50%)' }}
                        onMouseEnter={() => setHoveredZone(zone.name)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => setTargetAltitude(zone.minAltitude)}
                      >
                          <div className={`w-2 h-[1px] bg-white transition-all duration-300 ${altitude >= zone.minAltitude ? 'opacity-100 w-3' : 'opacity-30'} group-hover/zone:w-4 group-hover/zone:opacity-100`}></div>

                          {/* Tooltip on Hover */}
                          <div className={`absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-right transition-all duration-500 ${hoveredZone === zone.name ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                              <p className="text-[0.55rem] uppercase tracking-[0.4em] text-white/60 mb-1">{zone.minAltitude}m</p>
                              <p className="text-xs font-light tracking-widest text-white/90">{zone.name}</p>
                          </div>
                      </div>
                  )})}
                  <div className="absolute -top-8 text-[0.6rem] text-white/40 uppercase tracking-[0.4em]">5895</div>
                  <div className="absolute -bottom-8 text-[0.6rem] text-white/40 uppercase tracking-[0.4em]">800</div>
              </div>

              {/* Bottom: Zone Info - Context & Clarity */}
              <div className={`absolute bottom-16 md:bottom-24 w-full text-center text-white px-4 mix-blend-difference transition-all duration-1000 transform ${fadeZone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <h2 className="text-4xl md:text-5xl font-extralight tracking-[0.5em] text-white/90 mb-4 uppercase drop-shadow-md">
                  {displayZone.name}
                  </h2>
                  <p className="text-sm md:text-base opacity-60 font-light leading-relaxed italic max-w-lg mx-auto font-serif tracking-widest drop-shadow-md">
                  "{displayZone.quote}"
                  </p>
              </div>

              {/* Simple scroll indicator if at start */}
              {altitude < 850 && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-gentle-pulse transition-opacity duration-1000">
                      <div className="text-[0.6rem] text-white/60 uppercase tracking-[0.6em] font-light mb-2">
                          Scroll to Ascend
                      </div>
                  </div>
              )}
          </div>
        )}

        {/* Summit Special Text - Centered & Narrative */}
        <div data-testid="summit-ui" className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-[3000ms] ${showSummitText ? 'opacity-100 backdrop-blur-md bg-black/60' : 'opacity-0 scale-105'}`}>
            <div className="text-center text-white mix-blend-difference px-6 transform transition-transform duration-[4000ms] ease-out">
                <p className="text-3xl md:text-5xl font-light tracking-widest mb-8 font-serif italic text-white/90 drop-shadow-2xl">
                    "You are standing above weather."
                </p>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto mb-8"></div>
                <p className="text-sm md:text-base uppercase tracking-[0.6em] opacity-80 font-extralight">
                    Uhuru Peak · 5,895m
                </p>
            </div>
        </div>
    </>
  );
};
