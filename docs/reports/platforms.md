# Platforms: web, ios and android (order 1.25)

Status: **proposed**. Every platform look here waits for the owner.

The owner switched the Platform select on a phone and saw no difference.
`data-platform` now changes the web components. Two new files hold all of it:
`packages/css/src/platform/ios.css` and `packages/css/src/platform/android.css`,
in a new cascade layer `ds.platform` that sits after `ds.base` (the component
CSS) and before `ds.recipes` (the style packs). So a platform reshapes a
component, and a style still paints it.

```text
@layer ds.reset, ds.tokens, ds.base, ds.platform, ds.recipes, ds.overrides;
```

What a platform changes: proportion, touch target, the shape and travel of
controls, press feedback, where overlays come from and how they leave, the
place of toasts, navigation placement and the type scale. What it never
changes: color, font family, surface material and character. Those stay with
the style, so every rule reads semantic tokens only and works in Studio, Desk,
Neutral and any later style. `web` is the default and is unchanged.

Sources for the conventions: Apple's public interface guidelines (read
through their JSON data pages) and Google's Material component tokens
(material-web `v0_192` and the Jetpack Compose `material3` tokens on
androidx-main). The Material values are checked against those token files.
Most iOS control sizes are not printed in the guidelines; the values used are
the commonly documented UIKit sizes and are marked "documented, not printed"
below. Nothing from either vendor is copied: no asset, icon, font file, sound,
symbol or name. The chevron, grabber and handle are drawn with borders and
plain boxes.

## See it

- Gallery: `/platforms` (link "Platforms" in the gallery bar). Six screens
  (settings, form, alert, menu, sheet, toast), each shown as three 390 by 844
  phones side by side: web, iOS, Android, in the style picked in the bar.
  Each phone is an iframe of `/platforms/screen?screen=<id>&platform=<id>`, so
  overlays open inside their own phone.
- Any demo: `/c/<slug>?platform=ios` or `?platform=android`.

## Per component

"Doc" marks a value printed in the vendor's public guidance or token files.
"Common" marks a commonly documented value that the guidance does not print.

