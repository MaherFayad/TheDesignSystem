'use client';
// A digit by digit roll for a text that changes (order 1.22), shared by Stat,
// Badge, AvatarGroup, NotificationCenter and ProgressCircle.
//
// The host is a decorative span (aria-hidden) that React renders with the
// text as its child, so the first paint and the server draw the number with
// no script. When the text changes after the first paint, the layout effect
// hands the host to the DigitRoller of @the-system/motion
// (helpers/digit-roller.ts, one copy for both frameworks), which rolls the
// changed columns before the paint and keeps the three a second limit
// (ROLL_WINDOW_MS). This hook only times it for React. The pop of a mark
// that changed is `popMark` in the same helper.
import { useLayoutEffect, useRef } from 'react';
import { DigitRoller, styleTurnsOff, type PatternMode } from '@the-system/motion';

/**
 * Returns the ref for the host. `text` is what the host shows; undefined
 * means the host is not rendered. `onRoll` is told the direction of each
 * roll that plays, for a secondary element that reacts (a trend mark, a pop).
 * `value` is the number behind the text, when there is one: it sets the
 * direction (a compact or formatted text may not read as a number).
 * `off` names a private property that an interaction's off row sets (for
 * example `--_progress-circle-duration: 0s`): while it reads off on the host,
 * the text changes with no roll (review N31).
 */
export function useDigitRoll<T extends HTMLElement>(
  text: string | undefined,
  mode: PatternMode,
  onRoll?: (direction: 'up' | 'down', host: T) => void,
  value?: number,
  off?: `--_${string}`,
) {
  const ref = useRef<T>(null);
  const roller = useRef<DigitRoller | null>(null);
  roller.current ??= new DigitRoller();
  useLayoutEffect(() => {
    const now = off && styleTurnsOff(ref.current, off) ? 'none' : mode;
    roller.current?.update(ref.current, text, now, value, onRoll);
  }, [text, value, mode, onRoll, off]);
  return ref;
}
