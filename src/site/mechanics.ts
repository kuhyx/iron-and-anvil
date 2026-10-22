/**
The four smithing mini-games. One source for the in-game menu and for the
static how-to-play page, so the two can never describe different games.
*/
export type MechanicMode = 'sweetSpot' | 'shapeSculpt' | 'meterJuggle' | 'turnResolution';

export interface MechanicInfo {
  readonly mode: MechanicMode;
  readonly title: string;
  readonly description: string;
  /**
  How to play it, one control per entry, as shown on the how-to-play page.
  */
  readonly controls: readonly string[];
}

export const MECHANICS: readonly MechanicInfo[] = [
  {
    mode: 'sweetSpot',
    title: 'A. Sweet-Spot Strike',
    description: 'A needle sweeps a track; strike when it is in the working zone.',
    controls: [
      'Hold Fuel to heat the bar; release it to let the bar cool.',
      'Press Strike while the needle is inside the working zone. Dead centre is a perfect hit, the edges are good, and a miss adds a flaw.',
    ],
  },
  {
    mode: 'shapeSculpt',
    title: 'B. Shape Sculpting',
    description: 'Drag across the bar to draw it out toward a target silhouette.',
    controls: [
      'Hold Fuel to heat the bar until it glows.',
      'Press and drag across the bar with the mouse or a finger to draw it out toward the target outline.',
    ],
  },
  {
    mode: 'meterJuggle',
    title: 'C. Meter Juggling',
    description: 'Fuel, Hammer, and Temper all drift on their own — split your attention.',
    controls: [
      'Hold Fuel to keep the bar hot.',
      'Press Hammer to shape the bar; hotter metal shapes faster.',
      'Press Temper to relieve the stress that builds up while you work.',
    ],
  },
  {
    mode: 'turnResolution',
    title: 'D. Turn-Based Resolution',
    description: 'No clock at all: choose one action per turn and see the outcome.',
    controls: [
      'Choose Heat to put the bar back in the fire.',
      'Choose Strike to shape the bar; striking cold metal adds a flaw.',
      'Choose Fold to work out accumulated flaws. The fire cools on every turn you do not Heat.',
    ],
  },
];
