# Final proofs, order 1.29

ds-qa, 2026-11-13, branch `claude/ds-order-1-29`. The source tree is
a49feaa for every step. The only commit during the run was f249c45, which
adds `final.check.txt`. Load is the 1 minute average on 4 CPUs. A
recordings agent and other dev servers (5181, 5191) were running at the
same time. My servers used ports 5195 to 5199 only.

## 1. npm run check

Pass, all 13 steps, exit 0 (13:29 UTC, load 1.16 before and 2.29 after).
vitest: 200 files and 2576 tests at the root, 110 files and 744 tests in
`@the-system/angular`. No step was red, so nothing was rerun alone.
`gen` left no diff. Summary: `final.check.txt`.

## 2. Angular contract suite, full

Run against a static development build of the Angular gallery
(`ng build --configuration development`, index fallback, port 5195),
13:34 to 13:53 UTC, load 1.22 at the start and 7.73 at the end.

**2278 passed, 0 failed, 69 skipped**, the same counts as the previous
report. The skips are 48 axe open, 12 target size open, 8 keyboard map
notes, and Theme (no demo case). Reports: `docs/reports/contract-angular.json`
and `final.contract-angular.json`.

## 3. Screenshot compare, React with Angular

Both matrices were captured again on this tree first, because the
committed ones dated from 07:49. React used a production build (port 5196),
2376 shots. Angular used the static build, 1312 shots. Load was 5.5 to 7.5.

**1312 pairs, 1312 pass, 0 fail. 1256 pairs are pixel equal and 56 differ
by 1 to 1231 pixels (at most 0.120 percent). 1064 shots are only in React,
from 51 components that are `planned` for Angular, TitleBar and
WindowControls among them.**

Every one of the 56 differences comes from the React production CSS
build. The 8 components were captured again from the React dev server, and
all 200 of their pairs are pixel equal.

One real bug in the build, not in parity. Vite's CSS minifier rewrites
`:dir(rtl)` into a `:lang(ar, he, ...)` fallback. So `Input.css:277`
right aligns a url field inside a `dir="ltr"` InputGroup on an Arabic page
(24 InputGroup pairs). The production CSS has 109 rewrites from 46
`:dir(rtl)` rules. The CheckboxGroup `data-enter` gap does not show, because
shots are taken after the enter has settled. Details:
`final.shots-compare.md`.

The capture also rewrote the kept subset in
`docs/reports/shots/matrix/react` and `.../angular`, plus the compare folder
(683 files). The React kept shots now come from the production build.
Whether to commit them or check them out again is up to the lead.

## 4. Performance

Started at 14:59 UTC when the load dropped to 1.42. It stayed between 0.51
and 1.88 throughout. Production React build, 3 runs per interaction, 4x
CPU, 390 by 844 touch. Every long task row is lower than in the review,
which used the development build. The button press baseline moved 73 to
61ms (Liquid) and 114 to 53ms (Neutral) on the build alone.

**`tab-slide` is not under 50ms.** The median largest task is 299ms in
Liquid and 246ms in Neutral (821 and 1030ms in the review). The CPU profile
shows the time is style recalculation, 170 to 189ms of the task, with three
full recalcs of 125 to 137 elements at 41 to 53ms each. Two of them are
forced right after the commit:

- Radix Presence `getComputedStyle().animationName` (52ms).
- The first `getBoundingClientRect` in the Tabs `inFrame` keep in view job
  (`Tabs.tsx:221`, 53 to 56ms).

The ink code itself is about 15ms. `toast-expand` still has 11 to 16 long
tasks, but the largest fell from 558 to 232ms. Details and the table:
`final.perf.md`. Data: `final.perf.liquid.json`, `final.perf.neutral.json`,
`final.perf.tab-slide.*.profile.json`.

## 5. React contract suite, full

Run in two halves by component list (56 and 55 components), 15:10 to
15:53 UTC, load 5 to 12, then merged. Half B ran on a fresh server for the
same build, port 5199, because the 5196 server reached its 2 hour limit.

**4411 passed, 1 failed, 163 skipped.** The previous report had 3421
passed and 4 failed, the four List axe failures, which now pass. The skips
are 112 axe open, 28 target size open, 21 keyboard map notes, and Bidi and
Theme (no demo case).

The failure is `Popover: state attributes` (studio dark): trigger 4 "Open
popover on top" adds no open popover. Run alone, Popover failed again in
two other tests (anatomy desk, variant attributes), each with the same
message for another trigger. So this is not a fixed test failure. It is a
timing race in the React Popover, and `final.popover-race.cjs` shows it:

1. Escape closes popover A.
2. A click opens popover B, and focus moves into B.
3. A's exit animation ends and A unmounts.
4. A then returns focus to its own trigger.
5. That focus outside dismisses B.

It is never seen at 1x CPU (72 opens). At 6x it happened in 7 of 216 opens
(`final.popover-race.json`). A real person can hit it by clicking a second
trigger within the exit time. Popover changed in this order (overlays
lane). The Angular suite passes for Popover. Reports:
`docs/reports/contract-react.json` and `final.contract-react.json`, with a
`merged` key that names the halves.

## 6. Switch frame contrast

`switch-contrast.cjs` against the React dev server (port 5198), 16:02 to
16:05 UTC, load 0.91 to 5.01. **144 runs, 0 under 3:1.** The worst is
3.23, Neutral dark web, drag from off at progress 0.25, the same as the
earlier final run. Seven runs are under 3.6: Desk dark web toggles at 3.34
and 3.46, Neutral dark drags at 3.23, and Neutral dark ios and android
toggle off at 3.43 and 3.52. A second pass on the production build
(`final.switch-contrast.prod.json`) gives the same result. Report:
`final.switch-contrast.json`.

## For the lead

- Popover open after Escape race (React): a real bug, timing dependent. It
  makes the React contract suite flaky under load.
- The Vite production CSS rewrites `:dir()` into `:lang()`, which is wrong
  for a `dir` that differs from the language. It needs a decision on the
  CSS build target.
- `tab-slide` is still 246 to 299ms at 4x. Getting it under 50ms needs
  fewer full restyles per click.
- The shots matrix folders were rewritten by the capture (see step 3).