| Component | iOS | Android |
| --- | --- | --- |
| Button | Mini 28, small 32, regular 44, large 52 (doc); 12 radius rounded rectangle; 17pt semibold label (token 2xl); press dims to 55% opacity with no dip; hit area at least 44 | 40dp full capsule, 24dp sides, 14sp medium label (doc); xs 32, lg 56; neutral text and outlined buttons in the primary color, other tones keep theirs; ripple; hit area at least 48 |
| IconButton | Round, 44 hit area | Capsule 40, 48 hit area, ripple |
| ToggleButton | As Button | As Button |
| FloatingActionButton | Round 56 with the style's lift (iOS has none) | 56dp rounded square, 16dp corner; lg 96 with a 28 corner (doc) |
| Switch | 51 by 31 capsule (common), a filled track and a thumb with a shadow (colors stay the style's), the thumb widens to about 1.3 times while held, no track dip | Track 52 by 32 with a 2dp outline off; the thumb is a 16dp dot off, 24 on, 28 while pressed (doc), one scale from its centre on the emphasized ease |
| Checkbox | 22 box with a 6 radius; round inside a List or CheckboxGroup (a selectable row reads as a round checkmark); 44 target | 18dp box, 2dp edge, small radius; a 40dp state layer on hover (8%) and press (12%) (doc); 48 target |
| RadioGroup | 22 circle, 44 rows | 20dp circle, 48 rows (doc) |
| Slider | 4pt track, 28pt thumb with an edge and a shadow, no lift (common), in the style's color; 44 target | 16dp track and a 4 by 44dp handle bar (Material's current slider, doc); laid across for a vertical slider; 48 target |
| SegmentedControl | 32pt track, 8 radius, a lifted segment with a shadow that slides on the spring (common) | Outlined segmented buttons: 40dp capsule, 1dp outline, segments split by the outline, the selected one tonal (doc); ripple; 48 hit areas |
| Tabs | 44pt triggers, 14 label, the tint on the ghost indicator | 48dp triggers, 3dp indicator in the primary color (ghost); tabs share the width and the list scrolls when they do not fit |
| TabBar | 49pt items (common), icon over a 10pt label, the current item in the tint, no pill | 80dp bar, a 64 by 32 pill behind the current icon in the tonal color, 12sp label (doc); ripple in the pill |
| Navbar | 44pt bar plus a little air, 17pt semibold title, centred on a phone | 64dp top app bar, start aligned 20 to 22sp title (doc), no rule under it |
| Input, Textarea | 44pt rounded rectangle, 12 radius, a quiet fill, 16px text (so iOS browsers do not zoom on focus); keeps its border (WCAG 1.4.11) | Filled field: 56dp, top corners 4, a 1dp active indicator under it that becomes 2dp in the primary color on focus (doc); the whole box comes back under forced colors |
| Select (trigger) | As Input | As the filled field |
| Select, DropdownMenu, ContextMenu (lists) | 250pt compact menu, 44pt rows, 17pt text, hairlines between rows, a thicker gap for a separator, grows from its trigger from scale 0.5 on the bouncy spring, large radius | 4dp radius, 48dp rows, 112 to 280 wide, 14sp text (doc); a short scale from 0.92 and fade from the anchor on the emphasized ease |
| Popover | 16 radius, more padding, grows from its trigger on the spring | 12 radius, short scale and fade |
| Tooltip | A compact callout, 12 radius | Plain tooltip: 4dp radius, small text (doc) |
| Dialog, AlertDialog | A compact centred alert about 270pt wide (common), centred title and text, no bands; actions of equal width split by hairlines, side by side for two and stacked for three or more; the default action bold, a destructive one red; labels wrap; it scales down into place on the spring | 28dp radius, 24dp padding, start aligned 24sp title, 14sp text, text actions at the end in the primary color (doc); scale from 0.92 on the emphasized ease |
| Sheet | Rises from the bottom with a round 36 by 5 grabber (common) on the drag handle | 28dp top radius, a round 32 by 4 drag handle 22dp from the top inside a 48dp target (doc) |
| Drawer | Leaves its side and rises from the bottom like a sheet, with a grabber | Side sheet with a 16dp corner, emphasized ease |
| Toast | A banner that drops from the top under the safe area on the spring, 22 radius, no tone edge; every position of the toaster maps to the top | Snackbar: bottom, start aligned, one row with a text action at the end, 4dp radius, at least 48dp tall, no tone edge (doc); the surface stays the style's (Material's inverse surface is a surface choice, so a style opts in through its recipe); goes to the top while a Sheet is open, as the web toaster does (WCAG 2.4.11) |
| List | Inset grouped rows: 44pt rows, 12 radius group, separators that start at the text, a drawn chevron on rows that go somewhere, a quiet highlight on press | 56dp rows, 72 with a second line, 16dp sides, 16 and 14sp text (doc); inset lists drop the hairlines; ripple on linked rows |
| Chip | 32 tall, 44 hit area | 32dp, 8dp corners, an outline at rest (neutral, unselected), 14sp medium (doc); 48 hit area; ripple |
| Stepper | Larger titles | 24dp indicators |
| Pagination | 44 page targets | 48dp page targets, the current page a tonal pill, ripple |
| Sidebar | 44pt rows, 12 radius, no edge mark | Navigation drawer: 56dp rows, full pill, the current row tonal, no edge mark (doc) |

### Motion

- iOS: springs (`ease.spring-bouncy`, `ease.spring-soft`) for the alert, menus,
  popovers, the drawer and the toast banner. Press feedback is a dim, in at
  once and out over `duration.slow`.
- Android: `ease.emphasized` and `ease.standard` over `duration.zoom` and
  `duration.window-open` for overlays and the switch. Press feedback is a
  ripple: a layer in the text color at 12% grows from the centre while held
  and fades on release.
- Reduced motion (the media query and `data-motion="reduce"` on the root):
  the iOS alert and drawer animations are none, the dim and the thumb stretch
  go, the ripple shows at full size at once and nothing grows. State changes
  still show.
- Only `transform` and `opacity` animate in these files today. The ripple
  could be a `clip-path` circle from the touch point under the ruling of
  2026-11-12, but the lint rule for that ruling belongs to order 1.23. See
  "Changes needed from the lead".

### RTL, Arabic, forced colors

- Logical properties only. The chevron turns the other way in right to left
  text; the grabber and the segment outline mirror; the slider and switch
  inherit the component's own direction handling.
- Arabic keeps the component's own type switch; the platform sizes are token
  steps, so the Arabic step up still applies.
- Forced colors: the ripple and the state layer are hidden, the chevron, the
  grabber, the handle and the alert hairlines take `CanvasText`, and the
  filled field gets its whole border back.

