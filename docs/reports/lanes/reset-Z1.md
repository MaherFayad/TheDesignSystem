# Z1 The mobile components in Studio

Order: `docs/plan/reset-mobile.md`, section Z1. Style: `studio`. Lane:
ds-style. Edits only under `packages/styles/studio/`, plus the generated
`packages/styles/studio/index.css` (rewritten by `npx tsx scripts/gen-index.ts`).

## How it was checked

- Every component in the scope list, at `/c/<kebab>?style=studio`, in 8
  combinations: `platform` ios (390 by 844) and web (1280 by 800), light and
  dark, English (ltr) and Arabic (rtl). Full page captures, plus up to four
  overlays per page opened by their triggers (ActionSheet, AlertDialog,
  ColorPicker, DatePicker, SelectionMenu, SharePanel, Sheet, Dialog, Toast).
  About 700 captures.
- The ten iOS test screens at `/screens/ios/<id>/screen`, light and dark,
  English and Arabic, 390 by 844.
- Per capture: axe-core `color-contrast` and `target-size` (no violations
  anywhere, but axe left many text nodes as "incomplete" because of stacked
  backgrounds, so contrast was also measured by hand on the suspect parts);
  a probe that lists every element under the Studio theme with a round
  corner, a backdrop filter or a blurred shadow.
- Liquid on ios was opened beside Studio where a layout looked wrong
  (Dialog close, SectionIndex), to tell a Studio cause from a shared one.

## Defects found

