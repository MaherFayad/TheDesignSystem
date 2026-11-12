// accordion-height: a panel opens without animating height. The panel takes
// its new height at once and clips its overflow; the layer inside it (one
// unnamed element that holds the content) slides down from one full layer
// above while it fades in, fully opaque at 60%. The text never scales, so it
// never squashes (note N9 of the catalog review, closed in order 1.21). Exit
// plays it backward. Put the keyframes on the inner layer, never on the
// region that holds the height. Reduced: a fade of the layer.
import { byPhase, definePattern, fadeSpec, type MotionInput } from '../core';
import { durationMs, easeBezier } from '../tokens';

export const accordionHeight = definePattern<MotionInput>({
  id: 'accordion-height',
  tokens: ['duration.slow', 'duration.base', 'ease.standard', 'ease.exit', 'ease.out'],
  spec: ({ phase }) => ({
    keyframes: byPhase(phase, [
      { transform: 'translateY(-100%)', opacity: 0 },
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
    fromTranslateY: -1,
  },
});
