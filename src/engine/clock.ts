/**
 * Injectable time source.
 *
 * All elapsed-time reads in this game flow through this interface instead of
 * calling `performance.now()`/`Date.now()` directly (banned by lint outside
 * this file), so real-time mechanics can be driven by a scripted clock in
 * tests instead of racing the wall clock.
 */
export interface Clock {
  /** Current time in milliseconds. Not comparable across different clocks. */
  now(): number;
}

/** A {@link Clock} backed by the browser's monotonic performance timer. */
export function createRealClock(): Clock {
  return {
    now: () => performance.now(),
  };
}

/** A {@link Clock} test double whose time only moves when told to. */
export interface ManualClock extends Clock {
  /** Moves the clock forward by the given number of milliseconds. */
  advance(deltaMs: number): void;
  /** Jumps the clock to an absolute time in milliseconds. */
  set(timeMs: number): void;
}

/** Creates a {@link ManualClock} starting at `startMs` (default 0). */
export function createManualClock(startMs = 0): ManualClock {
  let current = startMs;
  return {
    now: () => current,
    advance: (deltaMs: number) => {
      current += deltaMs;
    },
    set: (timeMs: number) => {
      current = timeMs;
    },
  };
}
