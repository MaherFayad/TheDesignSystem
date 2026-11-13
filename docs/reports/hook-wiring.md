# Hook wiring and looks apart (order 1.28)

Status: **proposed**. Every look, motion and platform change below waits for
the owner. Branch `claude/ds-order-1-28`, from `claude/relaxed-hypatia-7gseap`
with the round 3 report merged.

Order 1.23 added private properties and parts ("hooks") to the components
while 1.24, 1.25 and 1.26 built the styles and platforms in parallel, so none
of them could set those hooks. This order sets them in Studio, Desk, Neutral,
Liquid, `ios` and `android`, removes the workarounds they replace, and pushes
the four styles further apart. There is no Paper folder, so the sheets show
four styles.

## Verdict from the sheets

- **Styles.** Shown one switch, one check, one toast or one dialog with no
  label, each style can be named:
  - Studio is flat black and white with square bits, inverted fills and 1px
    rules.
  - Desk is yellow, with glass balls, window lights and grain.
  - Neutral is calm blue on a blue gray dark, with soft white cards.
  - Liquid is glass: pure black dark, pill buttons, a longer capsule, a lens
    thumb and a heavy frosted scrim.
- **Motion.** The same press differs in kind, not only in length:
  - Studio cuts in hard steps.
  - Desk rolls a glass ball that turns into a lens and overshoots.
  - Neutral moves quick and plain, critically damped.
  - Liquid swells and stretches a clear lens on a soft spring.

  See `sheets/switch-stretch.<style>.png`.
- **Platforms.**
  - `ios` has a centred compact alert with hairline split text actions, a
    toast banner from the top, round checks, a dim on press and a lens while
    the switch is held.
  - `android` has a large start aligned title, text actions at the end, a
    small switch dot that grows, ripples from the touch point, and full width
    snackbars at the bottom.
  - Neutral's `web` keeps its button footer and corner toast stack.
- **Weakest pair.** Neutral and Liquid at rest in light: both have a blue
  accent and a white thumb. The longer Liquid capsule, its pill buttons and
  its glass scrim tell them apart; the press tells them apart at once. A
  capsule shaped thumb would close it (see hooks still needed).

## Hooks set

