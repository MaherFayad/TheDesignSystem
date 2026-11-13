# Order 1.29, lane overlays and toasts

Fix round 1 of 3 after the round 3 interaction review
(`docs/reports/reviews/interactions-3.md`, Parts 3 and 7). React, the shared
CSS, the manifests, the motion helpers and registry rows of Dialog
(DialogBase), AlertDialog, Sheet, Drawer, Popover, Tooltip, HoverCard,
Toast and Toaster. NotificationCenter and CommandPalette needed no change.
Gallery on port 5183. Every probe is a Playwright script in this folder
(`overlays-toasts.<name>.mjs`) with its JSON beside it.

## Blockers

### B7: the iOS toaster stacks and expands the right way, and swipes up

- Found: order 1.28 had already set `--_toaster-dir: 1` and
  `--_toaster-align: start` with the iOS placement in `ios.css` (the review
  read the 1.25 file), so the stack already grew down. What was still wrong:
  the toaster kept `data-position="bottom-end"` and the swipe went `right`.
- Fix: `toasterPlacement(position, platform)` and `toasterSwipe(placement, dir)`
  in `packages/motion/src/helpers/toast-swipe.ts` (shared with Angular). On
  platform ios every position resolves to `top-center`, because `ios.css`
  moves every toaster there; `auto` is unchanged. `resolveToasterPosition`
  and `swipeFor` in `Toaster.tsx` now call them.
- Tests: `Toast.test.tsx` "the platform placement (review 3, B7)" (failed
  before: `data-position` was `bottom-end`); `toast.test.ts` "toaster
  placement". Probe `overlays-toasts.b7-toaster-ios.mjs`, 4 styles x ios,
  android, web at 390 by 844: on ios the stack grows down, older toasts peek
  below the front one, none above the top inset, the swipe is `up`; on every
  platform the front toast's anchored edge holds on expand.
  - Before (`overlays-toasts.b7-before.json`): 4 of 4 ios cases fail on
    `swipeUp` (`right`).
  - After (`overlays-toasts.b7-after.json`): 12 of 12 pass. Studio grows its
    front toast on hover (its recipe wraps the description), from the
    anchored edge, so the pointer stays on it.

### B8: a refused backdrop press keeps focus where it was (WCAG 2.4.3)

- Fix, `DialogBase.tsx`: a refused backdrop press (AlertDialog, or any
  family member with `dismissible={false}`) prevents the default of its
  `pointerdown` and of the `mousedown` that follows (a touch press still
  sends one), so focus never falls to the body. The nudge plays as before.
