# Order 1.29, lane Angular B11 and B12

Porter: ds-angular (claude-opus-5-5, medium). Tree at start: `be25028`,
clean. No commit.

## Summary

Both blockers were already fixed on the current tree by the Angular sync
for round 3 (`a-sync3` commits from `d8448cc` to `fa5192f`, then `8d15dd6`
for the shared motion helpers). The review was cut before that merge. This
lane rechecked both, added one spec for the indeterminate and complete arc,
wrote a probe for the fill and the arc against React, and kept every
manifest at `ready` because its contract run passes. No component code and
no manifest changed.

## B11: Angular Slider, RangeSlider and ProgressCircle

Found on the current tree:

- `packages/angular/src/components/slider/slider-base.ts:452-468` writes
  `--_slider-from`, `--_slider-to`, `--_slider-pull-start` and
  `--_slider-pull-end` on the host in React's order, then calls
  `sliderGlide` from `packages/motion/src/helpers/slider-fill.ts`, the same
  helper React's `SliderBase` calls. RangeSlider uses the same body.
- `packages/angular/src/components/progress-circle/progress-circle.ts:69`
  renders `svg[data-part=arc]` with `circle[pathLength=100]` in the
  indicator in every state, the same DOM as
  `packages/react/src/components/ProgressCircle/ProgressCircle.tsx:109-113`.
- At the baseline `d8448cc` neither was there (0 matches for
  `--_slider-from` and for `data-part="arc"`).

Tests:

- Existing `slider/slider.motion.spec.ts`, "slider-fill: the host carries
  where the fill starts and ends and the pull, in React order" (Slider and
  RangeSlider) plus the glide, nudge and rubber band specs. Fails first:
  with the four `setProperty` lines removed, 4 of 10 fail; restored, 10 of
  10 pass.
- New in `progress-circle/progress-circle.spec.ts`, "B11 (review
  interactions-3): the indicator holds the arc part with a value and when
  indeterminate, as React": the indicator's only child is `svg[arc]`,
  aria-hidden, not focusable, with one `circle` of `pathLength` 100, for a
  value, a small size, indeterminate, value set to null and complete.
  Fails first: with the svg removed from the template, 1 failed, 5 passed;
  restored, all pass.
- Probe `angular-b11-b12.pixel.mjs` (output `angular-b11-b12.pixel.json`):
  `/c/slider`, `/c/range-slider` and `/c/progress-circle`, every demo case,
  Studio, Desk, Neutral and Liquid, light, en ltr and ar rtl, React
  (5185, Vite) against Angular (5186, a static development build of
  `apps/gallery-angular`). The probe takes full page shots as
  `scripts/shots.ts` does and reads each instance's fill properties, the
  computed `clip-path` of the track `::before`, the range paint, and the
  arc's state, box, stroke, dash array, dash offset and transform. Result:
  24 of 24 runs pass with 0 differing pixels and equal values (20 slider,
  17 range slider and 50 progress circle instances per run; arcs seen in
  the loading, complete and indeterminate states).

## B12: Angular anatomy parts

Found on the current tree: every part is rendered, and the same as React.

| Part | Angular file | At `d8448cc` |
| --- | --- | --- |
| Button `result` | `button/button.ts:58` | absent |
| Checkbox `mark` | `checkbox/checkbox.ts:96` | absent |
| ProgressCircle `arc` | `progress-circle/progress-circle.ts:69` | absent |
| RadioCard `badge` | `radio-card/radio-card.ts:231` | absent |
| Switch `thumb-lens` | `switch/switch.ts:104` | absent |
| ToggleButton `state-layer` | `toggle-button/toggle-button.ts:50` | absent |

Existing specs assert each part: `button.round3.spec.ts`,
`checkbox.spec.ts`, `progress-circle-motion.spec.ts` and the new B11 spec,
`radio-card.motion.spec.ts`, `switch.round3.spec.ts` and
`toggle-button-motion.spec.ts`.

Contract runs (`npm run contract -- --framework angular --component
Slider,RangeSlider,ProgressCircle,Button,Checkbox,RadioCard,Switch,ToggleButton`):

- Before (`angular-b11-b12.contract.before.json`, the runner's own
  `ng serve`): anatomy passes in all four styles for all eight components.
  2 failures, Switch axe and ToggleButton target size, both "Execution
  context was destroyed, most likely because of a navigation": the dev
  server reloaded when other lanes saved files. A rerun failed on two other
  axe cases with the same error.
- After (`angular-b11-b12.contract.after.json`, `--url` on a static build
  that cannot reload): 295 passed, 0 failed, 1 skipped (ProgressCircle
  keyboard map: no keys in the manifest). Every component passes.
- The review's old failures (24 anatomy failures) are in
  `docs/reports/reviews/shots/interactions-3/contract.angular.json`.

Manifests: all eight stay `ready` in their `angular` block. Not edited.

## Proof

- `npm run check -w @the-system/angular`: pass, ngc, then 108 test files
  and 724 tests.
- `npm run check` at the end: fails in `vitest` and `check
  @the-system/angular`, from other lanes' unfinished work. The Angular
  failures are the `menu-rows` stagger specs of Select, Autocomplete,
  Combobox, MultiSelect, TagField and `internal/motion-selection.spec.ts`,
  which follow `packages/motion/src/helpers/selection-motion.ts` (being
  edited by another lane). The vitest failures are React tests (Alert
  meter-fill, Button, SegmentedControl, ToggleButton, ToggleGroup) and four
  lint gates. The eight components of this lane pass in that run. The same
  Angular step passed 724 of 724 fifteen minutes earlier.

## What the parity lane must catch up with

Ported DOM: none needed. The Angular DOM of the eight components equals the
React DOM at `be25028`. Since then, other lanes changed, in the working
tree:

- Button: the manifest anatomy gains `hit`, and `ButtonBase.tsx` renders
  `<span data-part="hit" aria-hidden="true" />` (not for chips) and mounts
  the spinner only while it is leaving. `manifests.gen.json` does not have
  `hit` yet. Once `npm run gen` picks it up, the Angular Button anatomy
  check fails on `hit` until it is ported, or until Angular Button is
  marked `planned`. ToggleButton and the rest of the button family go
  through the same base in React.
- Checkbox: `svg[data-part=mark]` gains `data-enter`.
- Switch: the root `data-state` becomes the shown state during a drag
  (`shownState`), and `drag.ts` changed.
- ProgressCircle: the value roll passes `--_progress-circle-duration`.
- CSS changed for Button, Checkbox, RadioCard, Slider and Switch.

## Blocked by the CSS

Nothing.

## Decisions

- No status changed to `planned`: each contract run passes.
- The after contract run and the probe use a static build of the Angular
  gallery (`ng build --configuration development`, served with an index
  fallback) on 5186, because `ng serve` rebuilt and reloaded mid run while
  other lanes saved files.
- The probe retries a capture up to 3 times when a page renders no
  instance, for the same reason (the React dev server once rendered an
  empty page mid rebuild).

## Files

- `packages/angular/src/components/progress-circle/progress-circle.spec.ts`
  (one spec added)
- `docs/reports/fixes/interactions-3/angular-b11-b12.pixel.mjs`, `.pixel.json`
- `docs/reports/fixes/interactions-3/angular-b11-b12.contract.before.json`,
  `.contract.after.json`
- this report

## Changes needed from the lead

- Decide for the Button `hit` part (above): port it in Angular with the
  actions lane's final React DOM, or mark Angular Button `planned` when the
  manifest regenerates.
