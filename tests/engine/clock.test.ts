import { describe, it, expect } from 'vitest';
import { createRealClock, createManualClock, realClock } from '../../src/engine/clock';

describe('createRealClock', () => {
  it('reports a non-negative, monotonic-ish time', () => {
    const clock = createRealClock();
    const first = clock.now();
    const second = clock.now();
    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThanOrEqual(first);
  });
});

describe('realClock', () => {
  it('is a usable shared Clock instance', () => {
    expect(realClock.now()).toBeGreaterThanOrEqual(0);
  });
});

describe('createManualClock', () => {
  it('starts at 0 by default', () => {
    const clock = createManualClock();
    expect(clock.now()).toBe(0);
  });

  it('starts at a given time', () => {
    const clock = createManualClock(500);
    expect(clock.now()).toBe(500);
  });

  it('advances by a delta', () => {
    const clock = createManualClock(100);
    clock.advance(50);
    expect(clock.now()).toBe(150);
    clock.advance(-30);
    expect(clock.now()).toBe(120);
  });

  it('jumps to an absolute time', () => {
    const clock = createManualClock(100);
    clock.set(9000);
    expect(clock.now()).toBe(9000);
  });
});
