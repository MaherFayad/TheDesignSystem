# Order R0.2: Slider and RangeSlider reflow at 320px

Order: `docs/plan/reset.md`, section 4, R0.2. Answers order 1.31 item 1 and
`docs/reports/wave-1.md`, "Open when work paused", item 1.

Status: built, waiting on the lead's review and the owner's sign off of the
drag recording (ruling 5).

## The fault

The fill is the track's `::before`. Its box reached `--_slider-pull-max`
(three times `distance.enter`; measured: Desk and Liquid 36px, Neutral 12px,
Studio 0px) past both ends of the track, so a drag past an end could stretch
the fill. The clip kept the paint inside the track at rest, but a clip does not
shrink the box, and the box counts toward the page's scroll width. At 320
wide the control sits 16px from the page edge and the track 12px inside the
control, so in Desk and Liquid on `web` the box passed the page edge.

## The fix

`packages/css/src/components/Slider.css` (RangeSlider shares it):

- The fill's box is the track box: `inset-inline: 0` in place of
  `calc(var(--_slider-pull-max) * -1)`.
- The clip from each end reads only the value:
  `--_slider-clip-start: calc(var(--_slider-from) * 100%)` and
  `--_slider-clip-end: calc((1 - var(--_slider-to)) * 100%)`. The pull no
  longer enters the clip, so the fill never leaves the track, at rest or
  while dragged.
- `slider-rubber-band` and `slider-nudge` still move the outer thumb past the
  end (its transform is unchanged). The fill now ends at the track end while
  the thumb pulls.

The glide helper (`packages/motion/src/helpers/slider-fill.ts`) reads the
computed clip, so it needs no change: a pull no longer changes the clip, so
there is no fill glide on release, only the thumb's spring back. Angular sets
the same custom properties and gets the fix through the shared CSS.

## Measured

Method: a production build of the React gallery (`vite build` into a scratch
folder, served by `vite preview`), Chromium from Playwright, viewport 320 by
800. For each run: `document.documentElement.scrollWidth` minus
`innerWidth`, and, for every track on the page, how far the `::before` box
(computed `left` and `width`, or `top` and `height` on a vertical slider)
passes the track's own box on either side. The raw runs are in
`docs/reports/shots/reset/R0-2/reflow-*.json`.

### 48 run matrix per page (4 styles by 2 schemes by 3 platforms by 2 directions)

| | Runs | Runs with overflow | Largest overflow | Largest fill pass | Tracks measured |
| --- | --- | --- | --- | --- | --- |
| Before | 96 (48 per page) | 16 | 10px | 36px | 1776 |
| After | 96 (48 per page) | 0 | 0px | 0px | 1776 |

Before, the 16 overflowing runs were exactly Desk `web` (10px) and Liquid
`web` (8px), both schemes, both directions, on `/c/slider` and
`/c/range-slider`. On `ios` and `android` the fill box passed by the same
36px but the page did not overflow (I did not trace why; the platform
layer changes the page and control sizes), and Neutral (12px) and Studio (0px) stayed inside the page gutter.

### Densities (the order's steps)

The same matrix by compact, default and comfortable: 288 runs, 0 with
overflow, largest fill pass 0px, 5328 tracks measured
(`reflow-after-densities.json`).

### Contract run

`npm run contract -- --framework react --component Slider,RangeSlider`:
134 passed, 0 failed, 0 skipped (Slider 67, RangeSlider 67). The run now
includes the reflow test in every style and platform (`web`, `ios`,
`android`, `macos`) in English LTR and Arabic RTL, and axe in every style,
both schemes, both directions.

### Drag recording at the Pixel viewport

Playwright `Pixel 7` (412 by 915, touch), `platform=android`, LTR, driven by
CDP touch events at about 60 events a second: press the outer thumb of the
first enabled slider, drag 120px back, then out to 2px from the screen edge,
hold 300ms, lift. Liquid and Desk, dark and light, Slider and RangeSlider: 8
clips and 32 frames in `docs/reports/shots/reset/R0-2/`.

| Measured at each frame (rest, mid drag, pulled, released) | All 8 runs |
| --- | --- |
| Fill box past the track, either end | 0px (the box ends 0.1px inside, rounding) |
| Fill paint past the track, either end | 0px |
| Thumb center past the track end while pulled | Liquid 13.8px, Desk 15.4px |
| Thumb center past the track end after release | 0px |

Files: `<slug>-<style>-<scheme>.webm` (the clip), and
`<slug>-<style>-<scheme>-1-rest.png`, `-2-mid.png`, `-3-pulled.png`,
`-4-released.png` (the control at each moment), plus `drag.json` with the
numbers per frame. The webm files are git ignored (`.gitignore`,
`docs/reports/**/*.webm`), so the repo keeps the frames and the JSON; the
clips stay in the working tree for the lead to move to the preview deploy.

## Tests

- `Slider.test.tsx`: a new test reads `Slider.css` and checks that the fill
  `::before` has `inset-inline: 0`, names no pull, and that both clip
  properties read no pull. Two test titles that said the fill pulls now say
  the thumb pulls.
- `RangeSlider.test.tsx`: a new test checks the shared fill stays in the
  track box and that `RangeSlider.css` sets no fill or clip of its own.
- `npx vitest run` on both folders: 33 passed.

## Open for the lead

1. **The pulled thumb still widens a phone page for a moment.** The thumb's
   pull is a transform, and a transform counts toward the scroll width. In
   the Pixel recording the page's scroll width went from 412 to 413 (Desk
   Slider) and up to 426 (RangeSlider) while the thumb was pulled. Under
   mobile emulation the page then zoomed out to fit (`innerWidth` 413 to 419
   after release) and stayed there. This was true before the fix as well;
   the order's acceptance measures the page at rest and the fill, and both
   pass. Ways out, for the owner of the motion catalog: cap the thumb's pull
   to the control box, clip the control on the inline axis (it would cut the
   thumb), or replace the travel with a squash along the track. Not changed
   here, since it changes a named motion beyond this order's files.
2. **The motion catalog text is now out of date.**
   `packages/motion/src/interactions/fields.ts`, entries `slider-rubber-band`
   and `slider-nudge`, still say "the fill stretches out with it" and "the
   fill clip reaches the same place" or "follows". After this order the
   fill stops at the track end and only the thumb pulls. That file is not in
   this order's list; the lead or the next motion order should update it.
   `packages/angular/src/components/slider/slider-base.ts` has the same
   wording in its comments.
3. **Liquid held thumb in headless Chromium.** The held thumb is a
   transparent lens with a backdrop filter, so in the pulled frames of Liquid
   it hardly shows. The fill measure does not depend on it. A device
   recording is still needed for the owner's sign off.

## What I could not prove

- No real phone. The recording is Chromium with Pixel 7 emulation and CDP
  touch events, not a device or the `npm run record` harness (R0.9 has not
  landed). The sign sheet waits for that harness.
- WebKit was not run (the allowed WebKit download is for R0.7's harness).
- The measure ran against a build of the working tree, which other lanes were
  changing at the same time; the contract run used the live dev server.
