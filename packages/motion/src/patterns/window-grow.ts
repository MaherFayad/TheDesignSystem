// window-grow: the window grows out of the control that opened it and, on
// exit (`window-close`), shrinks back into it. Moved from window.ts with the
// same values. Reduced: a fade on duration.base.
import { between, definePattern, fadeIn, fadeOut, usableRect } from '../core';
import { durationMs, easeBezier, scaleValue } from '../tokens';
import { asSpec, CENTER, TOP_START, WINDOW_REST_SCALE, type WindowMotionInput, type WindowMotionSpec } from './window-shared';

/**
 * Open: the window grows out of the trigger (`from`) into its frame (`to`).
 * Opacity settles early while the transform runs the whole way. Without a
 * trigger it scales up from 92%. Reduced: a fade in.
 */
export function windowGrow({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-grow', duration: 'duration.window-open', easing: 'ease.window', fill: 'none', origin: TOP_START } as const;
  if (reduced) return { ...base, duration: 'duration.base', keyframes: [...fadeIn] };
  if (usableRect(from) && usableRect(to)) {
    return {
      ...base,
      keyframes: [
        { transform: between(from, to), opacity: 0.35 },
        { opacity: 1, offset: 0.35 },
        { transform: 'none', opacity: 1 },
      ],
    };
  }
  return {
    ...base,
    origin: CENTER,
    keyframes: [
      { transform: `scale(${WINDOW_REST_SCALE})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
  };
}

/**
 * Close: the window (`from`) shrinks back into its trigger (`to`) and fades.
 * Without a trigger it scales down to 92%. Reduced: a fade out.
 */
export function windowClose({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-close', duration: 'duration.window-close', fill: 'forwards', origin: TOP_START } as const;
  if (reduced) return { ...base, duration: 'duration.base', easing: 'ease.exit', keyframes: [...fadeOut] };
  if (usableRect(from) && usableRect(to)) {
    return {
      ...base,
      easing: 'ease.window',
      keyframes: [
        { transform: 'none', opacity: 1 },
        { transform: between(to, from), opacity: 0 },
      ],
    };
  }
  return {
    ...base,
    origin: CENTER,
    easing: 'ease.exit',
    keyframes: [
      { transform: 'none', opacity: 1 },
      { transform: `scale(${WINDOW_REST_SCALE})`, opacity: 0 },
    ],
  };
}

export const windowGrowPattern = definePattern<WindowMotionInput>({
  id: 'window-grow',
  tokens: ['duration.window-open', 'duration.window-close', 'duration.base', 'ease.window', 'ease.exit', 'scale.window-enter'],
  spec: (input) => asSpec(input.phase === 'exit' ? windowClose({ ...input, reduced: false }) : windowGrow({ ...input, reduced: false })),
  reduced: (input) => asSpec(input.phase === 'exit' ? windowClose({ ...input, reduced: true }) : windowGrow({ ...input, reduced: true })),
  native: {
    duration: durationMs['duration.window-open'],
    exitDuration: durationMs['duration.window-close'],
    easing: easeBezier['ease.window'],
    reducedDuration: durationMs['duration.base'],
    restScale: scaleValue['scale.window-enter'],
  },
});
