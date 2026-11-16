# Review: reset phase R0, step 1 (R0.1, R0.2, R0.3, R0.5, R0.6)

Reviewer: ds-qa, fresh eyes. Review only: no source file changed, nothing
committed. Tree reviewed: commit `0598c2b9` (clean working tree when the
review started). All reruns ran in a scratch copy outside the repo
(`git archive 0598c2b9` plus a hard linked copy of `node_modules`), on a
machine shared with other lanes (load average 12 to 19 during most runs).

Grades: blocker, should fix, note.

## Summary

| Order | Verdict | Blockers |
| --- | --- | --- |
| R0.1 Contract changes | Pass | None |
| R0.2 Slider reflow at 320px | Pass | None |
| R0.3 Tab slide long task, React | Fail on its acceptance | `docs/plan/reset.md:342`: median long task under 50ms and none over 100ms is not met |
| R0.5 Gates wave 1 lacked | Pass | None |
| R0.6 CLI snapshot on a fixture | Pass | None |

`npm run check` on the clean scratch copy: every step passes (vitest 2608 of
2608, every workspace check), 4m38s in all. `npm run gen` writes the seven
layer statement into `packages/css/src/index.css` and leaves every tracked
file unchanged.

## R0.1 Contract changes for the reset (`dafa6967`)

What I checked: the diff of all 17 files; each of rulings 7, 8, 13 and 16 is
written as a rule with an example (`frameworks.md` "Hybrid native build" and
"Platform axis", `tokens.md` "Platform layer" and "Platform names",
`anatomy.md` "Cascade layers and the shape split", `style-pack.md` "Styles and
platforms"); the six order changes, the perceive profiles and the allowed
differences are in `DECISIONS.md`; `npm run gen` writes the new statement.

Layer statement: every hard coded copy in tracked files is the same seven
layers in the same order: `scripts/gen-index.ts:90`,
`packages/tokens/build.ts:627`, `packages/registry/src/build-registry.ts:29`,
`apps/docs/src/styles/system.css:19` (with `docs-base` first, as before),
`packages/tokens/tests/__snapshots__/tokens.css:2`,
`packages/css/src/index.css:2`, the five `packages/registry/files/*.css`,
`docs/contracts/anatomy.md:72`, and the message in
`packages/lint/src/rules/no-important.ts:20`.

Default platform: `auto` is the stated default in `frameworks.md:164` and
`:165`, `anatomy.md:312` and `DECISIONS.md` item 12. One line says otherwise
(below).

Should fix:

1. `docs/contracts/frameworks.md:140`: the `web` row says "The default."
   The same file (`:164` to `:165`) and `DECISIONS.md` item 12 say the
   outermost Theme with no prop is `auto`. Reword to "the fallback when
   `auto` detects nothing" so the table does not contradict the rule.
2. `docs/contracts/frameworks.md:181` to `:184`: "The server and the first
   client render use the value from steps 1 to 3, else `web`, so hydration
   matches". Step 3 is `localStorage`, which a server cannot read, so a
   stored `android` gives `web` on the server and `android` on the first
   client render: a hydration mismatch. `:165` and `DECISIONS.md` item 12
   say the server render uses `web` and the resolved value is stamped on
   mount. Make the two paragraphs say the same thing (server and first
   client render: explicit prop, else `web`; URL key and stored choice and
   device are applied on mount).
3. `DECISIONS.md:409`: the layer statement "is written in five places that
   must stay equal", but no test compares them (only the registry test checks
   its own files against `LAYER_ORDER`). A browser keeps the first statement
   it reads, so a drift is silent. Add a gate in `packages/lint` that reads
   the five places and fails when they differ (ds-qa can own it in R0.16).

Notes:

- `PLAN.md:257` still holds the five layer statement of wave 0. It is the
  owner's prompt and stays whole; a line in `DECISIONS.md` that the R0.1
  statement replaces it would stop a reader from following the old one.
- `docs/adoption/figma-killer-2.md:58` to `:59` and `docs/adoption/gobanana.md:87` to `:88`
  list the layers without `ds.platform` and `ds.chrome` (stale since before
  R0.1).