## Sheets

Side by side, web, iOS, Android, at 390 by 844, in Neutral (light) and Desk
(dark), under `docs/reports/shots/platforms/`. Overlays are opened through the
demo's first trigger (`-open` in the name). The `screen-*` sheets are the six
screens of the gallery page.

Components (56 sheets):

- [alert-dialog-open-desk](shots/platforms/alert-dialog-open-desk.png)
- [alert-dialog-open-neutral](shots/platforms/alert-dialog-open-neutral.png)
- [button-desk](shots/platforms/button-desk.png)
- [button-neutral](shots/platforms/button-neutral.png)
- [checkbox-desk](shots/platforms/checkbox-desk.png)
- [checkbox-neutral](shots/platforms/checkbox-neutral.png)
- [chip-desk](shots/platforms/chip-desk.png)
- [chip-neutral](shots/platforms/chip-neutral.png)
- [dialog-open-desk](shots/platforms/dialog-open-desk.png)
- [dialog-open-neutral](shots/platforms/dialog-open-neutral.png)
- [drawer-open-desk](shots/platforms/drawer-open-desk.png)
- [drawer-open-neutral](shots/platforms/drawer-open-neutral.png)
- [dropdown-menu-open-desk](shots/platforms/dropdown-menu-open-desk.png)
- [dropdown-menu-open-neutral](shots/platforms/dropdown-menu-open-neutral.png)
- [floating-action-button-desk](shots/platforms/floating-action-button-desk.png)
- [floating-action-button-neutral](shots/platforms/floating-action-button-neutral.png)
- [icon-button-desk](shots/platforms/icon-button-desk.png)
- [icon-button-neutral](shots/platforms/icon-button-neutral.png)
- [input-desk](shots/platforms/input-desk.png)
- [input-neutral](shots/platforms/input-neutral.png)
- [list-desk](shots/platforms/list-desk.png)
- [list-neutral](shots/platforms/list-neutral.png)
- [navbar-desk](shots/platforms/navbar-desk.png)
- [navbar-neutral](shots/platforms/navbar-neutral.png)
- [pagination-desk](shots/platforms/pagination-desk.png)
- [pagination-neutral](shots/platforms/pagination-neutral.png)
- [popover-open-desk](shots/platforms/popover-open-desk.png)
- [popover-open-neutral](shots/platforms/popover-open-neutral.png)
- [radio-group-desk](shots/platforms/radio-group-desk.png)
- [radio-group-neutral](shots/platforms/radio-group-neutral.png)
- [segmented-control-desk](shots/platforms/segmented-control-desk.png)
- [segmented-control-neutral](shots/platforms/segmented-control-neutral.png)
- [select-open-desk](shots/platforms/select-open-desk.png)
- [select-open-neutral](shots/platforms/select-open-neutral.png)
- [sheet-open-desk](shots/platforms/sheet-open-desk.png)
- [sheet-open-neutral](shots/platforms/sheet-open-neutral.png)
- [sidebar-desk](shots/platforms/sidebar-desk.png)
- [sidebar-neutral](shots/platforms/sidebar-neutral.png)
- [slider-desk](shots/platforms/slider-desk.png)
- [slider-neutral](shots/platforms/slider-neutral.png)
- [stepper-desk](shots/platforms/stepper-desk.png)
- [stepper-neutral](shots/platforms/stepper-neutral.png)
- [switch-desk](shots/platforms/switch-desk.png)
- [switch-neutral](shots/platforms/switch-neutral.png)
- [tab-bar-desk](shots/platforms/tab-bar-desk.png)
- [tab-bar-neutral](shots/platforms/tab-bar-neutral.png)
- [tabs-desk](shots/platforms/tabs-desk.png)
- [tabs-neutral](shots/platforms/tabs-neutral.png)
- [textarea-desk](shots/platforms/textarea-desk.png)
- [textarea-neutral](shots/platforms/textarea-neutral.png)
- [toast-open-desk](shots/platforms/toast-open-desk.png)
- [toast-open-neutral](shots/platforms/toast-open-neutral.png)
- [toggle-button-desk](shots/platforms/toggle-button-desk.png)
- [toggle-button-neutral](shots/platforms/toggle-button-neutral.png)
- [tooltip-desk](shots/platforms/tooltip-desk.png)
- [tooltip-neutral](shots/platforms/tooltip-neutral.png)

