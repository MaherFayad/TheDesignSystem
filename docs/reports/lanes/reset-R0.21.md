# Lane report: R0.21 `size.target-min` is the 24px floor on every platform

Order R0.21, from the ruling at the end of `DECISIONS.md` ("`size.target-min`
is the 24px floor on every platform"). Built to `docs/contracts/tokens.md`,
"Platform layer (ruling 8)". Not committed by me. The lead's commit
`f031a181` already carries the source and test edits below as work in
progress; the snapshot updates are still in the working tree.

## What I built

| File | Change |
| --- | --- |
| `packages/tokens/src/platform/web.json`, `ios.json`, `android.json`, `macos.json` | `size.target-min` is 24px in all four (was 44 on `ios`, 48 on `android`), with the WCAG 2.2 SC 2.5.8 description. New `size.target` beside it: 24 `web`, 44 `ios`, 48 `android`, 24 `macos`, each `$description` naming its source (WCAG 2.2 SC 2.5.8 for web and macos, HIG buttons and accessibility for ios, the Material audit "Targets and spacing" for android). `size.touch.ios` and `size.touch.android` unchanged. |
| `packages/tokens/src/contract.json` | `target` added to the `added` list of the platform `size` group and of the style contract's `size` group. |
| `packages/tokens/tests/platform.test.ts` | New test: the floor is 24px in the base block, in every platform block, in the platform density blocks and in every native platform theme; `size.target` is 24, 44, 48, 24; both touch names stay 44 and 48; every `size.target` cites a source. |
| `packages/tokens/tests/__snapshots__/` | 33 snapshots updated: `tokens.css` and the native theme objects. |

The A11y notes from the old `ios` and `android` `target-min` descriptions moved
to `size.target` in the same files, so none is lost.

### Where the floor lives

It stays in each platform file. The contract table "What a platform may set"
lists `size.target-min` as a platform name, `contract.json` lists it under
`platform.groups`, and "Every platform fills every name in this list". With one
owner per name, a base owner would need the name taken out of the platform
contract first. All four files now hold the same 24px, so no platform changes
it, as the ruling asks.

DTCG checked against designtokens.org on the day: the draft page says the
latest published version is still 2025.10; a dimension is `{ value, unit }`
with `px` or `rem`, and `target` beside `target-min` is a valid pair of names.

## Built CSS, before and after

All five CSS files (`tokens.css`, `desk.css`, `liquid.css`, `neutral.css`,
`studio.css`), compared declaration by declaration
(`docs/reports/reset/R0.21/css-value-changes.json`):

| Selector | Variable | Before | After |
| --- | --- | --- | --- |
| `[data-platform='ios']` | `--ds-size-target-min` | 44px | 24px |
| `[data-platform='android']` | `--ds-size-target-min` | 48px | 24px |

That is the only value that changed: 2 declarations in each of the 5 files.
Added: `--ds-size-target` in `:root, [data-style]` (24px) and in each platform
block (24, 44, 48, 24), 5 per file. Nothing removed. Tailwind and
`custom-media.css` are unchanged. Native: `'target-min'` is 24 in the `ios` and
`android` theme objects (was 44 and 48), and every theme gains `target`. Figma
gains one variable per mode.

## Readers of the touch target (step 2)

### At `0598c2b9`

`size.target-min` was 24px everywhere (`src/base/size.json`). Phone controls
reached 44 and 48 through `size.touch.ios` and `size.touch.android` in
`packages/css/src/platform/ios.css` and `android.css`: Button height, the
IconButton and Button `hit` part, Switch and Checkbox targets, Slider, Tabs,
Input, Select, Field, list, sidebar, pagination and menu rows, the navbar and
the tab bar item. The set of `size-touch` and `size-target` reads in those two
files is the same at `0598c2b9` and today, line for line, once sorted. So no
platform rule was dropped on the strength of the raised floor, and the six
controls the order names keep their targets (below).

### What relies on 44 and 48 today

Component CSS: every `target-min` read but one predates R0.13 and was written
for 24 (`git diff 0598c2b9 HEAD` shows no other changed read). Two readers came
later and expect the touch target. They should move to `size.target`:

| File, line | Today | Change | Evidence |
| --- | --- | --- | --- |
| `packages/css/src/components/OTPField.css` 203 | `min-block-size: var(--ds-size-target-min);` | `min-block-size: var(--ds-size-target);` | The R0.20 reflow test fails without it: android md cells are 40 tall (`size.control.md`), the test wants 48. With the line changed (scratch copy of the CSS) the test passes, 3 of 3. Same value on web and macos, so no change there. |
| `packages/css/src/components/OTPField.css` 77 and 187 to 189 (comments) | "size.target-min where that is smaller (24px on the web)"; "The height never drops below size.target-min, which is 24px on the web and the touch target on ios (44) and android (48)" | Line 77: "or size.target-min (24px) where that is smaller". Lines 187 to 189: "The height never drops below size.target, the platform touch target: 24px on the web and macos, 44 on ios, 48 on android." Line 79 keeps `size.target-min`: the width floor is the WCAG floor. | |
| `packages/react/src/components/OTPField/OTPField.reflow.test.ts` 1 to 3 (comment) | "The platform token layer sets size.target-min to the touch target on ios (44px) and android (48px)." | "The cells keep the platform touch target (size.target: 44px on ios, 48px on android) in height but narrow in width." | |
| `apps/docs/src/styles/docs.css` 1463 and 1464 | `inline-size` and `min-block-size: var(--ds-size-target-min);` | both `var(--ds-size-target)` | The rule says "a square of the platform's target". With the floor at 24 the search button becomes 24 by 24 on phones. |

Kept on purpose, no change suggested:

- `packages/css/src/platform/ios.css` 940 (Sheet handle padding) and 974
  (Drawer handle strip). Both read `target-min` at `0598c2b9` already, and the
  comment says "the handle keeps a 24px strip for the pointer". They go back
  from 44 to 24. If the lead wants a 44px strip on ios, these two move to
  `size.target`.
- `packages/native/src/components/Button/Button.styles.ts` 243 (`minWidth`)
  reads `size['target-min']`: 24 again on the ios and android themes, as at
  `0598c2b9`; the touch slop still comes from `touchTargetOf` (`size.touch.*`).
  `touchTargetOf` could read `size.target` from a platform theme later, but it
  is also called with the web theme and a platform, so it should stay as it is
  for now.

### Elements that lose 44 or 48 on a phone

A probe of every interactive element in every React demo on `ios` and
`android` (Neutral and Desk, dark, en ltr), with the floor at 44 and 48 and
then at 24 (`docs/reports/reset/R0.21/phone-targets-lost.json`). The target is
the element box joined with its `hit` part. These were at or above the
platform target only because R0.13 raised the floor, and were below it at
`0598c2b9` for the same reason they are now. None is below 24. They are
listed for the lead to decide, not as faults of this order:

| Component | Element, ios and android |
| --- | --- |
| Link, Breadcrumbs, ConsentField, Form, LanguageSwitch, SkipLink, Toolbar | inline links: 44 or 48 tall before, 24 now |
| Rating | items 44 or 48 square before, 24 now |
| ResizablePanels, SplitView | handles 44 or 48 wide before, 24 now |
| Tabs | panel (focusable) 44 or 48 before, 24 now |
| Window | TitleBar move handle 44 or 48 before, 24 now |
| ErrorState | summary 44 or 48 before, 24 now |
| TableOfContents | links 44 or 48 before, 25 to 29 now |
| Menubar | bar and triggers 44 or 48 before, 34 (ios) or 36 (android) now |
| ListBox | options 44 or 48 before, 37.9 now |
| Autocomplete, Combobox, MultiSelect | inner control or trigger 44 or 48 before, 42 (ios) or 38 (android) now; the field root follows `size.control.*` |
| NumberField, OTPField, PhoneField, ScrubInput, TagField | inner control 44 or 48 before, the platform `size.control.*` now (28 to 40) |
| RadioCard | items 44 or 48 before, 42.8 now |
| Chip, FilterBar | android only: chip button 48 before, 40 now |

If any of these should meet the platform guide on a phone, the ruling's route
is a platform CSS rule that reads `size.target` (the 320px reflow check then
needs a rerun on that component).

## Measurements (step 3)

React gallery, dark, en ltr, 1280 by 900, every md instance on the component
route; the tab bar row is every item
(`docs/reports/reset/R0.21/control-targets.json`). The target is the larger of
the root box and its `hit` part (Button, IconButton), the `control` part
(Switch, Checkbox hit area), the root (Input) and the `item` part (TabBar).
Smallest width by smallest height over all instances, in px, after the change.
Before and after are equal in every cell.

| Control | Neutral web | Neutral ios | Neutral android | Desk web | Desk ios | Desk android |
| --- | --- | --- | --- | --- | --- | --- |
| Button md (122) | 58.7 x 24 | 93.5 x 44 | 90.1 x 48 | 76.5 x 24 | 95.3 x 44 | 95.7 x 48 |
| IconButton md (134) | 36 x 36 | 44 x 44 | 64.8 x 48 | 35.8 x 35.8 | 44 x 44 | 56.8 x 48 |
| Switch md (23) | 42 x 24 | 61.6 x 44 | 65 x 48 | 42 x 24 | 61.6 x 44 | 65 x 48 |
| Checkbox hit area md (36) | 24 x 24 | 44 x 44 | 48 x 48 | 24 x 24 | 44 x 44 | 48 x 48 |
| Input md (26) | 199.4 x 36 | 199.4 x 44 | 199.4 x 56 | 201.7 x 35.8 | 201.7 x 44 | 201.7 x 56 |
| TabBar item (46) | 59 x 48.2 | 59 x 49 | 59 x 88 | 60.2 x 43.2 | 60.2 x 49 | 60.2 x 88 |

Web: a box by box comparison of every root and part on every route (Neutral
and Desk) found no change on `web` except spinning or shaking elements
(spinners, progress arcs, error icons), whose box depends on the frame.

## Reflow at 320px (step 3)

`npm run contract -- --framework react ... --grep sideways`
(`docs/reports/reset/R0.21/reflow-runs.json`):

| Run | Result |
| --- | --- |
| TitleBar, `android`, before | 4 passed, 4 failed (en ltr in every style: 2px Desk and Studio, 12px Liquid and Neutral; the IconButton `hit` parts) |
| TitleBar, `android`, after | 8 passed: all four styles, both directions |
| OTPField, every platform, after | 32 passed |
| Every component, `ios` | 856 passed, 0 failed (107 components). Meter and Stack rendered no demo under load; alone: 16 passed |
| Every component, `android` | 863 passed, 1 failed (108 components). RadioGroup rendered no demo under load; alone: 8 passed |

The one failure: ProgressCircle, Desk, `android`, ar rtl, 2px, in the sweep
and again alone. It does not come from this order: loading that page four
times with the floor at 48 gave 2, 0, 2, 0px of overflow, and at 24 gave
0, 0, 2, 0px. The overflow depends on the frame the scan reads (the case
"variants", a 105px circle). It needs its own order.

## npm run check

Every step passes except vitest: 1 failed, 2760 passed. The failure is
`packages/react/src/components/OTPField/OTPField.reflow.test.ts`, "fits 320px
on android in every style, cells 48px tall": desk android groups, input 40
tall, expected 48. It passes once `OTPField.css` line 203 reads `size.target`
(see the reader table). That file is outside this order, so check stays red
until the lead assigns the line. The R0.9 dash gate failure no longer shows.

## Contract wording

`docs/contracts/tokens.md`, "Platform layer (ruling 8)", the "Control heights"
row of "What a platform may set". Today:

```
| Control heights | `size.control.*`, `size.touch.*`, `size.target-min` |
```

Proposed:

```
| Control heights | `size.control.*`, `size.touch.*`, `size.target` (the platform touch target: 24 on `web` and `macos`, 44 on `ios`, 48 on `android`), `size.target-min` (the WCAG 2.5.8 floor: 24 on every platform, never changed by one) |
```

`docs/contracts/anatomy.md` line 37 is right as it is.

## Decisions I made

1. The floor stays a platform name, filled with 24 in all four files (see
   "Where the floor lives").
2. `size.target` is listed under `added` in both `size` groups of
   `contract.json`: it is not in section 3.6 of `PLAN.md`.
3. The `macos` target is the WCAG floor (24) and not the HIG default control
   size (28), as the ruling says; the description cites both.

## Left open

- The four reader changes above, for the lead to assign (one line in
  `OTPField.css` turns check green).
- Whether any element in "Elements that lose 44 or 48 on a phone" should get
  a platform rule on `size.target`.
- The intermittent ProgressCircle overflow on `android` rtl.
- The Sheet and Drawer handle strips on `ios` go back to 24px.
- All runs are Chromium; WebKit is not installed.
