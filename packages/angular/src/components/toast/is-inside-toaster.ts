// The twin of packages/react/src/components/Toast/isInsideToaster.ts.

/** The attribute on the theme element at the top of the toaster's portal. */
export const TOASTER_LAYER_ATTRIBUTE = 'data-toaster-layer';

/**
 * True when the target is inside a toaster (a toast, its buttons, the list).
 * An overlay that closes on an outside focus or pointer press checks it, so
 * working with a toast never closes the overlay.
 */
export function isInsideToaster(target: EventTarget | null): boolean {
  if (typeof Node === 'undefined' || !(target instanceof Node)) return false;
  const el = target instanceof Element ? target : target.parentElement;
  return el?.closest(`[${TOASTER_LAYER_ATTRIBUTE}]`) != null;
}
