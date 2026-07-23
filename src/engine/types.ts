/** Real smith heat-judging colors, cold to hottest workable. */
export type HeatColor = 'black' | 'red' | 'orange' | 'yellow' | 'white';

/** A contiguous temperature range mapped to one {@link HeatColor}. */
export interface HeatBand {
  readonly color: HeatColor;
  readonly minC: number;
  readonly maxC: number;
}

/**
 * The one piece of metal every mechanic acts on. All four mini-games read and
 * write this same shape so their results are comparable.
 */
export interface Workpiece {
  readonly temperatureC: number;
  /** 0-100: how close the shape is to the target form. */
  readonly shapeProgress: number;
  /** 0-100: accumulated structural damage from mistakes. */
  readonly flaw: number;
}
