# Lane 5B, progress: Spinner, ProgressBar, ProgressCircle, Meter

Branch `claude/ds-lane-5b`, built on `claude/relaxed-hypatia-7gseap`. One
commit per component: `wo-1.5.9: Spinner`, `wo-1.5.5: ProgressBar`,
`wo-1.5.6: ProgressCircle`, `wo-1.5.7: Meter`. Review fixes for a component
ride in the next component's commit (the commit bodies say which), and the
last review lands in a closing commit with this report.

Baseline before any change: `npm run check` green.

Proof for every component: unit tests, `npm run check` green,
`npm run contract -- --framework react --component Spinner,ProgressBar,ProgressCircle,Meter`
green (20 passed, 1 skipped each: the keyboard map is skipped because none of
them has keys or a disabled root). Screenshots of `/c/<slug>?chrome=0` in
studio dark, studio light, desk dark, desk light and desk dark rtl in
`docs/reports/shots/wave-1/<slug>/`, taken with reduced motion on so the
loops stand still and the shots are deterministic.

Sources: GoBanana could not be attached in this session (the add_repo call
was refused), so `.st-spinner` and `.adm-meter` were not read. Spinner is
built from Button's `spinner` part (which came from `.st-spinner`); Meter
from ProgressBar and the HTML meter element. Each manifest or file header
says so. Figma-Killer-2 is not named by any of these orders and was not
cloned.

## 1.5.9 Spinner

Built: `packages/react/src/components/Spinner/`, `Spinner.css`,
`Spinner.manifest.json`. A ring drawn as the root's own border (track in
`color.bg.overlay-20`, one quarter in the arc color) that turns with
`transform: rotate` on `duration.spin`. Anatomy: root, `label` (visually
hidden).

```ts
type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';        // 12, 16, 24, 36 px. Default md.
  tone?: 'neutral' | 'accent';             // Default neutral.
  ref?: Ref<HTMLSpanElement>;
} & (
  | { label: string; decorative?: false }   // role="status", hidden label
  | { decorative: true; label?: undefined } // aria-hidden, no label
) & Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children' | 'role'>;
```

Decisions:
- `label` is required unless `decorative` (rule 7, icon only exception),
  enforced by a TypeScript union. No English default, so Arabic screens never
  get "Loading" by accident.
- Turns clockwise in both directions: a spinner is a clock, clocks do not
  mirror (PLAN 12).
- Reduced motion: `animation: none`, the still ring with its arc stays, the
  label is still read. Forced colors: `forced-color-adjust: none` with
  GrayText ring and CanvasText arc, so the arc stays visible.
- Motion pattern `spinner` (from the 1.11 list; the catalog is not merged).

Button, as the order asks: yes, Button should render Spinner as its
`spinner` part. Exact change:
- `packages/react/src/components/Button/ButtonBase.tsx` line 69, before:
  `<span data-part="spinner" aria-hidden="true" />`
  after: `<Spinner decorative size="xs" data-part="spinner" />` with
  `import { Spinner } from '../Spinner';`
- `packages/css/src/components/Button.css` lines 122 to 133, the
  `> [data-part='spinner']` rule: keep `position`, `inset` and `margin`;
  replace the border, radius, size and animation declarations with
  `--_spinner-arc: currentColor;` (Spinner xs is already `size.icon.sm` with
  a `border.width.strong` ring in `color.bg.overlay-20`, the same values).
  Delete `@keyframes ds-button-spin` and the reduced motion rule at line 415
  (Spinner.css has its own).
- Button manifest anatomy keeps `spinner`; its a11y notes can say the part is
  a decorative Spinner. The Angular Button needs the same change.

Review (fresh eyes, no blockers, 14 notes). Fixed: honest announce wording (a
status region inserted with its text is not announced by every reader),
`aria-hidden` honored only on the decorative form, manifest `label` not
required and the slot entry removed, insteadUse keys aligned with avoidWhen,
a 2.2.2 note. Left open: the lg size and stroke use token times 1.5 (token
gap below); in Studio the accent tone looks the same as neutral (Studio has
a neutral primary; a style decision); private names `--_spinner-arc` and
`-track` are outside the rule 1 starter list.

## 1.5.5 ProgressBar

