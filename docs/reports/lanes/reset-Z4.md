# Order Z4: the pickers in Desk

Scope: Calendar, ColorArea, ColorField, ColorPicker, ColorSlider,
ColorSwatch, ColorSwatchPicker, DateField, DatePicker, TimeField,
WheelPicker, Stepper, Slider, in the style `desk`.

Each one was captured light and dark, English (ltr) and Arabic (rtl), on
`platform=ios` at 390 by 844 and on `platform=web` at 1280 by 800, full
page, with the first DatePicker and ColorPicker trigger opened. A script
also measured the text contrast and the target size of every element
inside each component root on all 104 pages.

## Defects found

| Component | Axis | What | Result |
| --- | --- | --- | --- |
| DateField | every axis | The field was the clear bordered pill of the base. Desk fields are filled (the control fill inside the control border, as the Desk Input), so a date field read as another object next to an Input. | Fixed: `packages/styles/desk/recipes/DateField.css` |
| TimeField | every axis, and the time part of DatePicker on web | The same clear bordered pill. | Fixed: `packages/styles/desk/recipes/TimeField.css` |
| ColorField | every axis, and the hex field inside ColorPicker | The same clear bordered field. | Fixed: `packages/styles/desk/recipes/ColorField.css` |
| DateField, TimeField, ColorField | light, ios and web | With the fill the placeholder text (dd, mm, yyyy, the dashes, AM, #RRGGBB) measured 4.11:1, under 4.5:1 (1.4.3). In dark, the time part of DatePicker on the card surface measured 4.24:1. | Fixed in the same three files: the placeholder takes the muted text, 5.1:1 in light and 7.3:1 in dark. |
| DatePicker | ios | The date and time chips have the small iOS corner (8px), not the Desk pill they have on web. | Shared, not fixed. `packages/css/src/platform/ios.css` lines 3657 to 3663 set `--_button-radius` in `ds.chrome`, which comes after `ds.recipes`, so no recipe can restate the pill. DatePicker is a control under ruling 16, so its corner belongs in `ds.platform` or to the style. |
| WheelPicker | ios | The band under the picked row has a 6px corner; on web it is the Desk pill. | Shared, not fixed. `ios.css` line 3688 (`--_wheel-picker-radius`) in `ds.chrome`, the same cause. |
| ColorField | ios | The field has the 12px panel corner, not the pill of the Desk date and time fields. | Shared, not fixed. `ios.css` line 3712 (`--_color-field-radius`) in `ds.chrome`, the same cause. |
| ColorSwatchPicker, ColorArea in ColorPicker | ios | Their corners are also set in `ds.chrome` (`ios.css` lines 3705 to 3707 and 3720 to 3723). They read well in Desk, so this is only noted with the cause above. | Shared, not fixed |
| DatePicker | ar, ios and web | English demo values in an rtl page show their parts in bidi order: the chip "9:41 AM" reads "AM 9:41", and the 12 hour TimeField reads "AM 41 : 9". The Arabic values are right. | Shared, not fixed: the chip label and the segment row in `packages/css/src/components/DatePicker.css` and `DateField.css` have no bidi isolation for a Latin value. Not a style matter. |
| Input (outside this order) | light | The Desk Input placeholder measures 4.11:1 on its fill, the same pairing fixed above. | Not mine: `packages/styles/desk/recipes/Input.css` line 17 sets the fill and nothing sets the placeholder. For Z2 or the owner of Input. |
| Input (outside this order) | ios | The Desk Input has the 12px panel corner from `ios.css` line 403 (`ds.platform`). A Desk recipe could restate the pill there, since `ds.recipes` wins over `ds.platform`. | Not mine, noted for Z2. |

Checked and found fine in Desk, so nothing was changed:

- Calendar: the selected day is the yellow disc with dark ink, today the
  yellow tint with the gold number (about 4.9:1 in light), booked days
  struck through, days out of range and the disabled calendar dimmed, so
  selected, today, unavailable and disabled can be told apart. The Umm
  al-Qura months and Arabic weekday names fit their cells. The arrows
  mirror in rtl.
- Stepper: done steps in the yellow with dark checks, the current step in
  the tint with a yellow edge and a bolder title, the next steps muted.
- Slider: yellow range and thumb in dark, the gold in light. The fill
  starts at the inline start in rtl.
- ColorSlider, ColorArea, ColorSwatch, ColorSwatchPicker, ColorPicker:
  the views row is the yellow segmented thumb of Desk, the add button the
  Desk glass pill, the selected swatch keeps its ring.
- WheelPicker on web: the band is already the pill.
- The automated pass found no target under 24 px in any of the thirteen
  components. Its only other text flags were the hidden ColorPicker tab
  labels in dark (1.03:1), which are not on screen: the segmented row
  shows the views, so these were false flags.

## Files changed

- `packages/styles/desk/recipes/DateField.css` (new)
- `packages/styles/desk/recipes/TimeField.css` (new)
- `packages/styles/desk/recipes/ColorField.css` (new)
- `packages/styles/desk/index.css` (written by `npx tsx scripts/gen-index.ts`, three import lines added)

I wrote two other recipes, `DatePicker.css` and `WheelPicker.css`, to
restate the Desk pill on ios. I deleted them when I found the platform
rule sits in `ds.chrome`, where they could not take effect.

## Commands run

- `npm run typecheck`: passed, no errors.
- `npx vitest run packages/styles packages/css`: 1 file, 4 tests passed.
- `DS_CONTRACT_WORKERS=2 npm run contract -- --framework react --platform ios --component <Name>` and the same with `--platform web`, for DateField, TimeField and ColorField, run again after the placeholder change: see the results below.
- `npx tsx scripts/gen-index.ts`: rewrote `packages/styles/desk/index.css`.

Contract results, after the last change (react):

| Component | ios | web |
| --- | --- | --- |
| DateField | 43 passed, 0 failed | 43 passed, 0 failed |
| TimeField | 43 passed, 0 failed | 43 passed, 0 failed |
| ColorField | 43 passed, 0 failed | 43 passed, 0 failed |

The first run, before the placeholder change, gave the same counts.

## Sheets

Before and after contact sheets, labelled, in
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/z4/`:
`before_<component>.png` for all thirteen, `after_<component>.png` for
date-field, time-field, color-field, date-picker and color-picker (the
pages that show the changed fields). Each sheet puts ios then web, light
then dark, English then Arabic side by side, with the open overlay after
its page. Pages are cut at 1800 px; the raw full pages are in `raw-before`
and `raw-after` next to them.

## Not checked

- Hover, focus and press states were not captured, only the rest state
  and an open overlay.
- Only the first DatePicker trigger and the first ColorPicker trigger were
  opened, not every popover or dialog form on the pages.
- The contract was run only for the three components I changed, not for
  the ten I left alone.
- More contrast, reduced transparency, forced colors and reduced motion
  were not captured.
- The contrast pass reads computed colors and blends known fills; it does
  not see the paper grain or a gradient under the text, so pages were also
  read by eye.
