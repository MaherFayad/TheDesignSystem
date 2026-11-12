'use client';
// The error shake of the fields family (interaction error-shake, order 1.21).
// The field box shakes once when the field turns invalid, and when the
// browser refuses a submit for its input (the native `invalid` event). It
// never plays on first paint of a field that starts invalid, never on a key
// while the field stays invalid, and never while a shake still plays. Used
// by Input, PasswordField, OTPField and NumberField.
import { useCallback, useEffect, useRef } from 'react';
import { useMotion } from '../../internal/motion';

/** The box that shakes for a native input: give a function defined once, outside the component. */
export type ShakeBox = (input: HTMLInputElement) => Element | null | undefined;

/** The input's parent: the root of Input, OTPField and NumberField. */
export const parentBox: ShakeBox = (input) => input.parentElement;

/**
 * Shakes the box of `input` when `invalid` turns on, and when the input gets
 * a native `invalid` event. The state is already drawn by the caller; the
 * shake only decorates it, and plays nothing under a style or a person that
 * turns it off.
 */
export function useErrorShake(input: { readonly current: HTMLInputElement | null }, invalid: boolean, box: ShakeBox = parentBox): void {
  const motion = useMotion();
  const was = useRef(invalid);
  const running = useRef<Animation | null>(null);

  const shake = useCallback(() => {
    const el = input.current;
    if (!el || running.current?.playState === 'running') return;
    running.current = motion.play(box(el), 'shake', 'error-shake');
  }, [motion, input, box]);

  useEffect(() => {
    const before = was.current;
    was.current = invalid;
    if (invalid && !before) shake();
  }, [invalid, shake]);

  useEffect(() => {
    const el = input.current;
    if (!el) return undefined;
    el.addEventListener('invalid', shake);
    return () => el.removeEventListener('invalid', shake);
  }, [input, shake]);
}
