import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock Experience component since it renders Three.js Canvas
vi.mock('./Experience', () => ({
  Experience: () => <div data-testid="experience">Experience Component</div>
}));

// Mock UI component to isolate App testing
vi.mock('./UI', () => ({
  UI: () => <div data-testid="ui">UI Component</div>
}));

describe('App Component', () => {
  it('renders Experience and UI components', () => {
    render(<App />);
    expect(screen.getByTestId('experience')).toBeInTheDocument();
    expect(screen.getByTestId('ui')).toBeInTheDocument();
  });
});