Built: `packages/react/src/components/ProgressBar/` (with `format.ts`),
`ProgressBar.css`, `ProgressBar.manifest.json`. Radix Progress root with the
label, the value text and the track inside. Anatomy: root, `label`, `value`,
`track`, `indicator`. `data-state` is Radix's: `loading`, `complete`,
`indeterminate`.

```ts
interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  value?: number | null;          // null or undefined: indeterminate. Clamped to [0, max].
  max?: number;                   // Default 100.
  label?: ReactNode;              // Visible; labels the bar (aria-labelledby). Else pass aria-label.
  showValue?: boolean;            // Default true.
  valueText?: (value: number, max: number) => string; // Visible value and aria-valuetext.
  loadingLabel?: string;          // Default "Loading", "جار التحميل" under lang ar.
  size?: 'sm' | 'md' | 'lg';      // Track 4, 8, 12 px. Default md.
  tone?: 'accent' | 'success' | 'warning' | 'danger'; // Default accent.
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:
- The indicator spans the track and moves with `transform: scaleX(fraction)`;
  `transform-origin` is `0 50%`, and `100% 50%` under `:dir(rtl)`.
- Indeterminate slides a 40% segment (own LTR and RTL keyframes, on
  `duration.shimmer`). Under reduced motion it stops as a full track at
  `opacity.disabled` and the value text says Loading.
- Percent values round down, so an unfinished task never shows 100%.
- The value column takes at most half the row and wraps past it
  (`fit-content(50%)`), so a long value never squeezes the label; the value
  is `unicode-bidi: plaintext` so "3 of 10 files" reads right on an Arabic
  page.
- `number.ts` does not exist yet (it belongs to NumberField, batch 2), so
  `ProgressBar/format.ts` formats with `Intl.NumberFormat` and
  `numberingSystem: 'latn'` (Western digits). ProgressCircle and Meter import
  it. Swap `formatPercent` and `formatNumber` for `number.ts` when it lands.
- Motion: named `spinner` (the looping busy form) since the 1.11 list has no
  bar pattern.

Review (no blockers, 9 notes). Fixed: rounding down, bidi on the value, an
empty label (`null`, `false`, `''`) no longer makes an `aria-labelledby` to
nothing, Studio styles line corrected, notes for 2.2.2 and for
`showValue={false}` under reduced motion. Left open: no dev warning when a
bar has neither label nor aria-label; the faded stopped bar under reduced
motion is about 2:1 in Desk light (it is a fill, the text carries the state;
see the token gap).

## 1.5.6 ProgressCircle

Built: `packages/react/src/components/ProgressCircle/`,
`ProgressCircle.css`, `ProgressCircle.manifest.json`. Anatomy: root,
`track`, `indicator`, `value`. Same states as ProgressBar.

```ts
interface ProgressCircleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  value?: number | null;
  max?: number;                   // Default 100.
  label: string;                  // Required accessible name (aria-label); never shown.
  showValue?: boolean;            // Default true at md and lg, false at xs and sm.
  valueText?: (value: number, max: number) => string;
  loadingLabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg'; // 16, 24, 44, 68 px. Default md.
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:
- Drawing, as the order asks to name it: a conic gradient mask. Track and
  indicator are round borders on spans; the indicator is cut by
  `mask-image: conic-gradient(currentColor <fraction>turn, transparent 0)`.
  No SVG and no `stroke-dashoffset` (the order said "SVG ring"; CSS masks on
  SVG children are uneven, and the border ring needs no extra parts). A value
  change swaps the mask at once; indeterminate turns a quarter arc with
  `transform: rotate`; under reduced motion it stops as a still quarter arc
  in the full tone color (a faded ring fell below 3:1).
- Fills clockwise from 12 o'clock in both directions (a clock face).
- md is 44 px (`size.control.lg`), not the 32 px control md of rule 12: a
  percent must fit inside. lg is `size.control.lg + size.icon.lg` (68 px).
- `label` is a required accessible name, never visible: the order's anatomy
  has no label part (rule 7, icon only exception).