- `docs/contracts/tokens.md:186`: density and platform both write
  `size.control.*` at equal specificity, density later. On `ios`, compact
  density gives 28px controls unless the build writes
  `[data-platform][data-density]` for that platform. The text says "where it
  has them"; R0.13 should write them for every touch platform and density, or
  the touch target rule has a hole.
- `docs/contracts/anatomy.md:108`: "Toolbar, when it is a bottom toolbar" is
  on the chrome side, every other Toolbar on the controls side. The layer is
  chosen by selector, so the contract should name the attribute or part that
  marks a bottom toolbar before R4.15 builds it.

## R0.2 Slider and RangeSlider reflow at 320px

The order's code landed in the work in progress commit `dea57500`, not in
`ccac1a6d` (which holds only the R0.5 report, a follow up file and a perf test
tweak). Files touched: `packages/css/src/components/Slider.css`,
`Slider.tsx` (comments), `Slider.test.tsx`, `RangeSlider.test.tsx`. All inside
the order.

Reruns (production build of the React gallery, Chromium, 320 by 800):

| Run | Runs | With overflow | Largest overflow | Largest fill pass past the track |
| --- | --- | --- | --- | --- |
| Without R0.2 (`Slider.css` from `dafa6967`) | 96 | 16 (Desk and Liquid on `web`) | 10px | 36px |
| With R0.2, 4 styles by 2 schemes by 3 platforms by 2 directions, both pages | 96 | 0 | 0px | 0px (1776 tracks) |
| With R0.2, compact and comfortable as well | 192 | 0 | 0px | 0px (3552 tracks) |

`npm run contract -- --framework react --component Slider,RangeSlider`: 134
passed, 0 failed. Every number in the builder's report reproduced.

Fill box during a pull (my own drag, Pixel 7 viewport, `android`, past the
end and released): the fill box ends 0.1px inside the track in every frame,
in Desk, Liquid and Neutral, Slider and RangeSlider.

The behaviour change, judged by watching it: the fill now stops at the track
end and only the thumb travels on. In Desk the thumb is a thin bar; pulled
15px past the end it stands alone, with a clear gap between the end of the
fill and the bar. It reads as the thumb coming off the track, not as a rubber
band: broken looking. In Neutral the pull is 5px and hardly shows. In Liquid
the held thumb is a clear lens that headless Chromium barely draws, so I
could not judge it; a device recording is needed. On release the Desk bar
overshoots into the fill and settles, which reads fine.

Should fix:

1. The detached thumb in Desk while pulled (`Slider.css:206` to `:216` keep
   the fill in the track; the thumb's pull is unchanged). Either drop or cap
   the pull for Desk (R1.10 returns Desk to its source, and the source has to
   show whether it pulls at all), or let the track sit inset by the pull
   distance inside the control so the fill can follow without leaving the
   control box. Decide before the owner signs the recording.
2. A pull still widens a phone page while the thumb is past the end: my rerun
   measured a scroll width of 413 to 419 on a 412 viewport (Desk) and up to
   426 (Liquid RangeSlider), and the builder saw the emulated phone stay
   zoomed out after release. This is the same class of fault the order
   closes, only during a drag. It is logged for R3 in
   `docs/plan/reset-followups.md`; it should be picked up no later than R1.10
   and R3.5, since every phone recording will show it.
3. Stale text that still says the fill stretches:
   `packages/motion/src/interactions/fields.ts:538`, `:540`, `:577`, `:579`,
   and `packages/angular/src/components/slider/slider-base.ts:33`, `:497`.
   Logged for R3; the catalog is shown in the docs site, so it misleads now.

Notes:

- `packages/react/src/components/RangeSlider/RangeSlider.test.tsx:117`
  fails on any `inset-inline` anywhere in `RangeSlider.css`, for any part.
  Narrow it to the track `::before`.
- The two new tests read CSS text by string search; a reordered selector
  passes them by accident or fails them for nothing. The contract reflow run
  is the real proof.
- Evidence sits in `docs/reports/shots/reset/R0-2/`, not in
  `docs/reports/reset/R0.2/` as section 2 of the plan says. The recording is
  Playwright emulation, not the R0.9 pack; the order stays "built, waiting on
  the owner".

## R0.3 Tab slide long task, React

Files: `ToggleGroup.tsx` and the new `ToggleGroup.perf.test.tsx`, inside the
order. `packages/motion` unchanged.

The code change is right: ToggleGroup now plans in `inFrame` with
`planFollow` and `planInk`, the same pattern as Tabs. I ran the new fixture
against the old `ToggleGroup.tsx` from `dafa6967`: all 3 cases fail; against
the new one all 3 pass, and the ToggleGroup folder passes 21 of 21.

Trace rerun with the builder's probe against my production build (Pixel 7,
4x CPU, 20 taps, load 12 to 15):

