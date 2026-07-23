import { useCallback, useEffect, useRef, useState } from 'react';
import type { Clock } from '../../engine/clock';
import { realClock } from '../../engine/clock';
import { coolTemperature, fuelTemperature, heatColorFor } from '../../engine/heat';
import { scoreQuality } from '../../engine/quality';
import type { Workpiece } from '../../engine/types';
import {
  applyStrike,
  judgeStrike,
  needlePosition,
  type SweetSpotConfig,
} from '../../mechanics/sweet-spot';
import { useForgeLoop } from './use-forge-loop';

const CONFIG: SweetSpotConfig = {
  periodMs: 1400,
  sweetSpotStart: 0.4,
  sweetSpotEnd: 0.6,
  perfectMargin: 0.5,
};

const START_TEMPERATURE_C = 1200;
const FORGE_MAX_C = 1450;
const HEATING_RATE_C_PER_SEC = 180;
const TARGET_SHAPE_PROGRESS = 100;

function startingWorkpiece(): Workpiece {
  return { temperatureC: START_TEMPERATURE_C, shapeProgress: 0, flaw: 0 };
}

export interface SweetSpotScreenProperties {
  readonly onFinish?: (workpiece: Workpiece) => void;
  readonly onBackToMenu?: () => void;
  readonly clock?: Clock;
}

export function SweetSpotScreen({ onFinish, onBackToMenu, clock = realClock }: SweetSpotScreenProperties) {
  const [workpiece, setWorkpiece] = useState<Workpiece>(startingWorkpiece);
  const [needleOffset, setNeedleOffset] = useState(0);
  const [fueling, setFueling] = useState(false);
  const lastElapsedReference = useRef(0);
  const reportedReference = useRef(false);

  const finished = workpiece.shapeProgress >= TARGET_SHAPE_PROGRESS || workpiece.flaw >= 100;

  const handleTick = useCallback(
    (elapsedMs: number) => {
      setNeedleOffset(needlePosition(elapsedMs, CONFIG.periodMs));

      const deltaMs = elapsedMs - lastElapsedReference.current;
      lastElapsedReference.current = elapsedMs;
      if (deltaMs <= 0) {
        return;
      }

      setWorkpiece((current) =>
        fueling
          ? {
              ...current,
              temperatureC: fuelTemperature(current.temperatureC, deltaMs, HEATING_RATE_C_PER_SEC, FORGE_MAX_C),
            }
          : { ...current, temperatureC: coolTemperature(current.temperatureC, deltaMs) },
      );
    },
    [fueling],
  );

  useForgeLoop(handleTick, !finished, clock);

  useEffect(() => {
    if (finished && !reportedReference.current) {
      reportedReference.current = true;
      onFinish?.(workpiece);
    }
  }, [finished, onFinish, workpiece]);

  const strike = useCallback(() => {
    const judgment = judgeStrike(needleOffset, CONFIG);
    setWorkpiece((current) => applyStrike(current, judgment));
  }, [needleOffset]);

  const startFueling = useCallback(() => {
    setFueling(true);
  }, []);

  const stopFueling = useCallback(() => {
    setFueling(false);
  }, []);

  const retry = useCallback(() => {
    setWorkpiece(startingWorkpiece());
    setNeedleOffset(0);
    setFueling(false);
    lastElapsedReference.current = 0;
    reportedReference.current = false;
  }, []);

  const quality = finished ? scoreQuality(workpiece) : undefined;

  return (
    <section aria-label="Sweet-spot strike">
      <h2>Sweet-Spot Strike</h2>
      <p>Hold Fuel to heat the metal, then Strike when the needle is in the zone.</p>

      <div
        data-testid="track"
        style={{ position: 'relative', height: 24, background: '#333', margin: '1rem 0' }}
      >
        <div
          data-testid="zone"
          style={{
            position: 'absolute',
            left: `${String(CONFIG.sweetSpotStart * 100)}%`,
            width: `${String((CONFIG.sweetSpotEnd - CONFIG.sweetSpotStart) * 100)}%`,
            height: '100%',
            background: '#2a6',
          }}
        />
        <div
          data-testid="needle"
          style={{
            position: 'absolute',
            left: `${String(needleOffset * 100)}%`,
            width: 4,
            height: '100%',
            background: '#fff',
          }}
        />
      </div>

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
          <button type="button" onPointerDown={startFueling} onPointerUp={stopFueling} onPointerLeave={stopFueling}>
            {fueling ? 'Fueling…' : 'Hold to Fuel'}
          </button>
          <button type="button" onClick={strike}>
            Strike
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
