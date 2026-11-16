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
