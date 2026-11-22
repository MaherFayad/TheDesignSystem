# Mobile fix orders (owner, 2026-11-16)

The owner judged the phone platform layer wrong throughout and said: "only
do the mobile fixes now, just the iOS and android". These two orders replace
R0.22 and come before everything else in `docs/plan/reset.md`. Nothing else
runs: no desktop, no gate review, no R1.

Binding: `DECISIONS.md`, sections "Platform looks on the web follow each
vendor's web language" and "The iOS glass switch: Liquid and Neutral", and
ruling 16 (style wins on controls, platform wins on sheets, bars and
alerts). Owner feedback: `docs/plan/reset-followups.md`, from "Owner feedback
on the R0 screenshots" to the end.

Method for both orders. Work from pictures, not from tables: put a
reference capture beside ours at the same width for every part, look at
both, fix, and repeat until a person would call them the same family. A
measured match with a picture that looks wrong is a fail. References are
third party screenshots: keep them in scratch outside the repo, cite their
links in the report, and copy no artwork, icons, marks, fonts or text.
Lucide icons stay. The style id stays `liquid`.

## M1 iOS phone surfaces (ds-style)

References: the vendor's own music and wallet apps on Mobbin, platform
`ios` (the connector tool is `mcp__Mobbin__search_screens`).

Scope, on the gallery's `/platforms` screens and the component pages, at
393 by 852, light and dark, LTR and Arabic RTL:

1. Tab bar: a floating capsule inset from the edges, glass, a soft lens on
   the current item, icon and label sizes as in the reference.
2. Navigation bar: no bar fill; round glass buttons over content; large
   title that sits in the content.
3. Switch: wide capsule track and capsule thumb. In Liquid and Neutral the
   thumb lifts into a raised glass lens while the finger is down (from
   `pointerdown`), then switches. Studio and Desk keep their own switch
   with press feedback under the finger.
4. Segmented control and tabs: capsule track with a capsule thumb; never a
   square block in a round track, in any style.
5. Grouped list: inset cards with large corners, hairlines between rows,
   row height and type as in the reference.
6. Alert: compact rounded card with stacked capsule actions.
7. Sheet: large top corners, a round glass close button, capsule primary
   action, grabber only where the sheet has detents. A sheet always has a
   visible close control.
8. Menu and toast in the same family.

Styles: Liquid and Neutral take the platform look in full. Studio and Desk
keep their control shapes and colours and take the chrome geometry.

Files: `packages/css/src/platform/ios.css`,
`packages/tokens/src/platform/ios.json`, the Liquid and Neutral recipes,
and the base CSS and React markup of TabBar, Navbar, Switch,
SegmentedControl, List, AlertDialog, Sheet, Menu and Toast where a part is
missing. The gallery `/platforms` screen for `ios`.

## M2 Android phone surfaces (ds-style)

References: Material 3 for the web, captured in a browser from Google's own
web component catalogue and guidance pages.

Scope, same screens, at 412 by 915: navigation bar (80 tall, 64 by 32
active indicator pill, 24 icons, label below), top app bar, switch
(52 by 32 track, thumb that grows when on and when pressed), segmented
buttons and tabs, lists, dialog (28 corners, text actions at the end),
bottom sheet (28 top corners, drag handle), menu, snackbar, state layers
and ripple from `pointerdown`.

Files: `packages/css/src/platform/android.css` and
`packages/tokens/src/platform/android.json` only. Where a style recipe
breaks the platform's form on chrome (Liquid's lens on the navigation bar
item), `android.css` may reset that paint in `ds.chrome` for this order.
Anything that needs a shared component file or a recipe goes in the report
for the lead.

## Acceptance, both orders

- A sheet per part: reference left, ours right, same width, light and dark.
  The lead looks at every sheet before the owner does.
- The 320px reflow check and the contract run pass for every component
  touched, on the platform; `platform=web` renders as before (zero change,
  or each change listed).
- WCAG 2.2: contrast 1.4.3 and 1.4.11, target size 2.5.8 with the platform
  touch target on controls, reduced motion.
- `npm run check` passes.
- A recording pack (`npm run record`) for Switch, tab bar, alert, sheet.
- The owner signs on a phone. Until then every look is proposed.

