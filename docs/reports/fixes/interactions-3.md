# Fix round 1 of 3 for interaction round 3 (order 1.29)

Inputs: the 14 blockers, the ten weakest and the 48 notes of
`docs/reports/reviews/interactions-3.md`; "Hooks still needed" in
`docs/reports/hook-wiring.md`; "Changes needed from the lead" and "Not
ported" in `docs/reports/lanes/angular-sync-3.md`. Branch
`claude/ds-order-1-29`, cut from `claude/relaxed-hypatia-7gseap` at ea67760.
Everything stays proposed.

The lane reports, probes and JSON are under `docs/reports/fixes/interactions-3/`:
`helpers.md`, `rewire-react.md`, `rewire-angular.md`,
`toggles-selection.md`, `switch-closure.md`, `actions-navigation.md`,
`overlays-toasts.md`, `fields-feedback.md`, `styles-platforms.md`,
`angular-b11-b12.md`, `angular-parity.md`, `recordings.md` and `final.md`.
Every probe is a Playwright script beside its `before` and `after` JSON;
"before" was run on the code of ea67760 (or `8aeb19b~1` for files changed
by the move), "after" on this branch.

## Blockers

| # | Status | Test (fails before, passes after) | Evidence |
| --- | --- | --- | --- |
| B1 soft Tabs pill over the leaving label | fixed: the list isolates, the indicator sits under every label at `calc(0 - var(--ds-z-raised))` | `tabs-ink.probe.cjs`: leaving label contrast on every frame, 4 styles light and dark; Tabs unit tests | before 3 of 8 rows at 1.0:1; after 8 of 8 at rest contrast (`tabs-ink.before.json`, `tabs-ink.after.json`) |
| B2 tab ink under forced colors | fixed: `planInk` returns early under `(forced-colors: active)` and when the pill is not drawn | `tabs-ink.probe.cjs` forced colors rows; two cases in `nav-ink.test.ts` | before 6 of 9 twins drawn, selected label 1.25:1; after 0 twins, lowest 9.6:1 |
| B3 switch thumb contrast on every toggle frame | fixed in every style, scheme and platform | `switch-contrast.cjs` (144 runs: 4 styles x 2 schemes x 3 platforms x toggle and drag, frames every 10ms, exits non zero under 3:1); `Switch.drag.test.tsx` "Switch thumb contrast on every frame" | before 72 of 144 under 3:1, lowest 1.00 (`switch-contrast.before.json`); after 0 of 144, lowest 3.23 (`switch-contrast.final.json`) |
| B4 switch drag held midway | fixed: the root shows the side the thumb is on, the thumb color steps at the middle, the fill stays opaque under the thumb | same probe, drag held 0 to 1 in 0.05 steps; `switch-drag.test.ts` `dragOnSide` | as B3 |
| B5 unchecked to mixed draws part of a check | fixed: from unchecked the mark takes the target glyph at once (`data-enter`) and only draws | `Checkbox.motion.test.tsx` (2 of 7 fail on the old Checkbox.tsx) | `toggles-selection.md` |
| B6 floating label hidden under the box | fixed: the label is raised over the box; its rest place is measured from the control per size and platform (`placeFloatingLabel`) | `probe-floating-label.mjs`, 72 cases (4 styles x web, ios, android x LTR, RTL x sm, md, lg); Field unit tests | before 0 of 72 (the hit test found the input); after 72 of 72, worst centre offset 0.2px |
| B7 ios toaster upside down, front toast jumps | fixed: `toasterPlacement` resolves every position to top centre on ios, `toasterSwipe` gives up; the stack direction was already set by 1.28 | `Toast.test.tsx` "the platform placement"; `overlays-toasts.b7-toaster-ios.mjs` (4 styles x 3 platforms) | before 4 of 4 ios fail (swipe right, `bottom-end`); after 12 of 12 |
| B8 refused backdrop press drops focus | fixed: a refused press prevents the `pointerdown` and `mousedown` defaults (React and Angular) | `AlertDialog.test.tsx`, `Dialog.test.tsx`; Angular dialog spec; `overlays-toasts.b8-dialog-refuse.mjs` | after 16 of 16 (4 styles x full and reduced x mouse and touch); before: the review's `dialog-refuse.json`, BODY in every case |
| B9 Desk scrim keeps its blur | fixed: the scrim filter is `blur() saturate(var(--_dialog-scrim-saturate))`, and every fallback mode sets the filter to `none` and the saturate to 1; Desk reduced transparency uses `bg-scrim-80`; Desk CommandPalette scrim covered too | `Dialog.test.tsx` (the five resets); `overlays-toasts.b9-scrim.mjs` | after 120 of 120 rows (dialog, alert dialog, sheet x 4 styles x 5 modes x hook on and off) |
| B10 dead 44 and 48px hit areas | fixed: a new `hit` part (empty, `aria-hidden`, last child) on the button family except Chip; the platform files grow the hit part, not the glow `::before` | `hit-area.probe.cjs` (Button, IconButton, CloseButton, CopyButton, ToggleButton, FAB on ios and android); contract anatomy | before hundreds of dead points and a growing glow; after 0 dead points, 0 glow growth |
| B11 Angular Slider fill and ProgressCircle arc | already fixed on the tree by the round 3 Angular sync (the review was cut before it merged); a spec added | `slider.motion.spec.ts` (4 of 10 fail without the fill properties), `progress-circle.spec.ts` (fails without the arc) | `angular-b11-b12.pixel.json`: 24 of 24 runs 0 differing pixels against React |
| B12 Angular contract red | already fixed on the tree; all six parts render; manifests stay ready because each contract run passes | Angular contract, 8 components | `angular-b11-b12.contract.after.json`: 295 passed, 0 failed |
| B13 recordings | done: 436 contact sheets, all 109 ids in Studio, Desk, Neutral and Liquid, light, cropped to the control, 27.5MB, no video added | `record.cjs` with `SHEETS_ONLY=1`; the band timing now syncs on a black cover found in the video | `docs/reports/shots/interactions-3/sheets/`, `recordings.md` |
| B14 `tab-slide` long task | not fixed to the target; improved from 821 and 1030ms to 268 (Liquid) and 237ms (Neutral) at 4x on a production build: `planInk` and `planSlide` read every box once and return a writer, `inFrame` batches every list's reads before writes, the twins are built once per part, labels the pill never passes get none; TabsPanel no longer forces Radix Presence reads; the keep-in-view read runs only when the list overflows | `nav-ink.test.ts`, `indicator` tests (N30 zoom, 6 of 7 fail before); `perf.cjs` | `playInk` self time 411ms to 17ms (CPU profile); `final.perf.md`, `final.perf.tab-slide.after.json`, `final-fixes.md` |

