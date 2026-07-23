import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MeterJuggleScreen } from '../../../src/ui/mechanics/meter-juggle-screen';
import { createManualClock } from '../../../src/engine/clock';

describe('MeterJuggleScreen', () => {
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
    render(<MeterJuggleScreen clock={createManualClock()} />);
    expect(screen.getByRole('heading', { name: 'Meter Juggling' })).toBeInTheDocument();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('yellow');
    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
  });

  it('advances shape progress on Hammer', () => {
    render(<MeterJuggleScreen clock={createManualClock()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hammer' }));
    expect(Number(screen.getByTestId('shape-progress').textContent)).toBeGreaterThan(0);
  });

  it('relieves stress on Temper', () => {
    const clock = createManualClock();
    render(<MeterJuggleScreen clock={clock} />);

    clock.set(5000);
    flushTick();
    const flawBeforeTemper = Number(screen.getByTestId('flaw').textContent);
    expect(flawBeforeTemper).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Temper' }));
    expect(Number(screen.getByTestId('flaw').textContent)).toBeLessThan(flawBeforeTemper);
  });

  it('reaches a fine result after enough Hammer taps and reports it once', () => {
    const onFinish = vi.fn();
    render(<MeterJuggleScreen clock={createManualClock()} onFinish={onFinish} />);

    for (let tap = 0; tap < 15; tap += 1) {
      const hammerButton = screen.queryByRole('button', { name: 'Hammer' });
      if (!hammerButton) {
        break;
      }
      fireEvent.click(hammerButton);
    }

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('100');
    expect(screen.getByTestId('result')).toHaveTextContent('fine');
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('offers a Back to Menu action only when a handler is provided', () => {
    const onBackToMenu = vi.fn();
    render(<MeterJuggleScreen clock={createManualClock()} onBackToMenu={onBackToMenu} />);

    for (let tap = 0; tap < 15; tap += 1) {
      const hammerButton = screen.queryByRole('button', { name: 'Hammer' });
      if (!hammerButton) {
        break;
      }
      fireEvent.click(hammerButton);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(onBackToMenu).toHaveBeenCalledTimes(1);
  });

  it('reaches a ruined result once stress is left unattended long enough', () => {
    const clock = createManualClock();
    render(<MeterJuggleScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(40_000);
    flushTick();

    expect(screen.getByTestId('flaw')).toHaveTextContent('100');
    expect(screen.getByTestId('result')).toHaveTextContent('ruined');
  });

  it('skips the heat/stress update when a tick reports no elapsed time', () => {
    const clock = createManualClock();
    render(<MeterJuggleScreen clock={clock} />);

    clock.set(100);
    flushTick();
    const flawAfterFirstTick = screen.getByTestId('flaw').textContent;

    flushTick();
    expect(screen.getByTestId('flaw')).toHaveTextContent(flawAfterFirstTick);
  });

  it('heats up while Fuel is held and cools once released', () => {
    const clock = createManualClock();
    render(<MeterJuggleScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(3000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('white');

    fireEvent.pointerUp(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(20_000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('black');
  });

  it('stops fueling on pointer leave', () => {
    render(<MeterJuggleScreen clock={createManualClock()} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    expect(screen.getByRole('button', { name: /Fueling/ })).toBeInTheDocument();
    fireEvent.pointerLeave(screen.getByRole('button', { name: /Fueling/ }));
    expect(screen.getByRole('button', { name: 'Hold to Fuel' })).toBeInTheDocument();
  });

  it('resets to the starting state on Try Again', () => {
    render(<MeterJuggleScreen clock={createManualClock()} />);

    for (let tap = 0; tap < 15; tap += 1) {
      const hammerButton = screen.queryByRole('button', { name: 'Hammer' });
      if (!hammerButton) {
        break;
      }
      fireEvent.click(hammerButton);
    }
    expect(screen.getByTestId('result')).toHaveTextContent('fine');

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Hammer' })).toBeInTheDocument();
  });
});
