# Round 1, lane Q2: fresh eyes audit of Desk on mobile

Lane: ds-qa. Style: `desk`. No file was changed but this report.

## How it was checked

- Every component of the mobile set (32 pages) in Desk, light and dark, on
  `platform=ios` at 390 by 844 and `platform=web` at 1280 by 800, English,
  full page: 128 pages. Captured 02:04 to 02:49 UTC.
- Every overlay trigger on each page (`aria-haspopup` or `data-demo-trigger`)
  opened and captured, with the triggers inside an open overlay opened one
  level deep: about 1,150 overlay pictures. Arabic triggers were skipped
  (lane Q4).
- Hover, keyboard focus (focus visible) and press on every distinct
  interactive element of each page (deduplicated by part, role and state
  attributes, up to 40 a page): 128 pages, 02:37 to 03:06 UTC.
- The ten screens under `/screens/ios/` (bare screen, `frame=phone`, 390 by
  844), light and dark, with every menu, popover and sheet trigger on them
  opened: 20 screens and 112 overlays, 02:49 to 02:58 UTC.
- Contrast: computed colours composited through every ancestor fill; every
  text under 4.8:1 or on glass or a gradient was measured again on real
  pixels (the glyphs hidden, the backdrop under them read from the
  screenshot, the text colour composited on it). The ratios below are the
  pixel ones unless marked computed.
- Targets: the box of each control joined with its hit part, with the
  spacing exception of 2.5.8.
- Liquid captured beside Desk for the cases below (same page, same trigger)
  for completeness of states only.
- Every finding below was measured again between 03:06 and 03:08 UTC on the
  current tree (the "rechecked" time), since three lanes edit shared CSS.

Pictures (outside the repo):
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/q2/`
with `raw/` (full pages and overlays, `desk-<component>-<platform>-<scheme>[-ov<n>].png`),
`focus/` (each element in focus), `cmp/` (Desk and Liquid) and `crops/`
(the pictures named in the findings). Below, `crops/...` is relative to
that folder.

## Known items, confirmed or denied

- Dialog on ios shows the window lights (Z2, ios.css about 3232): still
  there at 02:18 (ios dark) and 02:06 (ios light). With the lights, a long
  title squeezes to about 130px and runs to seven lines ("Move the 24 boards
  ..."). E1 is on it.
- Navbar wrapped large title overlaps its lines (Z2, Link.css 275): still
  there at 02:07. E2 is on it.
- TabBar demo: side column fields overlap and the accessory row overlaps
  its label (Z2): still there at 02:06. E3 is on it.
- Desk Input placeholder on light (Z2 fix): holds, the placeholder is
  `rgb(87, 85, 79)`.
- SegmentedControl yellow thumb (Z2 fix): holds. The unselected labels next
  to it now fail on ios light: finding 2.
- The four known Desk dark glass failures of the contrast gate were not
  reopened.
- The date chips, the wheel band, the colour field and the slider thumb on
  ios (being fixed by another lane) are not reported.

## Findings

Severity: blocker (a WCAG AA failure on a primary action, or a broken
state), major (a WCAG failure, a lost state, or a clear break from Desk),
minor (polish).

### 1. Banner, solid tone: the action label is unreadable

- Axes: light and dark, ios and web, rest.
- What: in a solid Banner (danger, warning) the action Button keeps Desk's
  neutral glass pill ink: dark ink on the red fill in light, light ink on
  the salmon fill in dark. The base means the banner's on-solid ink
  (Banner.css 259 to 274); Liquid shows white on red.
- Measured: "Open status page" 2.15:1 (pixel, light and dark, ios and web),
  `rgb(38, 37, 34)` on `rgb(185, 28, 28)`; needs 4.5:1. The Arabic warning
  action "إضافة طريقة دفع" has the same cause.
- Cause: `packages/styles/desk/recipes/Button.css` lines 28 to 38 (the
  neutral soft and solid pill sets `--_button-fg` and `--_button-bg` in
  `ds.recipes`, which beats `packages/css/src/components/Banner.css` lines
  259 to 274 in `ds.component`).
- Captured 02:05 (ios light), 02:11 (ios dark), 02:22 and 02:34 (web).
  Rechecked 03:06.
- Severity: blocker.
- Pictures: `crops/banner-solid-danger-action-ios-light.png`,
  `crops/cmp-banner-solid-dark-desk-vs-liquid.png`.

### 2. SegmentedControl on ios light: unselected labels under 4.5:1

- Axes: light, ios, rest (every size and shape, and the segmented controls
  of the Calendar, DatePicker, ColorPicker and the settings screen).
- What: the track is overlay 10 on Desk's darker paper; the unselected
  labels are the muted text.
- Measured: 4.06 to 4.19:1 (pixel), `#57554f` on `#c4c2be`, 13px medium;
  needs 4.5:1. Web light (overlay 5 track) passes; dark passes.
