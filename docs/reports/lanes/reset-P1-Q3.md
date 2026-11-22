# Round 1, lane Q3: the mobile set on android

Audit only. No file changed but this report. All looks stay proposed.

## How it was run

- Gallery on port 5316, React, `platform=android`, 412 by 915, English,
  `dir=ltr`, `chrome=0`, Chromium through Playwright, two pages at most.
- 32 components of the mobile set, four styles (studio, desk, neutral,
  liquid), light and dark: 256 pages. On each page every `[data-demo-trigger]`
  and every DatePicker and compact ColorPicker trigger was opened (up to 14
  per page), about 1900 overlays in all.
- Each page and each overlay: computed colour contrast of every text node
  (WCAG 1.4.3, colours composited up the ancestor chain), targets with their
  hit part (2.5.8 at 24, and 48 where the platform file promises it),
  sideways scroll, then a look at a picture of each page and overlay.
- Every finding below was measured again on a fresh page in a targeted run
  near the end, because shared CSS was changing during the audit
  (`android.css` lines moved by a few while I worked). Line numbers are the
  ones read at the end.
- Pictures: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/q3/`
  (below as `q3/`). Full pages are `q3/<component>-<style>-<scheme>.png`,
  overlays `...-o<n>.png`, targeted runs `q3/x-*.png`, finding crops
  `q3/F<nn>-*.png`.

## What is clean

- No sideways scroll at 412 on any of the 256 pages or any overlay.
- No text under 4.5:1 (or 3:1 for large text) from computed colours on any
  page or overlay. The few hits were false: text over glass where the
  composite is unknown (the Desk dark ColorPicker tab label reads dark on
  yellow) and toasts caught while fading. Both checked by eye.
- Three overlaps seen once in the sweep did not come back on a fresh page:
  Desk light ColorField (`#1e6fd9` on the next label), Liquid light
  TimeField (`value: 21:05` on the Arabic label), and toasts drawn over
  each other. All were frames caught mid layout or mid animation.
- Snackbars: one row, 48 tall, 16 from the screen edge, no overlap when three
  arrive together, in all four styles.
- The navigation bar, bottom sheets, the share panel and alert dialogs take
  the android geometry in all four styles.

## The android time dialog (the known gap)

The boxes are now styled in all four styles and both schemes: hour and
minute boxes 96 by 72, the day period 56 by 72, 8 px corner, the highest
surface, digits at 45 px, the colon at 57 px, a 2 px ring in the primary
edge on the focused box. What is left is findings 6 and 7 (Desk's filled band
behind the boxes; no tonal fill on the focused box) and finding 4 (Desk shows
window lights and no close control on this dialog and on the date dialog).

## Findings

### 1. SearchField: the inner input draws a 56 tall filled box over the field

- Component: SearchField (and every field built on it).
- Axes: studio and desk, light and dark, rest state. Neutral and liquid get
  the same 56 tall box, but transparent.
- What: the field is 32, 36 or 40 tall by size; the input inside it is a
  `[data-ds='input'][data-part='control']` that the android field rule
  turns into a 56 tall filled field with 16 sides. In Studio and Desk it
  paints surface 3 and runs 12 px above and below the field, over its border
  and over the field above and below it.
- Measured: studio light field 384 by 32 at y 70, inner box 321 by 56 at
  y 58, fill rgb(233, 233, 233); desk dark inner fill rgb(50, 50, 50).
- Cause: `packages/css/src/platform/android.css` 633 and 640 to 648 select
  every `[data-ds='input']`, nested control parts too (no `:not([data-part])`).
- Severity: blocker.
- Pictures: `q3/F01-searchfield-studio.png`,
  `q3/F01-searchfield-desk-dark.png`.

### 2. TabBar: the expanded search field breaks out of its capsule

- Component: TabBar, "Search item turned into its field while current".
- Axes: all four styles, light and dark (Desk light page timed out in the
  sweep; Desk dark checked).
- What: same cause as 1. Inside the 184 by 40 capsule the input is 145 by
  56, so in Studio and Desk a grey box sticks out above and below the
  capsule outline. In Neutral and Liquid the 16 and 18 px side padding
  leaves 102 to 113 px for "Songs, artists and lists", cut to "Songs,
  artist". The four items beside the field are 46 wide, under 48.
- Measured: studio light capsule y 803 h 40, input y 795 h 56; neutral input
  text box 102 px.
- Cause: `android.css` 633 to 648 (as 1); `TabBar.css` 200 to 213 gives the
  field half the bar.
- Severity: major.
- Pictures: `q3/F02-tabbar-search-studio.png`,
  `q3/F02-tabbar-search-neutral.png`.

### 3. Desk Input: a bowl shape (square top, capsule bottom)

