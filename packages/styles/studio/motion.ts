// Studio motion preset (style.json `motionPreset: "flat"`): flat and fast,
// 70 to 220ms. Panels appear with a short opacity fade, nothing grows or
// flies (windows since order 1.28 land in steps, below), numbers change in place and long
// reveals are cut to the short end of the scale. Patterns and timing:
// packages/motion. A pattern left out plays its full form.
//
// Interactions (order 1.21, proposed): presses, swaps and slides stay, since
// they answer an action at once; marks land in place without a pop, a field
// error does not shake (its color and message carry it), and numbers change
// in place. CSS interactions follow the tokens; a row of `none` or
// `reduced` turns their motion off through the recipe in packages/motion.
//
// Order 1.22 (proposed): Studio's character lives in its motion tokens. Its
// spring eases are steps (`ease.spring-snappy` is two steps, `-bouncy` three)
// and a plain curve (`-soft`), so moves land in hard cuts; its stagger step is
// 0ms, so parts arrive together; `scale.pop` is 1 and `scale.enter` 1, so
// nothing overshoots or grows; distances are the shortest of the three.
//
// Order 1.28 (proposed): windows no longer only fade. They grow out of the
// control that opened them, zoom and fall into the dock as the other styles
// do, but on `ease.spring-bouncy`, which is three hard steps here: the
// window lands in three cuts, with no ease and no overshoot, and the settle
// swell is gone because `scale.lift` is 1. (`ease.window` must stay a
// cubic bezier by the token contract, so the window rows swap the ease.)
// The same press, toggle and open read as cuts in Studio, as rolls past the
// end in Desk, as short restrained springs in Neutral and as soft
// stretching springs in Liquid. Reduced motion still fades (the pattern's
// reduced form).
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'flat',
  window: 'grow',
  patterns: {
    sheet: { mode: 'full', duration: 'duration.base' },
    'number-roll': { mode: 'reduced' },
    'list-stagger': { mode: 'reduced' },
    'chart-draw': { mode: 'full', duration: 'duration.zoom' },
    'drag-drop': { mode: 'full', duration: 'duration.base' },
    pop: { mode: 'reduced' },
    'window-grow': { mode: 'full', easing: 'ease.spring-bouncy' },
    'window-zoom': { mode: 'full', easing: 'ease.spring-bouncy' },
    'window-minimize': { mode: 'full', easing: 'ease.spring-bouncy' },
  },
  interactions: {
    'error-shake': 'none',
    'field-step': 'reduced',
    // Order 1.22 (proposed): Studio's spring eases are steps, so these play in
    // full as hard cuts: a count or a page number flips in two or three steps
    // instead of fading, and the tab bar and dock land in steps with no pop
    // (scale.pop is 1 in Studio).
    'stat-roll': 'full',
    'badge-count': 'full',
    'pagination-roll': 'full',
    'tab-bar-pop': 'full',
    'dock-lift': 'full',
  },
};

export default motion;
