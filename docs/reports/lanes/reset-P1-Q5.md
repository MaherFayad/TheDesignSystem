# Lane Q5, round 1: accessibility audit of the mobile set (WCAG 2.2 AA)

Auditor: Q5 (ds-qa). Date: 2026-11-22. No file changed but this one.

## Scope and method

Mobile set: ActionSheet, AlertDialog, Banner, Calendar, ColorArea, ColorField,
ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker, DateField,
DatePicker, TimeField, WheelPicker, List, SectionIndex, SelectionMenu,
SharePanel, Stepper, SwipeActions, TabBar, Navbar, PageShell, Pager, Sheet,
Dialog, Toast, Slider, RangeSlider, SegmentedControl, SearchField, SplitView,
and the ten screens under `/screens/ios/`.

Axes: four styles (studio, desk, neutral, liquid), light and dark,
`platform=ios` at 390 by 844 and `platform=web` at 1280 by 800, English,
gallery on port 5318 with `chrome=0`.

Passes (Playwright, Chromium, scripts and data in the scratchpad, not the
repo):

- Pass A, 512 pages (32 components by 4 styles by 2 schemes by 2 platforms),
  plus 80 screen pages (10 screens by 4 styles by 2 schemes, ios). Per page:
  aria snapshot of the body (unnamed controls), target size with the 24 px
  spacing rule, a Tab walk of up to 20 stops (40 on screens) with a pixel
  diff of each stop focused against unfocused (focus visible, and pixels at
  3:1 against the unfocused state), a 5 by 5 point check of what covers the
  focused element (fixed or sticky layers), order jumps; hover, press and
  pointer cancel on up to 8 distinct buttons; computed contrast of
  placeholder, invalid, selected and glass text; up to 3 overlays opened by
  keyboard (1 in dark): focus moves in, Tab stays in, Escape closes, focus
  returns, aria snapshot of the open overlay.
- Pass C, 256 pages (32 by 4 styles by 2 platforms, light): reduced motion
  (running transform animations at rest and while the first overlay opens,
  smooth scroll), forced colors (Tab walk pixel diff, selected state told
  apart from its sibling, screenshots for Studio and Liquid), root font size
  at 200 percent, reflow at 320 by 640 with the first overlay open, ios
  landscape at 844 by 390 and web at 640 by 400 (200 percent zoom) with the
  first overlay open.
- Manual keyboard walks: SelectionMenu (owner and demo button), Sheet with
  header action, Sheet detents handle, DatePicker popover, ColorPicker
  compact sheet, Toast with F8, SharePanel, SwipeActions menu, SectionIndex.
- Every finding below was rechecked with a 2x pixel crop after the sweep,
  because three lanes edit shared CSS this round. Computed colour results
  that the pixels did not confirm were dropped (listed under "Dropped").

Pictures and snapshots: `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/q5/`
(`img/` crops, `snap/` aria snapshots, `passA/` and `passC/` raw records).
Below, `IMG` stands for that folder plus `img/`.

Severity: blocker means a WCAG 2.2 AA failure that stops a keyboard or low
vision person (no visible focus on common controls); major means an AA
failure with a workaround or on fewer controls; minor means a narrow or
transient failure, or a best practice gap.

## Findings

### F1. Neutral on iOS: soft neutral Buttons show no focus at all

- Components: ActionSheet, AlertDialog, Banner, Dialog, PageShell,
  SelectionMenu, SharePanel, Sheet, Toast (every soft neutral Button that is
  not a part and not in a bar). 138 focus stops in the sweep.
- Axes: neutral, light and dark, ios, rest focus.
- Criterion: 2.4.7 Focus visible (AA).
- What: the focused Button paints nothing new. Computed `box-shadow` is
  `none` while focused; pixel diff focused against unfocused is 0 pixels.
- Cause: `packages/styles/neutral/recipes/Button.css:93` sets
  `--_button-shadow: none`. The focus rule at
  `packages/css/src/components/Button.css:1034` is
  `box-shadow: var(--_button-shadow), var(--_button-ring);`, and `none, <ring>`
  is invalid at computed time, so the whole declaration drops, ring included.
  Fix shape: `0 0 transparent` in place of `none` (as Neutral already does at
  line 207).