- Cause: `packages/css/src/platform/ios.css` line 319
  (`--_segmented-control-bg: overlay-10`) with no Desk rule for the
  unselected ink in `packages/styles/desk/recipes/SegmentedControl.css`.
- Captured 02:36 (pixel). Rechecked 03:06 (track `rgba(18, 18, 17, 0.1)`,
  label `rgb(87, 85, 79)`).
- Severity: major.
- Picture: `crops/segmented-unselected-labels-ios-light.png`.

### 3. Music library screen: Play all and Shuffle all under 4.5:1

- Axes: light, ios (screen `music-library`), rest.
- What: the neutral fill capsule (overlay 10) on Desk's paper carries the
  gold primary ink. Liquid shows blue on a pale capsule.
- Measured: 4.21:1 (pixel), `#765700` on `#cecdc8`, 17px semibold; needs
  4.5:1. Dark passes.
- Cause: `packages/css/src/components/Button.css` lines 619 to 628
  (`data-fill='neutral'` soft: overlay 10 fill, primary on surface ink);
  Desk restates neither.
- Captured 02:49, pixel 03:04.
- Severity: major.
- Picture: `crops/cmp-music-lib-desk-vs-liquid.png`.

### 4. Danger text on Desk's dark windows under 4.5:1

- Axes: dark; ios and web; Dialog and AlertDialog with the danger tone.
- What: the danger title sits on the yellow tinted title bar, and the danger
  footer action on the glass pill; both read `#f87171`.
- Measured: Dialog title "Delete the project Spring launch?" 4.36:1 on ios
  (pixel, 17px semibold) and 4.49:1 on web (pixel, 14px semibold, both
  AlertDialog and Dialog); Dialog footer "Delete project" 4.37 to 4.43:1 on
  ios (pixel). AlertDialog footer labels sit at 4.50:1, at the limit.
- Cause: `packages/styles/desk/tokens.dark.json` line 810
  (`state.danger.text` `#f87171`) on the title bar tint of
  `packages/styles/desk/recipes/Dialog.css` lines 90 to 93 and the control
  fill; `packages/css/src/components/Dialog.css` line 197 sets the danger
  title.
- Captured 02:26 (ios), 03:02 (web).
- Severity: major.
- Picture: `crops/dialog-danger-title-ios-dark.png`.

### 5. Fields inside a grouped well: the pill ring hugs the text

- Axes: light and dark, ios and web, focus and rest; AlertDialog with fields
  ("Add a link", "New folder"), Sheet "New list" and every grouped Fieldset.
