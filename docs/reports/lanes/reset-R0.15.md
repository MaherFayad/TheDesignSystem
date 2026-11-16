# Lane report: R0.15 Shape split between styles and platforms

Order R0.15 of `docs/plan/reset.md`, ruling 16 of `DECISIONS.md`: when a
style and a platform disagree on shape, the style wins on controls and the
platform wins on sheets, bars and alerts. No new look: the rule decides. The
looks it touches stay **proposed**. Not committed.

## What I built

- `packages/css/src/platform/ios.css` and `android.css`, each split in two,
  in the form `macos.css` (R0.14) already uses:
  - `ds.platform` (before `ds.recipes`): every control rule, unchanged, and
    the paint and motion of chrome (the alert's text actions and hairline
    color, the grabber color, the tab bar tint and weights, the toast edge
    color, shadow, durations and curves, the backdrop blur).
  - `ds.chrome` (after `ds.recipes`, new): the geometry and placement of the
    Navbar, TabBar, Dialog, AlertDialog, Sheet, Drawer, Toaster and Toast.
    Heights, widths, corners, paddings, title sizes, the action grid, the
    entry edge (`--_dialog-enter-y`), the grabber, the stack direction and
    which parts show (no timer line, no window controls). Never a color, a
    font family, a border color, a shadow color or a material.
- Chrome lengths that read a style token (`radius.card`, `radius.panel`,
  `radius.sm`, `radius.xs`, `font.size.l`, `xl`, `s`) now read platform
  tokens, so the result is equal in all four styles:

  | Part | `ios` | `android` |
  | --- | --- | --- |
  | Alert and Dialog corner | `shape.corner.large` (16) | `shape.corner.extra-large` (28) |
  | Sheet corner | `shape.corner.large` (16, the example in `anatomy.md`) | `shape.corner.extra-large` (28) |
  | Drawer corner | `shape.corner.large` | `shape.corner.medium` |
  | Toast corner | `shape.corner.large-increased` (20) | `shape.corner.extra-small` (4) |
  | Grabber | `shape.corner.full` | `shape.corner.full` |
  | Alert message, toast text | `type.body-medium` (15) | `type.body-medium` (14) |
  | Sheet title | `type.title-small` (15) | `type.title-small` (14) |
  | Tab bar label | `font.size.xs` (shared) | `type.label-medium` (12) |
  | Top bar text | `font.size.2xl` (shared) | `type.body-medium` |

  Shared tokens that are the same in every style (`space.*`,
  `font.size.2xl`, `xs`, `4xl`, `5xl`, `dialog.width.*`, `size.*`) stay.
- New chrome rules that the split needs:
  - TabBar on `ios` and `android`: full width, no margin, the base
    paddings with the safe area, a top hairline only, square
    (`shape.corner.none`), and a style's band above the bar kept inside the
    screen. Liquid's floating capsule stays on `web` and `macos`.
  - No window controls in a phone AlertDialog or Sheet: the `controls`
    part of the title bar is hidden on `ios` and `android` (Desk). The bar
    and its title stay, at the platform's title size
    (`--_title-bar-font-size`).
  - Sheet on phones: the phone padding of `Dialog.css` (`space.xl`,
    `space.l`) and the sheet title size, so Studio's dense bands and
    Neutral's roomy ones do not change the sheet.
  - Android alert actions: a capsule state layer (`shape.corner.full`) in
    every style.
- Controls side, in the same two files: the button family
  (Button, IconButton, ToggleButton, CloseButton, CopyButton) no longer
  takes a corner from the platform. `ios` set `radius.panel`, `sm`,
  `field`, `card` by size and a pill on IconButton; `android` set a pill.
  Both read over the style's own corner, so a Studio button was a capsule on
  Android. Heights, paddings, label size, hit area and press stay the
  platform's. The FloatingActionButton keeps its platform corner (see
  "Left open").
