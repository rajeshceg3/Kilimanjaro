import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock scrollTo since it's not implemented in JSDOM
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