Screens of the gallery page (12 sheets):

- [screen-alert-desk-dark](shots/platforms/screen-alert-desk-dark.png)
- [screen-alert-neutral-light](shots/platforms/screen-alert-neutral-light.png)
- [screen-form-desk-dark](shots/platforms/screen-form-desk-dark.png)
- [screen-form-neutral-light](shots/platforms/screen-form-neutral-light.png)
- [screen-menu-desk-dark](shots/platforms/screen-menu-desk-dark.png)
- [screen-menu-neutral-light](shots/platforms/screen-menu-neutral-light.png)
- [screen-settings-desk-dark](shots/platforms/screen-settings-desk-dark.png)
- [screen-settings-neutral-light](shots/platforms/screen-settings-neutral-light.png)
- [screen-sheet-desk-dark](shots/platforms/screen-sheet-desk-dark.png)
- [screen-sheet-neutral-light](shots/platforms/screen-sheet-neutral-light.png)
- [screen-toast-desk-dark](shots/platforms/screen-toast-desk-dark.png)
- [screen-toast-neutral-light](shots/platforms/screen-toast-neutral-light.png)

Read: every sheet was opened and looked at. The three phones of each sheet can
be told apart at once (shape, size and press look of controls, place of
overlays and toasts), with the exceptions listed under "Weak differences".

### Decisions taken while reading the sheets