- Severity: blocker.
- Picture: `IMG/focus-action-sheet-neutral-light-ios-Anchored.png` (focused
  left, unfocused right, identical).

### F2. iOS bar button groups: no focus ring in every style

- Components: Navbar (`pushed` case), the screens music-library ("Sort songs",
  "More options"), booking ("Share restaurant", "Save restaurant"),
  notes-edit ("Share note", "More note actions"). 80 focus stops.
- Axes: all four styles, light and dark, ios.
- Criterion: 2.4.7.
- What: computed `box-shadow: none` on focus; 0 changed pixels.
- Cause: `packages/css/src/platform/ios.css:721`, `--_button-shadow: none` on
  Buttons inside an attached ButtonGroup in a Navbar or Toolbar; same invalid
  list as F1.
- Severity: blocker.
- Picture: `IMG/focus-navbar-studio-light-ios-Sort_songs.png`,
  `IMG/focus-screen-notes-edit-desk-light-ios-Share_note.png`.

### F3. Liquid on iOS: DatePicker date and time chips show no focus

- Components: DatePicker (also the booking screen time chip). 26 stops.
- Axes: liquid, light and dark, ios.
- Criterion: 2.4.7.
- What: computed `box-shadow: none`; 0 changed pixels. On booking the time
  chip change measures 1.11 to 1.23:1 (only the field tint moves).
- Cause: `packages/css/src/platform/ios.css:1903`, `--_button-shadow: none`
  on the chips, inside the glass container query opened at line 1716; same
  invalid list as F1.
- Severity: blocker.
- Picture: `IMG/focus-date-picker-liquid-light-ios-part_date.png`.

### F4. Studio on iOS: TabBar current item, focus ring on the same colour

- Components: TabBar, PageShell, every screen with a tab bar.
- Axes: studio, light and dark, ios, focus on the current item.
- Criterion: 1.4.11 Non-text contrast (focus indicator), 2.4.7.
- What: the ring is an inset 2 px ring in `color.focus.ring`, drawn on
  Studio's inverted current pill that has the same ink: change against the
  unfocused state is 2.47:1 at most in light, 2.07:1 in dark, and 0 pixels
  reach 3:1. Web is fine (18:1).
- Cause: `packages/css/src/components/TabBar.css:73` (ring colour) with the
  Studio iOS inverted current item in
  `packages/styles/studio/recipes/TabBar.css:17`.
- Severity: major.
- Picture: `IMG/focus-screen-settings-studio-light-ios-part_item_in_tab_bar_Set.png`.

### F5. SplitView demo: the detail scroll pane's ring is clipped away

- Components: SplitView (`variants`, English and Arabic).
- Axes: all styles and schemes, web (split layout).
- Criterion: 2.4.7.
- What: the pane `div[role=region] "Message text"` takes focus (tabindex 0)
  and draws the default 2 px outline at offset +2 px, outside its box; the
  panel clips it. 0 changed pixels.
- Cause: `packages/react/src/components/SplitView/SplitView.demo.tsx:86`
  (a focusable region with no inset ring) inside
  `packages/css/src/components/ResizablePanels.css:85` (`overflow: hidden` on
  the panel). The system's own pane ring
  (`packages/css/src/components/SplitView.css:119`) is inset and fine.
- Severity: major (a demo, but it is the pattern people copy for a scroll
  pane).
- Picture: `IMG/focus-split-view-studio-light-web-role_region.png`.

### F6. ColorSwatchPicker grid: focus on the selected swatch looks like selection

- Components: ColorSwatchPicker (grid layout), ColorPicker (saved colours).
- Axes: studio light and dark, desk light; ios and web.
- Criterion: 2.4.7.
- What: on the selected swatch the focus ring (inset, focus ring colour) is
  the same ink and place as the selection ring, so focus adds 0 pixels.
  Neutral shows 1038 pixels at 3.46:1.
- Cause: `packages/css/src/components/ColorSwatchPicker.css:163` to 166.
- Severity: major.
- Picture: `IMG/focus-color-swatch-picker-studio-light-ios-role_option.png`.

