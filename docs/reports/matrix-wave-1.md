# Matrix, wave 1 (order 1.17)

Run on 2026-11-12 on branch `claude/ds-order-1-17`, from the lead's branch at
`6fabe3c`. 111 component manifests: 111 ready in React, 59 ready in Angular.
Three styles (Studio, Desk, Neutral), each dark and light.

| Check | Result | Evidence |
| --- | --- | --- |
| React contract suite | 3568 tests: 3421 pass, 4 fail, 143 skipped. The 4 failures are List axe in Desk, a harness timing fault (see below) | `docs/reports/contract-react.json` |
| Angular contract suite | 1833 tests: 1779 pass, 0 fail, 54 skipped | `docs/reports/contract-angular.json` |
| Target size, WCAG 2.5.8 | React 1038 of 1038 pass, Angular 543 of 543 pass, every style and every density, overlays open | the two contract reports |
| axe sweep, WCAG 2.2 AA | 1656 runs on 111 pages, en ltr and ar rtl, overlays closed and open: 0 violations | `docs/reports/a11y-react.md`, `.json` |
| Screenshot matrix, React | 1782 shots, 109 components; 1765 byte equal across two full runs, 17 differ by at most 1 channel value (ScrollArea, Tabs) | `docs/reports/shots/matrix/react/` |
| Screenshot matrix, Angular | 984 shots, 58 components, every shot byte equal across two captures | `docs/reports/shots/matrix/angular/` |
| React and Angular compare | 984 pairs, 984 pass, 0 over the limit; 73 pairs differ below the limit, in 5 components, each explained below | `docs/reports/shots/matrix/compare-react-angular/` |
| Size | Every package entry and component CSS file, gzip | `docs/reports/size-wave-1.md` |

Commands, in the order they ran:

```sh
npm run contract -- --framework react          # 3 workers, dev gallery
npm run contract -- --framework angular        # 3 workers, ng serve
# a production build of the React gallery, served by vite preview on 5192
npx vite build --outDir <scratch>/gallery-react-dist   # in apps/gallery-react
npx vite preview --outDir <scratch>/gallery-react-dist --port 5192
npm run shots -- --url http://localhost:5192 --workers 2
npm run a11y -- --url http://localhost:5192 --workers 2
npm run a11y -- --url http://localhost:5192 --page /all   # rerun, see below
npm run shots -- --framework angular --url http://localhost:4202 --ready --keep none --workers 3
npm run shots -- --compare react angular
npm run shots -- --url http://localhost:5192 --workers 4 --no-verify   # second full run
npx tsx scripts/size.ts
```

The shots and the axe sweep ran against a production build of the React
gallery, not the dev server. A check on Button and Dialog (42 shots) gave the
same bytes from both, and the build loads twice as fast. The contract suites
ran on the dev servers, as `run.ts` starts them.

## Contract suite, React

3568 tests, 3421 pass, 4 fail, 143 skipped (Bidi and Theme have no demo
route; the rest are key checks with no hint and overlay checks with no
trigger, each a note in the report).

| Component | Test | Finding | Likely owner |
| --- | --- | --- | --- |
| List | axe, desk dark en ltr | color-contrast on rows 4 and 6 of the `too-many` case: `#151515` and `#0d0d0d` on `#000000` | ds-qa, contract suite |
| List | axe, desk dark ar rtl | color-contrast on row 4: `#4f4f4f` on `#000000`, 2.56:1 | ds-qa, contract suite |
| List | axe, desk light en ltr | color-contrast on row 4: `#666663` on `#e4e2dd`, 4.44:1 | ds-qa, contract suite |
| List | axe, desk light ar rtl | color-contrast on rows 6 and 7: `#888784` and `#a6a49f` on `#e4e2dd` | ds-qa, contract suite |

