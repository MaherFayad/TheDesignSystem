# Reset P1, lane E1: platform CSS

Scope: `packages/css/src/platform/*.css`, plus Studio and Desk recipes for
item 4 and for the workarounds item 1 makes needless. Items 1 to 4 from
`docs/plan/reset-mobile.md` (Round 1, E1), and items 5 and 6 the lead added
from lane E3.

## What changed

### Item 1: picker shapes leave ds.chrome

- `packages/css/src/platform/ios.css` lines 2601 to 2689: the section "dates,
  wheels and colours" (Calendar, DatePicker chips and inline time row, the
  date popover arrow, DateField, TimeField, WheelPicker, ColorSlider,
  ColorSwatchPicker, ColorField, ColorPicker views, ColorArea) moved from the
  end of `@layer ds.chrome` to the end of `@layer ds.platform` (it closes at
  line 2690). A note in the section comment says why.
- Kept in `ds.chrome`, lines 3758 to 3769: the date chip's label size and
  weight (17, regular). After the move Neutral's Button recipe
  (`--_button-font-size: font-size-m`) made the chips smaller and Studio's
  made them medium weight; size and weight are type, not shape, so they stay
  locked. The chip's corner, height and side room are in `ds.platform`.
- Studio, `packages/styles/studio/recipes/DatePicker.css`: the four
  `--_button-radius-*` corners became one `--_button-radius`.
- Studio, `recipes/ColorSwatchPicker.css`: the grid corner is set on the
  root, not on the list part; comment updated.
- Studio, `recipes/ColorPicker.css`: comment only (it no longer says a
  ds.chrome rule blocks it). The rules stay: they set a square segment on a
  list with the mark corner, which a root rule cannot say.
- Desk: date chips take the pill by themselves (Desk's Button recipe now
  wins). New `packages/styles/desk/recipes/WheelPicker.css` (band and ring
  at the control corner, the pill). `recipes/ColorField.css` adds
  `--_color-field-radius: var(--ds-radius-control)`.
- `packages/styles/desk/index.css` gained one import line, written by
  `npx tsx scripts/gen-index.ts`. A dry run first showed that line was the
  only change the generator would make.

### Item 2: slider thumb disc only where the style keeps the pill

- `ios.css` lines 257 to 273: the ios disc (edge, card shadow) sits in
  `@container style(--_slider-thumb-radius: var(--ds-radius-pill))`, the
  thumb radius hook E2 added to `Slider.css`. A style that sets its own thumb
  corner keeps its own edge. Checked in the page: Desk default gets the 999px
  disc, 1px edge and card shadow; with `--_slider-thumb-radius:
  var(--ds-radius-xs)` set on the root, the after part is 3px, no edge, no
  card shadow. Liquid and Neutral keep the glass thumb block, unchanged.
- Studio's Slider recipe still restyles the after part directly. Moving it to
  `--_slider-thumb-radius` would let it drop its shadow override. Not done:
  that file is outside what item 1 makes needless.

### Item 3: Dialog on ios

- `ios.css` lines 3277 to 3285: a Dialog title with a close part keeps the
  base reserve at its end, `max(--_dialog-padding, band inline + control sm +
  space s)`, so a long title wraps before the close control.
- `ios.css` lines 3338 to 3353: the lights. Dialog has no phone close of its
  own (Sheet has one, `Sheet.tsx` line 613; `Dialog.tsx` does not), so hiding
  all three lights would leave a Desk dialog on a phone with no visible way
  out. So: minimize and zoom are hidden; the close light stays. A second
  selector hides all the lights once the title bar holds a CloseButton, so it
  works as soon as Dialog renders one on phones the way Sheet does. For E3 or
  the lead: `Dialog.tsx` line 413 needs Sheet's `phone` rule.
- The Studio band-padding workaround in `studio/recipes/Dialog.css` lines 50
  to 53 still places the close control. I did not set the band padding for
  Dialog in ios.css: it would move the close control in Liquid and Neutral.

### Item 4: Studio buttons in bars, sheets and alerts

- `ios.css` lines 3771 to 3800, at the end of `ds.chrome`, inside
  `@container not (style(--_ios-glass: ...))`: navbar bar buttons, buttons in
  bar groups, Dialog and AlertDialog footer buttons, the sheet close, confirm,
  header action and footer buttons, and action sheet items take
  `var(--ds-radius-control)`. Bars, groups, sheets, alerts, toasts and the tab
  bar keep the platform's capsule and corners.
- Decision: the guard is the existing signal "the style does not take the
  platform look in full" (no `--_ios-glass`), not a style name. It covers
  Studio and Desk. Desk's control corner is the pill, so Desk measured 0
  pixels changed on Dialog, AlertDialog, Sheet and ActionSheet, and 0 style
  rows on the navbar and toolbar.

### Item 5 (lead): sheet header action refraction

