// Motion of the text inputs and forms family (orders 1.21 to 1.23): the
// Angular wiring only. The beats, the leaving copy, the shake and the digit
// roll layer are framework free and live once in @the-system/motion
// (helpers/field-motion.ts, order 1.29); components import them from there.
//
// This file keeps what needs an injection context: `errorShake` and
// `digitLayer` read the style's mode through `injectMotion()` and play from
// `afterRenderEffect` and DOM events, never on change detection timing.
// Nothing waits on transitionend or animationend.
import { DestroyRef, afterNextRender, afterRenderEffect, inject } from '@angular/core';
import { ERROR_SHAKE, ErrorShaker, digitLayerControl, parentBox, type DigitLayerControl, type ShakeBox } from '@the-system/motion';
import { injectMotion } from './motion';

/**
 * error-shake: shakes the box of `input` when `invalid` turns on, and when
 * the input gets a native `invalid` event. Never on first paint of a field
 * that starts invalid, never while it stays invalid, never while a shake
 * still plays. The reduced form is no motion. Call in an injection context;
 * `input` and `invalid` are read after render, so a view query is ready.
 */
export function errorShake(input: () => HTMLInputElement | null | undefined, invalid: () => boolean, box: ShakeBox = parentBox): void {
  const motion = injectMotion();
  const shaker = new ErrorShaker();
  const shake = () => shaker.shake(input(), box, motion.mode(ERROR_SHAKE));
  let was: boolean | undefined;
  afterRenderEffect(() => {
    const now = invalid();
    const before = was;
    was = now;
    if (before === false && now) shake();
  });
  let listening: HTMLInputElement | null = null;
  afterNextRender(() => {
    listening = input() ?? null;
    listening?.addEventListener('invalid', shake);
  });
  inject(DestroyRef).onDestroy(() => listening?.removeEventListener('invalid', shake));
}

/**
 * The port of React's useDigitLayer (field-step, scrub-roll). `layer` is the
 * unnamed aria-hidden span, a child of the root, empty at rest; while it
 * holds digits the component CSS draws the input text transparent. Typing, a
 * paste or a cut empties it at once. Call in an injection context.
 */
export function digitLayer(layer: () => HTMLElement | null | undefined, input: () => HTMLInputElement | null | undefined): DigitLayerControl {
  const control = digitLayerControl(layer);
  let listening: HTMLInputElement | null = null;
  afterNextRender(() => {
    listening = input() ?? null;
    listening?.addEventListener('beforeinput', control.clear);
  });
  inject(DestroyRef).onDestroy(() => listening?.removeEventListener('beforeinput', control.clear));
  return control;
}
