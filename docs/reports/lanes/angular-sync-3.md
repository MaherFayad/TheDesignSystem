# Lane report: Angular level with interaction round 3 (order A-sync3)

Agent: ds-angular, as lead of this lane, with seven family agents (each
claude-opus-5-5 at medium, each owning distinct component folders). Branch
`claude/ds-angular-sync-3`, cut from `claude/relaxed-hypatia-7gseap` at
`23abbc0`. Changes are in `packages/angular/src/**` and
`apps/gallery-angular` only, plus the `angular` notes of the Toast and Dialog
manifests, the regenerated `manifests.gen.json`, the full Angular contract
report and the proof files under `docs/reports/shots/angular-sync-3/`. No
CSS, React, `packages/motion` or `packages/shared` file was touched. No
dependency was added.

Commits: `a-sync3: setup` (the DOM diff script, the baseline, the review B1
change in `internal/motion-feedback.ts`, the new stage files), `a-sync3:
sliders`, three `a-sync3: checkpoint ...` commits (the families saved while
they ran; toggles, overlays, feedback and navigation, actions and selection
landed whole inside them, each finished and tested before the next family
commit), `a-sync3: fields`, `a-sync3: lead cleanup ...`, and this report.

The round 3 change read: `git diff 0747686^1 0747686` (the merge of
`claude/ds-order-1-23`), and its report `docs/reports/interactions-3.md`
from that branch (not yet on the lead branch).

## 1. The difference list (before this lane)

Method: `docs/reports/shots/angular-sync-3/dom-diff.mjs` dumps every demo
case of each Angular component in both galleries (React on 5301, Angular on
5302), attributes sorted, generated ids normalized, inline `style` kept, and
writes a line diff per component. Baseline in `dom-before/`, result in
`dom-after/`. States a demo does not show at rest (pressed, dragged, open,
copied, result, sliding, dismissing) were compared by each family agent with
its own Playwright driver and by reading the code.

Diff lines at rest before the change, then the behaviour differences:

