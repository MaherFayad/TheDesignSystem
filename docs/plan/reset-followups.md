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
