# Order 1.17b, lane report (ds-qa)

The second run of order 1.17 on the current tree: contract suites, Liquid and
the platforms, axe, target size, the screenshot matrix, the Angular compare,
performance, Switch contrast, reduced motion and size. Full results and
evidence: `docs/reports/matrix-wave-1.md`. Size: `docs/reports/size-wave-1.md`.

Branch `claude/ds-order-1-17b`, cut from `claude/relaxed-hypatia-7gseap` at
`8095f600`; the lead's branch was merged at `08ffd6c9` on request (the
production `:dir(rtl)` fix and the fix round's last commits), and every run
the merge touches ran again. Every part ran; nothing is "not run".

## Results in one table

| Part | Result |
| --- | --- |
| 1 Contract, React | 4412 pass, 0 fail, 163 skipped |
| 1 Contract, Angular | 2278 pass, 0 fail, 69 skipped |
| 2 Liquid, every React component | 1492 pass, 4 fail (Slider and RangeSlider reflow) |
| 2 ios and android, 43 controls | 1591 and 1591 pass |
| 3 axe, React (113 pages) and Angular (61) | 2238 of 2240 and 1136 of 1136 |
| 4 Target size 24px | React 4164 of 4164 on web, ios and android; Angular 724 of 724 |
| 5 Matrix | React 2376 shots, 16 unstable; Angular 1312, 4 unstable |
| 6 Compare | 1312 pairs, 0 over the limit, 32 differ by at most 27 pixels |
| 7 Performance | `tab-slide` 184ms Neutral, 211ms Liquid (over 50ms) |
| 8 Switch contrast | 0 of 144 under 3:1, lowest 3.23 |
| 9 Reduced motion | 0 of 436 runs move |
| 10 Size | React app 333.1 KB gzip (+115.8 since the first run) |

## Failures by owner

### ds-component

| # | Kind | Finding | Where | Evidence |
| --- | --- | --- | --- | --- |
| 1 | blocker | Slider and RangeSlider scroll the page sideways at 320px in **Liquid (8px) and Desk (10px)**, WCAG 1.4.10. The fill `::before` reaches `--_slider-pull-max` (36px in both styles) past each end of the track; `clip-path` hides it but does not stop the overflow. Fails alone too, so it is a fault. Fix: `overflow: clip` on the control (keeps the stretch) | `packages/css/src/components/Slider.css:205`, `:113` | `contract-react-liquid.json`, 4 tests; Desk measured by hand |
| 2 | blocker (B14 still open) | `tab-slide` longest task at 4x CPU: median 184ms (Neutral) and 211ms (Liquid), 174 to 235ms, 12 of 21 frames dropped. Lower than the fix round's 237 to 299ms; still over 50ms | `packages/react/src/components/Tabs/` (ink and indicator writers) | `matrix-wave-1/perf.*.json` |
| 3 | note | ScrollArea shots are not byte stable: 5 of them, 394 to 2252 pixels apart between two captures (scroll offset or thumb on a subpixel). Same finding as the first run | ScrollArea | `shots/matrix/react/captured.json` |
| 4 | note | Menubar open in Liquid dark: 85 pixels differ between captures, inside the open menu | Menubar, DropdownMenu | the same |
| 5 | note | Opening costs at 4x on the production build: `command-palette-open` 283 to 298ms, `menu-origin` 198 to 278ms, `dialog-spring` up to 255ms, `toast-expand` 8 to 9 long tasks in 1.5s of hover | CommandPalette, DropdownMenu, Dialog, Toast stack | `matrix-wave-1/perf.*.json` |
| 6 | note | Under the platform guides (44px ios, 48px android, not WCAG): Link, RadioGroup control, ToggleButton item, ScrubInput, NumberField, ToggleGroup, PhoneField, SegmentedControl, OTPField, Dock item have no hit part; ios 103 and android 106 of 172 tests under | the controls outside the button family | `contract-react-ios-min44.json`, `contract-react-android-min48.json` |

### ds-style

