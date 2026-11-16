# Lane report: R0.20 OTPField reflow at 320px on phones

Order R0.20, from `docs/plan/reset-followups.md`, "From R0.12 and R0.4",
item 1. Not committed.

## The fault, measured

OTPField scrolled sideways at 320px on `ios` and `android` in every style, in
React and Angular (14 of the 32 reflow cases in each).

The wide element is the cell (`[data-part='cell']`). Each cell was 44px wide
on `ios` and 48px on `android` and would not narrow, so six cells and their
gaps, or eight cells with a separator, ran past the 288 to 292px of content
width. The root stopped at `max-inline-size: 100%`; the cells overflowed it.

| | Declaration | Value on `ios` | Value on `android` |
| --- | --- | --- | --- |
| The rule | `packages/css/src/components/OTPField.css` line 175 (at HEAD), cell rule: `min-inline-size: var(--ds-size-target-min)` | | |
| The token | `packages/tokens/src/platform/ios.json` line 93 to 99, `size.target-min` | 44px | |
| The token | `packages/tokens/src/platform/android.json` line 93 to 99, `size.target-min` | | 48px |

The R0.13 platform layer (`5a553f7b`, first in `036dbfe6`) made
`size.target-min` the platform touch target. Before it the token was 24px on
every platform (`packages/tokens/src/base/size.json` at `0598c2b9`), which is
what the cell rule was written for ("never below the 24px target"). Neither
R0.19 nor R0.15 is involved: no platform CSS file has an OTPField rule.

### At `0598c2b9` (a scratch build of that commit, outside the repo, deleted)

Every phone case fit: `size.target-min` was 24px, and the platform layer did
not exist, so the cells took the web sizes. Desk and Studio md cells were
32 by 32, lg 43.7 by 44; Liquid and Neutral md 36 by 36, lg 41.3 by 48.
Overflow 0 in all 16 phone cases. Note the cells were also below the touch
target in height then (32px on a phone). Data:
`docs/reports/reset/R0.20/measure-0598c2b9.json`.

### Before the fix (HEAD, React, `--grep sideways`)

Page overflow at 320px, in px (`contract-react-r020-before.json`):

| Style | ios ltr | ios rtl | android ltr | android rtl |
| --- | --- | --- | --- | --- |
| desk | 92 | 0 | 124 | 18 |
| liquid | 104 | 4 | 136 | 28 |
| neutral | 104 | 4 | 136 | 28 |
| studio | 92 | 0 | 124 | 18 |

`web` and `macos` were 0 in every style. The two passing rtl cases on `ios`
still had cells past the root: they overflowed to the left, which does not
scroll, so the scan could not see it. Widest case: "too-many" (8 cells, sm),
116 to 128px alone; then the Arabic row of "variants", whose wrapper is a flex
item that keeps its automatic minimum (the row's full width).

## What should change outside my files (not done here)

`docs/contracts/anatomy.md` line 37 says "Controls are at least 24 by 24 CSS
px (`size.target-min`)". On `ios` and `android` the token is now 44 and 48, so
every component that uses it as a 24px floor now gets the touch target
instead (73 uses in 45 component files). Either is a fair rule, but the
contract and the token disagree. The lead picks one:

1. Keep `size.target-min` at 24px on every platform (set `ios.json` and
   `android.json` lines 96 to 97 back to 24, or drop the key there), and have
   components that must reach the platform target read `size.touch.*` or a
   new platform token (for example `size.target-touch`); or
2. Keep the new values and change `anatomy.md` line 37 to say the token is
   the platform's least target (24px on web and macos, 44 on ios, 48 on
   android), and add a token for the WCAG 24px floor that no platform
   changes, for parts that are not targets.

OTPField now holds at 320px under either choice.

## What I built

