// Shared reduced-motion check (fleet accessibility rule).
// Ambient animation freezes when the user prefers reduced motion;
// user-driven movement (tour, camera follow, fog) still responds.
export const isReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
