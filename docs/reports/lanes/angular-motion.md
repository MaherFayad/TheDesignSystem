# Lane report: Angular motion (orders 1.21 and 1.22 in Angular)

Agent: ds-angular, as lead of this lane, with six family agents and one
review agent (each claude-opus-5-5 at medium). Branch
`claude/ds-angular-motion`, cut from `claude/relaxed-hypatia-7gseap`.
Changes are in `packages/angular/src/**` and `apps/gallery-angular` only,
with two exceptions named under "Changes needed from the lead": the CLI
snapshot and the committed proof files under `docs/reports`. No CSS, React,
`packages/motion` or `packages/shared` file was touched. No dependency was
added.

Commits: `a-motion: merge cleanup`, `a-motion: motion player and the
interactions page`, `a-motion: getAnimations sampler for both galleries`,
`a-motion: recheck of the angular-2 blockers`, four
`a-motion: checkpoint ...` commits (work in progress saved while the family
agents ran; each later commit finishes it), `a-motion: actions, form parts,
feedback, overlays and navigation`, `a-motion: input controls family and the
CLI snapshot`, `a-motion: slider bubble rolls on a quick click`,
`a-motion: getAnimations timing of every code driven interaction`,
`a-motion: full Angular contract run`, and this report.

## 1. Merge cleanup

Compared `efb3a6b` (interaction round 2, inputs) with the tree the lead kept
(Angular fix round 2) for `form.ts`, `form-context.ts`, `angular-forms.ts`
and `consent-field.ts`.

- The fix round side is a superset everywhere but one place. Every test of
  `efb3a6b` is in the tree (its `form-copy.spec.ts` was kept whole); the
  fix round adds more. `requiredError` stays a string, as React's.
  `requiredChoice` for `requiredTrue` is covered by the fix round's
  `requiredFor(path)`, which picks the copy from the control's role.
- What was dropped: the "meta has no date" warning for a consent that starts
  given through `checked` (React N16), and one helper for both warnings. The
  lead's hand written `writeValue` warning was a second copy with its own
  wording.
- Now: one `warnStartedGranted(started, source)` in `consent-field.ts` for
  the `checked` input (in `ngOnInit`) and for the first FormControl value (in
  `writeValue`). Both say React's two messages, with the source named:
  "checked starts true with no meta" or "... and meta has no date",
  "FormControl starts true ...". A value a form wrote first is checked only
  once, under its own name.
- Tests: the WarnHost spec gains a "meta has no date" case; `form-copy.spec`
  now asserts exactly one warning for a FormControl that starts true, and a
  new case for a FormControl with an undated meta.

## 2. Recheck of the angular-2 blockers

A review agent reproduced each blocker as a reviewer would, in one new spec
file, `packages/angular/src/internal/recheck-angular-2.spec.ts`, one test per
blocker named after its id. Each test was first run against the reviewed
commit `6fabe3c` in a temporary worktree: all 19 failed there, each on the
blocker itself (`channels=on`, no `click` on the hidden radio, touched
`true`, the collapsed selection `[3,3]`, and so on). All 19 pass on this
tree.

The review says "twenty blockers", but its verdict table and its sections
list 19: Checkbox B1, CheckboxGroup B1, RadioGroup B1, RadioCard B1,
Rating B1, Select B1 and B2, MultiSelect B1, Fieldset B1, Form B1 to B5,
ConsentField B1 to B3, FilterBar B1 (in DropdownMenu), NumberField B1. Every
one is fixed; no source change was needed. The Form B2 test also covers
precedence: a custom validator for `postal` wins over the pattern copy, as
React's `checkAll`.

Found in passing, not a defect: Angular Select treats a list of empty groups
as empty (`select.ts`, `flattenListBoxItems`), React counts top level entries
(`Select.tsx`, `options.length === 0`), so React would open on empty groups.
Angular is the more correct one (lead change 6).

## 3. Angular motion

### The player

