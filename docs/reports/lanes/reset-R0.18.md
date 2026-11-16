# Order R0.18: SegmentedControl reflow at 320px in right to left

Owner: ds-component. Follow up 1 of "From R0.5" in
`docs/plan/reset-followups.md`. Evidence: `docs/reports/reset/R0.18/`.

## Cause

Neither the indicator placement nor the value React writes. The thumb was
on the selected item with a 0px offset in every case before the fix, in
both directions. The reflow scan names the widest leaf of a failing case,
and the empty indicator span (61px) was the widest; it did not stick out.

What crossed the page edge was the last item. Desk's
`packages/styles/desk/recipes/Density.css` sets
`--_button-padding-inline: space.2xl` on every md `toggle-button` on the web
platform, in the `ds.recipes` layer. SegmentedControl items are
toggle-button roots. The phone rule in `SegmentedControl.css`
(`width < 30rem`, padding space.2xs) set the same private property in
`ds.base`, and a later layer wins whatever the specificity. So in Desk on
web the phone rule never applied: items kept 14px of inline padding, the
five items needed more than the 290px track and spilled past its inline
end. In en ltr the spill was 6px and stayed inside the 14px page gutter. In
ar rtl the Arabic font stack is wider, the spill was 29px, and it crossed
the left page edge by 14px. Other styles do not set that property in a
recipe, which is why only Desk failed. The platform layers scope their
button rules with `:not([data-part])`, so ios and android were not affected.

## Fix

`packages/css/src/components/SegmentedControl.css`: inside the phone query,
text items also set `padding-inline: var(--ds-space-2xs)` on the item
itself. No recipe sets `padding-inline` on an item, so the rule holds. Icon
only items are excluded and keep their square rule. The private property is
still set as before. Nothing changes above 30rem.

## Numbers

Page overflow at 320px (scrollWidth minus clientWidth), Desk web dark:

| | before | after |
| --- | --- | --- |
| ar rtl | 14px | 0px |
| en ltr | 0px (items spilled 6px past the track) | 0px (no spill) |
| Desk item inline padding at 320px | 14px | 4px |

Reflow matrix, 4 styles by 4 platforms by 2 directions:

- Before: 30 passed, 2 failed (desk web ar rtl, desk macos ar rtl, both
  14px, cases `many` and `too-many`). `reflow-before.json`.
- After: 32 passed. `reflow-after.json`.

Indicator on the selected item (largest gap between the indicator rect and
the selected item rect over every control on the demo page, at rest and
after selecting the last item of `many`), `indicator-after.json`:

| | 320 ltr | 320 rtl | 1280 ltr | 1280 rtl |
| --- | --- | --- | --- | --- |
| Desk | 0px | 0px | 0px | 0px |
| Neutral | 0px | 0px | 0px | 0px |

## Tests

`packages/react/src/components/SegmentedControl/SegmentedControl.test.tsx`:

- "in RTL writes the start from the right edge of the root": a fake rtl
  layout; the start must be 3px, then 123px after selecting the third item.
  A left based start reads 17px and fails.
- "sets the phone padding on the item itself, so a style recipe cannot undo
  it": the phone query must set `padding-inline` on text items.

Each test failed with its fault planted (a left based start, the old phone
rule) and passes on the fixed files. 18 of 18 pass.

`npm run contract -- --framework react --component SegmentedControl`: 67
passed. `contract-react-segmented.json`.

## Tabs and ToggleGroup

They do not share the fault. Neither writes a measured inline start: the
Tabs indicator is a child of each trigger, and the ToggleGroup pill is a
span inside each item, both placed by CSS in the item's own box. Neither
has a phone padding rule set through `--_button-padding-inline`, and
ToggleGroup wraps. Reflow matrix: Tabs 32 of 32, ToggleGroup 32 of 32
(`reflow-tabs-togglegroup.json`). Not edited.

## Follow ups (outside my files)

1. Desk's `Density.css` button rule has no `:not([data-part])`, unlike the
   platform layers. It reaches every toggle-button part: SegmentedControl
   and ToggleGroup items. From reading the code, it also overrides
   `--_button-height` on SegmentedControl items, which SegmentedControl.css
   sets to fit the track; I did not measure the effect on the track height.
   The Desk recipe owner should decide whether to scope it.
2. The `too-many` case at a wide viewport (an 18rem column on a 1280px
   page) has items that spill out of the track: 31px in Desk, 43px in
   Neutral, 45px in Liquid, none in Studio. The page does not scroll, so
   the matrix passes. The phone rule follows the viewport, not the
   container. This was already the case before this order; a container
   query would fix it.

## Check

`npm run check` fails on two tests, both outside my files, both failing
when run alone:

- `packages/lint/src/gates/no-raw-value.test.ts`, "reads the breakpoint
  tokens": it expects 3 breakpoints and gets 8.
  `packages/tokens/src/base/breakpoint.json` was changed at 10:59 by
  another lane.
- `packages/angular/src/components/tag-field/tag-field.spec.ts`, "Enter
  adds the typed text and drops duplicates": an empty message.
  `packages/shared/src/index.ts` and `theme.ts` were changed at 10:53 to
  10:55 by another lane. R0.5 logged this test as a flake under load.

Every other step passes: typecheck, eslint, 2678 of 2679 vitest tests, the
SegmentedControl tests among them.

## What I could not prove

- That `npm run check` passes as a whole: the two failures above belong to
  lanes in progress.
- `macos` still renders the web layout (R0.10 and R0.14), so its 8 runs
  measure web.
- I measured the indicator in the dark scheme at the default density only.
