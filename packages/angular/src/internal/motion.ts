// The motion preset of the active style, read at play time: the Angular twin
// of React's useMotion (packages/react/src/internal/motion.ts). A style
// names its preset in style.json (`motionPreset`) and exports it from
// `packages/styles/<id>/motion.ts`; the nearest dsTheme gives the style data
// and this file maps the preset id to the preset. Components play catalog
// patterns and the primitives of order 1.22 through `injectMotion()`, so a
// style may tune or turn off every interaction with no change in the
// component, and timing and reduced motion behave as in React.
//
// - Reduced motion is read when a pattern plays, never cached: the system
//   setting (`prefers-reduced-motion`) and the page setting
//   (`data-motion="reduce"` on <html>) both give mode `reduced`.
// - Nothing here waits on `transitionend` or `animationend`. Await
//   `settled(animation)` from @the-system/motion when a step must follow.
// - No zone: callers play from effects, `afterRenderEffect` or DOM events,
//   so timing never depends on change detection.
import { inject, type Signal, computed } from '@angular/core';
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
import { DsThemeService } from '../theme/theme';

const presets: Readonly<Record<string, StyleMotionPreset>> = {
  [desk.id]: desk,
  [neutral.id]: neutral,
  [studio.id]: studio,
};

/** The preset for a style.json `motionPreset` id. An unknown id plays every pattern in full. */
export function motionPresetFor(id: string | undefined): StyleMotionPreset {
  return (id && presets[id]) || { id: id ?? 'full', window: 'fade' };
}

/** Input for one pattern, as its `animate` helper takes it, without the options the player fills. */
export type PatternInput<P extends PatternId> = Omit<NonNullable<Parameters<(typeof catalog)[P]['animate']>[1]>, keyof AnimateOptions>;

export interface DsMotionApi {
  /** The style's preset, as a signal. */
  readonly style: Signal<StyleMotionPreset>;
  /** How the style plays an interaction, by id: full, reduced or none. Reduced motion of the person wins. */
  mode(interaction: string): PatternMode;
  /**
   * Plays a catalog pattern on `el` for an interaction, with the style's
   * timing. Returns the Animation, or null when nothing plays.
   */
  play<P extends PatternId>(el: Element | null | undefined, pattern: P, interaction: string, input?: PatternInput<P>): Animation | null;
}

/** The pure player for a preset getter: shared by injectMotion and the tests. */
export function motionApi(style: Signal<StyleMotionPreset>): DsMotionApi {
  const mode = (interaction: string): PatternMode => {
    const m = interactionMode(style(), interaction);
    if (m === 'none') return 'none';
    return prefersReducedMotion() ? 'reduced' : m;
  };
  const play = <P extends PatternId>(el: Element | null | undefined, pattern: P, interaction: string, input?: PatternInput<P>): Animation | null => {
    if (!el) return null;
    const m = mode(interaction);
    if (m === 'none') return null;
    const base: PatternPreset = patternPreset(style(), pattern);
    const preset: PatternPreset = m === 'reduced' ? { mode: 'reduced' } : { ...base, mode: base.mode === 'none' ? 'none' : base.mode };
    const animate = catalog[pattern].animate as (el: Element, opts?: object) => Animation | null;
    return animate(el, { ...(input ?? {}), preset });
  };
  return { style, mode, play };
}

/** The active style's motion preset and a player that respects it. Call in an injection context. */
export function injectMotion(): DsMotionApi {
  const theme = inject(DsThemeService);
  return motionApi(computed(() => motionPresetFor(theme.value().styleData.motionPreset)));
}
