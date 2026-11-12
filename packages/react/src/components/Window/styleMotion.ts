// The window motion mode of the active style. A style pack names its preset
// in style.json (`motionPreset`) and exports it from `motion.ts`; the Theme
// does not carry presets yet, so this small map reads them by preset id.
// Add a row when a style pack adds a motion.ts.
import type { WindowMotionMode } from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import studio from '@the-system/styles/studio/motion';

const presets: Readonly<Record<string, WindowMotionMode>> = {
  [desk.id]: desk.window,
  [studio.id]: studio.window,
};

/** The window mode for a style.json `motionPreset` id. Unknown ids fade, like Studio. */
export function windowMotionMode(presetId: string): WindowMotionMode {
  return presets[presetId] ?? 'fade';
}
