'use client';
// The digit roll layer of NumberField and ScrubInput (interactions
// field-step and scrub-roll, order 1.22, proposed).
//
// Round 1 rolled the native input itself and had to keep the travel short:
// the input has no clip, so a full roll drew the digits outside the box.
// Here the input keeps its text for editing, always. The roll plays in a
// decorative layer: an unnamed span with aria-hidden="true", a child of the
// root, laid over the input's box while a roll runs and empty at rest.
// While the layer holds digits, the component CSS draws the input text
// transparent (the caret keeps its color), and the layer clips the roll to
// the input's box. When the roll settles, or the person types, the layer
// empties and the input text shows again. Assistive technology reads the
// input; the layer is never read.
//
// The roll is `rollDigits` from @the-system/motion: each changed digit
// rolls in its own column, from below when the value grew and from above
// when it fell, one stagger step apart from the last digit.
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { readDir, rollDigits, type PatternMode } from '@the-system/motion';

export interface DigitLayer {
  /** The ref for the layer span. Render `<span aria-hidden="true" ref={layer} />` as a child of the root. */
  layer: RefObject<HTMLSpanElement | null>;
  /** Rolls the layer from one text to the next over `input`. Plays nothing for mode `none` or without the Web Animations API. */
  roll: (input: HTMLInputElement | null, from: string, to: string, opts: { mode: PatternMode; direction?: 'up' | 'down' }) => void;
  /** Empties the layer at once, so the input text shows. */
  clear: () => void;
}

/** The layer over an input: its box, as logical offsets from the root's padding box. */
function place(layer: HTMLElement, input: HTMLElement, root: HTMLElement): void {
  const i = input.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  const rtl = readDir(root) === 'rtl';
  const s = layer.style;
  s.insetInlineStart = `${(rtl ? r.right - i.right : i.left - r.left) - root.clientLeft}px`;
  s.insetBlockStart = `${i.top - r.top - root.clientTop}px`;
  s.inlineSize = `${i.width}px`;
  s.blockSize = `${i.height}px`;
  // rollDigits keeps a display it finds; the layer centers its columns on the input's line.
  s.display = 'flex';
}

export function useDigitLayer(input: { readonly current: HTMLInputElement | null }): DigitLayer {
  const layer = useRef<HTMLSpanElement | null>(null);
  const run = useRef(0);

  const clear = useCallback(() => {
    run.current += 1;
    const el = layer.current;
    if (!el || el.childElementCount === 0) return;
    for (const a of el.getAnimations?.({
      subtree: true,
    } as GetAnimationsOptions) ?? [])
      a.cancel();
    el.replaceChildren();
    el.style.display = '';
  }, []);

  const roll = useCallback<DigitLayer['roll']>(
    (target, from, to, { mode, direction }) => {
      const el = layer.current;
      const root = el?.parentElement;
      if (!el || !root || !target || mode === 'none' || typeof target.animate !== 'function') return;
      if (from === to || from.trim() === '' || to.trim() === '') {
        clear();
        return;
      }
      run.current += 1;
      const token = run.current;
      place(el, target, root);
      // The digits drawn now are where the roll starts: a quick second step rolls on from them.
      const anims = rollDigits(el, from, to, { mode, direction });
      if (anims.length === 0) {
        el.replaceChildren();
        return;
      }
      const done = () => {
        if (token === run.current) clear();
      };
      void Promise.all(anims.map((a) => a.finished)).then(done, done);
    },
    [clear],
  );

  // Typing, a paste or a cut shows the real text at once.
  useEffect(() => {
    const el = input.current;
    if (!el) return undefined;
    el.addEventListener('beforeinput', clear);
    return () => el.removeEventListener('beforeinput', clear);
  }, [input, clear]);

  return { layer, roll, clear };
}