### F7. DateField and TimeField: the focused segment is a pale tint

- Components: DateField, TimeField, DatePicker on web (time segments).
- Axes: all styles, light and dark, ios and web. 200 of 304 segment stops.
- Criterion: 1.4.11 (focus indicator), 2.4.7 in part.
- What: moving between segments changes only the segment fill to
  `color.primary.tint`; against the unfocused segment that is 1.11 to 1.36:1.
  The box ring says focus is in the field, not which segment.
- Cause: `packages/css/src/components/DateField.css:60`
  (`--_date-field-segment-bg-focus: var(--ds-color-primary-tint)`) and the
  rule at line 147 (`[data-part='segment']:focus`).
- Severity: major.
- Picture: `IMG/focus-time-field-studio-light-web-minute.png`.

### F8. ColorArea thumb ring below 3:1 over light areas

- Components: ColorArea, ColorPicker (spectrum view).
- Axes: desk dark (ios and web), liquid light and dark, neutral, studio dark;
  26 of 96 stops.
- Criterion: 1.4.11.
- What: the ring is the scheme's focus ring colour (near white in dark)
  around the thumb; over a light or warm part of the area the change is
  2.68 to 2.8:1, 0 pixels at 3:1 (desk dark, saturation area).
- Cause: `packages/css/src/components/ColorArea.css:60`
  (`--_color-area-ring: var(--ds-focus-shadow-ring)`, one colour). The halo
  form (`--ds-focus-shadow-halo`) gives two colours and holds on any area.
- Severity: major.
- Picture: `IMG/focus-color-area-desk-dark-web-Saturation.png`.

### F9. ColorPicker tabs: inset ring at 2.36:1 on the selected tab

- Components: ColorPicker (inline, the Grid, Spectrum, Sliders tab list).
- Axes: liquid dark (4 stops), neutral light, desk dark; web and ios.
- Criterion: 1.4.11.
- What: the inset ring `rgb(90,157,255)` on the selected tab fill measures
  2.36:1 at most against the unfocused tab.
- Cause: `packages/css/src/components/Tabs.css:66` (inset ring in
  `color.focus.ring`) over the selected tab fill; Liquid dark focus ring is
  `#5a9dff` (`packages/tokens/dist/css/liquid.css:632`).
- Severity: major.
- Picture: `IMG/focus-color-picker-liquid-dark-web-role_tab.png`.

### F10. Desk dark: TabBar search placeholder below 4.5:1

- Components: TabBar (`variants`, `search-side`), screen music-search.
- Axes: desk dark, web 3.28:1, ios 3.7:1 (pixels); computed 3.58 and 3.96
  to 4.11.
