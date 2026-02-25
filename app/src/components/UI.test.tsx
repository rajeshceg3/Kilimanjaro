import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UI } from './UI';
import { useStore } from '../store/useStore';

// Helper to get the main container
const getContainer = () => screen.getByText(/Altitude/i).closest('div')?.parentElement;

describe('UI Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store
    act(() => {
      useStore.setState({ altitude: 800, targetAltitude: 800 });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders initial altitude and zone information', () => {
    render(<UI />);
    expect(screen.getByText('800m')).toBeInTheDocument();
    expect(screen.getByText('Cultivation Zone')).toBeInTheDocument();
  });

  it('updates when altitude changes', () => {
    render(<UI />);

    act(() => {
      useStore.setState({ altitude: 2000 });
    });

    // Altitude updates immediately
    expect(screen.getByText('2000m')).toBeInTheDocument();

    // Zone text has a transition delay of 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Rainforest Zone')).toBeInTheDocument();
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

  it('resets visibility on altitude change', () => {
    render(<UI />);

    // Advance time to make it hidden
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(getContainer()).toHaveClass('opacity-0');

    // Change altitude
    act(() => {
      useStore.setState({ altitude: 850 });
    });

    // Should be visible again
    expect(getContainer()).toHaveClass('opacity-100');
  });
});