- Tests: `AlertDialog.test.tsx` "keeps focus where it was on a refused
  backdrop press" (mouse and touch) and `Dialog.test.tsx` "with dismissible
  false, a refused backdrop press keeps focus where it was". Both failed
  before (focus went to the body through user-event's mousedown default).
- Probe `overlays-toasts.b8-dialog-refuse.mjs`, 4 styles x full and reduced
  motion x mouse and touch: focus on "Stay on board" before, 30ms and 630ms
  after; the dialog stays open. After: 16 of 16
  (`overlays-toasts.b8-after.json`). Before is the review's
  `qa-overlays-selection.dialog-refuse.json` (BODY in every case).

### B9: the Desk scrim has no blur and no saturation in the fallback modes

- Found: the current tree already passes for blur (1.28 removed Desk's
  direct `--_dialog-scrim-filter`, and Desk resets its own blur in each
  mode).
- Added `--_dialog-scrim-saturate` (default `1`). `--_dialog-scrim-filter` is
  now `blur(var(--_dialog-backdrop-blur)) saturate(var(--_dialog-scrim-saturate))`,
  and every fallback block (no backdrop filter, reduced transparency,
  `prefers-contrast: more`, `[data-contrast='more']`, forced colors) sets the
  filter to `none` and the saturate to `1`. The backdrop keyframes grow
  from `blur(0) saturate(1)`.
- Test: `Dialog.test.tsx` checks the composed filter and the five resets.
  Probe `overlays-toasts.b9-scrim.mjs`: dialog, alert-dialog and sheet in 4
  styles x default, `data-contrast='more'`, `prefers-contrast: more`, forced
  colors and reduced transparency (CDP media feature), each with and
  without `--_dialog-scrim-saturate: 1.3` set on the root as a recipe would.
  - Before (`overlays-toasts.b9-before.json`, Desk): blur none in every
    fallback mode (pass), the hook not honoured (`.hook` default rows fail).
  - After (`overlays-toasts.b9-after.json`), the final run (gallery on
    5183, after the lint fixes): 120 of 120 rows pass, 4 styles x 3
    overlays x 5 modes x hook on and off. Desk, Neutral and Liquid draw
    `blur(..) saturate(1)` by default and `saturate(1.3)` with the hook;
    every fallback mode (both contrast forms, forced colors, reduced
    transparency) computes `none`, with and without the hook. Studio sets `--_dialog-scrim-filter: none` in its recipe (a flat scrim),
    so the hook has nothing to join there; the JSON notes it.

## Ten weakest

- #5 `toast-stack`, `toast-expand` on iOS: B7 above.
- #7 `dialog-refuse`: B8 above.

## Notes

- **N22** Studio exits slower than entries. The entry values are in the
  Studio recipe (`packages/styles/studio/recipes/Popover.css`: popover and
  hover card `duration.instant`, 70ms; tooltip `duration.spring-snappy`,
  70ms in Studio) against the base exits `duration.quick` 100ms (popover,
  tooltip) and `duration.fast` 80ms (hover card). Fixed in the base for
  every style: `--_popover-duration-out: min(var(--ds-duration-quick), var(--_popover-duration-in))`,
  the same for `--_tooltip-duration-out` and `--_hover-card-duration-out`
  (`duration.fast`). Neutral, Desk and Liquid enter slower than 100ms, so
  they are unchanged; Studio now exits in 70ms. Tests in
  `Tooltip.test.tsx` and `Popover.test.tsx`.
- **N23** `HoverCard.css` has its reduced transparency block
  (`--_hover-card-blur: 0`), as the Popover. Test in `Popover.test.tsx`.
- **N26** `tooltip-follow`: probe `overlays-toasts.n26-tooltip-follow.mjs`
  samples every frame for 400ms after a pointer move to the next control
  (4 styles x full and reduced motion; a run that misses the skip delay
  under load runs again). The current tree already showed one tooltip in
  every frame; the old one was hidden only in the full mode, so a style
  whose mode for the row is reduced or none still ran the 100ms exit beside
  the next one. `followLast` now hides the old one in every mode and only
  the slide needs full. After: 8 of 8 (`overlays-toasts.n26-after.json`).
- **N28** The Sheet drag speed is read over the last 100ms with the release
  as the last sample (`dragVelocity` in `helpers/sheet-detents.ts`), so a
  pause before the release leaves no speed. Test `Sheet.test.tsx` "a quick
  drag that pauses before the release has no speed left" (failed before:
  the sheet closed) and `sheet-detents.test.ts`.
- **N29** The Toaster notes the moment the store shows a toast version (the
  store starts its timer in that same call; its listeners run in it) and
  the progress line mounts that far along, as a negative
  `animation-delay` set before the first paint. A paused store notes
  nothing, so the line starts from its beginning with the timer. Test
  `Toast.test.tsx` "the line and the timer start together" (failed before:
  no delay). The store itself (`packages/shared`) is unchanged.
- **N44** `writeStack` reads every height first and writes after, and skips
  a value that has not changed. `watchStack` observes the viewport's own
  child list and each toast's `data-state` and size, never the subtree.
  `ToasterItem` is memoized, so a hover or focus flip of the Toaster's own
  state does not render every toast again. Tests in `toast.test.ts` "the
  stack writes without layout thrash" (both failed before: a read after a
  write; 8 reads for a change inside a toast).
  - Probe `overlays-toasts.n44-hover-perf.mjs` (1.5s hover over three
    toasts at 4x CPU, dev build): `writeStack` forces no layout during the
    hover (0 toast height reads, the review counted 25 long tasks). A trace
    of the expand frame: the Toaster render went from 132ms to 47ms with the
    memo; the rest is style recalculation of 34 to 93 elements (22 to 59ms
    at 4x), the cost of the custom property cascade per element. The 50ms
    frame target is not proven here: the machine ran at a load of 26 on 4
    cores while other lanes ran Playwright, and the numbers moved by 2x
    between runs (`overlays-toasts.n44-after.json`). Rerun on a quiet
    machine and on a production build.

## Sheet detents

- Props `detents` (fractions of the viewport height, 0 < n <= 1, or px,
  n > 1; sorted, clamped to the room under the top gap), `detent`,
  `defaultDetent` (0), `onDetentChange`. The root carries `data-detent`
  (the index) and inline `--_dialog-detent-height` (the current height)
  and `--_dialog-detent-max` (the largest). The panel is as tall as the
  largest; a smaller one moves it down by `transform` only.
- The drag follows the pointer between the detents, gives a rubber band
  past the largest (into `--_dialog-drag-y`, never more than 48px), and on
  release settles on the detent nearest to its visible height plus its
  speed times 200ms; when dismissible, closed is one more place. Below the
  smallest it follows down when dismissible and gives the rubber band when
  not.
