// The highlight marker (interaction "highlight-marker", order 1.23): the
// Angular wiring only. The marker, the check draw, the exit copy of a popup
// and the press point are framework free and live once in
// @the-system/motion (helpers/selection-marker.ts, order 1.29), next to
// React's useHighlightMarker; components import them from there. This file
// keeps injectHighlightMarker, which needs an injection context.
//
// One aria-hidden element, `data-part="highlight"`, the last child of the
// list part, draws the fill of the lit row and is placed with `transform`
// from the lit row's offset in the list, so the fill slides from row to row
// while the rows, their hit areas, their text and their focus ring stay
// still. Under reduced motion, or when the style turns it off, every move is
// a jump. Not exported from the package barrel.
import { DestroyRef, inject } from '@angular/core';
import { HIGHLIGHT_MARKER_ID, MARKER_SELECTOR, watchMarker, type HighlightMarkerOptions } from '@the-system/motion';
import { injectMotion } from './motion';

/**
 * The marker of a component, in an injection context: returns the function
 * to call with the element that holds the rows and the marker (null when it
 * leaves, as a popup does). Calling it again with the same element, the same
 * marker child and the same options keeps the watch; a new marker (a list
 * that was empty) or new options (an input changed) start it again. Options
 * may be a function, read at each call. Stops on destroy.
 */
export function injectHighlightMarker(options: HighlightMarkerOptions | (() => HighlightMarkerOptions)): (el: HTMLElement | null) => void {
  const motion = injectMotion();
  let watched: HTMLElement | null = null;
  let marker: Element | null = null;
  let key = '';
  let stop: (() => void) | null = null;
  inject(DestroyRef).onDestroy(() => stop?.());
  return (el) => {
    const o = typeof options === 'function' ? options() : options;
    const { rows, lit = '[data-highlighted]', fallback, hover = false, colors, interaction = HIGHLIGHT_MARKER_ID } = o;
    const nextKey = JSON.stringify([rows, lit, fallback, hover, colors?.lit, colors?.hover, interaction]);
    const next = el?.querySelector(MARKER_SELECTOR) ?? null;
    if (el === watched && next === marker && nextKey === key) return;
    stop?.();
    watched = el;
    marker = next;
    key = nextKey;
    stop = el ? watchMarker(el, { rows, lit, hover, fallback, colors }, () => motion.mode(interaction)) : null;
  };
}
