export type MechanicMode = 'sweetSpot' | 'shapeSculpt' | 'meterJuggle' | 'turnResolution';

interface ModeOption {
  readonly mode: MechanicMode;
  readonly title: string;
  readonly description: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    mode: 'sweetSpot',
    title: 'A. Sweet-Spot Strike',
    description: 'A needle sweeps a track; strike when it is in the working zone.',
  },
  {
    mode: 'shapeSculpt',
    title: 'B. Shape Sculpting',
    description: 'Drag across the bar to draw it out toward a target silhouette.',
  },
  {
    mode: 'meterJuggle',
    title: 'C. Meter Juggling',
    description: 'Fuel, Hammer, and Temper all drift on their own — split your attention.',
  },
  {
    mode: 'turnResolution',
    title: 'D. Turn-Based Resolution',
    description: 'No clock at all: choose one action per turn and see the outcome.',
  },
];

export interface ModeSelectProperties {
  readonly onSelect: (mode: MechanicMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProperties) {
  return (
    <section aria-label="Mechanic bake-off menu">
      <ul>
        {MODE_OPTIONS.map(({ mode, title, description }) => (
          <li key={mode}>
            <button type="button" onClick={() => { onSelect(mode); }}>
              {title}
            </button>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
