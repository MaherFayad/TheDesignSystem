# Reset follow ups

Things an order found outside its own files. Each names the order that
should pick it up.

## From R0.2 (Slider reflow)

1. A thumb pulled past the track end still widens a phone page for a moment
   (412 to as much as 426 wide on the Pixel viewport), and the emulated phone
   stays zoomed out after release. Limit the pull to the control box or
   replace the travel with a squash. Pick up in R3 (the `slider-rubber-band`
   pattern) and verify in R4 on the phone demo.
2. The motion catalog text for `slider-rubber-band` and `slider-nudge`
   (`packages/motion/src/interactions/fields.ts`) and the comments in
   `packages/angular/src/components/slider/slider-base.ts` still say the fill
   stretches with the pull. It no longer does. Pick up in R3.

## From R0.6 (CLI snapshot)

1. Gate tests in `packages/lint` time out when several agents share the
   machine. R0.5 owns the fix (timeouts or a faster scan).

## From R0.3 (tab slide long task)

1. **The 50ms target is not met and cannot be met inside ToggleGroup.** The
   change halves the forced style and layout passes (two per tap to one), and
   the pill lands 20 of 20 times. But a press with no pill, slide or ink
   already costs 72 to 83ms of CPU at the median at 4x slowdown. The time is
   in the events after a tap, React's render and commit, the ripple's reads
   on `pointerdown` in `Button/ButtonBase.tsx`, and six to eight style
   recalcs at about 0.5ms per element, which points at the shared CSS.
   New order R0.17 (lead to write, ds-qa to profile first, then
   ds-component): find the per element style cost in `packages/css`, remove
   the forced reads in ButtonBase, and set the press budget for every
   pressable. It must land before R3, because R3 moves press feedback onto
   `pointerdown` and inherits this cost.
2. Rerun the before and after timings on a quiet machine. The other lanes
   held the load at 15 to 26 on 4 cores during every run.

## From R0.5 (gates)

1. **SegmentedControl scrolls sideways by 14px at 320px in Desk, Arabic RTL,
   on web**, in the `many` and `too-many` cases. The widest element is the
   61px indicator (`packages/css/src/components/SegmentedControl.css:126` to
   `137`, from a value the React component writes). Found by the new reflow
   matrix. Order R0.18 (ds-component): fix and prove with the matrix.
2. Autocomplete on Desk `ios` and `android` was skipped by the matrix
   (the demo did not render in 20s under load). Rerun on a quiet machine in
   R0.16.
3. The CSS parse gate uses Lightning CSS from the tree through Vite
   (MPL-2.0, test only, never shipped). Declare it in the root
   `devDependencies` in R0.16.
4. The `macos` reflow runs measure the web layout until R0.10 and R0.14
   land.

## From R0.18 (SegmentedControl reflow)

1. Desk's `packages/styles/desk/recipes/Density.css` button rule reaches
   toggle-button parts inside SegmentedControl and ToggleGroup, because it
   has no `:not([data-part])`. It also overrides `--_button-height` on
   SegmentedControl items. Pick up in R1 (the Desk recipe owner).
2. The `too-many` demo case in an 18rem column on a wide page has items
   spilling out of the track (31px in Desk, 43px in Neutral, 45px in Liquid).
   The phone rule follows the viewport, not the container. Use a container
   query. Pick up in R4.

## From the review of R0 step 1 (`docs/reports/lanes/reset-review-R0-step1.md`)

1. No gate compares the hard coded copies of the layer statement. Add one in
   R0.16.
2. In Desk the thin bar thumb stands about 15px past the end of the fill
   while pulled, with a visible gap. It reads as broken. Decide the pull in
   R1.10 (cap it, drop it, or inset the track), before the owner signs a
   recording. The page widening from the same pull moves to R1.10 and R3.5.
3. `packages/contract-tests/src/contract.spec.ts:594`: a platform mismatch
   only adds a note and passes, and the applied style is never compared.
   After R0.14 lands, make both a failure (R0.16).
4. `docs/reports/lanes/order-R0-5.md:111` cites `reflow-all.json`, which the
   lead removed for its size (3.9 MB). The SegmentedControl finding now rests
   on `docs/reports/reset/R0.18/reflow-before.json`.
5. The reflow matrix covers the dark scheme and default density only. The
   `:dir()` gate compares counts and builds only the React gallery. Widen
   both in R0.16.
6. `tokens.md` line 186 needs per platform density values from R0.13.

## From R0.14 (`macos`)

1. On `macos` the window buttons sit before the title visually but after it
   in tab order. `Window.tsx` should render them first on `macos`. Pick up
   in R4 (the desktop form work).
2. Sheets with detents on `macos` keep a bottom edge detent transform. Pick
   up in R4.
3. Not built yet for `macos`: unified toolbar, table, outline view, settings
   window, alert action layout, toast placement, key and non key window
   looks. R4 scope.

## From R0.11 (docs platform detection)

1. A code tab label in Desk dark reads 3.98 to 4.24:1 when it scrolls under
   the sticky Desk dark glass top bar of the docs site. It belongs with
   ruling 18 (the Desk dark glass recheck) in R1.