| Component | Lines | What differed |
| --- | --- | --- |
| Button | 40 | No `result` and `resultLabel`, no `data-result`, no `result` part (svg strokes, `pathLength=1`), no result status, no demo case "error". The base wrote no glow (`--_button-glow-x/-y`) and no ripple origin (`--_button-ripple-x/-y`), so no family member had them. The loading morph rolled the label back even when loading ended into a result. |
| CopyButton | 1376 | The round 2 DOM: one swapped icon, one label, `aria-label` only when icon only, and a `buttonMorph` swap React dropped. Missing: stacked `data-copy-glyph` glyphs, stacked `data-copy-label` words with `data-roll`, the fixed `aria-label`, the status child per copy, the `bubble` part. |
| IconButton, FAB, SplitButton, ButtonGroup, CloseButton, Link | 0 | CSS only in round 3; they lacked glow and ripple through the base. |
| Switch | 43 | No `thumb-lens`, no `thumbIcon` input and `thumb-icon`, no drag, no `data-dragging`, no `--_switch-drag-progress`. |
| Checkbox | 476 | A `dsIcon` in a clip span instead of the empty fill span and `svg[data-part=mark][data-glyph]` with two strokes; the indicator lacked Radix's `pointer-events: none`. |
| CheckboxGroup | 392 | The Checkbox difference; select all off did not cascade back from the last box. |
| ConsentField | 224 | The Checkbox difference; the consent pop aimed at `[data-ds=icon]`, which no longer exists; `id` written before `aria-labelledby`. |
| RadioCard | 141 | A dot span instead of `svg[data-part=badge]`. |
| ToggleButton | 119 | No `state-layer`, no press point, the old part pop instead of the flood. |
| RadioGroup | 0 | Round 3 is pure CSS there. |
| Input | 0 | No `variant` input and `data-variant`. |
| Field | 0 | No `floating` input, `data-floating`, `data-filled`, label after the control. |
| FieldError | 0 | Round 2 `slideIn` instead of `emerge()` (from under the control). |
| PasswordField | 0 | Round 2 icon turn instead of the diagonal wipe. |
| Form | 53 | No `success-mark` after the buttons; the celebrate run must skip it. |
| FormWizard | 0 | No `success-mark` in the done title. |
| InlineEdit | 0 | The round 2 morph had never been ported. |
| Fieldset | 58 | The Checkbox difference (fixed by the toggles family). |
| PhoneField | 1 | The "too large to diff" notice; the dumps were equal. |
| Textarea, SearchField, NumberField, ScrubInput, OTPField, Label, InputGroup | 0 | No round 3 change outside the shared CSS. |
| Slider, RangeSlider | 40, 34 | No inline `--_slider-from`, `-to`, `-pull-start`, `-pull-end`; the round 2 shake for the nudge; no glide, rubber band or follow flag. |
| Rating | 260 | No `--_rating-index`, no `svg[data-part=fill]` per star; the round 2 fill run. |
| ListBox | 127 | The round 2 glide span per option, no `highlight` marker, no check draw. |
| Select | 0 | Same glide span, no marker, the round 2 value roll instead of the drum roll. |
| DropdownMenu | 0 | No marker, the exit played on the real menu (no inert copy, review B6), no drawn check, the row fill still slid. |
| Combobox, Autocomplete, MultiSelect, TagField | 0 | The exit on the real popup, no `combobox-results`, no marker. |
| FilterBar | 82 | React's `transform-origin` leftovers (see section 4); the chip used the round 2 pop, no label slide, no press point. |
| Toast | 0 | Open (three toasts, hovered): no `data-stacked`, `data-expanded`, `data-paused`, none of the `--_toast-*` and `--_toaster-*` place values, no `progress` part, the old one way swipe, no `position="auto"`, the round 2 flip. |
| Dialog | 0 | No `dialog-refuse`. |
| NotificationCenter | 2 | The demo grid minimum. |
| TitleBar, WindowControls | n/a | No Angular demo route; round 3 changed only `WindowControls.css`; the window-lights stage DOM was already equal. |
| SegmentedControl, ToggleGroup | 0 | The round 2 label dip still played; no `label-ink` twins. |
| Stepper | 0 | No check draw for a step that completes. |
| ProgressBar, ProgressCircle | 0, 100 | No halo; ProgressCircle had no `arc` svg and still turned. |
| Meter | 56 | The demo grid minimum and the inline transition string; no value beat. |
| Skeleton | 0 | The ghost faded instead of wiping, and was drawn under reduced motion. |
| Alert, Banner, Callout, ErrorState, Spinner, StatusDot | 0 | Only review B1 (reduced mode drops the ghost), applied by the lead. |

## 2. What was synced, per component

