import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UI } from './UI';
import { useStore } from '../store/useStore';

// Helper to get the main container
const getContainer = () => screen.getByTestId('main-ui');

describe('UI Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store to an altitude above 805 to bypass the intro screen logic in tests
    act(() => {
      useStore.setState({ altitude: 810, targetAltitude: 810 });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders initial altitude and zone information', () => {
    render(<UI />);
    expect(screen.getByText('810')).toBeInTheDocument();
    // Use getAllByText because the zone name appears in the main area and in the timeline tooltips
    expect(screen.getAllByText('Cultivation Zone').length).toBeGreaterThan(0);
  });

  it('updates when altitude changes', () => {
    render(<UI />);

    act(() => {
      useStore.setState({ altitude: 2000 });
    });

    // Altitude updates immediately
    expect(screen.getByText('2000')).toBeInTheDocument();

    // Zone text has a transition delay of 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getAllByText('Rainforest Zone').length).toBeGreaterThan(0);
  });

  it('handles visibility timeout', () => {
    render(<UI />);

    const container = getContainer();
    expect(container).toHaveClass('opacity-100');

    // Advance time by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Re-query in case of DOM changes (though unlikely for class change)
    const updatedContainer = getContainer();
    expect(updatedContainer).toHaveClass('opacity-0');
  });

  it('does NOT reset HUD visibility on zone change (decoupled)', () => {
    render(<UI />);

    // Advance time to make HUD hidden
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(getContainer()).toHaveClass('opacity-0');

    // Change altitude across a zone boundary (e.g. 810 to 1800+)
    act(() => {
      useStore.setState({ altitude: 2000 });
    });

    // HUD should remain hidden since it's decoupled from zone narrative text
    expect(getContainer()).toHaveClass('opacity-0');
  });

  it('wakes UI on user interaction', () => {
    render(<UI />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(getContainer()).toHaveClass('opacity-0');

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    expect(getContainer()).toHaveClass('opacity-100');
  });
});