- With detents the handle part is a system button (`ButtonRoot` from
  `Button/ButtonBase`, `data-ds="button"`, ghost emphasis, as CloseButton
  and the Pagination pages use it; lint `ds/button-primitive`) named
  "Sheet size, 1 of 2" (Arabic too), the handle-bar its only content: ArrowUp, ArrowDown, Home, End step,
  and Enter, Space and a press take the next one, round to the smallest
  (the button path, WCAG 2.5.7). `Dialog.css` keeps the handle look over
  the Button one (no minimum size, no press dip, shade or glow; display
  block) and `ios.css` keeps the grabber from the iOS button dim while it
  is pressed. Measured on ios in 4 styles: a 36 by 5 bar in a 24px strip,
  transparent, no shadow, as before. Without detents the handle is the
  same `aria-hidden` div as before.
- The math is `packages/motion/src/helpers/sheet-detents.ts`
  (`detentHeights`, `detentDragOffset`, `settleDetent`, `detentForKey`,
  `dragVelocity`, `dragCloses`, `detentRubberBand`), tested in
  `sheet-detents.test.ts`, framework free for the Angular port.
- iOS: the gallery `sheet-spring` stage passes `detents={[0.5, 1]}` on
  platform ios. Decision: detents are behavior an app picks (the handle
  turns into a button with a key path and a name), so a platform file
  cannot set them; a CSS property read on open would couple the look to
  the behavior. Probe `overlays-toasts.detents-ios.mjs`: Neutral and Desk
  at 390 by 844, half then full by ArrowUp (same panel height, only the
  transform moves), Enter cycles, a drag settles; 4 of 4
  (`overlays-toasts.detents-ios.json` and screenshots).
- Demo cases `detents` and `detents-arabic` in `Sheet.demo.tsx`.

## Drawer swipe to dismiss

- New part `handle` (with `handle-bar`), the first child of the panel,
  `aria-hidden`. On the web it is a strip on the panel edge that faces the
  page, as wide as the band padding (it lies in the empty gutter); on iOS
  it spans the top of the panel and its bar is the grabber the old
  `::before` drew (same place and size, checked by the probe).
- A drag toward the edge the drawer sits on (right for an end drawer in
  LTR, left in RTL, down on iOS) moves the panel by `--_dialog-drag-x` or
  `--_dialog-drag-y` (transform only; `data-dragging` on the root stops the
  transition). Release past a quarter of its size or a flick closes it;
  short, it springs back; against the edge, and toward it when not
  dismissible, a rubber band. The close control and Escape are the other
  paths. Math in `helpers/drawer-swipe.ts`, tests in
  `sheet-detents.test.ts` and `Drawer.test.tsx`.

## Optional title bar for AlertDialog, Sheet and Popover

Dialog's pattern, behind `useOptionalPart('<ds>', 'titlebar' | 'controls')`.
No style turns them on, so nothing changes today. The title (a direct title
child or the `title` prop) moves into a TitleBar (part `titlebar`) and stays
the accessible name. With `controls`: WindowControls (part `controls`); the
close light cancels the AlertDialog, closes the Sheet and the Popover;
minimize and zoom are inert. Without `controls`, the Sheet and the Popover
put their close control in the bar's actions. The Sheet's header is
replaced by the bar, followed by the description as a panel part. CSS in
`Dialog.css` (the Dialog rules now cover alert-dialog and sheet) and
`Popover.css`. Tests in each test file with a Desk theme whose
`optionalParts` lists the parts.

## Hooks added (defaults keep today's look)

| Name | Element | Default | Set by |
| --- | --- | --- | --- |
| `--_dialog-scrim-saturate` | dialog family root | `1` | a style recipe; reset to 1 in every fallback |
| `--_dialog-enter-scale` on Sheet | sheet root | `1` (the family default is not used on Sheet) | a style recipe; the Sheet keyframes now scale too, from the bottom edge |
| `--_dialog-detent-height`, `--_dialog-detent-max` | sheet root | `0px`; now values | Sheet.tsx, with `data-detent` |
| `--_dialog-drag-x` | drawer panel | `0px`; now value | Drawer.tsx (also `--_dialog-drag-y` on a drawer) |
| `--_dialog-drawer-handle-color` | drawer root | `transparent` (border.strong on ios, CanvasText in forced colors) | a style or a platform |
| `--_toast-columns` | toast | `var(--ds-size-icon-md) minmax(0, 1fr) auto` | a style or a platform |
| `--_toast-areas` | toast | `'icon title close' 'icon description close' 'icon action close'` | a style or a platform |
| `--_toast-edge-width` | toast | `var(--ds-border-width-strong)` | a style or a platform |
| part `handle`, `handle-bar` | Drawer panel | rendered | Drawer.tsx |
| parts `titlebar`, `controls` | AlertDialog panel, Sheet panel, Popover root | off | style.json `optionalParts` |
| states `data-detent` (Sheet), `data-dragging` (Drawer) | root | absent | the components |

