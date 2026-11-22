# P1 Q1: fresh eyes audit of Studio on mobile

Lane Q1 of round 1 (`docs/plan/reset-mobile.md`, "Rounds to finish Studio
and Desk on mobile"). Audit only: no file changed but this report.

## How it was checked

- Gallery on port 5314, `chrome=0`, English, `style=studio`.
- Every component of the mobile set (32 pages) in four combinations:
  `platform=ios` at 390 by 844 and `platform=web` at 1280 by 800, light and
  dark. The ten screens under `/screens/ios/<id>/screen` on ios, light and
  dark.
- Per page, a Playwright script (captures 02:04 to 03:31 UTC):
  - a full page capture and a probe of every visible element: text
    contrast with real computed colours composited over the stacked
    backgrounds (WCAG 1.4.3), control borders against their backdrop
    (1.4.11), interactive boxes under 24 px (2.5.8), any corner over 1 px on
    a painted element, any backdrop filter, any shadow with a blur;
  - every trigger on the page clicked in turn (up to 12 per page, 14 per
    screen), the open overlay captured and probed, one level of nested
    triggers inside it (544 overlays, 10 nested);
  - hover and press on the first enabled instance of each control kind
    (computed fill, ink, border before and after, plus a crop);
  - a keyboard walk of up to 45 Tab presses with a crop of the first focus
    of each control kind.
- Follow up measurements by hand, one page at a time, 03:31 to 03:48 UTC.
  Every finding below was measured again in that window; the time is given.
  Liquid on the same page was used only to tell a Studio cause from a
  shared one and for completeness of states.
- Raw captures (about 1,800):
  `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/raw/`.
  Cropped pictures for the findings:
  `/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/q1/`
  (shortened to `q1/` below).

## Findings

Severity: blocker, major, minor. "Shared" means Liquid shows the same, so
the cause is not in the Studio pack.

### F01 Dialog: the title band ends on the title text (major)

- Axes: ios, light and dark, every Dialog (sm to 2xl, nested alert too).
- What: Studio paints the title as a band one tone off (surface 2), but on
  ios the platform gives the title 20 px above and 4 px below, and the
  description 0 px above. The band ends 6 px under the title glyphs and the
  description starts on the band's edge. Liquid has no band, so the same
  paddings read fine there.
- Measured 03:32: title padding 20 / 4 / 30 px, title text 6 px from the band
  bottom, description padding-top 0, band `rgb(244, 244, 244)`.
- Likely cause: `packages/styles/studio/recipes/Dialog.css` line 64
  (`--_dialog-header-bg`) meeting `packages/css/src/platform/ios.css`
  lines 3267 to 3270 (title padding) and 3292 to 3294 (description
  padding 0).
- Picture: `q1/F01-dialog-ios-title-band.png`

### F02 AlertDialog: the description sits on its own rule (major)

- Axes: ios, light and dark, every AlertDialog.
- What: Studio draws the description as a band with a 1px rule on top and
  `padding-block: var(--_dialog-padding)`; on ios the platform padding 0
  wins, so the first line of the description sits 1 to 4 px under the rule
  while the title has 20 px above it. Uneven, cramped.
- Measured 03:47: description `padding 0 0 30px`, `border-top 1px
  rgb(61, 61, 61)`, band `rgb(10, 10, 10)` in dark. Liquid: no rule, no band.
- Likely cause: `packages/styles/studio/recipes/Dialog.css` lines 80 to 82
  and 132 to 135, overridden by `platform/ios.css` lines 3292 to 3294.
- Picture: `q1/F02-alertdialog-ios-description-rule.png`

### F03 Toast with a picture: the avatar sits on the edge and under the title (major)

- Axes: ios, light and dark (measured dark), the "Show danger banner"
  toast and the message toasts with a person.
- What: the 38 px avatar starts on the toast's edge (inside the 24 px
  corner) and the title text starts 3 px inside the avatar.
- Measured 03:33 and 03:47: avatar inset from the start edge 0 px, title
  overlaps the avatar by 3 px. Liquid: inset 11 px, gap 8 px.
- Likely cause: `packages/styles/studio/recipes/Toast.css` lines 40 to 41:
  the first grid column is fixed to `size.icon-md`, so the avatar that
  `platform/ios.css` lines 3595 to 3602 sizes to 38 px overflows it.
- Picture: `q1/F03-toast-ios-avatar-overlap.png`

### F04 SearchField: 11 px input text on ios (major)

- Axes: ios, light and dark; the SearchField page, the TabBar search
  field, the music search screen.
- What: the typed text and placeholder are 11 px (12 px in two sizes).
  Liquid on the same page: 17 px. Under 16 px, Safari on iPhone zooms the
  page on focus; 11 px is also below the platform body size.
