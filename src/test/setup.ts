import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';
import { mockContext } from './canvas-mock';

beforeEach(() => {
  vi.clearAllMocks();
});

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => mockContext,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

// jsdom has no pointer-capture implementation at all; stub it so canvas-drag
// mechanics can call the real Pointer Events API under test.
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);

interface PointerEventInitPolyfill extends MouseEventInit {
  pointerId?: number;
}

// jsdom has no PointerEvent constructor at all (fireEvent.pointerDown/Move/Up
// silently drop clientX etc. without this), so polyfill a minimal one on top
// of the MouseEvent it does support.
if (!('PointerEvent' in globalThis)) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;

    constructor(type: string, parameters: PointerEventInitPolyfill = {}) {
      super(type, parameters);
      this.pointerId = parameters.pointerId ?? 0;
    }
  }

  const globalWithPointerEvent = globalThis as unknown as { PointerEvent: unknown };
  globalWithPointerEvent.PointerEvent = PointerEventPolyfill;
}