| Area | Hooks set |
| --- | --- |
| Studio | Switch: `--_switch-sweep: 0`, `-lean: 0px`, `-thumb-shadow`, `-thumb-backdrop: none`, `-thumb-highlight: none`, `-track-press: 1`, `-border-color-hover`, `-thumb-off`; `-thumb-size-pressed` and `-stretch` on web. Checkbox: `-radius: 0`, `-stroke-width: 3`, step eases on `-ease`, `-fill-ease`, `-morph-ease`, `-land-ease`. RadioGroup: `-dot-travel: 0px`, step eases. RadioCard: `-radius: 0`, `-stroke-width: 3`, `-lift-ease`, `-draw-ease`. Buttons: `--_button-glow: 0`, `-glow-rest: 0`, `-press-shade: transparent`, `-press-y: 1px`, step `-press-ease`, `-release-ease`, `-result-ease`, `-draw-ease`; `--_toggle-button-flood: 0`. CopyButton: step `-ease-in`, `-ease-out`, `-pop-ease`, `-overshoot: 0px`, the bubble as an inverted chip. Toast: `--_toaster-gap: 1px`, `--_toast-peek`, `-depth: 0`, `-shadow-room: 0px`, `-stack-ease`, `-swipe-ease-out`, `-progress-thickness: 1px` (web). Dialog family: `--_dialog-backdrop-blur: 0px`, `-refuse-shift: 2px`, `-part-ease`. |
| Desk | Switch: `--_switch-thumb-highlight` (a light spot that turns with the travel, mirrored in RTL), `-highlight-opacity`, `-highlight-opacity-pressed`, `-thumb-shadow` (light rim), `-thumb-backdrop`, `-thumb-solid-pressed: 0.45`, `-lean`, `-track-press`. Checkbox: `-stroke-width: 2.5`, bouncy `-fill-ease`, `-morph-ease`, `-land-ease`. RadioGroup and RadioCard: yellow fill, `-dot-travel`, `-draw-ease`. Buttons: `--_button-glow`, `-glow-rest`, `-glow-color`, `-glow-y`, `-press-y`, `-press-shade`, bouncy `-release-ease` and `-release-duration`; the rolled label keeps the press sink. CopyButton: `-turn`, `-overshoot`, yellow `-bubble-*`. Toast: `--_toaster-gap`, `--_toast-peek`, `-depth`, `-stack-duration`, `-stack-ease`, `-progress` (yellow), `-progress-thickness` (web). Dialog family: `--_dialog-backdrop-blur`, `-part-duration`, `-part-ease`, `-handle-color`. Menus, Select, ListBox, CommandPalette: highlight bg, `-item-shadow` (yellow start bar), `-highlight-duration`, `-highlight-ease`. |
| Neutral | Switch: `--_switch-bg`, `-thumb-off`, `-on-fill`, `-thumb-shadow`, snappy (critically damped) `-duration`, `-ease`, `-duration-out`, `-ease-out`, `-track-press: 1`, `-lean: 0px`; `-stretch` and `-thumb-size-pressed` on web. Checkbox: `-stroke-width: 1.5`, ease out on fill, land and morph. RadioGroup: `-dot-travel: 0px`. RadioCard: `-lift: 0px`, `-stroke-width: 1.5`. Buttons: `--_button-glow: 0`, `-press-y: 1px`, `-press-shade: transparent`, snappy release, `-roll: 0px`; `--_toggle-button-flood: 0`; `--_split-button-drop-press`. CopyButton: a cross fade with the check drawn on ease out, `-overshoot: 0px`. Toast: `--_toast-peek`, `-depth`, `-progress`, `-progress-thickness` (web), `--_toaster-gap`. Dialog family: `--_dialog-refuse-shift`, `--_dialog-backdrop-blur` from `blur.backdrop`. Menus and lists: highlight in `primary.tint`. Popover and HoverCard: `-enter-stretch` equal to `-enter-scale`. |
| Liquid | Buttons: `--_button-glow: 1`, `-glow-rest`, `-glow-color: var(--ds-color-glass-highlight)`, `-glow-x` (22%, 78% in RTL), `-glow-y`, soft `-release-ease`. Switch: `--_switch-thumb-shadow`, `-thumb-backdrop`, `-thumb-highlight` (the `thumb-lens` part, mirrored in RTL), `-thumb-highlight-opacity` (0.6 at rest, 1 held), `-thumb-solid-pressed: 0.2`, `-lean`, soft spring eases; on web `-thumb-size-pressed`, `-stretch` and a longer `--_switch-width`. Slider: `--_slider-thumb-bg`, `-halo`, `-halo-spread`, `-stretch`. SegmentedControl: `--_segmented-control-indicator-filter`. Toast: `--_toaster-gap`, `--_toast-peek`, `-depth`, soft `-stack-duration`, `-stack-ease`, `-duration-in`, `-ease-in`. Checkbox and RadioGroup: soft spring eases, `-stroke-width: 2.5`. Menus, Select, ListBox, CommandPalette: `-highlight-bg`, `-item-shadow`, `-highlight-ease`. Dialog family: `--_dialog-backdrop-blur` (blur.glass), `--_dialog-handle-radius`. Popover, HoverCard, Tooltip: `-enter-stretch`. |
| ios | Buttons: `--_button-press-y: 0px`, `-press-shade: transparent`, `-glow: 0`; press is a dim. Switch: `--_switch-thumb-shadow`, `-thumb-size-pressed: 1`, `-thumb-solid-pressed: 0.2`, `-thumb-backdrop`, `-thumb-highlight`, `-highlight-opacity` and its pressed value, `-lean: 0px`. Checkbox: pill radius everywhere, `-stroke-width: 2.5`, spring eases. RadioGroup: `-dot-travel: 0px`, spring eases. Toaster: `--_toaster-dir: 1`, `--_toaster-align: start`. Toast: `-peek`, bouncy `-stack-duration` and `-stack-ease`, `-progress-thickness: 0px`. Dialog and AlertDialog: `-enter-scale`, `-duration-in`, `-ease-in`. Sheet: `--_dialog-handle-color`, `-handle-radius`. Family: `--_dialog-backdrop-blur: 0px`. Menus and Select: `--_menu-clip-from`, quiet highlight, tinted check. Popover and Tooltip: `-enter-stretch`. SegmentedControl: `-indicator-filter`. |
| android | Buttons and FAB: `--_button-glow: 0`, `-glow-rest: 0`, `-press-shade: transparent`, `-press-y: 0px`; the ripple is a `clip-path` circle at `var(--_button-ripple-x) var(--_button-ripple-y)`, mirrored in RTL. ToggleButton: `-layer-opacity: 0`, `-flood: 0`. Chip, List, Pagination: ripples from their `-press-x` and `-press-y`. Switch: `-thumb-size-rest: calc(16 / 28)`, `-on: calc(24 / 28)`, `-pressed: 1`, `-stretch: 1`, `-lean: 0px`, `-inset`, `-thumb-size`, `-travel-max`, `-thumb-icon-opacity: 1`, emphasized eases. Checkbox and RadioGroup: `-press-scale: 1`, emphasized eases, a 40dp state layer. Field: `--_field-float-box`, `-float-inset`; Input `data-variant='outlined'`. Toaster and Toast: `--_toaster-dir: -1`, `-align: end`, `-gap`, `--_toast-stack-transform`, `-strip`, `-stack-ease`, `-swipe-ease-out`, `-progress-thickness: 0px`. Menus, Select, ListBox, CommandPalette: `primary-tint` highlight on the standard ease. Sheet: `--_dialog-handle-radius`. |

