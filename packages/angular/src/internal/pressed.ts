// Press from touch down (order M5, the Angular side of order M4). On touch
// `:active` can wait for the finger to lift, so the shared CSS reads
// `:is(:active, [data-pressed])`. This marks an element `data-pressed` from a
// primary pointerdown to pointerup, pointercancel, lost pointer capture or the
// pointer leaving, never while the control is inert (disabled or loading).
// A key press keeps `:active` alone.
//
// The listeners are native and set no signal, so a press costs no change
// detection. The switch keeps its own wiring in internal/toggles-switch-drag.ts
// (markPressed on the root), as React's Switch/drag.ts.
import { PRESSED_ATTR } from '@the-system/motion';

const RELEASE = ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'] as const;

/**
 * Marks `el` pressed while a primary pointer is down on it. `blocked` is read
 * on each pointerdown: true (disabled, loading) leaves the element unmarked.
 * Returns a function that removes the listeners and the mark.
 */
export function trackPressed(el: HTMLElement, blocked: () => boolean): () => void {
  const down = (event: PointerEvent) => {
    if (blocked() || event.button !== 0 || !event.isPrimary) return;
    el.setAttribute(PRESSED_ATTR, '');
  };
  const up = () => el.removeAttribute(PRESSED_ATTR);
  el.addEventListener('pointerdown', down);
  for (const type of RELEASE) el.addEventListener(type, up);
  return () => {
    el.removeEventListener('pointerdown', down);
    for (const type of RELEASE) el.removeEventListener(type, up);
    up();
  };
}
