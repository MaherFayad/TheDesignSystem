// Neutral motion preset (style.json `motionPreset: "fade"`): panels, dialogs
// and windows fade and settle in place over 150 to 180ms on an ease out. The
// token files point duration.base at duration.moderate (150ms) and
// duration.medium at duration.slow (180ms). Nothing grows from the trigger.
// The rows below bring the longer patterns into 150 to 200ms on an ease out.
// Patterns and timing: packages/motion.
//
// Interactions (order 1.21, proposed): the patterns they play keep to 150 to
// 200ms on an ease out. A field error shakes over duration.slow (180ms), not
// duration.roll; marks land on ease.out; the list stagger, which would run
// past 200ms, is a plain fade.
//
// Order 1.24 (proposed): Neutral never overshoots. All three springs take
// the critically damped curve and settle in 160 to 200ms; a pop goes to
// 1.02, surfaces grow from 0.98 and rise 4px, with a 24ms stagger step. The
// rows above keep the catalog patterns on ease out.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'fade',
  window: 'fade',
  patterns: {
    'number-roll': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'chart-draw': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
    'menu-scale': { mode: 'full', enter: { easing: 'ease.out' }, exit: { duration: 'duration.base' } },
    sheet: { mode: 'full', enter: { easing: 'ease.out' } },
    'drag-drop': { mode: 'full', easing: 'ease.out' },
    'accordion-height': { mode: 'full', enter: { easing: 'ease.out' } },
    'tab-indicator': { mode: 'full', easing: 'ease.out' },
    dialog: { mode: 'full', enter: { easing: 'ease.out' } },
    'list-stagger': { mode: 'reduced' },
    swap: { mode: 'full', easing: 'ease.out' },
    pop: { mode: 'full', duration: 'duration.base', easing: 'ease.out' },
    shake: { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
  },
};

export default motion;
