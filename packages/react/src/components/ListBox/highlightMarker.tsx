'use client';
// Order 1.23 (interaction round 3) for the selection family: the one
// highlight marker of a list. Shared by ListBox (and through it Combobox,
// Autocomplete, MultiSelect and TagField), Select, CommandPalette and the
// menus (DropdownMenu, ContextMenu, Menubar). Not exported from the package
// barrel.
//
// The marker's placement (interaction "highlight-marker"), the drawn check
// (drawCheck), the exit copy of a popup (exitGhost) and the press point
// (setPressPoint) are the selection marker helpers of @the-system/motion
// (helpers/selection-marker.ts), one copy for both frameworks. This file
// keeps the React hook that starts `watchMarker` on the list and the marker
// element.
//
// Nothing waits on transitionend or animationend.
import { useCallback, useEffect, useRef } from 'react';
import { HIGHLIGHT_MARKER_ID, watchMarker, type HighlightMarkerOptions } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

/**
 * The marker of a list. Render `marker` as the last child of the element that
 * holds the rows and pass `ref` to that element (a ref callback, so a popup
 * that mounts late is followed). The element must be positioned and must
 * make a stacking context (the component CSS does both).
 */
export function useHighlightMarker({ rows, lit = '[data-highlighted]', fallback, hover = false, colors, interaction = HIGHLIGHT_MARKER_ID }: HighlightMarkerOptions) {
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      stop.current?.();
      stop.current = el ? watchMarker(el, { rows, lit, hover, fallback, colors }, () => modeRef.current(interaction)) : null;
    },
    // colors is read once per list (pass constant strings).
    [rows, lit, hover, fallback, interaction, colors?.lit, colors?.hover],
  );
  return ref;
}

/** The marker element: decorative, last child of the list. */
export function HighlightMarker() {
  return <span data-part="highlight" aria-hidden="true" />;
}
