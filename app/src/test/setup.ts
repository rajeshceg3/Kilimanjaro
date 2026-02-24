import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock scrollTo since it's not implemented in JSDOM
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock AudioContext
globalThis.AudioContext = class AudioContext {
  state = 'suspended';
  createGain() {
    return {
      gain: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(0),
    };
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  get destination() {
    return {};
  }
  get sampleRate() {
    return 44100;
  }
  get currentTime() {
    return 0;
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

globalThis.webkitAudioContext = globalThis.AudioContext;