- Style recipes (`packages/styles/*/recipes/{Switch,Dialog,Toast}.css`):
  - Liquid Switch: the capsule (`--_switch-width`, `--_switch-thumb-width`)
    is no longer guarded to `web`. It is the style's control shape, so it
    holds on every platform.
  - Switch press (Studio, Neutral, Liquid): the press stays the platform's
    where the platform sets one (`style-pack.md`: the platform sets press
    feedback). The guard is now `:is([data-platform='web'],
    [data-platform='macos'])` instead of `web` alone, so macos, which sets no
    switch press, gets the style's. Same specificity as before.
  - Toast timer line (Studio, Neutral, Desk): the `web` guard is gone. The
    phones hide the line in `ds.chrome`; macos now draws the style's line
    instead of the base 2px one.
  - Dialog footer (Studio, Neutral, Desk): the guard keeps only the footer
    paint off the phones, where the platform draws text actions. It is now
    `:is([data-platform='web'], [data-platform='macos'])`, so macos gets the
    style's footer (it has no footer of its own). Geometry on phones no
    longer depends on it: `ds.chrome` wins.
  - TabBar and Navbar recipes: no change needed. Liquid's TabBar geometry
    loses to `ds.chrome` on phones; no Navbar recipe sets bar geometry.
- Follow up "From R0.18" item 1: done, one selector. Desk's
  `packages/styles/desk/recipes/Density.css` button rule now has
  `[data-ds='toggle-button'][data-part]` in its `:not()`, so SegmentedControl
  and ToggleGroup items keep the size their parent gives them. Only toggle
  button parts are excluded: a plain `:not([data-part])` would also have
  shrunk the AlertDialog action and cancel buttons and SplitButton on the
  web. The rule rises by one attribute of specificity; no other Desk recipe
  rule sets `--_button-height` on a default size button, so nothing else
  moves (the web compare below confirms it).

## Measurements

Gallery `/platforms/screen` at 390 by 844, dark, reduced motion, each style
at its own default density, `apps/gallery-react` served from source.
Control: Button (the Save changes button), Switch track and thumb, Checkbox
box. Chrome: Sheet, AlertDialog, TabBar, Navbar, Toast. JSON:
`docs/reports/reset/R0.15/shapes-before.json`, `shapes-after.json`.
`before > **after**` where a value moved.

### `ios`

| Part | Studio | Neutral | Desk | Liquid |
| --- | --- | --- | --- | --- |
| Button (h, radius) | 44, 0px > **44, 2px** | 44, 12px > **44, 8px** | 44, 999px | 44, 22px > **44, 999px** |
| Switch track (w x h, radius) | 61.6x30.8, 2px | 61.6x30.8, 999px | 61.6x30.8, 999px | 61.6x30.8, 999px |
| Switch thumb (w x h) | 40.2x26.8 | 40.2x26.8 | 40.2x26.8 | 40.2x26.8 |
| Checkbox (size, radius) | 22, 0px | 22, 999px | 22, 6px | 22, 999px |
| Sheet (w, radius) | 390, 0 0 0 0 > **390, 16 16 0 0** | 390, 12 12 0 0 > **390, 16 16 0 0** | 390, 16 16 0 0 | 390, 28 28 0 0 > **390, 16 16 0 0** |
| Sheet grabber, lights | 36x5, no | 36x5, no | 36x5, yes > **36x5, no** | 36x5, no |
| AlertDialog (w, radius, title) | 270, 2px, 13px > **270, 16px, 16px** | 270, 12px, 16px > **270, 16px, 16px** | 270, 16px, 14px > **270, 16px, 16px** | 270, 24px, 16px > **270, 16px, 16px** |
| Alert actions (layout, h, radius) | grid, 44/44, 0px | grid, 44/44, 0px | grid, 44/44, 999px > **grid, 44/44, 0px** | grid, 44/44, 0px |
| Alert lights | no | no | yes > **no** | no |
| TabBar (w x h, radius) | 362x56, 0px | 358x58, 0px | 362x56, 0px | 333.9x59, 999px > **358x58, 0px** |
| TabBar icon box | 24x24 | 24x24 | 24x24 | 24x24 |
| Navbar (h, title) | 49, 16px | 50, 16px | 49, 16px | 50, 16px |
| Toast (w, radius, timer) | 358, 0px, 0 > **358, 20px, 0** | 358, 12px, 0 > **358, 20px, 0** | 358, 12px, 0 > **358, 20px, 0** | 358, 22px, 0 > **358, 20px, 0** |
| Toast padding (block, inline) | 3, 6 > **12, 16** | 14, 18 | 8, 10 > **12, 16** | 14, 18 |

