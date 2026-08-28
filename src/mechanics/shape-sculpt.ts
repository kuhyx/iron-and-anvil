import { BURN_C, WORKABLE_MIN_C, isBurnt, isWorkable } from '../engine/heat';
import type { Workpiece } from '../engine/types';

/**
A blade's cross-section, as thickness (0-1) per segment along its length.
*/
export interface Profile {
  readonly segments: readonly number[];
}

export const SEGMENT_COUNT = 8;

/**
A simple knife taper: thick at the base, thin toward the tip.
*/
export const TARGET_PROFILE: readonly number[] = [1, 0.9, 0.8, 0.65, 0.5, 0.35, 0.2, 0.1];

const MAX_STROKE_DELTA = 0.15;
const RUIN_FLAW = 100;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
A fresh, unworked bar: every segment at full thickness.
*/
export function createStartingProfile(): Profile {
  return { segments: Array.from({ length: SEGMENT_COUNT }, () => 1) };
}

/**
 * How much a single stroke thins whichever segment it hits. Hotter metal is
 * more malleable and deforms more per stroke; below {@link WORKABLE_MIN_C}
 * the stroke does nothing at all.
 */
export function strokeStrength(temperatureC: number): number {
  if (!isWorkable(temperatureC)) {
    return 0;
  }
  const heatFraction = clamp01((temperatureC - WORKABLE_MIN_C) / (BURN_C - WORKABLE_MIN_C));
  return heatFraction * MAX_STROKE_DELTA;
}

export interface Stroke {
  readonly segmentIndex: number;
  readonly temperatureC: number;
}

/**
The profile after one stroke thins its target segment.
*/
export function applyStroke(profile: Profile, stroke: Stroke): Profile {
  const delta = strokeStrength(stroke.temperatureC);
  const segments = profile.segments.map((thickness, index) =>
    index === stroke.segmentIndex ? clamp01(thickness - delta) : thickness,
  );
  return { segments };
}

/**
 * The largest total error a profile constrained to [0,1] per segment could
 * possibly have against this target (each segment's worst case is being
 * pushed to whichever end of [0,1] is furthest from its target value).
 */
function worstCaseTotalError(target: readonly number[]): number {
  let total = 0;
  for (const value of target) {
    total += Math.max(value, 1 - value);
  }
  return total || 1;
}

/**
The largest total overshoot possible: every segment thinned to zero.
*/
function worstCaseTotalOvershoot(target: readonly number[]): number {
  let total = 0;
  for (const value of target) {
    total += value;
  }
  return total || 1;
}

/**
0-100: how close the profile is to the target shape overall.
*/
export function progressTowardTarget(profile: Profile, target: readonly number[] = TARGET_PROFILE): number {
  let totalError = 0;
  for (const [index, thickness] of profile.segments.entries()) {
    totalError += Math.abs(thickness - (target[index] ?? 0));
  }
  return clamp01(1 - totalError / worstCaseTotalError(target)) * 100;
}

/**
0-100: damage from thinning segments past their target (overshoot).
*/
export function overshootFlaw(profile: Profile, target: readonly number[] = TARGET_PROFILE): number {
  let totalOvershoot = 0;
  for (const [index, thickness] of profile.segments.entries()) {
    const targetThickness = target[index] ?? 0;
    totalOvershoot += Math.max(0, targetThickness - thickness);
  }
  return clamp01(totalOvershoot / worstCaseTotalOvershoot(target)) * 100;
}

export interface StrokeOutcome {
  readonly workpiece: Workpiece;
  readonly profile: Profile;
}

/**
 * Applies a stroke, updating both the profile and the shared Workpiece's
 * derived shapeProgress/flaw. Striking burnt metal ruins the piece outright
 * without changing the profile further.
 */
export function applyStrokeToWorkpiece(workpiece: Workpiece, profile: Profile, stroke: Stroke): StrokeOutcome {
  if (isBurnt(stroke.temperatureC)) {
    return { workpiece: { ...workpiece, flaw: RUIN_FLAW }, profile };
  }
  const nextProfile = applyStroke(profile, stroke);
  return {
    workpiece: {
      ...workpiece,
      shapeProgress: progressTowardTarget(nextProfile),
      flaw: overshootFlaw(nextProfile),
    },
    profile: nextProfile,
  };
}
