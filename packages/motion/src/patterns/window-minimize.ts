// window-minimize: a genie like shrink of the window toward the dock. Moved
// from window.ts with the same values. Reduced: a fade on duration.base.
import { definePattern, fadeOut, round, usableRect } from '../core';
import { durationMs, easeBezier } from '../tokens';
import { asSpec, BOTTOM_CENTER, type WindowMotionInput, type WindowMotionSpec } from './window-shared';

/**
 * The window (`from`) narrows first, then falls into the dock (`to`), bottom
 * center first. Without a target it scales down and fades in place.
 */
export function windowMinimize({ from, to, reduced = false }: WindowMotionInput = {}): WindowMotionSpec {
  const base = { name: 'window-minimize', duration: 'duration.window-minimize', easing: 'ease.window', fill: 'forwards', origin: BOTTOM_CENTER } as const;
  if (reduced) return { ...base, duration: 'duration.base', keyframes: [...fadeOut] };
  if (!usableRect(from) || !usableRect(to)) {
    return {
      ...base,
      keyframes: [
        { transform: 'none', opacity: 1 },
        { transform: 'scale(0.2)', opacity: 0 },
      ],
    };
  }
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height);
  const s = Math.max(0.04, Math.min(to.width / from.width, to.height / from.height));
  return {
    ...base,
    keyframes: [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${round(dx * 0.25)}px, ${round(dy * 0.15)}px) scale(0.55, 0.7)`, opacity: 0.9, offset: 0.4 },
      { transform: `translate(${round(dx)}px, ${round(dy)}px) scale(${round(s, 4)})`, opacity: 0 },
    ],
  };
}

export const windowMinimizePattern = definePattern<WindowMotionInput>({
  id: 'window-minimize',
  tokens: ['duration.window-minimize', 'duration.base', 'ease.window'],
  spec: (input) => asSpec(windowMinimize({ ...input, reduced: false })),
  reduced: (input) => asSpec(windowMinimize({ ...input, reduced: true })),
  native: {
    duration: durationMs['duration.window-minimize'],
    easing: easeBezier['ease.window'],
    reducedDuration: durationMs['duration.base'],
  },
});
