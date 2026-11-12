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
  },
};

export default motion;
