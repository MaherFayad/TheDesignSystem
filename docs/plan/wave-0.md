# Wave 0: the spike

Goal: prove the contract across frameworks. Five components in React in two
styles (studio, desk), two of them in Angular on the same CSS, one in React
Native on generated theme objects.

Every order: read `AGENTS.md` and `docs/contracts/`. Prove with
`npm run check`. Forbidden for every subagent: root config, generated files,
`STATE.md`, `PLAN.md`, `DECISIONS.md`, `docs/contracts/` (except where an
order names a file there), and any file another order owns.

Sources: GoBanana at `/home/user/gobanana` (GB), Figma-Killer-2 at
`/home/user/maherfayad-stack/figma-killer-2` (FK2).

## Batches

| Batch | Orders | Starts when |
| --- | --- | --- |
| A | 0.4 and 0.5, 0.6 part 1, 0.8 | 0.3 is committed |
| B | 0.7, 0.6 part 2 | 0.5 is green |
| C | 0.9, 0.10 | 0.7 and 0.8 are green |
| D | 0.11, 0.12, 0.13, 0.14, 0.17 | 0.9 is green |
| E | 0.15, 0.16, 0.18 | 0.11 to 0.14 are green |
| F | 0.19, 0.20 | everything else is green |

## 0.4 Token extraction (ds-tokens)

Goal: convert every `--st-*` token in GB `banana-server/styles/studio-tokens.css`
to DTCG.

- Base tokens to `packages/tokens/src/base/`. Studio values to
  `packages/styles/studio/tokens.dark.json`, desk values to
  `packages/styles/desk/tokens.dark.json`.
- Studio Light from the `[data-editor-theme='light']` block in FK2
  `src/styles/globals.css`, into `packages/styles/studio/tokens.light.json`.
- `packages/styles/desk/tokens.light.json`: a first pass that fills every
  semantic name so the build and gates run. Order 0.17 designs it properly.
- `packages/tokens/src/contract.json`: the semantic names from section 3.6 of
  PLAN.md, as a machine readable list.
- `docs/contracts/token-mapping.md`: old name, new name, value, source file,
  notes. One row per source token.
- Fetch the DTCG spec at designtokens.org first. Note differences from
  `docs/contracts/tokens.md` in your report.

Owns: `packages/tokens/src/`, `packages/styles/{studio,desk}/tokens.*.json`,
`docs/contracts/token-mapping.md`.
Done when: no source token is dropped. Every row has a source. A test counts
source tokens against mapping rows.

## 0.5 Token build (ds-tokens)

Goal: `packages/tokens/build.ts` with the five outputs in
`docs/contracts/tokens.md`. Density selectors included. Reads the prefix from
`ds.config.json`. Discovers styles from `packages/styles/*/tokens.*.json`.

Owns: `packages/tokens/` (build.ts, tests, snapshots).
Done when: two runs give byte equal output. Snapshot tests pass for CSS and
for theme objects.

## 0.6 Gates (ds-qa)

Goal: the gates, as Vitest tests under `packages/lint/src/gates/`, with the
logic in `packages/lint/src/rules/` so `ds doctor` can reuse it in wave 1.

Part 1 (no token dependency). Port from GB `banana-server/tests/design-*.test.ts`:
no raw colors, logical properties (allow list with a reason per entry), no em
dash or en dash (all tracked text files, PLAN.md included), no native `title`.
Port from FK2 `src/__tests__/architecture/`: token vocabulary (every `var(--ds-*)`
used in CSS exists in the token build), no Tailwind deps or utilities, button
primitive usage (no bare `<button>` outside the Button implementation). Add:
no style literals in React Native files. Also: only `transform` and `opacity`
in transitions and animations, no `!important`.

Part 2 (after 0.5): contrast pairs (4.5:1 text, 3:1 UI) per style and scheme
from the built tokens, and every semantic name in
`packages/tokens/src/contract.json` filled in every style and scheme.

Owns: `packages/lint/`.
Done when: all gates run in `npm run check`, each with a failing fixture test
that proves the gate can fail.

## 0.7 Theme and React gallery (ds-component)

Goal: the base everything renders in.

