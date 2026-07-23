import { describe, it, expect } from 'vitest';
import {
  AMBIENT_C,
  BURN_C,
  heatColorFor,
  isWorkable,
  isBurnt,
  coolTemperature,
  fuelTemperature,
} from '../../src/engine/heat';

describe('heatColorFor', () => {
  it('is black below the first band', () => {
    expect(heatColorFor(0)).toBe('black');
    expect(heatColorFor(549)).toBe('black');
  });

  it('is red at the start of the red band', () => {
    expect(heatColorFor(550)).toBe('red');
    expect(heatColorFor(899)).toBe('red');
  });

  it('is orange, yellow, then white through the remaining bands', () => {
    expect(heatColorFor(900)).toBe('orange');
    expect(heatColorFor(1050)).toBe('yellow');
    expect(heatColorFor(1250)).toBe('white');
  });

  it('stays white once burnt', () => {
    expect(heatColorFor(BURN_C)).toBe('white');
    expect(heatColorFor(BURN_C + 500)).toBe('white');
  });
});

describe('isWorkable', () => {
  it('is false below black heat', () => {
    expect(isWorkable(0)).toBe(false);
    expect(isWorkable(549)).toBe(false);
  });

  it('is true at and above the workable threshold', () => {
    expect(isWorkable(550)).toBe(true);
    expect(isWorkable(1300)).toBe(true);
  });
});

describe('isBurnt', () => {
  it('is false below the burn threshold', () => {
    expect(isBurnt(BURN_C - 1)).toBe(false);
  });

  it('is true at and above the burn threshold', () => {
    expect(isBurnt(BURN_C)).toBe(true);
    expect(isBurnt(BURN_C + 100)).toBe(true);
  });
});

describe('coolTemperature', () => {
  it('is unchanged when no time has elapsed', () => {
    expect(coolTemperature(1000, 0)).toBe(1000);
  });

  it('decays toward ambient over time', () => {
    const cooled = coolTemperature(1000, 5000);
    expect(cooled).toBeLessThan(1000);
    expect(cooled).toBeGreaterThan(AMBIENT_C);
  });

  it('approaches ambient as elapsed time grows very large', () => {
    const cooled = coolTemperature(1000, 1_000_000);
    expect(cooled).toBeCloseTo(AMBIENT_C, 0);
  });
});

describe('fuelTemperature', () => {
  it('is unchanged when no time has elapsed', () => {
    expect(fuelTemperature(500, 0, 100, 1500)).toBe(500);
  });

  it('rises linearly with the heating rate', () => {
    expect(fuelTemperature(500, 2000, 100, 1500)).toBe(700);
  });

  it('clamps to the forge maximum', () => {
    expect(fuelTemperature(1400, 10_000, 100, 1500)).toBe(1500);
  });
});
