# Order R0.5: gates that wave 1 lacked

Order R0.5 of `docs/plan/reset.md`, step 1 of phase R0. Owner: ds-qa.
Evidence: `docs/reports/reset/R0.5/`.

## What I built

### 1. Reflow in every style and every platform, at 320 wide

- `packages/contract-tests/src/lib.ts`: `PLATFORMS` (`web`, `ios`,
  `android`, `macos`, the table in `docs/contracts/frameworks.md`) and
  `reflowMatrix(styles, platforms)`: every style (its dark scheme) by every
  platform, in en ltr and ar rtl.
- `packages/contract-tests/src/contract.spec.ts`: the reflow test runs over
  that matrix. Wave 1 ran it in the default style only (Neutral) on `web`.
  `--platform` narrows it to one platform, `--styles` to some styles. The
  test adds a note when the page applied another platform than the one asked
  for.
- `packages/contract-tests/src/page.ts`: `appliedAxes()`, the style and
  platform the page stamped on `<html>`.
- `packages/contract-tests/README.md`: the reflow row, the option table and
  a sample command.

Proof:

- `src/lib.test.ts`: `PLATFORMS` equals the Platform row of
  `frameworks.md`; on this repo the matrix is 4 styles (desk, liquid,
  neutral, studio) by 4 platforms by 2 directions, 32 runs per component.
- `src/reflow.test.ts`: the scan in Chromium at 320px on two fixtures in
  `packages/lint/fixtures/reflow/`. `fits.html` passes. `overflows.html`
  (an rtl page with a 400px track) fails with 80px, names the case and the
  part, and finds the native title.
- Real run, Slider and RangeSlider, tree without R0.2:
  `npm run contract -- --framework react --component Slider,RangeSlider --grep sideways`.
  64 tests, 16 fail: both components scroll sideways by 8px in `desk` and
  `liquid` on `web` and `macos`, in both directions. `neutral` and `studio`
  pass, and so do `ios` and `android`. The old single style run (Neutral)
  could not see it. Report: `docs/reports/reset/R0.5/reflow-slider-before.json`.
- Full matrix over every ready component: see "Real faults the gates found".

### 2. Conflict markers and a CSS parse

- `packages/lint/src/rules/no-conflict-marker.ts`, gate
  `ds/no-conflict-marker`: fails on a line that starts with seven `<`, `=`
  or `>` in any text file of the repo walk (lock file and Markdown included,
  images skipped by extension, other binaries by the walk). Added to `rules`
  in `packages/lint/src/index.ts`, so `ds doctor` can use it too.
- `packages/lint/src/rules/css-parses.ts`, gate `ds/css-parses`: every
  `.css` under `packages/css/src/` and `packages/styles/` (generated barrels
  included, 200 files today) must be balanced (comments, strings, `{`, `(`,
  `[`) and must parse in Lightning CSS with error recovery off. The balance
  pass is needed because CSS closes an open block at the end of a file
  without an error, so a lost `}` parses. Not added to `rules`, so the
  doctor does not load Lightning CSS.
- Tests: `packages/lint/src/gates/no-conflict-marker.test.ts`,
  `packages/lint/src/gates/css-parses.test.ts`. The helper that plants a
  conflict in a copy of `Dialog.css` is `plantedDialog()` in
  `packages/lint/src/gates/harness.ts`.

Proof:

- Passing fixtures: `fixtures/no-conflict-marker/good.md` (six of a kind,
  indented, mid line), `fixtures/css-parses/good.css` (layers, nesting,
  strings, escapes).
- Failing fixtures: `fixtures/no-conflict-marker/bad.css` (lines 4, 6, 8);
  `fixtures/css-parses/unclosed.css`, `extra-close.css`,
  `bad-selector.css`, `marker.css`.
