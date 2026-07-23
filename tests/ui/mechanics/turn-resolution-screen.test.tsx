import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TurnResolutionScreen } from '../../../src/ui/mechanics/turn-resolution-screen';

describe('TurnResolutionScreen', () => {
  it('renders the starting state', () => {
    render(<TurnResolutionScreen />);
    expect(screen.getByRole('heading', { name: 'Turn-Based Resolution' })).toBeInTheDocument();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('yellow');
    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
  });

  it('raises heat on the Heat action', () => {
    render(<TurnResolutionScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Heat' }));
    expect(screen.getByTestId('heat-color')).toHaveTextContent('white');
  });

  it('advances shape progress on the Strike action', () => {
    render(<TurnResolutionScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    expect(Number(screen.getByTestId('shape-progress').textContent)).toBeGreaterThan(0);
  });

  it('accumulates flaw once repeated strikes cool the metal past workable, and Fold relieves it', () => {
    render(<TurnResolutionScreen />);
    for (let strikeIndex = 0; strikeIndex < 8; strikeIndex += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    }
    const flawBeforeFold = Number(screen.getByTestId('flaw').textContent);
    expect(flawBeforeFold).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
    expect(Number(screen.getByTestId('flaw').textContent)).toBeLessThan(flawBeforeFold);
  });

  it('reaches a finished result by alternating Heat and Strike, reporting it once', () => {
    const onFinish = vi.fn();
    render(<TurnResolutionScreen onFinish={onFinish} />);

    for (let turn = 0; turn < 40; turn += 1) {
      const action = turn % 2 === 0 ? 'Heat' : 'Strike';
      const button = screen.queryByRole('button', { name: action });
      if (!button) {
        break;
      }
      fireEvent.click(button);
    }

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('100');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
    expect(screen.getByTestId('result')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('offers a Back to Menu action only when a handler is provided', () => {
    const onBackToMenu = vi.fn();
    render(<TurnResolutionScreen onBackToMenu={onBackToMenu} />);

    for (let turn = 0; turn < 40; turn += 1) {
      const action = turn % 2 === 0 ? 'Heat' : 'Strike';
      const button = screen.queryByRole('button', { name: action });
      if (!button) {
        break;
      }
      fireEvent.click(button);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(onBackToMenu).toHaveBeenCalledTimes(1);
  });

  it('resets to the starting state on Try Again', () => {
    render(<TurnResolutionScreen />);

    for (let turn = 0; turn < 40; turn += 1) {
      const action = turn % 2 === 0 ? 'Heat' : 'Strike';
      const button = screen.queryByRole('button', { name: action });
      if (!button) {
        break;
      }
      fireEvent.click(button);
    }
    expect(screen.getByTestId('result')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Heat' })).toBeInTheDocument();
  });
});