- `packages/css/src/components/OTPField.css`:
  - New private property `--_otp-field-cell-min`, the least width of a
    cell: `min(var(--ds-size-target-min), calc(var(--_otp-field-height) * 0.6))`,
    a portrait cell three fifths of its size's height, or 24px on the web
    where that is smaller. Documented in the header list.
  - Cell: `flex: 1 1 var(--_otp-field-cell-min)`, `inline-size` and
    `max-inline-size` at `--_otp-field-height`, `min-inline-size` at the new
    floor. The cell starts from its floor and grows back to the square, so
    every cell gives up the same width in a narrow row and the row keeps its
    natural width when there is room.
  - Cell height unchanged: `block-size: var(--_otp-field-height)` and
    `min-block-size: var(--ds-size-target-min)`, so 44px on `ios` and 48px
    on `android`.
  - Root: `flex-wrap: wrap` (was `nowrap`). A wrapping row's least width is
    one cell, so a parent that sizes to its content (the Arabic row's flex
    item) can narrow it. With `nowrap`, and with any other form I tried
    (`flex-basis`, grid tracks), either the least width stayed at all the
    squares or the natural width fell to the floors. The row breaks onto a
    second line only when even the floors do not fit: at 320px no demo case
    wraps in any style or platform.
- `packages/react/src/components/OTPField/OTPField.reflow.test.ts` (new):
  renders the component's own markup (lg, two groups, eight characters, and
  a row inside a flex item that keeps its automatic minimum), lays it out in
  Chromium with the built tokens and `OTPField.css` at 320px, and checks for
  each of the 4 styles on `ios` and `android`: no sideways scroll, the input
  (the target) and every cell at least 44 or 48px tall, the row on one line,
  every cell at least 24px wide. A third test checks the web keeps square
  32px md cells. It fails on the HEAD CSS (desk `ios` 94px, desk `android`
  126px) and passes on the fix.

No change to the component, the demo, the manifest or Angular.

## After the fix

Measured with the same script, all 4 styles by 4 platforms by 2 directions
(`docs/reports/reset/R0.20/measure-after.json`): page overflow 0 in all 32,
no row wraps.

| Platform | Cell height | Narrowest cell at 320px | Cells that narrowed |
| --- | --- | --- | --- |
| web | 24 to 44 (as before) | 24 (xs, square) | the 8 cell md row only, 29 to 30.8, as before |
| ios | 44, lg 50 | 29 (8 cell md row, Liquid, Neutral) | md and lg rows, 40.7 to 43.7 |
| android | 48, lg 56 | 29 (8 cell md row, Liquid, Neutral) | lg rows 41.3 to 43.7, 8 cell rows 29 to 31.8 |
| macos | 24 | 20 (xs, as before) | none |

The narrowest phone cell is 29px against a floor of 26.4 (ios md) or 24
(android md), so the floor never binds at 320px. Web widths are the same as
before the fix (xs 24, sm 28, md 32, lg 44 in Desk and Studio).

| Run | Result |
| --- | --- |
| `npm run contract -- --framework react --component OTPField --grep sideways --tag r020-after` | 32 passed (was 18 passed, 14 failed) |
| `npm run contract -- --framework react --component OTPField` | 67 passed |
| `npm run contract -- --framework angular --component OTPField` | 67 passed, no Angular change |
| `npx vitest run --project node .../OTPField.reflow.test.ts` | 3 passed |

## Other components on phones

SWEEP_RESULTS

## Decisions made

- The cell is not a target: the control part (the native input) covers the
  row and takes the tap, and the cells are `aria-hidden` with
  `pointer-events: none`. So the row is the target (WCAG 2.5.8 and the
  platform guides): it stays as tall as the touch target, and the width is
  what gives. The gap stays as the style sets it.
- The width floor is three fifths of the size's height (a portrait cell, as
  phone code fields draw them), capped at `size.target-min` so the web keeps
  its 24px. The ratio is the largest that keeps every demo case on one line
  at 320px in every style: the 8 cell md row in Liquid on `ios` needs 29px or
  less, and three quarters (33px) still overflowed by 16px.
- Wrapping is the last resort below the floors, never at 320px in the demo.
  The input still covers both lines then, so taps and typing still work.
- Evidence moved from `docs/reports/contract-react-r020-*.json` (where `--tag`
  writes) to `docs/reports/reset/R0.20/`, as section 2 of `reset.md` asks.

## Not proved

- WebKit is not installed; every run is Chromium. Flex wrapping with a floor
  basis and a max size is standard, but not checked in Safari here.
- No phone recording: the visible change is narrower cells on a 320px
  phone. Per section 2 of `reset.md` a finger touches it, so it waits on the
  owner's recording pack.
- The `0598c2b9` numbers come from a scratch copy of that commit's gallery
  sources with its own token build and the current `node_modules`; not from
  the gallery as deployed then.
