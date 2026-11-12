// list-stagger: items of a list fade and rise in on first paint, each one
// step of delay.reveal-step after the one before. Steps stop at
// LIST_STAGGER_MAX_STEPS so a long list is never slow to show. Never play it
// on an update or a scroll. Reduced: a fade with no delay.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { space } from './values';

/** Items after this index start together, so the last one waits at most this many steps. */
export const LIST_STAGGER_MAX_STEPS = 8;

export interface ListStaggerInput extends MotionInput {
  /** The item index in the list, from 0. */
  index?: number;
}

export const listStagger = definePattern<ListStaggerInput>({
  id: 'list-stagger',
  tokens: ['duration.slow', 'duration.base', 'ease.reveal', 'ease.out', 'delay.reveal-step', 'space.s'],
  spec: ({ index = 0 }) => ({
    keyframes: [
      { transform: `translateY(${space('space.s')})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    duration: 'duration.slow',
    easing: 'ease.reveal',
    fill: 'backwards',
    origin: '50% 50%',
    delay: 'delay.reveal-step',
    delaySteps: Math.min(Math.max(0, Math.floor(index)), LIST_STAGGER_MAX_STEPS),
  }),
  reduced: () => fadeSpec('enter'),
  native: {
    duration: durationMs['duration.slow'],
    easing: easeBezier['ease.reveal'],
    reducedDuration: durationMs['duration.base'],
    step: durationMs['delay.reveal-step'],
    maxSteps: LIST_STAGGER_MAX_STEPS,
    translateY: spacePx['space.s'],
  },
});