- Measured 03:36 and 03:47: 19 inputs at 11.0 px, 4 at 12.0 px, 2 at 16 px
  (Liquid 17 x 17 px, 6 x 14 px, 2 x 16 px).
- Likely cause: `packages/css/src/platform/ios.css` lines 428 to 431 set the
  ios body size, but sit inside the glass container query at line 419;
  Studio has no glass, so `components/SearchField.css` line 45
  (`font-size-s`, 11 px in Studio) stays.
- Picture: `q1/F04-searchfield-ios-11px.png`

### F05 Five different "selected" marks across siblings (major)

- Axes: ios and web, light and dark.
- What: Studio's mark for the current or selected item is the inverted
  cell (SegmentedControl, TabBar, Calendar, menus). Other siblings use:
  - List `data-active` row (music library "now playing", List demos): a
    10 percent veil, `rgba(255,255,255,0.1)` on black, about 1.2:1 to the
    row (03:35);
  - Sidebar current item (PageShell navigation, Navbar menu sheet "Docs"):
    the 10 percent veil plus a bright edge and bold;
  - ColorPicker views (F06): pale cell in a gray frame;
  - Navbar web dropdown current item: a 2px edge bar only (F13).
  The veil marks pass only through weight or the edge; the row fill itself
  is under 3:1 (1.4.11 for the state is carried by the bold label, so this
  is a consistency defect, not a fail).
- Likely cause: no Studio recipe for List or Sidebar:
  `packages/css/src/components/List.css` lines 99 and 193,
  `components/Sidebar.css` lines 65 to 67 and 332.
- Picture: `q1/F05-selected-treatments.png` (Navbar sheet, List row,
  ColorPicker views, SegmentedControl light and dark, TabBar)

### F06 ColorPicker views: the selected view is not inverted (major)

- Axes: ios and web, light and dark.
- What: the Grid, Spectrum, Sliders row keeps the Tabs soft look: a pale
  indicator on a veil, told by a 1px gray frame and weight 600 against 500.
  DatePicker's Hijri and Gregorian switch in the same picker family is the
  inverted cell.
- Measured 03:35: indicator `rgb(233,233,233)` on a 10 percent veil (ios
  light), `rgb(28,28,28)` (ios dark), a 20 percent veil (web); frame
  `rgb(74,74,74)` light, `rgb(163,163,163)` dark.
- Likely cause: `packages/styles/studio/recipes/ColorPicker.css` lines 16 to
  24 set the corners only; the Tabs soft colours come from the base.
- Pictures: `q1/F06-colorpicker-views-web.png`, third row of
  `q1/F05-selected-treatments.png`

### F07 ActionSheet on web: gray frame and three action looks (major)

- Axes: web, light and dark.
- What: the panel is framed by `border.default` (gray), where Dialog,
  menus and toasts in Studio take the bright text colour rule. In dark the
  frame is `rgb(61,61,61)` on the darkened page, about 1.9:1, so the panel
  edge is faint. Inside, three treatments in one list: the danger action a
  pink tint with no border, the neutral actions bordered cells, Cancel
  borderless gray text.
- Measured 03:39 to 03:40: frame `rgb(189,189,189)` light,
  `rgb(61,61,61)` dark; danger `rgba(239,68,68,0.1)` fill.
- Likely cause: no Studio ActionSheet recipe;
  `packages/css/src/components/ActionSheet.css` lines 65 and 157.
- Note (ios): the Bottom placement draws plain rows on a square sheet while
  the Anchored and Center placements draw filled buttons in the capsule
  panel; not compared with Liquid, left as a note.
- Picture: `q1/F07-actionsheet-web-panel.png`

### F08 Switch on ios: on and off look alike (major)

- Axes: ios, light and dark; settings and pass detail screens (Switch is
  not in the mobile set, but both screens are).
- What: on ios the thumb is 38 px of a 63 px track. On is a 21 px dark
  strip plus a thumb in the body colour, so the track reads as empty; off is
  a 38 px gray thumb at the same start side on a veil. The dark mass sits
  at the start in both states.
- Measured 03:44 to 03:45: on: track `rgb(10,10,10)`, thumb white at x 23;
  off: thumb `rgb(74,74,74)` at x 2, track `rgba(10,10,10,0.2)`.
- Likely cause: `packages/styles/studio/recipes/Switch.css` lines 4 to 5 and
  33 (on thumb in the body colour, off thumb muted) with the ios thumb width
  in `platform/ios.css` line 177.
- Picture: `q1/F08-switch-ios-on-off.png` (on, then off)

### F09 IconButton, CloseButton and tone soft buttons: press does not invert (major)