## The ten weakest

| # | Interaction | Status |
| --- | --- | --- |
| 1 | `switch-stretch` | fixed (B3) and N1: the travel stays on the spring after a tap; the press timing applies only until release (`data-released`) |
| 2 | `switch-drag` | fixed (B4) |
| 3 | `tab-slide` | fixed (B1, B2, B14, N30) |
| 4 | `field-label-focus` floating | fixed (B6), centred at lg, ios and android |
| 5 | `toast-stack`, `toast-expand` on ios | fixed (B7) |
| 6 | `check-mixed` | fixed (B5) |
| 7 | `dialog-refuse` | fixed (B8) |
| 8 | `wizard-step` | fixed (N13): loading shows only when the check is still pending two frames after Next; the `@starting-style` rise is gone, one entrance |
| 9 | `menu-origin`, `menu-rows` | fixed (N25): rows fade with the surface, only the rise staggers; no empty card |
| 10 | `copy-swap` | fixed (N4): the label cell clips on both axes; the overlap is shorter (`copy-swap.probe.cjs`, 0 border pixels after) |

## Notes

Fixed: N1, N2, N3 (Studio plays `radio-pop`), N4, N5 (Neutral on ring),
N6 (Liquid off ring 2px), N7, N8, N9, N10, N11, N12 (`FollowGlide`), N13,
N15, N17, N18, N19, N22, N23, N24, N25, N26, N27, N28, N29, N30, N31, N32,
N33, N34, N35, N37, N38, N40, N41 (navigation and feedback stages), N42 (107 beats now
quote the token values), N43, N44 (`writeStack` reads before it writes; the
observer watches the direct child list), N46.

Decided with no code change: N14 (the OTP root is `dir="ltr"`, so the caret
travels left to right in Arabic too; the comment and registry now agree),
N20 and N21 (fixed by 1.28; measured 5.0 to 7.9:1), N36 (the spinner stops
under both reduced motion forms; `pauseLoops()` stays for pages with their
own pause control), N39 (passes).

N16 is done in Angular (Field `floating`, Input `variant`). Not done: N45
(needs the production build check); N47 (the token build is outside this order: see
contract text); N48 (a load timeout, noted).

