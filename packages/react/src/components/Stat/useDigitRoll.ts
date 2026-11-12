'use client';
// A digit by digit roll for a text that changes (order 1.22), shared by Stat,
// Badge, AvatarGroup, NotificationCenter and ProgressCircle.
//
// The host is a decorative span (aria-hidden) that React renders with the
// text as its child, so the first paint and the server draw the number with
// no script. When the text changes after the first paint, the layout effect
// hands the host to `rollDigits` (packages/motion), which rewrites it as
// columns and rolls the changed ones before the paint. The real value is read
// elsewhere: a visually hidden copy, an aria-label or aria-valuetext.
//
// A change that comes less than ROLL_WINDOW_MS (333ms, or the roll itself
// when it is longer) after the last roll started changes in place (motion
// catalog note N11, review note N3), so no number rolls more than three
// times a second in any style, whatever its spring durations. Mode none writes the text
// at once; reduced fades the new characters (the primitive's reduced form).
import { useLayoutEffect, useRef } from 'react';
import { play, renderDigits, rollDigits, rollDirection, type PatternMode } from '@the-system/motion';

/** The shortest time between two rolls of one number: three a second at most (WCAG 2.3.1). */
export const ROLL_WINDOW_MS = 333;

/**
 * Returns the ref for the host. `text` is what the host shows; undefined
 * means the host is not rendered. `onRoll` is told the direction of each
 * roll that plays, for a secondary element that reacts (a trend mark, a pop).
 * `value` is the number behind the text, when there is one: it sets the
 * direction (a compact or formatted text may not read as a number).
 */
export function useDigitRoll<T extends HTMLElement>(
  text: string | undefined,
  mode: PatternMode,
  onRoll?: (direction: 'up' | 'down', host: T) => void,
  value?: number,
) {
  const ref = useRef<T>(null);
  const previous = useRef(text);
  const previousValue = useRef(value);
  const busyUntil = useRef(0);
  useLayoutEffect(() => {
    const before = previous.current;
    const beforeValue = previousValue.current;
    previous.current = text;
    previousValue.current = value;
    const host = ref.current;
    if (!host || text === undefined || before === undefined || before === text) return;
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    if (now < busyUntil.current || mode === 'none') {
      renderDigits(host, text);
      return;
    }
    const direction = value !== undefined && beforeValue !== undefined ? (value < beforeValue ? 'down' : 'up') : rollDirection(before, text);
    const animations = rollDigits(host, before, text, { mode, direction });
    const longest = Math.max(
      0,
      ...animations.map((a) => {
        const t = a.effect?.getTiming();
        return (Number(t?.delay) || 0) + (Number(t?.duration) || 0);
      }),
    );
    busyUntil.current = animations.length > 0 ? now + Math.max(ROLL_WINDOW_MS, longest) : 0;
    if (animations.length > 0) onRoll?.(direction, host);
  }, [text, value, mode, onRoll]);
  return ref;
}

/**
 * A pop for a mark that changed (a badge, a count, a status, a finished
 * ring): it dips to scale.anticipate, grows past rest to scale.pop and
 * settles, over duration.celebrate. Transform only, so the layout and the hit
 * area stay where they are. Reduced and none: nothing (the new value shows at
 * once). Returns the animation or null.
 */
export function popMark(el: Element | null | undefined, mode: PatternMode, axis: 'both' | 'block' = 'both'): Animation | null {
  if (!el || mode !== 'full') return null;
  const s = (name: string) => (axis === 'both' ? `scale(var(--ds-scale-${name}))` : `scale(1, var(--ds-scale-${name}))`);
  return play(
    el,
    {
      keyframes: [
        { transform: 'none' },
        { transform: s('anticipate'), offset: 0.2 },
        { transform: s('pop'), offset: 0.55 },
        { transform: 'none' },
      ],
      duration: 'duration.celebrate',
      easing: 'ease.out',
      fill: 'none',
      origin: '50% 50%',
    },
    'pop-mark',
  );
}
