import { describe, it, expect } from 'vitest';
import {
  needlePosition,
  judgeStrike,
  applyStrike,
  type SweetSpotConfig,
} from '../../src/mechanics/sweet-spot';

describe('needlePosition', () => {
  it('sweeps from 0 up to 1 across the first half of the period', () => {
    expect(needlePosition(0, 1000)).toBe(0);
    expect(needlePosition(250, 1000)).toBeCloseTo(0.5);
    expect(needlePosition(500, 1000)).toBeCloseTo(1);
  });

  it('sweeps back down to 0 across the second half of the period', () => {
    expect(needlePosition(750, 1000)).toBeCloseTo(0.5);
    expect(needlePosition(999, 1000)).toBeCloseTo(0, 1);
  });

  it('wraps around after a full period', () => {
    expect(needlePosition(1000, 1000)).toBeCloseTo(0);
    expect(needlePosition(1250, 1000)).toBeCloseTo(0.5);
  });
});

describe('judgeStrike', () => {
  const config: SweetSpotConfig = {
    periodMs: 1000,
    sweetSpotStart: 0.4,
    sweetSpotEnd: 0.6,
    perfectMargin: 0.5,
  };

  it('misses below the sweet spot', () => {
    expect(judgeStrike(0.1, config)).toBe('miss');
  });

  it('misses above the sweet spot', () => {
    expect(judgeStrike(0.9, config)).toBe('miss');
  });

  it('is perfect at the exact center', () => {
    expect(judgeStrike(0.5, config)).toBe('perfect');
  });

  it('is good near the edge of the zone, outside the perfect margin', () => {
    expect(judgeStrike(0.41, config)).toBe('good');
  });

  it('treats the zone boundaries as hits, not misses', () => {
    expect(judgeStrike(0.4, config)).toBe('good');
    expect(judgeStrike(0.6, config)).toBe('good');
  });
});

function workpiece(temperatureC: number, shapeProgress = 0, flaw = 0) {
  return { temperatureC, shapeProgress, flaw };
}

describe('applyStrike', () => {
  it('ruins a burnt workpiece regardless of judgment', () => {
    const result = applyStrike(workpiece(1600, 50, 0), 'perfect');
    expect(result.flaw).toBe(100);
  });

  it('wastes the strike on metal too cold to work', () => {
    const cold = workpiece(20, 50, 10);
    expect(applyStrike(cold, 'perfect')).toEqual(cold);
  });

  it('advances shape progress on a perfect hit', () => {
    const result = applyStrike(workpiece(1000, 50, 0), 'perfect');
    expect(result.shapeProgress).toBe(65);
  });

  it('advances shape progress less on a good hit', () => {
    const result = applyStrike(workpiece(1000, 50, 0), 'good');
    expect(result.shapeProgress).toBe(58);
  });

  it('adds flaw on a miss', () => {
    const result = applyStrike(workpiece(1000, 50, 0), 'miss');
    expect(result.flaw).toBe(10);
  });

  it('clamps shape progress at 100', () => {
    const result = applyStrike(workpiece(1000, 95, 0), 'perfect');
    expect(result.shapeProgress).toBe(100);
  });

  it('clamps flaw at 100', () => {
    const result = applyStrike(workpiece(1000, 0, 95), 'miss');
    expect(result.flaw).toBe(100);
  });
});
