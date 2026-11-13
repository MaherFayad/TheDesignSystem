# Order 1.29, lane fields and feedback

Fix round 1 of 3 after the round 3 interaction review
(`docs/reports/reviews/interactions-3.md`). React, the shared CSS, the
motion helpers and registry rows of this lane. Gallery on port 5184. Every
probe is a Playwright script in this folder with its JSON beside it
(`<name>.before.json` on the old code, `<name>.json` on the new).

## Blocker

### B6: the floating label is hidden under the control box (WCAG 3.3.2)

- Cause: `order: -1` drew the label first, under the positioned Input box;
  the rest place used `size.control.md` and `space.m` at every size and on
  every platform; a recipe (Desk md is 34px, `packages/styles/desk/recipes/Density.css`)
  could change the box again.
- Fix, `Field.css`: the floating field isolates (`isolation: isolate`) and
  the label is raised (`position: relative; z-index: var(--ds-z-raised)`);
  `order: -1` stays for the layout only. The box and inset follow the
  control: CSS defaults per size (`:has([data-ds='input'][data-size='sm'|'lg'])`),
  per platform (`ios.css` new rule; `android.css` keeps its rule), and the
  border width is part of the inset. `placeFloatingLabel` (new, in
  `helpers/field-motion.ts`) reads the real box height and text inset from
  the control and writes `--_field-float-box` and `--_field-float-inset`
  inline, on each render and on resize, so a recipe or a density keeps the
  label centred.
- Test: `probe-floating-label.mjs`, 4 styles x web, ios, android x LTR,
  RTL x sm, md, lg (72 cases): elementFromPoint at the label centre (its
  pointer-events lifted for the test) returns the label, a screenshot of its
  box differs with the label shown and hidden, and its centre is within 1px
  of the box centre.
  - Before (`floating-label.before.json`): 0 of 72 pass; the hit is the
    input in every case, the label paints nothing in Neutral and Liquid,
    off centre up to 13.8px (lg) and 8.3px (iOS).
  - After (`floating-label.json`): 72 of 72; worst centre offset 0.2px,
    worst inline offset to the text start 0.07px.
  - Unit tests: `field-motion.test.ts` "floating label box" (LTR, RTL,
    under a 2.5x zoom, cleared without a control).
- Demos: Field `floating` and `floating-arabic` cases (sm, md, lg, filled,
  invalid); the `field-label-focus` stage now has three empty floating
  fields (sm, md, lg). Input got a `variant` case (outlined, filled, Arabic) for N16.

## Ten weakest

- #4 `field-label-focus` (floating): B6 above. "Studio does not rise" is
  the Studio recipe's lift; not in my files.
- #8 `wizard-step` (N13): `FormWizard.tsx` marks `checking` only when the
  check is still pending two frames after Next (`checkingAfterFrame`), so a
  check that answers at once plays no dip, spinner or label morph.
  `FormWizard.css` drops the body transition and `@starting-style` rise
  (base and both reduced blocks): the WAAPI slide is the one entrance.
  Tests (`FormWizard.test.tsx`): "shows no loading on Next for a check that
  answers within a frame" (failed before: the Next button got
  `data-loading`), "shows the loading on Next once a check is still pending
  after a frame". The Back button now turns aria-disabled one frame later;
  the busy guard still ignores it during the check, and the existing test
  waits for it.

## Notes

- N11 PasswordField: the text comes back from opacity 0.6 (`TEXT_RETURN`,
  duration.base, ease.out), in full and reduced modes. Test: the
  password-reveal case in `PasswordField.motion.test.tsx` asserts the first
  frame is 0.6 or more (failed before: 0).
- N12 no layout jump when a message enters: `FollowGlide` (new,
  `field-motion.ts`). A ResizeObserver runs after layout and before paint;
  what moved gets a transform back to its old place (`composite: add`) and
  glides to the new one over duration.spring-soft. Field watches its own
  following siblings; Form watches all its rows (summary included) and a
  Field directly in a Form leaves it to the Form. Transform only; no layout
  animates. Plays wherever motion is on, also where a style turns the
  message entrance down (it hides a jump); under reduced motion it does not
  play. Probe `probe-message-jump.mjs` reads the first painted frame:
  before 2 of 12 (Neutral 48.2px, Studio error 41.8px, summary 76.6 to
  101.1px), after 12 of 12 (worst 0.6px).
