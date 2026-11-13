'use client';
// switch-drag (order 1.23, proposed): the thumb follows a pointer drag on the
// control and snaps by velocity and position on release.
//
// The hook keeps the drag out of React state except for one flag: while a
// drag runs, the root carries `data-dragging` and the inline property
// `--_switch-drag-progress` (0 is off, 1 is on, a little past either end
// with the rubber band). Switch.css turns that number into the thumb's
// travel, the sweep of the on fill and the thumb color, with no transition,
// so the thumb sits under the finger. On release the flag and the property go
// in the same render as the new state, so the thumb springs from where the
// finger left it to its end.
//
// A tap is not a drag: under the slop the pointer events do nothing and the
// click toggles as before. A drag decides the state on release, so the click
// that follows it is consumed (Switch prevents it, and Radix then skips the
// toggle). Space and Enter never pass through here. The progress is measured
// against the track's own box on screen, so page zoom and right to left text
// need no special case.
//
// The run itself (the slop, the rubber band, the snap) is the switch drag
// core of @the-system/motion (helpers/switch-drag.ts), one copy for both
// frameworks; this hook keeps the pointer wiring and the `dragging` flag.
import { useRef, useState, type PointerEvent, type PointerEventHandler } from 'react';
import {
  SWALLOW_CLICK_MS,
  beginSwitchDrag,
  clearDragProgress,
  dragOnSide,
  followPointer,
  pastSlop,
  releaseChecked,
  type SwitchDragRun,
} from '@the-system/motion';

type Handlers = {
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
  onLostPointerCapture?: PointerEventHandler<HTMLButtonElement>;
};

export interface SwitchDrag {
  /** True while the thumb follows the pointer. */
  dragging: boolean;
  /**
   * While dragging, true when the thumb is at or past the middle (order 1.29,
   * B4): Switch shows this side as the root's data-state, so the fill, the
   * thumb color and a style's state swaps step there.
   */
  onSide: boolean;
  /** The pointer handlers for the control, wrapping the caller's own. */
  handlers: (own: Handlers) => Required<Handlers>;
  /** True once for the click that ends a drag: prevent it. */
  consumeClick: () => boolean;
}

export function useSwitchDrag({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}): SwitchDrag {
  const [dragging, setDragging] = useState(false);
  const [onSide, setOnSide] = useState(false);
  const run = useRef<SwitchDragRun | null>(null);
  const swallowUntil = useRef(0);

  const finish = (commit: boolean, timeStamp: number) => {
    const r = run.current;
    run.current = null;
    if (!r || !r.moved) return;
    clearDragProgress(r);
    setDragging(false);
    // The click that ends this drag comes right after the release.
    swallowUntil.current = performance.now() + SWALLOW_CLICK_MS;
    if (!commit) return;
    const next = releaseChecked(r, timeStamp);
    if (next !== checked) onToggle(next);
  };

  const handlers = (own: Handlers): Required<Handlers> => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerDown?.(e);
      swallowUntil.current = 0;
      if (disabled || e.defaultPrevented || e.button !== 0 || !e.isPrimary) return;
      run.current = beginSwitchDrag(e.currentTarget, checked, e.pointerId, e.clientX, e.timeStamp);
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerMove?.(e);
      const r = run.current;
      if (!r || e.pointerId !== r.pointerId) return;
      if (!r.moved) {
        if (!pastSlop(r, e.clientX)) return;
        r.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragging(true);
      }
      followPointer(r, e.clientX, e.timeStamp);
      // A render only when the thumb crosses the middle.
      setOnSide(dragOnSide(r));
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerUp?.(e);
      if (run.current && e.pointerId === run.current.pointerId) finish(true, e.timeStamp);
    },
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerCancel?.(e);
      if (run.current && e.pointerId === run.current.pointerId) finish(false, e.timeStamp);
    },
    onLostPointerCapture: (e: PointerEvent<HTMLButtonElement>) => {
      own.onLostPointerCapture?.(e);
      // Capture is lost after the release too; by then the run is over.
      if (run.current && e.pointerId === run.current.pointerId && run.current.moved) finish(false, e.timeStamp);
    },
  });

  const consumeClick = () => {
    if (swallowUntil.current === 0) return false;
    const hit = performance.now() <= swallowUntil.current;
    swallowUntil.current = 0;
    return hit;
  };

  return { dragging, onSide, handlers, consumeClick };
}
