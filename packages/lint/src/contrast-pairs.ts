// The contrast pairs the ds/contrast gate measures in every style and scheme.
// Data only: a new style is covered the moment its token files exist.
//
// Ported from GoBanana `banana-server/tests/design-tokens.test.ts` (the pair
// list there names GoBanana's `--st-*` tokens; here they are the semantic
// names of packages/tokens/src/contract.json).
//
// Layer syntax: `a over b over c` paints `a` on `b` on `c`. The bottom token
// must be opaque. Translucent tokens above it are composited in sRGB.
// - `$bg` in a foreground stands for the background of the same pair, for a
//   translucent border or ring drawn on the surface it is measured against.
// - `$backdrop` stands for what shows through a glass material: the darkest
//   and the brightest of `backdrops` in that mode, so glass is tested over
//   its worst case at both ends (PLAN.md 3.7, rules for glass).
//
// A pair group expands to every foreground times every background.

export interface PairGroup {
  /** Where the pair occurs. Printed with every result. */
  use: string;
  fg: readonly string[];
  bg: readonly string[];
  /** 4.5 for text (SC 1.4.3), 3 for boundaries, rings and fills (SC 1.4.11). */
  min: 3 | 4.5;
  /** True when one foreground passing is enough, for example one of two focus rings. */
  any?: boolean;
  /** Limit to these schemes. Leave out for every scheme. */
  schemes?: readonly string[];
  /** Limit to these styles. Leave out for every style. Prefer schemes or nothing. */
  styles?: readonly string[];
}

/** A failing pair the lead knows about. The gate prints it and passes, and fails once it passes (stale). */
export interface KnownFailure {
  /** `<style>.<scheme>` */
  mode: string;
  fg: string;
  bg: string;
  reason: string;
}

export interface ContrastData {
  /** Opaque layers glass can sit over. The gate uses the darkest and the brightest per mode. */
  backdrops: readonly string[];
  groups: readonly PairGroup[];
  knownFailures: readonly KnownFailure[];
}

const SURFACES = ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2', 'color.bg.surface-3', 'color.bg.surface-4', 'color.bg.surface-5'] as const;

/** Surfaces a control or a button sits on (GoBanana SURFACES: body to surface-3). */
const CONTROL_SURFACES = ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2', 'color.bg.surface-3'] as const;

/** Glass materials that carry text, each over the backdrop. Styles without glass fill them with solid surfaces. */
const GLASS = [
  'color.material.glass over $backdrop',
  'color.material.glass-strong over $backdrop',
  'color.material.glass-flat over $backdrop',
  'color.material.glass-tinted over $backdrop',
  'color.material.dock over $backdrop',
  'color.material.menubar over $backdrop',
  'color.material.titlebar over color.material.glass over $backdrop',
  'color.material.glass-solid',
] as const;

const STATES = ['danger', 'warning', 'success', 'info'] as const;

const PRIMARY_FILLS = ['color.primary.fill', 'color.primary.fill-hover', 'color.primary.fill-pressed'] as const;

const over = (tops: readonly string[], unders: readonly string[]): string[] => tops.flatMap((t) => unders.map((u) => `${t} over ${u}`));

