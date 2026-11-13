// Desk motion preset (style.json `motionPreset: "window"`): windows grow out
// of the control that opened them, close back into it, zoom with a FLIP and
// fall into the dock on minimize; numbers roll; every other pattern plays its
// full form. Patterns and timing: packages/motion.
//
// Interactions (order 1.21, proposed): every one plays in full. Labels and
// glyphs that change in answer to an action roll (swap), like the roll labels
// of Desk controls, and numbers roll.
//
// Order 1.22 (proposed): Desk's character lives in its motion tokens. Its
// springs overshoot most (the bouncy spring passes its target by a fifth),
// settle over 300 to 440ms, stagger 45ms a step, pop to 1.14 and enter from
// 0.9, like windows that grow and roll; distances are the longest.
//
// Order 1.28 (proposed): Desk moves in rolls and overshoots that land with a
// playful settle. Every pattern that arrives (a menu, a dialog, a toast, a
// popped badge, a swapped label, a rolled number, the tab indicator, a
// press) runs on the bouncy spring, so it passes its place and comes back.
// Exits stay short and plain (ease.exit), so the bounce is only ever on the
// way in. That is the line against the other styles: Studio cuts in hard
// steps, Neutral eases out quickly with no overshoot, Liquid settles on the
// soft spring and stretches; Desk overshoots and rolls.
import type { StyleMotionPreset } from '@the-system/motion';

const bouncy = { duration: 'duration.spring-bouncy', easing: 'ease.spring-bouncy' } as const;
const out = { duration: 'duration.quick', easing: 'ease.exit' } as const;

const motion: StyleMotionPreset = {
  id: 'window',
  window: 'grow',
  patterns: {
    'menu-scale': { mode: 'full', enter: bouncy, exit: out },
    dialog: { mode: 'full', enter: bouncy, exit: out },
    sheet: { mode: 'full', enter: bouncy, exit: { duration: 'duration.base', easing: 'ease.exit' } },
    toast: { mode: 'full', enter: bouncy, exit: out },
    'tab-indicator': { mode: 'full', ...bouncy },
    press: { mode: 'full', ...bouncy },
    pop: { mode: 'full', duration: 'duration.celebrate', easing: 'ease.spring-bouncy' },
    swap: { mode: 'full', ...bouncy },
    'number-roll': { mode: 'full', ...bouncy },
    'drag-drop': { mode: 'full', easing: 'ease.spring-bouncy' },
  },
};

export default motion;
