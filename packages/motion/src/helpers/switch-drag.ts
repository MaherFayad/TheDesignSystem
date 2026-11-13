// switch-drag (order 1.23, proposed): the thumb follows a pointer drag on
// the Switch control and snaps by velocity and position on release. The
// framework free core, one copy for both frameworks (order 1.29): React's
// hook (packages/react/src/components/Switch/drag.ts) and Angular's class
// (packages/angular/src/internal/toggles-switch-drag.ts) keep the pointer
// wiring and the `dragging` flag, and call these.
//
// While a drag runs, the root carries `data-dragging` (set by the framework)
// and the inline property `--_switch-drag-progress` (0 is off, 1 is on, a
// little past either end with the rubber band). Switch.css turns that number
// into the thumb's travel, the sweep of the on fill and the thumb color, with
// no transition, so the thumb sits under the finger. On release the flag and
// the property go together with the new state, so the thumb springs from
// where the finger left it to its end.
//
// A tap is not a drag: under the slop the pointer events do nothing and the
// click toggles as before. The progress is measured against the track's own
// box on screen, so page zoom and right to left text need no special case.

/** How far the pointer moves, in screen px, before a press becomes a drag. */
export const DRAG_SLOP = 3;
/** Past either end the thumb moves this fraction of the pointer's overshoot. */
export const RUBBER_BAND = 0.3;
/** The rubber band stops at this fraction of the travel past either end. */
export const RUBBER_BAND_MAX = 0.12;
/** A release faster than this, in travels per ms, snaps the way the pointer moved. */
export const FLICK_SPEED = 0.006;
/** A pointer that rested longer than this before release has no velocity. */
export const STILL_MS = 90;
/** How long after a release the click that ends the drag is consumed, in ms. */
export const SWALLOW_CLICK_MS = 400;
/** The inline property the run writes on the root. */
export const DRAG_PROGRESS = '--_switch-drag-progress';

/** The thumb's progress for the pointer's progress: the same inside the track, damped past its ends. */
export function switchRubberBand(raw: number): number {
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

/** One drag of one Switch, from the press to the release. */
export interface SwitchDragRun {
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
export function measureTravel(control: HTMLElement): number {
  const track = control.querySelector<HTMLElement>("[data-part='track']");
  const thumb = track?.querySelector<HTMLElement>("[data-part='thumb']");
  if (!track || !thumb || track.offsetWidth === 0) return 0;
  const cs = getComputedStyle(track);
  const pad = (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0);
  const share = (track.clientWidth - pad - thumb.offsetWidth) / track.offsetWidth;
  return Math.max(0, track.getBoundingClientRect().width * share);
}

/**
 * A run for a primary press on `control` (the Switch control; its parent is
 * the root). Null when there is no root or the thumb cannot travel. The
 * caller checks the button, the primary pointer and the disabled state first.
 */
export function beginSwitchDrag(control: HTMLElement, checked: boolean, pointerId: number, clientX: number, timeStamp: number): SwitchDragRun | null {
  const root = control.parentElement;
  const travel = measureTravel(control);
  if (!root || travel <= 0) return null;
  const from = checked ? 1 : 0;
  return {
    pointerId,
    x0: clientX,
    from,
    travel,
    dir: getComputedStyle(root).direction === 'rtl' ? -1 : 1,
    root,
    moved: false,
    raw: from,
    last: { p: from, t: timeStamp },
    prev: { p: from, t: timeStamp },
  };
}

/** True once the pointer has moved past DRAG_SLOP along the travel: the press becomes a drag. */
export function pastSlop(run: SwitchDragRun, clientX: number): boolean {
  return Math.abs((clientX - run.x0) * run.dir) >= DRAG_SLOP;
}

/** Moves the run to the pointer and writes the thumb's progress on the root, with the rubber band. */
export function followPointer(run: SwitchDragRun, clientX: number, timeStamp: number): void {
  const dx = (clientX - run.x0) * run.dir;
  run.raw = run.from + dx / run.travel;
  run.prev = run.last;
  run.last = { p: run.raw, t: timeStamp };
  run.root.style.setProperty(DRAG_PROGRESS, switchRubberBand(run.raw).toFixed(4));
}

/** Ends the drag on the root: the progress property goes (the framework drops its flag with it). */
export function clearDragProgress(run: SwitchDragRun): void {
  run.root.style.removeProperty(DRAG_PROGRESS);
}

/** The pointer's speed at release, in travels per ms: 0 when it rested longer than STILL_MS. */
export function releaseSpeed(run: SwitchDragRun, timeStamp: number): number {
  const still = timeStamp - run.last.t > STILL_MS;
  const dt = run.last.t - run.prev.t;
  return still || dt <= 0 ? 0 : (run.last.p - run.prev.p) / dt;
}

/** On or off after the release at `timeStamp`: the flick, else the nearer end. */
export function releaseChecked(run: SwitchDragRun, timeStamp: number): boolean {
  return snapChecked(Math.min(1, Math.max(0, run.raw)), releaseSpeed(run, timeStamp));
}