- The first Android snackbar used the inverse surface. In Desk the style's
  recipe paints the toast glass (as it should: surface material is the
  style's), which left black text on a dark surface (axe, 1.13:1). The
  platform now changes only place, shape and layout of a toast.
- The first iOS switch and slider thumbs were white through
  `color.text.on-primary`, which is near black in Desk (yellow primary). The
  thumbs now keep the style's colors; iOS changes their shape and shadow.
- Buttons that are a part of another component (a segment, a close control)
  or sit in an attached ButtonGroup keep the size their parent gives them.
  The first pass let the platform size beat it and the segmented control
  overflowed at 320px.
- iOS alert action labels wrap instead of ending in an ellipsis.

### Weak differences

- Tabs: neither platform uses tabs at the top of a phone screen the way the
  web does; the difference is size and the indicator only.
- Stepper, Pagination, Tooltip: small changes (sizes, targets, corner radius).
- Tooltips on touch show on long press. That needs component behaviour and is
  out of scope here; on a phone with no hover they do not show at all yet.

## Proof

- `npm run check`: green before each commit (tokens build, gen, typecheck,
  eslint, manifests, vitest with every lint gate, Angular, native, docs,
  galleries, consumers).
- Contract suite with `platform=ios` and `platform=android`. The suite builds
  its URLs without a platform, so it was run against a small local proxy in
  front of the gallery that adds `platform=<id>` to the page address before
  the app reads its axes (the suite itself is unchanged). Eleven components,
  every check of the suite (anatomy, variants, states, keys, target size at
  24px, axe in every style, scheme and direction, axe with the overlay open,
  no sideways scroll at 320px):

  | Component | ios | android |
  | --- | --- | --- |
  | Button | 29 passed | 29 passed |
  | ButtonGroup | 29 passed | 29 passed |
  | Checkbox | 29 passed | 29 passed |
  | Chip | 29 passed | 29 passed |
  | Dialog | 44 passed | 44 passed |
  | Input | 29 passed | 29 passed |
  | List | 29 passed | 29 passed |
  | SegmentedControl | 29 passed | 29 passed |
  | Switch | 29 passed | 29 passed |
  | Tabs | 29 passed | 29 passed |
  | Toast | 44 passed | 44 passed |

  Failures found and fixed on the way: SegmentedControl overflowed at 320px
  on ios (fixed by the part rule above); Toast failed axe in Desk on android
  (fixed by keeping the style's toast colors).
- Platform target size by hand (Playwright, the six gallery screens, Neutral,
  every button, link, field and role control, a positioned `::before` or
  `::after` hit layer counted as the suite does): every target is at least
  44 by 44 on ios and 48 by 48 on android. The navbar title link (24 tall)
  and the sheet's close control (39 wide) failed the first run and were
  fixed. List title links report 22 tall in that script only because their
  hit layer is the whole row (44 or 56 tall), which the script does not
  resolve; the suite's own check passes them.
- The web platform is unchanged: screenshots of `/c/<slug>?platform=web` at
  390 by 844 with reduced motion, before any platform CSS existed and after
  the last change, for twelve components in Neutral and Desk. 22 of 24 are
  byte equal (Button, Checkbox, Chip, Dialog, Input, List, Pagination,
  SegmentedControl, Slider, Switch, Toast, each in two styles). Tabs differs
  by 8 and 24 pixels at the tab indicator, which the component measures
  after layout: two shots of the same build differ the same way (19 pixels
  between two runs of the after build), so it is noise, not a change.
- Every sheet was opened and read (above).

## Hooks needed from components

None of these were written: they are component behaviour or DOM, owned by
order 1.23 and the component lanes.

| Need | Component | Exact hook |
| --- | --- | --- |
| Ripple from the touch point | Button family, Chip, TabBar item, List row, Pagination page | On `pointerdown`, set `--_button-press-x` and `--_button-press-y` (and the `--_chip-`, `--_tab-bar-`, `--_list-`, `--_pagination-` equivalents) on the root, in px from the root's inline start and block start, declared at `50%` in the component CSS. Android then draws `clip-path: circle(… at var(--_button-press-x) var(--_button-press-y))`. |
| Switch thumb icon | Switch | An optional `thumbIcon` prop rendering `[data-part='thumb-icon']` inside the thumb (check while on, nothing or a cross while off), aria-hidden. Android shows it; iOS and web hide it. |
| Thumb sizes as properties | Switch | `--_switch-thumb-size` (the drawn thumb) separate from the track height, so a platform can size the thumb without the scale trick in `android.css`. |
| Sheet detents | Sheet | A `detents` prop (`['medium', 'large']`), `data-detent` on the root, and `--_dialog-detent-height` per detent; the drag settles to the nearest detent. |
| Rubber band | Sheet, Drawer | While dragging past the top detent, scale the overshoot (for example a third of the pointer travel) into `--_dialog-drag-y`. |
| Swipe down to dismiss a Drawer | Drawer | On iOS the drawer rises from the bottom; it needs the Sheet's handle part and drag (`[data-part='handle']`, `--_dialog-drag-y`) to be closed by a swipe. The close control and Escape still work. |
| Floating label | Field, Input, Select | A `[data-part='label']` inside the Input root (or `data-floating` on Field with the label placed after the control) plus `data-filled` on the root when it has a value, so the label can rest in the box and rise on focus or value. Not possible with today's DOM: the label sits outside the box. |
| Outlined text field | Input | `variant="outlined"` (`data-variant`) so a platform can pick filled or outlined; today android draws filled for every field. |
| Large title that collapses | Navbar | A `largeTitle` part under the bar (`[data-part='large-title']`) and `data-scrolled` on the root once the page scrolls past it; iOS fades the large title and shows the inline one. |
| Toast position by platform | Toaster | A `position="auto"` value that resolves from the platform (top centre on iOS, bottom start on Android), and `--_toaster-inset-block-end` that a bottom TabBar can raise, so a snackbar sits above the navigation bar. Today the platform CSS moves every toaster. |
| Long press hint | Tooltip | Open on long press (about 500ms) for `pointerType` touch; keep the focus path. |
| Press scale off by platform | Button family | Already possible through `--_button-press-scale`; no change. Listed so 1.23 keeps the name. |

### Adopting order 1.23 when it merges

`origin/claude/ds-order-1-23` (fetched at the end of this order, not merged)
adds part of the above. These names are not declared on this branch yet, so
using them now would fail the token vocabulary gate. On merge:

- Switch: 1.23 adds `--_switch-thumb-size-rest`, `-on`, `-pressed` and folds
  `--_switch-thumb-size-now` into the thumb transform. In `android.css` drop
  the thumb `transform` rule and `--_switch-stretch-now`, and set
  `--_switch-thumb-size-rest: calc(16 / 28)`,
  `--_switch-thumb-size-on: calc(24 / 28)`,
  `--_switch-thumb-size-pressed: 1`, `--_switch-stretch: 1`. In `ios.css`
  set `--_switch-thumb-size-pressed: 1` so the widening stays the only press
  change.
- Button: 1.23 adds `--_button-press-y`, a sink depth with an inner shade,
  not a pointer position. iOS should set it to `0px` (press is a dim) and
  Android to `0px` (press is the ripple). The pointer position hook is still
  needed.
- Lint: 1.23 widens the motion rule to the paint properties of the ruling.
  After the merge the Android ripple can be a growing `clip-path` circle.

## Token gaps

The build reads `packages/tokens/src/base/*.json` and `density/*.json` only, so
a `packages/tokens/src/platform/` group would need a change to
`packages/tokens/build.ts` (ds-tokens). No platform tokens were added; the
files use existing tokens and token arithmetic. Proposed names:

| Proposed token | Value | Used today as |
| --- | --- | --- |
| `platform.ios.font.size.body` | 17px | `font.size.2xl` (16px on a phone) |
| `platform.ios.font.size.large-title` | 34px | not used (no large title part) |
| `platform.android.font.size.title-large` | 22px | `font.size.4xl` (20px on a phone) |
| `platform.android.radius.extra-large` | 28px | `radius.card + radius.panel` |
| `platform.android.radius.extra-small` | 4px | `radius.xs` (3px) |
| `platform.ios.switch.height` | 31px | `size.touch.ios * 0.7` |
| `platform.ios.alert.width` | 270px | `dialog.width.sm * 0.75` |
| `platform.android.button.height` | 40px | `size.touch.android - space.fixed.m` |
| `platform.android.field.height` | 56px | `size.touch.android + space.fixed.m` |
| `opacity.state.hover`, `opacity.state.pressed` | 0.08, 0.12 | raw unitless numbers |
| `opacity.press-dim` | 0.55 | raw unitless number |
| `scale.ios.thumb-stretch` | 1.3 | raw unitless number |
| `motion.android.emphasized-decelerate` | cubic-bezier(0.05, 0.7, 0.1, 1) | `ease.emphasized` (0.16, 1, 0.3, 1) |

## Left for the React Native track

- The same table drives the native style functions: on React Native the
  platform comes from `Platform.OS`, so the theme object should carry the
  platform values above (switch, button, field heights, radii, type steps),
  and each `native/<Component>.ts` reads them.
- Native gets the real things the web can only draw: the system switch
  haptics, the ripple from the touch point (`android_ripple` on Pressable),
  sheet detents and the rubber band, the large title, the system font through
  the platform default (never by file).
- Snackbar above the navigation bar and the banner under the safe area come
  from the safe area insets on native.

## Changes needed from the lead

1. **Layer order, three code places changed in this order** (the order asked
   for it, they hold the line that a page declares first):
   `packages/tokens/build.ts` (the line at the top of `tokens.css`),
   `packages/registry/src/build-registry.ts` (`LAYER_ORDER`) and the CSS index
   part of `scripts/gen-index.ts`. The token snapshot
   `packages/tokens/tests/__snapshots__/tokens.css` is updated to match.
   Without the token line, `ds.platform` would be declared after
   `ds.overrides` and beat the style recipes. Still to change by the lead:
   `PLAN.md` section 3.4 (the layer list), `docs/contracts/style-pack.md` and
   `anatomy.md` wherever the order is written, and the message in
   `packages/lint/src/rules/no-important.ts`.
2. **Lint scope** (`packages/lint/src/scopes.ts`, changed): `isComponentCss`
   now includes `packages/css/src/platform/*.css`. Without it the
   token-vocabulary gate rejects every private property the platform files
   set, and the order requires them to set those. As a side effect the
   platform files now pass the raw value, logical property, forced colors and
   animation gates too.
3. **Registry**: add the two platform files to the core item (next to
   `reset.css` and `base.css` in `build-registry.ts`) and to the `ds.css` entry
   import list, so a shadcn consumer gets them.
4. **`packages/css/package.json`**: an optional `"./platform/*"` export for
   consumers who import components one by one.
5. **Gallery shell** (`apps/gallery-react/src/App.tsx`): two routes
   (`/platforms`, `/platforms/screen`) and a "Platforms" link were added; the
   page itself is `Platforms.tsx` and `platforms.css`.
6. **Contract suite**: it cannot pass a platform. A `DS_PLATFORM` env read in
   `demoPath` and the 44 and 48 target size passes the README mentions would
   replace the proxy used here.
7. **Ripple with clip-path**: once order 1.23 lands the lint change for the
   paint property ruling, `android.css` can switch the ripple to a growing
   `clip-path` circle (the closer match), and to the touch point once the
   pointer hook exists.
8. **Nesting**: platform selectors are descendant selectors, so a Theme with
   another platform nested inside an ios or android one still matches. If
   nested platforms matter, the Theme could stamp `data-platform` on every
   portal and the files could switch to `:where()` scoping by nearest Theme.
