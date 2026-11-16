# Order R0.3: tab slide long task, React

Order: `docs/plan/reset.md`, section 4, R0.3. Lane: ds-component. Status:
built; the code change is proven; the long task target is not met, see
"What the numbers say".

## What changed

- `packages/react/src/components/ToggleGroup/ToggleGroup.tsx`: the single
  choice group no longer calls `followIndicator` and then `playInk` in its
  layout effect. It queues a frame job with `inFrame` that reads with
  `planFollow` and `planInk` and returns the writes (`plan.write()` and the
  ink writer), as Tabs and SegmentedControl do since order 1.29. The reads
  of every list in a commit now share one style pass, and the writes come
  after all of them, still before the first paint. The pill element is
  passed to `planInk` as `indicator`, as Tabs does, so a hidden pill draws
  no ink.
- `packages/react/src/components/ToggleGroup/ToggleGroup.perf.test.tsx`
  (new): the performance fixture. It logs every box, style and animation
  read and every write of the motion code, and checks that a press reads
  everything before its first write: one press, twenty presses across the
  segments (the pill lands on the pressed item each time), and two
  ToggleGroups plus a Tabs list that change in one commit. All three cases
  fail on the old code and pass on the new code.
- `packages/motion/src/helpers/`: no change. `inFrame`, `planFollow` and
  `planInk` already covered ToggleGroup's case.
- Evidence in `docs/reports/reset/R0.3/`: the probe `tab-slide-trace.cjs`,
  the tables `before.prod.json`, `after.prod.json`, `before.dev.json`,
  `after.dev.json`, two raw traces (`after-prod.<style>.group.trace.json.gz`,
  open in the DevTools performance panel) and two clips of the pill landing
  (`landing-neutral.webm`, `landing-liquid.webm`).

## Method

- Probe: `node docs/reports/reset/R0.3/tab-slide-trace.cjs <base url>
  <out.json> <label> [style ...]`.
- Browser: Playwright Chromium, Pixel 7 device profile (412 by 915, touch,
  mobile, device scale 2.625), light scheme, gallery shell off.
- 4x CPU slowdown through CDP (`Emulation.setCPUThrottlingRate`), then a
  Chromium trace over the whole run.
- 20 taps (`touchscreen.tap`) that cycle across the segments, 700ms apart.
  For each tap: the main thread `RunTask` events that start in the 600ms
  after it, and the longest one. Median, max, and how many taps go over
  50ms and 100ms.
- Two numbers per tap: wall time (`dur`) and main thread CPU time (`tdur`)
  of the costliest task. The machine is shared with three other lanes (load
  15 to 26 on 4 cores during every run), so wall time includes waits for a
  core; CPU time does not.
- In the development build the probe also counts the style and layout
  passes the slide code forces: a style recalc or layout whose JS stack
  holds `helpers/indicator.ts`, `helpers/nav-ink.ts` or `ToggleGroup.tsx`.
  This count does not depend on the load.
- Fixtures:
  - `group`: `/c/toggle-group?case=one`, the single choice ToggleGroup
    alone, taps on its three items in turn.
  - `stage`: `/interactions?focus=tab-slide`, two Tabs lists, a
    SegmentedControl and a ToggleGroup; taps on the ToggleGroup items.
  - `control`: `/c/toggle-group?case=many`, a multiple choice ToggleGroup
    with the same item markup and no pill: the cost of a press without any
    slide.
- Builds: the gallery production build (`vite build`, served by `vite
  preview`) before and after the change, runs interleaved by style; and the
  Vite dev server with the change taken out for the before run, then put
  back.

## Results

Production build, 20 taps per row, 4x CPU, Pixel 7. Times in ms.

| Style | Fixture | Before: median / max (wall) | Before: median / max (CPU) | After: median / max (wall) | After: median / max (CPU) | Pill landed |
| --- | --- | --- | --- | --- | --- | --- |
| Neutral | group | 148 / 305 | 119 / 178 | 154 / 290 | 117 / 172 | 20 of 20 |
| Neutral | stage | 220 / 358 | 167 / 251 | 191 / 347 | 168 / 251 | 20 of 20 |
| Neutral | control (no slide) | 111 / 185 | 79 / 159 | 95 / 151 | 82 / 126 | not applicable |
| Liquid | group | 139 / 420 | 116 / 184 | 153 / 279 | 115 / 175 | 20 of 20 |
| Liquid | stage | 222 / 366 | 166 / 256 | 215 / 327 | 164 / 294 | 20 of 20 |
| Liquid | control (no slide) | 114 / 221 | 83 / 122 | 97 / 140 | 72 / 108 | not applicable |

Development build, forced passes from the slide code over 20 taps:

| Style | Fixture | Before: style / layout passes | After: style / layout passes | Before: CPU median | After: CPU median |
| --- | --- | --- | --- | --- | --- |
| Neutral | group | 38 / 38 | 19 / 19 | 174 | 184 |
| Neutral | stage | 39 / 39 | 18 / 18 | 285 | 271 |
| Liquid | group | 40 / 40 | 20 / 20 | 181 | 168 |
| Liquid | stage | 38 / 38 | 20 / 19 | 275 | 282 |

Landing: in every run the pressed item is `data-state="on"` and the pill's
center sits within 2px of the item's center once the slide ends (20 of 20
per row). The clips show 6 taps each at real speed in Neutral and Liquid.

## What the numbers say

- The change does what the order asks: a press now forces one style pass
  and one layout from the slide code instead of two of each, in the group
  alone and with the other lists of the stage. Before, `followIndicator`
  started the slide (a write) and `playInk` then read the root box again,
  which forced a second pass.
- The time saved is small next to the rest of the press and is lost in the
  noise of a loaded machine: the medians move by less than the spread
  between runs.
- The acceptance target (median long task under 50ms, none over 100ms) is
  not met, and it cannot be met from ToggleGroup's code. The control press,
  the same item with no pill, no slide and no ink, already costs 72 to 83ms
  CPU median at 4x in the production build. A trace of the press task
  shows where the time goes: the mouse events Chrome sends after a tap
  (mousedown, focus, click), React's render and commit, the ripple read in
  `ButtonBase.tsx` on pointerdown, and six to eight style recalcs of 4 to 75
  elements that each cost 5 to 35ms at 4x. The style cost per element is
  high (about 0.5ms at 4x), which points at the shared CSS, not at the
  slide.

## Open

- The 50ms target needs work outside this order's files: the style cost
  per element in `packages/css` (selector and custom property load), the
  ripple's forced reads in `Button/ButtonBase.tsx`, and a quiet machine to
  measure on. A rerun on a quiet machine may move every number, but not
  below the control press.
- The before and after timings were taken at a load of 15 to 26 on 4 cores.
  The CPU time column holds up better than wall time, but a rerun on a
  quiet machine is still needed for a firm number.
- The recording here is a Playwright clip at the Pixel viewport, not the
  recording pack of R0.9 (not built yet), so it is not a phone recording
  the owner signs.
- R0.4 (Angular) can start from the same pattern after this review.