## Fix round 1 (after the lead looked at the sheets)

Three small orders, disjoint files. Agents do not commit.

- **M3, recipes on android (ds-style).** Neutral switch off paint on android
  (track `bg.overlay-10`, small thumb in `border.control-hover`, no thumb
  shadow, no thumb edge rule, hover rule off android). Neutral toast on
  android: inverse surface, light text, no border, text button action; check
  contrast in both schemes. Liquid segmented control on android: clear track,
  outline in `border.control-hover`, selected fill `primary.tint-hover`, no
  thumb shadow, no indicator filter. Files: `packages/styles/neutral/recipes/
  {Switch,Toast}.css`, `packages/styles/liquid/recipes/SegmentedControl.css`.
  Proof: reference beside ours for the three parts, web and ios unchanged.
- **M4, press from touch down in React (ds-component).** Set `data-pressed`
  from `pointerdown` to `pointerup`, `pointercancel` and lost capture on
  Button (ButtonBase), Chip, the TabBar item, the linked List row and
  Pagination pages, the way `Switch/drag.ts` does. Add the state to each
  manifest. Tests for each. No CSS files.
- **M5, Angular parity (ds-angular).** The same `data-pressed` on the Angular
  switch and on the Angular forms of the M4 components, and the sheet close
  button in the title bar on phones when window controls are on, matching
  React `Sheet.tsx`.

Known and left alone: the Angular test suite has timing tests that fail on
some runs with no Angular change (dropdown menu exit copy, switch drag). Not
part of the mobile fixes.

## M6, iOS glass material (owner: "I don't see the glass effect in iOS at all but outlines")

Cause, measured by the lead: the glass tokens the iOS chrome uses are 84 to
94 percent opaque (`material.glass` 0.84, `material.glass-strong` 0.92 in
Liquid light), so the blur behind them cannot be seen, and the demo screen
has nothing coloured behind the bars. What is left to the eye is the border.

Owner agent: ds-style. Scope: `packages/css/src/platform/ios.css`, the Liquid
and Neutral recipes that repaint iOS chrome, the iOS block of
`apps/gallery-react/src/platforms.css` and the gallery's iOS phone screen
content. No new token names; build the material from existing tokens with
`color-mix()` and `calc()`.

- **Material.** On `ios` in Liquid and Neutral, the tab bar, its lens, the
  navigation and sheet buttons, the menu, the toast banner, the segmented
  thumb and the held switch lens are clear glass: a low tint (start near 30
  percent of `material.glass-solid` in light, lower in dark), a real
  backdrop blur with saturation, a bright rim on the upper edge and a faint
  dark rim on the lower edge drawn with inset shadows or a masked gradient
  ring (not a flat one colour border), a soft inner glow, and a soft drop
  shadow. The lens of the current tab is brighter than the bar.
- **Three strengths.** Build `clear`, `regular` and `frosted` as one private
  property on the iOS root so the owner can pick; ship the one closest to the
  reference as the default.
- **Content behind.** The gallery iOS phone screen gets our own coloured
  content that scrolls under the bars (generated gradients and shapes, no
  third party art), so the glass has something to show.
- **Fallbacks stay.** `prefers-reduced-transparency`, `prefers-contrast:
  more`, forced colours and no backdrop filter support keep the solid
  material.
- **Contrast.** Labels on the glass meet 4.5:1 (WCAG 2.2 1.4.3) and glyphs
  3:1 (1.4.11) over the lightest and the darkest content of the demo; measure
  from pixels, not from tokens. If clear glass cannot meet it, raise the tint
  only as far as needed and say so.
- **Refraction.** An SVG displacement filter in `backdrop-filter` works in
  Chromium and not in Safari on iOS. Do not ship it as the look; note it as
  an optional later step.

Acceptance: sheets with the reference left and ours right over coloured
content, light and dark, at 1x and at 3x on the tab bar, the navigation
buttons, the menu and the held switch; the three strengths side by side;
`platform=web` and `platform=android` unchanged by computed style;
`npm run contract -- --framework react --platform ios` for TabBar, Navbar,
DropdownMenu, Toast, Switch, SegmentedControl, Sheet; `npm run check`.

## Owner additions (2026-11-17)

