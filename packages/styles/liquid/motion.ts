// Liquid motion preset (style.json `motionPreset: "spring"`): everything that
// moves rides a spring. The three spring tokens of the style are written as
// CSS linear() curves (ease.spring-soft, -snappy, -bouncy) with their settle
// times (duration.spring-*), so CSS, the Web Animations API and native play
// the same motion:
//
//   soft    stiffness 400, damping 40: no overshoot, about 375ms. Sheets,
//           dialogs, panels that travel, accordions, toasts, the switch and
//           slider lenses, checks and radios, the lit row's lens.
//   snappy  stiffness 600, damping 39: a 2% overshoot, about 300ms. Tab and
//           segment indicators, menus, a press that answers.
//   bouncy  stiffness 340, damping 22: about 10% overshoot, about 500ms.
//           Kept for the base beats Liquid does not retune; its own recipes
//           no longer use it.
//
// Controls sink to scale.press (0.96) under the finger and spring back.
// Glass panels grow out of their trigger from scale.menu-enter (0.9) and
// scale.dialog-enter (0.94). Shapes that merge (toasts, the selected segment)
// play the merge spring of the base tokens through ease.spring-soft.
//
// Order 1.28 (proposed): Liquid moves by soft springs, stretch and merge,
// not by overshoot. A toast, a lens or a mark glides in on the soft spring
// and settles with no bounce; a pop takes the snappy spring's 2%. What sets
// Liquid apart is shape: thumbs and lenses stretch toward their travel and
// swell while held, popovers unfold out of their trigger along one axis,
// toasts pool into one glass stack and the lit row's lens glides between
// rows. Studio cuts in hard steps, Desk rolls with overshoot, Neutral is
// quick and plain.
//
// Under reduced motion every duration token is 0ms and every pattern plays its
// reduced form: an opacity fade or nothing. No spring, no scale, no travel.
// Patterns and timing: packages/motion.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'spring',
  window: 'grow',
  patterns: {
    'fade-rise': { mode: 'full', duration: 'duration.spring-soft', easing: 'ease.spring-soft' },
    'menu-scale': { mode: 'full', enter: { duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' }, exit: { duration: 'duration.quick', easing: 'ease.exit' } },
    dialog: { mode: 'full', enter: { duration: 'duration.spring-soft', easing: 'ease.spring-soft' }, exit: { duration: 'duration.base', easing: 'ease.exit' } },
    sheet: { mode: 'full', enter: { duration: 'duration.spring-soft', easing: 'ease.spring-soft' }, exit: { duration: 'duration.medium', easing: 'ease.exit' } },
    toast: { mode: 'full', enter: { duration: 'duration.spring-soft', easing: 'ease.spring-soft' }, exit: { duration: 'duration.base', easing: 'ease.exit' } },
    'accordion-height': { mode: 'full', enter: { duration: 'duration.spring-soft', easing: 'ease.spring-soft' } },
    'tab-indicator': { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    'drag-drop': { mode: 'full', easing: 'ease.spring-snappy' },
    press: { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    pop: { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    swap: { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    'number-roll': { mode: 'full', duration: 'duration.spring-soft', easing: 'ease.spring-soft' },
  },
};

export default motion;
