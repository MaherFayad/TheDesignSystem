// The Drawer swipe to dismiss (order 1.29), one copy for both frameworks:
// the React Drawer imports it from @the-system/motion, and Angular will
// when it ports Drawer. Pure functions; the component wires the pointer on
// the Drawer's handle part and writes --_dialog-drag-x and --_dialog-drag-y.
//
// The same rules as the Sheet (sheet-detents.ts): toward the edge the panel
// sits on it follows the pointer one to one; against it, it gives a rubber
// band; on release it closes past a quarter of its size, or on a flick
// toward the edge (speed over the last moments, the release included, so a
// pause before the release leaves no speed). The close button and Escape
// are the other paths (WCAG 2.5.7).
import { DRAG_DISMISS_SHARE, DRAG_FLICK_MIN, DRAG_FLICK_SPEED, detentRubberBand } from './sheet-detents';
import type { SwipeDirection } from './toast-swipe';

/**
 * The way a Drawer is swiped away: toward the edge it sits on. The end side
 * is the right in a left to right page and the left in a right to left one.
 * On platform ios the Drawer rises from the bottom like a sheet (ios.css),
 * so it goes down.
 */
export function drawerSwipeDirection(side: 'start' | 'end', dir: 'ltr' | 'rtl', platform: string | undefined): SwipeDirection {
  if (platform === 'ios') return 'down';
  const right = (side === 'end') === (dir === 'ltr');
  return right ? 'right' : 'left';
}

/** The drawn distance toward the edge for a pointer `along` px toward it: one to one, a rubber band against it. */
export function drawerSwipeOffset(along: number, closable: boolean): number {
  if (along >= 0) return closable ? along : detentRubberBand(along);
  return -detentRubberBand(-along);
}

/** True when a swipe let go `along` px toward the edge at `velocity` px per ms closes a Drawer of `size` px. */
export function drawerSwipeCloses(along: number, velocity: number, size: number): boolean {
  return along > size * DRAG_DISMISS_SHARE || (velocity > DRAG_FLICK_SPEED && along > DRAG_FLICK_MIN);
}
