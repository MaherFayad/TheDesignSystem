# Final fixes, order 1.29

ds-component, 2026-11-13, branch `claude/ds-order-1-29`. Two items from
`final.md`: the React Popover race and the `tab-slide` long task (B14).
Every probe ran on production builds of the React gallery (`vite build`,
served with `vite preview`). "Before" is a build with the HEAD sources of
`Popover.tsx` and `Tabs.tsx`. Before and after ran one after another on
the same machine. Load is the 1 minute average on 4 CPUs.

## 1. Popover: a closing popover took focus back from a new one

Cause. Radix's non modal Popover returns focus to its trigger in
`onCloseAutoFocus`, which runs after the exit, when the content unmounts,
unless the handler calls `preventDefault`. Our handler saw that focus was
already somewhere else (inside popover B) and returned early without
calling `preventDefault`. Radix then focused A's trigger, and B's dismissable
layer closed B because focus had moved outside it.

Fix (`Popover.tsx`, `onCloseAutoFocus`). If focus is on an element that is
not the body and is not inside the closing popover, call `preventDefault`
and leave focus where it is. If Escape closes a lone popover, focus is on the
body when the content unmounts, so focus still goes back to the trigger
(WCAG 2.4.3). The existing test "closes on Escape and returns focus to the
trigger" still passes, and so does the anchor only fallback test.

Proof:

- Unit test `order 1.29 race: a popover closed by Escape does not take focus
  back from a popover opened since` (`Popover.test.tsx`). In one act,
  Escape closes A and a click opens B, before A's deferred focus return
  runs. It failed before the fix (no popover open, B dismissed) and passes
  after.
- Probe `final.popover-race.cjs` at 6x CPU, 3 runs of 72 opens each:
  before, **6 of 216 missed** (`final.popover-race.before.json`, load 1.02
  to 1.78). After, **0 of 216 missed**, slowest open 776ms
  (`final.popover-race.after.json`, load 0.82 to 1.11).
- `npm run contract -- --framework react --component Popover` three times:
  57 passed, 0 failed, 0 skipped each time.

## 2. tab-slide (B14)

### What changed

- `TabsPanel` (`Tabs.tsx`). Radix Tabs Content keeps every panel element
  and hides inactive panels through Presence. On every switch, Presence
  read `getComputedStyle(panel).animationName` in a layout effect for the
  panel it left and the panel it reached. That forced a restyle right after
  the commit. Presence then swapped `hidden` and the content in a second
  commit, which made the styles stale again. The panel now passes
  `forceMount` to Radix, so Presence never changes, and sets
  `hidden={props.hidden ?? !active}` and its content (only when active)
  itself, in the first commit. The DOM is the same as before: every panel
  element stays, and inactive ones are hidden and empty. A consumer's
  `forceMount` still goes straight to Radix, as before. So Radix's
  Presence read is avoidable without changing Radix.
- Keep in view (`Tabs.tsx`, `inFrame` job). The check now runs only when the
  list overflows (`scrollWidth > clientWidth`, or the height pair when
  vertical). Those reads come first in the job, inside the shared read phase.
  A list that fits reads no box of its own and sets no scroll offset, so the
  job writes no style before the ink reads. I used no ResizeObserver. The
  overflow reads cost nothing once the read phase has run its one restyle,
  and a cache would go stale when a label or count changes.
- `nav-ink.ts` and `indicator.ts` are unchanged.

Tests (each failed before):

- `order 1.29 B14: a switch forces no Presence style read and swaps the
  panels in one commit`: counts `animationName` reads on panels during a
  switch. 2 before, 0 after. It also checks the panel DOM: hidden, state,
  content.
- `order 1.29 B14: a list that fits reads no box and sets no scroll offset
  for the keep in view check`: the list's `getBoundingClientRect` is read 3
  times per switch before and 2 after (both from the ink, planFollow and
  planInk). No `scrollLeft` write.
- `forceMount keeps every panel rendered, as Radix does`: guards the
  passthrough.
- The existing keep in view test now gives the list an overflow (740px of
  tabs in 300px), because a list that fits is no longer scrolled. Its mocks
  are restored in `finally`. Before, a failure there left
  `getBoundingClientRect` mocked and broke the next test too.

### Numbers

`perf.cjs`, `tab-slide` and `button-press`, 5 runs each, 4x CPU, 390 by 844
touch, scheme light. Median largest long task in ms, with the runs:

