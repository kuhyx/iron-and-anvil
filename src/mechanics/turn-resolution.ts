import { AMBIENT_C, BURN_C, WORKABLE_MIN_C, isBurnt, isWorkable } from '../engine/heat';
import type { Workpiece } from '../engine/types';

/**
The forge's achievable heat per turn never reaches burning, matching every other mechanic.
*/
const FORGE_MAX_C = 1450;
const HEAT_GAIN_PER_TURN = 250;
const PASSIVE_COOL_PER_TURN = 120;
const STRIKE_GAIN_MAX = 20;
const STRIKE_FLAW_IF_COLD = 8;
const FOLD_FLAW_REDUCTION = 25;
const RUIN_FLAW = 100;

export type TurnAction = 'heat' | 'strike' | 'fold';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp0to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
Every turn not spent tending the fire lets it cool by a fixed step.
*/
function passiveCool(temperatureC: number): number {
  return Math.max(AMBIENT_C, temperatureC - PASSIVE_COOL_PER_TURN);
}

/**
 * How much one Strike turn advances shapeProgress at this temperature.
 * Only ever called once the caller has already confirmed the metal is
 * workable and not burnt.
 */
function strikeGain(temperatureC: number): number {
  const heatFraction = clamp01((temperatureC - WORKABLE_MIN_C) / (BURN_C - WORKABLE_MIN_C));
  return heatFraction * STRIKE_GAIN_MAX;
}

/**
 * Resolves one discrete turn. Heat raises temperature (capped, like every
 * other mechanic's forge). Strike and Fold both cost a turn of fire-tending,
 * so the fire cools passively first: Strike then advances shape if hot
 * enough (a harsh strike on metal too cold to work chips it instead), and
 * Fold relieves accumulated flaw regardless of temperature.
 */
export function applyTurn(workpiece: Workpiece, action: TurnAction): Workpiece {
  if (action === 'heat') {
    return { ...workpiece, temperatureC: Math.min(workpiece.temperatureC + HEAT_GAIN_PER_TURN, FORGE_MAX_C) };
  }

  const cooled = passiveCool(workpiece.temperatureC);

  if (action === 'fold') {
    return { ...workpiece, temperatureC: cooled, flaw: clamp0to100(workpiece.flaw - FOLD_FLAW_REDUCTION) };
  }

  if (isBurnt(cooled)) {
    return { ...workpiece, temperatureC: cooled, flaw: RUIN_FLAW };
  }
  return isWorkable(cooled)
    ? { ...workpiece, temperatureC: cooled, shapeProgress: clamp0to100(workpiece.shapeProgress + strikeGain(cooled)) }
    : { ...workpiece, temperatureC: cooled, flaw: clamp0to100(workpiece.flaw + STRIKE_FLAW_IF_COLD) };
}
