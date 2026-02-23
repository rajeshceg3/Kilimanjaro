import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({ altitude: 800, targetAltitude: 800 });
  });

  it('should initialize with default values', () => {
    const state = useStore.getState();
    expect(state.altitude).toBe(800);
    expect(state.targetAltitude).toBe(800);
  });

  it('should update altitude', () => {
    useStore.getState().setAltitude(1500);
    expect(useStore.getState().altitude).toBe(1500);
  });

  it('should update targetAltitude', () => {
    useStore.getState().setTargetAltitude(2000);
    expect(useStore.getState().targetAltitude).toBe(2000);
  });
});
