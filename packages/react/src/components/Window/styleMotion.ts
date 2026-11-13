// The window motion of the active style. A style pack names its preset in
// style.json (`motionPreset`) and exports it from `motion.ts`; the Theme
// does not carry presets yet, so this small map reads them by preset id.
// Add a row when a style pack adds a motion.ts.
//
// Order 1.29: Neutral and Liquid have rows (their windows only faded, as an
// unknown id does), and `windowMotionPreset` gives Window.tsx the style's
// preset row for a pattern, so `animateWindow` plays the style's own timing
// (Studio's windows land on its stepped ease.spring-bouncy).
import { patternPreset, type PatternPreset, type StyleMotionPreset, type WindowMotionMode, type WindowPattern } from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import liquid from '@the-system/styles/liquid/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';

const presets: Readonly<Record<string, StyleMotionPreset>> = {
  [desk.id]: desk,
  [liquid.id]: liquid,
  [neutral.id]: neutral,
  [studio.id]: studio,
};

/** The window mode for a style.json `motionPreset` id. Unknown ids fade. */
export function windowMotionMode(presetId: string): WindowMotionMode {
  return presets[presetId]?.window ?? 'fade';
}

/** The catalog pattern whose preset row times a window pattern: close is the exit of window-grow. */
const rowOf = {
  grow: 'window-grow',
  close: 'window-grow',
  zoom: 'window-zoom',
  minimize: 'window-minimize',
} as const satisfies Record<WindowPattern, string>;

/**
 * The style's preset row for a window pattern, to pass to `animateWindow`
 * as `preset`. Undefined for an unknown id (the pattern's own timing).
 */
export function windowMotionPreset(presetId: string, pattern: WindowPattern): PatternPreset | undefined {
  const style = presets[presetId];
  return style ? patternPreset(style, rowOf[pattern]) : undefined;
}
