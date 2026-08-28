import type { HeatBand, HeatColor } from './types';

/**
Ambient temperature the workpiece cools toward when not being fueled.
*/
export const AMBIENT_C = 20;

/**
Above this, the workpiece is overheating and starts to burn/oxidize.
*/
export const BURN_C = 1500;

/**
Below this (black heat), the metal is too cold to shape at all.
*/
export const WORKABLE_MIN_C = 550;

/**
 * Ordered low-to-high heat bands, matching real smith heat-judging colors.
 * Below the first band's `minC` (black heat) the metal is too cold to work.
 */
export const HEAT_BANDS: readonly HeatBand[] = [
  { color: 'red', minC: WORKABLE_MIN_C, maxC: 900 },
  { color: 'orange', minC: 900, maxC: 1050 },
  { color: 'yellow', minC: 1050, maxC: 1250 },
  { color: 'white', minC: 1250, maxC: BURN_C },
];

/**
The color a bystander smith would call this temperature.
*/
export function heatColorFor(temperatureC: number): HeatColor {
  const band = HEAT_BANDS.find((b) => temperatureC >= b.minC && temperatureC < b.maxC);
  if (band) {
    return band.color;
  }
  return temperatureC >= BURN_C ? 'white' : 'black';
}

/**
Whether the metal is hot enough to be shaped at all (above black heat).
*/
export function isWorkable(temperatureC: number): boolean {
  return temperatureC >= WORKABLE_MIN_C;
}

/**
Whether the metal has overheated to the point of burning/ruin.
*/
export function isBurnt(temperatureC: number): boolean {
  return temperatureC >= BURN_C;
}

/**
 * Temperature after cooling toward {@link AMBIENT_C} for `elapsedMs`,
 * following exponential decay (never quite reaches ambient, matching how a
 * real forging keeps losing heat faster the hotter it is).
 */
export function coolTemperature(
  currentC: number,
  elapsedMs: number,
  coolingRatePerSec = 0.15,
): number {
  const elapsedSec = elapsedMs / 1000;
  const decay = Math.exp(-coolingRatePerSec * elapsedSec);
  return AMBIENT_C + (currentC - AMBIENT_C) * decay;
}

/**
 * Temperature after actively fueling the forge for `elapsedMs`, rising at
 * `heatingRateCPerSec` and clamped to the forge's achievable maximum.
 */
export function fuelTemperature(
  currentC: number,
  elapsedMs: number,
  heatingRateCPerSec: number,
  maxC: number,
): number {
  const raised = currentC + heatingRateCPerSec * (elapsedMs / 1000);
  return Math.min(raised, maxC);
}
