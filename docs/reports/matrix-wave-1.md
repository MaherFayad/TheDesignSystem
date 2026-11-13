# Matrix, wave 1 (order 1.17b)

Second run of order 1.17, on 2026-11-13, branch `claude/ds-order-1-17b`, cut
from `claude/relaxed-hypatia-7gseap` at `8095f600`. At 16:44 UTC the lead's
branch was merged in (`08ffd6c9`: the `:dir(rtl)` production build fix, the
Popover open race and the fix round's last Tabs change); everything the merge
touches ran again (see "After the merge"). 111 component manifests: 111 ready
in React, 59 in Angular. Four styles (Studio, Desk, Neutral, Liquid), each
dark and light; three platforms (web, ios, android).

Every run used production builds on 4 cores, one run at a time: the React
gallery built with `vite build` and served by `vite preview` (port 5192
before the merge, 5193 after), the Angular gallery built with `ng build` and
served the same way (port 4202).

| Part | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | React contract suite | 4575 tests: 4412 pass, 0 fail, 163 skipped | `docs/reports/contract-react.json` |
| 1 | Angular contract suite | 2347 tests: 2278 pass, 0 fail, 69 skipped | `docs/reports/contract-angular.json` |
| 2 | React suite in Liquid, every component | 1554 tests: 1492 pass, **4 fail** (Slider, RangeSlider reflow; Desk has it too), 58 skipped | `contract-react-liquid.json` |
| 2 | React suite on ios, 43 controls, 4 styles | 1591 pass, 0 fail | `contract-react-ios-controls.json` |
| 2 | React suite on android, 43 controls, 4 styles | 1591 pass, 0 fail | `contract-react-android-controls.json` |
| 3 | axe sweep, React, every gallery page | 2240 runs on 113 pages: 2238 pass, **2 fail** (WCAG 1.4.3, `/platforms`) | `docs/reports/a11y-react.md`, `.json` |
| 3 | axe sweep, Angular | 1136 runs on 61 pages: 1136 pass | `docs/reports/a11y-angular.md`, `.json` |
| 4 | Target size 24px, WCAG 2.5.8 | React 4164 of 4164 (web, ios, android; 4 styles; 3 densities; overlays open), Angular 724 of 724 | the contract reports |
| 4 | Platform guides, 44px ios and 48px android (note) | ios 69 of 172 pass, android 66 of 172 | `contract-react-ios-min44.json`, `contract-react-android-min48.json` |
| 5 | Screenshot matrix | React 2376 shots, 2360 byte stable; Angular 1312, 1308 byte stable | `docs/reports/shots/matrix/react/`, `angular/` |
| 6 | React and Angular compare | 1312 pairs, 1312 pass; 32 pairs differ by 1 to 27 pixels | `docs/reports/shots/matrix/compare-react-angular/` |
| 7 | Performance, 18 interactions, 4x CPU, 390 by 844 touch | `tab-slide` 184ms (Neutral) and 211ms (Liquid), still over 50ms | `docs/reports/matrix-wave-1/perf.neutral.json`, `perf.liquid.json` |
| 8 | Switch contrast, every frame | 144 runs, 0 under 3:1, lowest 3.23 | `docs/reports/matrix-wave-1/switch-contrast.json` |
| 9 | Reduced motion | 436 runs (109 interactions, 4 styles): nothing moves | `docs/reports/matrix-wave-1/reduced-motion.json` |
| 10 | Size | React app 333.1 KB gzip, up from 217.3 | `docs/reports/size-wave-1.md` |

Failures by owner, each marked blocker or note: `docs/reports/lanes/order-1-17b.md`.

## Commands

```sh
# production galleries (scratch folders outside git)
npx vite build --outDir <scratch>/gallery-react-dist2        # in apps/gallery-react
npx vite preview --outDir <scratch>/gallery-react-dist2 --port 5193
npx ng build --output-path <scratch>/gallery-angular-dist     # in apps/gallery-angular
npx vite preview --outDir <scratch>/gallery-angular-dist/browser --port 4202

# part 1 and 2 (DS_CONTRACT_WORKERS=4)
npm run contract -- --framework react --url http://localhost:5192
npm run contract -- --framework angular --url http://localhost:4202
npm run contract -- --framework react --url <react> --style liquid --styles liquid
npm run contract -- --framework react --url <react> --platform ios --component <43 controls> --tag ios-controls
npm run contract -- --framework react --url <react> --platform android --component <43 controls> --tag android-controls

# part 4
npm run contract -- --framework react --url <react> --platform ios --component <68 others> --grep "target size" --tag ios-target-others
npm run contract -- --framework react --url <react> --platform android --component <68 others> --grep "target size" --tag android-target-others
npm run contract -- --framework react --url <react> --platform ios --component <43 controls> --grep "target size(, \w+ default| open)" --target-min 44 --tag ios-min44
npm run contract -- --framework react --url <react> --platform android --component <43 controls> --grep "target size(, \w+ default| open)" --target-min 48 --tag android-min48

# part 3, 5, 6
npm run a11y -- --url http://localhost:5193 --workers 4
npm run a11y -- --framework angular --url http://localhost:4202 --workers 4
npm run shots -- --url http://localhost:5193 --workers 4
npm run shots -- --framework angular --url http://localhost:4202 --ready --keep none --workers 4
npm run shots -- --compare react angular

# part 7, 8, 9, 10
node docs/reports/fixes/interactions-3/perf.cjs --base http://localhost:5193 --style neutral --runs 3 --ids <18 ids> --out docs/reports/matrix-wave-1/perf.neutral.json
node docs/reports/fixes/interactions-3/perf.cjs --base http://localhost:5193 --style liquid --runs 3 --ids <18 ids> --out docs/reports/matrix-wave-1/perf.liquid.json
node docs/reports/fixes/interactions-3/switch-contrast.cjs --base http://localhost:5193 --out docs/reports/matrix-wave-1/switch-contrast.json --jobs 4
node docs/reports/matrix-wave-1/reduced-motion.cjs --base http://localhost:5193 --out docs/reports/matrix-wave-1/reduced-motion.json --jobs 4
node docs/reports/matrix-wave-1/reduced-motion.cjs --base http://localhost:5193 --styles neutral --motion full --out docs/reports/matrix-wave-1/reduced-motion.control-full.json
npx tsx scripts/size.ts --baseline <the first run's size-wave-1.json> --baseline-label "the first run (2026-11-12, e7e8160)"
```

Nothing was sharded by hand: each suite ran whole with 4 workers. Timings:
React 38.9 minutes, Angular 16.0, Liquid 13.2, each platform 13.7, the axe
sweep 39 minutes for React and 34 for Angular (17 of them idle, see the
Angular note under part 3), the React matrix 40 minutes.

## What changed in the scripts

- `packages/contract-tests/run.ts`: `--style`, `--styles`, `--platform`,
  `--target-min`, `--grep` and `--tag`. A run with any of them writes its own
  report (`contract-react-liquid.json`, `contract-react-ios-controls.json`)
  and never the base one. The spec reads `DS_STYLE`, `DS_STYLES`,
  `DS_PLATFORM` and `DS_TARGET_MIN`; `demoPath` adds `platform` to the URL.
  The README lists them.
- `packages/contract-tests/src/page.ts`: the target probe counts the button
  family's `hit` part (contract text of order 1.29), when a press in each band
  it adds outside the box reaches the control (`elementFromPoint`). Before,
  the 44 and 48px passes reported every Button and IconButton under size
  although their hit area was 44 or 48px. The 24px results do not change:
  they passed before and after.
- `scripts/a11y.ts`: also `/interactions` and `/platforms` (React only), with
  the shell; only components ready for the framework are probed.
- `scripts/shots.ts`: the kept subset is five base shots per component
  (Neutral light, Studio dark, Desk dark, Liquid light in en ltr; Neutral
  light in ar rtl), written as palette PNGs (256 colours, no dither); opens
  and densities are captured and hashed, not kept. The hash in
  `captured.json` is always the lossless capture's. Compare diff images are
  palette PNGs too (23 MB to 1.7 MB).
- `scripts/size.ts`: `--baseline` and `--baseline-label` add "Change since
  the first run".
- New: `docs/reports/matrix-wave-1/reduced-motion.cjs` (part 9).

## Part 1: contract suites

**React**: 4575 tests, 4412 pass, 0 fail, 163 skipped. The skips are Bidi
and Theme (no demo route), key checks with no hint and overlay checks with no
trigger, each a note in the JSON. The four List axe failures of the first run
(Desk, the first paint stagger) do not come back.

**Angular**: 2347 tests, 2278 pass, 0 fail, 69 skipped. 58 of 59 ready
components have a demo; Theme has none. The six components that failed
anatomy in the round 3 review (B12) pass.

No test failed, so no rerun was needed to tell a flake from a fault.

## Part 2: Liquid and the platforms

`--style liquid --styles liquid` runs every check of every React component in
Liquid (dark for the per style checks, as in the base run). 1492 pass, 4 fail:

| Component | Test | Finding | Rerun alone | Likely owner |
| --- | --- | --- | --- | --- |
| Slider | reflow, en ltr and ar rtl | the page scrolls sideways by 8px at 320px (WCAG 1.4.10) | fails again: a fault | ds-component, Slider CSS |
| RangeSlider | reflow, en ltr and ar rtl | the same, 8px | fails again | ds-component, Slider CSS |

Cause, measured: the fill is the track's `::before`, drawn
`--_slider-pull-max` past both ends of the track so a pull can stretch it
(`packages/css/src/components/Slider.css:205`); at rest a `clip-path` hides
the extra, but `clip-path` does not remove scrollable overflow. The reach is
`--ds-distance-enter` times 3 (`Slider.css:113`). Hiding each part in turn
found it: only hiding the track brings `scrollWidth` back to 320. Measured
at 320px, dark, after the merge:

| Style | Reach past each end | Page width | Result |
| --- | ---: | ---: | --- |
| Studio | 0px | 320 | fits |
| Neutral | 12px | 320 | fits |
| Desk | 36px | 330 | **overflows by 10px** |
| Liquid | 36px | 328 | **overflows by 8px** |

Desk fails too. The suite's reflow test runs only in the default style
(Neutral), so the base run cannot see it; the Liquid run found it because it
moves that test to Liquid. A fix that keeps the stretch: `overflow: clip` on
the control (or on the track with `overflow-clip-margin`), not a smaller
token. A note for the suite (mine): reflow should run in every style.

**ios and android**, the 43 controls (manifest data, `isControl`), every
style, scheme and density: 1591 of 1591 each. Anatomy, variants, states,
keys, target size, reflow and axe all pass on both platforms.

## Part 3: axe sweep (WCAG 2.2 AA)

axe with wcag2a, wcag2aa, wcag21aa and wcag22aa on `/`, `/all`,
`/interactions`, `/platforms` (with the shell) and every component page
(chrome=0), in every style and scheme, English ltr and Arabic rtl, reduced
motion. Overlays run closed and with the first visible trigger's root open.

React: 2240 runs on 113 pages, 2238 pass. The two failures are one finding:

| Page | Mode | Criterion | Element | Colours | Owner |
| --- | --- | --- | --- | --- | --- |
| `/platforms`, Alert screen | Desk dark, en ltr (web and android phones) and ar rtl (web phone) | 1.4.3 Contrast (minimum) | the danger AlertDialog title `Delete Spring launch?` | `#f87171` on `#3a3525`, 4.42:1, needs 4.5:1 | ds-style, Desk Dialog recipe (`packages/styles/desk/recipes/Dialog.css:96` to `:106`) |

The component page `/c/alert-dialog` passes axe in Desk dark; only the phone
frames of `/platforms` show this pair.

Angular: 1136 runs on 61 pages, 0 violations. A note on the tool: the route
probe waited 20s on each of the 52 components that have no Angular page
before the sweep began (17 minutes); `scripts/a11y.ts` now probes only
ready components.

## Part 4: target size

WCAG 2.5.8 (24 by 24 CSS px), measured by the contract suite on every
interactive element of every demo case, and in every root a trigger opens:

| Framework | Platform | Components | Style and density tests | Result |
| --- | --- | --- | --- | --- |
| React | web | 109 | 4 styles x 3 densities, plus open | 1388 pass |
| React | ios | 43 controls in the suite, 68 others alone | the same | 516 + 872 pass (28 skipped: no demo or no trigger) |
| React | android | the same | the same | 516 + 872 pass |
| Angular | web | 58 | the same | 724 pass |

Nothing under 24px anywhere.

As a note, the platform guides (ios 44pt, android 48dp, not WCAG; WCAG 2.5.5
asks 44px at AAA), density default and open, the 43 controls, 4 styles:

| Platform | Pass | Under | Most frequent elements under, Neutral |
| --- | --- | --- | --- |
| ios, 44px | 69 | 103 | Link (inline), RadioGroup control, ToggleButton item, ScrubInput and NumberField inputs, ToggleGroup, PhoneField input and country select, IconButton, SegmentedControl, OTPField |
| android, 48px | 66 | 106 | ToggleButton item, Link, RadioGroup control, Dock item, NumberField, ScrubInput, ToggleGroup, IconButton and its decrement, PhoneField, SegmentedControl, OTPField, Button |

The button family reaches 44 and 48px through its `hit` part; the rest of
the controls have no such part yet. That is a platform template question for
wave 2, not a gate item.

## Part 5: screenshot matrix

`variants` case, chrome=0, 1280 by 800, full page, scale 1, animations off,
reduced motion, fonts loaded, each shot captured twice in fresh contexts:

| Kind | Rule | React | Angular |
| --- | --- | --- | --- |
| Base | 4 styles x 2 schemes x en ltr and ar rtl, density default | 1744 | 928 |
| Open | overlays with a visible trigger, the same modes | 288 (18 components) | 112 (7) |
| Densities | controls, compact and comfortable, dark, ltr, 4 styles | 344 (43) | 272 (34) |
| Total | | 2376 | 1312 |

Kept in git, five per component as palette PNGs: React 545 images (20 MB),
Angular 290 (11 MB). `captured.json` and `index.md` in each folder hold every
shot's sha256. The 393 stale Angular images are gone and replaced. The
Angular run kept no image at first (`--keep none` in the command above); the
five per component were copied from that run's work folder afterwards, so
their hashes are the run's.

**Stability.** React 2360 of 2376 byte equal; Angular 1308 of 1312.

| Component | Shots | Pixels apart | Kind |
| --- | --- | --- | --- |
| ScrollArea | 5 (Liquid dark ltr and rtl, Neutral light rtl, Studio dark rtl, Studio dark compact) | 394 to 2252 | visible: the scroll offset or thumb lands on a different subpixel; seen in the first run too |
| Menubar | 1 (Liquid dark ltr open) | 85 | a band at x 698 to 839, y 197 to 210, inside the open menu |
| Tabs (8), Switch (1), FloatingActionButton (1) | 10 | 0 above the threshold | bytes differ below pixelmatch's 0.1 threshold |
| Angular DropdownMenu, FloatingActionButton, Input | 4 | 0 above the threshold | the same |

No video file is in the matrix. Three `.webm` files are still tracked under
`docs/reports/shots/showcase/`, through a `.gitignore` exception (lead).

## Part 6: React and Angular

1312 pairs (every Angular shot has a React twin), 1312 pass (threshold 0.1,
at most 0.5 percent of pixels). 1280 pairs are 0 pixels apart. The five
causes of the first run (InputGroup direction, Switch copy, OTPField heading,
FormWizard asterisk, Banner icon) are gone; the InputGroup one was the
production CSS rewrite of `:dir(rtl)`, now fixed.

32 pairs differ, in 7 components, by 1 to 27 pixels each:

| Component | Pairs | Pixels, largest | What differs | Owner |
| --- | --- | --- | --- | --- |
| SplitButton | 8 | 17 | single pixels in the Desk grain texture under the label | none |
| CopyButton | 5 | 9 | the same grain, Desk | none |
| ToggleButton | 5 | 9 | the same grain, Desk | none |
| Button | 4 | 13 | the same grain, Desk | none |
| Banner | 4 | 2 | the icon edge, Liquid | none |
| Alert | 3 | 27 | the antialiased edge of the check icon stroke, Desk light | none |
| Toast | 3 | 1 | one pixel of an icon edge | none |

Diff images: `docs/reports/shots/matrix/compare-react-angular/<component>/<file>.png`.

### The production build check

The lead asked for a check that the production CSS keeps `:dir(rtl)`.
Counted in the built CSS of the React gallery:

| Build | `:dir(rtl)` | `:lang(ar)` style lists |
| --- | ---: | ---: |
| Source CSS (packages and gallery) | 109 | |
| Before the merge (`5192`) | 0 | 109 rewrites (`:lang(ae)`, `:lang(ar)`, `:lang(arc)` and on) |
| After the merge (`5193`) | 109 | 0 |
| Angular production build | 109 | 0 |

Every React run before the merge used the first build. All ar rtl tests of
the React suite ran again on the fixed build (1141 pass, 0 fail,
`contract-react-rtl-rerun.json`); the axe sweep, the matrix, the compare and
parts 7 to 9 ran only on the fixed build.

## After the merge

| Run | Result | Evidence |
| --- | --- | --- |
| Popover and Tabs, whole suite | 94 pass | `contract-react-popover-tabs-merged.json` |
| Popover and Tabs, Liquid | 31 pass | `contract-react-liquid-popover-tabs-merged.json` |
| Tabs, ios and android | 37 and 37 pass | `contract-react-ios-tabs-merged.json`, `contract-react-android-tabs-merged.json` |
| Every ar rtl test | 1141 pass | `contract-react-rtl-rerun.json` |

## Part 7: performance

`docs/reports/fixes/interactions-3/perf.cjs`, unchanged: 390 by 844, touch,
4x CPU throttle through CDP, one trigger, a Chromium trace of the trigger
plus 1200ms, 3 runs per interaction, production build. Frames are the
compositor's frame reports; dropped counts dropped and partly presented
frames; the longest task is the largest main thread task over 50ms in each
run (0 when none). Machine load 1.0 to 2.2 (the browser of the run itself).

| Interaction | Neutral: presented / dropped | Neutral: longest task per run (ms) | Neutral: median | Liquid: presented / dropped | Liquid: longest task per run (ms) | Liquid: median | Review, dev build (Neutral, Liquid) |
| --- | --- | --- | ---: | --- | --- | ---: | --- |
| `button-press` | 2 / 2 | 0, 67, 62 | 62 | 2 / 2 | 0, 62, 0 | 0 | 114, 73 |
| `switch-stretch` | 12 / 6 | 72, 59, 117 | 72 | 9 / 3 | 58, 65, 88 | 65 | 77, 103 |
| `switch-drag` | 26 / 2 | 0, 0, 0 | 0 | 45 / 0 | 0, 0, 0 | 0 | none, none |
| `focus-glow` | 15 / 0 | 0, 0, 0 | 0 | 26 / 0 | 0, 0, 0 | 0 | none, none |
| `card-lift` | 14 / 1 | 72, 0, 0 | 0 | 25 / 3 | 66, 0, 0 | 0 | 78, 113 |
| `link-underline` | 2 / 0 | 0, 0, 0 | 0 | 1 / 0 | 0, 0, 0 | 0 | none, none |
| `alert-entrance` | 17 / 4 | 122, 77, 77 | 77 | 34 / 3 | 65, 51, 56 | 56 | 158, 207 |
| `accordion-reveal` | 19 / 5 | 105, 101, 52 | 101 | 22 / 4 | 86, 93, 0 | 86 | 151, 394 |
| `slider-fill` | 21 / 7 | 100, 175, 139 | 139 | 37 / 6 | 125, 117, 154 | 125 | 404, 189 |
| `menu-origin` | 21 / 15 | 274, 215, 259 | 259 | 32 / 12 | 198, 278, 219 | 219 | 489, 471 |
| `popover-spring` | 16 / 9 | 142, 107, 112 | 112 | 31 / 9 | 122, 109, 103 | 109 | 259, 275 |
| `command-palette-open` | 20 / 20 | 298, 262, 296 | 296 | 18 / 25 | 283, 267, 290 | 283 | 597, 601 |
| `dialog-spring` | 16 / 11 | 255, 170, 147 | 170 | 18 / 13 | 149, 146, 151 | 149 | 325, 408 |
| `sheet-spring` | 16 / 9 | 205, 160, 147 | 160 | 29 / 11 | 146, 160, 183 | 160 | 344, 269 |
| `toast-enter` | 73 / 5 | 108, 138, 105 | 108 | 74 / 8 | 144, 107, 109 | 109 | 313, 314 |
| `toast-stack` | 96 / 21 | 198, 132, 159 | 159 | 97 / 18 | 124, 127, 113 | 124 | 296, 354 |
| `toast-expand` | 682 / 70 | 165, 180, 142 | 165 | 711 / 71 | 195, 202, 125 | 195 | 471, 558 |
| `tab-slide` | 9 / 12 | 182, 184, 235 | **184** | 9 / 12 | 211, 217, 174 | **211** | 1030, 821 |

**`tab-slide`**: 174 to 235ms, median 184ms in Neutral and 211ms in Liquid.
The fix round's final proof gave 237 to 299ms (production build, 3 runs);
this run, after the merge's Tabs change, is lower, and it confirms the fix
round's verdict: still over 50ms, 12 of 21 frames dropped. The review's 821
to 1030ms were on the dev build, so they do not compare one to one with these.

The other numbers are lower than the review's because the build is the
production one. Still over 200ms: `command-palette-open` (283 to 298),
`menu-origin` (198 to 278), and `dialog-spring` in one Neutral run (255).
`toast-expand` keeps 8 to 9 long tasks in 1.5s of hover, largest 125 to
202ms. These are opening costs (mount and first layout), as the review found.

## Part 8: Switch contrast, every frame

`docs/reports/fixes/interactions-3/switch-contrast.cjs`, unchanged, on the
production build: 4 styles x 2 schemes x 3 platforms x toggle (click and
held tap, on and off) and drag (from off and from on, held at 0 to 1 in 0.05
steps), frames every 10ms.

144 runs, **0 under 3:1**. Lowest 3.23 (Neutral dark web, drag held at
0.25), then 3.34 (Desk dark web, toggle on at 110ms) and 3.43 (Neutral dark
ios and android, toggle off at 80 to 130ms). This confirms the fix round
(0 of 144, lowest 3.23).

A note on the measure: a frame's value is the median over 48 directions
around the thumb. The weakest single direction in those same frames is 1.04
to 2.63, so part of the thumb edge (the side where it meets the fill)
disappears for a few frames. WCAG 1.4.11 is met by the median reading the
fix round chose; a stricter reading would not pass.

## Part 9: reduced motion

`docs/reports/matrix-wave-1/reduced-motion.cjs`: every interaction of
`/interactions` (109) in Studio, Desk, Neutral and Liquid, light, with
`prefers-reduced-motion: reduce`. Each stage opens alone; `getAnimations()`
is sampled on every frame from the first paint, the first trigger is
pressed after 700ms (the switch drag and the focus glow are driven), and
sampling goes on for 1500ms. An animation counts when its active duration
is over 1ms; it moves when it animates a place, size, shape, stroke or a
custom property. Inline transform writes are watched too.

Result: 436 runs, **0 with a moving animation**, and no animation over 1ms
of any kind. 64 runs write a transform inline once, with no animation: the
Radix popper places a menu or popover, the Tour places its spotlight, and the
list highlight jumps to the active row. These are placements, not motion.

Control run with motion on, Neutral (`reduced-motion.control-full.json`): 99
of 109 interactions move, so the probe does see motion.

## Part 10: size

Full tables: `docs/reports/size-wave-1.md`. Gzip KB, against the first run:

| What | First run | Now | Change |
| --- | ---: | ---: | ---: |
| React app (every barrel, before tree shaking) | 217.3 | 333.1 | +115.8 |
| Angular app | 204.2 | 314.8 | +110.6 |
| `@the-system/motion` | 11.8 | 64.5 | +52.7 |
| `@the-system/css` | 57.8 | 83.4 | +25.6 |
| `@the-system/react` | 99.5 | 121.9 | +22.4 |
| `@the-system/angular` | 94.9 | 112.3 | +17.4 |
| `@the-system/styles` | 3.5 | 16.0 | +12.5 |

The ten largest: `@the-system/react` 121.9, `@the-system/angular` 112.3,
`@the-system/css` 83.4, `@the-system/motion` 64.5, `@the-system/shared`
16.8, `@the-system/styles` 16.0, `@the-system/tokens` 15.0,
`@the-system/tokens/css` 11.4, `@the-system/icons/react` 9.6,
`@the-system/icons` 9.4.

Half the growth is `@the-system/motion`: its barrel exports
`./interactions` (the registry of 109 interactions with their beats and
prose, `packages/motion/src/interactions/*.ts`, about 180 KB of source)
beside the runtime helpers. An app that imports one helper from the barrel
gets the registry unless its bundler drops it. Largest component CSS files:
Button 3.9, Dialog 3.5, Switch 2.9, DropdownMenu 2.7.

## Gate 1

For each condition of `docs/plan/wave-1.md`:

| Condition | Verdict | Evidence from this run |
| --- | --- | --- |
| Both web example apps use only system components for buttons, dialogs, toasts, tooltips, menus and forms | pass on the checker's evidence | `ds doctor examples/consumer-next --json` and `consumer-vite`: 0 findings, so 0 `ds/primitives`. The smoke tests are order 1.18's and did not run here |
| `ds doctor` is clean on both | pass | consumer-next 11 files, consumer-vite 12 files: 0 errors, 0 warnings |
| The 55 Angular components pass the contract suite | pass | 59 ready, 58 with a demo: 2278 pass, 0 fail. Compare: 1312 pairs, 0 over the limit |
| 105 React components | pass in the default style; **fail in Liquid by 4 tests**, and Desk has the same fault outside the suite | 111 manifests ready and valid (`npm run check`). Base suite 4412 pass, 0 fail; ios and android controls 0 fail; Liquid: Slider and RangeSlider reflow at 320px (Desk measured by hand: 10px). The appendix table in `STATE.md` is the lead's |
| Neutral style | pass | `ds style check neutral`: contract 764, contrast 602, icons 94, fonts 2. `"status": "proposed"`. `ds style check liquid` passes too |
| Docs site, registry, CLI, checker | not proven here | Orders 1.12 to 1.15 own those proofs. This run used the CLI (`ds doctor`, `ds style check`) and both worked; the docs build runs inside `npm run check` |
| `npm run check` | pass with two load flakes | On the merge commit, 11 of 13 steps pass; vitest had 2 lint gate tests time out at 5s and Angular `tag-field.spec.ts` "Enter adds the typed text" fail while a contract suite ran on the same 4 cores; all three pass alone. On the commit that adds this report, alone on the machine: 13 of 13 steps pass |

Order 1.17's own acceptance: no axe violations (**fail**: 2 of 3376 runs,
one finding, the Desk AlertDialog title on `/platforms`); every shot byte
stable across two captures (**fail** for 6 visible, ScrollArea and Menubar,
and 14 below the threshold); results to the lead (this report and the lane
report).

## Files

- `packages/contract-tests/run.ts`, `src/contract.spec.ts`, `src/lib.ts`,
  `src/lib.test.ts`, `src/page.ts`, `README.md`
- `scripts/shots.ts`, `scripts/a11y.ts`, `scripts/size.ts`
- `docs/reports/contract-*.json` (base, Angular, Liquid, platforms, target
  size passes, merge reruns)
- `docs/reports/a11y-react.*`, `docs/reports/a11y-angular.*`
- `docs/reports/shots/matrix/react/`, `angular/`, `compare-react-angular/`
- `docs/reports/matrix-wave-1/`: `perf.neutral.json`, `perf.liquid.json`,
  `switch-contrast.json`, `reduced-motion.cjs`, `reduced-motion.json`,
  `reduced-motion.control-full.json`
- `docs/reports/size-wave-1.md`, `.json`
- `docs/reports/matrix-wave-1.md`, `docs/reports/lanes/order-1-17b.md`
