# Order R0.6: CLI snapshot on a fixture (ds-docs)

Answers `docs/plan/wave-1-followups.md` round 3 item 2: the `ds add
--framework angular` snapshot listed the real Angular file closure, so it
broke on every Angular merge. No commit: the lead commits.

## What changed

All inside `packages/cli/**`.

| File | Change |
| --- | --- |
| `packages/cli/src/commands/add.ts` | `AddOptions.repo`: the repo root the Angular and native copy path reads component folders from. Default: this repo. Not a command line flag. |
| `packages/cli/fixtures/repo/packages/angular/src/**` | A small Angular package: `components/button` (index, button, button-base, plus a spec and a demo that are never reached), `components/button-group/button-group-context.ts`, `components/badge/index.ts` (left out), `internal/host.ts`, `theme/theme.ts`. |
| `packages/cli/fixtures/repo/packages/native/src/**` | A small native package: `components/IconButton`, `components/Button/ButtonBase.tsx`, `theme/hooks.ts`. |
| `packages/cli/src/main.test.ts` | The two copy path snapshots now read the fixture. A dry run is snapshotted, then a real run writes every file and the copy equals the fixture source. The real Angular and native packages are checked for shape and a few known files only: exit 0, paths sorted, all `planned`, all under `src/ds/<framework>/`, no spec, test or demo file, and `index.ts`, the main file and (Angular) `theme/theme.ts` present. |
| `packages/cli/src/__snapshots__/main.test.ts.snap` | Two snapshots replaced by `add, angular, fixture` and `add, native, fixture`. |

## Decision

The order names Angular. The native snapshot had the same fault (it listed
the real native closure), and both go through the same copy path, so the
native snapshot reads the fixture too.

The fixture lives in `packages/cli/fixtures/`, outside `src`, so the root
`tsconfig.json` and vitest include patterns do not pick it up. ESLint lints
it and it passes.

## Proof

1. Scratch copy of the repo (without `node_modules`, linked instead), with the
   old CLI tests. Added `packages/angular/src/components/button/button-proof.ts`
   and exported it from that folder's `index.ts`. `npx vitest run
   packages/cli`: 1 failed, 23 passed, snapshot mismatch on
   `src/ds/angular/components/button/button-proof.ts`.
2. Same scratch copy, new `packages/cli`, the added file still there plus a
   new `packages/angular/src/components/proof-new-folder.ts`: 26 passed, no
   snapshot written or obsolete.
3. Scratch copy removed. The real `packages/angular` was never touched.
4. Real checkout: `npx vitest run packages/cli`: 2 files, 26 tests passed.

## `npm run check`

Every step passes except `vitest`, which fails on one test in a file this
order does not own:
`packages/lint/src/gates/no-native-title.test.ts`, "finds no native title in
TSX, HTML or Angular templates", times out at 5000ms (6049ms) in the full
run, twice. Alone it passes in 2.8s. The machine is shared with three other
lanes (load average above 4), so this looks like load. R0.5 owns
`packages/lint/**`, so it is reported, not fixed. Every other test of the
2603 passes.

## Left open

- The timeout above, for R0.5 or the lead (a longer timeout on that test, or
  a faster scan).
- The section 2 rule names `docs/reports/lanes/reset-<order id>.md`; this
  report uses the name the lead gave, `order-R0-6.md`.
