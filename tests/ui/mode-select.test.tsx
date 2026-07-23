import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSelect } from '../../src/ui/mode-select';

describe('ModeSelect', () => {
  it('renders all four mechanics', () => {
    render(<ModeSelect onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Sweet-Spot Strike/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shape Sculpting/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meter Juggling/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Turn-Based Resolution/ })).toBeInTheDocument();
  });

  it('calls onSelect with the chosen mode', () => {
    const onSelect = vi.fn();
    render(<ModeSelect onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Shape Sculpting/ }));
    expect(onSelect).toHaveBeenCalledWith('shapeSculpt');
  });
});
