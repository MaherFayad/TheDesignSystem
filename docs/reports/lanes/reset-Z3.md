# Reset Z3: the pickers in Studio

Order Z3 of `docs/plan/reset-mobile.md`. I applied the steps of Z1 to the
style `studio` for Calendar, ColorArea, ColorField, ColorPicker, ColorSlider,
ColorSwatch, ColorSwatchPicker, DateField, DatePicker, TimeField,
WheelPicker, Stepper and Slider.

How I looked: the gallery on port 5303. I captured every component at
`chrome=0` in six combinations: ios light and dark in English, ios light
and dark in Arabic (rtl), and web light and dark in English. On ios the
viewport was 390 by 844; on web it was 1280 by 800. I opened the DatePicker
and ColorPicker popups by clicking their first trigger. For the Slider I
also captured hover, focus and drag on web in light and dark. I measured
computed radii, colours and layout boxes with Playwright. Liquid on ios was
the reference for which states and layout to cover.

## Defects found

| Component | Axis | What | Fix |
| --- | --- | --- | --- |
| Slider | all | The track and fill were capsules, the thumb was a disc. The ios thumb also took the platform's card shadow (`packages/css/src/platform/ios.css` line 258, `box-shadow: var(--ds-elevation-card-hover)`). | `studio/recipes/Slider.css`: the track, fill, thumb, focus ring, edge and value bubble take radius.xs. The shadow under the thumb and under the bubble is removed. |
| Slider | light, dark | The empty track was overlay-20, about 1.6:1 on the surface. That is under 3:1 (WCAG 1.4.11). | The empty track is now color.border.control, 3:1 or more in both schemes. |
| Slider | light, dark | The invalid track was a pale danger tint (about 1.3:1 in dark). | The invalid track is now color.state.danger.border. |
| Slider | hover | Hover drew a soft tinted halo, which is not Studio. | Hover now draws a 1px bright rule a step out from the thumb, as on Studio's Switch. |
| ColorSlider | all | The track was a capsule and the thumb a disc. | `studio/recipes/ColorSlider.css`: both take radius.xs. |
| ColorArea | all | The thumb was a disc. | `studio/recipes/ColorArea.css`: the thumb takes radius.xs. |
| ColorSwatchPicker | all | The row swatches were discs (the markup passes `shape="pill"`). The focus target, the chip under the check and the add button were also round. | `studio/recipes/ColorSwatchPicker.css`: square marks and control corners. |
| ColorSwatchPicker | ios | The grid mosaic had an 8px corner. | The recipe sets the mosaic to radius.xs. The cause is shared, see below. |
| ColorPicker | ios | The views row was a capsule, and its active segment had a card shadow. | `studio/recipes/ColorPicker.css`: the list takes radius.xs and the segment 0, with no shadow. The 1px edge stays. |
| ColorPicker | all | The compact trigger and its swatch, and the eyedropper, were round. | They now take the Studio control and mark corners. |
| Stepper | all | The step indicators and the travel ring were discs. | `studio/recipes/Stepper.css`: both take radius.xs. Complete, current, upcoming, error and unreachable can still be told apart (inverted fill, bright rule, control rule, danger, dashed). |
| ColorField | ios light | The first capture showed the value line overlapping the next case. | Not a defect. The capture ran while the page was still laying out. A recapture after the demo loaded is correct in Studio and in Liquid. |
| Calendar, DatePicker | all | Already Studio from earlier orders (square days, today ruled, chips at the control corner). | None. |
| DateField, TimeField, WheelPicker, ColorSwatch | all | Square fields and a 2px wheel band. Text passes contrast. Arabic is not clipped. | None. ColorSwatch keeps its `shape` prop as asked: a consumer's `pill` stays round. |

## Shared defects, not fixed

- `packages/css/src/platform/ios.css` lines 3704 to 3717 sit in the
  `ds.chrome` layer. They set `--_color-swatch-picker-radius` (line 3705)
  and `--_tabs-radius: var(--ds-radius-pill)` for the ColorPicker views
  (line 3717). Both are controls, so by ruling 16 they belong in
  `ds.platform`, where the style can win. Studio works around this by
  setting the property on the part that reads it, the same way the
  DatePicker recipe works around line 3657.
- `packages/css/src/platform/ios.css` line 258: the ios slider thumb for
  Studio and Desk is "a large disc with an edge and a shadow". Studio's
  recipe overrides the shape and the shadow. Desk still gets the disc.
- `packages/css/src/components/Slider.css` (lines 189, 211, 212, 227, 250,
  261, 308, 419), `ColorSlider.css` (track and thumb),
  `ColorArea.css` (thumb) and `Stepper.css` (lines 141, 212) draw the pill
  with no private radius property. A style has to restyle these
  declarations directly. Radius hooks like Switch's would be cleaner.
- `packages/styles/studio/recipes/Button.css` covers the soft neutral
  Button but not the soft neutral IconButton. Outside these pickers, an
  IconButton in Studio is still a grey filled cell. I did not change that
  file.
- Tabs in the soft emphasis on ios keep the capsule and card shadow
  everywhere outside ColorPicker. No order covers Tabs.

## Files changed

- `packages/styles/studio/recipes/Slider.css` (new; also styles RangeSlider, which shares Slider.css)
- `packages/styles/studio/recipes/ColorSlider.css` (new)
- `packages/styles/studio/recipes/ColorArea.css` (new)
- `packages/styles/studio/recipes/ColorSwatchPicker.css` (new)
- `packages/styles/studio/recipes/ColorPicker.css` (new)
- `packages/styles/studio/recipes/Stepper.css` (new)
- `packages/styles/studio/index.css` (generated by `npx tsx scripts/gen-index.ts`)

## Commands and results

- `npx tsx scripts/gen-index.ts`: wrote the barrels. The studio index now lists the six new recipes.
- `npm run typecheck`: passed with no errors.
- `npx vitest run packages/styles packages/css`: 1 file, 4 tests, all passed.
- `npx vitest run packages/lint` (the gates: raw colour, raw value, dash, logical properties, forced colours, contrast): 19 files, 109 tests, all passed. The 4 known contrast failures in desk.dark were already on record and are not mine.
- Contract runs with `DS_CONTRACT_WORKERS=2 npm run contract -- --framework react --platform <p> --component <Name>`:
  - Slider ios: 43 passed. Slider web: 43 passed.
  - ColorSlider ios: 43 passed. ColorSlider web: 43 passed.
  - ColorArea, ColorSwatchPicker, ColorPicker, Stepper: see the addendum below.

## Not checked

- Android and macos, and the Angular and React Native ports.
- RangeSlider's own page. It shares the Slider recipe, but I did not capture it.
- Every hover, press and drag state outside the Slider. Forced colors was checked only by the lint gate.
- The ios test screens, which belong to Z1.

## Sheets

These are in the scratchpad, not in the repo:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/z3/sheet-<Component>.png`.
Each sheet has a before row and an after row, labelled by axis, with the
open popups included.