- Component: Input, so every field in Sheet, Dialog and the field demos.
- Axes: desk, light and dark, rest and focus.
- What: Desk's recipe sets the field radius to the pill through
  `--_input-radius`; the android filled field sets
  `border-start-start-radius` and `border-start-end-radius` directly and
  drops every border but the bottom one. The field is square on top and a
  half capsule underneath, the bottom line bending with it; the focus ring
  follows the bowl.
- Measured: radii 3, 3, 999, 999 px; border widths top 0, bottom 1, sides 0;
  height 56.
- Cause: `android.css` 640 to 648 against
  `packages/styles/desk/recipes/Input.css` 27 to 29.
- Severity: major.
- Picture: `q3/F03-desk-field-bowl.png`.

### 4. Desk Dialog: window lights and no close control on android

- Component: Dialog, and the DatePicker date and time dialogs.
- Axes: desk, light and dark.
- What: the title bar shows close, minimize and zoom lights. Minimize and
  zoom do nothing on a phone; the only way out by touch is a 24 by 24
  light, half the 48 target. Studio, Neutral and Liquid show a close button.
- Measured: controls 72 by 24; close, minimize, zoom each 24 by 24.
- Cause: `android.css` 1471 hides the lights only for `alert-dialog` and
  `sheet`; the Dialog rules that lane E1 wrote for ios (`ios.css` 3341 to
  3355) have no android twin.
- Severity: major.
- Picture: `q3/F04-desk-dialog-lights.png`, also
  `q3/F06-desk-time-dialog.png`.

### 5. Liquid Slider and RangeSlider: the white handle cannot be seen

- Component: Slider, RangeSlider.
- Axes: liquid, light, rest (dark is fine: white on the dark track).
- What: on android the handle is a 4 by 44 bar. Liquid paints it white and
  keeps the control edge only on the disc it draws elsewhere; here the edge
  width is 0 and there is no shadow. At the minimum value no fill marks the
  place, so the white bar is the only cue.
- Measured: handle rgb(255, 255, 255), 1.1:1 on the page rgb(242, 243, 247),
  1.45:1 on the empty track rgb(211, 213, 221). Needs 3:1 (1.4.11).
- Cause: `packages/styles/liquid/recipes/Slider.css` 25 to 27 (edge colour,
  no width on the bar) with `android.css` 516 to 541 (bar shape, `::after`
  off).
- Severity: major.
- Picture: `q3/F05-liquid-slider-handle.png`.

### 6. Desk time dialog: the field's filled band shows behind the boxes

- Component: DatePicker time dialog (TimeField in a Dialog).
- Axes: desk, light and dark.
- What: the three boxes sit on a 290 px wide filled band, the Desk TimeField
  fill, so the row reads as a box with boxes in it.
- Measured: band fill rgba(18, 18, 17, 0.06) in light, boxes rgb(240, 239,
  236).
- Cause: `packages/styles/desk/recipes/TimeField.css` 12 to 15 sets
  `--_date-field-bg`; the android dialog rule (`android.css` 1691 onward)
  clears the border but not the fill.
- Severity: major.
- Picture: `q3/F06-desk-time-dialog.png`.

### 7. Time dialog: the focused box gets no tonal fill

- Component: DatePicker time dialog.
- Axes: all four styles, light and dark, focus.
- What: the rule's own comment says the focused box takes the tonal fill;
  it keeps surface 3, so focus shows by the 2 px ring alone. The colon also
  sits on the baseline, lower than the digits' middle.
- Measured: focused hour box rgb(233, 233, 233) (studio light), rgb(239,
  241, 244) (neutral light), same as the unfocused boxes.
- Cause: `android.css` 1718 sets `background-color` on the segment directly,
  which beats `DateField.css` 147 and 148 (`:focus` reads
  `--_date-field-segment-bg-focus`).
- Severity: minor.
- Picture: `q3/F07-time-dialog-focus.png`.

### 8. Icon buttons at sm and lg keep a 16 px glyph

- Component: Navbar (size lg bar, the side placement actions), and any
  IconButton or CloseButton not at md.
- Axes: all four styles, light and dark.
- What: android grows the glyph to 24 only at md. An lg icon button is 56
  tall and 58 to 66 wide with a 16 glyph, so the lg bar's menu glyph is
  smaller than the md bar's.
- Measured: lg "Search the board" box 66.5 by 56 (neutral), 58.2 by 56
  (studio), icon 16 by 16; md menu 40 by 40, icon 24 by 24.
- Cause: `android.css` 111 to 116 (`[data-size='md']` and no size only).
- Severity: major.
- Picture: `q3/F08-navbar-lg-icon.png`.

### 9. Desk light: selected states shown by the yellow fill alone

- Component: Calendar and DatePicker inline (selected day), SegmentedControl
  (selected segment), WheelPicker (selected band), TabBar pill.
