/** The attribute on the Theme element at the top of the Toaster's portal. */
export const TOASTER_LAYER_ATTRIBUTE = 'data-toaster-layer';

/**
 * True when the target is inside a Toaster (a toast, its buttons, the list).
 * A modal overlay calls it in onFocusOutside, onPointerDownOutside and
 * onInteractOutside and calls preventDefault when it is true, so working
 * with a toast never closes the overlay:
 *
 *   onInteractOutside={(event) => { if (isInsideToaster(event.target)) event.preventDefault(); }}
 */
export function isInsideToaster(target: EventTarget | null): boolean {
  if (typeof Node === 'undefined' || !(target instanceof Node)) return false;
  const el = target instanceof Element ? target : target.parentElement;
  return el?.closest(`[${TOASTER_LAYER_ATTRIBUTE}]`) != null;
}
