// Swipe actions on one row (order M9.7, proposed): the framework free logic
// of SwipeActions, one copy for React and Angular. Pure functions; the
// component wires the pointer and writes the offset.
//
// Words used here:
// - inline offset: how far the row content has moved along the inline axis,
//   in px. Positive is toward the inline end (it reveals the start actions),
//   negative toward the inline start (it reveals the end actions). The same
//   number means the same thing in both directions; `toPhysical` turns it
//   into a screen x for a transform.
// - sizes: the width of the start and end action groups and of the row, as
//   measured on screen when the drag begins.
//
// The rules: a press becomes a swipe once it has moved SWIPE_SLOP px and the
// move is more across than down (under 45 degrees); a steeper move is a
// scroll and the swipe gives up. The content follows the finger one to one
// up to the width of the actions on that side; past it a rubber band, or,
// when that side allows a full swipe, it keeps following to the row's width.
// A side with no actions does not move. On release: past the full swipe
// threshold runs the first action of that side; a flick opens or closes by
// its direction; otherwise past half the actions' width opens, else closes.

export type SwipeSide = 'start' | 'end';
export type SwipeState = 'closed' | 'open-start' | 'open-end';
/** Which side a full swipe runs the first action of, or none. */
export type SwipeFull = SwipeSide | 'none';
export type SwipeDirection = 'ltr' | 'rtl';
export type SwipeAxis = 'pending' | 'horizontal' | 'vertical';

/** Movement in px before a press is a swipe or a scroll. */
export const SWIPE_SLOP = 10;
/** Past this share of the actions' width, a release opens them. */
export const SWIPE_OPEN_SHARE = 0.5;
/** A full swipe needs at least this share of the row's width. */
export const SWIPE_FULL_SHARE = 0.6;
/** A full swipe needs at least this many px past the actions' width, so a narrow row never runs an action by opening. */
export const SWIPE_FULL_PAST = 48;
/** A release faster than this, in px per ms along the inline axis, opens or closes by its direction. */
export const SWIPE_FLICK_SPEED = 0.4;
/** A flick that opens must have moved at least this far, in px. */
export const SWIPE_FLICK_MIN = 12;
/** How far back the velocity looks, in ms. A pause longer than this before the release leaves no speed. */
export const SWIPE_VELOCITY_WINDOW = 100;
/** The most the rubber band gives past the actions' width, in px. */
export const SWIPE_RUBBER_MAX = 32;
/** How long after a swipe the click that ends it is swallowed, in ms. */
export const SWIPE_SWALLOW_CLICK_MS = 400;
/** The most actions a side holds. */
export const SWIPE_MAX_ACTIONS = 3;

export interface SwipeSizes {
  /** Width of the start actions, 0 when there are none. */
  start: number;
  /** Width of the end actions, 0 when there are none. */
  end: number;
  /** Width of the row. */
  row: number;
}

/** One point of a drag: the time in ms and the inline offset. */
export interface SwipeSample {
  t: number;
  offset: number;
}

/** What a release does: the state to settle in, and the side whose first action runs (a full swipe), if any. */
export interface SwipeRelease {
  state: SwipeState;
  run: SwipeSide | null;
}

/**
 * Decides what a press that moved `dx`, `dy` px is: still pending under the
 * slop, a horizontal swipe, or a vertical scroll.
 */
export function swipeAxis(dx: number, dy: number, slop = SWIPE_SLOP): SwipeAxis {
  if (Math.hypot(dx, dy) < slop) return 'pending';
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
}

/** A screen x movement as an inline movement: the same in left to right, flipped in right to left. */
export function toInline(dx: number, dir: SwipeDirection): number {
  return dir === 'rtl' ? -dx : dx;
}

/** An inline offset as a screen x, for translateX. */
export function toPhysical(offset: number, dir: SwipeDirection): number {
  const x = dir === 'rtl' ? -offset : offset;
  return x === 0 ? 0 : x;
}

/** The side an offset reveals: positive shows the start actions, negative the end actions. */
export function swipeSideOf(offset: number): SwipeSide | null {
  if (offset > 0) return 'start';
  if (offset < 0) return 'end';
  return null;
}