Why the contract suite and not List: the failing rows and their colors change
from run to run, and List plays `list-stagger` (an opacity entrance) the first
time it has rows on screen (`packages/react/src/components/List/List.tsx:73`).
The contract axe test (`packages/contract-tests/src/contract.spec.ts:587`)
runs axe right after the page loads, without reduced motion and without
waiting for finite animations, so axe reads rows that are still fading in. The
same pages pass under reduced motion in the axe sweep (12 List runs, 0
violations), and the target size tests already wait with
`finiteAnimationsDone`. The fix: call `page.evaluate(finiteAnimationsDone)`
before `runAxe` in the closed axe test, as the target size test does. Nothing
to change in List.

## Contract suite, Angular

1833 tests, 1779 pass, 0 fail, 54 skipped. 58 of the 59 ready components have
a demo; Theme has none, as in React. Every Angular ready component passes
anatomy, variant and state attributes, the keyboard map, target size in every
style and density, reflow at 320px, and axe in every style, scheme and
direction.

## Target size (WCAG 2.5.8)

Measured by the contract suite (`undersizedTargets` in
`packages/contract-tests/src/page.ts`): every interactive element in every
demo case, at least 24 by 24 CSS px, in each style (Studio, Desk, Neutral) at
each density (compact, default, comfortable), dark, en ltr, and for every
overlay with each trigger of the variants case open, density default.

| Framework | Components | Style and density tests | Open tests | Result |
| --- | --- | --- | --- | --- |
| React | 109 | 981 | 57 | 1038 pass, 0 fail |
| Angular | 58 | 522 | 21 | 543 pass, 0 fail |

The 44pt (iOS) and 48dp (Android) passes are not run for the web; they belong
to wave 2.

## Accessibility sweep (WCAG 2.2 AA)

axe with the tags wcag2a, wcag2aa, wcag21aa and wcag22aa on `/`, `/all` (both
with the gallery shell) and the 109 component pages with a demo (chrome=0),
in every style and scheme, in English ltr and Arabic rtl, with reduced motion.
Overlays run twice: closed, and with the first visible trigger's root open.
That is 1656 runs on 111 pages, 324 of them open passes (96 of those are
skipped with a note because the demo has no visible trigger at 1280px, for
example Breadcrumbs, whose overflow appears only when it collapses).

Result: 1656 pass, 0 violations, so no criterion to name. The report now
names the WCAG criterion of every violation from the axe tags (wcag143 is
1.4.3 Contrast (minimum)) and sums them by criterion, rule and owner, for the
next run that finds one.

The first run had 12 errors, all on `/all`: the page renders about 850 demo
cases and took longer than the 30s wait while two contract suites ran on the
same four cores. Alone it loads in about 26s. The shell pages now get 120s,
and `/all` passed in all 12 modes on the rerun. A note for the gallery owner:
26s for `/all` is slow, and it will grow with every wave.

## Screenshot matrix

`scripts/shots.ts` takes the `variants` case of every component with a demo
at chrome=0, 1280 by 800, full page, device scale factor 1, animations off,
reduced motion, fonts loaded:

| Kind | Rule | React | Angular |
| --- | --- | --- | --- |
| Base | every style and scheme, en ltr and ar rtl, density default | 1308 | 696 |
| Open | overlays with a visible trigger, the first one open, same modes | 216 | 84 |
| Densities | controls, compact and comfortable, dark, en ltr, each style | 258 | 204 |
| Total | | 1782 | 984 |

Controls come from manifest data (`isControl`): 43 in React, 34 in Angular.
Overlays: 18 in React (LanguageSwitch, Menubar and SplitButton open a
DropdownMenu, named by `contract.opens`), 7 in Angular.

### What changed in the script

- Parallel workers (`--workers`, default 4) were there; each shot is still
  taken twice in fresh contexts unless `--no-verify`.
- Every PNG is recompressed without loss through libvips (sharp, which is in
  the install through `next`; it is loaded when present and not
  added as a dependency). The pixels do not change; files are 2.3 times
  smaller. Without sharp the Chromium PNG is kept.
