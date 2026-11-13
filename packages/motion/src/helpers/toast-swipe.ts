// The toast swipe (order 1.23), one copy for both frameworks (order 1.29):
// the React and the Angular Toaster import it from @the-system/motion.
//
// The swipe of interaction "toast-swipe" (order 1.23). Radix Toast clamps a
// swipe to its direction and decides by distance alone, so the Toaster runs
// its own: the toast follows the finger toward the edge it sits on, gives a
// little against the wrong way (a rubber band that never passes `RUBBER_MAX`)
// and closes when it is let go past `SWIPE_DISTANCE`, or flung toward the
// edge faster than `SWIPE_VELOCITY` over the last moments of the gesture.
// Pure functions, so Angular can reuse them; the Toaster wires the events.

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/** Past this distance toward the edge, in px, a swipe closes the toast (as Radix's default threshold). */
export const SWIPE_DISTANCE = 50;
/** Past this speed toward the edge, in px per ms, a short flick closes the toast. */
export const SWIPE_VELOCITY = 0.3;
/** A flick must travel at least this far toward the edge, in px. */
export const SWIPE_FLICK_MIN = 8;
/** The most the toast gives against the wrong way, in px. */
export const RUBBER_MAX = 24;
/** How far back the velocity looks, in ms. */
export const VELOCITY_WINDOW = 100;
/** Movement before a swipe starts, in px: a touch needs more, so a tap stays a tap. */
export const START_BUFFER = { touch: 10, other: 2 } as const;

/** +1 when the closing direction is positive on its axis (right, down), -1 otherwise. */
export function swipeSign(direction: SwipeDirection): 1 | -1 {
  return direction === 'right' || direction === 'down' ? 1 : -1;
}

export function swipeAxis(direction: SwipeDirection): 'x' | 'y' {
  return direction === 'left' || direction === 'right' ? 'x' : 'y';
}

/**
 * The drawn offset for a distance along the closing direction: toward the
 * edge it follows the finger one to one; against it, it gives less and
 * less and never passes `max`.
 */
export function swipeRubberBand(along: number, max = RUBBER_MAX): number {
  if (along >= 0) return along;
  const pull = -along;
  return -max * (1 - 1 / (1 + pull / max));
}

/** One point of the gesture: the time in ms and the distance along the closing direction. */
export interface SwipeSample {
  t: number;
  along: number;
}

/** The speed toward the edge over the last `VELOCITY_WINDOW` ms, in px per ms. */
export function swipeVelocity(samples: readonly SwipeSample[]): number {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  let first = last;
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i] as SwipeSample;
    if (last.t - s.t > VELOCITY_WINDOW) break;
    first = s;
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.along - first.along) / dt : 0;
}

/** True when a swipe let go here closes the toast. */
export function swipeCloses(along: number, velocity: number): boolean {
  return along >= SWIPE_DISTANCE || (velocity >= SWIPE_VELOCITY && along >= SWIPE_FLICK_MIN);
}

/** The drawn offset as x and y, for the CSS variables. */
export function swipeOffset(direction: SwipeDirection, drawn: number): { x: number; y: number } {
  const d = drawn * swipeSign(direction);
  return swipeAxis(direction) === 'x' ? { x: d, y: 0 } : { x: 0, y: d };
}