- N14 OTP caret: kept moving from the left in RTL. Decision: the OTP root is
  `dir="ltr"` in every language, so the caret travels left to right; a
  mirrored caret would arrive against its own travel. `OTPField.css`
  comment and the `otp-caret` registry text now say the same thing.
- N15 slider bubble: a slider that shows its value output hides the bubble
  (`:has(> [data-part='value'])`), so it never covers the output; the bubble
  is the readout of a slider without one. On a coarse pointer it rises one
  touch target (at least `size.touch-ios`) clear of the thumb. The
  `slider-bubble` stage now shows two sliders without an output and one
  with. Probe `probe-slider-bubble.mjs` (web, ios, android x mouse, touch):
  before 3 of 12, after 12 of 12 (clearance on touch 66 to 73px).
- N17 Neutral shake: `shakeSwings(ms)` caps the shake at 12 reversals a
  second; `ErrorShaker` reads duration.spring-bouncy and plays 2 swings at
  200ms (Neutral), 4 at 380ms and more. Tests in `field-motion.test.ts`
  "error shake reversal rate" (`shakeSwings` did not exist; the old 4 swings
  at 200ms are 20 a second).
- N18 Desk submit label: not this lane. `probe-submit-label.mjs` shows the
  label does not move after a press when the pointer has rested on Send
  (travel 0px in all four styles). It jumps only when the pointer arrives
  and presses in one frame, as the review sheet did: the Desk hover roll
  (`packages/styles/desk/recipes/Button.css`, the roll label) runs 27px
  under the celebrate pop. No loading state plays (no onSubmit).
- N19 Android focus: the border stays 1dp; the second dp is an inset
  shadow added to `--_input-ring` / `--_textarea-ring` (filled: the bottom
  edge; outlined: all round). Probe `probe-android-focus.mjs` (Input filled
  and outlined, SearchField, Textarea): before 0 of 5 (content moved 1 to
  1.5px, box 1 to 3px), after 5 of 5 (0px, and the indicator still changes).
- N31 off rows: `styleTurnsOff(el, prop)` (new, `field-motion.ts`). Coded
  motion now reads its off row: Skeleton ghost wipe reads
  `--_skeleton-swap` (new, default `wipe`; the row sets `none`);
  ProgressCircle digit roll reads `--_progress-circle-duration` through a
  new `off` argument of `useDigitRoll`; Avatar status ping and pop read
  `--_status-dot-loops` on its status part; the digit layer
  (`digitLayerControl`, NumberField and ScrubInput) reads
  `--_<component>-roll` on its root, and the `scrub-roll` row sets
  `--_scrub-input-roll: none`. Tests in `field-motion.test.ts` "off rows
  reach motion played from code" (the layer test fails with the check
  switched off).
- N33 Meter, and angular-sync-3 section 6 item 3: the hold is
  `data-held` on the indicator (Meter.css draws it empty; print shows the
  value), never an inline transform. On view `data-revealing` carries
  `--_meter-reveal-duration` and `-ease` until the next value change, which
  drops it in a layout effect: no timer, so a longer style reveal is not
  cut and StrictMode leaves nothing behind. Tests `Meter.reveal.test.tsx`
  (3, all failed before) and the updated meter case in
  `Alert/motion.test.tsx`.
- N36 spinner: no change. Decision: under reduced motion (media query and
  `data-motion="reduce"`) the Spinner, the Button spinner and the
  indeterminate ProgressBar and ProgressCircle stop (still ring); without it
  they keep turning (a loading mark is essential while the wait lasts) and
  `pauseLoops()` pauses them for a page with its own pause control. Probe
  `probe-spinner-reduced.mjs`: 60 of 60, no endless loop runs under either
  reduced form in any style. The `spinner-loop` row says so.
- N38 progress-celebrate: the pop and halo wait for the fill to land
  (`landingTime`, reads `--_progress-bar-duration` or
  `--_progress-circle-duration`; 0 under reduced motion). A complete ring
  draws on `--_progress-circle-ease-full` (new, ease.out), so the arc never
  runs past 12 o'clock. Test `feedback.test.ts` "Celebrate waits for the
  fill to land" (delay was 0). No browser probe for the arc gap.
