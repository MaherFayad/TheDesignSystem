'use client';
// The error shake of the fields family (interaction error-shake, orders 1.21
// and 1.22). The field box shakes once when the field turns invalid, and
// when the browser refuses a submit for its input (the native `invalid`
// event). It never plays on first paint of a field that starts invalid,
// never on a key while the field stays invalid, and never while a shake
// still plays. Used by Input, PasswordField, OTPField and NumberField.
//
// The swings and the guard against a second shake are the ErrorShaker of
// @the-system/motion (helpers/field-motion.ts), one copy for both
// frameworks; this hook only decides when to call it.
import { useCallback, useEffect, useRef } from 'react';
import { ERROR_SHAKE, ErrorShaker, parentBox, type ShakeBox } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

/**
 * Shakes the box of `input` when `invalid` turns on, and when the input gets
 * a native `invalid` event. The state is already drawn by the caller; the
 * shake only decorates it, and plays nothing under a style or a person that
 * turns it off (the reduced form is no motion: the error color and the
 * message carry the state).
 */
export function useErrorShake(input: { readonly current: HTMLInputElement | null }, invalid: boolean, box: ShakeBox = parentBox): void {
  const motion = useMotion();
  const was = useRef(invalid);
  const shaker = useRef<ErrorShaker | null>(null);
  shaker.current ??= new ErrorShaker();

  const shake = useCallback(() => {
    shaker.current?.shake(input.current, box, motion.mode(ERROR_SHAKE));
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
