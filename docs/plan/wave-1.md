# Wave 1: core

Goal (section 7 of PLAN.md): 105 React components in nine batches, the
Neutral style, the first five Angular families (55 components), the motion
catalog, the checker (`ds doctor`), the registry, the CLI, the docs site and
the agent files. Gate 1 closes the wave.

This plan is split into files:

| File | Holds |
| --- | --- |
| `docs/plan/wave-1.md` (this file) | Rules, batch 0 (carry over), orders 1.10 to 1.20, the schedule, gate 1, the appendix |
| `docs/plan/wave-1-batch-1.md` to `wave-1-batch-9.md` | One work order per React component, and the lanes of each batch |
| `docs/plan/wave-1-angular.md` | Angular batches 1 to 5, one order per lane |

Sources: GoBanana at `/home/user/gobanana` (GB), Figma-Killer-2 at
`/home/user/maherfayad-stack/figma-killer-2` (FK2). Short forms used in the
orders:

- `GB css` = `/home/user/gobanana/banana-server/styles/studio-components.css`
- `GB studio/` = `/home/user/gobanana/banana-server/components/studio/`
- `GB desktop/` = `/home/user/gobanana/banana-server/app/(site)/_components/desktop/`
- `GB site/` = `/home/user/gobanana/banana-server/app/(site)/_components/`
- `GB admin/` = `/home/user/gobanana/banana-server/app/(site)/[locale]/(pages)/(home)/admin/_components/`
- `FK2 <Name>/` = `/home/user/maherfayad-stack/figma-killer-2/src/ui/components/<Name>/`

Never read anything under FK2 `vendor/alm-design-system`.

## Rules every order inherits

**Read first, every order:** `AGENTS.md`, every file in `docs/contracts/`
(`anatomy.md` "One convention for component CSS and props" above all,
`frameworks.md`, `manifest.md`, `tokens.md`, `style-pack.md`), section 3 and
the component checklist in section 6 of `PLAN.md`, section 12 of `PLAN.md`
(accessibility, RTL, copy), then the order itself and the source paths it
names. Arabic demo copy: read `/home/user/gobanana/docs/arabic-copy-cookbook.md`.
Read the closest finished component in this repo before writing a new one:
Button for an action, Input and Field for a text control, Dialog for an
overlay, Toast for a message.

**Check commands:**

- `npm run check` (the whole repo: tokens, gen, typecheck, eslint, manifests,
  vitest, Angular, native and consumer checks).
- `npm run contract -- --framework react --component <Name>[,<Name>]` for
  every React component the order builds.
- `npm run contract -- --framework angular --component <Name>[,<Name>]` for
  every Angular port.
- Angular pixel proof: `npm run shots -- --framework angular --component <kebab>`
  then `npm run shots -- --compare react angular`.

**The fixed loop.** The agent builds inside its owned files and runs the
check commands. The lead runs `npm run check` again and never trusts a
report. A fresh `ds-qa` reviews the result against the order and the
contracts. At most three fix rounds go back to the owner; after the third,
the order is logged under "Blocked" in `STATE.md` and the lane moves to its
next independent order. Green orders are committed by the lead as
`wo-<id>: <title>`.

**The standard file set for a React component** `<Name>` (kebab `<kebab>`),
called "standard set" in the orders:

- `packages/react/src/components/<Name>/`: `<Name>.tsx`, `<Name>.test.tsx`,
  `<Name>.demo.tsx`, `index.ts` (and private helpers in the same folder)
- `packages/css/src/components/<Name>.css`
- `packages/manifest/src/component/<Name>.manifest.json` (the `react` block
  `ready`, `angular` and `native` `planned`)
- `packages/styles/<id>/recipes/<Name>.css` for an existing style, only if a
  token cannot express the difference
- a shared logic file named in the order: `packages/shared/src/<file>.ts`
  with `<file>.test.ts`

**Standard acceptance**, called "checklist" in the orders: the component
checklist in section 6 of PLAN.md, and also:

