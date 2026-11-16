# R0.7 evidence: compare harness runs

Date 2026-11-16. Machine: the shared cloud container, headless Chromium from
the repo's Playwright, other lanes running at the same time.

## One command per pair

Every run used a scratch folder outside the repo (`DS_COMPARE_SCRATCH`, a
fresh empty folder for the first run). Outputs are in
`docs/reports/reset/compare/<id>/`.

| Run | Command | Exit | Time | Result |
| --- | --- | --- | --- | --- |
| first, empty scratch (copy, `npm ci`, `next dev`, gallery) | `npm run compare -- --pair gb-button-desk` | 1 | 75s | 7 pass, 13 fail |
| first | `npm run compare -- --pair gb-dialog-desk` | 1 | 30s | 3 pass, 12 fail |
| first, FK2 harness built in scratch | `npm run compare -- --pair fk2-menu-studio` | 1 | 13s | 3 pass, 9 fail |
| final | `npm run compare -- --pair gb-button-desk` | 1 | 8s | 7 pass, 13 fail |
| final | `npm run compare -- --pair gb-dialog-desk` | 1 | 10s | 3 pass, 12 fail |
| final | `npm run compare -- --pair fk2-menu-studio` | 1 | 6s | 3 pass, 9 fail |

Exit 1 means at least one row failed, which is the expected result on
today's tree. One warm run of `gb-button-desk` stopped with exit 2 when
Chromium refused the sheet capture ("Unable to capture screenshot") under
load; captures now retry up to three times, and the reruns were clean.

## The values the audits name

| Audit finding | Pair, row | Source | System | Result |
| --- | --- | --- | --- | --- |
| Desk md button 36 against 28 | gb-button-desk, secondary height | 28px | 35.984px | fail, +7.98px against 1px |
| Tracking -0.52px against normal | gb-button-desk, secondary letter-spacing | normal | -0.52px | fail, -0.04em against 0.01em |
| Studio menu radius 0 against 16 | fk2-menu-studio, menu border-radius | 16px | 0px | fail, -16px against equal |
| Desk dialog with lights against a plain panel | gb-dialog-desk, panel window lights | absent | 1 | fail, +1 against equal |

Other gaps the same runs show: Desk button radius 18 (pill) against 12, text
13px against 12px, padding 16px against 8px, inset rings against none,
transition 380ms against 150ms; Desk dialog radius 16 against 12, glass
`blur(24px) saturate(1.3)` against none, yellow tinted title bar against a
`#282828` band, header 36px against 53px, title 14px with -0.04em against
16px; Studio menu fill `#111` against `#323232`, 1px rule against none, no
shadow against `0 12px 28px`, row radius 0 against 12, row weight 400
against 560, 70ms `steps(2)` against 130ms `cubic-bezier(0.16, 1, 0.3, 1)`.

## Nothing written under either source repo

`git status --porcelain --ignored`, counted, before the first run and after
the last:

| Repo | Commit | Before | After |
| --- | --- | --- | --- |
| `/home/user/gobanana` | 216625c | 0 entries | 0 entries |
| `/home/user/maherfayad-stack/figma-killer-2` | 51b1994 | 0 entries | 0 entries |

## No path under FK2's vendor folder in any harness file

```sh
grep -rnE 'vendor/|alm-design-system' packages/contract-tests/src/compare docs/reports/reset/compare
```

No match (grep exit 1). The same check runs in `compare.test.ts`, with the
patterns built from parts so the test file does not match itself.

## Unit tests

`npx vitest run packages/contract-tests/src/compare`: 25 passed (tolerance
table, every comparison, pixel probe, pair files, page probe in Chromium on a
fixture, isolation rules).
