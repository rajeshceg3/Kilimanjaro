// Reuse one live media query instead of allocating a new one in each frame callback.
const preference = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export const isReducedMotion = (): boolean => preference?.matches ?? false;