- Axes: desk, light, selected.
- What: the selected day keeps the same dark text as every other day; only
  the yellow fill marks it, and the yellow has almost the luminance of the
  desk. The token's own note says `primary.border` must carry 1.4.11; on
  these parts no border is drawn.
- Measured: Calendar selected fill rgb(255, 216, 77) on rgb(228, 226, 221),
  1.07:1. Needs 3:1.
- Cause: `packages/styles/desk/tokens.light.json` 588 to 595
  (`color.primary.fill`, also `tint` and `tint-hover`); on android the
  segmented thumb and wheel band read `primary-tint-hover` (`android.css`
  553 and the wheel rule 1656 to 1662) with no edge.
- Severity: major.
- Picture: `q3/F09-desk-calendar-selected.png`.

### 10. ActionSheet, center and anchored: square bottom corners, boxed rows

- Component: ActionSheet with `placement` center or anchored.
- Axes: all four styles, light and dark.
- What: the bottom sheet rules apply to every placement. A centred card gets
  28 px top corners and square bottom corners, and its soft rows (bordered
  in Studio, Neutral, Desk) stack as square boxes with no gap.
- Measured: panel radius 28, 28, 0, 0; rows radius 0, 1 px border rgb(79,
  91, 115) (neutral dark).
- Cause: `android.css` 1610 to 1622 (no `[data-placement='bottom']` guard).
- Severity: minor (android picks bottom on auto).
- Picture: `q3/F10-actionsheet-center.png`.

### 11. ActionSheet, bottom: Cancel sits on the screen edge

- Component: ActionSheet, bottom placement.
- Axes: all four styles, light and dark.
- What: no space under the last row; Cancel ends at the screen's bottom edge
  where the gesture bar sits.
- Measured: panel padding block end 0; Cancel row y 867 to 915 of 915.
- Cause: `ActionSheet.css` 186 reads `env(safe-area-inset-bottom)` only, not
  `--ds-inset-safe-bottom`, which the android tab bar uses (`android.css`
  1276).
- Severity: minor.
- Picture: `q3/F11-actionsheet-bottom.png`.

### 12. Studio AlertDialog: a white band across the android card

- Component: AlertDialog.
- Axes: studio, light and dark.
- What: android removes the style's header and footer bands, but Studio
  paints the panel surface 2 and the description surface, so a full width
  stripe runs across the middle of the 28 px card.
- Measured: panel rgb(244, 244, 244), description rgb(255, 255, 255), 358 by
  57.
- Cause: `packages/styles/studio/recipes/Dialog.css` 75 to 82.
- Severity: minor.
- Picture: `q3/F12-studio-alert-band.png`.

### 13. SegmentedControl: the shape prop does nothing on android

- Component: SegmentedControl.
- Axes: desk, neutral, liquid, light and dark (Studio keeps its own square).
- What: `shape="default"` and `shape="square"` both draw the capsule.
- Measured: default and square track radius 999 px (neutral light).
- Cause: `android.css` 549 sets `--_segmented-control-radius` to the pill
  for every shape, after `SegmentedControl.css` 102 to 108.
- Severity: minor.
- Picture: `q3/F13-segmented-shape.png`.

### 14. Sheet at half height: the footer is off the screen

- Component: Sheet, "Share at half height".
- Axes: all four styles, light and dark (likely every platform).
- What: the panel keeps its full height and slides half out; the footer
  actions sit 433 px below the screen until the sheet is dragged up.
- Measured: panel y 457, height 891; footer y 1284 on a 915 screen.
- Cause: the half detent moves the panel instead of sizing it
  (`Dialog.css` sheet rules); not android only.
- Severity: minor.
- Picture: `q3/F14-sheet-half.png`.

### 15. Desk SwipeActions: pill actions where the platform asks square ends

- Component: SwipeActions.
- Axes: desk, light and dark.
- What: the actions behind a row are 48 by 85 capsules; the android rule says
  square ends. Measured on the closed row (a mouse drag did not open it).
- Measured: action radius 999 px (desk); 0 px in the other three styles.
- Cause: Desk button radius beats `android.css` 1134 to 1137 (`--_swipe-actions-radius: 0`).
- Severity: minor (could be a style choice).
- Picture: `q3/F15-desk-swipe-rows.png` (closed rows).

### 16. Targets over 24 but under the promised 48

- Component and measured size: ColorSlider thumb 32 by 32; ColorArea thumb
  36 by 36; ColorSwatchPicker grid items 32 by 32 (row items are 48);
  SectionIndex keys 24 by 24; DateField and TimeField segments 24 to 25
  wide (the field is 56 tall); SearchField root 32, 36, 40 tall; TabBar items
  46 wide beside the expanded field; Desk dialog lights 24 by 24.