- Axes: ios and web, light and dark, every page.
- What: the neutral Button inverts on press. IconButton: hover a 10 percent
  veil, press a 20 percent veil. CloseButton: hover changes only the ink
  (`rgb(74,74,74)` to `rgb(26,26,26)`), press a 20 percent veil. Danger soft
  Button (AlertDialog, Dialog triggers, ActionSheet danger): hover and press
  are the same `rgba(239,68,68,0.2)`, so press cannot be told from hover.
  Confirms the IconButton note in Z3 and extends it.
- Measured in the batch (02:05 to 03:31) on every page with these controls.
- Likely cause: `packages/styles/studio/recipes/Button.css` lines 54 to 77
  cover only `button` and `copy-button` in neutral soft;
  `packages/css/src/components/Button.css` lines 553 to 560 set
  `--_button-bg-active` equal to the hover tint.
- Picture: `q1/F09-press-states.png` (IconButton pressed, danger hover,
  danger pressed)

### F10 Inbox screen: the bottom toolbar is square and has no edge (major)

- Axes: ios, light and dark, inbox swipe screen.
- What: every other ios bar keeps the capsule (owner approved); this
  toolbar is a square box. In light its fill `#f2f2f2` on white with a pale
  hairline is about 1.1:1, so the bar has no visible edge.
- Likely cause: `platform/ios.css` lines 1834 to 1836 (toolbar capsule) sit
  inside the glass container query, so Studio falls back to
  `components/Toolbar.css` line 39 (`radius.panel`, 0 in Studio). Same
  gating as F04.
- Picture: `q1/F10-inbox-toolbar.png`

### F11 Music library screen: the tab bar runs off the screen (major, shared)

- Axes: ios, light and dark.
- What: the compact tab bar with the mini player puts the search item at
  x 366 to 430 on a 390 wide screen: clipped.
- Measured 03:33: Studio bar 338 wide, search item at 366 + 64. Liquid
  worse: bar 385 wide, search at 413.
- Likely cause: the accessory capsule width on ios
  (`platform/ios.css` around line 611) with the screen's layout
  (`apps/gallery-react/src/ios-screens/music-library.tsx`).
- Picture: `q1/F11-music-library-tabbar-overflow.png`

### F12 AlertDialog with fields: a 20 px rounded well inside the alert (minor)

- Axes: ios, light and dark.
- What: the field group inside the alert is a rounded card (20 px). Studio
  draws cards and wells square; this is content inside the panel, not the
  panel itself.
- Likely cause: `platform/ios.css` line 2226 (`--_fieldset-card-radius`).
- Picture: `q1/F12-alertdialog-ios-fields-well.png`

### F13 Navbar on web: the dropdown panel has no rule (minor)

- Axes: web, dark (light the same build).
- What: the Product menu panel is `#1a1a1a` on black with no 1px bright
  rule, unlike Studio's menu tile; the current page is a 2px edge bar (a
  fifth selected mark, F05).
- Measured 03:43.
- Picture: `q1/F13-navbar-web-dropdown.png`

### F14 ColorPicker eyedropper: still a circle on hover, press and focus (minor)

- Axes: ios and web, light and dark.
- What: Z3 reported the eyedropper square; it is not. Computed radius
  999 px; the hover veil is a disc.
- Measured 03:42 and 03:46.
- Cause: `packages/styles/studio/recipes/ColorPicker.css` line 27,
  `[data-ds='color-picker'] > :is(..., [data-part='footer'] >
  [data-part='eyedropper'])` asks the eyedropper to be a child of the root;
  it is a child of the footer, so the rule never matches.
- Picture: `q1/F14-colorpicker-eyedropper-hover-round.png`

### F15 Chip (SelectionMenu page): capsule and gray fill (minor)

- Axes: ios and web, light and dark.
- What: ChipMenu chips ("Brand board", "Invoice 2041") are gray capsules.
  The pill is the component default, not the page's choice: the same case
  Z1 squared for SegmentedControl.
- Cause: no Studio Chip recipe; `packages/css/src/components/Chip.css`
  line 32.
- Picture: `q1/F15-selectionmenu-chip-pill.png`

### F16 Dialog on ios: stacked footer buttons of three widths (minor, shared)

- Axes: ios, light and dark.
- What: the three stacked actions are 162, 128 and 140 px wide, centred;
  in the md dialog the pair is 48 and 55 px tall (the label wraps). Liquid
  measures the same.
- Measured 03:31 to 03:32.
- Likely cause: the ios footer rules after `platform/ios.css` line 3300.
- Picture: `q1/F01-dialog-ios-title-band.png` (footer)

### F17 PageShell navigation sheet: the sidebar leaves an empty column (minor, shared)

