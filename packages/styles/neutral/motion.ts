// Neutral motion preset (style.json `motionPreset: "fade"`): panels, dialogs
// and windows fade and settle in place over 150 to 180ms on an ease out. The
// token files point duration.base at duration.moderate (150ms) and
// duration.medium at duration.slow (180ms). Nothing grows from the trigger.
// Patterns and timing: packages/motion.
import type { StyleMotionPreset } from '@the-system/motion';

const motion: StyleMotionPreset = { id: 'fade', window: 'fade' };

export default motion;