- Each gate also fails on `Dialog.css` with a conflict planted in memory.
- `npm run check` on a scratch copy of the whole tree with a conflict
  planted in its `Dialog.css` (lines 115 to 119): the vitest step fails,
  `npm run check` exits 1. `ds/no-conflict-marker` reports lines 115, 117
  and 119, `ds/css-parses` reports line 116. The excerpt and the summary are
  in `docs/reports/reset/R0.5/planted-conflict-check.txt`.

### 3. The gallery build keeps every `:dir()`

- `packages/lint/src/dir-selectors.ts`: counts `:dir(rtl)` and `:dir(ltr)`
  without comments, finds the CSS an app imports (side effect imports in its
  `src`, resolved from its package.json) and follows `@import` (relative and
  package imports).
- `packages/lint/src/gates/dir-selectors.test.ts`: builds
  `apps/gallery-react` with its own `vite.config.ts` into a temporary folder
  (outside the repo, removed after) and fails when the output holds fewer
  `:dir(rtl)` or `:dir(ltr)` than the source.

Proof:

- Passing: the gallery as configured. Source 109 `:dir(rtl)` in 216 files
  reached from 7 entries; output 109.
- Failing: the same build with `cssTarget` set to `chrome100, safari15`. The
  minifier rewrites the selectors and the gate reports the loss.
- Fixtures: `fixtures/dir-selectors/source.css` and `nested.css` (3 rtl, 1
  ltr, one in a comment not counted), `output-kept.css` passes,
  `output-rewritten.css` fails with both lines.
- The two builds add about 6 seconds to `npm run check`.

## Real faults the gates found

- Slider and RangeSlider scroll sideways by 8px at 320px in `desk` and
  `liquid`, on `web` (and on `macos`, which renders as `web` today), en ltr
  and ar rtl. Owned by R0.2. Left alone as the order says.
- `packages/react/src/components/ToggleGroup/ToggleGroup.perf.test.tsx:129`:
  a bare `<button>` (`ds/button-primitive`, an existing gate). Owned by
  R0.3, a file in progress. It is the only vitest failure of
  `npm run check` on the shared tree.
- No conflict marker anywhere in the repo. No CSS file that fails to parse.
  The gallery build keeps all 109 `:dir(rtl)`.

FULL_MATRIX_RESULTS

## What I could not prove

- `macos` is not yet an axis value in the gallery (`apps/gallery-react/src/axes.ts`
  drops it until R0.10 and R0.14), so the 8 `macos` runs per component
  measure the `web` layout. The test notes it on every such run instead of
  failing. Once R0.10 lands the same runs measure `macos`.
- "None with R0.2": R0.2 had not changed `Slider.css` or the Slider folders
  while I worked, so I could not run the matrix on a tree with its fix. The
  command to run after it lands is in the README and above.
- The planted check ran in a scratch copy whose `node_modules` link to the
  real tree, so package imports in the copy resolve to the real files. That
  made two more tests fail there (the `:dir()` source list check, which
  compares paths, and `ds/token-vocabulary`, because the planted lines name
  `--ds-space-4`, which is not a token). Neither changes the result: the
  marker and parse gates failed on the planted lines.

## Decisions

- Lightning CSS (MPL-2.0) is used by the parse gate as it sits in the dev
  tree through Vite. It is not declared in any package.json, since that
  would change `package-lock.json`. The lead may want to add it to the root
  `devDependencies`. It is test only, never shipped, so it is not a runtime
  dependency and not a HUMAN GATE.
- The conflict gate reads every text file, Markdown included. A Markdown
  heading underlined with seven `=` would fail; there is none today.
- The reflow fixtures live in `packages/lint/fixtures/reflow/`, the one
  folder no gate reads, because they break the rules on purpose (a native
  title, a bare button).
- `no-native-title.test.ts` and `no-tailwind.test.ts`: their repo wide scans
  timed out at the default 5 seconds while three agents ran checks at once.
  They now have 60 seconds, as `no-dash` already had.
- The report sits at `docs/reports/lanes/order-R0-5.md` as the lead's brief
  asked; section 2 of the plan names `reset-R0.5.md`.

## Check

NPM_CHECK_RESULT
