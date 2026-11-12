'use client';
// The pointer highlight of an interactive Card or Tile (order 1.22,
// interaction card-lift, proposed). A decorative span inside the root
// (aria-hidden, no pointer, empty) holds a soft round highlight on its
// ::before. Pointer moves over the root write the pointer's place, from the
// root's inline start and block start, into two private properties on that
// span; the CSS moves the highlight there with transform. The hit area never
// moves: only the decorative layer does. Mode none or reduced: nothing is
// written, so the highlight stays centered and the CSS hides it.
import { useCallback, useRef, type PointerEvent } from 'react';
import { useMotion } from '../../internal/motion';

/** Returns the ref for the glow span and the pointer move handler for the root. */
export function usePointerGlow<E extends HTMLElement>(component: 'card' | 'tile', interaction: string, onPointerMove?: (event: PointerEvent<E>) => void) {
  const glow = useRef<HTMLSpanElement>(null);
  const motion = useMotion();
  const handler = useCallback(
    (event: PointerEvent<E>) => {
      onPointerMove?.(event);
      const el = glow.current;
      if (!el || motion.mode(interaction) !== 'full') return;
      const r = event.currentTarget.getBoundingClientRect();
      const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
      // From the inline start: in RTL the highlight's box sits at the right edge, so the offset is negative.
      const x = rtl ? event.clientX - r.right : event.clientX - r.left;
      el.style.setProperty(`--_${component}-glow-x`, `${Math.round(x)}px`);
      el.style.setProperty(`--_${component}-glow-y`, `${Math.round(event.clientY - r.top)}px`);
    },
    [component, interaction, motion, onPointerMove],
  );
  return { glow, onPointerMove: handler };
}