/** The inline offset a state rests at. */
export function swipeRestOffset(state: SwipeState, sizes: SwipeSizes): number {
  if (state === 'open-start') return sizes.start;
  if (state === 'open-end') return sizes.end === 0 ? 0 : -sizes.end;
  return 0;
}

/** The state that shows a side. */
export function swipeOpenState(side: SwipeSide): SwipeState {
  return side === 'start' ? 'open-start' : 'open-end';
}

/** Past `max`, the drawn distance grows less and less and never passes `max`. */
export function swipeRubber(over: number, max = SWIPE_RUBBER_MAX): number {
  if (over <= 0) return 0;
  return max * (1 - 1 / (1 + over / max));
}

/** The inline offset past which a release on `side` runs its first action. Infinity when that side has no full swipe. */
export function swipeFullThreshold(side: SwipeSide, sizes: SwipeSizes, full: SwipeFull): number {
  if (full !== side || sizes[side] === 0) return Number.POSITIVE_INFINITY;
  return Math.max(sizes.row * SWIPE_FULL_SHARE, sizes[side] + SWIPE_FULL_PAST);
}

/**
 * The offset to draw for the pointer's raw offset: one to one up to the
 * actions' width; past it a rubber band, or the finger up to the row's width
 * on a side with a full swipe. A side with no actions does not move.
 */
export function swipeDrawnOffset(raw: number, sizes: SwipeSizes, full: SwipeFull): number {
  const side = swipeSideOf(raw);
  if (!side) return 0;
  const size = sizes[side];
  if (size === 0) return 0;
  const sign = side === 'start' ? 1 : -1;
  const along = Math.abs(raw);
  if (along <= size) return raw;
  if (full === side) return sign * Math.min(along, Math.max(sizes.row, size));
  return sign * (size + swipeRubber(along - size));
}

/** True while a drag at this drawn offset would run the first action on release (the full swipe is armed). */
export function swipeArmed(offset: number, sizes: SwipeSizes, full: SwipeFull): boolean {
  const side = swipeSideOf(offset);
  if (!side) return false;
  return Math.abs(offset) >= swipeFullThreshold(side, sizes, full);
}

/** The inline speed over the last SWIPE_VELOCITY_WINDOW ms, in px per ms. Positive is toward the inline end. */
export function swipeVelocity(samples: readonly SwipeSample[]): number {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let first = last;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    const s = samples[i] as SwipeSample;
    if (last.t - s.t > SWIPE_VELOCITY_WINDOW) break;
    first = s;
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.offset - first.offset) / dt : 0;
}

/** Where a drag let go at `offset` with `velocity` settles, and whether it runs an action. */
export function swipeRelease(offset: number, velocity: number, sizes: SwipeSizes, full: SwipeFull): SwipeRelease {
  const side = swipeSideOf(offset);
  if (!side || sizes[side] === 0) return { state: 'closed', run: null };
  if (swipeArmed(offset, sizes, full)) return { state: 'closed', run: side };
  // Speed toward showing this side: positive opens it, negative hides it.
  const opening = side === 'start' ? velocity : -velocity;
  const along = Math.abs(offset);
  if (opening > SWIPE_FLICK_SPEED && along >= SWIPE_FLICK_MIN) return { state: swipeOpenState(side), run: null };
  if (opening < -SWIPE_FLICK_SPEED) return { state: 'closed', run: null };
  return { state: along >= sizes[side] * SWIPE_OPEN_SHARE ? swipeOpenState(side) : 'closed', run: null };
}

/** The part of an action the default full swipe reads. */
export interface SwipeFullCandidate {
  tone?: string;
  undoable?: boolean;
}

/**
 * The full swipe when the app sets none: the end side when it has actions
 * and its first action is not danger, or is danger the app can undo. A
 * danger action with no undo never runs by a full swipe unless the app asks
 * (WCAG 3.3.4 does not apply to a list, but a lost mail is still lost).
 */
export function defaultSwipeFull(end: readonly SwipeFullCandidate[] | undefined): SwipeFull {
  const first = end?.[0];
  if (!first) return 'none';
  if (first.tone === 'danger' && !first.undoable) return 'none';
  return 'end';
}

/** The key that opens the actions menu from the keyboard: Shift+F10 or the context menu key. */
export function isSwipeMenuKey(key: string, shiftKey: boolean): boolean {
  return key === 'ContextMenu' || (key === 'F10' && shiftKey);
}
