# Final performance recheck, order 1.29

`perf.cjs` on the final tree (HEAD a49feaa), the 18 interactions of the
review's Part 4 table, 3 runs each, 390 by 844 touch viewport, 4x CPU, a
Chromium trace of the trigger plus 1200ms. Evidence:
`final.perf.liquid.json`, `final.perf.neutral.json`.

- Build: a production build of the React gallery (`vite build`), served
  statically on port 5196. The review ran the Vite development build, so the
  two columns are not like for like: `button-press`, the baseline for the cost
  of React and the gallery, falls from 73 to 61ms (Liquid) and from 114 to
  53ms (Neutral) on the build alone. Compare each row against that baseline.
- Load (1 minute average, 4 CPUs): the runs started when it was 1.42 (after
  a wait for it to drop under 2). It stayed between 0.51 and 1.88 for the
  whole run (Liquid 1.42 to 1.72, Neutral 1.66 to 1.18; every value is in
  the JSON `loadAvg1m`). A recordings agent was using the CPU at times.
- Cells: presented / dropped frames (median of 3 runs); long tasks are main
  thread `RunTask` events over 50ms, one group per run, and the median of
  each run's largest task in brackets.

| Interaction | Review Liquid p/d | Final Liquid p/d | Review Liquid long tasks | Final Liquid long tasks, 3 runs (median largest) | Review Neutral p/d | Final Neutral p/d | Review Neutral long tasks | Final Neutral long tasks, 3 runs (median largest) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `button-press` | 19 / 3 | 2 / 2 | 73 | 61 / 63 / 51 (61) | 1 / 5 | 2 / 3 | 114 | 53 / 51 / 59 (53) |
| `switch-stretch` | 32 / 5 | 9 / 3 | 103 | 70 / 102 / 67 (70) | 15 / 6 | 12 / 5 | 77 | 74 / 62,69 / 113 (74) |
| `switch-drag` | 48 / 5 | 47 / 1 | none | none / none / none (none) | 28 / 4 | 26 / 3 | none | none / none / none (none) |
| `focus-glow` | 26 / 1 | 26 / 0 | none | none / none / none (none) | 15 / 0 | 16 / 0 | none | none / none / none (none) |
| `card-lift` | 25 / 6 | 25 / 2 | 113 | 53 / 82 / none (53) | 15 / 6 | 14 / 3 | 78 | 54 / none / 69 (54) |
| `link-underline` | 2 / 1 | 1 / 3 | none | 78 / none / none (none) | 2 / 1 | 2 / 1 | none | none / none / none (none) |
| `alert-entrance` | 34 / 12 | 34 / 4 | 207 | 91 / 66 / 81 (81) | 16 / 9 | 16 / 6 | 158 | 109 / 106 / 60 (106) |
| `accordion-reveal` | 19 / 25 | 22 / 6 | 394 | 103 / 114 / 95 (103) | 19 / 10 | 19 / 7 | 151 | 85,56 / 108 / 97 (97) |
| `slider-fill` | 20 / 12 | 37 / 6 | 189 | 130 / 104 / 107 (107) | 22 / 27 | 22 / 6 | 404 | 115 / 145 / 125 (125) |
| `menu-origin` | 32 / 27 | 32 / 14 | 471 | 272 / 246 / 232 (246) | 21 / 32 | 21 / 18 | 489 | 271 / 259 / 351 (271) |
| `popover-spring` | 32 / 24 | 30 / 12 | 109, 275 | 60,135 / 133 / 94,146 (135) | 17 / 25 | 17 / 11 | 145, 259 | 138 / 73,178 / 70,131 (138) |
| `command-palette-open` | 12 / 53 | 18 / 29 | 601 | 289 / 286 / 292 (289) | 15 / 47 | 18 / 23 | 597 | 323 / 338 / 306 (323) |
| `dialog-spring` | 15 / 35 | 19 / 16 | 408 | 163 / 169 / 181 (169) | 13 / 23 | 15 / 13 | 325 | 210 / 192 / 210 (210) |
| `sheet-spring` | 16 / 19 | 21 / 13 | 269 | 174 / 258 / 185 (185) | 16 / 21 | 13 / 11 | 344 | 183 / 191 / 157 (183) |
| `toast-enter` | 69 / 21 | 74 / 7 | 314 | 135 / 116 / 130 (130) | 68 / 23 | 73 / 8 | 313 | 145 / 146 / 127 (145) |
| `toast-stack` | 90 / 66 | 95 / 29 | 224, 348, 354 | 129,146,136 / 183,103,169 / 96,111,189,73 (183) | 90 / 65 | 97 / 22 | 296, 253, 270 and three near 60 | 152,95,121 / 126,116,134 / 151,107,176,52 (152) |
| `toast-expand` | 563 / 222 | 690 / 97 | 26 tasks, largest 558 | 11, 13 and 15 tasks; largest 233, 232, 221 (232) | 565 / 217 | 699 / 88 | 25 tasks, largest 471 | 16, 13 and 16 tasks; largest 205, 191, 172 (191) |
| `tab-slide` | 16 / 57 | 9 / 21 | 821 | 299,59 / 268 / 382 (299) | 9 / 67 | 10 / 16 | 1030 | 222 / 386,56 / 246,54 (246) |

