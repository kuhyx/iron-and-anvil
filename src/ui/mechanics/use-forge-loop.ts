import { useEffect, useRef } from 'react';
import type { Clock } from '../../engine/clock';

/**
Drives `onTick` every animation frame with elapsed milliseconds since the
loop started, read from an injectable {@link Clock}. `onTick` never decides
hits or misses — it only interpolates draw positions from elapsed time, so
a dropped frame changes what gets drawn but never desyncs scoring (input
handlers judge against `clock.now()` directly, independent of this loop).
*/
export function useForgeLoop(onTick: (elapsedMs: number) => void, isActive: boolean, clock: Clock): void {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const startMs = clock.now();
    let animationFrameId = 0;
    const tick = (): void => {
      onTickRef.current(clock.now() - startMs);
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, clock]);
}
