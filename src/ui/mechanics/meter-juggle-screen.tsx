import { useCallback, useEffect, useRef, useState } from 'react';
import type { Clock } from '../../engine/clock';
import { realClock } from '../../engine/clock';
import { coolTemperature, fuelTemperature, heatColorFor } from '../../engine/heat';
import { scoreQuality } from '../../engine/quality';
import type { Workpiece } from '../../engine/types';
import { accumulateStress, applyHammer, applyTemper } from '../../mechanics/meter-juggle';
import { useForgeLoop } from './use-forge-loop';

const START_TEMPERATURE_C = 1200;
const FORGE_MAX_C = 1450;
const HEATING_RATE_C_PER_SEC = 180;
const TARGET_SHAPE_PROGRESS = 100;

function startingWorkpiece(): Workpiece {
  return { temperatureC: START_TEMPERATURE_C, shapeProgress: 0, flaw: 0 };
}

export interface MeterJuggleScreenProperties {
  readonly onFinish?: (workpiece: Workpiece) => void;
  readonly onBackToMenu?: () => void;
  readonly clock?: Clock;
}

export function MeterJuggleScreen({ onFinish, onBackToMenu, clock = realClock }: MeterJuggleScreenProperties) {
  const [workpiece, setWorkpiece] = useState<Workpiece>(startingWorkpiece);
  const [fueling, setFueling] = useState(false);
  const lastElapsedRef = useRef(0);
  const reportedRef = useRef(false);

  const isFinished = workpiece.shapeProgress >= TARGET_SHAPE_PROGRESS || workpiece.flaw >= 100;

  const handleTick = useCallback(
    (elapsedMs: number) => {
      const deltaMs = elapsedMs - lastElapsedRef.current;
      lastElapsedRef.current = elapsedMs;
      if (deltaMs <= 0) {
        return;
      }
      setWorkpiece((current) => {
        const heated = {
          ...current,
          temperatureC: fueling
            ? fuelTemperature(current.temperatureC, deltaMs, HEATING_RATE_C_PER_SEC, FORGE_MAX_C)
            : coolTemperature(current.temperatureC, deltaMs),
        };
        return accumulateStress(heated, deltaMs);
      });
    },
    [fueling],
  );

  useForgeLoop(handleTick, !isFinished, clock);

  useEffect(() => {
    if (!isFinished || reportedRef.current) {
    	return;
    }

    reportedRef.current = true;
    onFinish?.(workpiece);
  }, [isFinished, onFinish, workpiece]);

  const hammer = useCallback(() => {
    setWorkpiece((current) => applyHammer(current));
  }, []);

  const temper = useCallback(() => {
    setWorkpiece((current) => applyTemper(current));
  }, []);

  const startFueling = useCallback(() => {
    setFueling(true);
  }, []);

  const stopFueling = useCallback(() => {
    setFueling(false);
  }, []);

  const retry = useCallback(() => {
    setWorkpiece(startingWorkpiece());
    setFueling(false);
    lastElapsedRef.current = 0;
    reportedRef.current = false;
  }, []);

  const quality = isFinished ? scoreQuality(workpiece) : undefined;

  return (
    <section aria-label="Meter juggling">
      <h2>Meter Juggling</h2>
      <p>Fuel, Hammer, and Temper all need attention — none of them wait for you.</p>

      <dl>
        <dt>Heat</dt>
        <dd data-testid="heat-color">{heatColorFor(workpiece.temperatureC)}</dd>
        <dt>Shape progress</dt>
        <dd data-testid="shape-progress">{Math.round(workpiece.shapeProgress)}</dd>
        <dt>Stress</dt>
        <dd data-testid="flaw">{Math.round(workpiece.flaw)}</dd>
      </dl>

      {isFinished ? undefined : (
        <div>
          <button type="button" onPointerDown={startFueling} onPointerUp={stopFueling} onPointerLeave={stopFueling}>
            {fueling ? 'Fueling…' : 'Hold to Fuel'}
          </button>
          <button type="button" onClick={hammer}>
            Hammer
          </button>
          <button type="button" onClick={temper}>
            Temper
          </button>
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
