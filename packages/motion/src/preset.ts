// Style motion presets. Each style pack exports one from
// `packages/styles/<id>/motion.ts`: it picks, per pattern, the full form,
// the reduced form or nothing, and may swap the duration or ease token. A
// style never adds behavior: a preset only tunes or turns off a pattern.
// Under reduced motion every preset plays the reduced form.
import { PATTERN_IDS, type PatternId, type PatternMode, type PatternPreset } from './core';

/**
 * How a style moves its windows (kept for Window.tsx):
 * - `grow`: open grows out of the trigger, close shrinks back into it, zoom
 *   is a FLIP, minimize falls into the dock (Desk).
 * - `fade`: a short opacity fade on open, close and minimize, no zoom motion
 *   (Studio: flat).
 * - `none`: no window motion at all.
 */
export type WindowMotionMode = 'grow' | 'fade' | 'none';

export interface StyleMotionPreset {
  /** The preset id, equal to `motionPreset` in the style's style.json. */
  id: string;
  window: WindowMotionMode;
  /** Per pattern choices. A pattern left out plays its full form. */
  patterns?: Partial<Record<PatternId, PatternPreset>>;
  /**
   * Per interaction choices (order 1.21), by interaction id from
   * `interactions.ts`. An interaction left out follows its pattern's mode.
   * A style may tune an interaction (through its pattern row) or turn it off
   * here; it never adds one.
   */
  interactions?: Partial<Record<string, PatternMode>>;
}

/** The window mode as the preset of the three window patterns. */
function windowPreset(mode: WindowMotionMode): Partial<Record<PatternId, PatternPreset>> {
  const m: PatternPreset['mode'] = mode === 'grow' ? 'full' : mode === 'fade' ? 'reduced' : 'none';
  return {
    'window-grow': { mode: m },
    'window-minimize': { mode: m },
    'window-zoom': { mode: mode === 'grow' ? 'full' : 'none' },
  };
}

/** The preset of one pattern in a style: its own row, else the window mode, else the full form. */
export function patternPreset(style: StyleMotionPreset, id: PatternId): PatternPreset {
  return style.patterns?.[id] ?? windowPreset(style.window)[id] ?? { mode: 'full' };
}

/** Every pattern with its preset, for a gallery or a check. */
export function resolvePreset(style: StyleMotionPreset): Record<PatternId, PatternPreset> {
  return Object.fromEntries(PATTERN_IDS.map((id) => [id, patternPreset(style, id)])) as Record<PatternId, PatternPreset>;
}
