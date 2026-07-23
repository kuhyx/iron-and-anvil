import { useCallback, useEffect, useRef, useState } from 'react';
import { heatColorFor } from '../../engine/heat';
import { scoreQuality } from '../../engine/quality';
import type { Workpiece } from '../../engine/types';
import { applyTurn, type TurnAction } from '../../mechanics/turn-resolution';

const START_TEMPERATURE_C = 1200;
const TARGET_SHAPE_PROGRESS = 100;

const TURN_ACTIONS: readonly { action: TurnAction; label: string }[] = [
  { action: 'heat', label: 'Heat' },
  { action: 'strike', label: 'Strike' },
  { action: 'fold', label: 'Fold' },
];

function startingWorkpiece(): Workpiece {
  return { temperatureC: START_TEMPERATURE_C, shapeProgress: 0, flaw: 0 };
}

export interface TurnResolutionScreenProperties {
  readonly onFinish?: (workpiece: Workpiece) => void;
  readonly onBackToMenu?: () => void;
}

export function TurnResolutionScreen({ onFinish, onBackToMenu }: TurnResolutionScreenProperties) {
  const [workpiece, setWorkpiece] = useState<Workpiece>(startingWorkpiece);
  const reportedReference = useRef(false);

  const finished = workpiece.shapeProgress >= TARGET_SHAPE_PROGRESS || workpiece.flaw >= 100;

  useEffect(() => {
    if (finished && !reportedReference.current) {
      reportedReference.current = true;
      onFinish?.(workpiece);
    }
  }, [finished, onFinish, workpiece]);

  const takeTurn = useCallback((action: TurnAction) => {
    setWorkpiece((current) => applyTurn(current, action));
  }, []);

  const retry = useCallback(() => {
    setWorkpiece(startingWorkpiece());
    reportedReference.current = false;
  }, []);

  const quality = finished ? scoreQuality(workpiece) : undefined;

  return (
    <section aria-label="Turn-based resolution">
      <h2>Turn-Based Resolution</h2>
      <p>Each turn, choose one action. The fire cools whenever you&rsquo;re not tending it.</p>

      <dl>
        <dt>Heat</dt>
        <dd data-testid="heat-color">{heatColorFor(workpiece.temperatureC)}</dd>
        <dt>Shape progress</dt>
        <dd data-testid="shape-progress">{Math.round(workpiece.shapeProgress)}</dd>
        <dt>Flaw</dt>
        <dd data-testid="flaw">{Math.round(workpiece.flaw)}</dd>
      </dl>

      {!finished && (
        <div>
          {TURN_ACTIONS.map(({ action, label }) => (
            <button key={action} type="button" onClick={() => { takeTurn(action); }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {quality && (
        <div data-testid="result">
          <p>
            Result: {quality.grade} ({Math.round(quality.score)}/100)
          </p>
          <button type="button" onClick={retry}>
            Try Again
          </button>
          {onBackToMenu && (
            <button type="button" onClick={onBackToMenu}>
              Back to Menu
            </button>
          )}
        </div>
      )}
    </section>
  );
}
