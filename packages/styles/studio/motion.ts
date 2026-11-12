// Studio motion preset (style.json `motionPreset: "flat"`): flat and fast,
// 70 to 220ms. Panels and windows appear with a short opacity fade, nothing
// grows or flies, zoom has no motion, numbers change in place and long
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
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'flat',
  window: 'fade',
  patterns: {
    sheet: { mode: 'full', duration: 'duration.base' },
    'number-roll': { mode: 'reduced' },
    'list-stagger': { mode: 'reduced' },
    'chart-draw': { mode: 'full', duration: 'duration.zoom' },
    'drag-drop': { mode: 'full', duration: 'duration.base' },
    pop: { mode: 'reduced' },
  },
  interactions: {
    'error-shake': 'none',
    'field-step': 'reduced',
  },
};

export default motion;
