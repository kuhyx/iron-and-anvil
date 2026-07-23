import { describe, it, expect } from 'vitest';
import { applyTurn } from '../../src/mechanics/turn-resolution';

function workpiece(temperatureC: number, shapeProgress = 0, flaw = 0) {
  return { temperatureC, shapeProgress, flaw };
}

describe('applyTurn: heat', () => {
  it('raises temperature by a fixed step', () => {
    const result = applyTurn(workpiece(1000), 'heat');
    expect(result.temperatureC).toBe(1250);
  });

  it('caps temperature at the forge maximum', () => {
    const result = applyTurn(workpiece(1400), 'heat');
    expect(result.temperatureC).toBe(1450);
  });
});

describe('applyTurn: fold', () => {
  it('cools the fire and reduces flaw by a fixed amount', () => {
    const result = applyTurn(workpiece(1200, 0, 50), 'fold');
    expect(result.temperatureC).toBe(1080);
    expect(result.flaw).toBe(25);
  });

  it('clamps flaw at 0', () => {
    const result = applyTurn(workpiece(1200, 0, 10), 'fold');
    expect(result.flaw).toBe(0);
  });
});

describe('applyTurn: strike', () => {
  it('cools the fire and advances shape when still workable', () => {
    const result = applyTurn(workpiece(1200, 0, 0), 'strike');
    expect(result.temperatureC).toBe(1080);
    expect(result.shapeProgress).toBeGreaterThan(0);
  });

  it('clamps shape progress at 100', () => {
    const result = applyTurn(workpiece(1400, 95, 0), 'strike');
    expect(result.shapeProgress).toBe(100);
  });

  it('chips the metal instead of advancing shape once too cold to work', () => {
    const result = applyTurn(workpiece(600, 50, 0), 'strike');
    expect(result.temperatureC).toBeLessThan(550);
    expect(result.shapeProgress).toBe(50);
    expect(result.flaw).toBe(8);
  });

  it('ruins the metal if it is still burnt even after passive cooling', () => {
    const result = applyTurn(workpiece(2000, 50, 0), 'strike');
    expect(result.flaw).toBe(100);
  });
});
