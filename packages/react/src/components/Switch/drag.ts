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
import { useRef, useState, type PointerEvent, type PointerEventHandler } from 'react';

/** How far the pointer moves, in screen px, before a press becomes a drag. */
export const DRAG_SLOP = 3;
/** Past either end the thumb moves this fraction of the pointer's overshoot. */
export const RUBBER_BAND = 0.3;
/** The rubber band stops at this fraction of the travel past either end. */
export const RUBBER_BAND_MAX = 0.12;
/** A release faster than this, in travels per ms, snaps the way the pointer moved. */
export const FLICK_SPEED = 0.006;
/** A pointer that rested longer than this before release has no velocity. */
const STILL_MS = 90;

/** The thumb's progress for the pointer's progress: the same inside the track, damped past its ends. */
export function rubberBand(raw: number): number {
  if (raw > 1) return 1 + Math.min(RUBBER_BAND_MAX, (raw - 1) * RUBBER_BAND);
  if (raw < 0) return -Math.min(RUBBER_BAND_MAX, -raw * RUBBER_BAND);
  return raw;
}

/** On or off after a release: a flick goes its way, else the nearer end wins. */
export function snapChecked(progress: number, speed: number): boolean {
  if (speed > FLICK_SPEED) return true;
  if (speed < -FLICK_SPEED) return false;
  return progress >= 0.5;
}

interface DragRun {
  pointerId: number;
  x0: number;
  from: number;
  /** The thumb's travel on screen, in px. */
  travel: number;
  dir: 1 | -1;
  root: HTMLElement;
  moved: boolean;
  raw: number;
  last: { p: number; t: number };
  prev: { p: number; t: number };
}

/** The thumb's travel on screen: the track's width on screen times the share of it the thumb travels. */
function measureTravel(control: HTMLElement): number {
  const track = control.querySelector<HTMLElement>("[data-part='track']");
  const thumb = track?.querySelector<HTMLElement>("[data-part='thumb']");
  if (!track || !thumb || track.offsetWidth === 0) return 0;
  const cs = getComputedStyle(track);
  const pad = (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0);
  const share = (track.clientWidth - pad - thumb.offsetWidth) / track.offsetWidth;
  return Math.max(0, track.getBoundingClientRect().width * share);
}

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
  const run = useRef<DragRun | null>(null);
  const swallowUntil = useRef(0);

  const finish = (commit: boolean, timeStamp: number) => {
    const r = run.current;
    run.current = null;
    if (!r || !r.moved) return;
    r.root.style.removeProperty('--_switch-drag-progress');
    setDragging(false);
    // The click that ends this drag comes right after the release.
    swallowUntil.current = performance.now() + 400;
    if (!commit) return;
    const still = timeStamp - r.last.t > STILL_MS;
    const dt = r.last.t - r.prev.t;
    const speed = still || dt <= 0 ? 0 : (r.last.p - r.prev.p) / dt;
    const next = snapChecked(Math.min(1, Math.max(0, r.raw)), speed);
    if (next !== checked) onToggle(next);
  };

  const handlers = (own: Handlers): Required<Handlers> => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerDown?.(e);
      swallowUntil.current = 0;
      if (disabled || e.defaultPrevented || e.button !== 0 || !e.isPrimary) return;
      const control = e.currentTarget;
      const root = control.parentElement;
      const travel = measureTravel(control);
      if (!root || travel <= 0) return;
      const from = checked ? 1 : 0;
      run.current = {
        pointerId: e.pointerId,
        x0: e.clientX,
        from,
        travel,
        dir: getComputedStyle(root).direction === 'rtl' ? -1 : 1,
        root,
        moved: false,
        raw: from,
        last: { p: from, t: e.timeStamp },
        prev: { p: from, t: e.timeStamp },
      };
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      own.onPointerMove?.(e);
      const r = run.current;
      if (!r || e.pointerId !== r.pointerId) return;
      const dx = (e.clientX - r.x0) * r.dir;
      if (!r.moved) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        r.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragging(true);
      }
      r.raw = r.from + dx / r.travel;
      r.prev = r.last;
      r.last = { p: r.raw, t: e.timeStamp };
      r.root.style.setProperty('--_switch-drag-progress', rubberBand(r.raw).toFixed(4));
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

  return { dragging, handlers, consumeClick };
}