- Anatomy as proposed in the order, or a better one with the reason in the
  report. Nested parts follow `anatomy.md` (a nested system component keeps
  its own `data-ds` and carries the parent's `data-part`).
- Only the shared axes (`data-size`, `data-tone`, `data-emphasis`,
  `data-shape`) with the shared words, and only the values the order lists.
  Default size `md`.
- The keyboard map in `a11y.keys` of the manifest. Arrow keys follow the
  reading direction in RTL. A key the generic suite cannot check gets a
  `contract.keys` hint (`focus-moves`, `value-changes`, `state-changes`,
  `click`, `closes`, and `moves` after order 1.0.e).
- Every interactive target at least 24 by 24 CSS px (WCAG 2.5.8). Every drag
  has a key or button path (2.5.7). Focus ring from the `focus` tokens (2.4.7).
- Demo cases in the order of `anatomy.md`, English and Arabic, every case
  that applies.
- `motion` names a pattern from `packages/motion` (order 1.11). Until 1.11 is
  merged, name the pattern from the list in 1.11 and the catalog test will
  check it.
- Looks right in Studio and Desk, dark and light, three densities, LTR and
  RTL, and in Neutral once 1.10 is merged.
- `npm run check` and the contract command green. Report lists every file
  touched.

**Standing constraints learned in wave 0:**

1. **One npm install at a time.** An order that installs is marked
   `installs: yes`. It never runs in parallel with another installing order.
   The lead runs the install command named in the order (root lockfile and
   `package.json` files are the lead's), then the agent builds.
2. **Own scratch and own port.** Each agent keeps temporary files in its own
   subfolder, `<scratchpad>/<order-id>/`, outside the repo. Each running
   agent has a slot number (1 to 4) from the schedule and starts galleries on
   its own port: React gallery `519<slot>` (`npx vite --port 5191` from
   `apps/gallery-react`), Angular gallery `420<slot>` (`PORT=4201 npm run dev
   -w apps/gallery-angular`). The contract runner picks a free port itself.
3. **Generated files are refreshed with `npm run gen`, never edited:**
   barrels (`src/index.ts` of every component package),
   `packages/css/src/index.css`, `packages/styles/index.css`,
   `packages/styles/<id>/index.css`, `packages/manifest/manifests.gen.json`,
   `apps/gallery-react/src/routes.gen.ts`, every `*.gen.ts`.
4. **A component order never edits another component's folder or CSS file.**
   If it needs a change there, it reports the exact change (file, line,
   before, after) and the lead routes it. The only exceptions are written
   in an order's "Owns" line (for example ToggleButton adds its block to
   `Button.css`, by the base rule 10 of `anatomy.md`).
5. **Forbidden for every order:** root config, root `package.json` and the
   lockfile, generated files, `STATE.md`, `PLAN.md`, `DECISIONS.md`,
   `AGENTS.md`, `docs/contracts/`, any file another running order owns, and
   both source repos.
6. **Never wait on `transitionend` or `animationend`.** Under reduced motion
   durations are 0ms. Use the Web Animations API `finished` promise.
7. **Never a native `title`**, never a bare `<button>` outside the Button
   implementation, never a raw value or a physical property in CSS.
8. **Angular forms of names** follow `frameworks.md` (`dsTheme="<id>"`, host
   attribute removal, `openChange` output, node props as icon name or
   `TemplateRef`, no CDK Dialog and no CDK FocusTrap inside a root).
9. Each agent returns: what it built, what it could not do, any decision it
   made, every file touched, and the exact change it needs in a file it does
   not own.

## Batch 0: carry over

The "Known gaps carried into wave 1" list of `docs/reports/wave-0.md`, plus
the package problems in `docs/reports/consumers.md` and the visual findings
in `docs/reports/matrix-wave-0.md`. Batch 0 runs before any component batch.
Orders are grouped so that no two running orders own the same file.

| Step | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Starts when |
| --- | --- | --- | --- | --- | --- |
| 0.1 | 1.0.a Lint gates | 1.0.c1 Shared logic, React | 1.0.d Package fixes (installs: yes) | 1.0.g Icons | wave-1.md committed |
| 0.2 | 1.0.b Token adoption | 1.0.c2 Shared logic, Angular | 1.0.c3 Shared logic, native | 1.0.f Manifest gaps and visual findings | b after a; c2 and c3 after c1; f after c1 |
| 0.3 | 1.0.e Contract `moves` | 1.11 Motion catalog | 1.10 Neutral (runs into batch 1) | 1.12 Checker, part 1 | e after f; 1.11 after b; 1.10 after g and b; 1.12 after a |

### 1.0.a Lint gate changes (ds-qa)

- Installs: no. Slot 1, step 0.1.
- Goal: three gate fixes so batch 0 and wave 1 can adopt tokens and port to
  Angular without false failures.
  1. `no-raw-value`: allow a length literal inside a `@media` or
     `@container` condition only when it equals a `breakpoint.*` token value
     and the same line carries the comment `/* breakpoint.<name> */`.
     Anything else in a condition still fails.
  2. `no-native-title`: a `[title]` binding (or static `title`) on an element
     that also carries a `ds*` directive attribute (for example
     `<div dsDialogContent [title]="...">`) is an input, not the native
     attribute. Pass it. A `[title]` on a plain native element still fails.
  3. `native-no-style-literals`: read `*.styles.ts` too. In those files a
     color or size literal fails unless it is `0`, `1`, a percentage, or comes
     from the theme object argument.
- Read: `packages/lint/src/rules/no-raw-value.ts`, `no-native-title.ts`,
  `native-no-style-literals.ts`, their gates in `packages/lint/src/gates/`,
  `packages/tokens/src/base/breakpoint.json`.
- Owns: `packages/lint/`.
- Accept: each change has a passing and a failing fixture test; `npm run
  check` green with no change to component files (if an existing
  `*.styles.ts` now fails, report the lines; 1.0.c3 fixes them).

### 1.0.b Token adoption in wave 0 components (ds-component)

- Installs: no. Slot 1, step 0.2. Depends on 1.0.a.
- Goal: every "Token gap" comment is gone and the value comes from the round 3
  token. Find them with `grep -rn "Token gap" packages`. Round 3 names
  (commit `416eeed`, "tokens: round 3", and `packages/tokens/src/`):
  `window.width.settings`, `window.width.finder-max`, `title-bar.height`,
  `scale.dialog-enter`, `scale.window-enter`, `scale.press`,
  `blur.window-saturation`, `duration.window-minimize`, `duration.window-zoom`,
  `duration.toast-enter`, `duration.toast-exit`, `opacity.grain`,
  `breakpoint.phone`, `breakpoint.tablet`, `breakpoint.desktop` (media queries
  keep the literal with the `/* breakpoint.<name> */` comment, or the custom
  media in `packages/tokens/dist/css/custom-media.css`).
- Also, in the same files (consumer and matrix findings): `Button.css` root
  gets `text-decoration-line: none` (the `link` emphasis sets it back);
  `Toast.css` count badge never wraps alone (matrix finding 3); `Input.css`
  adornments sit on the value baseline (finding 5) and the xs pill keeps
  inline padding at least the end radius (finding 6).
- Owns: `packages/css/src/components/{Window,TitleBar,WindowControls,Dialog,Toast,Button,Input}.css`,
  `packages/styles/desk/recipes/{Dialog,Window,Button}.css`,
  `packages/motion/src/window.ts` and its test. Not the `.tsx` files, not the
  manifests (report manifest `tokens` list changes to 1.0.f).
- Accept: no "Token gap" left; no raw value; `npm run check` and
  `npm run contract -- --framework react --component Window,TitleBar,WindowControls,Dialog,Toast,Button,Input`
  green; `npm run shots -- --component window,dialog,toast,button,input`
  shows no change except the fixed findings (attach the before and after
  paths).

### 1.0.c1 Shared theme resolution and dialog focus rule, React (ds-component)

- Installs: no. Slot 2, step 0.1.
- Goal: the pure parts written twice today move to `packages/shared`, and
  React uses them.
  - `packages/shared/src/theme.ts`: axis types and defaults, `resolveTheme`
    (prop, then nearest parent, then root default), `themeAttributes`.
    Source: `packages/react/src/theme/resolve.ts`,
    `packages/angular/src/theme/resolve.ts`, `packages/native/src/theme/resolve.ts`.
  - `packages/shared/src/dialog-focus.ts`: the focus rule on a plain element
    interface (`[data-autofocus]`, then Cancel in a danger dialog
    `[data-dialog-cancel]`, then the first field, then the panel), and the
    return target fallback (consumer problem 6): when the return target is
    disconnected, focus the nearest connected focusable ancestor, else the
    first focusable of `main`, else the body. The fallback is done here, not in
    1.0.d, because this order owns `Dialog.tsx`.
  - `packages/react/src/theme/resolve.ts` re-exports from shared;
    `Dialog.tsx` calls `dialog-focus.ts`.
- Read: `packages/react/src/components/Dialog/Dialog.tsx` (lines 371 to 560),
  `packages/angular/src/behavior/dialog-behavior.ts`, `docs/reports/consumers.md`
  problem 6.
- Owns: `packages/shared/src/{theme,dialog-focus}.ts` and tests,
  `packages/react/src/theme/`, `packages/react/src/components/Dialog/Dialog.tsx`
  and `Dialog.test.tsx`.
- Accept: no behavior change in React (all Dialog and Theme tests pass, new
  test for the disconnected return target); report the manifest text for
  Dialog `a11y.focus` to 1.0.f.

### 1.0.c2 Shared logic adopted in Angular (ds-angular)

- Installs: no. Slot 2, step 0.2. Depends on 1.0.c1.
- Goal: `packages/angular/src/theme/resolve.ts` and the dialog behavior use
  `packages/shared` `theme.ts` and `dialog-focus.ts`; the local copies go.
- Owns: `packages/angular/src/theme/`, `packages/angular/src/behavior/`,
  `packages/angular/src/components/dialog/`.
- Accept: `npm run check` green; `npm run contract -- --framework angular`
  green (73 of 73 or more); `npm run shots -- --compare react angular` 0
  differing pixels.

### 1.0.c3 Shared logic adopted in React Native (ds-native)

- Installs: no. Slot 3, step 0.2. Depends on 1.0.c1 and 1.0.a.
- Goal: `packages/native/src/theme/resolve.ts` uses `theme.ts` from shared.
  Drop `EM_BASE` and the solid material list in favor of the token build's
  `emBase` and `solidMaterials` exports, and `PRESS_SCALE` in favor of
  `scale.press`. Fix any `*.styles.ts` line the new 1.0.a gate flags.
- Owns: `packages/native/src/theme/`, `packages/native/src/components/`.
- Accept: `npm run check` green (native jest included); the Button colors test
  unchanged.

### 1.0.d Package fixes from the consumers report (ds-docs)

- Installs: yes. Slot 3, step 0.1. The lead first adds to the root
  `package.json` an `overrides` entry pinning `playwright-core` to the version
  of `@playwright/test` (1.63.0) for `@axe-core/playwright`, runs
  `npm install`, and confirms `npm ls playwright-core` shows one version.
- Goal:
  1. A `types` condition per CSS export, with a `.d.ts` holding `export {};`,
     in `packages/tokens`, `packages/css` and `packages/styles`. Remove the
     workaround `.d.ts` declarations from both examples and the gallery once
     the types resolve.
  2. Inter under webpack: in `packages/styles/studio/fonts.css` replace the
     two hand written `@font-face` rules with
     `@import '@fontsource-variable/inter/wght.css';`. Prove with
     `next build --webpack` in `examples/consumer-next` (scratch run, no
     config change committed).
  3. Remove the `AxeBuilder` casts from the specs once the types agree.
  4. Report to the lead the root config fix for native style exports
     (`./*/native/*` is not a legal export pattern; see
     `docs/reports/native-proof.md` item 7): one export per style.
- Owns: `packages/{tokens,css,styles}/package.json` (the `exports` field
  only), the new `.d.ts` files, `packages/styles/studio/fonts.css`,
  `examples/consumer-next/`, `examples/consumer-vite/`, the `.d.ts` in
  `apps/gallery-react/src/vite-env.d.ts`, the casts in
  `packages/contract-tests/src/` (only those lines).
- Accept: both consumers build and pass `npm run smoke -w <workspace>`; Next
  also builds with `--webpack`; `npm run check` green.

### 1.0.e Contract suite `moves` expectation and Window key hints (ds-qa)

- Installs: no. Slot 1, step 0.3. Depends on 1.0.f (Window manifest).
- Goal: a new `contract.keys` expectation `moves`: after the key, the focused
  root's bounding box moved by at least 1px in the direction the key names
  (ArrowRight moves toward inline end; in RTL the suite flips the sign), and
  `Shift+Arrow` moves further than the plain arrow when the manifest says so.
  Then add hints to `Window.manifest.json`: `ArrowLeft`, `ArrowRight`,
  `ArrowUp`, `ArrowDown` as `moves` with the move handle as `focus`, and
  `Escape` as `closes`.
- Owns: `packages/contract-tests/`, `packages/manifest/schema.json` (the
  `expect` enum only), the `contract` key of
  `packages/manifest/src/component/Window.manifest.json`.
- Accept: a failing fixture (a root that does not move) fails the check;
  `npm run contract -- --framework react --component Window` reports the
  arrow keys as checked, not noted.

### 1.0.f Manifest gaps and visual findings (ds-component)

- Installs: no. Slot 4, step 0.2. Depends on 1.0.c1.
- Goal, manifests (docs are generated from them in 1.15):
  - Toast: the call shape, `toast(title, options)`, `toast.success`,
    `toast.warning`, `toast.danger`, `toast.dismiss(id)`, `toast.update(id,
    patch)`, `toast.configure`, as a `mistakes` pair and in `summary` or a
    framework `note`.
  - Theme: a root `Theme` is needed even when `<html>` is stamped with
    `themeAttributes`, because attributes give no React context (portals and
    `useTheme` fall back to Studio dark).
  - Window: `WindowLayer` listed under `parts` with a note; a Window outside a
    layer sits in the page flow, is not movable and has no frame; a
    controlled `open={false}` stays rendered so the close motion plays.
  - Dialog: the useful content props (`onOpenAutoFocus`, `onCloseAutoFocus`,
    `onEscapeKeyDown`); the form in a dialog pattern (the form in DialogBody,
    the submit Button in DialogFooter with `form={id}` and `type="submit"`);
    the focus text from 1.0.c1; the `tokens` lists reported by 1.0.b.
  - Button: `insteadUse` names ToggleButton for a pressed state, with a note
    that until 1.1.5 lands the interim pattern is `aria-pressed` on a Button.
- Goal, code: Window, TitleBar and WindowControls default their five chrome
  labels to Arabic under `lang="ar"`, as Dialog and Toast do (one label table
  per component, copy from the Arabic cookbook).
- Goal, visual findings 1, 2, 4, 7, 8 of `matrix-wave-0.md`: the variants case
  speaks the gallery language or marks English runs `lang="en"` (Dialog,
  Window, Field demos); Toast demo triggers pass `lang`; the horizontal Field
  demo gives its input room for the placeholder; the WindowControls caption
  says what the dots really do; the Icon demo uses `DemoCase`. Finding 9
  (Studio shows lights in TitleBar and WindowControls demos) goes to the
  report as a question for the owner of the style, not a change.
- Owns: `packages/manifest/src/component/{Toast,Theme,Window,TitleBar,WindowControls,Dialog,Button}.manifest.json`
  (not Window's `contract` key), `packages/react/src/components/{Window,TitleBar,WindowControls}/*.tsx`
  and tests, the demo files of Dialog, Window, Field, Toast, Icon,
  WindowControls.
- Accept: `npm run check` green; consumer examples can drop their five Arabic
  Window labels (report it, 1.0.d or 1.18 removes them); new screenshots of
  the five findings attached.

### 1.0.g Icons for wave 1 (ds-style)

- Installs: no. Slot 4, step 0.1.
- Goal: add the system names the wave 1 components need, in both sets
  (`pixel` on pixelarticons, `line` on lucide-static), with the mirror flag
  where the glyph points along the reading direction. Names already present
  stay (52 today; check, chevrons, minus, calendar, eye, search, close, copy,
  more, sort, drag, star, upload exist). Add at least: `mail`, `dot`,
  `chevrons-up-down` (Select trigger), `chevrons-forward`, `chevrons-back`
  (Pagination first and last, mirrored), `check-circle`, `x-circle`,
  `alert-circle`, `star-filled`, `star-half` (Rating, mirrored), `grip`
  (resize handle), `sidebar` (Sidebar toggle), `panel-start`, `panel-end`,
  `phone`, `key` (OTP), `lock-open`, `refresh` (ErrorState retry), `inbox`
  (EmptyState, NotificationCenter), `bell-off`, `image` (Lightbox, Avatar
  fallback), `zoom-in`, `zoom-out`, `maximize`, `command` (CommandPalette),
  `keyboard`, `language`, `list`, `grid`, `columns`, `filter-x`, `tag`,
  `history`, `file`, `folder`, `user-plus`, `log-out`, `shield`, `spinner`
  (a glyph for the Spinner fallback; the animated Spinner draws its own
  stroke). Where pixelarticons has no glyph, pick the nearest by meaning and
  note it in the set file.
- Read: `packages/icons/src/names.ts`, `packages/icons/sets/{pixel,line}.ts`,
  `docs/reports/wave-0.md` (Other).
- Owns: `packages/icons/` (names, sets, generated output through its own
  build), `packages/styles/{studio,desk}/icons.ts`.
- Accept: every name maps in both sets (a test fails on a missing glyph);
  React, Angular and native outputs regenerate; mirrored names flip in the
  gallery Icon demo in RTL.

## Orders 1.10 to 1.20

### 1.10 Neutral style (ds-style)

- Installs: no (Inter and lucide-static are installed). Starts at step 0.3,
  runs beside batch 1 in one slot. Depends on 1.0.b and 1.0.g.
- Goal: `packages/styles/neutral`, the everyday product look and the default
  style for the galleries and the docs. First fetch and study the references
  in section 2 of PLAN.md: Astryx (`astryx.atmeta.com`), FlyonUI
  (`flyonui.com`), HeroUI, shadcn/ui. Study structure and proportions only.
  Copy no code, names or assets.
- Build: `style.json` (`status: "proposed"`, `iconSet: "line"`, dials from the
  Neutral column of section 3.7: white and soft gray, one brand color, blue by
  default as one token, small soft shadows, 1px borders and white space,
  radius 6, 8, 12, filled primary and outline secondary at 36 to 40px, Inter,
  line icons at 1.5px, 150 to 200ms ease out, 2px accent ring with 2px gap);
  `tokens.light.json` (light first) and `tokens.dark.json` (a true dark)
  filling every name in `packages/tokens/src/contract.json`; `icons.ts` on
  the line set; `motion.ts` presets for the 1.11 patterns; `fonts.css`;
  `figma.json`; as few `recipes/*.css` as possible (each with a comment on
  why a token could not do it).
- Default: the React and Angular galleries open in Neutral when no `style`
  query is given; the docs site uses Neutral. The `Theme` fallback default
  stays `studio` until the owner approves Neutral (decision, see report).
- Check against every batch: after each React batch is green, the lane that
  holds 1.10 (or the lead) runs `npm run shots -- --style neutral --component
  <batch components>` and fixes tokens or recipes. Component files are never
  edited here; report the change.
- Owns: `packages/styles/neutral/`, `docs/reports/neutral.md`,
  `docs/reports/shots/neutral/`, the default style constant in
  `apps/gallery-react/src/axes.ts` and in the Angular gallery shell.
- Accept: contrast and contract gates green for neutral light and dark
  (`npm run check`); `npm run a11y` clean in Neutral; `ds style check
  neutral` passes once 1.14 lands; `docs/reports/neutral.md` with rationale
  per dial and screenshots of every wave 0 component in both schemes, LTR and
  RTL. HUMAN GATE logged by the lead: Neutral approval. Work continues.

### 1.11 Motion catalog (ds-style)

- Installs: no. Step 0.3. Depends on 1.0.b.
- Goal: 18 named patterns in `packages/motion`, one file each, values shared
  across frameworks, durations and eases only from tokens, each with a
  reduced motion form (opacity only, or none) and a web helper on CSS and the
  Web Animations API. Names (use exactly these ids): `fade-rise`,
  `menu-scale`, `dialog`, `sheet`, `toast`, `accordion-height`,
  `tab-indicator`, `list-stagger`, `drag-drop`, `window-grow`, `window-zoom`,
  `window-minimize`, `skeleton-shimmer`, `spinner`, `number-roll`,
  `chart-draw`, `thinking`, `streaming-text`. `accordion-height` animates a
  transform and opacity of a clip, never `height` (only `transform` and
  `opacity` animate).
- Each pattern exports: `id`, `tokens` (the token paths it reads), `keyframes`
  for WAAPI, `reduced` keyframes, an `animate(el, opts)` helper that returns
  the `Animation` (callers await `finished`), and native values (numbers) for
  Reanimated in wave 2. Move the window patterns from `window.ts` into the
  catalog with the same values.
- Style presets: `packages/styles/{studio,desk}/motion.ts` (and neutral once
  1.10 has it) pick values per pattern.
- A test reads `packages/manifest/manifests.gen.json` and fails when a
  manifest names a pattern that is not in the catalog.
- Owns: `packages/motion/`, `packages/styles/{studio,desk}/motion.ts`.
- Accept: `npm run check` green; a gallery page `/motion` is not required; each
  pattern has a unit test for its reduced form and its token paths.

### 1.12 Checker, `ds doctor` (ds-qa)

- Installs: no. Part 1 at step 0.3 (rules and React), part 2 after Angular
  batch 1 (Angular templates and React Native files), finished before gate 1.
- Goal: `packages/lint` as a checker a consumer runs on its own code. Rules,
  each with a stable id `ds/<name>`: tokens (no raw values, unknown
  `--ds-*` names), primitives (no bare `<button>`, `<input>`, `<select>`,
  `<dialog>` where a system component exists; no direct `radix-ui` import in
  app code), direction (no physical properties, no `left` or `right` in
  inline styles), targets (no `size="xs"` on a control in a touch template),
  copy (buttons are a verb plus a noun, never OK, Continue, Confirm, Yes; no
  em or en dash), slot limits from manifests (`slots.<part>.max`,
  `accepts`), shared axes only (prop values for size, tone, emphasis, shape
  must be in the manifest `props`).
- Inputs: React `.tsx` (TypeScript compiler API), Angular templates (inline
  and `.html`, parsed with `@angular/compiler`, already in the Angular
  workspace), React Native files (the native rules from 0.6 and 1.0.a).
- Output: text by default; `--json` gives `{ apiVersion: 1, type:
  "doctor.report", data: { findings: [{ ruleId, severity, file, line,
  column, message, fix? }], summary } }`. Exit code 1 on an error.
- Entry: `packages/lint/src/doctor.ts` with a `bin` the CLI (1.14) wires to
  `ds doctor`; until then `npx tsx packages/lint/src/doctor.ts <path>`.
- Fixtures: `packages/lint/fixtures/{react,angular,native}/wrong/` (one file
  per rule that must fail) and `right/`.
- Owns: `packages/lint/`.
- Accept: runs clean on `examples/consumer-next`, `examples/consumer-vite`,
  `examples/consumer-angular`; every rule fails its wrong fixture per
  framework; snapshot test of the JSON output; `npm run check` green.

### 1.13 Registry (ds-docs)

- Installs: no in the repo. The proof runs `npx shadcn@<current>` in a scratch
  Vite app outside the repo (network; never in parallel with an installing
  order).
- Goal: fetch the current shadcn registry docs first (registry.json schema,
  registry-item.json, `registry:ui`, `registry:style`, `registry:block`).
  `packages/registry/build.ts` writes `packages/registry/registry.json` and
  one item per React component, style and block from the manifests: files
  (the component folder, its CSS file), `dependencies` (`radix-ui`,
  `react-aria-components` where used), `registryDependencies` (other system
  components it renders), `cssVars` none (tokens come as a file), and one
  `registry:style` item per style pack. No blocks exist in wave 1; the build
  handles them when templates arrive.
- The lead wires `build.ts` into `npm run gen` after review.
- Owns: `packages/registry/`.
- Accept: a fresh Vite app in `<scratchpad>/1.13/` adds Button and Dialog with
  the shadcn CLI from the local registry (served by a static server from the
  repo), renders them, and builds; JSON schema test of every item; can start
  once batch 1 is green, and is rerun after batch 9.

### 1.14 CLI (ds-docs)

- Installs: no (Node `util.parseArgs`, no CLI library).
- Goal: `packages/cli`, the `ds` binary (name from `ds.config.json`).
  Commands: `ds search <words>`, `ds docs <name>`, `ds add <name>
  --framework react|angular|native`, `ds style list`, `ds style check <id>`
  (runs the conformance checks: every contract name filled, contrast pairs,
  icon map complete, fonts declared), `ds doctor [path]` (1.12),
  `ds manifest <name>`. Every command takes `--json` and returns
  `{ apiVersion, type, data }`. Errors carry stable codes (`DS_E_NOT_FOUND`,
  `DS_E_FRAMEWORK`, `DS_E_STYLE`, and so on) and exit code 2.
- `ds add`: react uses the registry item from 1.13; angular and native copy
  the component folder from the package and print the CSS and theme imports
  (a `planned` framework answers `DS_E_NOT_READY`).
- Owns: `packages/cli/`.
- Accept: snapshot tests on the JSON of every command; `ds style check
  neutral`, `studio`, `desk` pass; `ds doctor` wired; starts after batch 3.

### 1.15 Docs site (ds-docs)

- Installs: yes (`astro`, `@astrojs/starlight` in `apps/docs`, run by the
  lead; never beside another installing order).
- Goal: Astro Starlight in `apps/docs`, English and Arabic (`ar` with
  `dir="rtl"`). One page per component generated from its manifest, in this
  order: summary, use when, do not use when, use instead, anatomy and
  variants, content rules, accessibility (keys table, role, focus), common
  mistakes. A code tab per framework from `frameworks.<x>.example` (shows
  "planned" when not ready). Live preview: an iframe of the built React
  gallery at `/c/<kebab>?chrome=0&...` with axis switches (style, scheme,
  density, dir, lang), so no Astro React integration is needed. A Markdown
  twin of every page (`<page>.md`), `llms.txt` and `llms-full.txt` from
  `scripts/gen-llms.ts`. Sections: foundations (tokens, axes), styles,
  frameworks (setup, CSS import order, the `.d.ts` note, root Theme),
  content (English and the two Arabic registers), accessibility.
- Arabic pages: Arabic chrome and headings; manifest prose has no Arabic
  field yet, so it shows in English inside `Bidi` (see open questions).
- Owns: `apps/docs/`, `scripts/gen-llms.ts`.
- Accept: a link check script in `apps/docs/scripts/` passes on the built
  site (no plugin dependency); every component manifest has a page in both
  languages; `llms.txt` lists every component; the build is part of
  `npm run check` through the workspace `check` script. Scaffold can start
  once batch 1 is green; pages regenerate after every batch.

### 1.16 Agent files (ds-docs)

- Installs: no. After 1.14 and 1.15.
- Goal: `ds init` detects the framework (React, Next, Vite, Angular, Expo)
  from the consumer's `package.json` and writes `AGENTS.md` and `DESIGN.md`:
  the imports, the root Theme, the rules (system components only, tokens
  only, no native title, copy rules, Arabic rules), how to run `ds doctor`,
  where `llms.txt` is. Skills in `packages/cli/skills/`: `build-a-screen`
  and `review-a-screen` (SKILL.md each, review runs `ds doctor` and axe).
- Owns: `packages/cli/src/init/`, `packages/cli/skills/`, the two generated
  files in `examples/consumer-vite/`.
- Accept: `ds init` in `examples/consumer-vite` writes both files; a second
  run changes nothing; a snapshot test per framework.

### 1.17 Full matrix and size report (ds-qa)

- Installs: no. After batch 9 and Angular batch 5.
- Goal: `npm run shots` for all components in Studio, Desk and Neutral, dark
  and light, LTR and RTL, densities for controls; `npm run a11y` in English
  and Arabic; target size in every style and density; the Angular compare
  for the 55 ported components; a size report per package (gzip of the
  built JS and CSS per entry, `scripts/size.ts`).
- Owns: `scripts/shots.ts`, `scripts/a11y.ts`, `scripts/size.ts`,
  `docs/reports/shots/`, `docs/reports/matrix-wave-1.md`,
  `docs/reports/size-wave-1.md`.
- Accept: no axe violations; every shot byte stable across two runs; the
  lead folds the results into `docs/reports/wave-1.md`.

### 1.18 Consumers on wave 1 (ds-docs)

Added by the architect: gate 1 needs it and no other order covers it.

- Installs: no. After batch 6 (tooltips and menus exist) and batch 4 (forms).
- Goal: `examples/consumer-next` and `examples/consumer-vite` use only system
  components for buttons, dialogs, toasts, tooltips, menus and forms: the
  toolbar gets a Tooltip on every IconButton, a DropdownMenu for row actions,
  the create dialog uses Form, Field, Label and FieldError, the switches use
  SegmentedControl, the Arabic Window labels come from the defaults (1.0.f).
- Owns: `examples/consumer-next/`, `examples/consumer-vite/`.
- Accept: smoke tests pass; `ds doctor` clean on both (proves gate 1).

### 1.19 Adoption guides (ds-docs)

- Installs: no. After 1.18.
- Goal: `docs/adoption/gobanana.md` and `docs/adoption/figma-killer-2.md`:
  what to install, the CSS import order, which product components map to
  which system components (from the source paths used in this wave), the
  order of replacement, the risks (Desk glass contrast, the 28px versus 32px
  default size), and how to run `ds doctor`. Read only access to the sources.
- Owns: `docs/adoption/`.
- Accept: each guide names every source component it replaces with the
  system component and the order id. HUMAN GATE: real adoption is asked of
  the owner at the end of the wave.

### 1.20 Gate 1 report (lead)

`docs/reports/wave-1.md`: the gate table below with evidence, what changed in
the contracts, open HUMAN GATE items, coverage per framework.

### 1.21 Interaction round (ds-style with ds-component)

Added on 2026-11-12 at the owner's request.

- Installs: no. Starts when 1.11 (motion catalog) is green and the batch 1 to
  3 components exist. Runs again at the end of the wave over every batch.
- Goal: a round that adds small, considered interactions to the components,
  in the spirit of the collections the owner named:
  `khagwal.com/interactions` and `bestdesignsonx.com`. Fetch and study both
  first. Take the kind of feedback and the timing, never code, assets or
  names. Write what was observed in `docs/reports/interactions.md` as a list
  of interaction ideas, each mapped to a component and a catalog pattern.
- Scope, at least: press feedback on buttons and toggles, a checkmark that
  draws, a switch thumb that stretches while it travels, a segmented control
  and tab indicator that slides between items, number roll on Stat and
  NumberField, copy button success swap, password reveal, OTP cell fill,
  input focus glow, error shake kept under the flash and motion limits, menu
  and popover origin scale, toast stack and swipe, accordion reveal, skeleton
  to content swap, drag lift and drop settle, rating fill, list stagger on
  first paint, pull and release on sliders, dialog and sheet springs.
- Rules that do not bend: only `transform` and `opacity` animate; no
  animation library on the web (CSS transitions, `@starting-style` and the
  Web Animations API only); durations, eases, scales and springs come from
  tokens; every interaction has a reduced motion form; nothing flashes more
  than three times a second; anything that plays longer than five seconds
  has a pause control; an interaction never delays the action it decorates
  and never blocks input; behavior stays out of style packs, so an
  interaction is a motion preset a style may tune or turn off.
- Each style gets its own character through `packages/styles/<id>/motion.ts`:
  Studio flat and fast, Desk windows and rolls, Neutral 150 to 200ms ease
  out, Liquid springs (wave 2).
- Owns: `packages/motion/` additions, the motion presets of each style, and,
  per component, a block in that component's CSS file handed over by the lead
  one family at a time (no two agents in one CSS file).
- Accept: `npm run check` and the contract suite green; a gallery page
  `/interactions` that plays each one with a reduced motion toggle; a short
  screen recording or frame strip per interaction in
  `docs/reports/shots/interactions/`; the report lists what was added, what
  was rejected and why. New looks are proposed to the owner, not final.

### 1.22 Interaction round 2: richer motion (ds-style with ds-component)

Added on 2026-11-12. The owner watched the round 1 videos and said the result
is acceptable but needs richer animations and micro interactions.

- Installs: no. After 1.21 is merged.
- Goal: raise every round 1 interaction from a single property change to a
  small choreography, and cover the components round 1 left out. Study
  `khagwal.com/interactions` and `bestdesignsonx.com` again, deeper: for at
  least 40 clips, write down the beats (anticipation, action, overshoot,
  settle), the stagger between parts, and what secondary element reacts.
  Feel and timing only: no code, asset or name is taken.
- Scope, at least:
  - Springs: spring eases as `linear()` tokens (soft, snappy, bouncy), with
    overshoot on toggles, thumbs, chips, badges, popovers, sheets and toasts.
  - Stateful buttons: idle, loading, success and error as one morph (label
    out, spinner in, check draws, label back), width kept by transform.
  - Icon morphs: copy to check, eye to eye-off, plus to close, chevron
    rotation, menu to close, play to pause, built from parts that rotate,
    scale and cross fade.
  - Shared indicators: one sliding pill for Tabs, SegmentedControl,
    ToggleGroup, Navbar, Sidebar, Rail, Pagination and Breadcrumbs hover,
    with stretch while it travels.
  - Hover and focus micro feedback on every interactive part: icon nudge on
    buttons with an end arrow, card lift with a moving highlight, row hover
    in List, Menu and ListBox that follows the pointer, link underline that
    draws in the reading direction.
  - Entrances and exits for every overlay with staggered content (title,
    body, actions), and matched exits that are faster than the entrance.
  - Lists and collections: add, remove and reorder with FLIP for Chip,
    TagField, Toast, List, NotificationCenter, FilterBar, AvatarGroup.
  - Numbers and progress: digit by digit roll for Stat, NumberField and
    Pagination, a ProgressBar and ProgressCircle that ease to the value and
    celebrate completion once, a Meter that fills on first view.
  - Forms: label and helper transitions, a field error that slides in under
    the control, a success tick on valid, Form submit success, Stepper and
    FormWizard step change with direction, ConsentField check, Rating hover
    preview, Slider value bubble.
  - Feedback: Alert and Banner entrance with an icon beat, Skeleton to
    content cross fade, EmptyState illustration beat, CommandPalette result
    stagger, Lightbox zoom from the thumbnail (FLIP), Tour spotlight move,
    Accordion chevron and content stagger, Tooltip follow between adjacent
    triggers, Avatar status pulse with a pause path.
- Rules that do not bend: the same as 1.21. Only `transform` and `opacity`
  animate; no animation library; values from tokens; a reduced motion form
  for each; no more than three flashes a second; a pause path past five
  seconds; never delay the action or block input; never wait on
  `transitionend` or `animationend`; a style preset can tune or turn off
  each one. Where an idea needs another property (`clip-path`, `filter`,
  color), build the nearest transform and opacity form and list the idea in
  the report for the owner to rule on.
- Each style keeps its character, now further apart: Studio flat, fast, hard
  cuts and steps; Desk rolls, window style scale and playful overshoot;
  Neutral restrained springs at 150 to 220ms.
- Owns: `packages/motion/**`, `packages/styles/*/motion.ts`, the motion
  tokens in `packages/tokens` (durations, eases, springs, scales, with the
  snapshots), the `/interactions` gallery page, and the motion block and the
  small code changes an interaction needs in every React component.
- Accept: `npm run check` green; the contract suite green for every touched
  component; every interaction on `/interactions` with a reduced motion
  switch and a replay control; a screen recording per family in
  `docs/reports/shots/interactions-2/` in Neutral, Studio and Desk; the
  report `docs/reports/interactions-2.md` lists each interaction with its
  beats and timings, what was rejected, and the ideas that need a rule
  change. Everything stays "proposed" until the owner approves.

## Schedule

At most four agents at once. Never two installing orders at once (installs
are marked; the lead runs each install alone, between steps if needed). The
slot number is the agent's port suffix.

| Step | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Starts when |
| --- | --- | --- | --- | --- | --- |
| 0.1 | 1.0.a | 1.0.c1 | 1.0.d (installs) | 1.0.g | plan committed |
| 0.2 | 1.0.b | 1.0.c2 | 1.0.c3 | 1.0.f | see batch 0 |
| 0.3 | 1.0.e | 1.11 | 1.10 Neutral | 1.12 part 1 | see batch 0 |
| 1 | React 1A | React 1B, then 1D | React 1C, then 1E | 1.10 Neutral (continues) | batch 0 green, 1.11 merged |
| 2a | lead installs `react-aria-components` (1.2.0) alone | | | | batch 1 green |
| 2b | React 2A | React 2B | React 2C | Angular A1.1, then A1.2 | 1.2.0 done; A1 after batch 1 reviewed |
| 2c | React 2D takes the first free slot of 2A to 2C | | | | first of 2A to 2C done |
| 3 | React 3A | React 3B | React 3C | Angular A2.1, A2.2, A2.3 | batch 2 green |
| 3b | React 3D takes the first free slot of 3A, 3B, 3C or slot 4 | | | | ListBox (1.3.11) green |
| 4a | lead installs `@angular/aria` (A3.0) alone | | | | batch 3 green, no other install running |
| 4 | React 4A | React 4B | React 4C | Angular A3.1, A3.2, A3.3 | batch 3 green |
| 5 | React 5A | React 5B | React 5C | Angular A4.1, then 1.12 part 2 | batch 4 green |
| 6 | React 6A | React 6B | React 6C, then 6D | Angular A5.1, then A5.2 | batch 5 green |
| 7a | lead installs `astro`, `@astrojs/starlight` (1.15) alone | | | | batch 6 green |
| 7 | React 7A | React 7B | React 7C | 1.15 Docs site | batch 6 green |
| 8 | React 8A | React 8B | React 8C | 1.13 Registry, then 1.14 CLI | batch 7 green |
| 9 | React 9A | React 9B | React 9C | 1.14 CLI (continues), 1.18 Consumers | batch 8 green |
| 10 | 1.16 Agent files | 1.17 Full matrix | 1.19 Adoption guides | 1.12 final run, docs regenerate | batch 9 green |
| 11 | lead: 1.20 Gate 1 report, ask the owner | | | | all green |

The docs site and the registry may move earlier (from step 2) when a React
lane slot is idle; they regenerate after every batch. Neutral is checked
against every batch (see 1.10).

## Gate 1

| Condition (section 7 of PLAN.md) | How it is proven |
| --- | --- |
| Both web example apps use only system components for buttons, dialogs, toasts, tooltips, menus and forms | Order 1.18; `ds doctor --json` on both apps has zero `ds/primitives` findings; smoke tests pass |
| `ds doctor` is clean on both | `ds doctor examples/consumer-next --json` and the same for `consumer-vite`: zero errors (log saved in `docs/reports/wave-1.md`) |
| The 55 Angular components pass the contract suite | `npm run contract -- --framework angular` full run: every Angular `ready` component of batches 1 to 5 passes; `npm run shots -- --compare react angular` 0 differing pixels within the threshold |
| 105 React components | Appendix table all ticked in `STATE.md`; `npm run contract -- --framework react` full run green; manifests valid |
| Neutral style | `ds style check neutral` passes; marked proposed |
| Docs site, registry, CLI, checker | 1.15 link check and page count; 1.13 shadcn proof; 1.14 snapshots; 1.12 fixtures |
| `npm run check` | Green at the end of the wave |

**HUMAN GATE items of this wave** (logged in `STATE.md` under "Waiting on
owner", asked once at the end of the wave):

1. Neutral approval (1.10), with `docs/reports/neutral.md`.
2. Real adoption inside GoBanana and Figma-Killer-2, with the guides in
   `docs/adoption/` (1.19).
3. Any allow list question raised by an order (see open questions).

## Open questions and decisions for the lead

Decisions made in this plan (record in `DECISIONS.md` if accepted):

1. **Three components move to an earlier batch** and keep their ids:
   DropdownMenu (1.6.8) is built in batch 1 because SplitButton needs it;
   FieldError (1.4.3) is built in batch 2 with Field and Label because Field
   renders it as its `error` part; Stepper (1.7.7) is built in batch 4
   because FormWizard renders it. Angular ports DropdownMenu and Stepper
   early with their React batch, so Angular ends wave 1 with 57 components
   (55 plus two).
2. **Components built on another's base add a block to the base CSS file**
   (rule 10 of `anatomy.md`): ToggleButton, CloseButton, CopyButton and
   FloatingActionButton in `Button.css` (lane 1A only); AlertDialog, Drawer
   and Sheet in `Dialog.css` (lane 6A only); ContextMenu and Menubar in
   `DropdownMenu.css` (lane 6C only).
3. **Field stays the wrapper**; Label and FieldError become components of
   their own that Field renders as its `label` and `error` parts.
4. **PhoneField uses a native `select` for the country** (data-part
   `country`): the platform picker on phones, type ahead, no dependency on
   Select from batch 3.
5. **NotificationCenter is the panel content only**; a consumer places it in
   a Popover or a Sheet. No dependency on batch 6.
6. **Form, PasswordField and OTPField are hand built.** Radix marks
   One Time Password Field and Password Toggle Field as Preview (exported as
   `unstable_` in `radix-ui` 1.8.1) and section 4 forbids Preview primitives.
   Radix Form: check the Radix docs on the day; if it is marked Preview, hand
   build (the order says hand built either way).
7. **Phone formatting is hand written** for the Gulf codes in
   `packages/shared/src/phone.ts` (no libphonenumber, which is not on the
   allow list).
8. **The `Theme` fallback stays `studio`** while Neutral is proposed; only
   the galleries and docs default to Neutral.
9. **`@tanstack/react-table` is not installed in wave 1**: no wave 1
   component needs it (Table is wave 2). React Aria is used by NumberField
   only.
10. **Order 1.18 (consumers), 1.19 (adoption guides) and 1.20 (gate report)
    are added**: gate 1 needs them and PLAN.md lists no order for them.

HUMAN GATE candidates (allow list or scope):

1. The registry proof needs the shadcn CLI through `npx` in a scratch folder.
   It is not a dependency of the repo and not on the dev list. Ask, or accept
   it as a one off tool run outside the repo.
2. The docs live preview uses an iframe of the gallery. A React island in
   Astro would need `@astrojs/react`, which is not on the dev list.
3. A link validator plugin for Starlight is not on the list; 1.15 writes its
   own check script.
4. Arabic docs: manifests have no Arabic prose (only `content.ar` copy
   rules). Translating 105 manifests needs a schema key (for example
   `text.ar` with `summary`, `useWhen`, `avoidWhen`) and a decision on the
   register (Gulf modern standard or white Saudi dialect).
5. `@angular/aria` is on the allow list but not installed; Angular batch 3
   installs it (A3.0). Not a gate, but the lead should check that version 22
   is stable on the day, as wave 0 found.

Where PLAN.md is ambiguous:

1. Section 7 says "first have ds-architect write one work order per
   component" and lists Toast in batch 5 and Dialog in batch 6, both built in
   wave 0. Toast is marked done; Dialog gets a bring up order (extract the
   base for AlertDialog, Drawer and Sheet).
2. "Drawer and Sheet are Dialog with a side": read here as separate
   components with their own `data-ds` on a shared Dialog base, not a `side`
   prop on Dialog.
3. `ds style check neutral` is the done condition of 1.10, but the command
   arrives with 1.14. Until then the same checks run as gates in
   `npm run check`.
4. 1.17 is "done when `docs/reports/wave-1.md`", which is also the lead's
   gate report. Here ds-qa writes the matrix and size reports and the lead
   writes `wave-1.md`.
5. TabBar and Dock sit in wave 1 navigation while the mobile family (wave 2)
   adds NavigationBar and BottomToolbar. TabBar here is the web bottom tab
   bar of links; phone behavior comes in wave 2.

## Appendix: the 105 components

Source columns: GB = GoBanana has a reference, FK2 = Figma-Killer-2 has one,
none = design from the dials table and the nearest component. Built in = the
batch file that holds the full order when it differs from the home batch.

| # | Component | Batch | Order | Behavior | Reference | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Button | 1 | 1.1.1 | Radix Slot, hand built | GB, FK2 | done in wave 0 |
| 2 | IconButton | 1 | 1.1.2 | hand built on Button base | GB, FK2 | done in wave 0 |
| 3 | ButtonGroup | 1 | 1.1.3 | hand built | FK2 | open |
| 4 | SplitButton | 1 | 1.1.4 | Button plus DropdownMenu | FK2 | open |
| 5 | ToggleButton | 1 | 1.1.5 | Radix Toggle | GB | open |
| 6 | ToggleGroup | 1 | 1.1.6 | Radix ToggleGroup | GB, FK2 | open |
| 7 | SegmentedControl | 1 | 1.1.7 | Radix ToggleGroup (single) | GB, FK2 | open |
| 8 | Link | 1 | 1.1.8 | hand built, Radix Slot | GB | open |
| 9 | CloseButton | 1 | 1.1.9 | hand built on Button base | GB | open |
| 10 | CopyButton | 1 | 1.1.10 | hand built on Button base | GB | open |
| 11 | FloatingActionButton | 1 | 1.1.11 | hand built on Button base | none | open |
| 12 | Field | 2 | 1.2.1 | hand built (bring up) | GB, FK2 | done in wave 0, bring up |
| 13 | Label | 2 | 1.2.2 | Radix Label | FK2 | open |
| 14 | Input | 2 | 1.2.3 | hand built | GB, FK2 | done in wave 0 |
| 15 | Textarea | 2 | 1.2.4 | hand built | GB | open |
| 16 | NumberField | 2 | 1.2.5 | React Aria NumberField | FK2 (ScrubInput) | open |
| 17 | ScrubInput | 2 | 1.2.6 | hand built | FK2 | open |
| 18 | SearchField | 2 | 1.2.7 | hand built on Input | FK2 | open |
| 19 | PasswordField | 2 | 1.2.8 | hand built on Input | none | open |
| 20 | OTPField | 2 | 1.2.9 | hand built on native inputs | none | open |
| 21 | PhoneField | 2 | 1.2.10 | hand built | none | open |
| 22 | InputGroup | 2 | 1.2.11 | hand built | GB | open |
| 23 | InlineEdit | 2 | 1.2.12 | hand built | FK2 | open |
| 24 | Checkbox | 3 | 1.3.1 | Radix Checkbox | GB, FK2 | open |
| 25 | CheckboxGroup | 3 | 1.3.2 | hand built on Checkbox | GB | open |
| 26 | RadioGroup | 3 | 1.3.3 | Radix RadioGroup | GB | open |
| 27 | RadioCard | 3 | 1.3.4 | Radix RadioGroup | none | open |
| 28 | Switch | 3 | 1.3.5 | Radix Switch | GB, FK2 | open |
| 29 | Select | 3 | 1.3.6 | Radix Select | GB, FK2 | open |
| 30 | Combobox | 3 | 1.3.7 | ListBox on Radix Popover | GB, FK2 | open |
| 31 | Autocomplete | 3 | 1.3.8 | ListBox on Radix Popover | none | open |
| 32 | MultiSelect | 3 | 1.3.9 | ListBox on Radix Popover | none | open |
| 33 | TagField | 3 | 1.3.10 | hand built, ListBox | FK2 | open |
| 34 | ListBox | 3 | 1.3.11 | hand built | GB, FK2 | open |
| 35 | Slider | 3 | 1.3.12 | Radix Slider | none | open |
| 36 | RangeSlider | 3 | 1.3.13 | Radix Slider | none | open |
| 37 | Rating | 3 | 1.3.14 | Radix RadioGroup | none | open |
| 38 | Form | 4 | 1.4.1 | hand built | GB | open |
| 39 | Fieldset | 4 | 1.4.2 | hand built | GB | open |
| 40 | FieldError | 4 | 1.4.3 | hand built (built in batch 2) | GB, FK2 | open |
| 41 | FormWizard | 4 | 1.4.4 | hand built, Stepper | none | open |
| 42 | FilterBar | 4 | 1.4.5 | hand built on ToggleGroup | GB, FK2 | open |
| 43 | ConsentField | 4 | 1.4.6 | hand built on Checkbox | GB | open |
| 44 | Alert | 5 | 1.5.1 | hand built | GB, FK2 | open |
| 45 | Banner | 5 | 1.5.2 | hand built | none | open |
| 46 | Callout | 5 | 1.5.3 | hand built | GB | open |
| 47 | Toast | 5 | 1.5.4 | Radix Toast | GB, FK2 | done in wave 0 |
| 48 | ProgressBar | 5 | 1.5.5 | Radix Progress | none | open |
| 49 | ProgressCircle | 5 | 1.5.6 | Radix Progress | none | open |
| 50 | Meter | 5 | 1.5.7 | hand built | GB | open |
| 51 | Skeleton | 5 | 1.5.8 | hand built | GB, FK2 | open |
| 52 | Spinner | 5 | 1.5.9 | hand built | GB | open |
| 53 | StatusDot | 5 | 1.5.10 | hand built | GB | open |
| 54 | ErrorState | 5 | 1.5.11 | hand built | GB | open |
| 55 | NotificationCenter | 5 | 1.5.12 | hand built | GB | open |
| 56 | Dialog | 6 | 1.6.1 | Radix Dialog (bring up) | GB, FK2 | done in wave 0, bring up |
| 57 | AlertDialog | 6 | 1.6.2 | Radix AlertDialog | GB | open |
| 58 | Drawer | 6 | 1.6.3 | Radix Dialog | none | open |
| 59 | Sheet | 6 | 1.6.4 | Radix Dialog | none | open |
| 60 | Popover | 6 | 1.6.5 | Radix Popover | GB | open |
| 61 | Tooltip | 6 | 1.6.6 | Radix Tooltip | GB, FK2 | open |
| 62 | HoverCard | 6 | 1.6.7 | Radix HoverCard | none | open |
| 63 | DropdownMenu | 6 | 1.6.8 | Radix DropdownMenu (built in batch 1) | GB, FK2 | open |
| 64 | ContextMenu | 6 | 1.6.9 | Radix ContextMenu | FK2 | open |
| 65 | Menubar | 6 | 1.6.10 | Radix Menubar | GB | open |
| 66 | CommandPalette | 6 | 1.6.11 | Radix Dialog plus ListBox | FK2 | open |
| 67 | Lightbox | 6 | 1.6.12 | Radix Dialog | none | open |
| 68 | Tour | 6 | 1.6.13 | Radix Popover | none | open |
| 69 | Navbar | 7 | 1.7.1 | Radix NavigationMenu | GB | open |
| 70 | Sidebar | 7 | 1.7.2 | hand built, Radix Collapsible | GB | open |
| 71 | Rail | 7 | 1.7.3 | hand built | none | open |
| 72 | Tabs | 7 | 1.7.4 | Radix Tabs | GB, FK2 | open |
| 73 | Breadcrumbs | 7 | 1.7.5 | hand built | none | open |
| 74 | Pagination | 7 | 1.7.6 | hand built | none | open |
| 75 | Stepper | 7 | 1.7.7 | hand built (built in batch 4) | none | open |
| 76 | TabBar | 7 | 1.7.8 | hand built | GB | open |
| 77 | Toolbar | 7 | 1.7.9 | Radix Toolbar | GB, FK2 | open |
| 78 | TableOfContents | 7 | 1.7.10 | hand built | GB | open |
| 79 | SkipLink | 7 | 1.7.11 | hand built | GB | open |
| 80 | Dock | 7 | 1.7.12 | hand built | GB | open |
| 81 | LanguageSwitch | 7 | 1.7.13 | hand built | GB | open |
| 82 | Stack | 8 | 1.8.1 | hand built | FK2 | open |
| 83 | Grid | 8 | 1.8.2 | hand built | GB | open |
| 84 | Container | 8 | 1.8.3 | hand built | GB | open |
| 85 | Section | 8 | 1.8.4 | hand built | GB, FK2 | open |
| 86 | Surface | 8 | 1.8.5 | hand built | GB, FK2 | open |
| 87 | Separator | 8 | 1.8.6 | Radix Separator | GB, FK2 | open |
| 88 | ScrollArea | 8 | 1.8.7 | Radix ScrollArea | GB | open |
| 89 | ResizablePanels | 8 | 1.8.8 | hand built | none | open |
| 90 | SplitView | 8 | 1.8.9 | hand built on ResizablePanels | GB | open |
| 91 | AspectRatio | 8 | 1.8.10 | Radix AspectRatio | none | open |
| 92 | Bento | 8 | 1.8.11 | hand built | GB | open |
| 93 | PageShell | 8 | 1.8.12 | hand built | GB | open |
| 94 | Avatar | 9 | 1.9.1 | Radix Avatar | GB | open |
| 95 | AvatarGroup | 9 | 1.9.2 | hand built | none | open |
| 96 | Badge | 9 | 1.9.3 | hand built | GB, FK2 | open |
| 97 | Chip | 9 | 1.9.4 | hand built on Button base when pressable | GB, FK2 | open |
| 98 | Kbd | 9 | 1.9.5 | hand built | GB, FK2 | open |
| 99 | Stat | 9 | 1.9.6 | hand built | GB | open |
| 100 | List | 9 | 1.9.7 | hand built | GB, FK2 | open |
| 101 | DescriptionList | 9 | 1.9.8 | hand built | FK2 | open |
| 102 | Card | 9 | 1.9.9 | hand built | FK2 | open |
| 103 | Tile | 9 | 1.9.10 | hand built | GB | open |
| 104 | Accordion | 9 | 1.9.11 | Radix Accordion | GB | open |
| 105 | EmptyState | 9 | 1.9.12 | hand built | GB, FK2 | open |

Count per batch: 11, 12, 14, 6, 12, 13, 13, 12, 12 = 105. Done in wave 0:
Button, IconButton, Input, Toast. Bring up orders: Field, Dialog. New: 99.