- Axes: all four styles, light and dark (lights: desk).
- What: all pass 2.5.8 at 24; none has the 48 target the android header
  promises ("a 48dp least target").
- Cause: no android rule for these parts (`android.css` has none for
  ColorSlider, ColorArea thumbs, the grid swatch picker, SectionIndex size,
  SearchField height).
- Severity: minor.
- Picture: `q3/F16-color-slider-thumb.png`.

### 17. SectionIndex: the never collapsing index draws over the one above

- Component: SectionIndex, "Collapse auto and never in a column 20rem tall".
- Axes: all four styles, light and dark (likely every platform).
- What: 24 keys at 24 px do not fit the 320 px column; the index spills up
  and down and its letters land on the auto index's letters.
- Measured: keys 24 by 24, about 600 px of keys in a 320 px column.
- Cause: `SectionIndex.css` 25 (`--_section-index-size` at the 24 target)
  with collapse never; demo layout.
- Severity: minor.
- Picture: `q3/F17-section-index-overlap.png`.

## Ranked top 15

1. 1, SearchField inner box over the field (blocker).
2. 2, TabBar expanded search breaks its capsule.
3. 3, Desk Input bowl shape.
4. 4, Desk Dialog lights and no close.
5. 5, Liquid slider handle 1.1:1.
6. 9, Desk light selected yellow 1.07:1.
7. 6, Desk time dialog band.
8. 8, sm and lg icon buttons keep a 16 glyph.
9. 7, time dialog focus without tonal fill.
10. 13, segmented shape prop lost.
11. 10, ActionSheet center and anchored corners.
12. 11, ActionSheet Cancel on the screen edge.
13. 12, Studio alert band.
14. 16, targets under 48.
15. 14, half height sheet footer off screen.

Counts: 1 blocker, 7 major, 9 minor.

## Component by style

| Component | studio | desk | neutral | liquid |
| --- | --- | --- | --- | --- |
| ActionSheet | 10, 11 | 10, 11 | 10, 11 | 10, 11 |
| AlertDialog | 12 | pass | pass | pass |
| Banner | pass | pass | pass | pass |
| Calendar | pass | 9 | pass | pass |
| ColorArea | 16 | 16 | 16 | 16 |
| ColorField | pass | pass | pass | pass |
| ColorPicker | 16 | 16 | 16 | 16 |
| ColorSlider | 16 | 16 | 16 | 16 |
| ColorSwatch | pass | pass | pass | pass |
| ColorSwatchPicker | 16 | 16 | 16 | 16 |
| DateField | 16 | 16 | 16 | 16 |
| DatePicker | 7 | 4, 6, 7, 9 | 7 | 7 |
| TimeField | 16 | 16 | 16 | 16 |
| WheelPicker | pass | 9 | pass | pass |
| List | pass | pass | pass | pass |
| SectionIndex | 16, 17 | 16, 17 | 16, 17 | 16, 17 |
| SelectionMenu | pass | pass | pass | pass |
| SharePanel | pass | pass | pass | pass |
| Stepper | pass | pass | pass | pass |
| SwipeActions | pass (closed only) | 15 | pass (closed only) | pass (closed only) |
| TabBar | 2, 16 | 2, 9, 16 | 2, 16 | 2, 16 |
| Navbar | 8 | 8 | 8 | 8 |
| PageShell | pass | pass | pass | pass |
| Pager | pass | pass | pass | pass |
| Sheet | 14 | 3, 14 | 14 | 14 |
| Dialog | pass | 4 | pass | pass |
| Toast | pass | pass | pass | pass |
| Slider | pass | pass | pass | 5 |
| RangeSlider | pass | pass | pass | 5 |
| SegmentedControl | pass | 9, 13 | 13 | 13 |
| SearchField | 1, 16 | 1, 3, 16 | 16 | 16 |
| SplitView | pass | pass | pass | pass |

## Not reached

- The screens under `/screens/ios/`: the host always renders them with
  `platform="ios"` (`apps/gallery-react/src/ios-screens/Host.tsx` 39 to 66
  and 309), so `platform=android` does not reach them. They were loaded in
  all four styles and both schemes and showed the ios 44 targets.
- SwipeActions open: a mouse drag did not open a row; the open actions were
  measured closed only.
- Hover and pressed states, the ripple, reduced motion and forced colors
  were not checked. Focus was seen only where an overlay moves it.
- Desk light TabBar: the page timed out twice in the sweep; Desk dark and
  the targeted search field check stand in for it.
- 1.4.11 was measured for the parts named above only, not for every edge
  of every control.
- The renderer crashed twice during full page pictures (List studio light,
  TabBar studio dark); both pages passed on the retry. I read this as
  memory on very tall pictures, not a page defect.
