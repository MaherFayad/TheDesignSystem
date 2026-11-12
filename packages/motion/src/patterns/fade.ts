// fade: a plain opacity change, with no travel. For a state indicator that
// appears or leaves in place: a checkbox or radio mark, the focus glow of a
// field, a field error, an icon that shows on hover. Exit plays it backward
// and holds the last frame. The timing is the one the controls already use
// in their CSS (duration.base on ease.default). The reduced form is the same
// fade: it holds no motion, and under reduced motion the duration token is
// 0ms on the web, so the change is instant there.
import { byPhase, definePattern, fadeIn, type MotionInput, type MotionSpec, type MotionPhase } from '../core';
import { durationMs, easeBezier } from '../tokens';

function fadeOnly(phase: MotionPhase | undefined): MotionSpec {
  return {
    keyframes: byPhase(phase, [...fadeIn]),
    duration: 'duration.base',
    easing: 'ease.default',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 50%',
  };
}

export const fade = definePattern<MotionInput>({
  id: 'fade',
  tokens: ['duration.base', 'ease.default'],
  spec: ({ phase }) => fadeOnly(phase),
  reduced: ({ phase }) => fadeOnly(phase),
  native: {
    duration: durationMs['duration.base'],
    easing: easeBezier['ease.default'],
    reducedDuration: durationMs['duration.base'],
  },
});
