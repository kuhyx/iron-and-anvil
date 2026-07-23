import { useEffect, useRef } from 'react';
import type { Clock } from '../../engine/clock';

/**
 * Drives `onTick` every animation frame with elapsed milliseconds since the
 * loop started, read from an injectable {@link Clock}. `onTick` never decides
 * hits or misses — it only interpolates draw positions from elapsed time, so
 * a dropped frame changes what gets drawn but never desyncs scoring (input
 * handlers judge against `clock.now()` directly, independent of this loop).
 */
export function useForgeLoop(onTick: (elapsedMs: number) => void, active: boolean, clock: Clock): void {
  const onTickReference = useRef(onTick);

  useEffect(() => {
    onTickReference.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const startMs = clock.now();
    let animationFrameId = 0;
    const tick = (): void => {
      onTickReference.current(clock.now() - startMs);
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, clock]);
}
