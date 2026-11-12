// Studio motion preset (style.json `motionPreset: "flat"`): panels appear and
// leave with a short opacity fade on duration.base, nothing grows or flies,
// and zoom has no motion. Patterns and timing: packages/motion.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = { id: 'flat', window: 'fade' };

export default motion;
