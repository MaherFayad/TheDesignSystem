// shake: a field that refused its value moves a few px along the inline axis
// and back, once. It plays when the error appears, never on every key, and
// never while the field keeps its error. Two swings by default, at most
// three, inside duration.roll: no luminance changes, so it is not a flash
// (WCAG 2.3.1), and it plays once per error, well under three times a
// second. `swings: 1` with `toward` is the nudge a control plays when it is
// pushed past its end (a slider at its minimum or maximum). Reduced: no
// motion; the error color and message carry the state (WCAG 2.3.3).
import { definePattern, stillSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { space } from './values';

export interface ShakeInput extends MotionInput {
  /** Swings out and back. Default 2, at most 3. */
  swings?: 1 | 2 | 3;
  /** For a nudge: the end the control was pushed toward. Default: no side, an even shake. */
  toward?: 'start' | 'end';
}

/** The most swings the pattern plays, so a shake never reads as a vibration. */
export const SHAKE_MAX_SWINGS = 3;

export const shake = definePattern<ShakeInput>({
  id: 'shake',
  tokens: ['duration.roll', 'duration.base', 'ease.out', 'space.3xs'],
  spec: ({ swings = 2, toward, dir }) => {
    const n = Math.min(SHAKE_MAX_SWINGS, Math.max(1, swings));
    // The inline end is +x in LTR and -x in RTL.
    const endSign = dir === 'rtl' ? -1 : 1;
    const first = toward === 'start' ? -endSign : endSign;
    const keyframes: Keyframe[] = [{ transform: 'none' }];
    if (toward) {
      // A nudge: out toward the end, then back, with a smaller rebound per extra swing.
      for (let i = 0; i < n; i++) {
        const sign = i % 2 === 0 ? first : -first;
        const share = i === 0 ? '' : ' * 0.4';
        keyframes.push({ transform: `translateX(calc(${sign} * ${space('space.3xs')}${share}))` });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const fade = n === 1 ? '' : ` * ${1 - i / (n + 1)}`;
        keyframes.push({ transform: `translateX(calc(${first} * ${space('space.3xs')}${fade}))` });
        keyframes.push({ transform: `translateX(calc(${-first} * ${space('space.3xs')}${fade}))` });
      }
    }
    keyframes.push({ transform: 'none' });
    return { keyframes, duration: toward ? 'duration.base' : 'duration.roll', easing: 'ease.out', fill: 'none', origin: '50% 50%' };
  },
  reduced: () => stillSpec('duration.roll'),
  native: {
    duration: durationMs['duration.roll'],
    nudgeDuration: durationMs['duration.base'],
    easing: easeBezier['ease.out'],
    reducedDuration: 0,
    distance: spacePx['space.3xs'],
    swings: 2,
  },
});
