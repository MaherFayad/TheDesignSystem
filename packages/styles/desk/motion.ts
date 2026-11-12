// Desk motion preset (style.json `motionPreset: "window"`): windows grow out
// of the control that opened them, close back into it, zoom with a FLIP and
// fall into the dock on minimize; numbers roll; every other pattern plays its
// full form. Patterns and timing: packages/motion.
//
// Interactions (order 1.21, proposed): every one plays in full. Labels and
// glyphs that change in answer to an action roll (swap), like the roll labels
// of Desk controls, and numbers roll.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'window',
  window: 'grow',
  patterns: {
    'number-roll': { mode: 'full' },
    swap: { mode: 'full' },
    // Held at the reduced form (a short fade) until the contract suite waits
    // for first paint motion before its axe step; see order 1.21's report,
    // "Changes needed from the lead". The full stagger is the proposal.
    'list-stagger': { mode: 'reduced' },
  },
};

export default motion;