| Build | Liquid tab-slide | Neutral tab-slide | Liquid button-press | Neutral button-press | Load |
| --- | --- | --- | --- | --- | --- |
| `final.perf.md` (3 runs, earlier) | 299 | 246 | 61 | 53 | 0.5 to 1.9 |
| before (HEAD) | **317** (246, 255, 317, 324, 356) | **333** (248, 333, 341, 336, 251) | 63 | 2 of 5 runs over 50 | 1.0 to 1.6 |
| after (this order) | **268** (259, 230, 269, 313, 268) | **237** (344, 213, 312, 228, 237) | 59 | 66 | 1.1 to 1.9 |
| after plus ToggleGroup in `inFrame` (prototype, not kept) | **227** (260, 209, 303, 196, 227) | **188** (181, 188, 219, 177, 193) | 53 | 65 | 0.3 to 1.1 |

Dropped frames: before 23 and 20, after 18 and 19, prototype 15 and 12
(Liquid and Neutral). Data: `final.perf.tab-slide.after.json` (keys
`before`, `after`, `toggleGroupPrototype`, each with the load).

**Not under 50ms.** After this order, the task is 15 to 29 percent shorter
than before on the same machine.

### Where the rest goes

I traced the after build, unminified, once in Liquid with
`devtools.timeline.stack`. The task was 370ms with the tracer on. Inside
the click:

1. React render and commit (about 35ms), then a **full restyle of 125
   elements (60ms) forced by `slidesOn` (`getAnimations`) inside
   `followIndicator`, which `ToggleGroup.tsx:147` calls synchronously in its
   layout effect**. ToggleGroup does not use `inFrame`, so it reads and
   writes inside the commit.
2. The shared `inFrame` flush (Tabs, SegmentedControl). Its first read, the
   Tabs overflow check, pays **another full restyle of 125 elements (55ms)**,
   because ToggleGroup's writes made the styles stale again.
3. After the writes, the frame's own restyle: **137 elements, 74ms**. The ink
   twins add 12 elements.

The Presence restyles are gone. I prototyped ToggleGroup on `inFrame`
(`planFollow`, then `planInk` with the writes in the returned function, as
Tabs does). I built it to a scratch folder and put the file back to HEAD.
Its 18 tests passed. The traced task fell from 370 to 230ms with the tracer
on, and two full restyles were left: the read phase (55ms, which the commit
itself requires) and the frame's (39ms). Its medians are the last row of
the table.

The floor at 4x is roughly one press (`button-press`, 53 to 66ms) plus one
React commit for four lists plus two restyles of the stage. So 50ms is not
reachable for this stage by moving reads. Getting there would need a smaller
restyle: the frame restyle after the ink writes covers the whole stage, not
only the twins. I did not find which selector widens it. No `:has()` rule in
`packages/css` matches these parts.

### Kept green

- `tabs-ink.probe.cjs` on the after build: B1 passes in all 8 style and
  scheme pairs (lowest 4.44, Desk light), and B2 draws 0 twins with selected
  label contrast 9.61 or higher. Output: `final-fixes.tabs-ink.json`.
- N30 is covered by `nav-ink.test.ts`. Those tests and `indicator.test.ts`
  pass (24 tests).
- `npm run contract -- --framework react --component Tabs,SegmentedControl`:
  Tabs 37 and SegmentedControl 37 passed, 0 failed.

## npm run check

Pass, all 13 steps (vitest 83.9s).

## Files

- `packages/react/src/components/Popover/Popover.tsx`, `Popover.test.tsx`
- `packages/react/src/components/Tabs/Tabs.tsx`, `Tabs.test.tsx`
- `docs/reports/fixes/interactions-3/final-fixes.md` (this report),
  `final.popover-race.before.json`, `final.popover-race.after.json`,
  `final.perf.tab-slide.after.json`, `final-fixes.tabs-ink.json`

There are no new hooks and nothing was renamed. The Angular DOM is untouched,
and the React panel DOM is unchanged.

## Decisions

- The Popover rule is "focus moved elsewhere", not "another popover
  opened". It also covers a person who tabs on or clicks a field while A
  exits.
- The TabsPanel change uses Radix `forceMount` and sets `hidden` and the
  content itself, rather than a panel of our own, so the ids and
  `aria-controls` stay Radix's.
- The keep in view check uses a plain overflow read and no ResizeObserver
  cache (see above).

## Changes needed from the lead

- `packages/react/src/components/ToggleGroup/ToggleGroup.tsx`, the layout
  effect at line 136: move `followIndicator` and `playInk` into `inFrame`
  with `planFollow` and `planInk`, as Tabs and SegmentedControl do, and
  update `inkLabel.current` in the write. Measured above: tab-slide 268 to
  227ms (Liquid) and 237 to 188ms (Neutral), and one fewer full restyle per
  press. The Angular toggle group should get the same change for parity of
  timing. Its DOM does not change.
- Pre-existing doc mismatch: the `TabsPanel` doc comment says that with
  `forceMount` inactive panels "are hidden". Radix renders them visible, and
  this order keeps that. The comment, and the manifest if it says the same,
  should be corrected by whoever owns the manifest.
