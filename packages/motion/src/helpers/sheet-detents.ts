// The Sheet drag and its detents (order 1.29), one copy for both frameworks:
// the React Sheet imports it from @the-system/motion, and Angular will when
// it ports Sheet. Pure functions; the component wires the pointer and the
// keys and writes the results as CSS custom properties.
//
// A detent is a height the sheet rests at: a fraction of the viewport height
// (0 < n <= 1) or a number of px (n > 1), in order from the smallest to the
// largest. The panel is as tall as its largest detent; a smaller detent
// moves it down by transform (--_dialog-detent-height against
// --_dialog-detent-max), so motion stays on transform.
//
// The drag. The panel follows the pointer one to one between the smallest
// and the largest detent. Past the largest it gives less and less (a rubber
// band that never passes `DETENT_RUBBER_MAX`); below the smallest it follows
// down when the sheet may close, and gives the same rubber band when it may
// not. On release the sheet settles on the detent nearest to where it would
// coast to: its visible height, plus its speed times `DETENT_PROJECTION`.
// When the sheet may close, closed (height 0) is one more place to settle.
//
// The speed is taken over the last `DRAG_VELOCITY_WINDOW` ms of the gesture,
// with the release as the last sample (review 3, N28): a finger that pauses
// before it lifts has no speed left, so a slow drag held still never flings.

/** Past this share of the panel's height, a release closes a sheet with no detents. */
export const DRAG_DISMISS_SHARE = 0.25;
/** A flick: px per ms toward closing. */
export const DRAG_FLICK_SPEED = 0.5;
/** A flick travels at least this far, in px. */
export const DRAG_FLICK_MIN = 8;
/** How far back the drag speed looks, in ms. */
export const DRAG_VELOCITY_WINDOW = 100;
/** The most the panel gives past the largest detent (or below the smallest when it may not close), in px. */
export const DETENT_RUBBER_MAX = 48;
/** How far ahead the release looks, in ms: the visible height plus the speed times this. */
export const DETENT_PROJECTION = 200;

/** One point of a drag: the time in ms and the pointer's block position in px. */
export interface DragSample {
  t: number;
  y: number;
}

/**
 * The speed of a drag, in px per ms (positive: down, toward closing), over
 * the last `DRAG_VELOCITY_WINDOW` ms. Push the release as the last sample:
 * a pause before it brings the speed to 0.
 */
export function dragVelocity(samples: readonly DragSample[], windowMs = DRAG_VELOCITY_WINDOW): number {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let first = last;
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i] as DragSample;
    if (last.t - s.t > windowMs) break;
    first = s;
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.y - first.y) / dt : 0;
}

/** True when a sheet with no detents, dragged down `dy` px of `height`, closes on release. */
export function dragCloses(dy: number, velocity: number, height: number): boolean {
  return dy > height * DRAG_DISMISS_SHARE || (velocity > DRAG_FLICK_SPEED && dy > DRAG_FLICK_MIN);
}

/** A rubber band: `over` px past a limit is drawn as less and less, never past `max`. */
export function detentRubberBand(over: number, max = DETENT_RUBBER_MAX): number {
  if (over <= 0) return 0;
  return max * (1 - 1 / (1 + over / max));
}

/** A detent as given: a fraction of the viewport height (0 < n <= 1) or px (n > 1). */
export type Detent = number;

/**
 * The detents in px, smallest first, each clamped to `room` (the most the
 * panel may take) and to at least 1px; duplicates after the clamp go.
 */
export function detentHeights(detents: readonly Detent[], viewport: number, room: number): number[] {
  const px = detents
    .filter((d) => Number.isFinite(d) && d > 0)
    .map((d) => (d <= 1 ? d * viewport : d))
    .map((h) => Math.round(Math.max(1, Math.min(room, h))))
    .sort((a, b) => a - b);
  return px.filter((h, i) => i === 0 || h !== px[i - 1]);
}

/**
 * The drag offset (--_dialog-drag-y, positive down) for a pointer `raw` px
 * below where it started, from a rest at `rest` px: one to one between the
 * smallest and the largest detent, a rubber band past the largest, and
 * below the smallest one to one when the sheet may close, a rubber band
 * when it may not.
 */
export function detentDragOffset(raw: number, rest: number, heights: readonly number[], closable: boolean): number {
  const top = heights[heights.length - 1] ?? rest;
  const bottom = heights[0] ?? rest;
  const visible = rest - raw;
  if (visible > top) return rest - (top + detentRubberBand(visible - top));
  if (visible < bottom && !closable) return rest - (bottom - detentRubberBand(bottom - visible));
  return raw;
}

/** Where a released sheet goes: a detent index, or closed. */
export type DetentSettle = { kind: 'detent'; index: number } | { kind: 'close' };

/**
 * The detent nearest to where the sheet would coast: its visible height at
 * release (`rest - offset`) less its speed (px per ms, positive down) times
 * `DETENT_PROJECTION`. When it may close, height 0 is one more place.
 */
export function settleDetent(heights: readonly number[], rest: number, offset: number, velocity: number, closable: boolean): DetentSettle {
  const projected = rest - offset - velocity * DETENT_PROJECTION;
  let best: DetentSettle = { kind: 'detent', index: 0 };
  let bestDistance = Number.POSITIVE_INFINITY;
  heights.forEach((h, index) => {
    const d = Math.abs(h - projected);
    if (d < bestDistance) {
      bestDistance = d;
      best = { kind: 'detent', index };
    }
  });
  if (closable && Math.abs(projected) < bestDistance) return { kind: 'close' };
  return best;
}

/**
 * The detent a key moves to: ArrowUp and PageUp the next larger, ArrowDown
 * and PageDown the next smaller (both stop at the ends), Home the smallest,
 * End the largest, Enter and Space the next larger, round to the smallest
 * after the largest (the button path, WCAG 2.5.7). null for any other key.
 */
export function detentForKey(key: string, index: number, count: number): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  switch (key) {
    case 'ArrowUp':
    case 'PageUp':
      return Math.min(last, index + 1);
    case 'ArrowDown':
    case 'PageDown':
      return Math.max(0, index - 1);
    case 'Home':
      return 0;
    case 'End':
      return last;
    case 'Enter':
    case ' ':
      return index >= last ? 0 : index + 1;
    default:
      return null;
  }
}