- `packages/css/src/platform/ios-refraction.css`: next to each of the 12
  close disc selectors, the same selector for `> [data-part='header-action']
  > :is([data-ds='button'], [data-ds='icon-button'])`, with `::before` where
  the close line has it (new lines 74, 125, 223, 248, 250, 273, 362, 408, 451,
  482, 484, 508). Measured on the Sheet case "One more action in the header"
  (trigger `header-action`; the "Confirm in the header" case has no header
  action): the header action's backdrop filter went from `blur(8px)
  saturate(1.6)` to `url("#ds-refraction-44x44r22") blur(1px) saturate(1.15)`
  in Liquid, the close disc's filter. The "Confirm in the header" case is
  unchanged (0 px, 0 style rows in all four Liquid and Neutral combinations).

### Item 6 (lead): SplitView on a fold

- `packages/css/src/platform/ios-shell.css`: the `flex: 1 1 0` rule on the
  split panes under `(horizontal-viewport-segments: 2)` is removed (a comment
  at line 996 says why), and the comment at lines 959 to 962 no longer says
  "even widths". The column gap stays. Not measured on a fold here: headless
  Chromium has no viewport segments. E3 measured it with the rule overridden.

## Liquid and Neutral, before and after

Method: one script loads each page twice at the same moment. The "before"
page gets the gallery CSS with my edited files swapped back to copies taken
before I started, so other lanes' edits are the same on both sides. It
compares a full page screenshot (pixelmatch, threshold 0) and the computed
styles of every element and its before and after parts (corners, borders,
shadow, type, size, padding, colours, display, opacity, backdrop filter).
390 by 844, ios, en, ltr, light and dark. Overlays were opened by their demo
trigger.

Covered: Calendar, DatePicker (page and open), DateField, TimeField,
WheelPicker, ColorSlider, ColorSwatchPicker, ColorField, ColorPicker (page and
open), ColorArea, ColorSwatch, Slider, RangeSlider, Navbar, Toolbar,
PageShell, TabBar, SharePanel, Dialog (md, danger, three actions),
AlertDialog, Sheet, ActionSheet. 112 captures, plus reruns.

Result:

- Computed styles: equal everywhere, except the Dialog title's
  `padding-inline-end` (30px to 56px), which is item 3. In those dialogs the
  title wraps the same way and keeps its height.
- Pixels: 0 everywhere, except one real difference: the Dialog "three
  actions" case in Liquid shows 36 pixels on the close glyph (a 10 by 10 box
  at 313,286), at most 10 of 255 per channel. It shows in light or dark from
  run to run, and never with the swap off (three runs). Likely a raster
  change now that the title box no longer runs under the close control. Not
  visible to the eye.
- Noise, not from this lane: DateField, TimeField and ColorField show 500 to
  1600 pixels where the demo's "value:" lines land late; the same numbers
  show with the swap off, and their computed styles are equal. Some full page
  captures came out 844 tall or with one case unpainted (Calendar, Slider,
  Toolbar); each passed with 0 pixels and 0 style rows on rerun.

## Studio and Desk, what changes

- Studio: buttons in the Dialog, AlertDialog, Sheet (close, confirm, header
  action, footer) and ActionSheet go from capsules to 2px; navbar bar buttons
  too (87 icon buttons, 15 buttons on the page). The bars, sheets and alerts
  keep their corners. DatePicker, WheelPicker, ColorField, ColorPicker,
  ColorSwatchPicker, Slider: 0 pixels, 0 style rows.
- Desk: date chips 8px to the pill (page and open), wheel band and ring 6px
  to the pill, ColorField and the ColorPicker hex field 12px to the pill.
  The phone Dialog loses minimize and zoom. Overlays and bars: 0 pixels.

## Sheets

In `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/e1/sheets/`:

- `liquid-neutral-pickers.png`, `liquid-neutral-overlays.png`
- `studio-item4.png`, `desk-item1.png`, `item3-dialog.png`,
  `item5-header-action.png`

Raw before, after, diff and style files are in the folders next to `sheets/`
(`ln-final`, `rerun-*`, `r2-*`, `r3-*`, `sd-*`, `item5-*`, `noise`).

## Commands

- `npm run typecheck`: exit 0.
- `npx vitest run packages/styles packages/css packages/lint`: 20 files, 113
  tests passed. (A first run during the work had a raw value in
  `components/Link.css` line 279, E2's file, and two 5 second timeouts; both
  were gone on the final run.)
- Contract, react, ios, `DS_CONTRACT_WORKERS=1`, one component at a time:
  see "Contract" below.

## Contract

`DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform ios
--component <Name>`, run after the last edit, every one exit 0, no failure:

| Component | Result |
| --- | --- |
| Sheet | 63 passed |
| SplitView | 43 passed |
| Dialog | 63 passed |
| DatePicker | 63 passed |
| WheelPicker | 43 passed |
| ColorField | 43 passed |
| ActionSheet | 63 passed |
| AlertDialog | 63 passed |
| Navbar | 43 passed, 20 skipped |
| Slider | 43 passed |

Not run: Calendar, DateField, TimeField, ColorSlider, ColorSwatchPicker,
ColorPicker, ColorArea, RangeSlider, Toolbar. A first run with all 19 in one
call was too slow under the shared load (axe cases near 15 s each) and was
stopped during Calendar with every test passed up to then (158). For these
nine the A/B shows 0 changed computed styles in Liquid and Neutral, and in
Studio and Desk only the corners listed above.

## Not done

- Dialog's own phone close control (React, E3's lane). Until it lands the
  close light stays on a phone Dialog that has the lights.
- Studio's Slider recipe was not moved to the thumb radius hook.
- Studio's Dialog band padding workaround (`studio/recipes/Dialog.css` lines
  50 to 53) was left as it is.
- Tab bar items, the tab bar accessory toolbar and toasts keep the platform
  shapes in Studio: the order names buttons in sheets, alerts, action sheets
  and bars, and these are bar items and panels.
- Arabic, android, web, hover, press and focus states were not captured for
  the before and after. Item 6 was not measured on a fold.