- angular-sync-3 section 6 item 4, FilterBar: the FLIP groups see no items
  until the bar has settled for two frames, then one render records the
  places. Probe `probe-filterbar-mount.mjs`: before 0 of 8 (41 FLIP
  animations on load), after 8 of 8 (none on load, 10 to 13 after a chip press).

## Hooks added (for the styles lane)

| Name | Element | Default | Set by |
| --- | --- | --- | --- |
| `--_field-float-box`, `--_field-float-inset` (existing) | Field root | per size and platform in CSS; measured inline by Field | Field (`placeFloatingLabel`); a recipe that changes Input height or padding may set the CSS default |
| `--_skeleton-swap` | Skeleton root | `wipe` | the `skeleton-swap` off row sets `none` |
| `--_<component>-roll` (read only) | NumberField, ScrubInput root | unset | an off row sets `none` (`scrub-roll` does) |
| `--_progress-circle-ease-full` | ProgressCircle root | `ease.out` | a style that wants another landing curve without overshoot |
| `data-held`, `data-revealing` | Meter indicator | absent | Meter |

## For the Angular parity lane

- Field `floating`: same DOM as React (label after the control,
  `data-floating`, `data-filled`); call `placeFloatingLabel(root)` after
  each render and from a ResizeObserver on the children; remove both
  inline properties on teardown. Also `new FollowGlide().watch(root)` unless
  the parent is `[data-ds="form"]`.
- Input `variant` (`outlined` | `filled`, as `data-variant` only when
  passed). N16: neither prop exists in Angular yet.
- Form: `new FollowGlide().watchChildren(formEl)`.
- FormWizard: set checking only when the check is still pending two
  frames after Next or Send; the body has no CSS entrance any more.
- PasswordField: the text fade starts at 0.6 (same beat as React).
- Meter: `data-held` and `data-revealing` attributes instead of inline
  transform and transition; drop `data-revealing` on the next value change.
- Skeleton, ProgressCircle roll, Avatar status: read the off properties
  with `styleTurnsOff` as above.
- ErrorShaker, digit layer and Celebrate changes are in the shared helpers,
  so Angular has them once it calls them.

## Changes needed from the lead

- Desk density (`packages/styles/desk/recipes/Density.css`) sets the md
  Input to 34px in `ds.recipes`, which comes after `ds.platform`, so on iOS
  and Android a Desk md Input is 34px, not 44pt or 56dp. The floating label
  follows it either way; the platform height is the styles lane's call.
- N18: the Desk hover roll should not start in the same frame as a press,
  or should not run while the button takes the celebrate pop (styles lane).
- Studio `field-label-focus` does not rise (Studio recipe).
- `docs/reports/fixes/interactions-3/submit-label.before.json` was written
  by the first version of the probe (offset from centre, one run); the
  current probe adds the rested pointer run.

## Proof

- Unit tests: all suites of this lane's components and `packages/motion`
  pass (846 tests); `npx tsc --noEmit -p tsconfig.json` is clean.
- Contract, React, each touched component alone: Field, Input,
  PasswordField, FormWizard, Form, Meter, Avatar, Skeleton, ProgressBar,
  ProgressCircle, Stat, FilterBar, Slider, RangeSlider, OTPField, Spinner:
  0 failed. (A RangeSlider keyboard map failure seen while several runs
  shared the machine did not come back alone, with or without Slider.css.)
- `npm run check`: exit 1, none in this lane's files. Lint gates fail on
  `Switch.css:387,463` (translate transition), `Sheet.tsx:389` (bare
  button), `Dialog.css:605` (raw z-index); tests fail in ToggleButton and
  ToggleGroup (new parts), CommandPalette (announcement); five timeouts
  under load (cli main, no-tailwind, no-native-title, PhoneField demo,
  Sidebar title).

## Not done

- No probe for the ring gap at 12 o'clock (CSS and unit test only).
- The bubble of a slider without a value output can still cover its label
  while held (`showValue={false}` with a label).
- `FollowGlide` starts a second glide from an estimate of the first one's
  place (linear in its progress), so a quick second message can nudge a
  pixel or two.
