# Order 1.17: full matrix and size report (ds-qa)

Branch `claude/ds-order-1-17`. Full results in `docs/reports/matrix-wave-1.md`
and `docs/reports/size-wave-1.md`.

## What was done

- React contract suite, full run: 3568 tests, 4 fail (List axe in Desk).
- Angular contract suite, full run: 1833 tests, 0 fail.
- Target size (WCAG 2.5.8) in every style and density: React 1038 of 1038,
  Angular 543 of 543.
- axe sweep (WCAG 2.2 AA) on 111 pages, en ltr and ar rtl, overlays closed
  and open: 1656 runs, 0 violations.
- Screenshot matrix: React 1782 shots, Angular 984. React and Angular
  compare: 984 pairs, 0 over the limit, 73 below it with every cause named.
- Size report: every package entry and component CSS file, gzip.
- Script work: `shots.ts` (lossless recompression, skip unchanged files, a
  committed subset, overlays by `contract.opens` and visible trigger,
  keyboard open when a trigger is covered, `--ready`), `a11y.ts` (WCAG
  criterion per violation, summary by criterion and owner, visible trigger,
  `--page`, merged partial runs, 120s for shell pages), `size.ts` (new).

## Decisions

- The full image set is not committed. React keeps Neutral light, Studio
  dark and Desk dark rtl (721 images, 17.2 MB); Angular keeps none, since
  every pair matches React within the limit. Every shot is listed with its
  hash. The earlier matrix images (108 MB) are replaced.
- Shots and the axe sweep ran on a production build of the React gallery
  served by `vite preview`: same bytes as the dev server on a 42 shot check,
  twice as fast.
- Recompression uses sharp when the install has it (it comes in through
  `next`). It is not a dependency, and the script works without it.
- Stability within a run is judged on the recompressed bytes. Chromium's PNG
  encoder can write different bytes for the same pixels.

## Failures by owner

| Owner | Component | Finding | Where |
| --- | --- | --- | --- |
| ds-qa (contract suite) | List | Axe in the closed axe test runs before `list-stagger` ends, so it reads fading rows as low contrast. 4 false failures in Desk. Call `finiteAnimationsDone` before `runAxe` | `packages/contract-tests/src/contract.spec.ts:587` |
| ds-component lane 7B | Tabs | 9 shots not byte stable across two runs (1 channel value on a few pixels) | `tabs/*` in `docs/reports/shots/matrix/react/captured.json` |
| ds-component lane 8C | ScrollArea | 8 shots not byte stable across two runs (3 pixels, 1 of 255) | `scroll-area/*` |
| Input.css owner (wave 0, ds-component) | InputGroup in Arabic | React aligns a url value right inside `InputGroup dir="ltr"`, Angular left; `:dir(rtl)` matches in React only | `packages/css/src/components/Input.css:248` |
| ds-angular A3.1 | Switch | Arabic off text `متوقف`, React says `غير مفعل` | `packages/angular/src/components/switch/switch.demo.ts:135` |
| ds-angular, gallery | OTPField | Page heading `OtpField`, built from the slug | `apps/gallery-angular/src/app/axes.ts:62` |
| ds-angular A2.1 | Field (seen in FormWizard) | Required asterisk about 3px further from the label than React, likely template whitespace | `packages/angular/src/components/field/field.ts:80` |
| gallery owner | `/all` | Takes about 26s to load 850 demo cases | `apps/gallery-react/src/App.tsx:61` |

## Changes needed from the lead

1. Add `"size": "tsx scripts/size.ts"` to the root `package.json` scripts, so
   the size report runs as `npm run size`. Root config is the lead's.
2. Route the contract suite fix above (one line in `contract.spec.ts`), then
   rerun `npm run contract -- --framework react --component List`. It should
   pass; gate 1's React row then turns green apart from the appendix ticks.
3. Tick the appendix table and the batch rows in `STATE.md` (111 manifests
   ready in React) and fold this report into `docs/reports/wave-1.md`.
4. `npm run check` can time out two lint gate tests
   (`no-native-title`, `no-tailwind`, 5s each) when browser runs share the
   machine. They pass alone. A longer timeout for those two scans would stop
   false reds during matrix runs.

## What I could not do

- Byte stable shots for ScrollArea and Tabs: a component fix, not mine.
- Gate 1 rows for the docs site, registry and CLI snapshots: those are orders
  1.13 to 1.15. Not rerun here.
- Angular axe sweep through `scripts/a11y.ts`: not asked; the Angular contract
  suite runs axe in every style, scheme and direction and passed.
