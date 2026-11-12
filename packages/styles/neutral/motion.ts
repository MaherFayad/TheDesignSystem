// Neutral motion preset (style.json `motionPreset: "fade"`): panels, dialogs
// and windows fade and settle in place over 150 to 180ms on an ease out. The
// token files point duration.base at duration.moderate (150ms) and
// duration.medium at duration.slow (180ms). Nothing grows from the trigger.
// The rows below bring the longer patterns into 150 to 200ms on an ease out.
// Patterns and timing: packages/motion.
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
  },
};

export default motion;