2. The docs top bar under safe areas is R4.3.

## From R0.8 (perception gate)

1. Rerun the baseline on a quiet machine before R3 starts (R0.16).
2. In Chromium's touch emulation `:active` arrives only at release, so "the
   press starts when the finger lifts" may be partly an artefact of
   emulation. The owner's device check and a WebKit run must settle it
   before R3 fixes its press timing design.
3. CopyButton's press shows no drawn shrink although its transition starts.
   R3 owner to look.
4. Add a hold step to the compare harness (`holdPointer` is ready). R0.16 or
   the first R1 order that needs press states.
5. Measure the quiet source numbers on the running sources instead of
   reading them from CSS. R1.4 and R1.10.

## From R0.12 and R0.4 (Angular)

1. **OTPField scrolls sideways at 320px on `ios` and `android`, in every
   style, in React and Angular** (14 cases). The R0.5 matrix passed it, so
   it arrived with the platform token layer or the shape split. Order R0.20
   (ds-component): find the cause and fix it.
2. The Angular gallery defines `ds-stage-radio-pop` and other stage
   components twice (`interactions/toggles.ts` and `selection.ts`), which
   prints NG0912 60 times per page load. Pick up in R3.10.

## From R0.15 (shape split)

1. **A Desk sheet on a phone has no visible close control** now that the
   window lights are hidden there. It still closes by Escape, the scrim and
   the grabber. Add a close button on phones. R4.8, first item.
2. Liquid's tab bar item on `android` paints its lens as a round shape of
   about 79 by 88 where the platform's pill is 64 by 32. The fix is in
   Liquid's recipe. R4.7.
3. Other controls in the `ios` and `android` files (FAB, Input, Select,
   SegmentedControl, Chip, menus) still take a corner from style tokens in
   `ds.platform`. R4.16.
4. The `android` navigation bar measures 95 tall with labels; check it
   against the platform's 80dp. R4.7.
5. The code example for the button corner in `docs/contracts/anatomy.md`
   no longer matches: the platform files set no button corner. Lead to
   update at the R0 gate.
6. Neutral's switch reduced motion rule never wins on specificity. R3.
7. On the web, Desk's SegmentedControl and ToggleGroup items are 12px
   shorter after the Density selector fix (36 to 24). R1 checks them against
   GoBanana.

## From R0.20 and R0.21 (target sizes)

1. 27 components were 44 or 48 on phones only while the floor was raised,
   and are back to their earlier sizes (none under 24): inline links, Rating
   items, resize and split handles, Menubar triggers, ListBox options, Chip
   on `android` and others. The list is in
   `docs/reports/reset/R0.21/phone-targets-lost.json`. R4 decides which get
   a platform rule on `size.target`.
2. The Sheet and Drawer handle strips on `ios` are 24 tall
   (`ios.css:940`, `:974`). Consider `size.target` in R4.8.
3. ProgressCircle overflows by 2px at 320px in Desk, `android`, Arabic RTL,
   on some animation frames. Needs its own small order.
4. Stale comments about `target-min` in `OTPField.css` (lines 77, 187 to
   189) and `OTPField.reflow.test.ts` (lines 1 to 3); wording is in
   `docs/reports/lanes/reset-R0.21.md`.
5. FloatingActionButton, RangeSlider, Stepper, Field and Section rendered no
   demo on one phone platform in the sweep. Rerun at the R0 gate.

## Owner feedback on the R0 screenshots (2026-11-16, work paused)

The owner looked at the R0.15 before and after sheets (Liquid on `android`,
Desk alert and sheet on `ios`) and said:

1. **The iOS switch is wrong.** On the current iOS the thumb turns into a
   raised glass lens while pressed, then switches. Ours does nothing while
   held.
2. **The iOS chrome follows an old iOS.** The 270 wide alert with a grid of
   square actions, the full width square tab bar and the edge to edge sheet
   are the look of earlier versions. The current one has a floating glass
   tab bar, capsule actions in alerts, and inset sheets with large corners.
   R0.15 took its `ios` geometry from the old convention. This is a fault in
   R0.15, not a matter of taste.
3. **The bottom navigation is not right on either platform.** After R0.15
   Liquid on `android` shows a square bar with a round lens on the current
   item, which matches no platform.
4. **Tab bar icons are too small.**

Actions on resume, before R4 builds on this chrome:

- New order R0.22 (ds-qa research, then ds-style): fetch the vendor's
  current guidance and its own web pages again, write the `ios` chrome
  geometry for the current version (tab bar, alert, sheet, toolbar, toast,
  icon and label sizes) into the platform tokens and `ios.css`, and redo
  the `android` navigation bar against Material 3 (80dp bar, 64 by 32
  indicator, 24dp icons). Accept only side by side with a current reference
  capture, signed by the owner.
- The iOS switch press (glass lens while held) is a signature moment for
  R3, built for Liquid and Neutral (owner ruling in `DECISIONS.md`). Studio
  and Desk keep their own switch.
- R0.15's report claimed the chrome "measures the same in all four styles".
  That was true and beside the point: it was the same wrong geometry.
  Acceptance for chrome is a reference capture, not sameness.
