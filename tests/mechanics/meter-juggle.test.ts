import { describe, it, expect } from 'vitest';
import { hammerGain, applyHammer, applyTemper, accumulateStress } from '../../src/mechanics/meter-juggle';

function workpiece(temperatureC: number, shapeProgress = 0, flaw = 0) {
  return { temperatureC, shapeProgress, flaw };
}

describe('hammerGain', () => {
  it('is zero below the workable threshold', () => {
    expect(hammerGain(20)).toBe(0);
    expect(hammerGain(549)).toBe(0);
  });

  it('grows with temperature between workable and burning', () => {
    const cool = hammerGain(600);
    const hot = hammerGain(1400);
    expect(cool).toBeGreaterThan(0);
    expect(hot).toBeGreaterThan(cool);
  });
});

describe('applyHammer', () => {
  it('ruins a burnt workpiece instead of advancing shape', () => {
    const result = applyHammer(workpiece(1600, 50, 0));
    expect(result.flaw).toBe(100);
    expect(result.shapeProgress).toBe(50);
  });

  it('advances shape progress at a workable temperature', () => {
    const result = applyHammer(workpiece(1200, 0, 0));
    expect(result.shapeProgress).toBeGreaterThan(0);
  });

  it('does nothing at a temperature too cold to work', () => {
    const cold = workpiece(20, 10, 0);
    expect(applyHammer(cold)).toEqual(cold);
  });

  it('clamps shape progress at 100', () => {
    const result = applyHammer(workpiece(1400, 95, 0));
    expect(result.shapeProgress).toBe(100);
  });
});

describe('applyTemper', () => {
  it('reduces flaw by a fixed amount', () => {
    const result = applyTemper(workpiece(1200, 0, 50));
    expect(result.flaw).toBe(30);
  });

  it('clamps flaw at 0', () => {
    const result = applyTemper(workpiece(1200, 0, 5));
    expect(result.flaw).toBe(0);
  });
});

describe('accumulateStress', () => {
  it('adds no stress while too cold to matter', () => {
    const result = accumulateStress(workpiece(20, 0, 10), 5000);
    expect(result.flaw).toBe(10);
  });

  it('adds stress at the steady rate while workable', () => {
    const result = accumulateStress(workpiece(1200, 0, 0), 1000);
    expect(result.flaw).toBeCloseTo(3);
  });

  it('adds stress much faster once burnt', () => {
    const workable = accumulateStress(workpiece(1200, 0, 0), 1000);
    const burnt = accumulateStress(workpiece(1600, 0, 0), 1000);
    expect(burnt.flaw).toBeGreaterThan(workable.flaw);
  });

  it('clamps flaw at 100', () => {
    const result = accumulateStress(workpiece(1600, 0, 90), 10_000);
    expect(result.flaw).toBe(100);
  });
});
