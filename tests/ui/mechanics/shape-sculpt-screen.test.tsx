import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { ShapeSculptScreen } from '../../../src/ui/mechanics/shape-sculpt-screen';
import { createManualClock } from '../../../src/engine/clock';

const CANVAS_WIDTH = 320;
const SEGMENT_COUNT = 8;
const SEGMENT_WIDTH = CANVAS_WIDTH / SEGMENT_COUNT;

function xForSegment(segmentIndex: number): number {
  return segmentIndex * SEGMENT_WIDTH + SEGMENT_WIDTH / 2;
}

describe('ShapeSculptScreen', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: 160,
      right: CANVAS_WIDTH,
      bottom: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const flushTick = (): void => {
    const callback = rafCallbacks.pop();
    if (callback) {
      act(() => {
        callback(0);
      });
    }
  };

  function getCanvas(): HTMLCanvasElement {
    return document.querySelector('canvas') as HTMLCanvasElement;
  }

  function strokeAt(segmentIndex: number): void {
    const clientX = xForSegment(segmentIndex);
    fireEvent.pointerDown(getCanvas(), { clientX, buttons: 1 });
    fireEvent.pointerUp(getCanvas(), { clientX });
  }

  it('renders the starting state', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    expect(screen.getByRole('heading', { name: 'Shape Sculpting' })).toBeInTheDocument();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('yellow');
    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
  });

  it('skips drawing when the canvas context is unavailable', () => {
    // eslint-disable-next-line unicorn/no-null -- getContext's real DOM contract returns null, not undefined
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(null);
    render(<ShapeSculptScreen clock={createManualClock()} />);
    expect(screen.getByRole('heading', { name: 'Shape Sculpting' })).toBeInTheDocument();
  });

  it('advances shape progress after a stroke', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    strokeAt(7);
    const progressAfterOneStroke = Number(screen.getByTestId('shape-progress').textContent);
    expect(progressAfterOneStroke).toBeGreaterThan(0);
  });

  it('does not stroke on hover without a pressed button', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    fireEvent.pointerMove(getCanvas(), { clientX: xForSegment(3), buttons: 0 });
    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
  });

  it('does not re-stroke the same segment on a move without leaving it', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    const clientX = xForSegment(4);
    fireEvent.pointerDown(getCanvas(), { clientX, buttons: 1 });
    const progressAfterDown = screen.getByTestId('shape-progress').textContent;
    fireEvent.pointerMove(getCanvas(), { clientX, buttons: 1 });
    expect(screen.getByTestId('shape-progress')).toHaveTextContent(progressAfterDown);
  });

  it('strokes a new segment reached via drag', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    fireEvent.pointerDown(getCanvas(), { clientX: xForSegment(0), buttons: 1 });
    const progressAfterFirst = Number(screen.getByTestId('shape-progress').textContent);
    fireEvent.pointerMove(getCanvas(), { clientX: xForSegment(1), buttons: 1 });
    const progressAfterSecond = Number(screen.getByTestId('shape-progress').textContent);
    expect(progressAfterSecond).toBeGreaterThan(progressAfterFirst);
  });

  it('reaches a ruined result once every segment is struck down to zero, reporting it once', () => {
    const onFinish = vi.fn();
    render(<ShapeSculptScreen clock={createManualClock()} onFinish={onFinish} />);

    for (let segmentIndex = 0; segmentIndex < SEGMENT_COUNT; segmentIndex += 1) {
      for (let strokeCount = 0; strokeCount < 10; strokeCount += 1) {
        strokeAt(segmentIndex);
      }
    }

    expect(screen.getByTestId('flaw')).toHaveTextContent('100');
    expect(screen.getByTestId('result')).toHaveTextContent('ruined');
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('skips the heat update when a tick reports no elapsed time', () => {
    const clock = createManualClock();
    render(<ShapeSculptScreen clock={clock} />);

    clock.set(100);
    flushTick();
    const heatAfterFirstTick = screen.getByTestId('heat-color').textContent;

    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent(heatAfterFirstTick);
  });

  it('heats up while Fuel is held and cools once released', () => {
    const clock = createManualClock();
    render(<ShapeSculptScreen clock={clock} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(3000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('white');

    fireEvent.pointerUp(screen.getByRole('button', { name: /Fuel/ }));
    clock.set(20_000);
    flushTick();
    expect(screen.getByTestId('heat-color')).toHaveTextContent('black');
  });

  it('stops fueling on pointer leave', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: /Fuel/ }));
    expect(screen.getByRole('button', { name: /Fueling/ })).toBeInTheDocument();
    fireEvent.pointerLeave(screen.getByRole('button', { name: /Fueling/ }));
    expect(screen.getByRole('button', { name: 'Hold to Fuel' })).toBeInTheDocument();
  });

  it('resets to the starting state on Try Again', () => {
    render(<ShapeSculptScreen clock={createManualClock()} />);

    for (let segmentIndex = 0; segmentIndex < SEGMENT_COUNT; segmentIndex += 1) {
      for (let strokeCount = 0; strokeCount < 10; strokeCount += 1) {
        strokeAt(segmentIndex);
      }
    }
    expect(screen.getByTestId('result')).toHaveTextContent('ruined');

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByTestId('shape-progress')).toHaveTextContent('0');
    expect(screen.getByTestId('flaw')).toHaveTextContent('0');
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
