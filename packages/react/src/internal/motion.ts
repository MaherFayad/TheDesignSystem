'use client';
// The motion preset of the active style, read at run time (order 1.21, note
// N15 of the motion catalog review). A style names its preset in style.json
// (`motionPreset`) and exports it from `packages/styles/<id>/motion.ts`; the
// Theme gives the style data, and this file maps the preset id to the preset.
// Components play catalog patterns through `useMotion()` so a style may tune
// or turn off every interaction without a change in the component.
import { useCallback, useMemo } from 'react';
import {
  catalog,
  interactionMode,
  patternPreset,
  prefersReducedMotion,
  type AnimateOptions,
  type PatternId,
  type PatternMode,
  type PatternPreset,
  type StyleMotionPreset,
} from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';
import { useTheme } from '../theme/hooks';

const presets: Readonly<Record<string, StyleMotionPreset>> = {
  [desk.id]: desk,
  [neutral.id]: neutral,
  [studio.id]: studio,
};

/** The preset for a style.json `motionPreset` id. An unknown id plays every pattern in full. */
export function motionPresetFor(id: string | undefined): StyleMotionPreset {
  return (id && presets[id]) || { id: id ?? 'full', window: 'fade' };
}

/** Input for one pattern, as its `animate` helper takes it, without the options `useMotion` fills. */
type PatternInput<P extends PatternId> = Omit<NonNullable<Parameters<(typeof catalog)[P]['animate']>[1]>, keyof AnimateOptions>;

export interface MotionApi {
  /** The style's preset. */
  style: StyleMotionPreset;
  /** How the style plays an interaction, by id: full, reduced or none. Reduced motion of the person wins. */
  mode: (interaction: string) => PatternMode;
  /**
   * Plays a catalog pattern on `el` for an interaction, with the style's
   * timing. Returns the Animation, or null when nothing plays. Never await
   * transitionend or animationend; await `settled(animation)` if needed.
   */
  play: <P extends PatternId>(el: Element | null | undefined, pattern: P, interaction: string, input?: PatternInput<P>) => Animation | null;
}

/** The active style's motion preset and a player that respects it. */
export function useMotion(): MotionApi {
  const { styleData } = useTheme();
  const style = useMemo(() => motionPresetFor(styleData.motionPreset), [styleData]);
  const mode = useCallback(
    (interaction: string): PatternMode => {
      const m = interactionMode(style, interaction);
      if (m === 'none') return 'none';
      return prefersReducedMotion() ? 'reduced' : m;
    },
    [style],
  );
  const play = useCallback(
    <P extends PatternId>(el: Element | null | undefined, pattern: P, interaction: string, input?: PatternInput<P>): Animation | null => {
      if (!el) return null;
      const m = mode(interaction);
      if (m === 'none') return null;
      const base: PatternPreset = patternPreset(style, pattern);
      const preset: PatternPreset = m === 'reduced' ? { mode: 'reduced' } : { ...base, mode: base.mode === 'none' ? 'none' : base.mode };
      const animate = catalog[pattern].animate as (el: Element, opts?: object) => Animation | null;
      return animate(el, { ...(input ?? {}), preset });
    },
    [mode, style],
  );
  return useMemo(() => ({ style, mode, play }), [style, mode, play]);
}
