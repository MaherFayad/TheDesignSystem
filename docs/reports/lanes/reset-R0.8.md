# R0.8 Perception gate

Status: built. The gate runs with one command, reproduces the motion audit's
calls (9 of 20 invisible, 4 wrong, 7 fine, each component the same as the
audit) and 41 of its 43 numbers within 10 percent; the two that miss are
explained below. `npm run check`: see "Check" at the end.

Every timing in this report was taken while the machine was loaded by other
lanes (load average 17 to 30 on 4 cores, given per run). Latencies read
longer than on an idle machine; the "at release" finding does not depend on
load.

Evidence: `docs/reports/reset/R0.8/calibration/` (the calibration run) and
`docs/reports/reset/R0.8/baseline/<style>-auto-<phone>/` (the baseline), each
with `table.md` (numbers and sentences) and `result.json` (every track that
changed, every animation, every check). 796 KB in all, largest file 290 KB.

## Files changed

New, in `packages/contract-tests/src/perceive/`:

- `run.ts`: the command. Starts the React gallery with the compare runner
  (`../compare/sources.ts`, `startSystem`) and stops it, opens each page with
  a phone profile and touch, records the gesture, analyses it, judges it on
  its profile, writes `table.md` and `result.json`. Exit 0 pass, 1 fail, 2 the
  gate could not run. Retries an interaction on a fresh context when Chromium
  drops a page under load.
- `sampler.ts`: the in-page frame sampler (every animation frame: box,
  own and effective opacity, area on screen, transform, colours, shadow,
  clip-path, filters, whether the element paints; pointer, touch and click
  times; every animation that starts).
- `gesture.ts`: CDP touch: tap, long press, drag, and `holdPointer`, which
  keeps a finger down and can read the page while it is held.
- `analyze.ts`: frames to numbers (latency, travel, scale, main change, fill
  and fade share, secondary reactions, cuts, dropped frames, the held press).
- `profiles.ts`: the rich and quiet profiles, the audit's call, the sentences.
- `sources.ts`: the Studio and Desk source numbers for the quiet profile, read
  from Figma-Killer-2 and GoBanana CSS with file and line.
- `catalog.ts`: the twenty interactions of the audit, with their gestures.
- `calibration.ts`: the audit's table as numbers and the comparison.
- `report.ts`, `types.ts`, `README.md`.
- `perceive.test.ts`: 28 unit tests on synthetic recordings (run by
  `npm run check`).

Also: root `package.json`, the `perceive` script line only:
`"perceive": "tsx packages/contract-tests/src/perceive/run.ts"`.

## How to run

```sh
npm run perceive -- --component button --style neutral --platform android
npm run perceive -- --sample --style neutral,liquid --platform auto --device pixel,iphone
npm run perceive -- --component button,switch --style studio,desk --platform auto --device pixel,iphone
npm run perceive -- --calibrate
```

The plan form `--component <slug> --style <id> --platform <id>` works as
written. `--platform auto` leaves the key out so the page detects the phone
(R0.10); the Pixel profile got `android` and the iPhone profile `ios` in
every baseline run.

## Acceptance, and how each was proven

