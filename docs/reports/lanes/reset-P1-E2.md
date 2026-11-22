# Order P1, lane E2: component CSS

Scope: the three E2 items of round 1 in `docs/plan/reset-mobile.md`. Only
files in `packages/css/src/components/` were changed. No test file was
needed: no gate checks private property names.

## 1. Corner properties in place of hard coded pills

Each new property is declared on the component root, defaults to
`var(--ds-radius-pill)` (the value the declaration had before), and has a
line in the file's header comment.

| Component | Properties added | Where it is read |
| --- | --- | --- |
| Slider (and RangeSlider, which shares Slider.css) | `--_slider-track-radius`: the track, the fill (`::before`) and the fill's clip-path round; `--_slider-thumb-radius`: the thumb, its focus glow (`::before`) and its edge (`::after`); `--_slider-bubble-radius`: the value bubble | `Slider.css` header 74 to 77, declared 130 to 132, read 197, 219, 221, 235, 258, 272, 316, 427 |
| ColorSlider | `--_color-slider-track-radius`, `--_color-slider-thumb-radius` | header 28 to 29, declared 72 to 73, read 118, 135 |
| ColorArea | `--_color-area-thumb-radius` (the area corner already had `--_color-area-radius`) | header 16, declared 65, read 88 |
| Stepper | `--_stepper-indicator-radius`; `--_stepper-travel-radius` (the travel ring, default the indicator's corner) | header 18 to 20, declared 59 to 60, read 146, 217 |
| ColorSwatchPicker | `--_color-swatch-picker-check-radius` (the disc under the check); `--_color-swatch-picker-item-radius` (a row swatch's target, which the focus ring follows) | header 26 to 28, declared 63 to 64, read 120, 187 |
| NumberField, stepper variant | `--_number-field-stepper-radius`: the outer corners of the capsule | header 51 to 53, declared 272 (on `[data-variant='stepper']`), read 300 as `--_button-radius` of the two halves |

NumberField: line 149 (`[data-shape='pill']` sets `--_number-field-radius`
to the pill) was already a private property and is the consumer's `shape`
prop, so it stays. The capsule Z1 saw is the two IconButtons, which React
renders with `shape="pill"`; the halves now read
`--_button-radius: var(--_number-field-stepper-radius)`, so a recipe can
square the capsule without restyling Button. The inner corners stay square
through the existing corner properties.

Proof that the look does not change: full page screenshots of Slider,
RangeSlider, ColorSlider, ColorArea, Stepper, ColorSwatchPicker and
NumberField in studio, desk, neutral and liquid, on ios and web (56
pages), taken with the original files and then with the new ones. 55 are
pixel identical. The one that differs, Slider desk ios, differs because
E1's new rule in `platform/ios.css` (line 263,
`@container style(--_slider-thumb-radius: var(--ds-radius-pill))`) reads
the new property: with it declared, the ios disc edge and shadow apply
again where the style keeps the pill thumb, which is what E1 item 2 asks.
Without the property that query never matched.

## 2. Date and time values keep their part order

Finding first: React Aria sets `style="unicode-bidi: isolate"` inline on
the segment row, and the row is a flex row, so bidi marks in the text do
not order the boxes; the row lays out in its own direction, which is the
page direction. Nothing in the markup says which locale a row is in (no
`dir`, no `lang`; React Aria only adds inline styles to the segments of a
right to left locale, a framework detail this lane does not style). So:

- `DatePicker.css` lines 81 to 83: the chip label (`[data-part='label']`
  of the date and time chips) takes `unicode-bidi: plaintext`, as Badge,
  Chip and the Slider bubble do. "9:41 AM" and "Jun 18, 2026" now keep
  their order on an Arabic page; an Arabic value still runs right to left.
  Header 26 to 33 updated.
- `TimeField.css` lines 6 to 13 (header) and 21 to 33: the time row is
  `direction: ltr`, so the hour and the minute always read left to right,
  as Intl isolates them. In a right to left row the day period, and the
  space before it, move to the left with `order`, and the period keeps its
  own direction. Before, an Arabic time read "م 05 : 9" and a 24 hour time
  "05 : 21"; now "م 9:05" and "21:05". The row stays flex, so the android
  dialog spacing (`platform/android.css` 1711) still applies.
- `DateField.css` lines 28 to 38: header only. A date row already lays out
  correctly for its direction (an Arabic date has the day at the right).

What still needs the markup: a Latin value on an Arabic page (the English
demo cases) inherits the page direction in the segment row. After this
change it reads "AM 9:41" (was "AM 41 : 9") and "2026/11/17". For E3:
`packages/react/src/components/DateField/segments.tsx` line 108 to 116,
the `[data-part='input']` div, should carry `dir` from the locale
(`arabic ? 'rtl' : 'ltr'`, or the locale's own direction). That one row
serves DateField, TimeField and the DatePicker time field on web. With it,
the CSS above gives "9:41 AM", "17/11/2026", and the Arabic forms
unchanged.

I tried a text based row (block layout, `unicode-bidi: plaintext`, the
separators as inline text). It does not work: React Aria's inline
`unicode-bidi: isolate` overrides the plaintext, and `!important` is not
allowed. I took it out.

## 3. Title bar in Arabic on phones, and the wrapped Navbar brand

- `TitleBar.css` lines 98 to 128 (selector at 106, 112, 117, 124): the right to left window layout (lights
  at the left, title in the middle) now leaves out the title bar of a
  dialog, an alert or a sheet on ios and android, where the platform files
  hide the lights (`platform/ios.css` 3325, `platform/android.css` 1471;
  E1 item 3 adds Dialog on ios). Those bars mirror as usual: in Arabic the
  title at the right, the close button at the left. Measured on desk
  (the style that draws the bar): Sheet and AlertDialog, ios and android,
  Arabic, are flex and right to left; on web and macos the bar keeps the
  lights layout (grid, lights at the left, title centred).
- `Link.css` lines 272 to 280: a standalone link's line height is
  `max(size.target-min, its font size times font.leading.tight)`. Links up
  to 20px keep the 24px line. The ios Navbar brand (34px) now has 40.8px
  lines in English and 45.9px in Arabic (Arabic's tight leading), so
  "Northwind design studio" and "استوديو الشمال للتصميم" wrap without
  overlap. Line tops measured 0 and 40 (English), 0 and 43 (Arabic).

## Before and after sheets

In `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/e2/`:
`before/` and `after/` (item 1, 56 pages), `b3/` and `a3/` (items 2 and
3, 44 pages, taken back to back), and the crops `p-tf-ar.png` (TimeField,
Arabic page), `p-dp-ar.png` (DatePicker chips, Arabic page),
`tb-sheet-ios-ar.png` (Sheet title bar, Arabic, ios: before on top),
`brand-after.png` (the wrapped brand). The `before/` set taken during the
round has some "Loading the demo" pages; those were taken again.

## Commands

- `npm run typecheck`: passed, no errors.
- `npx vitest run packages/css packages/lint packages/styles`: first run
  4 failures. One was mine (`no-raw-value`: `1em` in Link.css), fixed by
  reading `--_link-font-size`. The other three were 5 second timeouts on
  the shared machine (doctor, token-vocabulary). Run again with
  `--testTimeout=120000`: 20 files, 113 tests passed.
- Contract, react, `DS_CONTRACT_WORKERS=1`, components Slider, RangeSlider,
  ColorSlider, ColorArea, Stepper, ColorSwatchPicker, NumberField,
  DatePicker, DateField, TimeField, TitleBar, Link:
  CONTRACT_RESULTS

## Not done

- The Latin value in an Arabic row of DateField and TimeField: needs `dir`
  on the row from React (E3, file and line above).
- Recipes were not moved to the new properties: `packages/styles/*` is not
  in this lane. Studio's recipes (`studio/recipes/Slider.css`,
  `ColorSlider.css`, `ColorArea.css`, `Stepper.css`,
  `ColorSwatchPicker.css`) still restyle the declarations directly. They
  can now set the properties instead. For E1's ios slider rule, Studio's
  Slider recipe should set `--_slider-thumb-radius`, or the style query
  treats Studio as keeping the pill.
- The phone exclusion in TitleBar.css names the dialog, alert and sheet
  bars by context, since the platform files hide the lights with
  `display: none`, which `:has()` cannot see. A cleaner hook needs the
  platform files (E1).