Review (no blockers, 12 notes). Fixed: reduced motion form (still arc, not a
2:1 faded ring), demo copy (the warning tone was a measure, now "Upload
slowing down" / "بطء الرفع"), the small size value row, a label that repeated
the percent. Left open: the Studio dark track (`overlay-10`) is faint at 0%;
no `-webkit-mask-image` for Chromium before 120 (no browser target in PLAN);
"100%" at md in compact density fits with little room.

## 1.5.7 Meter

Built: `packages/react/src/components/Meter/` (with `level.ts`),
`Meter.css`, `Meter.manifest.json`. Hand built `role="meter"`. Anatomy:
root, `label`, `value`, `track`, `indicator`. `data-level` is `low`,
`medium` or `high`.

```ts
interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'role'> {
  value: number;                  // Clamped to [min, max].
  min?: number;                   // Default 0.
  max?: number;                   // Default 100.
  low?: number;                   // Top of the low region (HTML meter rules).
  high?: number;                  // Bottom of the high region.
  optimum?: number;               // Its region: success; next: warning; far: danger.
  label?: ReactNode;
  valueText?: (value: number, min: number, max: number) => string;
  levelLabels?: Partial<Record<'low' | 'medium' | 'high', string>>; // Default Low, Medium, High; منخفض، متوسط، مرتفع.
  showLevel?: boolean;            // Default true when low or high is set.
  tone?: 'accent' | 'success' | 'warning' | 'danger'; // Override; prefer thresholds.
  size?: 'sm' | 'md' | 'lg';
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:
- Thresholds clamp as in the HTML meter; with no thresholds or no optimum the
  tone is accent and every value is medium.
- The level word follows the value in the visible text and in
  aria-valuetext ("72 GB of 100 GB, Filling up"), with an Arabic comma under
  lang ar. Never color alone.
- `level.ts` is pure logic in the component folder because the order names no
  shared file.
- Motion: `number-roll` names the eased value change until 1.11 has a fill
  pattern.

Review: see the closing commit (the review ran after the Meter commit).

## Token gaps

- No size for a ring bigger than `size.icon.lg`: Spinner lg is
  `calc(size.icon.lg * 1.5)` with a `calc(border.width.strong * 1.5)` stroke,
  ProgressCircle lg is `size.control.lg + size.icon.lg`. Suggest
  `size.icon.xl` (36) and `progress.ring.size.{xs..lg}` with
  `progress.ring.width.*`.
- Track thicknesses borrow `space.fixed.*` (4, 8, 12) and ring widths
  `space.fixed.4xs, 3xs, 2xs, s`. Suggest `progress.track.height.{sm,md,lg}`.
- No "muted" opacity: the stopped indeterminate bar uses `opacity.disabled`,
  which reads as disabled and is about 2:1 in Desk light. Suggest
  `opacity.muted` or a `color.bg.overlay-*` fill for a stopped loop.
- The track `color.bg.overlay-10` is faint on Studio dark; a
  `progress.track.bg` component token would let a style raise it.

## Changes needed from the lead

1. Button renders Spinner as its `spinner` part: the exact change is under
   Spinner above.
2. Contract suite, `packages/contract-tests/src/lib.ts` line 58: valued state
   attributes are only `data-state` and `data-orientation`, so Meter cannot
   list `data-level` in `states` (it would be checked as a boolean). Change
   to `const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-level']);`
   or let a manifest state say `data-level=low|medium|high`. Then add
   `"data-level"` to `Meter.manifest.json` `states`.
3. Move `packages/react/src/components/Meter/level.ts` to
   `packages/shared/src/meter.ts` (with its tests) so Angular uses the same
   rule, and replace `packages/react/src/components/ProgressBar/format.ts`
   with `number.ts` once order 1.2.5 lands. Add both to STATE.md so they are
   not lost.
4. Motion catalog (1.11): a bar pattern for the indeterminate slide and a
   fill pattern for value changes; today ProgressBar and ProgressCircle say
   `spinner` and Meter says `number-roll`.
5. Decide whether rule 12 (md is 32 px) covers non controls: Spinner md is
   24 px and ProgressCircle md 44 px. Log it in DECISIONS.md.

## Could not do

- Read GoBanana (`.st-spinner`, `.adm-meter`): the repository could not be
  attached in this session.
- Screenshots in three densities and the Neutral style: the contract run
  measured all three densities for target size and reflow, but the shot set
  is the five combinations the lane asked for. Neutral (1.10) is not merged.
- Angular and native: planned in each manifest.
