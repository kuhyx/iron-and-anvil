import { BURN_C, WORKABLE_MIN_C, isBurnt, isWorkable } from '../engine/heat';
import type { Workpiece } from '../engine/types';

const HAMMER_GAIN_MAX = 12;
const STRESS_RATE_PER_SEC = 3;
const STRESS_RATE_PER_SEC_BURNT = 40;
const TEMPER_REDUCTION = 20;
const RUIN_FLAW = 100;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp0to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** How much one Hammer tap advances shapeProgress at this temperature. */
export function hammerGain(temperatureC: number): number {
  if (!isWorkable(temperatureC)) {
    return 0;
  }
  const heatFraction = clamp01((temperatureC - WORKABLE_MIN_C) / (BURN_C - WORKABLE_MIN_C));
  return heatFraction * HAMMER_GAIN_MAX;
}

/** A Hammer tap: advances shape at the current heat, or ruins burnt metal. */
export function applyHammer(workpiece: Workpiece): Workpiece {
  if (isBurnt(workpiece.temperatureC)) {
    return { ...workpiece, flaw: RUIN_FLAW };
  }
  return { ...workpiece, shapeProgress: clamp0to100(workpiece.shapeProgress + hammerGain(workpiece.temperatureC)) };
}

/** A Temper tap: relieves accumulated stress by a fixed amount. */
export function applyTemper(workpiece: Workpiece): Workpiece {
  return { ...workpiece, flaw: clamp0to100(workpiece.flaw - TEMPER_REDUCTION) };
}

/**
 * Passive stress buildup over elapsed time while the smith's attention is
 * elsewhere: none while too cold to matter, steady while merely workable,
 * and much faster once burnt. This is the "third meter" that keeps drifting
 * whenever Heat or Hammer is getting all the attention.
 */
export function accumulateStress(workpiece: Workpiece, elapsedMs: number): Workpiece {
  let ratePerSec = 0;
  if (isBurnt(workpiece.temperatureC)) {
    ratePerSec = STRESS_RATE_PER_SEC_BURNT;
  } else if (isWorkable(workpiece.temperatureC)) {
    ratePerSec = STRESS_RATE_PER_SEC;
  }
  const added = ratePerSec * (elapsedMs / 1000);
  return { ...workpiece, flaw: clamp0to100(workpiece.flaw + added) };
}