## Hooks added and where each is set

Never renamed or removed an existing property or part.

| Hook | Element | Default | Set by |
| --- | --- | --- | --- |
| `--_switch-thumb-width` | switch | the thumb size | Liquid recipe and `platform/ios.css`: 1.5 x the thumb size (capsule lens) |
| `--_switch-radius`, `--_switch-thumb-radius` | switch | full | Studio recipe (the square bit; its part rules are deleted) |
| `--_switch-thumb-edge`, `--_switch-thumb-edge-width` | switch thumb | none | `platform/android.css` (off dot edge), Neutral recipe on android |
| `--_radio-group-radius`, `--_radio-group-dot-radius`, `--_radio-card-indicator-radius` | radio group, radio card | full | Studio recipe (part rules deleted) |
| `--_toast-columns`, `--_toast-areas` | toast | today's grid | Studio (one line strip), Desk |
| `--_toast-edge-width` | toast | `border-width-strong` | Desk (inset shadow edge, its RTL twin and forced colors rule deleted) |
| `--_dialog-scrim-saturate` | dialog family | 1 | Desk (window saturation; 1 in every fallback mode) |
| `--_dialog-enter-scale` honoured by Sheet | sheet | 1 on the Sheet | `platform/android.css`: `scale-window-enter` (0.92) |
| `--_dialog-detent-height`, `--_dialog-detent-max`, `data-detent` | sheet | none | Sheet with `detents`; the ios gallery stage passes detents |
| `--_dialog-drag-x`, `--_dialog-drawer-handle-color` | drawer | 0, transparent | Drawer; `platform/ios.css` (grabber) |
| `titlebar` and `controls` optional parts | AlertDialog, Sheet, Popover | off | Desk `style.json` `optionalParts` (the faked AlertDialog band and the Popover top edge are deleted) |
| `hit` part | button family except Chip | `display: none` | `platform/ios.css` 44px, `platform/android.css` 48px |
| `data-result-label` | Button result part | | the component |
| `data-released` | switch root | | the component (press timing until release) |
| `--_skeleton-swap` | skeleton | `wipe` | an off row sets `none` |
| `--_<component>-roll` | digit layers | read only | an off row sets `none`; `scrub-roll` sets `--_scrub-input-roll: none` |
| `--_progress-circle-ease-full` | progress circle | `ease.out` | no style needs another value yet |
| `data-held`, `data-revealing` | meter | | the component |
| `animateWindow` `preset` option, `windowMotionPreset` | window | | `Window.tsx`, from the style's motion preset |

## Helpers moved

One copy each in `packages/motion/src/helpers/`, imported by React and
Angular; the duplicates are deleted (`helpers.md`, `rewire-react.md`,
`rewire-angular.md`): switch drag, toggle layer, field motion (with the error
shake and the digit layer), slider fill and rubber band, selection marker,
selection motion and value roll, toast stack, toast swipe, nav ink,
indicator, exit ghost, digit roller, celebrate, FLIP list, meter value, step
check. New this round, also shared: sheet detents, drawer swipe, toaster
placement and swipe, `FollowGlide`, `placeFloatingLabel`, `markReleased`.
Nothing went to `packages/shared`: every family mixes timing with its pure
parts. TabBar's `pressOrigin.ts` stays in React (it rounds and skips empty
boxes; the shared one would change the values it writes).

## Sheet detents and Drawer swipe

- Sheet `detents` (React): `data-detent`, `--_dialog-detent-height`; release
  settles to the nearest detent by position and velocity; a rubber band past
  the top one into `--_dialog-drag-y`; the handle is a system button named
  with its state ("Sheet size, n of m"), arrows and Enter cycle detents
  (WCAG 2.5.7). Used on platform ios through the gallery stage.
- Drawer swipe to dismiss on the `handle` part, with Escape and the close
  button as the other paths.
- Angular has no Sheet or Drawer: the math is framework free so its port can
  import it. Not ported in this round.

## Angular

- Rewired onto the shared helpers; ported the `hit` part, the result label,
  the floating Field, Input `variant`, Form and Field glide, the wizard
  delay, the password fade, the Meter attributes, the off rows, the toaster
  placement and swipe, the refused backdrop press, the Checkbox and Switch
  state attributes, the ToggleGroup label check (`angular-parity.md`,
  `switch-closure.md`).
- DOM diff: 57 of 60 components equal React. CheckboxGroup: React's
  select-all box carries `data-enter` at rest because its items register
  after mount; Angular does not copy it (fix in React next round). TitleBar
  and WindowControls have no Angular demo page.