1. **The audit's table within 10 percent, on today's tree, Neutral, Pixel.**
   `npm run perceive -- --calibrate` (Neutral, platform web as the audit
   had, Pixel 7 profile, touch, real time). Load average 20.1 at the start.
   41 of 43 numbers within 10 percent
   (`docs/reports/reset/R0.8/calibration/calibration.md`). The two named in
   the order:
   - Button press: scale 1 to 0.98 (the gate reads a 0.02 change), 70ms,
     starts at release: all three match.
   - Dialog rise: 4px (gate 4px), scale 0.98 (gate 0.98).
   The two that miss:
   - SegmentedControl pill travel: audit 55px, gate 49.4px. The tree changed
     after the audit: commit 036dbfe6 (order R0.18, 2026-11-16) narrowed the
     items on a phone (`SegmentedControl.css`, `padding-inline:
     var(--ds-space-2xs)` under 30rem), so the pill has less far to go. Its
     158ms matches.
   - CopyButton press: audit 0.987 (0.7px a side), gate no shrink at all.
     The button's transform transition does start at release (70ms, listed in
     the animations), but on two dense reruns (frames 15 to 20ms apart) the
     drawn width never left 156.45px. I could not find the cause; the
     component files have no commit since 2026-11-13. Either way the audit's
     own reading was below what a person sees.
   Two audit rows were read in a more exact way than the table's summary
   words, and the reading is in `calibration.ts`: Checkbox ("fill 90ms, check
   72ms after 45ms") is checked as three numbers, all equal; Radio ("dot 0.5
   to 1 over 100ms") is checked as the dot's fade (100ms) and its start scale
   (0.5); its scale spring takes 200ms, which the audit's own data file also
   shows (indicator span 207ms in `live.pixel.neutral.json`).
2. **9 of 20 invisible and 4 wrong, as the audit did.** Same run: 9
   invisible, 4 wrong, 7 fine, and every component gets the audit's word
   (table at the end of `calibration.md`). The call is rebuilt from numbers
   (`profiles.ts`, `auditCall`): wrong when something that paints jumps 8px
   or more, appears or vanishes in one frame with no animation behind it, or
   when the control only changes after the click through emulated hover (no
   ARIA or data state changed); fine when the headline moves or resizes 4px
   or more (for a surface that opens, also 5 percent of its own size, since a
   short rise on a big panel reads as a fade), or changes fill or fades its
   content over 30 percent of the control, for 150ms or more; invisible
   otherwise. The four wrong: Tabs (the panel text vanishes and the new one
   appears in one frame), Tooltip (appears in one frame 541 to 600ms into the
   long press, audit 556ms), Accordion (the items below jump 49px in one
   frame, audit 49px), Card (its only change starts 296ms after the finger
   lands, after the click, with no state change).
3. **Numbers a person can picture, never token names.** Each `table.md` has
   sentences such as "The thumb moves 25px, shrinks to 0.667 over 158ms",
   "The first visible change comes 113ms after the finger lands, when the
   finger lifts", "Held for 631ms, the press shows nothing while the finger
   is down". A grep for `--ds-`, `duration.`, `distance.` and
   `spring-snappy` in `docs/reports/reset/R0.8/` finds nothing. Easing is
   given as the CSS curve the browser runs, cut to 40 characters.
4. **The R0.7 gap: press between pointer down and pointer up.** Every
   pressable is also held down for 600ms (`holdPointer`), and the gate reads
   when the press look starts and how long it shows while the finger is
   down. The hold is timed from the page's own `pointerdown`, so a page that
   sees the finger late under load still gets the full hold. On today's tree
   the press never shows while the finger is down, in any style or phone
   (baseline, "held" column), which is the audit's suspect (i). `holdPointer`
   is exported for the compare runner; wiring a press step into
   `compare/run.ts` is in R0.7's files, so I left it (see "Left open").

## Baseline on today's tree (what R3 has to beat)

Gesture: a 90ms tap, then a separate 600ms hold for pressables. Platform
`auto`: the Pixel 7 profile detected `android`, the iPhone 15 Pro profile
`ios`. Latency is from `pointerdown` to the first frame that differs; "R"
means the change began at or after the finger lifted. Main is the headline's
main change. Held is how long the press showed during the 600ms hold.
Load average at the start of each run in the heading.

Rich profile, Neutral (Pixel load 17.9, iPhone load 17.3):

| Interaction | Phone | Latency | Headline | Moves | Scale | Main | Fill | Others react | Cuts | Held | Fails |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button press | Pixel | 116ms R | button | 0px | 1 | 180ms | 100% (Delta E 12) | 0 | 0 | 0ms | latency, duration, secondary, meaning, held |
| Button press | iPhone | 131ms R | button | 0px | 1 | 70ms | 100% (Delta E 12) | 0 | 0 | 0ms | latency, duration, secondary, meaning, held |
| Switch | Pixel | 113ms R | thumb | 25px | 0.667 to 1.167 | 158ms | 69% | 2 | 0 | 0ms | latency, duration, held |
| Switch | iPhone | 118ms R | thumb | 17.4px | 1 to 1.3 | 158ms | 57% | 2 | 0 | 0ms | latency, duration, held |
| Checkbox | Pixel | 155ms R | indicator | 0px | 1 | 225ms | 0% | 0 | 0 | 0ms | latency, size, secondary, meaning, held |
| Checkbox | iPhone | 114ms R | indicator | 0px | 1 | 225ms | 0% | 0 | 0 | 0ms | latency, size, secondary, meaning, held |
| Tabs | Pixel | 145ms R | pill | 97px | 0.888 to 1.079 | 158ms | 0% | 1 | 2 | 0ms | latency, duration, meaning, held |
| Tabs | iPhone | 123ms R | pill | 88.8px | 0.878 to 1.074 | 158ms | 0% | 1 | 2 | 0ms | latency, duration, meaning, held |
| Toast | Pixel | 307ms R | toast | 68.1px | 1 | 180ms | 0% | 2 | 0 | | latency, duration, meaning |
| Toast | iPhone | 184ms R | toast | 64px | 1 | 180ms | 0% | 5 | 0 | | latency, duration, meaning |
| Dialog open | Pixel | 212ms R | panel | 0px | 0.97 to 1 | 180ms | 0% | 11 | 0 | | latency, size, duration, meaning |
| Dialog open | iPhone | 868ms R | panel | 0px | 1.15 to 1 | 200ms | 0% | 10 | 0 | | latency, meaning |

Rich profile, Liquid (Pixel load 16.8, iPhone load 24.0):

| Interaction | Phone | Latency | Headline | Moves | Scale | Main | Fill | Others react | Cuts | Held | Fails |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button press | Pixel | 122ms R | button | 0px | 1 | 320ms | 0% | 0 | 0 | 0ms | latency, size, secondary, held |
| Button press | iPhone | 142ms R | button | 0px | 1 | 320ms | 0% | 0 | 0 | 0ms | latency, size, secondary, held |
| Switch | Pixel | 152ms R | thumb | 22px | 0.667 to 1.089 | 375ms | 0% | 2 | 0 | 0ms | latency, meaning, held |
| Switch | iPhone | 135ms R | thumb | 17.4px | 1 to 1.202 | 375ms | 0% | 2 | 0 | 0ms | latency, meaning, held |
| Checkbox | Pixel | 181ms R | indicator | 0px | 1 | 400ms | 0% | 0 | 0 | 0ms | latency, size, secondary, held |
| Checkbox | iPhone | 128ms R | indicator | 0px | 1 | 400ms | 0% | 0 | 0 | 0ms | latency, size, secondary, held |
| Tabs | Pixel | 124ms R | pill | 98.5px | 0.887 to 1.113 | 296ms | 0% | 1 | 2 | 0ms | latency, meaning, held |
| Tabs | iPhone | 175ms R | pill | 90.2px | 0.877 to 1.158 | 296ms | 0% | 1 | 2 | 0ms | latency, meaning, held |
| Toast | Pixel | 476ms R | toast | 68.1px | 1 | 375ms | 0% | 4 | 0 | | latency |
| Toast | iPhone | 183ms R | toast | 64px | 1 | 375ms | 0% | 4 | 0 | | latency |
| Dialog open | Pixel | 433ms R | panel | 0px | 0.92 to 1 | 300ms | 0% | 4 | 0 | | latency, meaning |
| Dialog open | iPhone | 796ms R | panel | 0px | 1.15 to 1 | 496ms | 0% | 3 | 0 | | latency, meaning |

Quiet profile, Studio and Desk, against the source numbers of `sources.ts`
(Studio Pixel load 27.0, iPhone 27.1; Desk Pixel 29.1, iPhone 29.1):

| Style | Interaction | Phone | Latency | Travel (source) | Scale (source 1) | Main (source) | Easing (source ease) | Held | Fails |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Studio | Button press | Pixel | 150ms R | 0px (0) | 1 | 120ms (150) | cubic-bezier(0.4, 0, 0.2, 1) | 0ms | latency, duration, easing, held |
| Studio | Button press | iPhone | 151ms R | 0px (0) | 1 | 70ms (150) | cubic-bezier(0, 0, 0.58, 1) | 0ms | latency, duration, easing, held |
| Studio | Switch | Pixel | 144ms R | 25px (15) | 0.667 | 120ms (150) | cubic-bezier(0.16, 1, 0.3, 1) | 0ms | latency, travel, scale, duration, easing, held |
| Studio | Switch | iPhone | 210ms R | 17.4px (15) | 1.3 | 100ms (150) | cubic-bezier(0, 0, 0.58, 1) | 0ms | latency, travel, scale, duration, easing, held |
| Desk | Button press | Pixel | 168ms R | 40px label roll (0) | 1 | 320ms (150) | cubic-bezier(0, 0, 0.58, 1) | 0ms | latency, travel, duration, easing, held |
| Desk | Button press | iPhone | 118ms R | 43.5px label roll (0) | 1 | 320ms (150) | cubic-bezier(0, 0, 0.58, 1) | 0ms | latency, travel, duration, easing, held |
| Desk | Switch | Pixel | 136ms R | 25px (22) | 0.667 | 300ms (120) | cubic-bezier(0.16, 1, 0.3, 1) | 0ms | latency, travel, scale, duration, easing, held |
| Desk | Switch | iPhone | 131ms R | 18.8px (22) | 0.913 to 1.227 | 380ms (120) | a linear() spring | 0ms | latency, travel, scale, duration, easing, held |

What the baseline says, in plain words:

- Nothing changes while the finger is down, in any style, on either phone:
  every press waits for the finger to lift (110 to 210ms after it lands
  here, under load), and a 600ms hold shows no press at all.
- Neutral and Liquid buttons do not move: the press is a colour change (and
  on Android Neutral a fill sweep) with nothing else reacting.
- The switch is the best of the six: the thumb travels 17 to 25px and grows,
  and the track colour answers. In Neutral it is over in 158ms; Liquid's
  375ms is long enough, but it still starts at release.
- The checkbox does not move at all; its change is a colour fill inside a
  12px box.
- Tabs still swap the panel in one frame (two cuts per tap).
- The dialog on Android grows from 0.97 with no rise; on iOS it shrinks from
  1.15. Neither travels.
- Studio and Desk do not equal their sources yet (that is R1's work): the
  platform layer moves the switch thumb further than either source and grows
  it, Desk rolls its button label 40px where GoBanana has no transform, and
  every duration and curve differs from the source's 150ms (120ms for the
  Desk switch) `ease`.

## Limits of measuring perception in headless Chromium

- **Load.** The machine ran other lanes at a load average of 17 to 30 on 4
  cores. Frames still came at a median of 16.7ms, but each run dropped some
  (gaps of 50ms or more; counted per interaction in `table.md`), and latency
  moved from run to run: the Slider drag read 26 to 268ms and a Button tap
  31 to 167ms across reruns before the hold was timed from the page's
  `pointerdown`. With that fix the finger stayed down 94 to 164ms of the
  asked 90ms. Read latencies here as an upper bound; "at release" holds
  either way.
- **Touch is emulation.** CDP touch events go through Chromium's touch
  emulation, where `:active` arrives at release (audit suspect i). A real
  Android or iOS browser may set it while the finger is down. The device
  check of plan section 3 has to settle press timing under a real finger.
- **No WebKit.** The iPhone profile is a viewport, a scale and a user agent
  in Chromium. iOS Safari is not measured (the one WebKit download allowed by
  plan approval 9 is not wired here).
- **Software GPU.** Blur and glass draw on the CPU; their cost and look are
  not what a phone shows.
- **What the sampler cannot see.** Pseudo-elements are known only through
  their animations (a halo on `::before` does not count as a moving part).
  Inside an SVG only the outer box is read, so a glyph that pops inside a
  fixed box reads as no movement (the CopyButton icon pop). A clip-path reveal
  counts the element's whole box as changed fill. A steps() transition is
  not taken as the main change unless it is the only one, since it jumps
  once at its end.
- **Judgement in the numbers.** "Headline", "secondary" and "carries
  meaning" are defined by rules in `profiles.ts` and `analyze.ts` and
  calibrated on the audit. They can still disagree with a person; the
  recording pack (R0.9) and the owner's eye remain the acceptance.
- **Sound and haptics** are not measured.

## Decisions made

1. Output goes to `docs/reports/reset/perceive/<style>-<platform>-<device>/`
   by default, like compare's `docs/reports/reset/compare/<id>/`; this
   order's evidence was written with `--out` under
   `docs/reports/reset/R0.8/`.
2. `--platform auto` is the default, so a run sees what a phone gets
   (ruling 7). The calibration uses `web`, as the audit did.
3. A surface that opens is judged by itself: its parts that stagger in are
   secondary reactions, not the headline.
4. For a control, the headline is the named part unless something inside it
   moves 3px more (Desk's rolling label).
5. The main change is the longest of the animations that start first on the
   headline, steps() transitions set aside.
6. Moves are measured against the nearest tracked ancestor that paints, so a
   part carried by a wrapper that draws nothing still shows its own jump; a
   box that only grows from its start edge does not count as a jump.
7. A one frame appearance with an animation on the element or an ancestor is
   not a cut. A dropped frame is noted but does not excuse a cut that has no
   animation behind it.
8. The quiet profile's source numbers are read from the source CSS, not
   measured, and say so in `sources.ts`.
9. The held press passes when it shows within 32ms of the finger and for 95
   percent of the hold; it is checked in both profiles.

## Left open

- **Compare press step.** `holdPointer` exists and is tested; adding a
  `hold` step to `compare/types.ts`, `pair.schema.json` and `runStep` in
  `compare/run.ts` (probe while the finger is down through `whileHeld`) is a
  change to R0.7's files, so I did not make it.
- **SegmentedControl and CopyButton numbers** in the calibration (above).
  The CopyButton press that no longer draws is worth a look by the order that
  owns it.
- **Source numbers measured, not read.** A later order can run the gate on
  GoBanana (compare's GB runner) and the FK2 harness to replace the CSS
  readings in `sources.ts`.
- **Ripple latency.** The 182ms Android allowance applies when the first
  change is on a part named `ripple`; today's Android press has no such part
  (its sweep is a clip-path on the button), so it is judged at 32ms.
- **A calm machine.** The baseline should be rerun once when the load is
  low, to give R3 latency numbers without load in them.

## Check

`npm run check` on the final tree, load average about 24 on 4 cores: 11 of
13 steps pass (tokens build, gen, typecheck, eslint, manifests and every
workspace check but Angular). Two fail, both outside this order's files:

- vitest: 1 of 2733, `packages/tokens/tests/mapping.test.ts` ("every row
  points at a token that exists"). Rerun alone with the perceive tests: 32 of
  32 pass. In an earlier full run the two `packages/cli/src/main.test.ts`
  tests timed out at 5000ms under load and passed when rerun alone.
- `check @the-system/angular`: Angular specs that differ from run to run
  (final run: `switch.round3.spec.ts` drag, 4 tests, and `tag-field.spec.ts`
  Enter; earlier runs: `dropdown-menu.round3.spec.ts` exit copy and
  `slider.motion.spec.ts`). Angular is not in this order and other lanes work
  in it now; I did not touch it.

The perceive tests (28) pass in every run, and typecheck and eslint are
clean on `packages/contract-tests/src/perceive/`.
