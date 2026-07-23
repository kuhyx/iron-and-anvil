import type { Workpiece } from './types';

/** A human-facing bucket for the final numeric score. */
export type QualityGrade = 'ruined' | 'flawed' | 'sound' | 'fine';

export interface QualityResult {
  /** 0-100, higher is better. */
  readonly score: number;
  readonly grade: QualityGrade;
}

const RUINED_MAX = 20;
const FLAWED_MAX = 50;
const SOUND_MAX = 85;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gradeFor(score: number): QualityGrade {
  if (score < RUINED_MAX) {
    return 'ruined';
  }
  if (score < FLAWED_MAX) {
    return 'flawed';
  }
  if (score < SOUND_MAX) {
    return 'sound';
  }
  return 'fine';
}

/**
 * Final quality of a finished workpiece. Burning is not read from the
 * workpiece's current temperature here — a mechanic that lets the metal burn
 * is expected to have already recorded that as {@link Workpiece.flaw} damage
 * (via `heat.ts`'s `isBurnt`) during its own session.
 */
export function scoreQuality(workpiece: Workpiece): QualityResult {
  const score = clamp(workpiece.shapeProgress - workpiece.flaw, 0, 100);
  return { score, grade: gradeFor(score) };
}
