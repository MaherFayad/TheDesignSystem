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
