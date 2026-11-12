# Matrix, wave 0 (order 0.19)

Run on 2026-11-12 against the React gallery, nothing committed. Commands:

```sh
npm run shots                         # docs/reports/shots/matrix/react/
npm run shots -- --compare react angular
npm run a11y                          # docs/reports/a11y-react.json and .md
npm run contract -- --framework react # docs/reports/contract-react.json
npm run check
```

## What was captured

`scripts/shots.ts` finds the components from `packages/manifest/manifests.gen.json`
that render a demo at `/c/<kebab>` (Bidi and Theme have no demo, so 10 of 12),
the styles and schemes from `packages/styles/*/style.json` (studio and desk,
dark and light), and takes the `variants` case at `chrome=0`, 1280 by 800, full
page, device scale factor 1, animations off, reduced motion, after
`document.fonts.ready`.

| Kind | Rule | Shots |
| --- | --- | --- |
| Base | every component, 2 styles, 2 schemes, en ltr and ar rtl, density default | 80 |
| Open | overlays (manifest states open and closed, and a `[data-demo-trigger]`): Dialog, Toast; first trigger in the variants case open | 16 |
| Densities | controls, dark, en ltr, compact and comfortable in each style (default is the base shot) | 12 |
| Total | | 108 |

Controls are decided from manifest data (`isControl` in
`packages/contract-tests/src/lib.ts`): a `size` prop on the control scale (no
`xl` or `2xl`), focusable (a11y.focus does not say never focusable), and no
open or closed state. That gives Button, IconButton and Input. Dialog has a
size prop but opens and closes; Icon has one but is never focusable.

Index with links: `docs/reports/shots/matrix/react/index.md`. Every shot with
size and hash: `docs/reports/shots/matrix/react/captured.json`.

Size: 108 PNGs, 7.0 MB in `matrix/react`. With the Angular snapshot (40 PNGs,
3.6 MB) the whole `docs/reports/shots/matrix` folder is 11 MB. Diff images are
written only for pairs that differ, so the compare folder holds only its
table now.

## Stability

Each shot is taken twice in fresh browser contexts and the bytes compared:
108 of 108 byte equal. Two full runs were also compared by hash from
`captured.json`: 0 of 108 differ. No component is unstable. What makes it so:
`animations: 'disabled'` finishes the grow animation of Window and the open of
Dialog and Toast, the pointer is parked at 0,0 after a trigger click, the caret
is hidden, and fonts are awaited.

## React and Angular

`npm run shots -- --compare react angular` started the Angular gallery (being
built by another agent; this is a snapshot of its state today). It routes
Button, IconButton and Dialog: 40 pairs, all 40 with 0 differing pixels
(threshold 0.1, limit 0.5 percent). 68 React shots have no Angular route yet.
Table: `docs/reports/shots/matrix/compare-react-angular/index.md`.

## Accessibility sweep

`scripts/a11y.ts`: axe with wcag2a, wcag2aa, wcag21aa, wcag22aa on `/`, `/all`
(both with the gallery shell) and the 10 component pages (chrome=0), every
style and scheme, en ltr and ar rtl, Dialog and Toast also with the first
trigger's root open. No manifest lists `contract.skipAxeRules` today.

Result: 112 runs on 12 pages, 112 pass, 0 violations. Exit code 0.

## Target size

What the check measures (`undersizedTargets` in `packages/contract-tests/src/page.ts`,
ported from GoBanana `e2e/design-target-size.spec.ts`, WCAG 2.5.8): every
`a[href]`, `button`, `input`, `select`, `textarea`, `summary`, `[role=button]`,
`[tabindex]` and contenteditable element inside a demo case, measured with
`getBoundingClientRect` (padding included) and widened by an absolutely
positioned `::before` or `::after` that takes pointer events. It must be 24 by
24 CSS px.

Exceptions: disabled elements, elements in `[inert]`, `[hidden]` or a closed
`dialog`, invisible ones, non native `tabindex="-1"` elements that are not
buttons, and visually hidden controls whose pointer target is their label. A
skip link is measured focused. The inline exception holds for a link in a
sentence. The spacing exception is not taken. One case is measured, not
assumed: an undersized element that is the only interactive element of a root
of 24px or more passes when a click in the root outside it focuses it (the
input inside an Input or Field box).

What was missing and is now added (`packages/contract-tests/src/contract.spec.ts`):

- It ran in the default style at density default only. It now runs in every
  style and every density (compact, default, comfortable), dark, en ltr.
  Scheme and direction do not change sizes.
- Roots a trigger opens (Dialog, Toast, which render outside the demo cases)
  were not measured. A new test opens each trigger of the variants case in
  turn and measures the opened roots (11 Dialog roots and 7 Toast roots per
  style).
- Sizes are read after every finite animation finishes. Without that, the
  Desk Window, measured mid grow from its button, read 18.2 by 18.5 px for
  its 24px lights and move handle (a false failure on the first run).

Result: all 64 target size tests pass. Notes worth keeping: in compact density
the `xs` and `sm` Input controls are 22px tall inside a 24px box, which passes
through the click probe.

Not run for the web now: `platform=ios` (44pt) and `platform=android` (48dp)
passes. They belong to wave 2 with the touch templates.

## Contract suite, React

`npm run contract -- --framework react`: 232 tests, 229 passed, 0 failed, 3
skipped.