The owner gave the vendor's own iOS and iPadOS 27 community kit in Figma
(file key `Cltzs6FZW3N5yiC1x1cpQJ`) as the source for what the iOS components
are, asked that dark mode be checked against the references as well as
light, and asked for support and designs for the folding iPhone.

- **M7, audit (ds-qa, report only).** Coverage map of the kit's component
  families against ours, kit beside ours in Liquid and Neutral, light and
  dark, a verdict per family and scheme, a ranked fix list. Report:
  `docs/reports/lanes/reset-M7-audit.md`. Fix orders follow from it, after
  M6 lands, since both touch `ios.css`.
- **M8, folding iPhone plan (ds-architect).** Facts with sources, modelling
  options, component behaviour per screen and posture, orders. Plan:
  `docs/plan/reset-duo.md`. No code until the owner picks the model.

Use of the kit: read only, as a reference to look at and measure, the same
way as the Mobbin screens. Its licence allows no copying, extracting,
redistributing or derivative assets, and covers mock ups for the vendor's own
platforms only. So: no asset, glyph, text, variable or component name from it
enters the repo, no kit image is committed, and nothing is written to Figma.

- **M9, build every iOS family (owner: "make sure to replicate those all,
  and have them developed").** After M7 reports: one order per family the
  audit marks "not there" or "we do not have it", in the audit's rank order,
  each built in our own code with our own icons and type, in light and dark,
  Liquid and Neutral first. New components go through the contract (lead).
- **M10, test screens against Mobbin (owner: "make then test screens against
  mobbin references").** Whole screens composed only from our components,
  each rebuilt from one Mobbin reference of a native app (music, wallet,
  settings, fitness, and more as the families need), shown reference beside
  ours in light and dark at the phone size, and on the folding iPhone's outer
  and inner screens once M8 lands. Our own content, no third party artwork,
  text or marks; references stay in scratch with their Mobbin links cited.
  A screen is the acceptance test for the families on it.

## F2, refraction on iOS glass (owner: "also make liquid effect not blur")

The M6 material is a tint over a heavy blur. The vendor's material is thick
clear glass: little blur in the middle, and the content behind bends and
brightens near the edge. Owner agent: ds-style, with the files below.

Facts (from developer write ups, not yet from a WebKit source): an SVG
filter in `backdrop-filter: url(#id)` gives real refraction in Chromium
only. Safari parses the value and paints nothing for it, so `@supports`
cannot be the test. No web animation or effect library may be added.

- **Tier 1, real refraction (Chromium).** An inline SVG filter with
  `feDisplacementMap`, whose map is drawn for the size and corner of each
  glass part (bends strongly in a band near the edge, none in the middle),
  plus a small specular layer. Used in `backdrop-filter` with a low blur.
  Switched on by an attribute a small probe sets on the root, off by
  default, so a browser that paints nothing for it never gets it.
- **Tier 2, thick glass without displacement (Safari and the rest).** Low
  blur in the middle and a band near the edge with stronger blur,
  brightness and saturation through a mask, so the edge reads as bent glass
  and the middle stays clear. Pure CSS.
- **Fallbacks stay.** Reduced transparency, more contrast, forced colours
  and no backdrop filter keep the solid paint. Reduced motion does not
  change a still effect.
- **Parts.** Tab bar and its lens, navigation and sheet buttons, menu, toast
  banner, segmented thumb, held switch lens; Liquid and Neutral.
- **Contrast.** With less blur the content behind is sharper, so labels are
  measured again from pixels over the lightest and darkest content: 4.5:1
  for text (WCAG 2.2 1.4.3), 3:1 for glyphs (1.4.11). Raise the tint, not
  the blur, if a label fails.
- **Files.** New: `packages/css/src/platform/ios-refraction.css` (same
  layers as `ios.css`, after it), a map builder and probe in
  `packages/shared/src/`, the React wiring that mounts the filter and sets
  the attribute, tests. `ios.css` belongs to order F1 while it runs.
- **Proof.** 4x crops, reference left and ours right, light and dark, for
  tier 1 and for tier 2 (tier 2 forced in Chromium); a clip of content
  scrolling under the tab bar for each tier; frame cost of scrolling under
  the bar measured with `npm run perceive` against the M6 material; web and
  android unchanged. Safari itself cannot be run here: checking tier 2 on a
  real iPhone is a human gate.

## Fix round from the first three test screens (M10.1, M10.4, M10.5)

The screens were built only from system components and compared with Mobbin
references. What they found, grouped into orders. Looks stay proposed.

- **C1, List (ds-component).** Titles wrap (up to 3 lines, a prop; one line
  stays the default where a row is dense); a plain full width list on `ios`
  with hairlines that start at the text and clear a large cover; a row that
  acts in place without being a link and without a chevron; the chevron of a
  linked row can be turned off; a full width control row (a slider row); a
  row footer slot for a row's own buttons.
- **C2, bars and buttons (ds-component).** Navbar pushed form: back button
  on the button row, large title on its own row below; a glass group that
  holds two or more bar buttons as one capsule; TabBar accessory slot (a
  mini player) and its compact form; Button gray fill with a tinted label;
  icons: shuffle, music note, next track, radio, library, share.
- **C3, focus and small fixes (ds-component).** A keyboard modality flag on
  the root (set by keyboard use, cleared by pointer or touch) that CSS can
  read, so pointer presses draw no ring or box on the stepper, the pop-up
  button and its options, and the grouped field line shows for keyboard
  only; Switch with no label has no empty gap column; SwipeActions: the
  armed label follows the edge, long labels wrap or clip inside the
  capsule, the menu button does not take title room on touch; Toast: the
  start icon aligns with the title, and an undo banner may time out.
- **T1, tools (ds-qa).** `ds doctor` knows the trigger and content wrappers
  of DropdownMenu and ContextMenu and a StatusDot named by `label`; the
  screen host does not nest a main inside a main.
- **F3, iOS look (ds-style, after L2).** Light panels (menu, toast, action
  sheet) go back to the denser tint: on real screens text behind showed
  through the labels (the lead's earlier choice of a letter halo is
  withdrawn); no hairline or band under the top bar at rest; large title 20
  in; page padding 16; section header type as the references (regular,
  secondary colour, larger); pop-up value regular weight in the label
  colour inside list rows; bottom toolbar glyphs about 22 in the tint;
  sidebar selected row in the tint with white text; capsule buttons 48 tall
  where the reference has them; Neutral dark stays neutral gray inside the
  screen host (it showed navy there); content never rests under the bottom
  bar on the phone frame.

## Work resumed by the owner (2026-11-20)

The owner lifted the stop of 2026-11-17 ("continue and take it forward").
At most four agents run at once. Agents do not run the full `npm run check`;
the lead runs it on a quiet machine.

- Batch A, at once: the seven open screens of `reset-ios-families.md`
  section 5 in three orders (M10.2 with M10.8 and M10.9; M10.3 with M10.10;
  M10.6 with M10.7), and K1 below.
- Batch B, after A: Angular forms of the M9 components (M9.14 second part),
  DU5 to DU7, the screen review M10.11.
- Batch C: M9.22 docs, DU9 docs, M9.23 and DU10 reviews, a docs deploy.

### K1 Known gaps from the first three screens (ds-component)

- Goal: close the gaps `STATE.md` lists after fix round F3.
  1. The Navbar large title collapses into the bar title on scroll on `ios`
     (a scroll driven state, `data-collapsed` on the root, with a fallback
     where scroll timelines are missing; reduced motion gets no movement).
  2. The settings screen: the tab bar holder leaves the page flow and floats
     over the content as on `music-library`; the screen's side inset comes
     from the system (16), not from an extra 4 in the screen's CSS.
  3. The settings split view on the folding iPhone's inner screen in
     landscape: the title sits in the detail column, not over the list.
  4. The screen host's drawn device frame is neutral in Neutral dark.
  5. The android time dialog boxes of TimeField get the android look.
  6. The Navbar keyboard map passes on the foldable outer screen in Safari
     size (382 by 580).
- Files owned: `packages/react/src/components/Navbar/**`,
  `packages/css/src/components/navbar.css`, the Navbar part of
  `packages/css/src/platform/ios.css` and the time field part of
  `android.css` (this order only, by the lead's leave), `PageShell` where
  item 2 needs it, `apps/gallery-react/src/ios-screens/settings.tsx`,
  `settings.css`, `Host.tsx`, `frames.ts` and the host's CSS.
- Forbidden: every other screen file, contracts, barrels, generated files.
  A new attribute is asked for in the report; the lead adds the contract row.
- Acceptance: before and after sheets in scratch for each item, in Liquid
  and Neutral, light and dark, one RTL; `npm run contract -- --framework
  react --platform ios --component Navbar`, the same for `web` and with
  `--device duo-outer`; unit tests for the collapse state.

### S1 System gaps the new screens found (ds-component)

- Goal: the screens M10.2, M10.6 to M10.9 reported these; fix them in the
  system, not in the screens.
  1. `ds doctor` rule `ds/slot-limits`: the AlertDialog footer accepts
     AlertDialogCancel and AlertDialogAction; the Card and Tile title slots
     accept their own link part. Fix in the manifests or the rule, with a
     test for each.
  2. Toast on `ios`: the banner respects the top safe area although it is
     portaled outside the Theme (it sat under the camera cutout).
  3. Icons `undo` and `redo` in both icon sets, with the RTL mirror rule.
  4. ListItem `tone="danger"` (`data-tone`), for a destructive row.
  5. CloseButton `emphasis="raised"`: a filled disc that reads over media.
  6. Toolbar: an attached ButtonGroup inside a bottom Toolbar draws as a
     glass group on `ios`, as it does in the Navbar.
  7. SelectionMenu on `ios` light: the capsule reads as a panel (dense
     frosted, as menus do after F3), not as bare text.
- Files owned: the folders and manifests of those components, the doctor
  rule and its tests, the icon maps, their parts of `ios.css`.
- Forbidden: Navbar and its CSS (K1 owns them), screen files, contracts.
- Acceptance: unit tests, doctor 0 findings on `apps/gallery-react/src/ios-screens`
  for the two rules, before and after sheets, contract runs for the touched
  components on `ios` and `web`.

### A2 Angular forms of the M9 components, second part (ds-angular)

- Goal, in this order, as far as one order reaches: `data-modality` wiring
  in the Angular theme; `placement` on TabBar, Navbar and PageShell (DU7);
  ListSection and the List row additions; Pagination dots; Toast `start`,
  `meta`, `closable`; SwipeActions; ActionSheet; SectionIndex; TabBarSearch.
- Files owned: `packages/angular/**` minus barrels and generated files; the
  `angular` status in the touched manifests.
- Acceptance: Angular specs for each, `npm run contract -- --framework
  angular --platform ios` for the touched components.

### A3 Angular forms, third part (ds-angular)

- Goal, in this order: Pagination (numbered and dots), SectionIndex,
  ActionSheet, SkipLink, Drawer, then PageShell with `placement` (it
  provides `DS_BAR_PLACEMENT`, which the Angular TabBar already reads).
  Navbar waits for an order of its own (it needs Sidebar and a navigation
  menu behaviour).
- Files owned: `packages/angular/**` minus barrels and generated files; the
  `angular` status in the touched manifests.
- Acceptance: Angular specs for each, the Angular typecheck, `npm run
  contract -- --framework angular --platform ios` for each touched
  component, and `--device duo-outer` for PageShell.

### C5 Component side of the next round (ds-component)

Runs with Y5 at once. C5 owns component folders, manifests and
`packages/shared`; Y5 owns platform and style CSS. Neither edits the
other's files; each lists what it needs from the other in its report.

1. DU5 of `reset-duo.md` (fold and column aware overlays in React).
2. Theme portals carry the safe area tokens (Dialog, Sheet, ActionSheet,
   Popover, menus), the way S1 did for the Toaster; one shared helper.
3. Sheet header takes one more action besides close and confirm
   (`SheetHeaderAction`).
4. A List row can be the trigger of an ActionSheet, a menu or a dialog
   (`asChild` on the row's action, with `tone="danger"`).
5. Navbar: the large title wraps to two lines below 360 wide instead of an
   ellipsis (WCAG 2.2 1.4.10); the collapse still works (the height is
   measured, not assumed).
6. TabBarSearch is drawn when the bar sits in the side column.
7. `resolveActionSheetPlacement` and `focusFragment` move to
   `packages/shared`; React and Angular import them.
8. A Pager (swipe between pages, scroll snap, keys, dots from Pagination)
   so onboarding pages change by swipe. Proposed as a new component.

### Y5 Style side of the next round (ds-style)

1. DU6 of `reset-duo.md` (fold, list, toast and drawer CSS on `ios`).
2. Text behind the glass tab bar and the floating search field reads as a
   ghost (settings in dark, music search in Arabic): raise the bar's tint
   or add a content fade under floating bars, in both glass styles.
3. Liquid dark: grouped list cards inside a sheet separate from the sheet
   panel (3:1 is not required for a card edge, but the groups must read).
4. The collapsed large title mid scroll: no clipped half title; the list
   under the bar fades at the bar's edge.
5. Arabic share panel: people's names at the caption size the token gives,
   not smaller; a two line clamp.
6. The music library's index bar height after K1 moved the page start.

### Y6 Style fix round after C5 and Y5 (ds-style)

1. Sheet `header-action` on `ios`: on the close and confirm row, before the
   confirm, drawn like the close disc (44, glass where glass ships). In the
   foldable sheet column it sits below the confirm.
2. Navbar large title wraps below 360 wide (no ellipsis, WCAG 2.2 1.4.10);
   the title room reads `--_navbar-heading-size`.
3. TabBar search expanded in the side column: fixed at the foot of the
   content, 48 tall, main keeps block end room.
4. Folded sheet in portrait sits in the bottom segment clear of the bottom
   inset (contract: Sheet, duo-inner-portrait-folded).
5. `music-library.css` line 58 raw z-index (doctor error).
6. Mid collapse on settings: no gap where neither title shows.
7. Onboarding on Pager: move the two inline style objects into
   `onboarding.css`.
8. Toasts with an action in the bottom segment, and a toast centred beside
   the side column, once C6 gives the hooks.

### C6 Component fix round after C5 and Y5 (ds-component)

1. Overlay portals keep `dir` and `lang` of the page (Arabic alert renders
   `dir="ltr"` today); LayerTheme copies them.
2. SplitView demo long text cases: the scroll box is focusable with a name
   (axe, WCAG 2.1.1), and the keyboard map test skips when the view stacks.
3. Toast: `data-has-action` on a toast with an action; the Toaster reads
   the side column (`data-placement` of the shell) and stamps it.
4. Pass detail in Arabic: the people row of the share panel opens at its
   start.
5. Angular forms of SheetHeaderAction, the trigger row, `data-segment` and
   the S1 items (toaster anchor, list `data-tone`, close button `solid`).

### A5 Angular ports the overlays still missing (ds-angular)

1. Sheet with SheetHeaderAction, detents and `data-segment`.
2. AlertDialog with `data-segment` and the default action rules.
3. Popover on the popup layer, with fold collision padding.
4. Navbar (large title, `data-collapsed`, `data-inline-title`, placement).
5. The list trigger row gains Sheet and Popover triggers.

### Z1 The mobile components in Studio (ds-style)

Owner, 2026-11-21: "continue, the rest of the components of other style".
Read by the lead as: the mobile components and test screens were finished
only in Liquid and Neutral; bring them to the same level in the other two
styles. Studio and Desk do not take glass on iOS. That stays.

Scope: ActionSheet, AlertDialog, Banner, Calendar, ColorArea, ColorField,
ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker, DateField,
DatePicker, TimeField, WheelPicker, List, SectionIndex, SelectionMenu,
SharePanel, Stepper, SwipeActions, TabBar, Navbar, PageShell, Pager, Sheet,
Dialog, Toast, Slider, SegmentedControl, SearchField, SplitView, and the
test screens under `/screens/ios/`.

1. Capture each one in Studio, light and dark, English and Arabic, on
   `platform=ios` at 390 wide and on `platform=web`, with overlays open.
2. List every defect: unreadable or low contrast text (WCAG 1.4.3, 1.4.11),
   targets under 24 (WCAG 2.5.8), parts that keep a Liquid or Neutral shape
   that does not belong to Studio, broken spacing, clipped Arabic.
3. Fix in `packages/styles/studio/` only. A defect whose cause is in shared
   CSS or a component is reported, not fixed.
4. Acceptance: contract runs pass for every component touched, on ios and
   web; before and after sheets in scratch; report in
   `docs/reports/lanes/reset-Z1.md`.

### Z2 The mobile components in Desk (ds-style)

The same order as Z1 for Desk, in `packages/styles/desk/` only. Report in
`docs/reports/lanes/reset-Z2.md`.

### Z3 and Z4 The pickers in Studio and Desk (ds-style)

Split from Z1 and Z2 on the owner's word to run more agents at once. Z3 is
Studio, Z4 is Desk. Scope: Calendar, ColorArea, ColorField, ColorPicker,
ColorSlider, ColorSwatch, ColorSwatchPicker, DateField, DatePicker,
TimeField, WheelPicker, Stepper, Slider. Z1 and Z2 keep the rest and the
test screens. One recipe file per component, so no two agents share a file.
The steps and acceptance are those of Z1. Reports:
`docs/reports/lanes/reset-Z3.md`, `reset-Z4.md`.

## Rounds to finish Studio and Desk on mobile (owner, 2026-11-22)

Owner: "go on enhancement and audit rounds with 8 different sub agents
until you get this perfect". Each round runs eight agents with no shared
files: three fix lanes and five audit lanes. The lead runs the full check
and the contract runs after each round, then writes the next round from the
audit reports. The two open decisions are taken at the lead's
recommendation and stay proposed: picker shapes leave `ds.chrome`; in
Studio on iOS the bars and sheets keep the platform capsule and the buttons
inside them take the style's corner.

Mobile set: ActionSheet, AlertDialog, Banner, Calendar, ColorArea,
ColorField, ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker,
DateField, DatePicker, TimeField, WheelPicker, List, SectionIndex,
SelectionMenu, SharePanel, Stepper, SwipeActions, TabBar, Navbar,
PageShell, Pager, Sheet, Dialog, Toast, Slider, RangeSlider,
SegmentedControl, SearchField, SplitView, and the screens under
`/screens/ios/`.

### Round 1

- E1 platform CSS (ds-style). Only `packages/css/src/platform/*.css`.
  1. Move the picker shape rules (ios.css about 3639 to 3727) out of
     `ds.chrome` into `ds.platform`, so a recipe in `ds.recipes` wins.
     Liquid and Neutral must look the same after.
  2. The slider thumb disc and shadow (about line 258) apply only where the
     style has not set its own thumb.
  3. Dialog on iOS hides the window lights (about 3232); the Dialog title
     keeps room for the close control (about 3170).
  4. In Studio on iOS, buttons inside sheets, alerts, action sheets and
     bars take the style's control corner; the bars and panels keep the
     capsule.
- E2 component CSS (ds-component). Only `packages/css/src/components/*.css`.
  1. Radius properties in place of hard coded pills: Slider, ColorSlider,
     ColorArea, Stepper, ColorSwatchPicker, NumberField stepper. Defaults
     stay as today.
  2. Bidi isolation for date and time values (DatePicker, DateField,
     TimeField).
  3. TitleBar in Arabic on iOS (line 103); the wrapped Navbar brand
     (Link.css line 275).
- E3 React and shared (ds-component). Only `packages/react`,
  `packages/shared`, `apps/gallery-react`.
  1. TabBar demo: the two side column search fields overlap; the accessory
     row overlaps its label.
  2. Navbar `title-wrap` demo squeezes the Arabic shell to 2 px.
  3. The sheet header action joins `REFRACTION_PARTS`.
  4. SplitView while folded does not keep an even split.
- Q1 audit Studio, Q2 audit Desk (ds-qa): the mobile set on ios and web,
  with hover, press, focus, disabled, invalid and every overlay open.
- Q3 audit android (ds-qa): the mobile set in all four styles on
  `platform=android`.
- Q4 audit Arabic (ds-qa): the mobile set in all four styles in Arabic:
  mirroring, bidi, clipping, digits, copy register.
- Q5 audit access (ds-qa): the mobile set in all four styles against
  WCAG 2.2 AA: keyboard, focus order and visibility, names, target size,
  contrast in states, reduced motion, forced colors.

Audit lanes change no file but their report
(`docs/reports/lanes/reset-P1-<lane>.md`). Each finding: component, axes,
what, measured value, file and line of the cause, severity (blocker, major,
minor).
