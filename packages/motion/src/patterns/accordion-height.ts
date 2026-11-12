// accordion-height: a panel opens without animating height. The panel
// takes its new height at once and its clip, an inner wrapper with
// overflow hidden, scales in on the block axis from the top while it fades
// in; exit plays it backward. Put the keyframes on the clip, never on the
// region that holds the height. Reduced: a fade of the clip.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier } from '../tokens';

export const accordionHeight = definePattern<MotionInput>({
  id: 'accordion-height',
  tokens: ['duration.slow', 'duration.base', 'ease.standard', 'ease.exit', 'ease.out'],
  spec: ({ phase }) => ({
    keyframes: byPhase(phase, [
      { transform: 'scaleY(0)', opacity: 0 },
      { opacity: 1, offset: 0.6 },
      { transform: 'none', opacity: 1 },
    ]),
    duration: 'duration.slow',
    easing: phase === 'exit' ? 'ease.exit' : 'ease.standard',
    fill: phase === 'exit' ? 'forwards' : 'none',
    origin: '50% 0',
  }),
  reduced: ({ phase }) => fadeSpec(phase),
  native: {
    duration: durationMs['duration.slow'],
    easing: easeBezier['ease.standard'],
    reducedDuration: durationMs['duration.base'],
    fromScaleY: 0,
  },
});
