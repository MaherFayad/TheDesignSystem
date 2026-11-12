'use client';
// The error shake of the fields family (interaction error-shake, orders 1.21
// and 1.22). The field box shakes once when the field turns invalid, and
// when the browser refuses a submit for its input (the native `invalid`
// event). It never plays on first paint of a field that starts invalid,
// never on a key while the field stays invalid, and never while a shake
// still plays. Used by Input, PasswordField, OTPField and NumberField.
//
// Round 2: the shake has a settle. The first swing goes toward the inline
// end by distance.shift, the swings shrink (shift, about two thirds of it,
// then nudge, then half a nudge) and the box eases back to rest, over
// duration.spring-bouncy on ease.out. In RTL the first swing goes the other
// way. No luminance change, once per error: never a flash.
import { useCallback, useEffect, useRef } from 'react';
import { useMotion } from '../../internal/motion';
import { inlineSign, playBeat, token, type Beat } from './fieldMotion';

/** The box that shakes for a native input: give a function defined once, outside the component. */
export type ShakeBox = (input: HTMLInputElement) => Element | null | undefined;

/** The input's parent: the root of Input, OTPField and NumberField. */
export const parentBox: ShakeBox = (input) => input.parentElement;

/** The interaction id in the registry and in the style presets. */
export const ERROR_SHAKE = 'error-shake';

/** The swings of the shake with a settle, toward the inline end first (`sign` is -1 in RTL). */
export function shakeBeat(sign: 1 | -1): Beat {
  const x = (share: string) => ({
    transform: `translateX(calc(${sign} * ${share}))`,
  });
  return {
    keyframes: [
      { transform: 'none', offset: 0 },
      { ...x(token.shift), offset: 0.14 },
      { ...x(`-0.65 * ${token.shift}`), offset: 0.34 },
      { ...x(token.nudge), offset: 0.54 },
      { ...x(`-0.5 * ${token.nudge}`), offset: 0.74 },
      { transform: 'none', offset: 1 },
    ],
    duration: 'duration.spring-bouncy',
    easing: 'ease.out',
  };
}

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
  const running = useRef<Animation | null>(null);

  const shake = useCallback(() => {
    const el = input.current;
    const target = el ? box(el) : null;
    if (!target || running.current?.playState === 'running') return;
    running.current = playBeat(target, shakeBeat(inlineSign(target)), ERROR_SHAKE, motion.mode(ERROR_SHAKE), null);
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
