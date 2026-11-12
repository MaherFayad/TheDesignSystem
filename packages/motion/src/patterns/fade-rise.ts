// fade-rise: a part fades in while it rises a few px into place. The default
// enter for content that appears in the page (a field hint, a revealed row).
// Exit plays it backward. Reduced: a fade.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier, spacePx } from '../tokens';
import { space } from './values';

export const fadeRise = definePattern<MotionInput>({
  id: 'fade-rise',
  tokens: ['duration.base', 'ease.out', 'ease.exit', 'space.xs'],
  spec: ({ phase }) => ({
    keyframes: byPhase(phase, [
      { transform: `translateY(${space('space.xs')})`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ]),
    duration: 'duration.base',
    easing: phase === 'exit' ? 'ease.exit' : 'ease.out',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 50%',
  }),
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.base'],
    easing: easeBezier['ease.out'],
    reducedDuration: durationMs['duration.base'],
    translateY: spacePx['space.xs'],
  },
});