| Style | Fixture | Wall median / max | Over 50ms | Over 100ms | CPU median / max | Pill landed |
| --- | --- | --- | --- | --- | --- | --- |
| Neutral | group | 128 / 300 | 20 | 14 | 113 / 166 | 20 of 20 |
| Neutral | control (no pill) | 86 / 130 | 20 | 3 | 79 / 119 | not applicable |
| Liquid | group | 144 / 231 | 20 | 19 | 130 / 211 | 20 of 20 |
| Liquid | control (no pill) | 98 / 174 | 20 | 10 | 87 / 150 | not applicable |

Blocker:

1. `docs/plan/reset.md:342`: "median long task under 50ms and none over
   100ms" is not met, by a factor of two to three. The builder says so and
   logs R0.17. A press with no pill already costs 79 to 87ms CPU, so the
   target cannot be met inside ToggleGroup, which matches the builder's
   finding. The order cannot be marked done on its own acceptance. The lead
   should either record in `DECISIONS.md` that R0.3 is accepted for the
   pattern change with the timing target moved to R0.17, or keep R0.3 open.

Should fix:

1. The slide still adds about 35 to 45ms CPU per tap over the control press
   (113 against 79 in Neutral, 130 against 87 in Liquid). R0.17 should
   measure the slide's share too, not only the shared press cost, or the
   target stays out of reach after the press is fixed.

Notes:

- The fixture logs `animate` and DOM inserts as writes, not
  `style.setProperty` or class changes. A read after an inline style write
  would pass it. Logging `CSSStyleDeclaration.prototype.setProperty` would
  close that gap.
- R0.4 can start from the same pattern; it inherits the same unmet timing
  target, so its acceptance at `docs/plan/reset.md:349` needs the same
  ruling.
- Timings ran on a loaded machine both for the builder and for me; a quiet
  rerun is still owed (logged).

## R0.5 Gates that wave 1 lacked

Files: `packages/lint/**`, `packages/contract-tests/**` and their fixtures,
inside the order.

Reruns:

- Reflow matrix without R0.2 (`Slider.css` from `dafa6967`), `npm run
  contract -- --framework react --component Slider,RangeSlider --grep
  sideways`: 64 tests, 16 fail (Desk and Liquid on `web` and `macos`, both
  directions). With R0.2: 64 of 64 pass (inside the 134 above). The matrix
  lists 4 styles by 4 platforms by 2 directions.
- Planted conflict in the scratch copy of `Dialog.css` (lines 134 to 138,
  real token names so no other gate fires on the content): `npm run check`
  exits 1. `ds/no-conflict-marker` reports lines 134, 136 and 138;
  `ds/css-parses` reports line 135; the dir gate fails too because the gallery
  build itself rejects the file; `ds/token-vocabulary` also fails on the
  divider line. Restored, the four new test files pass 18 of 18.
- Each gate has a passing and a failing fixture, and each failing fixture
  fails.
- Cost: the four new test files take about 8 seconds alone (most of it the two
  gallery builds of the dir gate), inside the vitest step. The reflow matrix
  is not in `npm run check`; it adds 32 runs per component to `npm run
  contract` (the Slider and RangeSlider reflow run alone took 1.9 minutes).

False passes, where the gate can be green while its fault is present:

Should fix:

1. `packages/contract-tests/src/contract.spec.ts:594`: when the page applies
   another platform than the one asked for, the test adds a note and passes.
   Today every `macos` run measures `web` and passes (32 notes in my run).
   The same hole exists for the style: `appliedAxes` reads the style but the
   test never compares it, so a style the gallery fails to apply would
   measure the default style in all 32 runs, which is the wave 1 blind spot
   again. Fail on a style mismatch now, and on a platform mismatch once R0.10
   and R0.14 land (an allow list for `macos` until then).
