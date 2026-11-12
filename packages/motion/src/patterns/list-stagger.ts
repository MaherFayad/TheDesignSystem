// list-stagger: items of a list fade and rise in on first paint, each one
// step of delay.stagger after the one before. Steps stop at
// LIST_STAGGER_MAX_STEPS so a long list is never slow to show. Never play it
// on an update or a scroll. Reduced: a fade with no delay.
//
// Text stays readable (order 1.22, lead finding: List failed axe contrast in
// Desk mid stagger): the steps stop at three (Neutral 72ms, Desk 135ms,
// Studio 0ms), and a row is at full opacity by 30% of its run while the rise
// carries the rest, so every row reads at full contrast within about 200ms.
import { definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { space } from './values';

/** Items after this index start together, so the last one waits at most this many steps. */
export const LIST_STAGGER_MAX_STEPS = 3;

export interface ListStaggerInput extends MotionInput {
  /** The item index in the list, from 0. */
  index?: number;
}

export const listStagger = definePattern<ListStaggerInput>({
  id: 'list-stagger',
  tokens: ['duration.slow', 'duration.base', 'ease.reveal', 'ease.out', 'delay.stagger', 'space.s'],
  spec: ({ index = 0 }) => ({
    keyframes: [
      { transform: `translateY(${space('space.s')})`, opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.3 },
      { transform: 'none', opacity: 1, offset: 1 },
    ],
    duration: 'duration.slow',
    easing: 'ease.reveal',
    fill: 'backwards',
    origin: '50% 50%',
    delay: 'delay.stagger',
    delaySteps: Math.min(Math.max(0, Math.floor(index)), LIST_STAGGER_MAX_STEPS),
  }),
  reduced: () => fadeSpec('enter'),
  native: {
    duration: durationMs['duration.slow'],
    easing: easeBezier['ease.reveal'],
    reducedDuration: durationMs['duration.base'],
    step: durationMs['delay.stagger'],
    maxSteps: LIST_STAGGER_MAX_STEPS,
    translateY: spacePx['space.s'],
  },
});