export const CONTRAST_PAIRS: ContrastData = {
  backdrops: [...SURFACES],

  groups: [
    // Text, 4.5:1.
    {
      use: 'body and label text',
      fg: ['color.text.bright', 'color.text.default'],
      bg: [...SURFACES, 'color.material.glass-solid'],
      min: 4.5,
    },
    // Narrowed: GoBanana's pair list puts muted and dim text on body to
    // surface-3 only. surface-4 and surface-5 are the active and hover fills
    // of buttons and rows (GB canvas.css `--st-btn-bg-active`), which carry
    // default or bright text.
    {
      use: 'secondary text, links, two tone heading first line',
      fg: ['color.text.muted', 'color.text.dim', 'color.text.link'],
      bg: [...CONTROL_SURFACES, 'color.material.glass-solid'],
      min: 4.5,
    },
    // Narrowed: GoBanana tests captions and meta on body, surface and
    // surface-2 only. Subtle text stays off menus (surface-3) and fills.
    { use: 'captions and meta', fg: ['color.text.subtle'], bg: ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2', 'color.material.glass-solid'], min: 4.5 },
    { use: 'input placeholder (the source keeps it at 4.5:1)', fg: ['color.text.placeholder'], bg: ['color.bg.surface', 'color.bg.surface-2'], min: 4.5 },
    {
      use: 'text on glass over its darkest and brightest backdrop',
      fg: ['color.text.bright', 'color.text.default', 'color.text.muted', 'color.text.subtle', 'color.text.dim', 'color.text.link'],
      bg: GLASS,
      min: 4.5,
    },
    {
      use: 'body text on a hovered row in a glass window',
      fg: ['color.text.default', 'color.text.muted'],
      bg: ['color.material.glass-hover over color.material.glass over $backdrop'],
      min: 4.5,
    },
    {
      use: 'primary button label',
      fg: ['color.text.on-primary'],
      bg: over(PRIMARY_FILLS, CONTROL_SURFACES),
      min: 4.5,
    },
    {
      use: 'label on an accent fill',
      fg: ['color.text.on-accent'],
      bg: Array.from({ length: 10 }, (_, i) => `color.accent.${i + 1}`),
      min: 4.5,
    },
    {
      use: 'identity label text',
      fg: Array.from({ length: 10 }, (_, i) => `color.accent.${i + 1}`),
      bg: ['color.bg.surface-2'],
      min: 4.5,
    },
    ...STATES.map(
      (s): PairGroup => ({
        use: `${s} text on a plain surface`,
        fg: [`color.state.${s}.text`],
        bg: ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2', 'color.bg.surface-3'],
        min: 4.5,
      }),
    ),
    // Narrowed: on a tint the source sets the on-tint tone (alerts, chips,
    // destructive hover). The plain text tone sits on a tint only in the
    // destructive button at rest (danger on danger tint-10).
    ...STATES.map(
      (s): PairGroup => ({
        use: `${s} text on its tint (alerts, chips)`,
        fg: [`color.state.${s}.on-tint`],
        bg: over([`color.state.${s}.tint-10`, `color.state.${s}.tint-20`], ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2']),
        min: 4.5,
      }),
    ),
    ...STATES.map(
      (s): PairGroup => ({
        use: `${s} solid button label`,
        fg: [`color.state.${s}.on-solid`],
        bg: [`color.state.${s}.solid`, `color.state.${s}.solid-hover`],
        min: 4.5,
      }),
    ),
    {
      use: 'primary as text and icon colour on a surface',
      fg: ['color.primary.on-surface'],
      bg: CONTROL_SURFACES,
      min: 4.5,
    },
    {
      use: 'text on the soft primary fill (emphasis soft)',
      fg: ['color.text.default', 'color.primary.on-surface'],
      bg: over(['color.primary.tint', 'color.primary.tint-hover'], ['color.bg.body', 'color.bg.surface']),
      min: 4.5,
    },
    {
      use: 'destructive button label at rest',
      fg: ['color.state.danger.text'],
      bg: over(['color.state.danger.tint-10'], ['color.bg.surface', 'color.bg.surface-2']),
      min: 4.5,
    },

    // Boundaries, rings and fills, 3:1.
    {
      use: 'input and control boundary',
      fg: ['color.border.control over $bg', 'color.border.control-hover over $bg'],
      bg: [...CONTROL_SURFACES, 'color.material.glass-flat over $backdrop', 'color.material.glass-solid'],
      min: 3,
    },
    {
      use: 'focus ring',
      fg: ['color.focus.ring'],
      bg: [...SURFACES, 'color.material.glass-flat over $backdrop', 'color.material.glass-solid', 'color.focus.halo'],
      min: 3,
    },
    // One of the two rings against the fill: on Desk's yellow the inner ink
    // ring carries it; on Studio's achromatic overlay fill the inner ring is a
    // dark gap and the light outer ring carries it.
    {
      use: 'focus on a primary button, one of the two rings against the fill',
      fg: ['color.focus.ring-on-primary-inner', 'color.focus.ring-on-primary-outer'],
      any: true,
      bg: over(PRIMARY_FILLS, CONTROL_SURFACES),
      min: 3,
    },
    {
      use: 'focus on a primary button, outer ring against the inner ring',
      fg: ['color.focus.ring-on-primary-outer'],
      bg: ['color.focus.ring-on-primary-inner'],
      min: 3,
    },
    {
      use: 'focus on a primary button, one of the two rings against the surface',
      fg: ['color.focus.ring-on-primary-outer', 'color.focus.ring-on-primary-inner'],
      any: true,
      bg: CONTROL_SURFACES,
      min: 3,
    },
    {
      use: 'primary button boundary (border or fill)',
      fg: ['color.primary.border over $bg'],
      bg: CONTROL_SURFACES,
      min: 3,
    },
    ...STATES.map(
      (s): PairGroup => ({
        use: `${s} fill and border (icons, badges, outlines)`,
        fg: [`color.state.${s}.fill`, `color.state.${s}.border`],
        bg: ['color.bg.body', 'color.bg.surface', 'color.bg.surface-2'],
        min: 3,
      }),
    ),
    {
      use: 'scrollbar thumb, at rest and on hover',
      fg: ['scrollbar.thumb over $bg', 'scrollbar.thumb-hover over $bg'],
      bg: SURFACES,
      min: 3,
    },
    {
      use: 'window light glyph on its light',
      fg: ['color.window.light-ink over $bg'],
      bg: ['color.window.light-close', 'color.window.light-min', 'color.window.light-zoom'],
      min: 3,
    },
  ],

  // Desk dark: the regular, tinted and dock glass and the title bar over the
  // brightest window content (surface-5). Over the black desk they pass.
  knownFailures: [
    { mode: 'desk.dark', fg: 'color.text.muted', bg: 'color.material.glass over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.subtle', bg: 'color.material.glass over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.muted', bg: 'color.material.glass-tinted over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.subtle', bg: 'color.material.glass-tinted over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.subtle', bg: 'color.material.dock over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.muted', bg: 'color.material.titlebar over color.material.glass over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.subtle', bg: 'color.material.titlebar over color.material.glass over color.bg.surface-5', reason: 'reported to lead, wave 0' },
    { mode: 'desk.dark', fg: 'color.text.muted', bg: 'color.material.glass-hover over color.material.glass over color.bg.surface-5', reason: 'reported to lead, wave 0' },
  ],
};
