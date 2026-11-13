# Brief for a lane that runs in its own cloud session

You are a ds-component agent working on one lane of the design system, in
your own cloud session and on your own branch. The lead runs in another
session and merges your branch. Nobody is watching your session, so do not
ask questions: decide, note the decision, and continue until the lane is
done.

Your prompt names three things: the lane id, the batch file that holds its
lane table and work orders, and your branch.

## Branch and commits

- This checkout is the lead's branch `claude/relaxed-hypatia-7gseap`.
- Create and work on your own branch, named in your prompt.
- One commit per finished component: `wo-<order id>: <component>`.
- Push your branch to origin after each component.
- Never push another branch. Never open a pull request. Never rewrite
  history.
- If the lane table says "starts when batch N green", ignore that gate. The
  lead scheduled you now because your components do not depend on it. If a
  component truly needs one that does not exist yet, skip it, say so in your
  report, and build the next.

## Setup

1. `npm install` at the repo root. A lockfile is committed. Node 22.
2. `npm run check` must pass before you change anything. If it does not, fix
   nothing outside your lane: note it and continue.
3. Chromium and Playwright 1.63.0 are preinstalled. Never run
   `playwright install`.

## Read first, in this order

1. `CLAUDE.md`, `AGENTS.md`, `.claude/agents/ds-component.md`.
2. Every file in `docs/contracts/`. `anatomy.md` holds the DOM contract and
   "One convention for component CSS and props". It is the rule.
3. `PLAN.md` sections 3.4, 3.5, 3.8, 12 and the component checklist in
   section 6.
4. The header of `docs/plan/wave-1.md`: "Rules every order inherits", the
   standard file set, the standard acceptance, the standing constraints.
5. Your lane table and your work orders in your batch file, in full.

## Patterns to copy

- `packages/react/src/components/Button/` with
  `packages/css/src/components/Button.css` and its manifest.
- `packages/react/src/components/Input/` with `Input.css` for a form control.
  `Field` wires a label, a description and an error to a control through
  `useFieldControl()`.
- `packages/react/src/components/Dialog/` and `Toast/` for overlays. A portal
  lands outside any Theme element, so portaled content is wrapped in a
  `Theme` that copies the axes from `useTheme()`.
- `packages/react/src/demo/index.tsx`: `DemoPage`, `DemoCase`, `DemoRow`,
  `DemoGrid`, `sample.en`, `sample.ar`. A trigger that opens an overlay
  carries `data-demo-trigger`.
- `packages/shared/src/axes.ts`: the shared axis types. Narrow with
  `Extract`.
- `packages/icons/src/names.ts`: 94 system icon names.
- `packages/tokens/dist/css/tokens.css` for the real variable names. Build it
  with `npx tsx packages/tokens/build.ts`.
- `packages/lint/src/rules` and `src/gates`: the gates your files must pass.
- `packages/contract-tests/README.md`: how the contract suite reads a
  manifest and which hints a manifest may carry.

## Sources (read only, optional)

The paths in `AGENTS.md` for the two source repos do not exist in your
session.

- GoBanana is the private repo `MaherFayad/GoBanana`. If you have an
  `add_repo` tool, add it with read access and clone it to
  `/home/user/gobanana`.
- Figma-Killer-2 is public:
  `GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/maherfayad-stack/figma-killer-2 /home/user/maherfayad-stack/figma-killer-2`
- Never read anything under Figma-Killer-2's `vendor/alm-design-system`.
- Never write to either repo.
- If a source cannot be fetched, design from the dials table in section 3.7
  of `PLAN.md` and the nearest existing component, and say so in the manifest
  notes.

## What you own

Per component:

- `packages/react/src/components/<Name>/**`: component, tests, demo,
  `index.ts`.
- `packages/css/src/components/<Name>.css`.
- `packages/manifest/src/component/<Name>.manifest.json`.
- `packages/styles/{studio,desk}/recipes/<Name>.css`, only if tokens cannot
  express a style difference.
- `docs/reports/shots/wave-1/<slug>/` for screenshots.
- A new file under `packages/shared/src/` with its test, only where your
  order names it.
- `docs/reports/lanes/<lane id>.md`, your report.