### Platform shape against style recipes

The platforms sit in `ds.platform`, below `ds.recipes`, so a recipe that sets
a shape hook beats the platform. The fix in this order: the style recipes set
these only under `[data-style='<id>'][data-platform='web']`:
- the switch press shape (`--_switch-stretch`, `--_switch-thumb-size-pressed`,
  Liquid's `--_switch-width`)
- the toast timer line (`--_toast-progress-thickness`)
- the dialog footer and its buttons

The platform's switch press, timer line and alert actions now hold in every
style. A secondary footer button keeps its own border on ios and android,
because that comes from the Button's emphasis, not the dialog.

## Workarounds removed

- Liquid Button: its own `::before` specular sheen block, replaced by the
  glow hook.
- Liquid Switch: the direct thumb `box-shadow`, the `backdrop-filter` and the
  `:active` `--_switch-thumb-bg` swap.
- Liquid Slider: the direct thumb background and the redone forced colors
  thumb rules.
- Liquid SegmentedControl: the direct `backdrop-filter`.
- Liquid Toast: the direct `gap` and the forced drop from above.
- Liquid menus, Select, ListBox and CommandPalette: the row `::after`
  box-shadow, the row lift transforms and their transitions; three direct
  `--_menu-duration-in` lines.
- Desk Toast: the toaster's `gap: 0` and the negative margins.
- Desk Dialog: the direct `--_dialog-scrim-filter` and the scrim override.
- Neutral Dialog and CommandPalette: the `scrim-filter: none` lines.
- Studio Toast: the raw toaster gap. Studio Button: the xs pill rule.
- `ios.css`:
  - the `ds-ios-alert-in` keyframes
  - the `::before` grabber on the Sheet handle
  - the toast `--_toast-enter-y` and the sheet open `:has()` rule
  - the direct thumb shadow
- `android.css`:
  - the switch thumb `transform` scale trick, `--_switch-stretch-now` and
    `padding-inline: 0`
  - the handle `::before` bar
  - the ripple grown by `transform: scale`
- **Durations (round 3 item 11).**
  - No raw or computed duration is left in any style folder or platform
    file.
  - Found and fixed: two in `ios.css` (computed button transitions) and
    three in `android.css` (`0s` transitions, now token durations with
    `step-end` or `step-start`).
- **Generated interaction recipes (item 10).**
  - `packages/styles/motion-css.ts` writes `<id>/recipes/Motion.css` from
    each `motion.ts`, and a test fails when one is stale.
  - The file is in `recipes/` and not at `<id>/motion.css`, because the
    vocabulary gate allows private properties only in component CSS and
    recipes.
  - The generated `index.css` imports every recipe, so
    `scripts/gen-index.ts` needed no change.
- **`window-settle` (item 12).**
  - Studio windows now grow, zoom and minimize. The pattern rows name the
    stepped `ease.spring-bouncy`, but `animateWindow` ignores a preset's
    easing, so today they move on the smooth `ease.window` curve (see
    changes needed from the lead).
  - Neutral windows settle with a small scale.

## Look changes (Task 2)

- **Studio.**
  - Colours: dark is near black surfaces with bright rules; light is a white
    body with dark rules.
  - Shape: panels and overlays are square; controls are 2px.
  - Overlays: every overlay is framed by a 1px rule in the text colour, and
    dialog actions are square cells split by rules, the main one inverted.
  - Switch: a flat bit with an inverted fill.
  - Checkbox and radio: square, with thick square checks.
  - Press: the neutral button inverts and the primary turns into its own
    outline.
  - Toasts: stack as hard rules.
- **Desk.**
  - Switch: a glass ball thumb on the yellow track; it turns into a clear lens
    when held.
  - Overlays: yellow glass title bars on dialogs and the AlertDialog band, a
    yellow top edge on popovers, and a yellow glass marker on menu rows.
  - Toasts: overlapping glass cards with a yellow timer.
- **Neutral.**
  - Dark: a true blue gray (page #1b2232, surfaces #222a3b to #455168,
    borders #2a3345 to #4f5b73), with a navy scrim and a 4px backdrop blur.
  - Contrast fixes this needed: a lighter primary edge (#5b89f9), focus ring
    #82abff and danger text #fc8b8b.
  - Toasts: white cards with a tinted icon disc and a thin timer.
- **Liquid.**
  - Switch: a clear lens that swells and stretches; a longer capsule on the
    web, and a standing sheen at rest.
  - Lists and stacks: a lens that glides between menu rows, and toasts that
    pool into one stack.
  - Overlays: a 20px frosted scrim, and popovers that unfold from the trigger.

## Sheets and clips

All under `docs/reports/shots/hook-wiring/`:

| What | Before | After |
| --- | --- | --- |
| Styles in a row (dark and light), per component | `sheets/before/<component>.styles.png` | `sheets/after/<component>.styles.png` |
| web, ios and android in a row (Neutral and Liquid, both schemes), per component | `sheets/before/<component>.platforms.png` | `sheets/after/<component>.platforms.png` |
| Motion frames per style | | `sheets/switch-stretch.<style>.png`, `sheets/check-draw.<style>.png`, `sheets/copy-swap.<style>.png` |
| Clips per style | | `clips/toggles.<style>.webm` (switch and check), `clips/actions.<style>.webm` (copy) |

- **Components:** switch, checkbox, radio-group, button, copy-button, toast,
  dialog, alert-dialog, sheet, select (open), dropdown-menu (open), tabs,
  segmented-control.
- **How the before set was taken:** from a clean worktree of the pre-order
  code on its own server, so no work in progress leaked into it.
- **Scripts:**
  - `capture.cjs` takes the stills.
  - `record.cjs`, a copy of the round 3 recorder, takes the clips. It reads
    the round 3 drives and also stitches a filtered set.

## Contrast and gates

`ds style check` passes for every style:

| Style | Contract | Contrast pairs | Known failures |
| --- | --- | --- | --- |
| Studio | 764 | 602 | 0 |
| Desk | 764 | 602 | 4 (recorded before this order, none added) |
| Neutral | 764 | 602 | 0 |
| Liquid | 764 | 798 (brightest and darkest backdrop) | 0 |

- `npm run check` passed before each commit.
- Token snapshots changed for Studio and Neutral values, and the CLI style
  list snapshot changed for Studio's `proposedSchemes`.
- `preset.test.ts` now expects Studio windows to settle in steps (item 12).
- Forced colors keeps every existing fallback. Every `backdrop-filter` set
  here goes through a component hook, which drops it without support, under
  reduced transparency and under more contrast.
- Reduced motion: the styles reset the values they set in their own reduced
  blocks, under both the media query and `data-motion`.
- The contract suite was not rerun as its own command for the changed
  components. The full check covers the unit and gate tests only.

## Hooks still needed

| Component | Exact hook | For |
| --- | --- | --- |
| Switch | `--_switch-thumb-width` apart from `--_switch-thumb-size` | A capsule lens thumb in Liquid and on ios; the clearest split from Neutral at rest |
| Switch | `--_switch-radius`, `--_switch-thumb-radius` | Studio's square bit; today the recipe sets `border-radius` and `clip-path: none` on the parts |
| RadioGroup, RadioCard | `--_radio-group-radius`, `--_radio-group-dot-radius`, `--_radio-card-indicator-radius` | Studio's square radio without part rules |
| Toast | `--_toast-columns`, `--_toast-areas` | Studio's one line strip; `--_toast-strip` is a clip value, so the grid template is still set directly |
| Toast | `--_toast-edge-width` | Desk's 3px tone edge without an inset shadow |
| Dialog | `--_dialog-scrim-saturate` | Desk's scrim saturation, lost when it moved to the blur hook |
| AlertDialog, Sheet, Popover | `optionalParts['alert-dialog']` and a `titlebar` part with `controls` | Desk's real title bars with lights; drawn by recipe today |
| Sheet | `detents`, `data-detent`, `--_dialog-detent-height`, a rubber band into `--_dialog-drag-y` | ios detents; a bouncy enter is the nearest thing |
| Sheet | `--_dialog-enter-scale` honoured by Sheet | The android 0.92 scale; the sheet slides only |
| Drawer | Swipe to dismiss with the handle part | ios drawer from the bottom |
| Navbar | `largeTitle` part and `data-scrolled` | The ios large title |
| TabBar | The press point relative to the pill | The android ripple inside the pill; it is centred today |
| Platform layer | Shape hooks the platform owns, or a layer above recipes for them | So a style does not need `[data-platform='web']` scoping on press shapes |
| Window | `animateWindow` (`packages/motion/src/window.ts`) should pass the preset's `easing` | Studio windows move on the stepped `ease.spring-bouncy` their pattern rows name; today they use `ease.window` |
| Window | A Neutral row in React `Window/styleMotion.ts` (`[neutral.id]: neutral.window`) | React windows in Neutral still fade |
| Tokens | Zero `--ds-duration-*` under `data-motion='reduce'` as under the media query | Today only the media query zeroes tokens |

## What the owner must approve

All looks stay **proposed**:
- **Studio:** both schemes, now `proposedSchemes: ["dark", "light"]`; square
  radios; windows that move in steps.
- **Desk:** yellow glass title bars, the menu marker and the glass ball switch.
  Desk light stays proposed.
- **Neutral:** the blue gray dark palette, the 4px scrim blur, windows that
  settle, and the tinted highlight row.
- **Liquid:** the 20px modal blur, the 0.2 pressed thumb, the longer capsule
  and the standing sheen.
- **ios:**
  - no backdrop blur on overlays
  - no toast timer line
  - round checkboxes everywhere
  - a clear lens while the switch is held
- **android:**
  - filled fields unless `outlined` is set
  - snackbars that never stack
  - a tonal menu highlight
  - under reduced motion the switch dot changes size on press, but jumps
    instead of growing

## Changes needed from the lead

1. Remove the gallery's own injection of `interactionRecipes` in
   `apps/gallery-react/src/Interactions.tsx`. Each style's
   `recipes/Motion.css` now carries them, so the injection duplicates them.
2. Add Neutral to React `Window/styleMotion.ts`, and pass the preset easing
   through `animateWindow`.
3. Decide the layer for platform shape hooks (see the last rows of hooks
   still needed). Until then, recipes scope press shapes, timer lines and
   dialog footers to `[data-platform='web']`. Write that rule into
   `docs/contracts/style-pack.md`.
4. Token build: zero duration tokens under `data-motion='reduce'` too.
5. Allow `steps()` in `ease.window` in the contract, if Studio's window settle
   should not depend on pattern rows.
6. Redeploy the docs site so the owner can compare the looks and platforms on
   a phone.
