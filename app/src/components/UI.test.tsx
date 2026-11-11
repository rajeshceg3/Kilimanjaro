import { render, screen, act, fireEvent } from '@testing-library/react';
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
      useStore.setState({ altitude: 810, targetAltitude: 810, isTourActive: false, isTourPaused: false });
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

  it('DOES reset HUD visibility on zone change (narrative milestone)', () => {
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

    // HUD should wake up because of the narrative milestone transition
    expect(getContainer()).toHaveClass('opacity-100');

    // And fade out after the new 5s duration
    act(() => {
      vi.advanceTimersByTime(5000);
    });

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

describe('Guided tour manual stepper', () => {
  beforeEach(() => {
    act(() => {
      useStore.setState({ altitude: 2000, targetAltitude: 2000, isTourActive: true, isTourPaused: false });
    });
  });

  it('shows the current zone and position counter on the tour card', () => {
    render(<UI />);
    expect(screen.getByTestId('tour-zone-name')).toHaveTextContent('Rainforest Zone');
    expect(screen.getByTestId('tour-counter')).toHaveTextContent('2 / 5');
  });

  it('Next pauses the auto tour and targets the next zone start', () => {
    render(<UI />);
    fireEvent.click(screen.getByTestId('tour-next'));
    expect(useStore.getState().isTourPaused).toBe(true);
    expect(useStore.getState().targetAltitude).toBe(2801);
  });

  it('Prev pauses the auto tour and steps back to the previous zone start', () => {
    render(<UI />);
    fireEvent.click(screen.getByTestId('tour-prev'));
    expect(useStore.getState().isTourPaused).toBe(true);
    expect(useStore.getState().targetAltitude).toBe(801);
  });

  it('Auto resumes the ascent after manual stepping', () => {
    render(<UI />);
    fireEvent.click(screen.getByTestId('tour-next'));
    expect(useStore.getState().isTourPaused).toBe(true);
    fireEvent.click(screen.getByTestId('tour-auto'));
    expect(useStore.getState().isTourPaused).toBe(false);
  });

  it('wraps Prev from the first zone to the summit', () => {
    act(() => {
      useStore.setState({ altitude: 900, targetAltitude: 900 });
    });
    render(<UI />);
    fireEvent.click(screen.getByTestId('tour-prev'));
    expect(useStore.getState().targetAltitude).toBe(5895);
    expect(useStore.getState().isTourPaused).toBe(true);
  });

  it('hides Auto while the ascent runs and shows it only in manual mode', () => {
    render(<UI />);
    expect(screen.queryByTestId('tour-auto')).toBeNull();
    fireEvent.click(screen.getByTestId('tour-next'));
    expect(screen.getByTestId('tour-auto')).toBeTruthy();
  });

  it('arrow keys mirror Next and Prev', () => {
    render(<UI />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(useStore.getState().targetAltitude).toBe(2801);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(useStore.getState().targetAltitude).toBe(801);
  });

  it('offers Summit from the last zone and climbs to 5895', () => {
    act(() => {
      useStore.setState({ altitude: 5200, targetAltitude: 5200 });
    });
    render(<UI />);
    const next = screen.getByTestId('tour-next');
    expect(next).toHaveTextContent('Summit');
    fireEvent.click(next);
    expect(useStore.getState().targetAltitude).toBe(5895);
    expect(useStore.getState().isTourPaused).toBe(true);
  });

  it('wraps Next from the summit back to the first zone', () => {
    act(() => {
      useStore.setState({ altitude: 5895, targetAltitude: 5895 });
    });
    render(<UI />);
    fireEvent.click(screen.getByTestId('tour-next'));
    expect(useStore.getState().targetAltitude).toBe(801);
  });
});