Edit nothing else: no other component's folder or CSS, no tokens, no lint, no
root config, no `docs/contracts`, no `STATE.md`, no `PLAN.md`. If you need a
change in a file you do not own, do not make it. Write the exact change under
"Changes needed from the lead" in your report. A parent may restyle a nested
component by overriding its private `--_<component>-*` properties from the
parent's own CSS file.

Generated files are refreshed with `npm run gen` and committed as generated:
the barrels, `packages/css/src/index.css`, `packages/styles/*/index.css`,
`routes.gen.ts`, `packages/manifest/manifests.gen.json`,
`packages/shared/src/index.ts`. Never edit them by hand. The lead regenerates
them on merge.

Do not add a dependency. Do not run `npm install <package>`. A missing
package blocks that one component: note it and move to the next.

## Rules

- **CSS.** `@layer ds.base`. Attribute selectors on `data-ds` and data
  attributes only. Tokens only: no raw color, spacing, radius, font size,
  shadow, duration or z-index. Logical properties only. Motion animates only
  `transform`, `opacity`, `clip-path`, stroke drawing, `filter`,
  `backdrop-filter`, colours and `box-shadow`; layout properties never
  animate. Private `--_<component>-*` properties; never declare a
  `--ds-*` name. States swap properties. `::before` is the focus or glow
  layer and `::after` the hover veil. The transparent outline sits only
  inside a focus selector. A forced colors fallback. Reduced motion
  collapses. No `!important`. A breakpoint literal in a media query needs a
  comment naming its token on the same line.
- **React 19.** `ref` is a prop, no `forwardRef`. Interactive files start
  with `"use client"`. Behavior from `radix-ui` where the order names a
  primitive, never one marked Preview or exported as `unstable_`. No bare
  `<button>`: use the system `Button` or `IconButton`. No native `title`
  attribute. Never wait on `transitionend` or `animationend`: under reduced
  motion every duration is 0ms.
- **Looks.** Right in Studio and Desk, dark and light, three densities, LTR
  and RTL. A third style, Neutral, is being built: use tokens so it applies.
- **Demos.** Every content case that applies: `variants`, `empty`, `one`,
  `many`, `too-many`, `long-text`, `long-arabic`, `loading`, `error`,
  `disabled`, `readonly`. An Arabic row inside the variants case.
- **Copy.** English: sentence case; buttons are a verb plus a noun, never
  "OK", "Continue", "Confirm" or "Yes". Arabic: white Saudi dialect, noun
  form labels, no diacritics, Western digits.
- **Manifest.** Complete and honest: `useWhen`, `avoidWhen`, `insteadUse`
  (all three non empty and useful to an agent choosing a component),
  `anatomy` (own parts only), `props` with defaults, `states` (no pseudo
  classes), `a11y` (role, focus, the keyboard map, announce), `content` for
  `en` and `ar`, `tokens`, `motion` (a pattern id from your order),
  `frameworks` (react ready with behavior and the example file name; angular
  planned; native planned or not-applicable with a note), `styles`,
  `mistakes`, and `contract` hints where the suite needs them.
- **Writing.** In everything you write, code comments and docs included:
  never an em dash or an en dash. A gate fails the build. Plain words,
  sentence case, no marketing adjectives, no exclamation marks.

## Verify each component before you commit it

1. Unit tests for props and states.
2. `npm run check` is green.
3. `npm run contract -- --framework react --component <Name>` is green.
4. Screenshots with Playwright (chromium headless, from a node script) of
   `/c/<slug>?chrome=0` from the React gallery
   (`PORT=5173 npx vite --port 5173 --strictPort` in `apps/gallery-react`) in
   studio dark, studio light, desk dark, desk light, and desk dark with
   `dir=rtl&lang=ar`. Save them to `docs/reports/shots/wave-1/<slug>/`. Read
   the PNG files and fix what looks wrong.
5. One fresh eyes review. If you have an Agent tool, spawn one subagent
   (it must run as claude-opus-5-5 at medium effort) with no context but the
   order, the contracts and your files, and ask for findings with file and
   line, each marked blocker or note. Fix the blockers. At most two rounds.
   With no Agent tool, review your own diff against the component checklist.

## Report

When the lane is done or blocked, write `docs/reports/lanes/<lane id>.md`:
per component what you built, the props API as a code block, decisions, token
gaps, review findings fixed and left open, "Changes needed from the lead"
with exact changes, and what you could not do. Commit it and push. That file
and your branch are how the lead gets your work.