- What: the plain input inside the well has no inline padding, and Desk
  gives it the pill corner. On focus the 2px ring is a capsule that touches
  the first letter; the placeholder is cut with no ellipsis ("For example,
  launch checklis"). Liquid keeps 6px and reads as a row.
- Measured: `border-radius: 999px`, `padding-inline-start: 0px` (Liquid
  6px, 0px).
- Cause: `packages/styles/desk/recipes/Input.css` lines 27 to 29
  (`:not([data-part])` also matches the plain variant inside a well; it
  needs `:not([data-variant='plain'])` or a well rule).
- Captured 02:21 (ios), 02:23, 02:33 (web). Rechecked 03:06.
- Severity: major.
- Pictures: `crops/alertdialog-field-focus-ios-light.png`,
  `crops/cmp-sheet-newlist-desk-vs-liquid.png`,
  `crops/cmp-alert-addlink-desk-vs-liquid.png`.

### 6. DatePicker chip: invalid and open states lost

- Axes: light and dark, ios and web.
- What: the invalid chip keeps the dark ink (Liquid turns it red), so the
  field shows invalid only by its label and message. The open chip is drawn
  the same as at rest (Liquid turns its text the accent), so open and closed
  cannot be told apart.
- Measured: invalid chip `rgb(38, 37, 34)`; base asks for the danger text.
  Open and rest pictures identical.
- Cause: `packages/styles/desk/recipes/Button.css` lines 28 to 38 again (the
  neutral recipe wins over `packages/css/src/components/DatePicker.css`
  lines 90 to 97). Same root as finding 1.
- Captured 02:05, 03:01. Rechecked 03:06.
- Severity: major.
- Pictures: `crops/cmp-dp-invalid-desk-vs-liquid.png`,
  `crops/datepicker-open-chip-same-as-rest-ios-light.png`.

### 7. Popover with no title shows an empty yellow title bar

- Axes: light and dark, ios and web; the DatePicker popover (every date
  trigger), and any Popover opened without a title.
- What: a 36px yellow band with nothing in it above the calendar.
- Measured: title bar height 36px, text "", fill
  `rgba(255, 216, 77, 0.24)`.
- Cause: `packages/react/src/components/Popover/Popover.tsx` lines 338 to
  352 render the TitleBar whenever the style turns the part on, title or
  not (no title and no close). Desk only.
- Captured 02:05 (ios), 02:23 (web). Rechecked 03:06.
- Severity: major.
- Pictures: `crops/cmp-datepicker-popover-desk-vs-liquid.png`,
  `crops/datepicker-popover-empty-titlebar-ios-light.png`.

### 8. Sheet on ios: the title bar crams close, action and confirm

- Axes: light and dark, ios; sheets with a confirm ("New list", "Pass
  details", the pass detail screen).
- What: Desk moves the header into its title bar, where the iOS rules for
  the header no longer apply: the close is 34 by 34, the confirm a labelled
  pill 113 by 34 with a 13px label, drawn after the close. Liquid has round
  44 close, action and check confirm.
- Measured: close 34x34, header action 44x44, confirm 113x34 (Liquid 44x44
  each).
- Cause: `packages/react/src/components/Sheet/Sheet.tsx` lines 637 to 660
  (the title bar path puts close and confirm in the bar's actions) with
  `packages/css/src/platform/ios.css` lines 3619 to 3640 written only for
  `> [data-part='header'] > [data-part='confirm']`. E3 is moving the header
  action into the refraction parts; this is the size and order, not that.
- Captured 02:23. Rechecked 03:06.
- Severity: major.
- Picture: `crops/cmp-sheet-pass-desk-vs-liquid.png`.

### 9. TabBar on web is a square flat strip

- Axes: light and dark, web.
- What: Desk's tab bar on web is a square, solid, edgeless bar with the base
  look; Liquid's is a glass capsule. Nothing in it says Desk but the gold
  current item.
- Measured: `border-radius: 0px`, background `rgb(248, 247, 245)`, no
  backdrop filter, no shadow.
- Cause: `packages/styles/desk/recipes/TabBar.css` (14 lines) sets only the
  current ink; no Desk geometry or glass for web.
- Captured 02:29, 02:43. Rechecked 03:07.
- Severity: major.
- Pictures: `crops/cmp-w-tabbar-desk-vs-liquid.png`, `crops/tabbar-web-light.png`.

### 10. Two selection marks: yellow in controls, gray in navigation

- Axes: light and dark, ios and web.
- What: Tabs, SegmentedControl, TabBar, Calendar and the Select menu mark
  the current or selected item in Desk's yellow. The current row of List,
  the current item of the Sidebar in the PageShell navigation sheet, and the
  current page in the Navbar site menu ("Docs") use a gray overlay 10 fill;
  the Navbar on web marks the current link with weight only (Liquid uses
  its accent). On the List the fill is the only cue for the current row.
- Measured: List current row fill `#e4e2dd` on `#ffffff` rows (1.27:1,
  computed), the same in Liquid.
- Cause: `packages/css/src/components/List.css` lines 99 and 193,
  `Sidebar.css` 332, `Navbar.css` 297 to 300; Desk has no recipe for them.
- Captured 02:06, 02:08, 02:23. Rechecked 03:07 (list).
- Severity: major (consistency).
- Pictures: `crops/cmp-list-variants-desk-vs-liquid.png`,
  `crops/pageshell-nav-sheet-ios-light.png`,
  `crops/cmp-w-navbar-desk-vs-liquid.png`.

### 11. DatePicker on web: the date and time sit in two treatments

- Axes: light and dark, web.
- What: in one row the date is a filled pill chip, 13px bold, and the time
  beside it an outlined TimeField, regular weight, larger; at size lg the
  time field is taller than the date chip.
- Measured: by picture; the Liquid page was not captured for this row (the
  comparison job failed), so this is from Desk alone.
- Cause: likely the TimeField recipe applied to the time part
  (`packages/styles/desk/recipes/TimeField.css`) next to the chip drawn by
  the Desk Button recipe.
- Captured 02:23 (light), 02:36 (dark).
- Severity: major.
- Picture: `crops/datepicker-web-time-light.png`.

### 12. Navbar bar group buttons on ios: no visible focus

- Axes: light and dark, ios; the attached ButtonGroup in the Navbar (Sort
  songs, More, Shuffle) and the same bar group on the music library screen.
- What: a keyboard focus on these buttons draws nothing. The same in Liquid,
  so it is shared, not Desk's.
- Measured: focused button outline transparent, no ring shadow, in both
  styles.
- Cause: likely `packages/css/src/platform/ios.css` lines 3011 to 3020 (the
  bar group zeroes the buttons' border and lift) with the ring carried by
  the box shadow.
- Captured 03:01.
- Severity: major (2.4.7, shared).
- Picture: `crops/cmp-navbar-group-focus-light-desk-vs-liquid.png`.

### 13. Stepper: two digit numbers spill out of the disc

- Axes: light and dark, ios.
- What: steps 10, 11, 12 overflow the 24px disc; the digits touch the ring
  and the title starts about 3px after it. Liquid fits them at 14px.
  The connectors between the next steps do not show in Desk.
- Measured: disc 24px, digits 17px (Liquid 14px).
- Cause: `packages/css/src/platform/ios.css` line 758
  (`--_stepper-font-size: font-size-xl`), which the indicator also reads
  (`packages/css/src/components/Stepper.css` line 149); Desk's xl is 17px.
- Captured 02:06, 03:00. Rechecked 03:07.
- Severity: minor.
- Pictures: `crops/cmp-stepper-many-desk-vs-liquid.png`,
  `crops/stepper-12steps-ios-light.png`.

### 14. TabBar on ios: long labels run into each other

- Axes: light and dark, ios, the case "Long text".
- What: "Notifications" is not cut and ends against "Workspace...", with
  no gap. Liquid cuts it with an ellipsis and keeps the gap.
- Measured: by picture, about 0px between the two labels.
- Cause: Desk's wider type in `packages/css/src/components/TabBar.css`
  label width; no Desk rule.
- Captured 02:06, 02:21.
- Severity: minor.
- Picture: `crops/tabbar-longtext-ios-light.png`.

### 15. SplitView: the focus ring of the secondary pane is cut

- Axes: light and dark, ios.
- What: with focus on the "Message text" region, only the top edge of the
  ring shows; the pane clips its own ring.
- Measured: ring 2px, inside an `overflow` ancestor on every side.
- Cause: `packages/css/src/components/SplitView.css`, the secondary part's
  overflow with an outset ring.
- Captured 02:48.
- Severity: minor.
- Picture: `crops/splitview-secondary-focus-clipped-ios-light.png`.

### 16. Text selection is black, not Desk's yellow

- Axes: light and dark, every platform; seen in SelectionMenu.
- What: selected text is the inverse pair (black with white text in light).
  The rest of Desk selects in yellow.
- Cause: `packages/css/src/base.css` lines 151 to 155; Desk does not restate
  it. A design call for the owner.
- Captured 02:06.
- Severity: minor.
- Picture: `crops/selection-black-highlight-ios-light.png`.

### 17. Sheet with a grabber: two heads

- Axes: light and dark, ios and web; "Share at half height", the web
  sheets.
- What: the yellow grabber sits on its own light strip above the yellow
  title bar, so the sheet has two stacked heads.
- Cause: `packages/styles/desk/recipes/Dialog.css` lines 90 to 93 (the bar
  starts below the handle).
- Captured 02:06, 02:30.
- Severity: minor.
- Picture: `raw/desk-sheet-ios-light-ov12.png`.

### 18. PageShell navigation sheet on ios: a desktop column in a sheet

- Axes: light and dark, ios.
- What: the 260px sidebar sits inside the 390px sheet as a white box,
  leaving about 110px empty beside it, and keeps its collapse button.
  Liquid not compared.
- Cause: the Sidebar inside the PageShell drawer keeps its width
  (`packages/css/src/components/PageShell.css`).
- Captured 02:08.
- Severity: minor.
- Picture: `crops/pageshell-nav-sheet-ios-light.png`.

### 19. DatePicker on web: the two inline calendars do not line up

- Axes: light and dark, web, case "Compact and inline".
- What: the second inline calendar starts 25px above the first.
- Cause: demo layout, `packages/react/src/components/DatePicker/DatePicker.demo.tsx`.
- Captured 02:36.
- Severity: minor.
- Picture: `raw/desk-date-picker-web-dark.png`.

Checked and found to work (no finding): ActionSheet in all placements,
Calendar states (selected, today, booked, disabled), ColorArea, ColorSlider,
ColorSwatch, ColorSwatchPicker, ColorPicker overlays, DateField, TimeField,
WheelPicker (apart from the excluded band), SectionIndex, SelectionMenu
menu, SharePanel (sheet and web popover), SwipeActions menus, Pager, Toast
(the web close and action are 24px; an earlier 22.8px reading was the stack
scale), RangeSlider, Slider, SearchField, the focus rings of the other
controls (dark ring in light, white ring in dark, doubled on yellow), and the
ten screens apart from findings 2, 3, 8 and 12. A blank Arabic block on the
web SegmentedControl page at 02:31 was not seen again at 02:59.

## Ranked top 15

1. Banner solid action label 2.15:1, all axes (finding 1). Blocker.
2. Desk neutral Button recipe hides the DatePicker invalid and open states
   (finding 6). Same cause as 1. Major.
3. Grouped field input: pill ring on a padding-less input, text touches the
   ring, placeholder cut (finding 5). Major.
4. SegmentedControl unselected labels 4.06 to 4.19:1, ios light (finding 2).
   Major.
5. Danger title and action on dark windows 4.36 to 4.49:1 (finding 4).
   Major.
6. Empty yellow title bar on title-less popovers (finding 7). Major.
7. Sheet title bar on ios: 34px close and a 34px labelled confirm in place
   of the 44px round controls (finding 8). Major.
8. Play all and Shuffle all 4.21:1 on the music library screen (finding 3).
   Major.
9. TabBar on web is the base square strip (finding 9). Major.
10. Gray current marks in List, Sidebar and Navbar beside yellow marks in
    the controls (finding 10). Major.
11. Navbar bar group buttons show no focus, shared (finding 12). Major.
12. DatePicker web date chip and time field in two treatments (finding 11).
    Major.
13. Stepper two digit numbers overflow the disc (finding 13). Minor.
14. TabBar long labels touch (finding 14). Minor.
15. Sheet grabber on its own strip above the title bar (finding 17). Minor.

Counts: 1 blocker, 11 major, 7 minor.

## Not reached

- Arabic (lane Q4), android, macOS, the duo frames, reduced motion, reduced
  transparency, more contrast and forced colors.
- Hover on ios (no pointer), and hover findings on web other than by
  computed style: a hover change drawn on a parent or a pseudo element
  beyond the first six descendants was not seen, so web "no hover" results
  (colour swatches, fields) were left out as unconfirmed.
- Loading states beyond the ActionSheet and Toast demos.
- Keyboard focus on a selected Calendar day: the day buttons are inside
  grid cells with a roving tab stop and my focus probe landed on the cell;
  not confirmed either way.
- Swipe gestures (SwipeActions, Pager, sheet detents by drag); only the
  menu buttons and the detent handle were used.
- Overlays behind disabled or timed-out triggers (about 15 of 1,150), and
  triggers nested deeper than one level.
- The screens on `platform=web` (the screen route forces ios), and the
  framed `/screens/ios/<id>` page.
- A Liquid comparison of finding 11 and finding 18.
- The full contract and `npm run check` (not to be run in this lane).