**Actions** (button, icon-button, floating-action-button, split-button,
button-group, copy-button, close-button, link).
- Button: inputs `result` (`success` | `error`) and `resultLabel`,
  `data-result`, the `result` part keyed by glyph (the last glyph kept while
  it leaves, as React's `shown`), the result status, `ButtonResult` export,
  demo case "error".
- Button base: `pointerdown` and `pointermove` write the glow share (not on
  link emphasis, not while inert); `pointerdown` writes the ripple px from
  the inline start, RTL aware. Every family member gets both. The loading
  morph passes no label when a result follows.
- CopyButton: stacked glyphs keyed by copy count, three words with
  `data-roll` from React's `rolls()`, `aria-label` always the idle word, the
  bubble on the icon only form, a status child per copy (a new text node each
  time), the hold restarts on each copy, the old morph removed.

**Toggles** (switch, checkbox, checkbox-group, radio-group, radio-card,
toggle-button, consent-field).
- Switch: `thumb-lens`, `thumb-icon` behind `thumbIcon`; the drag
  (`internal/toggles-switch-drag.ts`, a copy of React's `drag.ts`): 3px slop,
  30 percent of the overshoot capped at 12 percent of the travel, snap by
  velocity above 0.006 travels per ms, the click that ends a drag swallowed;
  tap, Space and Enter still toggle. Clicks and drags share one change path,
  so forms see one change per real change and touched on blur.
- Checkbox: the fill span and the `mark` svg with `data-glyph` (the last
  glyph kept), the indicator's `pointer-events` style, attribute order.
- CheckboxGroup: the cascade back from the last box (3, 3, 2, 1).
- ConsentField: the pop targets the mark.
- RadioCard: the `badge` svg.
- ToggleButton: `state-layer` first, the press point
  `--_toggle-button-x/-y` on pointer down (keys clear it, so the flood starts
  at the centre), `play(layer, toggleLayerSpec(on), 'toggle-pop')` as React.

**Fields** (input, textarea, password-field, search-field, number-field,
phone-field, scrub-input, otp-field, field, field-error, label, fieldset,
form, form-wizard, inline-edit, input-group).
- Input `variant`. Field `floating`, `data-floating`, `data-filled` from the
  input event and from an `afterEveryRender` read, so a value written by a
  model or `FormControl.setValue` counts, as React's layout effect.
- FieldError `emerge()`; PasswordField `diagonalWipe` with React's ids and
  the reduced `fadeOutBeat`; both copied into `internal/motion-fields.ts`.
- Form and FormWizard `success-mark`; the Form celebrate run skips it.
- InlineEdit: the round 2 `inline-edit-morph`, never ported before.

**Sliders** (slider, range-slider, rating).
- The four host variables in React's order, from an `afterRenderEffect`.
- slider-fill glide, slider-rubber-band (`1 - 1/(1 + d/thumb)`), slider-nudge
  as React's key pull (`KEY_BUMP` 0.5, held one snappy spring), in
  `internal/slider-fill.ts`. The bubble B4 fix is CSS only.
- Rating: `--_rating-index`, the `fill` glyph, the round 3 fill run.

**Selection** (list-box, select, combobox, autocomplete, multi-select,
tag-field, filter-bar, dropdown-menu).
- `internal/selection-marker.ts`, a copy of React's `highlightMarker.tsx`:
  one `highlight` marker per list (ListBox, Select viewport, every menu and
  submenu), check-draw-pick, the exit copy (review B6) through `exitGhost`
  for DropdownMenu and, in `internal/popper.ts`, for the four pickers.
- Select `rollValue`, the drum roll with an inert copy.
- `combobox-results` (`FlipGroup` with `nearOnly`, run after every render).
- The FilterBar chip: drawn check, label slide, `--_chip-press-x/-y`.
- The round 2 glide span removed (List only now).

**Overlays** (toast, dialog, notification-center, title-bar,
window-controls).
- Toaster: `data-stacked`, `data-expanded` on hover or focus inside,
  `data-paused` from the same signal that pauses the store, React's
  pointer out rule, the stack place values from `internal/toast-stack.ts`
  (React's `stack.ts`), `position` with `auto` (top centre on iOS, bottom end
  elsewhere).
- Toast: the `progress` part with `--_toast-life`, recreated per version;
  React's swipe from `internal/toast-swipe.ts` (`swipe.ts`), closing through
  `store.dismiss`.
- Dialog: `dialog-refuse` on a backdrop press or Escape when `dismissible`
  is false, the same frames, `duration.roll`, `ease.out`, id
  `ds-motion:dialog-refuse`, RTL sign flip, a second refusal cancels the
  first.

**Feedback and navigation** (alert, banner, callout, error-state, skeleton,
progress-bar, progress-circle, meter, spinner, status-dot,
segmented-control, toggle-group, stepper).
- `internal/nav-ink.ts`, a copy of React's `Tabs/ink.ts`: the `label-ink`
  twins for SegmentedControl and ToggleGroup; the label dip removed.
- Stepper `drawCheck`; ProgressCircle `arc` svg (the turn removed);
  `haloBurst` for both progress components; Meter `landValue` and the
  inline transition on the reveal tokens; Skeleton `wipeAway`, full mode
  only; `placeOf` records the next sibling so the ghost lands where React's
  does.

**Lead.**
- The review B1 change in `fadeAway` and `dismissWithExit`.
- The `/interactions` page registers two new stage files, `toggles.ts` and
  `sliders.ts`, after the older ones, so the round 3 stages win. New stages:
  button-glow, button-result, copy-bubble, switch-drag, check-mixed,
  slider-fill, slider-rubber-band, rating-preview, highlight-marker,
  check-draw-pick, combobox-results, toast-expand, toast-timer, toast-swipe,
  dialog-refuse, inline-edit-morph; every other stage updated to React's copy
  and regions. The `menu-row-slide` stage removed (React's is Menubar only,
  and a DropdownMenu with a marker no longer slides); the `row-glide` stage
  removed (List only).
- Dead round 2 code removed: `internal/motion-actions.ts` (the old toggle
  pop) and `watchStackShift`, `shiftToast` (React deleted `stackShift.ts`).
- Stale specs brought to round 3: the angular-2 recheck of Checkbox B1 (the
  mark replaces the icon), the Fieldset error enter (`emerge`), and a bare
  `<button>` in the new toaster spec (the button gate).

## 3. Timing: React against Angular

Neutral. Sampled with `getAnimations()` in both galleries on
`/interactions?focus=<id>&style=neutral`, with
`docs/reports/shots/angular-motion/sample-timing.mjs` for press triggers and
per family Playwright drivers for hover, drag, keys, swipe and focus (CSS
animations and transitions kept where they carry the beat). Snappy, soft and
bouncy are the spring `linear()` eases; 158 ms is `duration.spring-snappy`
in Neutral.

| Interaction | Animations (property, duration, delay, ease) | Same |
| --- | --- | --- |
| button-glow | `::before` opacity 180 ms ease out | yes |
| button-loading | root transform 158 ms spring; label out 100 ms ease in, back 200 ms after 24 ms spring; spinner in 200 ms after 24 ms, out 100 ms, spin 800 ms linear | yes |
| button-result | path dashoffset 180 ms after 24 ms ease out; result opacity transform 100 ms; label back 158 ms spring | yes, one extra Angular label transition, see below |
| copy-swap | icon color 180 ms; glyph clip-path 100 ms out, 180 ms after 24 ms in; words 158 ms after 24 ms spring; check pop 200 ms after 24 ms | yes |
| copy-bubble | bubble opacity transform 158 ms after 24 ms spring; exit 150 and 180 ms | yes |
| button-nudge, close-turn, split-chevron, fab-morph, link-underline | CSS transitions, 158 to 200 ms springs, 180 ms colors and clip-paths | yes |
| toggle-pop | state layer clip-path opacity 180 ms, `cubic-bezier(0, 0, 0.58, 1)` | yes |
| switch-stretch, switch-drag, check-draw, check-mixed, radio-pop, radio-card-lift | CSS only on equal DOM; switch-drag driven: `data-dragging` past the slop, rubber band to 1.12, snap on release | yes |
| field-error-enter | error clip-path opacity transform 200 ms soft; icon 200 ms after 24 ms bouncy; input shake 200 ms ease out | yes |
| password-reveal | two clip-path 180 ms `cubic-bezier(0.4, 0, 0.2, 1)`; input opacity 150 ms | yes |
| inline-edit-morph | out 180 ms exit ease; in 200 ms bouncy; cancel 200 ms after 24 ms | yes |
| form-submit-success | button transform 200 ms; mark land 200 ms, ring draw 180 ms, tick 180 ms after 100 ms (CSS) | yes |
| wizard-done | the mark land and draws, driven to done by script | yes |
| slider-fill | thumb wrapper transform 158 ms snappy (composite add); track `::before` clip-path 158 ms snappy | yes |
| slider-nudge | clip-path 158 ms snappy, then 200 ms bouncy; thumb 200 ms bouncy | yes |
| slider-rubber-band | clip-path 200 ms bouncy on release | yes |
| slider-bubble | digit roll 158 ms snappy, 24 ms stagger | yes |
| rating-fill | dips 200 ms ease out at 0 and 12 ms; lands 158 ms snappy at 24 and 36 ms, 200 ms bouncy at 48 ms | yes |
| rating-preview | fill clip-path 150 ms ease out at 0, 24, 48, 72 ms; icon dip 200 ms at 72 ms | yes |
| highlight-marker | marker transform 158 ms snappy, opacity 80 ms ease out; menu in 158 ms; rows 200 ms, 24 ms steps | yes |
| menu-origin, menu-submenu-nudge | `ds-menu-in` 158 ms clip-path opacity transform; `ds-menu-out` 100 ms on the inert copy | yes |
| check-draw-pick | stroke dash 158 ms ease out; svg pop 200 ms bouncy | yes |
| picker-value-roll | value clip-path transform 158 ms; inert copy 100 ms exit ease | yes |
| combobox-results | moves 158 ms snappy; pops 200 ms at 0 and 24 ms | same specs, counts differ, see below |
| chip-check-pop | drawn check, label slide 158 ms, moves | yes, React adds one move, see below |
| toast-enter | `ds-toast-in` 200 ms; icon pop 200 ms after 24 ms; clip-path 158 ms snappy | yes |
| toast-stack, toast-expand | transform and clip-path 158 ms snappy on every toast | yes |
| toast-timer | `ds-toast-progress` 4000 or 6000 ms linear, paused on hover | yes |
| toast-swipe | rubber band; cancel transform 158 ms; close `ds-toast-swipe-out` 150 ms | yes |
| dialog-refuse | panel WAAPI 300 ms `cubic-bezier(0, 0, 0.58, 1)`, five frames; a second press keeps one | yes |
| tab-slide | pill transform 158 ms snappy; ink clip-path 158 ms snappy; label color 158 ms | no, React's ToggleGroup still dips, see below |
| stepper-travel | ring 158 ms snappy; pop 200 ms bouncy; check dasharray dashoffset 200 ms ease out | yes |
| alert-dismiss | ghost opacity transform 100 ms exit ease; neighbours 158 ms snappy | yes |
| skeleton-swap | clip-path 180 ms reveal ease | yes |
| progress-spring, progress-celebrate | digit roll 158 ms snappy; pop and halo | yes |
| meter-fill | color transform 200 ms after 384 ms bouncy | yes |

What differs, and why:

- **tab-slide.** React's ToggleGroup still plays the round 2 label dip
  (200 ms ease out): its track keeps the label, so `followIndicator` calls
  `answerLabels`. Round 3 removed the dip; Angular follows the round, not
  the bug. SegmentedControl is equal.
- **button-result.** When loading ends straight into a result, Angular also
  runs one 100 ms label transition. React's `withLeaving` changes the
  fragment shape when the leaving spinner appears, which remounts every part
  and drops that transition. The label is at opacity 0 throughout, so
  nothing shows.
- **combobox-results.** Same durations and eases; React plays more moves
  (36 against 25 in one query) because it runs on every commit and renders
  more often.
- **chip-check-pop.** React's FLIP also moves the clear button, which does
  not move.
- **check-draw-pick.** Angular also shows one 80 ms background color
  transition on the marker (hover color to lit color), from when the style
  flush lands. Not visible as motion.
- **toast and dialog Escape.** Escape closes React's AlertDialog; the
  Angular stage uses a `dismissible="false"` Dialog (there is no Angular
  AlertDialog), where Escape refuses.

## 4. Contract, DOM and screenshot results

**`npm run check`**: 13 of 13 steps pass on the final tree (vitest 2457
tests, Angular 750 tests).

**Contract suite**, full Angular run against the gallery on 5302:
58 components pass, 0 fail, Theme skipped as before; 2278 tests passed,
0 failed, 69 skipped (the usual skips: Theme, TagField keyboard checks,
Skeleton, Spinner, StatusDot). Per component lines:
`docs/reports/shots/angular-sync-3/contract-summary.txt`; JSON:
`docs/reports/contract-angular.json`. During the family runs four tests
failed once with "execution context destroyed" or `ERR_ABORTED` while the
shared dev server rebuilt for another agent's save; each passed on rerun
and the full run had none.

**DOM** (`dom-after/`): 0 lines for 55 of the 57 components with a demo.
What remains:

- FilterBar, 82 lines: React's rows, count and more button keep
  `style="transform-origin: 50% 50%"`, left by a FLIP that React's
  `useFlipGroup` plays on its second commit while mounting, which breaks "a
  first paint plays nothing". Angular plays nothing on first paint.
- Meter, 46 lines: React keeps the inline
  `transition: transform var(--_meter-reveal-duration) ...` for good, because
  in the dev build the StrictMode cleanup of `useFillOnView` clears the
  timer that drops it. Angular drops it after the reveal, as the code
  intends.
- TitleBar, WindowControls: no Angular demo route (as before); their
  window-lights stage DOM is equal.

Open states compared by the families: toaster with three toasts, mixed
tones and hovered: 0; every open picker and menu: 0; copy, bubble, glow,
ripple, result, split and FAB menus: equal; mid tab slide, completed step,
celebrated progress, dismissing alert: 0. The open Dialog layer keeps two
lines from before this order: React's panel and backdrop carry Radix's
`pointer-events: auto`, and the Angular panel has `aria-modal="true"`
(angular-motion lead change 5).

**Screenshots**: see section 4a.

## 5. Not ported, and why

- No Angular component: Tabs (ink), Sheet and Drawer (`handle-bar`, rubber
  band, `sheet-spring`), AlertDialog (its refusal; the Dialog form is
  ported), Chip (chip-check-pop plays on FilterBar's stand-in chip), List
  (row-glide, list-stagger, the List parts of collection-flip), Menubar and
  ContextMenu (menu-row-slide), Popover, HoverCard, Tooltip, Card, Tile,
  Accordion, Navbar, Sidebar, Rail, TableOfContents, TabBar, Pagination,
  Avatar, SplitView, CommandPalette, Lightbox, Tour, Window. Their
  `/interactions` cards say the component is not ported.
- No `alert-dismiss` wipe: React's ghost still shrinks.

## 6. Changes needed from the lead

1. **Move the framework free copies into `packages/motion` or
   `packages/shared`**, so React and Angular import one copy:
   - `internal/toggles-switch-drag.ts` (React `Switch/drag.ts`) and
     `internal/toggles-motion.ts` (`toggleLayerSpec`).
   - `internal/motion-fields.ts`: `emerge`, `fadeOutBeat`, `diagonalWipe`
     (React `Input/fieldMotion.ts`).
   - `internal/slider-fill.ts` (`rubberBand`, `KEY_BUMP`, `SLIDER_FILL`,
     `fillClip`, the glide, from `Slider.tsx`).
   - `internal/selection-marker.ts` (React `ListBox/highlightMarker.tsx`)
     and `rollValue` in `select.ts`.
   - `internal/toast-stack.ts` and `internal/toast-swipe.ts` (React
     `Toast/stack.ts`, `swipe.ts`).
   - `internal/nav-ink.ts` (React `Tabs/ink.ts`), `haloBurst`, `drawCheck`,
     `landValue`, `wipeAway`.
2. **React ToggleGroup** (`ToggleGroup.tsx`): the label still dips on
   tab-slide. Pass the label outside the track, so `followIndicator` does not
   call `answerLabels` with it.
3. **React Meter** (`Meter.tsx`, `useFillOnView`): the StrictMode cleanup
   clears the timer, so the inline transition stays in dev.
4. **React FilterBar** (`useFlipGroup`): a FLIP plays on mount.
5. **React ButtonBase** (`withLeaving`): return the same fragment shape in
   both branches (`<>{parts}{spinnerLeaving && <span data-part="spinner"
   aria-hidden="true" />}</>`) so the parts are not remounted when the
   spinner leaves.
6. **Dialog**: decide on the Angular panel's `aria-modal` and on mirroring
   Radix's `pointer-events: auto` (carried over from angular-motion).
7. **The Angular focus stage has no zoom.** React's `/interactions?focus=`
   fits the stage up to 2.5x; Angular's does not, so subpixel widths differ
   in recordings (a ripple at 16 against 17 px, a row at 244 against 245 px).
   A port of React's fit into `page.ts` is a small follow up.
8. **`sample-timing.mjs`** writes into the tracked
   `docs/reports/shots/angular-motion/timing.{md,json}` and samples Web
   Animations only. An output folder flag and a flag to keep CSS animations
   would let lanes use it as is (the agents restored the tracked files after
   each run).
9. **`dom-diff.mjs`** cannot load TitleBar and WindowControls: an Angular
   `/c/` demo for both would close that gap.
10. **Generated files**: `npm run gen` was run by `npm run check`; the new
    exports in `button/index.ts`, `input/index.ts` and `toast/index.ts` are
    in the hand written folder barrels, so the package barrel did not change.
11. **`docs/reports/interactions-3.md`** is on `claude/ds-order-1-23` only;
    STATE says it is still to come on the lead branch.