### `android`

| Part | Studio | Neutral | Desk | Liquid |
| --- | --- | --- | --- | --- |
| Button (h, radius) | 48, 999px > **48, 2px** | 48, 999px > **48, 8px** | 48, 999px | 48, 999px |
| Switch track (w x h, radius) | 65x40, 2px | 65x40, 999px | 65x40, 999px | 65x40, 999px > **80x40, 999px** |
| Switch thumb (w x h) | 30.9x30.9 | 30.9x30.9 | 30.9x30.9 | 30.9x30.9 > **46.3x30.9** |
| Checkbox (size, radius) | 18, 0px | 18, 4px | 18, 6px | 18, 999px |
| Sheet (w, radius) | 390, 0 0 0 0 > **390, 28 28 0 0** | 390, 24 24 0 0 > **390, 28 28 0 0** | 390, 16 16 0 0 > **390, 28 28 0 0** | 390, 28 28 0 0 |
| Sheet grabber, lights | 32x4, no | 32x4, no | 32x4, yes > **32x4, no** | 32x4, no |
| AlertDialog (w, radius, title) | 341.9, 2px, 13px > **341.9, 28px, 24px** | 333.9, 24px, 24px > **333.9, 28px, 24px** | 341.9, 16px, 14px > **341.9, 28px, 24px** | 333.9, 24px, 24px > **333.9, 28px, 24px** |
| Alert actions (layout, h, radius) | flex, 48/48, 2px > **flex, 48/48, 999px** | flex, 48/48, 8px > **flex, 48/48, 999px** | flex, 48/48, 999px | flex, 48/48, 999px |
| Alert lights | no | no | yes > **no** | no |
| TabBar (w x h, radius) | 362x95, 0px | 358x97, 0px | 362x95, 0px | 333.9x98, 999px > **358x97, 0px** |
| TabBar indicator pill | 64x32 | 64x32 | 64x32 | 64x32 |
| TabBar label | 11px > **12px** | 13px > **12px** | 13px > **12px** | 14px > **12px** |
| Navbar (h, title) | 64, 20px | 64, 20px | 64, 20px | 64, 20px |
| Toast (w, radius, timer) | 358, 0px, 0 > **358, 4px, 0** | 358, 12px, 0 > **358, 4px, 0** | 358, 12px, 0 > **358, 4px, 0** | 358, 22px, 0 > **358, 4px, 0** |
| Toast padding (block, inline) | 3, 6 > **12, 16** | 14, 18 | 8, 10 > **12, 16** | 14, 18 |

### `macos`

Only the recipe guards reach macos; `macos.css` is untouched.

| Part | Studio | Neutral | Desk | Liquid |
| --- | --- | --- | --- | --- |
| Button (h, radius) | 28, 2px | 28, 8px | 28, 999px | 28, 999px |
| Switch track (w x h, radius) | 38.5x22, 2px | 38.5x22, 999px | 38.5x22, 999px | 38.5x22, 999px > **44x22, 999px** |
| Switch thumb (w x h) | 18x18 | 18x18 | 18x18 | 18x18 > **27x18** |
| Checkbox (size, radius) | 16, 0px | 16, 4px | 16, 6px | 16, 999px |
| Sheet (w, radius) | 366, 16 all | 366, 16 all | 366, 16 all | 366, 16 all |
| AlertDialog (w, radius, title) | 366, 16px, 13px | 366, 16px, 13px | 366, 16px, 13px | 366, 16px, 13px |
| Alert actions (layout, h, radius) | flex, 28/28, 2px > **flex, 32/32, 0px** (Studio's cells) | flex, 28/28, 8px | flex, 28/28, 999px | flex, 28/28, 999px |
| Lights on alert and sheet | no | no | yes | no |
| Toast timer line | 2px > **1px** | 2px > **1px** | 2px > **3px** | 2px |

Also on macos, not in the table: the Neutral and Desk alert footers now take
their recipe's fills (Neutral's blue main action, Desk's yellow pill), as on
the web.

### Equal in every style (phones, density default)

Spacing tokens scale with density, and Neutral and Liquid default to
`comfortable`, so the 4px differences above (tab bar 358 against 362,
toast padding 14 against 12) are the density axis. With `density=default`
in every style (`shapes-after-density-default.json`), every chrome value is
equal across the four styles:

| Part | `ios`, all four styles | `android`, all four styles |
| --- | --- | --- |
| Sheet | 390 wide, 16 16 0 0, grabber 36x5, title 15, no lights | 390 wide, 28 28 0 0, grabber 32x4, title 14, no lights |
| AlertDialog | 270 wide, 16, title 16, action grid 44 tall, radius 0, no lights | 341.9 wide, 28, title 24, actions 48 tall, capsule, no lights |
| TabBar | 362x56, square, icon box 24, label 10 | 362x95, square, pill 64x32, label 12 |
| Navbar | 49 tall, title 16 | 64 tall, title 20 |
| Toast | 358 wide, radius 20, padding 12 16, no timer, text 15 | 358 wide, radius 4, padding 12 16, no timer, text 14 |

Controls keep the style's shape on the same screens: Button 2px (Studio),
8px (Neutral), capsule (Desk, Liquid); Checkbox 0 (Studio), 6 (Desk), round
(Liquid), and the platform's corner in Neutral, which sets none of its own
(R0.14 ruling 2); Switch corner 2px in Studio and Liquid's capsule thumb on
every platform. Heights stay the platform's (44 on ios, 48 target on
android, 28 on macos).

