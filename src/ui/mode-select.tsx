import { MECHANICS, type MechanicMode } from '../site/mechanics';

export type { MechanicMode } from '../site/mechanics';

export interface ModeSelectProperties {
  readonly onSelect: (mode: MechanicMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProperties) {
  return (
    <section aria-label="Mechanic bake-off menu">
      <ul>
        {MECHANICS.map(({ mode, title, description }) => (
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
