// Liquid motion preset (style.json `motionPreset: "spring"`): everything that
// moves rides a spring. The three spring tokens of the style are written as
// CSS linear() curves (ease.spring-soft, -snappy, -bouncy) with their settle
// times (duration.spring-*), so CSS, the Web Animations API and native play
// the same motion:
//
//   soft    stiffness 400, damping 40: no overshoot, about 375ms. Sheets,
//           dialogs, panels that travel, accordions.
//   snappy  stiffness 600, damping 39: a 2% overshoot, about 300ms. Tab and
//           segment indicators, menus, a press that answers.
//   bouncy  stiffness 340, damping 22: about 10% overshoot, about 500ms. A
//           lens or a thumb that lands, a toast that drops in, a mark.
//
// Controls sink to scale.press (0.96) under the finger and spring back.
// Glass panels grow out of their trigger from scale.menu-enter (0.9) and
// scale.dialog-enter (0.94). Shapes that merge (toasts, the selected segment)
// play the merge spring of the base tokens through ease.spring-soft.
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
    toast: { mode: 'full', enter: { duration: 'duration.spring-bouncy', easing: 'ease.spring-bouncy' }, exit: { duration: 'duration.base', easing: 'ease.exit' } },
    'accordion-height': { mode: 'full', enter: { duration: 'duration.spring-soft', easing: 'ease.spring-soft' } },
    'tab-indicator': { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    'drag-drop': { mode: 'full', easing: 'ease.spring-snappy' },
    press: { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    pop: { mode: 'full', duration: 'duration.spring-bouncy', easing: 'ease.spring-bouncy' },
    swap: { mode: 'full', duration: 'duration.spring-snappy', easing: 'ease.spring-snappy' },
    'number-roll': { mode: 'full', duration: 'duration.spring-soft', easing: 'ease.spring-soft' },
  },
};

export default motion;