- A file whose bytes did not change is not written again.
- The whole matrix goes to a work folder outside git
  (`node_modules/.cache/ds-shots/<framework>`). Only a kept subset is copied
  into the docs folder (`--keep subset`, the default): Neutral light, Studio
  dark and Desk dark rtl, with their open and density shots. `captured.json`
  and `index.md` list every shot with its size and sha256, kept or not.
  `--keep all` copies everything.
- Overlays now use the component `contract.opens` names and the first visible
  trigger. Before, Breadcrumbs, LanguageSwitch, Menubar and SplitButton open
  shots failed (48 shots).
- When something covers the trigger, it is opened from the keyboard. The
  Menubar demo shows a menu open at load, and in ltr that menu covers the
  first trigger, so a click times out.
- Stability is judged on the recompressed bytes, because Chromium's encoder
  can write different bytes for the same pixels.
- `--ready` keeps the run to components the manifest marks ready for the
  framework.

### What is committed

The full matrix is 1782 React shots (41.4 MB after recompression) and 984
Angular shots (23.8 MB). That is too much to commit each wave, so:

- React: 721 kept images, 17.2 MB, plus `captured.json` and `index.md` with
  every shot's hash. The other 1061 are listed with a short hash in the index.
- Angular: no images. `captured.json` and `index.md` with every hash. Every
  Angular pair matches React within the compare limit, so the React image of
  the same file name shows what Angular draws.
- Compare: the table and 73 diff images (3.5 MB), one for each pair that
  differs at all.

The wave 0 matrix and earlier wave 1 snapshots in that folder (108 MB of
images) are replaced. They stay in git history.

### Stability

Within a run, each shot is captured twice in fresh contexts: Angular 984 of
984 equal. React: two full runs compared by hash in `captured.json`: 1765 of
1782 byte equal. The 17 that differ are ScrollArea (8) and Tabs (9), in
several styles and densities. Measured on `scroll-area/desk-dark-rtl.png`: 3
pixels differ, each by 1 of 255 on one channel, inside the scroll viewport.
No one can see it, but the acceptance asks for byte stable shots, so this is
a finding. Likely cause: a fractional position (the Tabs indicator transform,
the ScrollArea thumb or scroll offset) rasterized with a different subpixel
phase between loads. Owners: lane 7B (Tabs) and lane 8C (ScrollArea). A
rounded indicator offset, or a whole pixel thumb position, would settle it.

## React and Angular

984 pairs (every Angular shot has a React twin), 984 pass (threshold 0.1, at
most 0.5 percent of pixels). 798 React shots have no Angular twin because
those components are not ported. 911 pairs are 0 pixels apart. 73 differ
below the limit, in five components:

| Component | Pairs | Pixels | What differs | Which side is right | Owner |
| --- | --- | --- | --- | --- | --- |
| InputGroup | 18 | about 430 | The Arabic row is an `InputGroup dir="ltr"` with a url value. React aligns the value to the right edge, Angular to the left. The DOM is the same in both (the input's computed direction is ltr in both), but in React the rule `[data-ds='input']:dir(rtl) > [data-part='control']` (`packages/css/src/components/Input.css:248`) matches and in Angular it does not | Angular: the group says ltr, so the value starts on the left. The React result looks like Chromium resolving `:dir()` from the ancestor that was rtl when React built the subtree. Replacing `:dir(rtl)` with a `[dir='rtl']` ancestor selector that stops at the group, or setting `dir` on the control, would make both agree | Input.css owner (wave 0 Input, ds-component) |
| Switch | 18 | about 110 | The Arabic off text: React `غير مفعل`, Angular `متوقف` | React: it pairs with `مفعل`. Angular demo `packages/angular/src/components/switch/switch.demo.ts:135` | ds-angular A3.1 |
| OTPField | 18 | about 190 | The page heading: React `OTPField`, Angular `OtpField` | React: the manifest name. The Angular gallery builds the name from the slug (`apps/gallery-angular/src/app/axes.ts:62`) | ds-angular, gallery |
| FormWizard | 18 | about 40 | The required asterisk sits about 3px further from the label text in Angular | React. Likely a whitespace text node in the Angular Field label template (`packages/angular/src/components/field/field.ts:80`), which projects the label through `ngTemplateOutlet` with line breaks around it | ds-angular A2.1 (Field) |
| Banner | 1 | 3 | The star icon edge in `neutral-light-ltr` only: 3 antialiased pixels | Neither: the same SVG rasterized at a different subpixel phase | none |

Diff images: `docs/reports/shots/matrix/compare-react-angular/<component>/<file>.png`.

## Size

`scripts/size.ts` (new) builds each public entry as a consumer bundler would
(vite library mode, minified, every bare import external) and gzips it. Full
tables in `docs/reports/size-wave-1.md`. The ten largest by gzip:

| Entry | Gzip KB |
| --- | ---: |
| `@the-system/react` | 99.5 |
| `@the-system/angular` | 94.9 |
| `@the-system/css` | 57.8 |
| `@the-system/shared` | 16.8 |
| `@the-system/motion` | 11.8 |
| `@the-system/tokens` | 11.6 |
| `@the-system/icons/react` | 9.6 |
| `@the-system/icons` | 9.4 |
| `@the-system/tokens/css` | 8.9 |
| `@the-system/native` | 5.5 |

A whole React app that imports every barrel pays 217 KB gzip of the system's
own code (204 KB for Angular), before tree shaking and without radix-ui,
react-aria-components or Angular. Largest component CSS files: Dialog 2.7 KB,
Button 2.5 KB, Select and MultiSelect 2.1 KB. The `ai-*` and `charts-*`
packages are empty stubs (0.0 KB).

## Gate 1

| Condition | Verdict | Evidence from this order |
| --- | --- | --- |
| Both web example apps use only system components for buttons, dialogs, toasts, tooltips, menus and forms | pass on the checker's evidence | `ds doctor examples/consumer-next --json` and `consumer-vite`: 0 findings, so 0 `ds/primitives`. Smoke tests are order 1.18's, not run here |
| `ds doctor` is clean on both | pass | consumer-next: 11 files, 0 errors, 0 warnings. consumer-vite: 12 files, 0 errors, 0 warnings |
| The 55 Angular components pass the contract suite | pass | 59 ready, 58 with a demo, 1779 pass, 0 fail. Compare: 984 pairs, 0 over the threshold. 73 pairs are not 0 pixels apart; the five causes are above, and three of them (Switch copy, OTPField heading, FormWizard asterisk) are Angular fixes |
| 105 React components | fail, by 4 tests | 111 manifests ready and valid (`npm run check` manifests step). Full contract run: 4 failures, all List axe in Desk, caused by the suite not waiting for `list-stagger`. The appendix table in `docs/plan/wave-1.md` and STATE.md is not ticked yet; that is the lead's |
| Neutral style | pass | `ds style check neutral`: contract 698, contrast 602, icons 94, fonts 2, all pass. `packages/styles/neutral/style.json` says `"status": "proposed"` |
| Docs site, registry, CLI, checker | not proven here | Orders 1.12 to 1.15 own the link check, the shadcn proof, the snapshots and the fixtures. This order ran the CLI (`ds doctor`, `ds style check`) and both worked |
| `npm run check` | pass | green on the commit that adds this report |

Order 1.17's own acceptance: no axe violations (pass, 0 in 1656 runs); every
shot byte stable across two runs (fail for 17 of 1782, ScrollArea and Tabs,
1 channel value); the results go to the lead for `docs/reports/wave-1.md`.

## Files

- `scripts/shots.ts`, `scripts/a11y.ts`, `scripts/size.ts` (new)
- `docs/reports/shots/matrix/react/`, `angular/`, `compare-react-angular/`
- `docs/reports/contract-react.json`, `docs/reports/contract-angular.json`
- `docs/reports/a11y-react.json`, `docs/reports/a11y-react.md`
- `docs/reports/size-wave-1.md`, `docs/reports/size-wave-1.json`
- `docs/reports/matrix-wave-1.md`, `docs/reports/lanes/order-1-17.md`