| Component | Passed | Failed | Skipped |
| --- | --- | --- | --- |
| Bidi | 0 | 0 | 1 (no demo route) |
| Button | 21 | 0 | 0 |
| Dialog | 31 | 0 | 0 |
| Field | 21 | 0 | 0 |
| Icon | 20 | 0 | 1 (no keys and no disabled root) |
| IconButton | 21 | 0 | 0 |
| Input | 21 | 0 | 0 |
| Theme | 0 | 0 | 1 (no demo route) |
| TitleBar | 21 | 0 | 0 |
| Toast | 31 | 0 | 0 |
| Window | 21 | 0 | 0 |
| WindowControls | 21 | 0 | 0 |

## Visual findings

From 22 screenshots read across all 10 components, both styles, both schemes,
both directions, densities and open states. None of them fails a gate. Each
is a note for the owner of the file.

1. **English copy in Arabic mode reads with flipped punctuation.** The
   variants case shows English copy when `lang=ar dir=rtl`, laid out right to
   left, so `?Publish this board` and `.every reference in place` appear.
   Seen in `dialog/desk-dark-rtl-open.png`, `window/studio-light-rtl.png`,
   `field/desk-dark-rtl.png`. Source: `packages/react/src/components/Dialog/Dialog.demo.tsx:29-30`,
   the Window and Field demos. Either the variants case speaks the gallery
   language or the English runs carry `lang="en"` (as the static toasts do).
2. **Toast opened in Arabic mode is laid out right to left with English copy,
   while the static toasts next to it are left to right.** The triggers call
   `toast({ tone, title })` without `lang: 'en'`, unlike the static examples
   that pass `lang="en"`. `toast/desk-light-rtl-open.png`,
   `packages/react/src/components/Toast/Toast.demo.tsx:65`.
3. **Toast count badge wraps alone onto a second line in Studio.** "Could not
   publish page" pushes `×3` under the title, offset by its inline start
   margin. Desk fits it inline. `toast/studio-dark-ltr-open.png`,
   `packages/css/src/components/Toast.css:214`.
4. **Horizontal Field clips its placeholder.** The horizontal Field's input is
   about 130px wide, so "For example, spring launch" shows as "For example,
   spring" in ltr and "nple, spring launch" in rtl.
   `field/studio-dark-ltr.png`, `field/desk-dark-rtl.png`,
   `packages/react/src/components/Field/Field.demo.tsx:30`.
5. **Input text adornments sit about 2px above the value.** `$` and `USD`
   next to `29`, and `px` next to `320`, are not on the value's baseline, in
   both styles. `input/desk-dark-ltr-comfortable.png`,
   `input/studio-dark-ltr.png`, `packages/css/src/components/Input.css:140`.
6. **xs Input text crowds the pill end.** At xs the inline padding
   (`--ds-space-xs`) is smaller than the 12px end radius, so "xs, default"
   nearly touches the curve. `input/studio-light-rtl.png`,
   `packages/css/src/components/Input.css:76`.
7. **WindowControls active and inactive look the same.** The caption says
   "lit in an active window, idle dots in an inactive one"; at rest both rows
   paint the same dot color (232, 232, 232 in Studio dark; 139, 138, 133 in
   TitleBar Desk light). The GoBanana reference also paints plain dots at
   rest, so the caption may be what is off.
   `window-controls/studio-dark-ltr.png`, `title-bar/desk-light-ltr.png`,
   `packages/react/src/components/WindowControls/WindowControls.demo.tsx:28`.
8. **Icon demo is unstyled next to the others.** It uses raw `h2` and `h3`
   headings in browser default sizes and no label column, unlike every other
   demo's DemoCase layout. `icon/studio-light-ltr.png`,
   `packages/react/src/components/Icon/Icon.demo.tsx:25-60`.
9. **Studio shows Desk lights in TitleBar and WindowControls.** The Studio
   Window draws a flat panel with icon buttons, but the TitleBar and
   WindowControls demos still show the three dots in Studio, and the Studio
   TitleBar centers the title in rtl as the Desk reference does.
   `title-bar/studio-dark-rtl.png`, `window-controls/studio-dark-ltr.png`.
   A question for the style owner, not a bug yet.

Checked and fine: fonts (Inter in Studio, Instrument Sans in Desk, IBM Plex
Sans Arabic for Arabic runs) load in every shot; icons mirror in rtl
(chevrons and arrows flip, the clock and play do not); button start and end
icons swap sides in rtl; Desk lights stay top left in rtl as in
`desktop.css`; no overflow, no unstyled parts, no missing icons.

## Files

- `scripts/shots.ts`, `scripts/a11y.ts`
- `packages/contract-tests/src/server.ts` (new: free port, start, stop, route
  probe; `run.ts` now uses it too)
- `packages/contract-tests/src/lib.ts` (`density` on `Axes` and `demoPath`,
  `DENSITIES`, `isControl`), `src/lib.test.ts`
- `packages/contract-tests/src/page.ts` (`undersizedTargets` takes a scope,
  `finiteAnimationsDone`), `src/contract.spec.ts`, `README.md`
- `docs/reports/shots/matrix/`, `docs/reports/a11y-react.json`,
  `docs/reports/a11y-react.md`, `docs/reports/contract-react.json`
