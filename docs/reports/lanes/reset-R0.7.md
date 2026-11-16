# R0.7 Compare harness

Status: built. `npm run check` passes on the final tree (13 of 13 steps).
Evidence: `docs/reports/reset/R0.7/runs.md`; outputs:
`docs/reports/reset/compare/<pair id>/`.

## Files changed

All new, in `packages/contract-tests/src/compare/`:

- `run.ts`: the command. Starts the source and the gallery, captures both in
  one Chromium, probes, writes `source.png`, `system.png`, `sheet.png`,
  `table.md`, `result.json`. Exit 0 all pass or allowed, 1 a row fails, 2 the
  harness could not run. Stops every server it started.
- `sources.ts`: the GB runner (copy of `banana-server` in the scratch folder,
  `npm ci --ignore-scripts`, `next dev` with the repo's e2e bypass), the FK2
  harness (Vite from this repo over FK2's `src`), the gallery runner, the
  scratch folder rules.
- `fk2/screens.jsx`: the FK2 harness screens (`context-menu`, `buttons`). Runs
  only in the scratch folder.
- `pair.schema.json`, `pairs.ts`, `types.ts`: the pair file schema, its loader
  and the checks a schema cannot make.
- `tolerance.ts`: the default profile of plan section 3 and one comparison per
  kind of value.
- `probe.ts`: the in-page probe, the text and image masks, the wait for
  animations to end.
- `pixels.ts`: the masked pixelmatch probe for template regions.
- `report.ts`: the Markdown table and the sheet HTML.
- `pairs/gb-button-desk.json`, `pairs/gb-dialog-desk.json`,
  `pairs/fk2-menu-studio.json`: the three sample pairs.
- `compare.test.ts`: 25 unit tests (run by `npm run check`).
- `README.md`: how to run it, the pair file, the tolerances, the limits.

Also:

- `package.json` (root): the `compare` script line only, as the lead allowed.
- `docs/reports/reset/compare/{gb-button-desk,gb-dialog-desk,fk2-menu-studio}/`:
  run outputs, 1.2 MB in all, largest file 424 KB.
- `docs/reports/reset/R0.7/runs.md`: evidence.

## Acceptance

1. **One command each from a clean checkout.** With an empty scratch folder:
   `npm run compare -- --pair gb-button-desk` copied GB, ran `npm ci`, started
   `next dev` and the gallery, and finished in 75s; `gb-dialog-desk` 30s;
   `fk2-menu-studio` 13s. Warm reruns: 8s, 10s, 6s. Each exits 1 (rows fail).
2. **They fail on the values the audits name.**
   - Desk md button height: source 28px, system 35.984px, fail (+7.98px,
     tolerance 1px).
   - Tracking: source `normal`, system -0.52px, fail (-0.04em, tolerance
     0.01em).
   - Studio menu radius: source 16px, system 0px, fail.
   - Desk dialog lights: source has none, system has one window controls
     group, fail. The same pair fails the yellow title bar (Delta E 75.6
     against `#282828`), glass (`blur(24px) saturate(1.3)` against none),
     radius 16 against 12 and the missing footer band.
   - Totals: gb-button-desk 7 pass, 13 fail; gb-dialog-desk 3 pass, 12 fail;
     fk2-menu-studio 3 pass, 9 fail.
3. **No FK2 vendor path in any harness file.**
   `grep -rnE 'vendor/|alm-design-system' packages/contract-tests/src/compare docs/reports/reset/compare`
   finds nothing; a unit test runs the same check.
4. **Nothing written under either source repo.** `git status --porcelain
   --ignored` gives 0 entries in both repos before the first run and after the
   last (GB 216625c, FK2 51b1994).

## How each source is rendered

- **GoBanana**: the real app, from a copy of `banana-server` in the scratch
  folder (`DS_COMPARE_SCRATCH`, else `<tmp>/ds-compare`), installed with
  `npm ci --ignore-scripts`, served by `next dev` with
  `E2E_AUTH_BYPASS=1 ADMIN_FIXTURES=1 DATABASE_URL=`. Copy and install are
  redone only when the source commit, its uncommitted changes or its lockfile
  change. The sample pairs use `/__design`, the repo's own Studio primitives
  page.
- **Figma-Killer-2**: a reconstruction. FK2's own components
  (`src/ui/components/ContextMenu`, `Button`, `Separator`, `Tooltip`) and
  `src/styles/globals.css`, served by this repo's Vite from a folder in the
  scratch space, with `@ui`, `@core` and `@fk2` aliased into FK2's `src`.
  Imports that resolve into FK2's vendor folder become empty modules, and the
  dev server may not read that folder. Pixel icons are empty boxes of the same
  size. The pair says `"reconstruction": true`.
- **System**: the React gallery from this checkout (`vite dev`).

## What cannot be compared honestly

- **FK2 composition.** Only the parts are FK2's. Where a menu opens, its
  width (208px here, 176px in FK2's row menus), the rows and the strings are
  the harness's choice, so widths and positions of content sized parts are
  not probed. FK2's icons are not drawn (their set declares no licence), so
  icon shape and colour are never compared on FK2 pairs.
- **The real FK2 app** (shell, panels, canvas, editor text scale, light
  editor theme) is not running; every FK2 screen is a reconstruction.
- **Glass pixels.** Headless Chromium has a software GPU. GoBanana's site
  pages detect it and turn blur off (`data-gpu="software"`); `/__design` does
  not. A pair on a site page removes the mark in its setup so computed CSS
  reads the designed blur; glass regions are compared by CSS only, and their
  pixel probe always reads "allowed" with that reason.
- **Translucent fills.** Colours are composited on black and on white and the
  larger Delta E counts, so an alpha change always shows. For a translucent
  fill over a dark surface this overstates what a person sees (the Desk
  title bar reads Delta E 75.6). It is strict on purpose; the real backdrop
  behind the element is not used.
- **Motion.** Probes read the rest state after finite animations end; motion
  is compared only through computed durations and easing. Frames, travel
  over time and press feel are R0.8.
- **Hover and press.** Steps can hover and focus; there is no step that
  holds the pointer down, so `:active` styles are not probed yet.
- **GB in development mode.** `next dev` draws its dev indicator in the full
  viewport capture (not in any region crop). `/__design` is a test page of
  the primitives, not a product screen.
- **Size mapping.** The system's default size md is paired with the source's
  default control (st-btn sm, 28px), following fidelity-gobanana.md change 4.
  This is a judgement written in the pair, not something the harness derives.

## Decisions made

1. Outputs go to `docs/reports/reset/compare/<id>/` as plan section 3 says;
   the order's evidence is in `docs/reports/reset/R0.7/`.
2. A pair may only tighten the default profile; a looser value is refused.
3. Radius is the rendered value (clamped to half the short side), so
   `999px` and `9999px` pills compare equal; letter spacing is compared in em
   at each element's own font size; duration takes the longest of a list.
4. Pair ids start with the source repo (`gb-`, `fk2-`).
5. FK2 icons are stubbed instead of read, so the harness never depends on a
   set without a licence.
6. The probes run through `tsx`, which wraps functions in a `__name` helper;
   each capture context defines that helper in the page.
7. Every capture retries up to three times: under load Chromium once refused
   the sheet capture ("Unable to capture screenshot").

## Left open

- No step holds the pointer down (press states), and no pair yet uses the
  pixel probe; it is tested on synthetic images only.
- The FK2 harness has two screens (`context-menu`, `buttons`); `buttons` is
  not used by a pair yet and was not checked. Later pairs add screens to
  `fk2/screens.jsx`.
- No allowed difference is listed in the sample pairs, since none of their
  rows differs on purpose; the mechanism is covered by unit tests.
- A WebKit run (plan approval 9) is not wired; the harness uses Chromium only.