## What it shows

- Every row that had a long task is lower. The open interactions (menu,
  popover, palette, dialog, sheet) fell from 270 to 600ms to 135 to 340ms;
  part of that is the production build.
- `accordion-reveal` (394 to 103ms in Liquid) and `slider-fill` (404 to
  125ms in Neutral) fell far more than the baseline did.
- `toast-expand` (N44): still 11 to 16 long tasks in 1.5s of hover, but the
  largest fell from 558 to 232ms (Liquid) and 471 to 191ms (Neutral), and
  dropped frames fell from 222 to 97 and 217 to 88.
- `link-underline` showed one 78ms task in one Liquid run out of three; the
  other two had none. Noise at this load, not a regression.

## tab-slide (B14)

Not under 50ms. The median largest task is 299ms in Liquid (runs 299, 268,
382) and 246ms in Neutral (runs 222, 386, 246). The review measured 821 and
1030ms on the development build. Dropped frames fell from 57 to 21 (Liquid)
and 67 to 16 (Neutral).

Where the time goes. One run per style with the V8 sampling profiler (100
microsecond interval) and a trace, against an unminified production build
(`vite build --minify false`, port 5197) so the function names read. The
profiler makes the task slower (328ms in Liquid, 283ms in Neutral, against
the 246 to 299ms medians without it). Inside that task:

- Style recalculation is most of it: `UpdateLayoutTree` 189ms (Liquid) and
  170ms (Neutral) of the task, against 13ms of layout. There are 8 to 11
  recalcs. Three of them are full recalcs of 125 to 137 elements at 41 to
  53ms each. The rest are 1 to 9ms each, on 2 to 17 elements.
- Two of the full recalcs are forced by reads straight after the React
  commit that swaps the panel:
  - `getAnimationName` in `@radix-ui/react-presence` (52ms self time in both
    styles, 105ms in a first run): Presence reads
    `getComputedStyle(node).animationName` in a layout effect when the tab
    panel mounts or unmounts.
  - The first `getBoundingClientRect` in the Tabs trigger's `inFrame` job
    (`packages/react/src/components/Tabs/Tabs.tsx:221`, the keep in view
    check, 53 to 56ms self time, 86ms in a first run). This is the job that
    `flushFrame` (`packages/motion/src/helpers/indicator.ts`) runs. The
    first read pays for every style change of the commit.
  - The third full recalc could not be tied to a caller from the samples. It
    may be the frame's own style update before paint.
- The ink code itself is small now. `planInk`, `readPart` and `playInk` in
  `nav-ink` add up to about 15ms of self time, and `placeRipple` to 7ms. In
  the review, `playInk` alone had 409ms of self time.
- In short, the largest task is the cost of restyling the whole 125 element
  stage two or three times in one click. A Presence read and the tab's
  keep in view read each force one of those restyles straight after the
  commit. Getting under 50ms at 4x would need fewer full restyles per click
  (for example, the keep in view read only when the list scrolls, and the
  panel swap without a Presence read). That is a decision for the lead.

Evidence: `final.perf.tab-slide.liquid.profile.json` and
`final.perf.tab-slide.neutral.profile.json` (long tasks, the recalcs in the
profiled task with their element counts, self time by function). The raw
`.cpuprofile` files stayed out of the tree.