| # | Kind | Finding | Where | Evidence |
| --- | --- | --- | --- | --- |
| 7 | blocker | Desk dark: the danger AlertDialog title on the warm title band is `#f87171` on `#3a3525`, 4.42:1, under 4.5:1 (WCAG 1.4.3). Seen on `/platforms` (web and android phones in en ltr, web in ar rtl); `/c/alert-dialog` passes in Desk dark (the demo there was not measured for this colour pair) | `packages/styles/desk/recipes/Dialog.css:96` to `:106` | `a11y-react.md`, 2 runs |
| 8 | note | Liquid and Desk set `--ds-distance-enter` so that the Slider reach is 36px; part of finding 1 if the fix is in tokens rather than in Slider.css | style tokens | as 1 |
| 9 | note | Switch thumb: the frame median over 48 directions never drops under 3:1 (lowest 3.23), but the weakest direction drops to 1.04 to 2.63 for a few frames (the side that meets the fill). Passes the fix round's reading of 1.4.11; a stricter one would not | Switch recipes and `packages/css/src/components/Switch.css` | `matrix-wave-1/switch-contrast.json` (`minEdge`) |
| 10 | note | `@the-system/motion` grew from 11.8 to 64.5 KB gzip: its barrel exports `./interactions`, the registry of 109 interactions with beats and prose, beside the runtime helpers. A subpath export for the registry would keep it out of apps | `packages/motion/src/index.ts` (generated), `packages/motion/package.json` | `size-wave-1.md` |

### ds-angular

| # | Kind | Finding | Where | Evidence |
| --- | --- | --- | --- | --- |
| 11 | note | `tag-field.spec.ts` "Enter adds the typed text and drops duplicates with the shared rule" failed once in `npm run check` while a contract suite ran (the announcement read empty); 13 of 13 pass alone. A wait for the live region would make it steady | `packages/angular/src/components/tag-field/tag-field.spec.ts` | check log of `5281122d` |
| 12 | note | Angular matrix: 4 shots not byte equal (DropdownMenu open, FloatingActionButton, Input), all below the diff threshold | | `shots/matrix/angular/captured.json` |

### ds-qa (mine)

| # | Kind | Finding | Where |
| --- | --- | --- | --- |
| 13 | note | The reflow test runs only in the default style, so finding 1 in Desk was invisible to the base run. It should run in every style (666 more tests a run: 111 components, 3 more styles, 2 directions) | `packages/contract-tests/src/contract.spec.ts:583` |
| 14 | note | Two lint gate tests time out at 5s under load (no-native-title, no-tailwind) | `packages/lint/src/gates/` |
| 15 | fixed here | The target probe now counts the `hit` part; the a11y probe skips components that are not ready for the framework; diff images are palette PNGs | `page.ts`, `a11y.ts`, `shots.ts` |

None found for ds-docs or ds-native.

## Changes needed from the lead

1. Hand finding 1 (Slider, Liquid and Desk) and finding 7 (Desk AlertDialog
   title) to the next fix round; both stand between this run and a clean
   gate.
2. Decide whether B14 (`tab-slide` over 50ms) blocks Gate 1 or moves to the
   fix rounds 2 and 3 of round 3.
3. Three `.webm` files (14 MB) are still tracked under
   `docs/reports/shots/showcase/` through the `!docs/reports/shots/showcase/*.webm`
   exception in `.gitignore`. The order says no video files anywhere; removing
   them and the exception is yours.
4. `docs/contracts/` text for what this run added to the suite: the runner
   options (`--style`, `--styles`, `--platform`, `--target-min`, `--grep`,
   `--tag`), that the `hit` part counts toward target size when it is hit
   tested, and the two platform passes (24px is WCAG, 44 and 48px are notes).
5. A decision on making the platform guides (44 and 48px) a gate for
   wave 2, and on giving the other controls a `hit` part.
6. History weight: `f77381c2` added 23 MB of full page diff images before
   they were compressed (the next commit replaces them, 1.7 MB). The first
   React snapshot commit and the 393 old Angular images are also in history.
   Nothing was rewritten.
7. Fold this report into `docs/reports/wave-1.md`: the gate table in
   `matrix-wave-1.md` gives a verdict and evidence per condition.

## Decisions made in this order

- All runs on production builds of both galleries, one heavy run at a time,
  4 workers; nothing sharded by hand.
- Merged the lead's branch mid order on the lead's request; kept my contract
  JSON on the two conflicts (regenerated in this order).
- Kept five images per component as palette PNGs; the index keeps the
  lossless hash of every shot.
- Platform passes: 24px as the WCAG check; 44 and 48px as notes.