- `packages/react/src/theme/`: `Theme` (stamps all axes, resolves from the
  parent, wires Radix `Direction`), `useTheme`, `useOptionalPart`, `Bidi`.
- `packages/css/src/reset.css`, `base.css`: reset and base layers, `:lang(ar)`
  rules (Arabic font, zero tracking, taller leading, small text one step up),
  focus ring, reduced motion.
- `packages/styles/{studio,desk}/style.json` and `fonts.css` (font loading
  through fontsource, ported from GB `banana-server/styles/fonts.css`).
- `packages/shared/src/bidi.ts` from GB `banana-server/lib/site/bidi.ts`.
- `apps/gallery-react/`: Vite app. Route `/c/<slug>` with the axis query keys
  from `docs/contracts/anatomy.md`, axis controls in the shell, `chrome=0`,
  `case=`. A demo kit (`DemoCase`) in `packages/react/src/demo/`.
- Manifests: `Theme`, `Bidi`.

Owns: `packages/react/src/theme/`, `packages/react/src/demo/`,
`packages/css/src/reset.css`, `packages/css/src/base.css`,
`packages/styles/{studio,desk}/style.json`, `packages/styles/{studio,desk}/fonts.css`,
`packages/shared/src/bidi.ts` and its test, `apps/gallery-react/`,
`packages/manifest/src/component/{Theme,Bidi}.manifest.json`.
Done when: the gallery renders in all axis combinations. A Playwright smoke
script proves the attributes change with the URL.

## 0.8 Icons (ds-style)

Goal: `packages/icons`. System icon names (a first set of about 40 that the
wave 0 and wave 1 components need), SVG sources from pixelarticons, a
generator that emits React components, Angular components and
react-native-svg components. Sizes 12, 16, 24. A mirror flag for RTL.
`packages/styles/{studio,desk}/icons.ts` map system names to pixel glyphs.
Add pixelarticons to `THIRD_PARTY_NOTICES.md` (the lead applies the row from
your report).

Owns: `packages/icons/`, `packages/styles/{studio,desk}/icons.ts`,
`packages/css/src/components/Icon.css`, `packages/react/src/components/Icon/`,
`packages/manifest/src/component/Icon.manifest.json`.
Open for 0.15 and 0.16: the Angular and native icon sources sit in
`packages/icons/generated-pending/` until those frameworks are installed.
Review notes to settle there: the Angular `label` check must equal React's
(`!== undefined`), stale set attributes on a set change, a Directive instead
of a Component, and `accessibilityElementsHidden` on iOS.
Done when: generated components typecheck, a unit test renders an icon in
React and checks the mirror flag. Icons render in the gallery once 0.7 lands.

## 0.9 Button (ds-component)

Goal: `Button` and `IconButton` from GB `.st-btn` in
`banana-server/styles/studio-components.css` and `RollButton.tsx`.
Variants through the shared axes, sizes, loading, icon only. The yellow
primary in Desk comes from tokens. The roll label is a Desk recipe.

Owns: `packages/react/src/components/{Button,IconButton}/`,
`packages/css/src/components/{Button,IconButton}.css`,
`packages/manifest/src/component/{Button,IconButton}.manifest.json`,
`packages/styles/desk/recipes/Button.css`.
Done when: the component checklist in section 6 of PLAN.md.

## 0.10 Field and Input (ds-component)

Goal: `Field` (label, description, error), `Input`, pill shape, focus glow,
invalid and read only states. From GB `.st-input` and FK2 `Input`, `FormField`.

Owns: `packages/react/src/components/{Field,Input}/`,
`packages/css/src/components/{Field,Input}.css`,
`packages/manifest/src/component/{Field,Input}.manifest.json`.
Done when: the component checklist.

## 0.11 Dialog (ds-component)

Goal: Radix Dialog. Sizes sm to 2xl, `tone="danger"`, the focus rule from the
manifest. In Desk it renders with window chrome through an optional part.
From GB `components/studio/Dialog.tsx`, `modalStack.ts`.

Owns: `packages/react/src/components/Dialog/`,
`packages/css/src/components/Dialog.css`,
`packages/manifest/src/component/Dialog.manifest.json`,
`packages/styles/desk/recipes/Dialog.css`.
Done when: the component checklist.