- Axes: ios, light and dark.
- What: the sidebar keeps its 260 px width with its own end rule inside
  the 390 px sheet: an empty 120 px column. Liquid the same.
- Measured 03:40.
- Picture: `q1/F17-pageshell-nav-sheet.png`

### F18 SplitView on ios: two type scales in one component (minor)

- Axes: ios, light and dark.
- What: the stacked list rows are 16 px; the detail ("Return to list",
  the sender, the meta) is 11 px and the body 13 px. Liquid 14 to 17 px.
- Picture: `q1/F19-splitview-type.png`

### F19 Pager dots and progress tracks: round marks (minor)

- Axes: ios and web; Pager page, onboarding, fitness and music library
  screens.
- What: page dots and ProgressBar tracks are pills; Studio's marks take
  radius 2. In dark the dots sit on a platter, in light they do not.
- Cause: `packages/css/src/components/Pagination.css` line 196, no Studio
  recipe.
- Picture: `q1/F20-pager.png`

### F20 ColorPicker footer row: four sizes in one row (minor)

- Axes: ios, light and dark.
- What: preview 75 px, swatches 28 px, add 50 px, eyedropper 44 px; the
  swatches centre while the preview hangs from the top.
- Picture: `q1/F21-colorpicker-swatch-row.png`

### F21 Sheet on web: a pill handle bar (minor)

- Axes: web, light and dark.
- What: the drag handle on the web sheet is a 999 px pill on an otherwise
  square sheet.
- Picture: `q1/F22-sheet-web-handle.png`

## Checked and not a defect

- Text contrast: no text under 4.5:1 (3:1 large) anywhere outside
  disabled controls. The probe's hits on SegmentedControl labels were the
  inverted thumb (a sibling element), checked by eye.
- No backdrop blur and no blurred shadow anywhere under Studio (only
  `blur(0px)` declarations).
- Targets: no interactive element under 24 px. List and SwipeActions titles
  (23 px tall) are stretched links: the whole row hits the link (03:45).
  Skip links are 2 px only while hidden.
- Focus: every control kind shows a visible ring (crops checked); date and
  time segments add a fill inside the field ring.
- TabBar badges: 6.47:1 light, 7.16:1 dark.
- ColorPicker on ios dark: the batch opened no overlay there; opened by
  hand at 03:41, it works.

## Known items: confirmed or denied

- Z1, SegmentedControl, TabBar, Calendar inverted marks: confirmed in place.
- Z1, NumberField stepper capsule and 11 px value: confirmed (settings,
  booking).
- Z1, TabBar expanded search double stroke: confirmed.
- Z3, soft neutral IconButton gray cell: confirmed, and extended (F09).
- Z3, eyedropper square: denied (F14).
- Z3, ColorPicker views take radius xs: confirmed for the corner; the
  selected mark is F06.
- Size axis on ios (Slider, TabBar, ColorSwatchPicker, DatePicker sm, md,
  lg draw the same): shared with Liquid, platform sizes; not a Studio
  defect.

## Ranked top 15

1. F04 SearchField 11 px input on ios (zoom on focus, glass gated rule).
2. F09 IconButton, CloseButton and tone soft press does not invert.
3. F05 five different selected marks across siblings.
4. F08 Switch on and off look alike on ios.
5. F03 Toast avatar on the edge and under the title.
6. F01 Dialog title band ends on the title.
7. F02 AlertDialog description on its own rule with no room.
8. F06 ColorPicker views not inverted.
9. F07 ActionSheet web gray frame and three action looks.
10. F10 Inbox toolbar square with no edge.
11. F11 Music library tab bar off screen (shared).
12. F14 Eyedropper selector never matches.
13. F15 Chip default capsule.
14. F12 Rounded well inside the ios alert.
15. F13 Navbar web dropdown without a rule.

Counts: 0 blocker, 11 major (one shared), 10 minor (two shared).

## Not reached

- Arabic (lane Q4) and android (lane Q3).
- Screens on `platform=web`, folded and duo frames.
- Hover and press beyond the first instance of each control kind per page;
  keyboard walks stopped at 45 Tab presses, so the lower half of long pages
  (List, TabBar, SwipeActions, Toast, PageShell) was not walked.
- Triggers past the twelfth on a page (List, SwipeActions, Navbar, Toast
  stacks); nested overlays deeper than one level.
- Drag and swipe: SwipeActions swipe, Slider drag, Sheet drag, Navbar
  large title collapse.
- Invalid and loading states other than the ones the demos render at rest
  (the AlertDialog and ActionSheet loading actions were not run to the
  end).
- One run crashed on a reload (Toast, web light, 03:10, "page crashed")
  after 10 overlays; its hover and keyboard passes did not run. Web dark
  ran in full.
- Forced colours, more contrast, reduced motion.
