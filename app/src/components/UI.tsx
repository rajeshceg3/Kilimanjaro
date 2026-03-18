import { useStore } from '../store/useStore';
import { getZoneAtAltitude, ZONES } from '../config/zones';
import { useEffect, useState, useRef } from 'react';

export const UI = () => {
  const altitude = useStore((state) => Math.round(state.altitude));
  const setTargetAltitude = useStore((state) => state.setTargetAltitude);
  const isTourActive = useStore((state) => state.isTourActive);
  const setTourActive = useStore((state) => state.setTourActive);
  const isTourPaused = useStore((state) => state.isTourPaused);
  const setTourPaused = useStore((state) => state.setTourPaused);
  const currentZone = getZoneAtAltitude(altitude);

  const [visible, setVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Zone transition state
  const [displayZone, setDisplayZone] = useState(currentZone);
  const [fadeZoneName, setFadeZoneName] = useState(true);
  const [fadeZoneQuote, setFadeZoneQuote] = useState(true);

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
  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wakeUp = () => {
        setVisible(true);
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = setTimeout(() => setVisible(false), 3000);
    };

    window.addEventListener('mousemove', wakeUp);
    window.addEventListener('touchstart', wakeUp);
    window.addEventListener('wheel', wakeUp);
    window.addEventListener('keydown', wakeUp);

    // Initial timeout
    wakeUp();

    return () => {
      window.removeEventListener('mousemove', wakeUp);
      window.removeEventListener('touchstart', wakeUp);
      window.removeEventListener('wheel', wakeUp);
      window.removeEventListener('keydown', wakeUp);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, []);

  // Handle zone text transition with progressive disclosure
  const prevZoneName = useRef(currentZone.name);

  useEffect(() => {
    if (currentZone.name !== prevZoneName.current) {
      // Start fade out for both
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFadeZoneName(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFadeZoneQuote(false);

      // Notice: We DO NOT force `setVisible(true)` here anymore.
      // The HUD (altitude, timeline) only wakes on user interaction.
      // The zone text (name/quote) is decoupled and controlled by fadeZoneName/fadeZoneQuote.

      const updateZoneTimer = setTimeout(() => {
        setDisplayZone(currentZone);
        setFadeZoneName(true); // Fade in name first
        prevZoneName.current = currentZone.name;
      }, 2000);

      const quoteTimer = setTimeout(() => {
        setFadeZoneQuote(true); // Fade in quote 2s later
      }, 4000);

      const hideTimer = setTimeout(() => {
        setFadeZoneName(false);
        setFadeZoneQuote(false);
      }, 10000); // Hide both after 10 seconds

      return () => {
        clearTimeout(updateZoneTimer);
        clearTimeout(quoteTimer);
        clearTimeout(hideTimer);
      };
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

                          {/* Tooltip on Hover with progressive disclosure */}
                          <div className={`absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-right transition-all duration-500 ${hoveredZone === zone.name ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                              <p className="text-[0.55rem] uppercase tracking-[0.4em] text-white/60 mb-1">{zone.minAltitude}m</p>
                              <p className="text-xs font-light tracking-widest text-white/90">
                                {altitude >= zone.minAltitude || hoveredZone === zone.name ? zone.name : "Unknown Zone"}
                              </p>
                          </div>
                      </div>
                  )})}
                  <div className="absolute -top-8 text-[0.6rem] text-white/40 uppercase tracking-[0.4em]">5895</div>
                  <div className="absolute -bottom-8 text-[0.6rem] text-white/40 uppercase tracking-[0.4em]">800</div>
              </div>

              {/* Bottom: Zone Info - Context & Clarity (Progressive Reveal) */}
              {/* Note: This is now decoupled from the 'visible' state of the HUD container */}
          </div>
        )}

        {/* Narrative Text Layer - Independent of HUD visibility */}
        {!showSummitText && hasStarted && (
              <div className="fixed bottom-16 md:bottom-24 w-full text-center text-white px-4 mix-blend-difference pointer-events-none transition-opacity duration-1000 z-10">
                  <h2 className={`text-4xl md:text-5xl font-extralight tracking-[0.5em] text-white/90 mb-4 uppercase drop-shadow-md transition-all duration-1000 transform ${fadeZoneName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  {displayZone.name}
                  </h2>
                  <p className={`text-sm md:text-base opacity-60 font-light leading-relaxed italic max-w-lg mx-auto font-serif tracking-widest drop-shadow-md transition-all duration-1000 transform ${fadeZoneQuote ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  "{displayZone.quote}"
                  </p>
              </div>
        )}

        {/* Buttons layer - Visible always but logic handles specific states */}
        {!showSummitText && hasStarted && (
            <div className="fixed inset-0 pointer-events-none z-20">
              {/* Simple scroll indicator if at start */}
              {altitude < 850 && (
                  <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-gentle-pulse transition-opacity duration-1000 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="text-[0.6rem] text-white/60 uppercase tracking-[0.6em] font-light mb-2">
                          Scroll to Ascend
                      </div>
                      <button
                        className="mt-4 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-xs font-light tracking-widest text-white/80 hover:bg-white/10 hover:scale-105 transition-all duration-500 pointer-events-auto"
                        onClick={() => {
                          setVisible(false); // Hide HUD
                          setFadeZoneName(false); // Hide text
                          setFadeZoneQuote(false); // Hide text

                          // Pause briefly to simulate a "deep breath" before starting
                          setTimeout(() => {
                            setTargetAltitude(801); // Trigger the start
                            setTourActive(true);
                          }, 2500);
                        }}
                      >
                        Start Guided Tour
                      </button>
                  </div>
              )}

              {/* Guided Tour Status & Controls */}
              {isTourActive && altitude >= 850 && (
                  <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-fade-in transition-opacity duration-1000 pointer-events-auto ${visible ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="text-[0.6rem] text-white/40 uppercase tracking-[0.6em] font-light mb-2 flex items-center gap-2">
                          {isTourPaused && <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse"></span>}
                          Guided Tour {isTourPaused ? 'Paused' : 'Active'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-6 py-2 rounded-full border border-white/10 bg-black/10 backdrop-blur-sm text-[0.6rem] font-extralight tracking-widest text-white/60 hover:text-white/90 hover:border-white/30 transition-all duration-500 pointer-events-auto"
                          onClick={() => setTourPaused(!isTourPaused)}
                        >
                          {isTourPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          className="px-6 py-2 rounded-full border border-white/10 bg-black/10 backdrop-blur-sm text-[0.6rem] font-extralight tracking-widest text-white/60 hover:text-white/90 hover:border-white/30 transition-all duration-500 pointer-events-auto"
                          onClick={() => setTourActive(false)}
                        >
                          Exit Tour
                        </button>
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
