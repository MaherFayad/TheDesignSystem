'use client';
// The digit roll layer of NumberField and ScrubInput (interactions
// field-step and scrub-roll, order 1.22, proposed).
//
// Round 1 rolled the native input itself and had to keep the travel short:
// the input has no clip, so a full roll drew the digits outside the box.
// Here the input keeps its text for editing, always. The roll plays in a
// decorative layer: an unnamed span with aria-hidden="true", a child of the
// root, laid over the input's box while a roll runs and empty at rest.
// Assistive technology reads the input; the layer is never read.
//
// The placement, the roll and the clear are `digitLayerControl` from
// @the-system/motion (helpers/field-motion.ts), one copy for both
// frameworks; this hook holds the layer's ref and empties the layer when
// the person types.
import { useEffect, useRef, type RefObject } from 'react';
import { digitLayerControl, type DigitLayerControl } from '@the-system/motion';

export interface DigitLayer extends DigitLayerControl {
  /** The ref for the layer span. Render `<span aria-hidden="true" ref={layer} />` as a child of the root. */
  layer: RefObject<HTMLSpanElement | null>;
}

export function useDigitLayer(input: { readonly current: HTMLInputElement | null }): DigitLayer {
  const layer = useRef<HTMLSpanElement | null>(null);
  const control = useRef<DigitLayerControl | null>(null);
  control.current ??= digitLayerControl(() => layer.current);
  const { roll, clear } = control.current;

  // Typing, a paste or a cut shows the real text at once.
  useEffect(() => {
    const el = input.current;
    if (!el) return undefined;
    el.addEventListener('beforeinput', clear);
    return () => el.removeEventListener('beforeinput', clear);
  }, [input, clear]);

  return { layer, roll, clear };
}
