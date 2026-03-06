import { create } from 'zustand';

interface State {
  altitude: number;
  targetAltitude: number;
  setTargetAltitude: (alt: number) => void;
  setAltitude: (alt: number) => void;
}

export const useStore = create<State>((set) => ({
  altitude: 800,
  targetAltitude: 800,
  setTargetAltitude: (alt) => set({ targetAltitude: alt }),
  setAltitude: (alt) => set({ altitude: alt }),
}));

// Expose store to window for E2E tests to bypass rendering lag
if (typeof window !== 'undefined') {
  (window as any).useStore = useStore;
}
