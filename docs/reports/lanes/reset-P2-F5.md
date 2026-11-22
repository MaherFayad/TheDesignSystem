# P2 F5: the Studio pack, round 2

Lane F5 of round 2 (`docs/plan/reset-mobile.md`, "Round 2"). Only files in
`packages/styles/studio/` were changed, plus `packages/styles/studio/index.css`
and `packages/styles/desk/index.css`, which `npx tsx scripts/gen-index.ts`
rewrote (the Desk one picks up F6's new recipe files; I did not edit it).

Measured on the gallery at port 5325, `style=studio`, `chrome=0`, English,
ios at 390 by 844 and web at 1280 by 800, with Playwright (computed styles
and element captures). Before and after captures:
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p2/f5/before/`
and `.../p2/f5/after/` (shortened to `before/` and `after/` below). Where
no before capture is named, the Q1 audit picture under `p1/q1/` is the
before.

## Q1 findings, F01 to F21

| Finding | Result | Before | After |
| --- | --- | --- | --- |
| F01 Dialog title band on ios (major) | Fixed. On ios the dialog is one flat tile: no header band | title bg `rgb(244,244,244)` light, `rgb(17,17,17)` dark, band ends 6px under the glyphs | title bg transparent in both; `after/dialog-light-ios.png` |
| F02 AlertDialog description rule on ios (major) | Fixed. No description band, no rule, panel one tone | description `border-top 1px rgb(189,189,189)`, band `rgb(255,255,255)` on a `rgb(244,244,244)` panel | `border-top 0`, description transparent on a `rgb(255,255,255)` panel (dark `rgb(10,10,10)`); `after/alert-dialog-dark-ios.png` |
| F03 Toast with a picture (major) | Fixed. First column sizes to the start part; the meta (time) gets its own cell on the row | avatar inset 0, title over the avatar by 3px, first column 16px, time on a row of its own (toast 79 tall) | avatar inset 11px, first column 38px, gap to the title 8px, time on the title row (toast 61 tall); `before/` and `after/F03-toast-ios-dark.png` |
| F04 SearchField 11px on ios | Passed on to F1: `platform/ios.css` 428 to 431 sit inside the glass query at 419 | | |
| F05 One selected mark (major) | Fixed for List, Sidebar, the ColorPicker views and the Navbar web dropdown: all take the inverted cell. List through F3's new `--_list-item-bg-active`, `--_list-item-fg-active`, `--_list-item-edge-active`; Sidebar through `--_sidebar-item-bg-active`, `-fg-active`, `-edge-active` | List row `rgba(255,255,255,0.1)` veil, Sidebar veil plus bar, ColorPicker pale cell, Navbar 2px bar | List row fill `rgb(10,10,10)` light, `rgb(245,245,245)` dark (music library "now playing"), text white or black; Sidebar `rgb(10,10,10)` / `rgb(255,255,255)` light, `rgb(245,245,245)` / `rgb(0,0,0)` dark, edge bar the fill color; buttons in the active List row follow its ink; `after/sheet-F05.png` |
| F06 ColorPicker views (major) | Fixed. The selected view is the inverted cell on ios and web | indicator `rgb(233,233,233)` on a veil, 1px gray frame | indicator and edge `rgb(10,10,10)`, label `rgb(255,255,255)` light; `rgb(245,245,245)` and `rgb(0,0,0)` dark; `after/sheet-cp.png` |
| F07 ActionSheet on web (major) | Fixed. New recipe: bright rule on the panel, one cell look for every item | frame `rgb(189,189,189)` light, `rgb(61,61,61)` dark; danger a pink tint with no border, neutral bordered, Cancel bare gray text | frame `rgb(10,10,10)` / `rgb(245,245,245)`; all four items no fill with a 1px rule; danger ink `rgb(185,28,28)` with `rgb(220,38,38)` rule (dark `rgb(248,113,113)`), Cancel the neutral cell; ios untouched (platform items); `before/` and `after/F07-actionsheet-*.png` |
| F08 Switch on ios (major) | Fixed. On ios Studio's thumb is square (24 by 24) and the off track empty | off: 38px thumb at x 2 on a `rgba(10,10,10,0.2)` track; on: 38px thumb at x 23, a 21px dark strip | off: 24px dark square at x 2 on an empty track with the 1px control rule; on: inverted track, light square at x 37; `before/` and `after/F08-crop.png` |
| F09 Press on IconButton, CloseButton, soft buttons (major) | Fixed. Neutral icon and close buttons and neutral solid buttons invert on press; tone soft buttons press to the tone's solid cell; accent tints press to the primary fill | IconButton ghost press `rgba(10,10,10,0.2)`, solid press equal to rest; CloseButton press a 20 percent veil; danger soft hover and press both `rgba(239,68,68,0.2)` | IconButton press `rgb(10,10,10)` with `rgb(255,255,255)` ink (light), CloseButton press and bloom `rgb(10,10,10)` light, `rgb(245,245,245)` dark; danger soft hover `rgba(239,68,68,0.2)`, press `rgb(185,28,28)` with white (light), `rgb(248,113,113)` with `rgb(10,10,10)` (dark); same on ios |
| F10 Inbox toolbar square on ios | Passed on to F1: `platform/ios.css` toolbar capsule inside the glass query | | |
| F11 Music library tab bar off screen (shared) | Passed on to F1 and F8: `platform/ios.css` accessory capsule width, `apps/gallery-react/src/ios-screens/music-library.tsx` | | |
| F12 Rounded well in the ios alert | Passed on to F1: `platform/ios.css` 3704 (`--_fieldset-card-radius` in ds.chrome, so a recipe cannot win) | | |
| F13 Navbar web dropdown rule (minor) | Fixed. Menu tile: surface 2, square, a 1px bright rule drawn as a spread with no blur; square rows | panel `#1a1a1a` with no rule, rounded rows | panel `rgb(244,244,244)` / `rgb(17,17,17)` with `0 0 0 1px` `rgb(10,10,10)` / `rgb(245,245,245)`, radius 0; current page inverted (F05); `after/F13-navbar-*-web.png` |
| F14 Eyedropper selector (minor) | Fixed. The selector now names `> [data-part='footer'] > [data-part='eyedropper']` | radius 999px | radius 2px on ios and web, light and dark; hover veil square; `after/sheet-cp.png` |
| F15 Chip capsule (minor) | Fixed. New recipe: control corner; the neutral soft chip no fill with a 1px control rule, bright rule on hover, inverted on press | gray capsule | radius 2px, transparent, rule `rgba(10,10,10,0.52)` light, `rgba(255,255,255,0.4)` dark; selected chips keep the base inverted fill |
| F16 Dialog footer widths on ios (shared) | Passed on to F1: `platform/ios.css` footer rules after line 3300 (ds.chrome) | | |
| F17 PageShell nav sheet column (shared) | Passed on to F3: the Sidebar keeps its 260 width in the sheet (`components/Sidebar.css`, `components/PageShell.css`) | | |
| F18 SplitView two type scales on ios | Passed on to F1: no ios type size for the SplitView detail (`platform/ios.css` near 2078) | | |
| F19 Pager dots and progress tracks (minor) | Partly fixed. ProgressBar takes `--_progress-bar-radius: radius.xs` (2px), the dots platter `--_pagination-track-radius` (2px). The dots stay round: passed on to F3, `components/Pagination.css` 245, 247 and 265 draw them as pills with no radius property | | |
| F20 ColorPicker footer row sizes on ios | Passed on to F1 and F3: `platform/ios.css` 2030, `components/ColorPicker.css` 73 to 92 | | |
| F21 Sheet web handle pill (minor) | Fixed on web: `--_dialog-handle-radius: radius.xs` (2px). On ios the platform's pill stays (ds.chrome, `platform/ios.css` 3377), as ruled | 999px | 2px web, 999px ios |

## Q5 F4: the TabBar current item focus ring on ios

Not a defect any more, with no Studio change: F3 added
`--_tab-bar-ring-active` (`components/TabBar.css` 78 to 80), an inset ring
plus an inset band in `color.focus.halo`, which is white in Studio light
and black in Studio dark. Measured on the settings screen, focus on the
current item against the unfocused capture: light 2,792 pixels changed,
2,246 of them at 3:1 or more (max 19.8:1); dark 2,785 changed, 2,214 at
3:1 or more (max 19.3:1). Before F3's change the audit measured 0 pixels
at 3:1. Captures `before/Q5F4-tabbar-*-rest.png` and `-focus.png`.

## The radius properties of P1 E2

Studio's recipes now set the properties instead of restyling the parts:

- Slider and RangeSlider: `--_slider-track-radius`, `--_slider-thumb-radius`,
  `--_slider-bubble-radius` at radius.xs. The ios disc rule
  (`platform/ios.css` 263, the style query on `--_slider-thumb-radius`) no
  longer matches Studio: the thumb edge went from `border 1px` (the gray
  disc edge) to `border 0`, and no shadow (`box-shadow` is the Studio edge
  only: `0 0 0 1px` surface and the 0 halo). The override of the ios shadow
  is gone from the recipe. `after/slider-thumb-before-after.png`.
- ColorSlider: `--_color-slider-track-radius`, `--_color-slider-thumb-radius`.
- ColorArea: `--_color-area-thumb-radius`.
- Stepper: `--_stepper-indicator-radius` (the travel ring follows it).
- ColorSwatchPicker: `--_color-swatch-picker-item-radius`,
  `--_color-swatch-picker-check-radius`.
- NumberField: `--_number-field-stepper-radius` at the control corner (the
  stepper capsule Z1 saw is now square: outer corners 2px, inner 0).

Proof of no other change: element captures of the five pages on ios and
web, light, before and after: 9 of 10 are pixel identical; Slider ios
differs by 536 pixels, the thumb edge above.

## Files

Changed: `packages/styles/studio/recipes/Switch.css`, `Button.css`,
`Toast.css`, `Dialog.css`, `ColorPicker.css`, `Slider.css`,
`ColorSlider.css`, `ColorArea.css`, `Stepper.css`, `ColorSwatchPicker.css`.
New: `recipes/ActionSheet.css`, `Chip.css`, `Navbar.css`, `List.css`,
`Sidebar.css`, `NumberField.css`, `ProgressBar.css`, `Pagination.css`.
Generated: `packages/styles/studio/index.css`, `packages/styles/desk/index.css`.

## Commands

- `npm run typecheck`: passed, no errors.
- `npx vitest run packages/styles packages/css packages/lint --testTimeout=120000`:
  21 files, 116 tests passed (4 known Desk dark contrast failures listed by
  the gate as reported to the lead in wave 0, not failing).
- `DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform ios --component Switch`:
  43 passed, 0 failed.
- CONTRACT_RESULTS

## Decisions

- On ios Studio's Switch keeps its square bit: the thumb is as wide as it is
  tall on the platform's 63 track. The platform's 38 wide capsule thumb is
  geometry of a control, where the style wins (ruling 16).
- On ios the Dialog and AlertDialog are one flat tile: the bands are paint,
  and the platform's paddings (ds.chrome) were made for one surface, so the
  bands go there rather than fighting the paddings.
- Press is an inversion for every neutral icon, close and solid button, and
  the tone's solid cell for tone soft buttons. Accent tints press to the
  primary fill, for the same rule.
- In an active (inverted) List row, the neutral buttons take the row's ink
  and invert once more on press. Close buttons are left out there: their
  bloom would hide the glyph on hover.
- ActionSheet items are drawn by Studio only on web and macos; on ios and
  android the platform draws them.
- Chip neutral soft and outline now look the same in Studio, as Studio's
  neutral soft button already draws as an outline.

## Not done

- The ios ActionSheet note in F07 (Bottom placement plain rows against the
  capsule panel of the other placements) was not compared and not changed.
- The pager dots (F19): need a radius property in `Pagination.css` (F3).
- Arabic, android, forced colors and reduced motion were not captured for
  before and after.
