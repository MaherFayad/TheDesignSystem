// A digit by digit roll for a text that changes (order 1.22), shared by Stat,
// Badge, AvatarGroup, NotificationCenter and ProgressCircle, and the pop of a
// mark that changed. One copy for both frameworks (order 1.29): React's
// useDigitRoll (packages/react/src/components/Stat/useDigitRoll.ts) and
// Angular's components keep a DigitRoller and call `update` after each
// render.
//
// The host is a decorative span (aria-hidden) rendered with the text as its
// child, so the first paint draws the number with no script. When the text
// changes after the first paint, `update` hands the host to `rollDigits`,
// which rewrites it as columns and rolls the changed ones before the paint.
// The real value is read elsewhere: a visually hidden copy, an aria-label or
// aria-valuetext.
//
// A change that comes less than ROLL_WINDOW_MS (333ms, or the roll itself
// when it is longer) after the last roll started changes in place (motion
// catalog note N11, review note N3), so no number rolls more than three
// times a second in any style, whatever its spring durations. Mode none
// writes the text at once; reduced fades the new characters (the
// primitive's reduced form).
import { play, type PatternMode } from '../core';
import { renderDigits, rollDigits, rollDirection } from '../primitives/digit-roll';
/** The shortest time between two rolls of one number: three a second at most (WCAG 2.3.1). */
export const ROLL_WINDOW_MS = 333;

/**
 * The roll state of one host. Call `update` after each render with the text
 * the host shows (undefined when the host is not rendered). The first call
 * only records. A change less than ROLL_WINDOW_MS after the last roll
 * changes in place; mode none writes the text at once. `value` is the number
 * behind the text, when there is one: it sets the direction (a compact or
 * formatted text may not read as a number). `onRoll` is told the direction
 * of each roll that plays, for a secondary element that reacts.
 */
export class DigitRoller {
  private previous: string | undefined;
  private previousValue: number | undefined;
  private busyUntil = 0;
  private started = false;

  update<T extends HTMLElement>(
    host: T | null | undefined,
    text: string | undefined,
    mode: PatternMode,
    value?: number,
    onRoll?: (direction: 'up' | 'down', host: T) => void,
  ): void {
    const before = this.started ? this.previous : undefined;
    const beforeValue = this.previousValue;
    this.started = true;
    this.previous = text;
    this.previousValue = value;
    if (!host || text === undefined || before === undefined || before === text) return;
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    if (now < this.busyUntil || mode === 'none') {
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
    this.busyUntil = animations.length > 0 ? now + Math.max(ROLL_WINDOW_MS, longest) : 0;
    if (animations.length > 0) onRoll?.(direction, host);
  }
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