Changed defaults with no change at rest: `--_popover-duration-out`,
`--_tooltip-duration-out`, `--_hover-card-duration-out` (N22).

## For the styles lane

- Desk `style.json`, to turn the new parts on (Desk's choice):
  ```json
  "optionalParts": {
    "window": ["controls", "titlebar"],
    "dialog": ["controls", "titlebar"],
    "alert-dialog": ["controls", "titlebar"],
    "sheet": ["controls", "titlebar"],
    "popover": ["titlebar"]
  }
  ```
- Workarounds the hooks replace:
  - Desk scrim saturation: set `--_dialog-scrim-saturate: var(--ds-blur-window-saturation)`
    on the family instead of writing `--_dialog-scrim-filter` (the 1.28
    recipe dropped the saturation to fix B9; this brings it back safely).
    Desk's reduced transparency block should also set
    `--_dialog-scrim: var(--ds-color-bg-scrim-80)` (review B9 second point,
    Desk stays at 0.28).
  - Studio `--_dialog-scrim-filter: none` may become
    `--_dialog-backdrop-blur: 0px` if Studio ever wants the saturate hook;
    not needed today.
  - Desk `CommandPalette.css` sets `--_command-palette-scrim-filter` with
    blur and saturate directly and resets it only under reduced
    transparency: under more contrast (both forms) and forced colors the
    Desk command palette scrim keeps both (the B9 bug in another
    component). Add `--_command-palette-scrim-filter: none` to those three
    blocks.
  - Studio `Toast.css` `grid-template-columns` and `grid-template-areas`,
    Desk `grid-template-columns` and `border-inline-start-width`: set
    `--_toast-columns`, `--_toast-areas`, `--_toast-edge-width` instead.
    The platform files keep their direct properties until the recipes
    move, because a platform hook would otherwise lose to a recipe's direct
    property (Desk on android).
  - N24 (Desk toaster `gap: 0` and negative margins) is the styles lane's.
  - A style may scale the Sheet in with `--_dialog-enter-scale` and draw a
    Drawer handle with `--_dialog-drawer-handle-color` (Desk could use its
    yellow grip).

## DOM changes for the Angular parity lane

Angular has no Sheet, Drawer, AlertDialog or Popover yet; when it ports
them:

- Toaster: `resolveToasterPosition` in
  `packages/angular/src/components/toast/toaster.ts` must use
  `toasterPlacement` from `@the-system/motion` (every position is
  `top-center` on ios) and the swipe `toasterSwipe`; its spec at
  `toaster-motion.spec.ts:321` expects `top-end` on ios and must change.
  The progress line takes the negative `animation-delay` (N29), and the
  Angular toaster uses the shared `watchStack` (N44) as it is.
- Dialog family: a refused backdrop press prevents the `pointerdown` and
  `mousedown` defaults (B8).
- Sheet: with `detents`, `data-detent` on the root, inline
  `--_dialog-detent-height` and `--_dialog-detent-max`, and the handle part
  is `<button dsButton emphasis="ghost" data-part="handle" aria-label="Sheet size, n of m">`
  (the React DOM carries the Button base attributes `data-ds="button"`,
  `data-size`, `data-tone`, `data-emphasis="ghost"`, `data-shape`, and
  the `hit` part after the handle-bar) with the keys above; without detents it stays the `aria-hidden` div. Optional
  `titlebar` replaces the header, then the description as a panel part.
- Drawer: `<div data-part="handle" aria-hidden="true"><span data-part="handle-bar"></span></div>`
  first in the panel; `data-dragging` on the root while dragged.
- AlertDialog: optional `titlebar` first in the panel, the title inside it
  as `<span data-dialog-title>`.
- Popover: optional `titlebar` first in the root, holding the title span
  and the close control (or `controls`).
- Tooltip: the last tooltip is hidden at once in every mode on a follow.

## Contract text for the lead

- `docs/contracts/anatomy.md`: Sheet parts `titlebar`, `controls`
  (optional, replace `header`), state `data-detent`, the handle part is a
  button when detents are set; Drawer parts `handle`, `handle-bar`, state
  `data-dragging`; AlertDialog and Popover optional parts `titlebar` and
  `controls`.
- `docs/contracts/style-pack.md`: `optionalParts` keys `alert-dialog`,
  `sheet`, `popover` (parts `titlebar`, `controls`), next to `dialog` and
  `window`.
- `docs/reports/interactions-3.md` "Hooks for styles and platforms": add
  the hooks in the table above.

## Files changed

- React: `Dialog/DialogBase.tsx`, `AlertDialog/AlertDialog.tsx`,
  `Sheet/Sheet.tsx`, `Sheet/Sheet.demo.tsx`, `Drawer/Drawer.tsx`
  (`splitHeader` also returns the parts apart), `Popover/Popover.tsx`,
  `Tooltip/Tooltip.tsx`, `Toast/Toaster.tsx`, and the tests of each.
- CSS: `Dialog.css`, `Toast.css`, `Popover.css`, `Tooltip.css`,
  `HoverCard.css`; `platform/ios.css` (no button dim on the Sheet detent handle; the Drawer grabber on the handle
  part, the Sheet comment).
- Manifests: Sheet, Drawer, AlertDialog, Popover.
- Motion: `helpers/toast-stack.ts`, `helpers/toast-swipe.ts`,
  `helpers/sheet-detents.ts` (new), `helpers/drawer-swipe.ts` (new),
  `helpers/index.ts`, `helpers/toast.test.ts`,
  `helpers/sheet-detents.test.ts` (new), `interactions/overlays.ts`.
- Gallery: `apps/gallery-react/src/interactions/overlays.tsx` (the
  `sheet-spring` stage passes detents on ios). `Interactions.tsx` needed no
  change: the Toaster resolves the platform placement itself.

## Decisions

- B7 is solved in the shared helper, so the Toaster mount and the default
  `position` stay as they were; on ios every position is the top centre.
- The detent handle is a system button (the Button base) with the state
  in its name, not a slider: the order asks for a button path, and a press cycles.
- The Drawer strip is as wide as the band padding, not 24px, so it never
  covers content; the close control is the equivalent target.
- The Sheet's enter scale defaults to 1 on the Sheet so the family default
  (0.98) does not start to apply.
- N22 is fixed in the base with `min()` over tokens, so no style can exit
  slower than it enters.

## Proof

Final run after a container restart, with the lint fixes in place:

- Lint: the detent handle is `ButtonRoot` (no bare `<button>` in
  `Sheet.tsx`, gate `ds/button-primitive` passes); the Drawer handle's
  `z-index` in `Dialog.css` is `var(--ds-z-raised)` (gate `ds/no-raw-value`
  passes). Both gate tests pass.
- `npx vitest run` on the lane (Sheet, Dialog, AlertDialog, Drawer,
  Popover, Tooltip, HoverCard, Toast, `packages/motion/src/helpers`):
  20 files, 251 tests pass. The lead's snapshot turned on Desk's
  `optionalParts` (as proposed above), so the two "no title bar" tests in
  `AlertDialog.test.tsx` and `Popover.test.tsx` now use Neutral, which has
  none; 98 of 98 pass in Popover, AlertDialog, Sheet and Dialog after that.
- `npx tsc --noEmit -p tsconfig.json`: clean.
- `npm run contract -- --framework react --component Dialog,AlertDialog,Sheet,Drawer,Popover,Tooltip,HoverCard,Toast`:
  436 passed, 0 failed (57 each, Tooltip 37).
- B9 probe: 120 of 120 (`overlays-toasts.b9-after.json`).
- Detents probe rerun with the new handle: 4 of 4. The handle on ios in 4
  styles measures a 36 by 5 bar in a 24px strip, transparent, no shadow.
- `npm run check`: tokens build, gen, typecheck, manifests, angular,
  native, docs, gallery native and both consumers pass. Red, none in this
  lane's files:
  - eslint: `packages/angular/src/components/select/select.motion.spec.ts:87`
    unused `items`.
  - gallery-angular: TS2339 `shownState` does not exist on `DsSwitch`.
  - vitest: `packages/lint/src/gates/no-tailwind.test.ts` and
    `no-native-title.test.ts` time out at 5s (they take 15s to 16s alone
    at a load of 23 on this machine; no finding). The other two failures
    were the lane's title bar tests, fixed above.

## Not done

- The N44 frame target (under 50ms at 4x) is not proven on this machine
  (see N44).
- Angular: not mine; listed above.

## Changes needed from the lead

- The contract text above.
- None in root config, barrels or generated files (`npm run gen` is not
  needed: the new helpers are exported from `helpers/index.ts`, which I
  own).