2. `docs/reports/lanes/order-R0-5.md:111` cites
   `docs/reports/reset/R0.5/reflow-all.json` for the full matrix (3392
   tests). The file does not exist; commit `0598c2b9` deleted the earlier
   `docs/reports/contract-react-r0-5-reflow-all.json` and added only
   `reflow-slider-after.json`. The SegmentedControl finding rests on it. Add
   the file or correct the report.
3. `packages/lint/src/rules/css-parses.ts:15` imports `lightningcss`, which
   no package.json declares; it resolves only because Vite and Angular's
   build pull it in. A Vite change can break the gate. Logged for R0.16;
   declare it in `packages/lint` or the root dev dependencies.

Notes:

- `packages/lint/src/dir-selectors.ts:92` compares counts. Extra `:dir()` in
  the output (a nesting expansion over a selector list, or CSS the count of
  the source does not follow) can hide a loss elsewhere. Today source and
  output are both 109, so it holds; a per file or per selector compare would
  be firmer.
- The dir gate builds only `apps/gallery-react`. The round 5 fault was in the
  gallery, the Vite consumer and the docs build; the other two are not
  guarded.
- The reflow matrix uses each style's dark scheme and default density only.
  R0.2's fault showed in both schemes and all densities, so it was caught,
  but a fault in light or compact only would not be.
- The conflict gate skips `packages/lint/fixtures/` and anything git
  ignores. A Markdown heading underlined with seven `=` fails it (the report
  says so).
- `ds/css-parses` reports the line after the marker with a generic parse
  message; the marker gate names it correctly, so this only matters if the
  marker gate is ever removed.

## R0.6 CLI snapshot on a fixture (`b11411e8`)

Files: `packages/cli/**` only. The native snapshot moved to the fixture as
well; same copy path, same fault, inside the order's files. Reasonable.

Rerun in the scratch copy: added `packages/angular/src/components/review-probe/index.ts`,
a new `button-probe.ts` exported from the Angular button's `index.ts`, and a
new `icon-probe.ts` exported from native `IconButton/index.ts`. New CLI
tests: 26 of 26 pass. The old tests from `dafa6967` against the same files:
2 fail (the Angular and native snapshots list the probe files). The fault is
gone.

Notes:

- `packages/cli/src/main.test.ts:118` and the fixture tests call `add()`
  directly, so the fixture snapshots skip argument parsing; the real package
  test still goes through `ds add ... --framework`, so the path stays
  covered.
- The fixture tests still read the real manifests for whether Button and
  IconButton are ready per framework. A manifest change can break them; low
  risk.

## Should fix, all orders

1. R0.1, `docs/contracts/frameworks.md:140`: `web` is called the default;
   the rule is `auto`.
2. R0.1, `docs/contracts/frameworks.md:181` to `:184`: the hydration text
   contradicts `:165` and `DECISIONS.md` item 12 (stored choice on the
   server).
3. R0.1, `DECISIONS.md:409`: no gate keeps the five layer statements equal.
4. R0.2, `packages/css/src/components/Slider.css:206`: the Desk thumb
   detaches from the fill while pulled; decide the pull before sign off.
5. R0.2: a pulled thumb still widens the phone page (412 to 426); pick up by
   R1.10 and R3.5, not later.
6. R0.2: stale "fill stretches" text in
   `packages/motion/src/interactions/fields.ts:538`, `:540`, `:577`, `:579`
   and `packages/angular/src/components/slider/slider-base.ts:33`, `:497`.
7. R0.3: R0.17 must also measure the slide's own 35 to 45ms CPU share.
8. R0.5, `packages/contract-tests/src/contract.spec.ts:594`: platform
   mismatch only notes, style mismatch is not checked.
9. R0.5, `docs/reports/lanes/order-R0-5.md:111`: the cited
   `reflow-all.json` is missing.
10. R0.5, `packages/lint/src/rules/css-parses.ts:15`: `lightningcss` is not
    declared.

## Process note for the lead

The R0.2 code sits in a work in progress commit mixed with R0.3 and R0.5
files, and the commit titled R0.2 holds none of it. Reverting or bisecting
one order is hard with this history. Commit each order's files under its own
title.