- Criterion: 1.4.3 (the hint is the field's only visible label).
- Cause: `packages/css/src/components/Input.css:227` uses
  `color.text.placeholder` (`packages/tokens/dist/css/desk.css:1003`, equal
  to text subtle) on the lighter well. The iOS fix at
  `packages/css/src/platform/ios.css:439` sits inside the glass container
  query at line 419, so it reaches Liquid and Neutral only; web has no fix.
- Severity: major.
- Picture: `IMG/rest-tab-bar-desk-dark-web.png`.

### F11. iOS press: every Button label fades to 0.55 opacity

- Components: every Button, IconButton, ToggleButton on ios (116 pressed
  states in the sweep; screens booking, onboarding, fitness-plan,
  share-flow, music-library, music-search).
- Axes: all styles, light and dark, ios, pressed.
- Criterion: 1.4.3 while pressed.
- What: soft danger "Delete the board" 7.07:1 at rest, 2.63:1 pressed
  (pixels, studio light); Liquid neutral soft 2.93:1; lowest computed 2.35:1
  (Toast "Show info toast").
- Cause: `packages/css/src/platform/ios.css:136` `opacity: 0.55` on
  `:active, [data-pressed]` (also a raw value, against the tokens rule).
- Severity: minor (lasts while the finger is down).
- Picture: `IMG/press-alert-dialog-studio-light-ios.png`.

### F12. SegmentedControl and Tabs act on pointer down

- Components: SegmentedControl, Calendar and DatePicker (Gregorian and Hijri
  switch), settings screen; ColorPicker tabs (Tabs).
- Axes: all styles and platforms.
- Criterion: 2.5.2 Pointer cancellation.
- What: press down on an unselected segment, move off, release: the
  selection has already changed and stays.
- Cause: `packages/react/src/components/SegmentedControl/SegmentedControl.tsx:303`
  to 306 (selection follows focus; a mouse down gives focus). Tabs uses
  Radix automatic activation, which selects on mouse down
  (`packages/react/src/components/Tabs/Tabs.tsx:130`).
- Severity: minor (reversible, but there is no abort).
- Picture: none (state change, logged by `js/vcancel.js`).

### F13. Liquid on iOS, forced colors: the slider thumb has no edge

- Components: Slider, RangeSlider, ColorSlider on ios with the platform disc.
- Axes: liquid, ios, `forced-colors: active` (screenshots were taken for
  Studio and Liquid only; Neutral shares the glass slider and was not
  pictured).
- Criterion: 1.4.11 under forced colors (advisory; the user agent owns the
  colours).
- What: the platform disc draws as a Canvas band across a Highlight disc with
  no border; the thumb reads as two caps. Studio draws a Highlight square and
  is fine.
- Cause: `packages/css/src/platform/ios.css:264` to 300 (the `::after` disc)
  has no `forced-colors` edge. E1 is editing this block this round.
- Severity: minor.
- Picture: `IMG/crop-fc-slider-liquid-ios.png`, `IMG/fc-slider-compare.png`.

### F14. SelectionMenu: the demo button opens the menu but keyboard cannot enter it

- Components: SelectionMenu (`variants`, `many`, demo button
  "Select a phrase").
- Axes: all styles, ios and web.
- Criterion: 2.1.1 (in the demo only), 3.3.2 hint.
- What: Enter on the demo button opens the menu, focus stays on the button,
  Shift+F10 on the button does nothing, Tab closes the menu. The documented
  path works: Shift+F10 on the owner (the article) moves focus to "Copy",
  arrows move, Escape returns to the owner. The owner carries no
  `aria-keyshortcuts`, so nothing tells a reader that Shift+F10 exists.
- Cause: the demo in
  `packages/react/src/components/SelectionMenu/SelectionMenu.demo.tsx`
  opens the menu as a pointer selection would; the owner lacks the hint.
- Severity: minor.
- Picture: none (keyboard log, `js/vkeys.js`, `js/vsel.js`).

### F15. Text sizes ignore the user's font size

- Components: all.
- Axes: all styles and platforms.
- Criterion: 1.4.4 (not a failure: browser zoom to 200 percent and 640 px
  reflow pass); best practice for user text size and iOS text size.
- What: with the root font size at 200 percent no text grows (factor 1.00 in
  every one of 256 pages). Font tokens are px and px clamps, for example
  `--ds-font-size-m: clamp(12px, calc(11.642px + 0.094vw), 13px)` in
  `packages/tokens/dist/css/desk.css:122`.
- Severity: minor.

### F16. Banner in Arabic: Tab goes up to the close control

- Components: Banner (`variants`, Arabic notice).
- Axes: all styles, ios.
- Criterion: 2.4.3.
- What: from the action "إضافة طريقة دفع" Tab goes to the close control, which
  sits 39 to 46 px above it at the top end. Order is action then close in
  the DOM, close first visually.
- Cause: the wrapped layout at 390 px places the close part in the top row
  (`packages/css/src/components/Banner.css:186`) while the actions wrap
  below it.
- Severity: minor.

## Checks that passed

- Keyboard into and out of overlays (2.1.1, 2.1.2, 2.4.3): every overlay
  opened by Enter in 508 pages (AlertDialog, ActionSheet, Dialog, Sheet,
  SharePanel, DatePicker popover, ColorPicker sheet, Navbar menus) took focus
  inside, kept Tab inside, closed on Escape and returned focus to its
  trigger. No trap: every Tab walk moved on.
- Nested layers: the SwipeActions menu closes on Escape with the row kept;
  the DatePicker popover closes alone and focus goes back to the chip; a
  focused Toast closes on Escape with focus on the list; the Sheet detents
  handle is a button named "Sheet size, 1 of 2", ArrowUp moves to 2 of 2,
  Escape closes and focus returns.
- Focus not obscured (2.4.11): no focus stop was covered by a fixed or sticky
  layer on any component page or screen (5 by 5 point check), including the
  music-library rows under the Now playing bar.
- Names, roles, values (4.1.2): no unnamed control in any page or open
  overlay. The only empty nodes are the filler `gridcell [disabled]` cells
  after the last day of the month in Calendar and DatePicker, which is fine.
- Live regions (4.1.3): Toast announces through the Toaster's polite region
  ("Notification. Board duplicated.") and an assertive region for danger;
  Banner is a named region and takes no focus.
- Target size (2.5.8): no control under 24 px without spacing; the only hits
  were the visually hidden skip links (2 by 2 until focused) and stretched
  card links, both exempt.
- Dragging (2.5.7): Pager has "Page n of 3" buttons, SwipeActions has an
  "Actions for" menu button per row (18 on the page), WheelPicker columns are
  spinbuttons, ColorArea exposes two sliders, Sheet detents have the handle
  button.
- Reduced motion (2.3.3): no running transform, inset or size animation at
  rest or while the first overlay opens, in 256 pages; no smooth scroll.
- Forced colors: focus visible on every stop walked (14 per page); selected
  items differ from their siblings in every case checked.
- Reflow (1.4.10): no horizontal scroll at 320 px and no overlay wider than
  320 px; at 844 by 390 and 640 by 400 every first overlay fits or scrolls.
- Orientation (1.3.4): no content hidden in landscape.

## Dropped after recheck (computed result not confirmed by pixels)

- Studio SegmentedControl, Calendar and settings "Small" selected label at
  1:1: the label sits on a separate sliding indicator; pixels give 19.07:1.
- Liquid dark TabBar labels at 3.8:1 on glass: pixels give 8.27:1.
- SectionIndex row links and music-search card links with no focus: the ring
  is on the row or card, outside my crop; visible in the wide shot
  (`IMG/si-one-studio-ios.png`, `IMG/screen-music-search-card-focus.png`).
- Settings, RangeSlider and List order jumps: scroll container artefacts or
  vertical slider order; the walk is in reading order.

## Top 15, ranked

1. F1 Neutral iOS soft Buttons, no focus (2.4.7, blocker), 9 components.
2. F2 iOS bar button groups, no focus, all styles (2.4.7, blocker).
3. F3 Liquid iOS DatePicker chips, no focus (2.4.7, blocker).
4. F4 Studio iOS TabBar current item ring at 2.07 to 2.47:1 (1.4.11, major).
5. F7 DateField and TimeField segment focus at 1.11 to 1.36:1 (1.4.11, major).
6. F6 ColorSwatchPicker grid, focus equals selection (2.4.7, major).
7. F5 SplitView demo pane ring clipped (2.4.7, major).
8. F10 Desk dark TabBar search placeholder 3.28:1 (1.4.3, major).
9. F8 ColorArea thumb ring 2.68 to 2.8:1 (1.4.11, major).
10. F9 ColorPicker tabs ring 2.36:1 in Liquid dark (1.4.11, major).
11. F11 iOS pressed opacity 0.55, labels down to 2.35:1 (1.4.3, minor).
12. F12 SegmentedControl and Tabs act on pointer down (2.5.2, minor).
13. F14 SelectionMenu demo path and missing shortcut hint (2.1.1, minor).
14. F13 Liquid iOS slider thumb under forced colors (1.4.11, minor).
15. F16 Banner Arabic Tab order up to close (2.4.3, minor); F15 px text sizes
    (1.4.4 best practice, minor).

Counts: 3 blockers, 7 major, 6 minor.

Root cause note: F1, F2 and F3 are one bug. Any `--_button-shadow: none`
empties the focus ring because Button.css line 1034 joins the two values in
one list. A lint that forbids `none` for a property used in a shadow list
would stop it coming back.

## Component by criterion group

Groups: K keyboard (2.1.1, 2.1.2, 2.4.3), F focus visible (2.4.7, 2.4.11,
1.4.11 ring), N names and status (4.1.2, 4.1.3, 1.3.1), C contrast in states
(1.4.3, 1.4.11), T target and drag (2.5.8, 2.5.7), M motion, forced colors,
text size, reflow (2.3.3, 1.4.4, 1.4.10), P orientation and pointer cancel
(1.3.4, 2.5.2). "ok" means checked and passed, a finding id means a finding.

| Component | K | F | N | C | T | M | P |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ActionSheet | ok | F1 | ok | F11 | ok | ok | ok |
| AlertDialog | ok | F1 | ok | F11 | ok | ok | ok |
| Banner | F16 | F1 | ok | ok | ok | ok | ok |
| Calendar | ok | ok | ok | ok | ok | ok | F12 |
| ColorArea | ok | F8 | ok | ok | ok | ok | ok |
| ColorField | ok | ok | ok | ok | ok | ok | ok |
| ColorPicker | ok | F8, F9 | ok | ok | ok | ok | F12 |
| ColorSlider | ok | ok | ok | ok | ok | F13 | ok |
| ColorSwatch | n/a | n/a | ok | ok | n/a | ok | n/a |
| ColorSwatchPicker | ok | F6 | ok | ok | ok | ok | ok |
| DateField | ok | F7 | ok | ok | ok | ok | ok |
| DatePicker | ok | F3, F7 | ok | ok | ok | ok | F12 |
| TimeField | ok | F7 | ok | ok | ok | ok | ok |
| WheelPicker | ok | ok | ok | ok | ok | ok | ok |
| List | ok | ok | ok | ok | ok | ok | ok |
| SectionIndex | ok | ok | ok | ok | ok | ok | ok |
| SelectionMenu | F14 | F1 | ok | ok | ok | ok | ok |
| SharePanel | ok | F1 | ok | F11 | ok | ok | ok |
| Stepper | ok | ok | ok | ok | ok | ok | ok |
| SwipeActions | ok | ok | ok | ok | ok | ok | ok |
| TabBar | ok | F4 | ok | F10 | ok | ok | ok |
| Navbar | ok | F2 | ok | ok | ok | ok | ok |
| PageShell | ok | F1, F4 | ok | F11 | ok | ok | ok |
| Pager | ok | ok | ok | ok | ok | ok | ok |
| Sheet | ok | F1 | ok | F11 | ok | ok | ok |
| Dialog | ok | F1 | ok | F11 | ok | ok | ok |
| Toast | ok | F1 | ok | F11 | ok | ok | ok |
| Slider | ok | ok | ok | ok | ok | F13 | ok |
| RangeSlider | ok | ok | ok | ok | ok | F13 | ok |
| SegmentedControl | ok | ok | ok | F11 | ok | ok | F12 |
| SearchField | ok | ok | ok | ok | ok | ok | ok |
| SplitView | ok | F5 | ok | ok | ok | ok | ok |
| iOS screens | ok | F2, F3, F4 | ok | F10, F11 | ok | not run | F12 |

F15 (text size) applies to every row and is left out of the table.

## What I did not reach

- Arabic and right to left: only the Arabic cases inside the English pages
  (Q4 owns `lang=ar`).
- Android and macOS platforms (Q3 owns android).
- Every overlay: 3 triggers per page in light and 1 in dark; nested overlays
  only by the manual walks listed above. Toast stacking with a Dialog open
  was not driven.
- Hover and press on more than 8 distinct buttons per page; hover on non
  button controls (list rows, swatches, days).
- A real screen reader (VoiceOver, NVDA): names and roles come from the
  Chromium accessibility tree only.
- Text on glass over images: measured over white, black and the page
  background, not over photos.
- 200 percent text through the browser's own text size setting; only the root
  font size and page zoom.
- Pass C ran the screens only for keyboard, focus and contrast, not motion,
  forced colors or reflow.
- Pass A first ran with 25 to 30 tab stops; the full matrix used 20 per page
  (40 on screens), so focus on stops past the 20th on long pages (List,
  SwipeActions, TabBar, SplitView) was checked only through the screens and
  the manual walks.
