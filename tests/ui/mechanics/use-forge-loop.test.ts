import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForgeLoop } from '../../../src/ui/mechanics/use-forge-loop';
import { createManualClock } from '../../../src/engine/clock';

describe('useForgeLoop', () => {
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

  it('does not start the loop when inactive', () => {
    const onTick = vi.fn();
    renderHook(() => {
      useForgeLoop(onTick, false, createManualClock());
    });
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('ticks with elapsed time since the loop started', () => {
    const onTick = vi.fn();
    const clock = createManualClock(1000);
    renderHook(() => {
      useForgeLoop(onTick, true, clock);
    });

    clock.advance(250);
    flushTick();
    expect(onTick).toHaveBeenCalledWith(250);

    clock.advance(250);
    flushTick();
    expect(onTick).toHaveBeenCalledWith(500);
  });

  it('always calls the latest onTick without restarting the loop', () => {
    const firstTick = vi.fn();
    const secondTick = vi.fn();
    const clock = createManualClock();

    const { rerender } = renderHook(({ onTick }) => {
      useForgeLoop(onTick, true, clock);
    }, { initialProps: { onTick: firstTick } });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    rerender({ onTick: secondTick });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    clock.advance(16);
    flushTick();
    expect(firstTick).not.toHaveBeenCalled();
    expect(secondTick).toHaveBeenCalledWith(16);
  });

  it('cancels the animation frame on unmount', () => {
    const { unmount } = renderHook(() => {
      useForgeLoop(vi.fn(), true, createManualClock());
    });
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