| Component | Axis | What | Result |
| --- | --- | --- | --- |
| Banner | solid tone, light and dark, ios and web | The action button of a solid banner took Studio's neutral button ink (Button.css of this pack sits in `ds.recipes` and overrode the banner's on-solid ink): 2.69:1 on red and 3.47:1 on orange in light, 2.36:1 and 1.83:1 in dark (WCAG 1.4.3). | Fixed, `recipes/Banner.css`: the actions take the banner ink and outline again, a press inverts. Now 6.47, 5.02, 7.16, 9.22. |
| SegmentedControl | all, worst on ios | A capsule track and thumb (the component's default shape is the pill), not Studio's square control. On ios the selected thumb (surface 3 with a gray hairline on a 10 percent veil) was about 1.2:1 against the track in light and dark: selected and not selected were hard to tell apart. | Fixed, `recipes/SegmentedControl.css`: square cells in a 1px control border, the selected segment is the inverted cell (primary fill and text), no lens, no ink slide. Also fixes the DatePicker calendar switch and the settings and booking screens. |
| TabBar | ios, light and dark | The current tab was a 10 percent veil (about 1.2:1 to the bar) with the same glyph and a label one weight up: hard to tell apart, worse in dark. | Fixed, `recipes/TabBar.css`: the current item and the current search disc are inverted (bright fill, body colored glyph and label). Shape stays the platform's (ruling 16). Web keeps its pill behind the icon and bold label. |
| Calendar | ios and web | Round day discs (base `--_calendar-radius` is the pill). Today was a 10 percent tint disc, about 1.2:1, told by its weight only. | Fixed, `recipes/Calendar.css`: square day cells with the control corner, selected is the inverted cell, today a 1px rule in the bright text color. Also in DatePicker and the booking screen. |
| DatePicker | ios | The date and time chips have an 8px corner. | Fixed, `recipes/DatePicker.css`, through the four `--_button-radius-*` corners (the 8px comes from a `ds.chrome` rule a recipe cannot beat, see shared below). |
| Dialog | ios | The close control sat 1.5px above the panel, inside the curve of the 34px corner (Studio's dense band padding places it; the ios title padding does not). | Fixed, `recipes/Dialog.css`: on ios the band padding puts the close 12 in from the top and the end edge. Web unchanged (measured). |
| SelectionMenu | ios and web | The base capsule with capsule items, not Studio's menu tile. | Fixed, `recipes/DropdownMenu.css`: SelectionMenu joins Studio's menu family (square tile, 1px bright rule, inverted lit item), items square. |
| SharePanel | ios | Targets in a 16px rounded square, actions in circles, the preview rounded: the kit's shapes, not Studio's. | Fixed, `recipes/SharePanel.css`: targets, actions, the press area and the preview take the control corner. Sizes stay the platform's. People stay round pictures. |
| ColorPicker | ios | The view switch (Grid, Spectrum, Sliders) is a capsule on a square track. | Shared, not fixed: `packages/css/src/platform/ios.css` line 3717 sets `--_tabs-radius` to the pill inside `@layer ds.chrome`, which a recipe cannot beat. |
| DatePicker, Calendar, WheelPicker, ColorPicker, ColorField, ColorSwatchPicker | ios | Their ios rules (`platform/ios.css` lines 3639 to 3727, order F3) sit in `@layer ds.chrome`, though anatomy.md puts these components on the controls side. A style cannot set their corners through the documented properties (the DatePicker chip at line 3659 needed the corner properties). | Shared, not fixed. The rules belong in `ds.platform`. |
| Dialog | ios | The ios title padding (`platform/ios.css` lines 3170 to 3178, `padding-inline: var(--_dialog-padding)`) replaces the base reserve for the close control (`components/Dialog.css` line 338), so a long title can run under the close control. The close placement reads `--_dialog-band-padding-*`, which the ios chrome sets for Sheet (line 3253) but not for Dialog (lines 3149 to 3156). | Shared, not fixed. Studio works around the placement only. |
| ColorSwatchPicker, ColorSlider | ios and web | Round swatches in the row and grid add button, capsule slider tracks. | Shared, not fixed: drawn with `border-radius: var(--ds-radius-pill)` and no private property (`components/ColorSwatchPicker.css` lines 115 and 182, `components/ColorSlider.css` lines 114 and 131). Left as is: they read as colour marks. |
| NumberField (settings, booking screens) | ios | The stepper variant is a capsule (`components/NumberField.css` line 149) and its value reads at 11px in Studio (13 to 14 in the other styles). | Not in the scope list; reported, not fixed. |
| AlertDialog, Dialog, Sheet, ActionSheet, Toast, Navbar, TabBar | ios | Capsule buttons in sheet, alert and action sheet footers (`platform/ios.css` lines 3210, 3386, 3593), round bar buttons (2877), capsule toasts (3461), the capsule tab bar. | Not a defect by ruling 16: the platform owns chrome geometry and `ds.chrome` wins. Studio paints them (flat fills, 1px rules, no blur, no soft shadow: the probe found no blur radius and no blurred shadow anywhere under Studio). Noted because the order asks for square corners: changing them needs a ruling. |
| SectionIndex | ios, full page capture | Two indexes draw on top of each other in the full page capture. | Same in Liquid; the live layout measures the two index boxes apart. A capture or demo artifact, not a Studio cause. Not fixed. |
| AlertDialog | ios, Arabic | The alert renders `dir="ltr"` on an Arabic page. | Known shared item C6.1 (overlay portals keep `dir` and `lang`). Not fixed. |
| TabBar | ios | The expanded search field draws its own capsule stroke inside the bar's capsule (a double stroke). | Not fixed: readable, no criterion fails; a matter of taste. |

Explicit `shape="pill"` buttons in the test screens (Play all, Book table,
Share workout, Show next tip) stay capsules: the screen asks for the pill and
Studio's `radius.pill` token is a pill. The SegmentedControl is the exception
because its pill is only the component default.

## Scope change during the order

The lead moved Calendar, ColorArea, ColorField, ColorPicker, ColorSlider,
ColorSwatch, ColorSwatchPicker, DateField, DatePicker, TimeField,
WheelPicker, Stepper and Slider to order Z3 while this order ran.
`recipes/Calendar.css` and `recipes/DatePicker.css` were already written and
checked; they are finished as they stand and listed here, and Z1 makes no
further change in that group. The findings above for that group (the
ColorPicker view switch, the colour discs, the F3 rules in `ds.chrome`) are
for Z3 to take or leave. Note for Z3: Studio's `recipes/SegmentedControl.css`
(Z1) also draws the Hijri and Gregorian switch inside DatePicker.

## Decisions

- Studio draws the SegmentedControl square whatever the shape axis says,
  since the pill there is the default, not a page's choice.
- Studio marks the current tab and the selected segment by inversion, the
  same mark as a Studio press, a lit menu row and the primary cell.
- Where a misplaced `ds.chrome` rule blocks a control's corner, the recipe
  uses the four `--_button-radius-*` corner properties (DatePicker only),
  not a direct declaration.

## Files changed

- `packages/styles/studio/recipes/Banner.css` (new)
- `packages/styles/studio/recipes/Calendar.css` (new, written before the scope change; Z3 owns it now)
- `packages/styles/studio/recipes/DatePicker.css` (new, written before the scope change; Z3 owns it now)
- `packages/styles/studio/recipes/SegmentedControl.css` (new)
- `packages/styles/studio/recipes/SharePanel.css` (new)
- `packages/styles/studio/recipes/TabBar.css` (new)
- `packages/styles/studio/recipes/Dialog.css` (ios close placement)
- `packages/styles/studio/recipes/DropdownMenu.css` (SelectionMenu joins the menu family)
- `packages/styles/studio/index.css` (generated by `npx tsx scripts/gen-index.ts`)

## Commands run

CONTRACT_RESULTS

## Not checked

- Interaction states by hand (hover, press, drag, swipe of SwipeActions,
  scroll collapse of the Navbar large title): only rest and open states
  were captured. The contract runs cover focus and target size.
- The folded and duo frames of the test screens, android and macos, the
  more contrast and reduced transparency axes.
- DateField, TimeField and SplitView were captured and looked at once on ios
  and web; nothing was found, but they had no second pass.
- Overlays deeper than four triggers per page.

Before and after contact sheets (studio only) are outside the repo, in the
scratch folder `z1/sheets/`: `before-<Component>.png` for all 31,
`after-<Component>.png` for the 8 changed, and
`screen-<id>-before-after.png` for the ten screens.
