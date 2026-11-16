# R0.4 Tab slide long task, Angular

Order: `docs/plan/reset.md`, section 4, R0.4. Lane: ds-angular. Depends on
R0.3 and its review. Status: built. The pattern of R0.3 is ported and
proven; the 50ms number is not the target here (DECISIONS.md, "R0.3 accepted
for the pattern, timing moved to R0.17").

## Files changed

- `packages/angular/src/components/toggle-group/toggle-group.ts`: the single
  choice group no longer calls `followIndicator` and then `playInk` from its
  after render effect. The effect queues one frame job with `inFrame` that
  reads with `planFollow` and `planInk` and returns the writes
  (`plan.write()`, then the ink writer), the same code as
  `packages/react/src/components/ToggleGroup/ToggleGroup.tsx` after R0.3.
  The pill is passed to `planInk` as `indicator`, so a hidden pill draws no
  ink; the motion mode and axis are read when the job is queued, as React
  reads them in its layout effect. The header comment says so.
- `packages/angular/src/components/toggle-group/toggle-group.perf.spec.ts`
  (new): the performance fixture, a port of
  `ToggleGroup.perf.test.tsx`. It logs every box, style and animation read
  and every write of the motion code, and checks that a press reads
  everything before its first write: one press; twenty presses across the
  segments, with the pill on the pressed item each time; two ToggleGroups
  and a SegmentedControl that change in one render (Angular has no Tabs, so
  SegmentedControl, which also plans in `inFrame`, stands in for the Tabs
  list of the React case). Angular's own DOM inserts are told apart by an
  `@angular/` frame in the stack, as React's test filters `react-dom`.
- `packages/motion`: no change.

Evidence: `docs/reports/reset/R0.4/`.

## Acceptance

### The read then write pattern (the bar R0.4 is held to)

| Check | Old code | New code |
| --- | --- | --- |
| `toggle-group.perf.spec.ts`, one press | fail | pass |
| same, twenty presses, pill lands each time | fail | pass |
| same, two groups and a SegmentedControl in one render, three slides | fail | pass |
| Forced style passes from the slide code, 20 taps, dev build (Neutral group, stage; Liquid group, stage) | 26, 26, 26, 26 | 6, 6, 6, 6 |
| Forced layouts from the slide code, same runs | 40, 40, 40, 40 | 20, 20, 20, 20 |
| Pill landed on the pressed item (every run, every fixture) | 20 of 20 | 20 of 20 |

The old code was put back for the "old code" column only, then restored.
After the change a tap forces one layout from the slide code, where it
forced two; the control press (no pill) forces none in both builds.

### Trace at 4x CPU, Pixel 7, 20 taps

Probe: `docs/reports/reset/R0.4/tab-slide-trace.cjs`, the R0.3 probe with
one change: the forced pass count also matches the motion functions by name
(`planFollow`, `planInk`, `followIndicator`, `playInk`, `flushFrame`,
`follow`, `layerRect`, `liveLocal`), because the Angular bundles keep no
source path in a trace stack. Production builds (`ng build`) before and
after, served statically, runs interleaved by style. The machine was shared
with three other lanes (load 7 to 12 on 4 cores). Times in ms.

| Style | Fixture | Before: median / max (wall) | Before: median / max (CPU) | After: median / max (wall) | After: median / max (CPU) | Pill landed |
| --- | --- | --- | --- | --- | --- | --- |
| Neutral | group | 94 / 193 | 91 / 177 | 102 / 180 | 80 / 148 | 20 of 20 |
| Neutral | stage | 155 / 316 | 122 / 238 | 130 / 260 | 112 / 173 | 20 of 20 |
| Neutral | control (no slide) | 53 / 182 | 41 / 150 | 50 / 118 | 44 / 96 | not applicable |
| Liquid | group | 97 / 206 | 85 / 161 | 115 / 218 | 92 / 195 | 20 of 20 |
| Liquid | stage | 124 / 215 | 97 / 165 | 132 / 255 | 117 / 223 | 20 of 20 |
| Liquid | control (no slide) | 63 / 290 | 50 / 107 | 62 / 188 | 51 / 93 | not applicable |

Files: `before.prod.json`, `after.prod.json`, `before.dev.json`,
`after.dev.json`, and two raw traces (`after-prod.neutral.group.trace.json.gz`,
`after-prod.liquid.group.trace.json.gz`).

What the numbers say, as in R0.3: the change removes the second style pass
and layout of each tap, and that saving is smaller than the spread between
runs on a loaded machine. The 50ms median is not met and cannot be met from
ToggleGroup: the press with no pill already costs 41 to 51ms CPU median at
4x. The timing target belongs to R0.17.

### React against Angular, ToggleGroup

`npm run shots -- --compare react angular` diffs every PNG in both work
folders and rewrites the shared `docs/reports/shots/matrix/compare-react-angular/`.
To keep to this order's files the same capture and rule were run for
ToggleGroup alone: `npm run shots -- --framework <f> --component ToggleGroup
--out <scratch> --work <scratch> --keep all` for each framework, then
`docs/reports/reset/R0.4/compare-toggle-group.mjs` (pixelmatch threshold
0.1, at most 0.5 percent of pixels, sizes equal).

Result: 24 pairs, 24 pass, every pair 0 differing pixels
(`compare-toggle-group.md`). Both captures were byte stable, 24 of 24.

### Contract

`npm run contract -- --framework angular --component ToggleGroup`: 67
passed, 0 failed, 0 skipped.

### npm run check

One run after both orders: every step passed (vitest 2733 of 2733,
Angular 753 of 753 with the new perf spec). Details in the R0.12 report.

## Decisions made

- SegmentedControl stands in for Tabs in the "one render" test case, since
  Angular has no Tabs. It is the other Angular list that plans in
  `inFrame`, so the case still proves that reads of several lists come
  before any write.
- The shots compare was narrowed to ToggleGroup by a small script with the
  same rule, not by the shared compare folder.

## Open

- The 50ms target, as R0.3: R0.17.
- No landing clip was recorded; landing is measured (20 of 20 per row), and
  the phone recording waits for the R0.9 pack.
- The trace was taken on a loaded machine; a rerun on a quiet one is still
  needed for firm numbers, as in R0.3.
