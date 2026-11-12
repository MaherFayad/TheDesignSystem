// Studio motion preset (style.json `motionPreset: "flat"`): flat and fast,
// 70 to 220ms. Panels and windows appear with a short opacity fade, nothing
// grows or flies, zoom has no motion, numbers change in place and long
// reveals are cut to the short end of the scale. Patterns and timing:
// packages/motion. A pattern left out plays its full form.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = {
  id: 'flat',
  window: 'fade',
  patterns: {
    sheet: { mode: 'full', duration: 'duration.base' },
    'number-roll': { mode: 'reduced' },
    'list-stagger': { mode: 'full', duration: 'duration.base' },
    'chart-draw': { mode: 'full', duration: 'duration.zoom' },
    'drag-drop': { mode: 'full', duration: 'duration.base' },
  },
};

export default motion;