## 0.12 Toast (ds-component)

Goal: Radix Toast with a `toast()` bus in `packages/shared/src/toast.ts`
(from GB `toastBus.ts`). Error toasts stay until closed. Toasts render above
an open dialog.

Owns: `packages/react/src/components/Toast/`,
`packages/css/src/components/Toast.css`,
`packages/manifest/src/component/Toast.manifest.json`,
`packages/shared/src/toast.ts` and its test.
Done when: the component checklist.

## 0.13 Window (ds-component with ds-style)

Goal: `Window`, `TitleBar`, `WindowControls` (12px lights, 24px targets).
Kinds canvas, finder, settings. Open, close, zoom and minimize from motion
values, Web Animations API only. Arrow keys move, Escape closes. Studio
renders the same component as a flat panel with no lights. From GB
`components/window/` and `desktop/Window.tsx`, `FrameLights.tsx`.

Owns: `packages/react/src/components/{Window,TitleBar,WindowControls}/`,
`packages/css/src/components/{Window,TitleBar,WindowControls}.css`,
their manifests, `packages/shared/src/window.ts` and its test,
`packages/motion/src/window.ts`, `packages/styles/desk/recipes/Window.css`,
`packages/styles/{studio,desk}/motion.ts`.
Done when: the component checklist, plus the keyboard path test.

## 0.14 Contract suite (ds-qa)

Goal: `packages/contract-tests`: Playwright tests generated from the
manifests. For each component: anatomy attributes present, variant attributes
match props, the keyboard map works, axe is clean. Takes a gallery URL.
`npm run contract -- --framework react` starts the gallery and runs it.

Owns: `packages/contract-tests/`.
Done when: passes against the React gallery.

## 0.15 Angular proof (ds-angular)

Goal: `apps/gallery-angular`, the `dsTheme` directive, Button and Dialog on
the shared CSS with no CSS changes.

Owns: `packages/angular/`, `apps/gallery-angular/`, the `angular` block of the
Button, IconButton and Dialog manifests.
Done when: the contract suite passes against the Angular gallery, and Angular
screenshots match the React baselines within the pixel threshold.

## 0.16 React Native proof (ds-native)

Goal: `apps/gallery-native` (Expo), `ThemeProvider` on the generated theme
objects, Button in Studio and Desk, dark and light, RTL.

Owns: `packages/native/`, `apps/gallery-native/`,
`packages/styles/{studio,desk}/native/`, the `native` block of the Button
manifest.
Done when: tests pass. A web export screenshot sits beside the React Button
in `docs/reports/shots/native/`.

## 0.17 Desk Light (ds-style)

Goal: design the missing scheme: a light desk backdrop, glass on light tested
against the brightest backdrop, a border on the yellow primary, light focus
ring and hover steps. Rationale and screenshots in
`docs/reports/desk-light.md`. Mark it proposed.

Owns: `packages/styles/desk/tokens.light.json`, `docs/reports/desk-light.md`,
`docs/reports/shots/desk-light/`.
Done when: contrast gates pass. HUMAN GATE logged, work continues.

## 0.18 Consumers (ds-docs)

Goal: `examples/consumer-next` (app router, plain CSS, both locales) and
`examples/consumer-vite` (CSS Modules). Each renders all five components from
the packages.

Owns: `examples/consumer-next/`, `examples/consumer-vite/`.
Done when: both build and pass a Playwright smoke test.

## 0.19 Matrix (ds-qa)

Goal: `npm run shots`: 5 components, Studio and Desk, dark and light, 2
directions, 3 densities for controls. `npm run a11y` clean in English and
Arabic. Target size test (port GB `e2e/design-target-size.spec.ts`).

Owns: `scripts/shots.ts`, `scripts/a11y.ts`, `docs/reports/shots/`,
`packages/contract-tests/` additions.
Done when: screenshots saved, no axe violations.

## 0.20 Gate 0 report (lead)

`docs/reports/wave-0.md`: what works, what the contract could not express,
what the Angular and React Native proofs taught, changes made to the
contract, screenshots side by side.
