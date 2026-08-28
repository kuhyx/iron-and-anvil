import type { Workpiece } from '../engine/types';
import { isBurnt, isWorkable } from '../engine/heat';

export type StrikeJudgment = 'perfect' | 'good' | 'miss';

export interface SweetSpotConfig {
  /**
  How long one full sweep of the needle takes.
  */
  readonly periodMs: number;
  /**
  Normalized (0-1) start of the working zone along the sweep.
  */
  readonly sweetSpotStart: number;
  /**
  Normalized (0-1) end of the working zone along the sweep.
  */
  readonly sweetSpotEnd: number;
  /**
  Fraction (0-1) of the zone's half-width counted as a "perfect" hit.
  */
  readonly perfectMargin: number;
}

const PERFECT_GAIN = 15;
const GOOD_GAIN = 8;
const MISS_FLAW = 10;
const RUIN_FLAW = 100;

function clamp01to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Needle position (0-1) at `elapsedMs`, sweeping back and forth like a
 * metronome (triangle wave: 0 -> 1 -> 0 over one `periodMs`).
 */
export function needlePosition(elapsedMs: number, periodMs: number): number {
  const phase = ((elapsedMs % periodMs) + periodMs) % periodMs;
  const t = phase / periodMs;
  return (t < 0.5 ? t : 1 - t) * 2;
}

/**
Judges a strike based on where the needle was at the moment of input.
*/
export function judgeStrike(needlePos: number, config: SweetSpotConfig): StrikeJudgment {
  const { sweetSpotStart, sweetSpotEnd, perfectMargin } = config;
  if (needlePos < sweetSpotStart || needlePos > sweetSpotEnd) {
    return 'miss';
  }
  const center = (sweetSpotStart + sweetSpotEnd) / 2;
  const halfWidth = (sweetSpotEnd - sweetSpotStart) / 2;
  const distanceFromCenter = Math.abs(needlePos - center);
  return distanceFromCenter <= halfWidth * perfectMargin ? 'perfect' : 'good';
}

/**
 * Applies one strike's judgment to the workpiece. Striking burnt metal ruins
 * it outright; striking metal that's too cold to work wastes the strike.
 */
export function applyStrike(workpiece: Workpiece, judgment: StrikeJudgment): Workpiece {
  if (isBurnt(workpiece.temperatureC)) {
    return { ...workpiece, flaw: RUIN_FLAW };
  }
  if (!isWorkable(workpiece.temperatureC)) {
    return workpiece;
  }
  if (judgment === 'miss') {
    return { ...workpiece, flaw: clamp01to100(workpiece.flaw + MISS_FLAW) };
  }
  const gain = judgment === 'perfect' ? PERFECT_GAIN : GOOD_GAIN;
  return { ...workpiece, shapeProgress: clamp01to100(workpiece.shapeProgress + gain) };
}
