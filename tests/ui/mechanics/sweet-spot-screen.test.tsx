import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { SweetSpotScreen } from '../../../src/ui/mechanics/sweet-spot-screen';
import { createManualClock } from '../../../src/engine/clock';

const PERIOD_MS = 1400;
const PERFECT_ELAPSED = 350; // needlePosition(350, 1400) === 0.5, dead center of the 0.4-0.6 zone
const MISS_ELAPSED = 70; // needlePosition(70, 1400) === 0.1, well outside the zone

describe('SweetSpotScreen', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const flushTick = (): void => {
    const callback = rafCallbacks.pop();
    if (callback) {
      act(() => {
        callback(0);
      });
    }
  };

  it('renders the starting state', () => {
    render(<SweetSpotScreen clock={createManualClock()} />);
    expect(screen.getByRole('heading', { name: 'Sweet-Spot Strike' })).toBeInTheDocument();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('yellow');
    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
  });

  it('reaches a fine result after enough perfect strikes and reports it once', () => {
    const clock = createManualClock();
    const onFinish = vi.fn();
    render(<SweetSpotScreen clock={clock} onFinish={onFinish} />);

    // Hold Fuel throughout so cooling over ~9 simulated seconds never drops
    // the workpiece out of the workable band between strikes.
    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));

    for (let strikeIndex = 0; strikeIndex < 7; strikeIndex += 1) {
      clock.set(PERFECT_ELAPSED + strikeIndex * PERIOD_MS);
      flushTick();
      fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    }

    expect(screen.getByTestId('result')).toHaveTextContent('fine');
    expect(screen.queryByRole('button', { name: 'Strike' })).not.toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0]?.[0]).toMatchObject({ shapeProgress: 100 });
  });

  it('offers a Back to Menu action only when a handler is provided', () => {
    const clock = createManualClock();
    const onBackToMenu = vi.fn();
    render(<SweetSpotScreen clock={clock} onBackToMenu={onBackToMenu} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    for (let strikeIndex = 0; strikeIndex < 7; strikeIndex += 1) {
      clock.set(PERFECT_ELAPSED + strikeIndex * PERIOD_MS);
      flushTick();
      fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    }

    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(onBackToMenu).toHaveBeenCalledTimes(1);
  });

  it('reaches a ruined result after enough missed strikes', () => {
    const clock = createManualClock();
    render(<SweetSpotScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));

    for (let strikeIndex = 0; strikeIndex < 10; strikeIndex += 1) {
      clock.set(MISS_ELAPSED + strikeIndex * PERIOD_MS);
      flushTick();
      fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    }

    expect(screen.getByTestId('result')).toHaveTextContent('ruined');
    expect(screen.getByTestId('flaw')).toHaveTextContent('100');
  });

  it('skips the heat update when a tick reports no elapsed time', () => {
    const clock = createManualClock();
    render(<SweetSpotScreen clock={clock} />);

    clock.set(100);
    flushTick();
    const heatAfterFirstTick = screen.getByTestId('heat-color').textContent;

    // Same elapsed time again: deltaMs is 0, so the heat update is skipped.
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent(heatAfterFirstTick);
  });

  it('heats up while Fuel is held and cools once released', () => {
    const clock = createManualClock();
    render(<SweetSpotScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(3000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('white');

    fireEvent.pointerUp(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(20_000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('black');
  });

  it('stops fueling on pointer leave, not just pointer up', () => {
    const clock = createManualClock();
    render(<SweetSpotScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    expect(screen.getByRole('button', { name: /Fueling/ })).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole('button', { name: /Fueling/ }));
    expect(screen.getByRole('button', { name: 'Hold to Fuel' })).toBeInTheDocument();
  });

  it('resets to the starting state on Try Again', () => {
    const clock = createManualClock();
    render(<SweetSpotScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    for (let strikeIndex = 0; strikeIndex < 10; strikeIndex += 1) {
      clock.set(MISS_ELAPSED + strikeIndex * PERIOD_MS);
      flushTick();
      fireEvent.click(screen.getByRole('button', { name: 'Strike' }));
    }
    expect(screen.getByTestId('result')).toHaveTextContent('ruined');

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Strike' })).toBeInTheDocument();
  });
});