`packages/angular/src/internal/motion.ts`, `injectMotion()`: the twin of
React's `useMotion`. It reads `motionPreset` from the nearest `dsTheme` and
gives `mode(id)` and `play(el, pattern, id, input)`. Reduced motion is read
at play time, from `prefers-reduced-motion` and from `data-motion="reduce"`
on `<html>`, so it behaves as React. Every port calls the same
`@the-system/motion` function with React's arguments: catalog patterns
through `play`, the primitives (`buttonMorph`, `iconMorph`, `rollDigits`,
`renderDigits`, `flipPlay`, `flipExit`, `staggerGroup`) with
`mode: motion.mode(id)`. Ports play from `effect`, `afterRenderEffect`,
`afterNextRender` with an injector, DOM events, or observers; none waits on
`transitionend` or `animationend` (`settled()` where a step follows), and
none depends on zone timing. Spec: `internal/motion.spec.ts` (preset per
style, style change, `data-motion`, `prefers-reduced-motion`, a style that
turns an interaction off).

### The /interactions page

`apps/gallery-angular/src/app/interactions/page.ts`, routed at
`/interactions` with a link in the shell, as React. Same DOM hooks as
React's page: `data-gallery="interactions"`, a reduced motion switch that
sets `data-motion="reduce"` on `<html>`, "Replay every stage", a card per
registry row (`article[data-interaction]`) with its own Replay that mounts
the stage again and presses its `[data-interaction-trigger]`, the beats, the
styles and the reduced form. `?focus=<id>` shows one stage, centred and
large, with the pointer dot, for recordings. The style recipes from
`interactionRecipes` are injected while the page is open, and
`interactions.css` is read from the React gallery by path, byte for byte,
as the other gallery CSS. Stages live in one file per family
(`actions.ts`, `inputs.ts`, `inputs-forms.ts`, `selection.ts`,
`overlays.ts`, `navigation.ts`, `feedback.ts`), with React's copy and
triggers. A row whose components have no Angular port says so on its card.

### What changed, per family

Each family agent owned its component folders and its stage file; each port
has a spec that records `el.animate` and replays React's call on the same
parts, plus a reduced case.

**Actions** (button, icon-button, floating-action-button, split-button,
button-group, copy-button, toggle-button, close-button, switch).
- button-loading: `buttonMorph({ root, label, spinner }, ...)` on a
  `loading` change, as React; the leaving aria-hidden
  `span[data-part="spinner"]` is kept for the exit and removed after
  `settled()`; no morph on first paint. Button, IconButton, FAB, SplitButton.
- copy-swap: `buttonMorph` with the leaving icon in an unnamed aria-hidden
  span, removed after `settled()`.
- toggle-pop: `toggleLandSpec(on, i)` per part on a press, full mode only.
- button-press: a gap closed. The round 2 lane report said Angular already
  pressed on Enter; it did not. `button-base.ts` now plays the press on Enter
  down and releases it on up or blur, for React's component list and inert
  check.
- switch-stretch: hook added, the track's first child
  `<span aria-hidden="true"></span>`.
- CSS proven: segment-press, button-nudge, close-turn, split-chevron,
  fab-morph, link-underline (stage only).

