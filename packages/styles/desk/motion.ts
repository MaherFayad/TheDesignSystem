// Desk motion preset (style.json `motionPreset: "window"`): windows grow out
// of the control that opened them, close back into it, zoom with a FLIP and
// fall into the dock on minimize; numbers roll; every other pattern plays its
// full form. Patterns and timing: packages/motion.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'window',
  window: 'grow',
  patterns: {
    'number-roll': { mode: 'full' },
  },
};

export default motion;
