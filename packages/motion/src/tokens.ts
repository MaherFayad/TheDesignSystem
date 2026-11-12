// The values of the base tokens the catalog reads, as numbers, for the native
// values of each pattern (Reanimated, wave 2) and for the CSS fallbacks in
// the web keyframes. The web reads the live CSS variables first, so a style
// still wins there. tokens.test.ts checks every row against
// packages/tokens/src/base, so a token change that is not copied here fails.

export type Bezier = readonly [number, number, number, number];

/** Duration and delay tokens, in ms. */
export const durationMs = {
  'duration.instant': 70,
  'duration.fast': 80,
  'duration.quick': 100,
  'duration.base': 120,
  'duration.medium': 140,
  'duration.slow': 180,
  'duration.zoom': 220,
  'duration.roll': 300,
  'duration.reveal': 640,
  'duration.shimmer': 1400,
  'duration.spin': 800,
  'duration.toast-enter': 140,
  'duration.toast-exit': 120,
  'duration.window-open': 300,
  'duration.window-close': 220,
  'duration.window-zoom': 280,
  'duration.window-minimize': 320,
  'delay.reveal-step': 80,
} as const;

/** Ease tokens, as cubic bezier points. */
export const easeBezier = {
  'ease.default': [0.25, 0.1, 0.25, 1],
  'ease.out': [0, 0, 0.58, 1],
  'ease.standard': [0.4, 0, 0.2, 1],
  'ease.emphasized': [0.16, 1, 0.3, 1],
  'ease.exit': [0.4, 0, 1, 1],
  'ease.reveal': [0.22, 1, 0.36, 1],
  'ease.window': [0.2, 0.8, 0.2, 1],
} as const satisfies Record<string, Bezier>;

/** Scale tokens. */
export const scaleValue = {
  'scale.dialog-enter': 0.98,
  'scale.window-enter': 0.92,
  'scale.press': 0.97,
} as const;

/**
 * Space tokens the catalog travels by, in px at the large end of their fluid
 * range (the base JSON value). The web uses the live fluid value.
 */
export const spacePx = {
  'space.4xs': 3,
  'space.3xs': 4,
  'space.2xs': 5,
  'space.xs': 6,
  'space.s': 8,
} as const;

export interface Spring {
  stiffness: number;
  damping: number;
  mass: number;
}

/** Spring tokens, for native patterns that settle with a spring. */
export const springValue = {
  'spring.press': { stiffness: 520, damping: 32, mass: 1 },
  'spring.sheet': { stiffness: 300, damping: 30, mass: 1 },
  'spring.merge': { stiffness: 220, damping: 24, mass: 1 },
} as const satisfies Record<string, Spring>;

export type DurationName = keyof typeof durationMs;
export type EaseName = keyof typeof easeBezier;
export type ScaleName = keyof typeof scaleValue;
export type SpaceName = keyof typeof spacePx;
export type SpringName = keyof typeof springValue;
