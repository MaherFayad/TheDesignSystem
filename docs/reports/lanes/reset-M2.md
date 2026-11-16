# Lane report: M2 Android phone surfaces

Order M2 of `docs/plan/reset-mobile.md`. On the web the `android` platform
follows Material 3 as Google ships it for the web (`DECISIONS.md`, "Platform
looks on the web follow each vendor's web language"). Every look here is
**proposed** until the owner signs it on a phone. Not committed.

## Files changed

- `packages/css/src/platform/android.css`: the work of this order (both
  layers, `ds.platform` and `ds.chrome`).
- `apps/gallery-react/src/platforms.css`: one block, `android` only: the
  phone screen fills the frame (no stage padding), so the top app bar and
  the navigation bar run the full width, as the iOS block above it does.
- `packages/contract-tests/src/record/packs/M2.json`: the recording pack.
- `packages/tokens/src/platform/android.json`: no change. Every value the
  order needs is already a platform token (`shape.corner.*`,
  `opacity.state.*`, `elevation.level*`, `type.*`, `size.control.*`,
  `size.touch.android`). Platform names are fixed by `contract.json`, so the
  chrome lengths are built from them (80 is `size.touch.android` plus
  `size.control.xs`, 16 is twice `space.fixed.m`). The chrome no longer reads
  the fluid `space.*` tokens, so it does not move with density.

## References

Captured in Chromium at 412 by 915 (phone profile, touch), light and dark,
kept outside the repo. Every host answered 200.

- Material Web live components, `https://material-web.dev/components/<name>/stories/`
  for switch, tabs, dialog (Open, Confirm, Choose), list, menu, button (the
  demos run in an iframe from `unpkg.com/playground-elements`), and the
  component pages `https://material-web.dev/components/<name>/` for list,
  menu, button, icon button, FAB, text field.
- Material 3 guidance, `https://m3.material.io/components/<name>/specs` for
  navigation-bar, app-bars, switch, segmented-buttons, tabs, lists, dialogs,
  bottom-sheets, menus, snackbar, and
  `https://m3.material.io/foundations/interaction/states/state-layers`. The
  measurement images on those pages were saved from `lh3.googleusercontent.com`.
- Material Web has no navigation bar, top app bar, bottom sheet, snackbar or
  segmented buttons; for those the guidance images are the reference.
  Nothing below is from memory.

Studied for structure, proportion, sizes, state layers and behaviour. No
code, artwork, icon, mark or font was copied. Icons stay Lucide; fonts stay
the system's tokens.

## Per part

Verdicts are mine, by eye, reference beside ours: same family, close, or not
there. Captures of ours: `docs/reports/reset/M2/<part>-<style>-<scheme>.png`.

### Navigation bar (TabBar)

Reference: m3.material.io navigation-bar specs (baseline bar, states,
measurements).

- Matched: full width, square, no floating capsule, no rule on top; 80
  tall (12 above the pill, the 64 by 32 pill, 4, the 16 line of the 12
  label, 16 under); icons drawn at 24 (the component draws 16, the platform
  sizes the svg); a tonal pill behind the icon only; the current label
  bold, the others medium in the muted text; the large badge at the icon's
  top end. State layers on the pill, not the item: hover 8%, focus 10%,
  pressed 10% (`opacity.state.*`), and the ripple inside the pill.
- Liquid: the glass lens behind the whole current item is reset in
  `ds.chrome` (no background, no shadow on the item, the pill is back).
  Liquid keeps its glass bar, its tint and its weights.
- Still differs: the bar fill is each style's surface, not Material's tinted
  surface container (no colour role system yet). Press feedback on touch
  arrives at release (see "Press").
- Note for the owner: the current guidance marks this 80 tall baseline bar
  "not recommended" and recommends the flexible navigation bar (64 tall,
  56 by 32 pill, label 4 under). The order asked for the baseline; switching
  is one block of `android.css`.
- Verdict: **same family** in Neutral and Liquid, light and dark.

### Top app bar (Navbar)

Reference: m3.material.io app-bars specs, small app bar measurements.

- Matched: 64 tall, full width, 4 at the sides, the title 16 from the edge
  in title large (22 on 28), no rule under it, the title in the on surface
  colour without the link underline (it stays a link with its focus ring).
- Still differs: the trailing action is a text button ("Edit list"), where
  Material shows 24 icons in 48 targets; that is the screen's content.
- Verdict: **same family**.

### Switch

Reference: material-web.dev switch stories, at rest, held, light and dark;
m3.material.io switch specs.

- Matched: track 52 by 32 (it was 65 by 40), a 2 outline while off, the
  thumb 16 off, 24 on, 28 while pressed, the 40 state layer round the
  thumb (8, 10, 10%). The press shows from `pointerdown` (Switch.css reads
  `data-pressed`, which Switch now sets): the recording shows the first
  change 17ms after the finger lands, while it is down.
- Still differs, Neutral: Neutral's recipe paints the off track a filled
  gray with a white dot and a soft shadow, so off does not read as
  Material's outlined track with a dark dot. A recipe change (request 2).
- Liquid keeps its capsule thumb (ruling 16: the style wins on controls).
- Verdict: **close** in Neutral (size, travel and press are right, the off
  paint is not), Liquid keeps its own.

### Segmented buttons (SegmentedControl)

Reference: m3.material.io segmented-buttons specs (states, measurements).

- Matched in Neutral, Studio and Desk: 40 tall, fully round outer ends, an
  outline round the set and between segments, the selected segment a tonal
  fill that follows the round end when it is first or last (the track clips
  it), 12 at the sides of a text segment, the label in label large at one
  weight.
- Still differs: no check icon on the selected segment (needs markup,
  request 5). In Liquid the recipe draws a filled capsule track with no
  outline and a glass block on the selected item: a square block in a round
  track, the fault the owner named. The recipe wins on a control, so this
  file cannot fix it (request 4).
- Verdict: **close** in Neutral; **not there** in Liquid.

### Tabs

Reference: material-web.dev tabs stories (primary and secondary).

- Matched: 48 tall, tabs share the width, the label 14 medium, the active
  label in the primary colour, the 3 indicator under the content of the tab
  (not its whole width) with round top corners, a rule under the list.
- Still differs: tabs with icons put the icon beside the label (Material's
  primary tabs stack it above, 64 tall), a markup choice of the component.
  The "soft" emphasis is our own variant and has no Material form.
- Verdict: **same family** for text tabs, **close** with icons.

### Lists

Reference: material-web.dev list stories; m3.material.io lists specs (one,
two and three line measurements).

- Matched: rows 56 and 72, 16 at the sides, a 24 leading icon (was 16) 16
  from the text, the headline in body large, the supporting text in body
  medium and the muted text, no hairlines in the inset list.
- Still differs: trailing icon buttons in the list demo stay 16 (size sm).
  The settings screen's inset cards are the screen's choice; they read as
  Material's segmented list.
- Verdict: **same family**.

### Dialog (AlertDialog, Dialog)

Reference: material-web.dev dialog stories, Confirm and Open, light and dark;
m3.material.io dialogs specs (padding).

- Matched: 28 corners, 24 inside, the 24 icon centred at the top with no
  disc, the headline in headline small (24 on 32) centred under an icon and
  start aligned without one, 16 to the supporting text, 24 to the actions,
  text actions 40 tall at the end, 8 apart, with capsule state layers; no
  footer band and no rule (reset of the style's footer fill and divider);
  one column in every style (Studio set the icon beside the title).
- Still differs: our dialog is 364 wide (24 from each edge); Material Web
  sizes it to its content, so its example is 320. Neutral blurs the scrim,
  Material does not (style paint). Radix focuses the first action on open,
  so it shows its focus ring.
- Verdict: **same family**.

### Bottom sheet (Sheet)

Reference: m3.material.io bottom-sheets specs (anatomy, light and dark).

- Matched: full width, 28 top corners, the 32 by 4 drag handle in a 48
  target, 16 at the sides, the title in title large, a 40 close button with
  a 24 icon and a 48 target (a sheet always has a visible close), no bands
  or rules between header, body and footer.
- Still differs: the actions are the screen's filled and outlined buttons,
  which Material allows in a sheet; the field inside is the style's.
- Verdict: **same family**.

### Menu (DropdownMenu, ContextMenu, Select list)

Reference: material-web.dev menu stories, light and dark; m3.material.io
menus specs (baseline).

- Matched: 4 corners, 8 above and below the rows, rows 48 with 12 at the
  sides, 24 leading icons (was 16), label large text, elevation level 2.
- Still differs: Neutral and Liquid recipes keep their own corner and
  shadow on the menu (a control, the style wins): Liquid's menu is round.
  The current guidance also shows a newer menu with 16 corners; the order
  asked for the baseline.
- Verdict: **same family** in Neutral, **close** in Liquid.

### Snackbar (Toast)

Reference: m3.material.io snackbar specs (measurements, colour).

- Matched: 48 tall, one row, the text 16 from the start, the action 8 from
  the end, the close at the end, 4 corners, no leading icon, no timer line,
  and the snackbar sits 16 above the navigation bar, never over it.
- Still differs: Material's snackbar is the inverse surface (dark on a light
  screen) with a text action. Neutral's recipe paints a white card with an
  outlined, shadowed action button (request 3). Liquid's glass with a text
  action is close in form.
- Verdict: **close** in form, **not there** in colour for Neutral.

### Floating action button (on the form screen)

- 56 with a 16 corner (`shape.corner.large`), a 24 icon (was 16), 16 from
  the edge and 16 above the navigation bar (it covered the Settings item).

## Press: state layer and ripple from pointerdown

`:active` does not reach a held touch in Chromium's touch emulation: with a
finger held 300ms on a switch or a navigation bar item, `:active` matched
nothing. The recording agrees: the button press shows its first change
117ms after the finger landed, after it lifted. The switch, which now sets
`data-pressed` on `pointerdown`, shows its first change 17ms after the
finger lands.

`android.css` now reads `:is(:active, [data-pressed])` for every ripple
(button family, chip, navigation bar item, linked list row, pagination
page), so each component that sets `data-pressed` gets the press at once.
React needs that attribute (request 1). Reduced motion keeps the state layer
and shows the ripple whole at once, with no growth or travel.

## Studio and Desk

They keep their control shapes and colours and take the chrome geometry:
navigation bar 80 with the pill and 24 icons, top app bar 64 with a 22
title, dialog 28 corners and actions at the end (Desk keeps its title bar
without lights), sheet 28 top corners and handle, snackbar 48. Captures:
`platforms-android-studio-light.png`, `platforms-android-desk-light.png`.

## Arabic, right to left

The bars, the dialog, the sheet, the menu and the snackbar mirror; the
pill, the badge and the ripple origin follow the reading direction.
Captures: `platforms-android-neutral-light-ar.png`,
`dialog-neutral-light-ar.png`. The gallery's sample strings stay English on
these screens.

## Resets of style paint on chrome (order M2, in `ds.chrome`)

1. Navigation bar item: `background-color: transparent` and
   `box-shadow: none` on the current item (Liquid's lens), and
   `--_tab-bar-pill-bg` back to the tonal pill (Liquid sets it transparent).
2. Dialog, alert, sheet, drawer: `--_dialog-footer-bg`,
   `--_dialog-header-bg` and `--_dialog-divider-color` transparent (the
   band and the rules do not show).
3. Alert icon: `background-color: transparent` (no disc).

## Requests for the lead (shared files)

1. **React, `data-pressed`.** Set `data-pressed` on `pointerdown` and remove
   it on `pointerup`, `pointercancel` and `lostpointercapture` (as
   `Switch/drag.ts` does) on: `Button/ButtonBase.tsx` (the button family and
   the FAB), `Chip/Chip.tsx`, the item of `TabBar/TabBar.tsx` (beside
   `pressOrigin`), the linked row of `List/List.tsx` (line 194), and the page
   of Pagination. Add `data-pressed` to each manifest's `states`.
   `android.css` already reads it.
2. **Neutral Switch recipe** (`packages/styles/neutral/recipes/Switch.css`):
   on android step aside for the off paint, for example
   `[data-style='neutral'][data-platform='android'] [data-ds='switch'] { --_switch-bg: var(--ds-color-bg-overlay-10); --_switch-thumb-off: var(--ds-color-border-control-hover); --_switch-thumb-shadow: none; }`,
   the hover rule guarded off android, and the android
   `--_switch-thumb-edge: var(--ds-color-bg-surface)` rule removed. Then off
   reads as Material's outlined track with a dark dot.
3. **Neutral Toast recipe** (`packages/styles/neutral/recipes/Toast.css`):
   on android the inverse snackbar: `--_toast-bg: var(--ds-color-bg-inverse)`,
   `--_toast-fg` the body colour, no border, and the action as a text
   button (`--_button-bg: transparent`, `--_button-border-color: transparent`,
   `--_button-shadow: none`, a light action colour); contrast to be checked
   on both schemes.
4. **Liquid SegmentedControl recipe**
   (`packages/styles/liquid/recipes/SegmentedControl.css`): on android
   `--_segmented-control-bg: transparent`,
   `--_segmented-control-border-color: var(--ds-color-border-control-hover)`,
   `--_segmented-control-thumb-bg: var(--ds-color-primary-tint-hover)`,
   `--_segmented-control-thumb-shadow: none`,
   `--_segmented-control-indicator-filter: none`. Without it the selected
   item is a square glass block in a round track.
5. **SegmentedControl markup**: a check part on the selected segment
   (`data-part="check"`, the Lucide `check` icon, `aria-hidden`), hidden in
   `SegmentedControl.css` and shown at 18 by `android.css`.
6. **Recording clips** (`packages/contract-tests/src/record/clips.ts`): a
   `tab-bar-press` clip (hold a navigation bar item 600ms, then tap another)
   and an `alert-open` clip, then add both to `packs/M2.json`. The pack has no
   navigation bar clip today.
7. **Tabs with icons**: the icon above the label, 64 tall, on android
   (Tabs markup or base CSS), if the owner wants Material's primary tabs.
8. **Owner decision**: baseline navigation bar (80, as ordered) or the
   flexible bar the current guidance recommends (64, 56 by 32 pill).

## Colour

There is no Material colour role system yet (the later `tonal` style). The
nearest roles used: secondary container, the stronger primary tint
(`color.primary.tint-hover`); on surface variant, `color.text.muted`; on
surface, `color.text.bright`; primary, `color.primary.on-surface`. Where it
falls short: bars and sheets are not tinted surface containers, the
snackbar is not inverse, and the pill in Studio is a gray overlay.

## Web impact

Every rule in `android.css` and the new `platforms.css` block is under
`[data-platform='android']`. Proof: on 96 web pages (`/c/<id>` for tab-bar,
navbar, switch, segmented-control, tabs, list, dialog, alert-dialog, sheet,
dropdown-menu, toast, floating-action-button, icon-button, close-button,
button, chip, checkbox, radio-group, plus the six `/platforms/screen`
screens, in all four styles, `platform=web`, 1280 by 800), the computed
style of every element and its `::before` and `::after` (26 properties,
every `--_` property and the box) was taken, then every CSS rule whose
selector names `data-platform='android'` (170 rules) was deleted from the
page and it was taken again. Zero differences on all 96 pages
(`docs/reports/reset/M2/web-compare.json`). `ios` is not read by any of
these rules either.

## WCAG 2.2

Contrast, measured from computed colours on the android screens
(a scratch script, all four styles, light and dark):

| Pair | Lowest | Where |
| --- | --- | --- |
| Navigation bar label, inactive (1.4.3) | 5.84 | Desk dark |
| Current label, icon on the pill (1.4.3) | 5.31 | Liquid dark |
| Top app bar title (1.4.3) | 13.5 | Neutral dark |
| Dialog text and action (1.4.3) | 5.88 | Studio light |
| Snackbar text and action (1.4.3) | 6.45 | Neutral dark |
| Segment outline (1.4.11) | 5.23 | Neutral light |
| Switch off track edge (1.4.11) | 3.44 | Neutral light |
| Switch off dot on its track (1.4.11) | 3.48 | Neutral dark |

Below 3:1, both from a recipe that wins on a control: Liquid's segmented
control has no outline (1.0, the filled track carries the boundary), and
Liquid light's white off thumb on its light track is 1.28 (its track edge is
4.42). Request 4 covers the first; the second is Liquid's switch, left to its recipe.

Target size: every control keeps its 48 target on android (the hit part or
the item). Reduced motion: state layers stay, the ripple shows whole at
once, the switch thumb does not travel. Motion uses duration and ease
tokens only; no layout property animates.

## Checks

- `npm run contract -- --framework react --platform android --component TabBar,Navbar,Switch,SegmentedControl,Tabs,List,AlertDialog,Dialog,Sheet,DropdownMenu,Toast,FloatingActionButton,IconButton,CloseButton,Button,Chip,Checkbox,RadioGroup --tag M2-android`:
  874 passed, 0 failed, 20 skipped (Navbar's skips are the suite's own),
  every component passes: anatomy, states, keys, WCAG 2.5.8 target size at
  24 in every style and density, the 320px reflow in en and ar, axe in every
  style, scheme and direction (`docs/reports/contract-react-M2-android.json`).
- The 320px reflow again on the final CSS (`--grep sideways`) for
  SegmentedControl, Tabs, TabBar, Toast, Navbar, AlertDialog, Sheet and
  FloatingActionButton: 64 of 64 pass
  (`docs/reports/contract-react-M2-android-reflow.json`).
- The platform touch target, `--target-min 48` (Material's guide, not
  WCAG): Switch, TabBar and List pass. Button, IconButton, CloseButton,
  SegmentedControl and Tabs failed this guide before this order as well
  (`docs/reports/contract-react-android-min48.json`, order 1.17b). What is
  left: the 40 tall button family in Desk in every density and IconButton in
  some densities (the hit part does not reach 48 there), the 40 tall
  segments (Material gives them a 48 target with no drawn change; ours has
  no hit part on a segment), and the Tabs panel, which is focusable text,
  not a control. AlertDialog, DropdownMenu, Sheet and Toast fail only
  through the Button that opens them. Not fixed in this order
  (`docs/reports/contract-react-M2-android-min48.json`).
- `npm run check`: every step passes (tokens build, gen, typecheck, eslint
  with the CSS gates, manifests, vitest, and the workspace checks).
- Recording pack `npm run record -- --order M2`: switch, button press,
  dialog open and sheet drag, Neutral and Liquid, light and dark, on the
  Pixel frame, 16 clips (`docs/reports/reset/M2/record/`, sign sheet
  `docs/reports/reset/signoff/M2.md`). The switch changes 17ms after the
  finger lands, while it is down; the Neutral button and dialog trigger
  change only after the finger lifts (117 and 133ms), which is the
  `data-pressed` request. No navigation bar clip exists yet (request 6).
- Web: zero difference on 96 pages (above).

## Captures

`docs/reports/reset/M2/` (ours only, PNG, each under 160 KB):

- Per part, Neutral light, Neutral dark, Liquid light at 412 wide:
  `navigation-bar-*`, `top-app-bar-*`, `switch-*`, `switch-held-*`,
  `segmented-buttons-*`, `tabs-*`, `list-*`, `dialog-*`, `bottom-sheet-*`,
  `menu-*`, `snackbar-*`.
- The full Android settings screen in all four styles:
  `platforms-android-{neutral,liquid,studio,desk}-light.png`, and in Arabic:
  `platforms-android-neutral-light-ar.png`, `dialog-neutral-light-ar.png`.
- `web-compare.json`: the web proof above.

The reference sheets (reference left, ours right) are outside the repo, in
the lead's scratch folder named in the hand back.

## Decisions I made

1. Chrome lengths are fixed, built from platform tokens, so the bars,
   dialog, sheet and snackbar do not move with density or viewport width.
2. The secondary container role maps to `color.primary.tint-hover`; the
   lighter `tint` was too faint beside Material's pill.
3. The navigation bar follows the baseline the order names, not the
   flexible bar the guidance now recommends (owner decision, request 8).
4. The FAB and the snackbar move up above a navigation bar when the screen
   has one (`:has`), so neither covers it.
5. The gallery stage padding is dropped on android phone screens only, so
   the bars meet the screen edges as on a phone.