- Not ported (no Angular component): Sheet, Drawer, AlertDialog, Popover,
  Tooltip, Tabs, Navbar, Pagination, Sidebar, Badge, Avatar, Stat.

## Contract text the lead should add

- `anatomy.md`: the `hit` part of the button family (empty, `aria-hidden`,
  last child, not on Chip, grown by platforms; the glow `::before` never
  takes pointer events); Sheet optional parts `titlebar`, `controls` and the
  state `data-detent`, the handle part is a button when detents are set;
  Drawer parts `handle`, `handle-bar` and the state `data-dragging`;
  AlertDialog and Popover optional parts `titlebar` and `controls`; Switch
  `data-released`; Meter `data-held`, `data-revealing`.
- `style-pack.md`: `optionalParts` keys `alert-dialog`, `sheet`, `popover`;
  a platform keeps its own layout as direct properties when a style sets
  that layout through a hook (the recipe layer comes after the platform
  layer).
- `frameworks.md`: framework free motion lives in
  `packages/motion/src/helpers/`, imported by both frameworks; Angular specs
  run through `ng test` only.
- `docs/reports/interactions-3.md` "Hooks for styles and platforms": the
  hooks in the table above.
- Token build (N47 and hook-wiring item 4): zero `--ds-duration-*` under
  `data-motion='reduce'` as under the media query.

## Not done, and why

- Angular ports of Sheet detents and Drawer swipe: Angular has no Sheet or
  Drawer.
- The CheckboxGroup select-all `data-enter` at rest (a React fix, next round).
- `switch-stretch` sheet crop cuts the label (a `region` entry in
  `drives/toggles.cjs`).
- A slider with a label but no value output can still have its label covered
  by the bubble while held.
- N45, N47.
- The 21 old `.webm` clips under `docs/reports/shots/interactions-3/clips/`
  are still tracked (100MB); deleting them is the lead's call.

## Proof at the end

Run on the final tree (a49feaa for the suites, then the last fixes in
`final-fixes.md`). Details: `docs/reports/fixes/interactions-3/final.md`.

| Proof | Result |
| --- | --- |
| `npm run check` | all 13 steps pass (vitest 2576 root tests, 744 Angular tests), again after the last fixes |
| Angular contract, full | 2278 passed, 0 failed, 69 skipped (`docs/reports/contract-angular.json`) |
| React contract, full | 4411 passed, 1 failed, 163 skipped (`docs/reports/contract-react.json`); the failure was a real Popover race (a closing popover returned focus and closed the next one), fixed after the run: Popover 57 of 57 three times, race probe 0 of 216 missed at 6x CPU (6 before) |
| `npm run shots -- --compare react angular` | 1312 of 1312 pairs pass; 56 pairs differ by 1 to 1231 pixels (at most 0.12 percent), all from the production CSS build and equal from the dev server; 1064 React shots have no Angular page (51 components planned for Angular) (`final.shots-compare.md`) |
| Performance, 18 interactions, 4x CPU, 390 by 844 touch | every long task row is lower than in the review (`final.perf.md`); the review used the development build, so the button press baseline also fell (73 to 61ms Liquid, 114 to 53ms Neutral) |
| `tab-slide` | largest task 268ms Liquid and 237ms Neutral (821 and 1030 in the review); not under 50ms. The rest is three whole stage restyles; ToggleGroup's direct `followIndicator` call in its layout effect forces one (moving it to `inFrame` measured 227 and 188ms). The button press alone is 53 to 66ms at 4x on this machine |
| Switch frame contrast, toggle and drag, 4 styles x 2 schemes x 3 platforms | 144 runs, 0 under 3:1, lowest 3.23 (`final.switch-contrast.json`, also on the production build) |

Found by the proofs, for the lead:

- Vite's CSS minifier rewrites `:dir(rtl)` into a `:lang(ar, he, ...)`
  fallback (109 rewrites from 46 rules): a url field in a `dir="ltr"`
  InputGroup on an Arabic page is right aligned in production
  (`Input.css:277`). The build target must keep `:dir()`.
- ToggleGroup (React and Angular): move the layout effect onto `inFrame`
  with `planFollow` and `planInk`, as Tabs does.
- The TabsPanel doc comment says inactive panels are hidden with
  `forceMount`; correct it and the manifest.
- The shots capture rewrote `docs/reports/shots/matrix/` from the production
  build; committed as is.