Heights that still differ by style, all from content: the sheet (ios 269 to
304, android 292 to 329: font family, the style's text sizes in the body and
field, Desk's title bar), the alert (ios 191 Studio, 209 Neutral and
Liquid, 210 Desk: Studio's icon beside the title, Desk's title bar) and the
toast (Studio's one line layout). Widths, corners, title sizes and action
layout are equal.

## The web platform

Computed style compare, before and after, of every element on 68 pages:
`/c/<id>` for switch, dialog, alert-dialog, sheet, drawer, toast, tab-bar,
navbar, button, segmented-control, toggle-group, icon-button and copy-button,
plus the four `/platforms/screen` screens, in all four styles, with
`platform=web` at 1280 by 800: 24 computed properties, every `--_` private
property and the box of each element. Summary:
`docs/reports/reset/R0.15/web-compare.json`.

- Zero change on 62 pages.
- 6 pages change, all from the Density follow up and all in Desk: the
  SegmentedControl and ToggleGroup items go from 36 to 24 tall (the
  SegmentedControl from 44 to 32) and their inline padding from 16 to 12,
  the size their parent gives them. `/c/segmented-control`,
  `/c/toggle-group` and the SegmentedControl on the four platform screens.
- One page (`/c/navbar`, Neutral) differed in the first after run because
  the page had not finished loading; measured again it is identical.
- The shape table above at 390 wide also shows no change on `web`.

## Evidence

`docs/reports/reset/R0.15/`, before on the left and after on the right, at
390 by 844 (each under 100 KB):

- Sheet: `desk-ios-sheet.png`, `desk-android-sheet.png`,
  `liquid-ios-sheet.png`, `liquid-android-sheet.png`.
- AlertDialog: `desk-ios-alert-dialog.png`, `desk-android-alert-dialog.png`,
  `liquid-ios-alert-dialog.png`, `liquid-android-alert-dialog.png`.
- TabBar and Switch: `desk-ios-tab-bar-switch.png`,
  `desk-android-tab-bar-switch.png`, `liquid-ios-tab-bar-switch.png`,
  `liquid-android-tab-bar-switch.png`.

## Checks

- `npm run contract -- --framework react`, web: Switch, AlertDialog, Sheet,
  Toast, TabBar, Navbar, SegmentedControl, Dialog, Drawer, Button,
  IconButton, CopyButton and ToggleGroup all pass. Under load one Sheet test
  hit a protocol error and ToggleGroup ran while the gallery server had
  died; both pass when run again alone.
- The same with `--platform ios` and `--platform android` for Switch,
  AlertDialog, Sheet, Toast, TabBar, Navbar and Button: all pass. Toast on
  ios (two "target size open" timeouts) and Button, Navbar and Toast on
  android (`ERR_INSUFFICIENT_RESOURCES`, a crashed tab) failed under load
  first and pass when run again alone.
- `npm run check`: every step passes except `check @the-system/angular`, where
  `src/components/switch/switch.round3.spec.ts` failed 4 drag tests under
  load. That file is not mine and loads no CSS; run alone,
  `npm run check -w @the-system/angular` passes 753 of 753.

## Decisions I made

1. **Chrome paint stays in `ds.platform`.** Where a platform rule mixed
   geometry and paint, the geometry moved to `ds.chrome` and the paint
   stayed, so a style still paints the chrome (`anatomy.md`).
2. **Chrome geometry reads platform tokens.** Style corner and text tokens
   were swapped for the platform's corner and type roles, otherwise the
   "equal in every style" check cannot hold. The values I picked are in the
   first table; the iOS sheet corner is the one in the `anatomy.md` example.
3. **The button family takes its corner from the style on phones.** The
   order's check asks that a Button keep the style's shape. Only Desk sets a
   button corner in a recipe; Studio, Neutral and Liquid get theirs from
   `radius.control`, which the platform rule read over. So the platform
   files stop setting a button corner, as `macos.css` already does. This
   differs from the code example in `anatomy.md`, where the ios file gives
   the Button a capsule and Desk's recipe beats it: with that pattern every
   style would need a button corner in a recipe.
4. **Recipe guards that remain are paint and press, not shape.** They read
   `:is([data-platform='web'], [data-platform='macos'])`, so they step aside
   only where a platform draws its own press or alert actions.
5. **Alert action fills on phones stay the platform's.** Removing the footer
   guard entirely would paint Neutral's filled blue and outlined buttons into
   the iOS hairline grid, which the `mobile` audit called out on Android.

## For the owner's eye

- Liquid on Android: the tab bar is now the platform's full width bar, but
  Liquid's lens is paint on the whole current item, so it shows as a round
  shape about 79 by 88 instead of the 64 by 32 pill behind the icon. `ds.chrome`
  cannot move paint. Fixing it needs Liquid's TabBar recipe to paint the
  pill, which changes Liquid on the web (R3.5 or R4.18).
- Desk on phones: the title bar stays (yellow band) with the title at the
  start, without the lights. On the Sheet the lights were the only close
  control (Desk renders no close button when the lights are on), so a Desk
  phone sheet now closes by Escape, the scrim and the grabber only.
  Rendering the close button when the lights are hidden is component work.
- Phone buttons now show the style's corner: Studio 2px and Neutral 8px on
  Android where they were capsules; Neutral 8px and Liquid capsules on iOS
  where they were 12px and 22px.
- Desk SegmentedControl and ToggleGroup on the web are 12px shorter.
- macos: Studio's footer cells and Neutral and Desk footer fills now show on
  macos alerts, and the toast timer line is each style's.
- All values are proposed.

## Left open

- The FloatingActionButton, Input, Textarea, Select trigger, SegmentedControl,
  Chip, Tabs, Slider thumb, Popover, Tooltip and menu corners in `ios.css`
  and `android.css` still read style radius tokens in `ds.platform`. They are
  controls, so the style wins where its recipe sets the corner; where it does
  not, the platform's choice shows. Not in this order's check; worth one
  pass when R4.16 owns the platform files.
- Dialog (not AlertDialog) on phones still shows Desk's lights: the contract
  hides them on sheets and alerts only, and in a Desk Dialog the lights are
  the only close control as well. The Dialog's phone form is order R4.8.
- The Android navigation bar is 80dp with a 64 by 32 pill as `android.css`
  had it; the `style-pack.md` example names a 64 tall bar with a 56 by 32
  indicator. TabBar sizing is R4.7.
- Sheet and alert heights differ by content (fonts, text sizes, Studio's
  alert layout, Desk's title bar). With detents (the `detents` prop) the
  sheet height is the platform's.
- Neutral Switch: its reduced motion rule (`--_switch-stretch: 1`) has a
  lower specificity than the press rule above it, so it never wins. Not
  changed here (same specificity before and after).
- The anatomy example (ios Button capsule in `ds.platform`) no longer matches
  `ios.css`; the lead may want to update it (decision 3).