**Inputs, controls** (input, password-field, search-field, otp-field,
number-field, scrub-input; textarea, input-group, phone-field, label need
nothing).
- error-shake: `errorShake()` for Input, PasswordField, OTPField and
  NumberField (React's `shakeBeat`); an Input that is the control part of
  another field leaves the shake to that field's box, as React.
- password-reveal: `iconMorph` with the turn, the leaving glyph in an
  unnamed aria-hidden span in the toggle icon, the fade on the input.
- search-clear (`iconMorph` in, an inert copy out), search-submit (dip and
  turn), otp-fill (`landPop` per cell, a run spread over two stagger steps),
  otp-complete (the wave).
- field-step and scrub-roll: the empty aria-hidden layer span after the
  input (hook added; NumberField and ScrubInput were 80 DOM lines off without
  it) and a port of `useDigitLayer`. Arrows, PageUp, PageDown and the
  steppers roll; Home, End and typing do not, as React.
- CSS proven: focus-glow, field-label-focus, otp-caret, the scrub handle
  lift.

**Inputs, form parts** (field, field-error, fieldset, form, form-wizard,
consent-field, rating).
- field-message-enter (`DsFieldDescription`) and field-error-enter
  (`DsFieldError`, so Field, FormField, Fieldset and ConsentField): a
  `settled` flag on `DsFieldContext`, React's ref, set after the first
  render; a message that arrives later slides in, the error icon pops one
  stagger step later. A FieldError used alone never animates: in Angular the
  caller's `@if` creates it, so there is no "turned on after first paint".
- form-summary-enter (`staggerGroup(rows, { from: 'inline', mode })`),
  form-submit-success, wizard-step (with `wizard-step-out` and
  `wizard-step-check`), wizard-done, consent-check, rating-fill.
- CSS proven: rating-preview.

**Selection** (checkbox, checkbox-group, radio-group, radio-card, slider,
range-slider, list-box, select, combobox, autocomplete, multi-select,
tag-field, filter-bar).
- slider-bubble: a bubble span in each thumb, `renderDigits` at rest,
  `rollDigits` while a pointer holds the slider, at most one roll per 120 ms.
  The lead fixed one gap the sampler found: a quick click let go before the
  render effect ran, so the roll was written still; the change now
  remembers it came from a held pointer (spec "a quick click on the track
  rolls", which fails without the fix).
- slider-nudge (shake on the thumb), menu-rows (`openStaggered` for Select,
  Combobox, Autocomplete, MultiSelect, TagField), picker-value-roll (Select,
  never on first paint), row-glide (a fill span as the first child of each
  ListBox option and Select item, a MutationObserver on `data-highlighted`,
  `flipPlay` from the old layer box), collection-flip (TagField, MultiSelect,
  FilterBar; TagField tags are now tracked by text, as React keys them),
  chip-check-pop (FilterBar's chip), filter-count-roll (the count as a
  visually hidden span plus an aria-hidden roll span).
- Hooks added: CheckboxGroup select all writes `--_checkbox-step` 1, 2, 3, 3
  (cleared on a single toggle); the RadioCard dot span. The Checkbox draw
  span was already in place.
- CSS proven: check-draw, radio-pop, radio-card-lift, slider-pull,
  picker-chevron-turn.

**Overlays and navigation** (dropdown-menu, dialog, title-bar,
window-controls, segmented-control, toggle-group, stepper, link).
- `internal/indicator.ts`: the framework free part of React's
  `internal/indicator.ts` with Angular wiring (`activated`, `hoverFollow`).
- menu-row-slide: the `::after` slide on `focusin` and `focusout` of the
  menu layer (React's `slideHighlight`); SplitButton and FilterBar menus get
  it too.
- tab-slide: SegmentedControl moves from the round 1 `tab-indicator` to the
  round 2 slide with the label dip and pop; ToggleGroup (single) gains the
  hook, an empty aria-hidden span first in each item, and follows the value.
  ToggleGroup was 96 DOM lines off without it.
- stepper-travel: the ring on the indicator `::after` travels and fades as
  it lands, the new current indicator pops.
- CSS proven: menu-origin (with the RTL origin), menu-submenu-nudge,
  dialog-spring, window-lights, the Stepper connector spring.

**Feedback** (alert, banner, callout, error-state, toast, notification-center,
progress-bar, progress-circle, meter, skeleton, spinner, status-dot).
- alert-dismiss (Alert, Banner: the exit ghost with `flipExit`, neighbours
  `flipPlay`), toast-stack (`watchStackShift` and `shiftToast` in the
  toaster layer), notification-change (FLIP list, unread roll, count pop;
  hook added: the count as React's hidden copy plus an aria-hidden number
  span), progress-celebrate (bar on the block axis, ring on both),
  progress-spring for the ring (`progress-sweep` turn and value roll),
  meter-fill (inline hold, then an IntersectionObserver or an immediate
  fill), skeleton-swap (the ghost fade through the host `animate.leave`
  handler: the one Angular hook where the node is still in the document).
- CSS proven: alert-entrance, error-state-details, toast-enter, toast-swipe,
  spinner-loop, progress-spring for the bar, state-illustration (ErrorState),
  status-pulse (StatusDot).

### A test leak fixed

The Stepper, SegmentedControl and ToggleGroup specs restored their stubs of
`animate`, `getAnimations` and `getBoundingClientRect` by assignment, which
left own properties on `HTMLElement.prototype` that hid later stubs on
`Element.prototype`: motion specs failed by run order (7 to 19 a run). They
now restore by descriptor, and every new recorder stubs and restores
`Element`, `HTMLElement` and `SVGElement` together.

## 4. Proof

- **Unit tests.** One motion spec or more per port (40 new spec
  files), each asserting React's arguments and a reduced case. The full
  Angular suite: 102 files, 674 tests, green, run several times in full.
- **`npm run check`:** every step pass (tokens build, gen, typecheck,
  eslint, manifests, vitest, Angular, native, docs, gallery-angular,
  gallery-native, both consumers).
- **Contract suite, full Angular run** against the gallery on port 5302:
  1777 passed, 54 skipped (the same skips as before: Theme, TagField's
  keyboard checks, Skeleton, Spinner, StatusDot and the like), 2 failed.
  Both failures were `page.goto` aborted while the dev server reloaded on an
  edit made during the run (ListBox keyboard map, MultiSelect axe desk light
  ar rtl). A rerun of both components: ListBox 29 passed, MultiSelect 44
  passed. Per component lines: `docs/reports/shots/angular-motion/contract-summary.txt`;
  the JSON of the full run: `docs/reports/contract-angular.json`.
- **DOM.** `compare-dom.mjs` on `/c/<kebab>?chrome=0`, React 5301 against
  Angular 5302: 0 lines for every component the lane touched, with two
  explained differences: FilterBar carries `style="transform-origin: 50%
  50%"` on fewer elements than React (finished FLIP moves leave it; React
  runs its FLIP on every render, so more elements carry it); Combobox has the
  same leftover on its loading icon button. The fix round's earlier
  Form, NumberField and OTPField shake differences are gone: the shake now
  plays in Angular.
- **Timing.** `docs/reports/shots/angular-motion/sample-timing.mjs` opens
  `/interactions?focus=<id>&style=neutral` in both galleries, presses the
  stage trigger and reads `document.getAnimations()` every frame for 1.5 s.
  Full table: `docs/reports/shots/angular-motion/timing.md` (raw:
  `timing.json`). The family agents also sampled Desk, Studio and reduced
  motion with their own drivers (hover, focus and keys the press only
  sampler cannot do).
- **Pixels.** See section 6.

## 5. React against Angular timing

Neutral, Web Animations started by script (CSS transitions are the shared
CSS and the same by construction). Snappy, soft and bouncy are the spring
`linear()` eases of the tokens. Every row is the same set of animations in
both galleries, by target part, keyframe properties, duration, delay and
easing, unless the row says otherwise.

| Interaction | Animations (property, duration, delay, ease) | Same |
| --- | --- | --- |
| button-loading | label out opacity transform 100 ms exit ease; spinner in opacity transform 220 ms after 24 ms bouncy; root transform 180 ms snappy; label back 220 ms after 24 ms soft | yes |
| copy-swap | old glyph out 100 ms exit ease; check in 220 ms after 24 ms bouncy; swell transform 220 ms ease out | yes |
| toggle-pop | parts transform 220 ms ease out, 0 and 24 ms | yes |
| error-shake | transform 220 ms ease out (six frames) | yes |
| field-message-enter | opacity transform 220 ms soft | yes |
| field-error-enter | error 220 ms soft; icon 220 ms after 24 ms bouncy; a third transform 220 ms ease out | yes |
| password-reveal | glyph out 200 ms exit ease; glyph in 220 ms bouncy; text opacity 150 ms | yes |
| search-clear | copy out opacity transform 200 ms exit ease | yes |
| search-submit | transform 220 ms ease out | yes |
| otp-fill | opacity transform 180 ms snappy, 0 to 48 ms by cell | yes |
| otp-complete | opacity transform 220 ms bouncy | yes |
| field-step | opacity transform 180 ms snappy | yes |
| scrub-roll | opacity transform 180 ms snappy | yes |
| form-summary-enter | rows 220 ms soft and bouncy, 0 and 24 ms; status opacity 150 ms | yes |
| form-submit-success | transform 220 ms ease out | yes |
| wizard-step | copy out 100 ms; body 220 ms soft; check 220 ms bouncy; Angular adds the Stepper ring 180 ms snappy, React adds the Next button loading morph | no, explained below |
| consent-check | transform 220 ms bouncy | yes |
| rating-fill | opacity transform 180 ms snappy, 0 and 24 ms; 220 ms after 48 ms bouncy | yes |
| slider-bubble | opacity transform 180 ms snappy, 0, 24, 48 ms | yes, after the fix |
| slider-nudge | opacity transform 180 ms snappy | yes, after the fix |
| menu-rows | opacity 150 ms ease out (Neutral plays the reduced form) | yes |
| picker-value-roll | opacity 150 ms ease out | yes |
| filter-count-roll | chip 220 ms bouncy; moves 180 ms snappy; digits 180 ms snappy, 0 to 120 ms | yes but one: React also moves the clear button |
| tab-slide | pill transform 180 ms snappy; labels 220 ms ease out and bouncy | yes on SegmentedControl and ToggleGroup; React's stage also has Tabs |
| stepper-travel | ring opacity transform 180 ms snappy; pop transform 220 ms bouncy | yes |
| menu-row-slide | `::after` transform 180 ms snappy (sampled on focus by the family agent) | yes |
| alert-dismiss | ghost opacity transform 100 ms exit ease; neighbours transform 180 ms snappy | yes |
| notification-change | moves 180 ms snappy; new 220 ms bouncy; roll 180 ms snappy; count pop 220 ms ease out | yes |
| progress-celebrate | pop transform 220 ms soft; roll 180 ms snappy | yes |
| toast-stack, meter-fill, row-glide, wizard-done | nothing to sample on a press in either gallery (a toast from the stage's own timer, a fill on view, a hover glide, Neutral does not play wizard-done); the family agents sampled each with its real driver: same in both | yes |

What differs, and why:

- **wizard-step.** Two React quirks, not Angular gaps. React's FormWizard
  sets `checking` before an `await`, so the Next button shows the loading
  morph for a check that ends at once; Angular's check settles before a
  render, so no morph plays, which matches the intent ("the change never
  waits"). React's Stepper ring does not travel in the wizard: the render
  from `setChecking(false)` in `finally` runs the indicator effect again and
  cancels the slide (its own `stepper-travel` stage plays it). Angular plays
  the ring, as the registry row says. Lead change 4.
- **filter-count-roll.** React's FLIP runs on every render, so the clear
  button also gets a move that Angular's, run on a change of the list, does
  not need (it does not move).
- **tab-slide.** React's stage also plays Tabs, which Angular does not have.

## 6. Screenshots

Fresh captures of both galleries, after every port and fix:
`npm run shots -- --framework angular --url http://localhost:5302 --ready --no-verify`
(984 shots), the same for React on 5301 (1782 shots), then
`npm run shots -- --compare react angular`:

- 984 pairs, 984 pass, 0 fail. Every pair has 0 differing pixels (0.000
  percent); there is no difference to explain.
- Only in React: 798, the components Angular does not have. Only in
  Angular: 0.
- Table: `docs/reports/shots/matrix/compare-react-angular/index.md`. The kept
  subsets of both matrix folders are refreshed with these captures.

The matrix runs with animations off and reduced motion, so it proves the new
DOM hooks (the switch track span, the ToggleGroup pill span, the row fill
spans, the RadioCard dot, the digit layers, the bubble spans, the hidden
count copies) draw nothing at rest that React does not. The motion itself is
proven by the timing table in section 5.

## 7. Not ported, and why

- No Angular component yet, so no stage and no port: inline-edit-morph
  (InlineEdit), list-stagger and the List parts of row-glide and
  collection-flip (List), chip-check-pop's Chip stage (Chip; FilterBar's
  stand-in chip plays it), tooltip-follow (Tooltip),
  command-palette-results and command-palette-row-slide (CommandPalette),
  lightbox-zoom (Lightbox), tour-spotlight (Tour), window-settle (Window),
  nav-current-slide and nav-hover-follow (Navbar, Sidebar, Rail,
  Breadcrumbs), pagination-roll (Pagination), sidebar-collapse, toc-travel
  (TableOfContents), language-roll (LanguageSwitch), stat-roll (Stat),
  avatar-status and avatar-group-change (Avatar, AvatarGroup), badge-count
  (Badge), kbd-press (Kbd), and the CSS rows of Accordion, Card, Toolbar,
  Dock, SplitView, EmptyState, ContextMenu, Menubar, AlertDialog and Tabs.
  The /interactions cards of those rows say the component is not ported.
- collection-flip's stage shows TagField with no trigger, because React's
  trigger drives the List.
- state-illustration and status-pulse stages show only ErrorState and
  StatusDot (EmptyState and Avatar are not ported).
- TitleBar and WindowControls have no Angular `/c/` demo, so the DOM was
  compared on the window-lights stage instead.

## 8. Changes needed from the lead

1. **Move the framework free motion helpers into `packages/motion`**, so
   React and Angular import one copy. Today each is copied once into an
   Angular internal file:
   - `react/src/internal/indicator.ts` (all but the three hooks) and
     `DropdownMenu/menuShared.tsx` `slideHighlight`: Angular
     `internal/indicator.ts`, `dropdown-menu/row-slide.ts`.
   - `Input/fieldMotion.ts` (`token`, `Beat`, `playBeat`, `landPop`,
     `dipPop`, `slideIn`, `snapshot`, `leavingCopy`, `dropAfter`, `runStep`),
     `shakeBeat`, `parentBox` and the framework free part of
     `NumberField/useDigitLayer.ts`: Angular `internal/motion-fields.ts`.
   - `ListBox/selectionMotion.ts` (`glide`, `watchGlide`, the
     `useFlipGroup` logic, `ghostOut`, `staggerRows`, `openStaggered`):
     Angular `internal/motion-selection.ts`.
   - `Alert/ghost.ts`, `Toast/stackShift.ts`, `popMark`, the state of
     `Stat/useDigitRoll.ts`, the measure and play of
     `AvatarGroup/useFlipList.ts`, the ring sweep: Angular
     `internal/motion-feedback.ts`.
   - `toggleLandSpec` and the list of parts that pop (ToggleButton.tsx):
     Angular `internal/motion-actions.ts`.
2. **CLI snapshot** (`packages/cli/src/__snapshots__/main.test.ts.snap`,
   outside this lane, updated so `npm run check` stays green): `ds add` for
   an Angular component now also copies `internal/motion.ts` and
   `theme/resolve.ts`, `theme.ts`, `types.ts`, which the motion player pulls
   in. `internal/motion.ts` imports `@the-system/styles/*/motion`: check that
   a consumer app that runs `ds add` resolves it, or have the CLI copy the
   presets.
3. **Lane report correction**: `docs/reports/lanes/interactions-2-actions.md`
   section 6 says Angular `button-base` already played Enter; it did not
   before this lane.
4. **React FormWizard** (see section 5): show the Next loading morph only
   when the check is still running after a frame (or a short delay), and
   keep the Stepper ring from being cancelled by the render after the check
   (for example, skip `followIndicator` when the current step did not
   change).
5. **Angular Dialog panel** has `aria-modal="true"`, React's panel has none
   (`dialog.ts` around line 300). Not motion work; it needs a decision which
   one is right.
6. **Select with only empty groups**: Angular does not open (treats it as
   empty), React opens. Decide which one is right and align React or
   Angular.
7. **The review count**: `docs/reports/reviews/angular-2.md` says twenty
   blockers; its table and sections hold 19.
8. **Lint gate timeouts**: the `no-tailwind` and `no-native-title` gate
   tests hit the 5 s vitest timeout under load (several agents building at
   once) and pass alone. A longer timeout for the gate tests would stop the
   noise.
9. **Ports that would complete the registry in Angular**: Tooltip, Tabs,
   List, Chip, Pagination, Navbar, Sidebar, Rail, Breadcrumbs, Stat, Badge,
   Avatar, AvatarGroup, InlineEdit, CommandPalette, Lightbox, Tour, Window,
   Kbd. FilterBar's stand-in chip should become the Chip port when it lands.
