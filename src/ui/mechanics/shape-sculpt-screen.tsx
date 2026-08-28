import { useCallback, useEffect, useRef, useState } from 'react';
import type { Clock } from '../../engine/clock';
import { realClock } from '../../engine/clock';
import { coolTemperature, fuelTemperature, heatColorFor } from '../../engine/heat';
import { scoreQuality } from '../../engine/quality';
import type { Workpiece } from '../../engine/types';
import {
  SEGMENT_COUNT,
  TARGET_PROFILE,
  applyStrokeToWorkpiece,
  createStartingProfile,
  type Profile,
} from '../../mechanics/shape-sculpt';
import { useForgeLoop } from './use-forge-loop';

const START_TEMPERATURE_C = 1200;
const FORGE_MAX_C = 1450;
const HEATING_RATE_C_PER_SEC = 180;
const TARGET_SHAPE_PROGRESS = 95;

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 160;
const NO_SEGMENT = -1;

interface SculptState {
  readonly workpiece: Workpiece;
  readonly profile: Profile;
}

function startingState(): SculptState {
  return { workpiece: { temperatureC: START_TEMPERATURE_C, shapeProgress: 0, flaw: 0 }, profile: createStartingProfile() };
}

function segmentIndexForX(x: number, width: number): number {
  const fraction = Math.min(0.999, Math.max(0, x / width));
  return Math.floor(fraction * SEGMENT_COUNT);
}

function drawSilhouette(context: CanvasRenderingContext2D, profile: readonly number[], color: string): void {
  const segmentWidth = CANVAS_WIDTH / SEGMENT_COUNT;
  const midY = CANVAS_HEIGHT / 2;
  context.fillStyle = color;
  for (const [index, thickness] of profile.entries()) {
    const x = index * segmentWidth;
    const halfHeight = (thickness * CANVAS_HEIGHT) / 2;
    context.fillRect(x, midY - halfHeight, segmentWidth, halfHeight * 2);
  }
}

export interface ShapeSculptScreenProperties {
  readonly onFinish?: (workpiece: Workpiece) => void;
  readonly onBackToMenu?: () => void;
  readonly clock?: Clock;
}

export function ShapeSculptScreen({ onFinish, onBackToMenu, clock = realClock }: ShapeSculptScreenProperties) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<SculptState>(startingState);
  const [fueling, setFueling] = useState(false);
  const lastElapsedRef = useRef(0);
  const lastStrokedSegmentRef = useRef(NO_SEGMENT);
  const isDraggingRef = useRef(false);
  const reportedRef = useRef(false);

  const { workpiece, profile } = state;
  const isFinished = workpiece.shapeProgress >= TARGET_SHAPE_PROGRESS || workpiece.flaw >= 100;

  const handleTick = useCallback(
    (elapsedMs: number) => {
      const deltaMs = elapsedMs - lastElapsedRef.current;
      lastElapsedRef.current = elapsedMs;
      if (deltaMs <= 0) {
        return;
      }
      setState((current) => ({
        ...current,
        workpiece: {
          ...current.workpiece,
          temperatureC: fueling
            ? fuelTemperature(current.workpiece.temperatureC, deltaMs, HEATING_RATE_C_PER_SEC, FORGE_MAX_C)
            : coolTemperature(current.workpiece.temperatureC, deltaMs),
        },
      }));
    },
    [fueling],
  );

  useForgeLoop(handleTick, !isFinished, clock);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawSilhouette(context, TARGET_PROFILE, 'rgba(255, 255, 255, 0.25)');
    drawSilhouette(context, profile.segments, '#2a6');
  }, [profile]);

  useEffect(() => {
    if (!isFinished || reportedRef.current) {
    	return;
    }

    reportedRef.current = true;
    onFinish?.(workpiece);
  }, [isFinished, onFinish, workpiece]);

  const strikeSegment = useCallback((segmentIndex: number) => {
    setState((current) => {
      const outcome = applyStrokeToWorkpiece(current.workpiece, current.profile, {
        segmentIndex,
        temperatureC: current.workpiece.temperatureC,
      });
      return { workpiece: outcome.workpiece, profile: outcome.profile };
    });
  }, []);

  const strokeAt = useCallback(
    (event: { currentTarget: HTMLCanvasElement; clientX: number }) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const segmentIndex = segmentIndexForX(event.clientX - rect.left, rect.width);
      lastStrokedSegmentRef.current = segmentIndex;
      strikeSegment(segmentIndex);
    },
    [strikeSegment],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      isDraggingRef.current = true;
      strokeAt(event);
    },
    [strokeAt],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) {
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const segmentIndex = segmentIndexForX(event.clientX - rect.left, rect.width);
      if (segmentIndex !== lastStrokedSegmentRef.current) {
        strokeAt(event);
      }
    },
    [strokeAt],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    lastStrokedSegmentRef.current = NO_SEGMENT;
  }, []);

  const startFueling = useCallback(() => {
    setFueling(true);
  }, []);

  const stopFueling = useCallback(() => {
    setFueling(false);
  }, []);

  const retry = useCallback(() => {
    setState(startingState());
    setFueling(false);
    lastElapsedRef.current = 0;
    lastStrokedSegmentRef.current = NO_SEGMENT;
    reportedRef.current = false;
  }, []);

  const quality = isFinished ? scoreQuality(workpiece) : undefined;

  return (
    <section aria-label="Shape sculpting">
      <h2>Shape Sculpting</h2>
      <p>Hold Fuel to heat the metal, then drag across the bar to draw it out toward the outline.</p>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ background: '#111', touchAction: 'none' }}
        onPointerDown={isFinished ? undefined : handlePointerDown}
        onPointerMove={isFinished ? undefined : handlePointerMove}
        onPointerUp={isFinished ? undefined : handlePointerUp}
      />

      <dl>
        <dt>Heat</dt>
        <dd data-testid="heat-color">{heatColorFor(workpiece.temperatureC)}</dd>
        <dt>Shape progress</dt>
        <dd data-testid="shape-progress">{Math.round(workpiece.shapeProgress)}</dd>
        <dt>Flaw</dt>
        <dd data-testid="flaw">{Math.round(workpiece.flaw)}</dd>
      </dl>

      {isFinished ? undefined : (
        <button type="button" onPointerDown={startFueling} onPointerUp={stopFueling} onPointerLeave={stopFueling}>
          {fueling ? 'Fueling…' : 'Hold to Fuel'}
        </button>
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
