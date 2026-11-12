# Orders 1.13, 1.14 and 1.16: registry, CLI, agent files

Agent: ds-docs, in its own session. Branch `claude/ds-order-1-13`, from
`claude/relaxed-hypatia-7gseap` at `1570e25`. Three commits:
`wo-1.13: registry`, `wo-1.14: cli`, `wo-1.16: agent files`, then this
report. `npm run check` was green before the first change and before every
commit (all 12 steps pass).

## 1.13 Registry

### What I built

| File | Holds |
| --- | --- |
| `packages/registry/src/build-registry.ts` | `buildRegistry({ root })`: the catalog and every item with contents |
| `packages/registry/build.ts` | Writes `registry.json`, `files/*.css` and `public/r/<name>.json` |
| `packages/registry/serve.ts` | A static server on `node:http` for `public/` (no dependency) |
| `packages/registry/src/build-registry.test.ts` | Schema test of every item and the closure checks below |
| `packages/registry/schema/` | The shadcn `registry.json` and `registry-item.json` schemas, copied 2026-11-12 |
| `packages/registry/registry.json` | The catalog, committed, no contents |
| `packages/registry/files/` | `ds.css` and `style-<id>.css`, the entry CSS files (generated) |
| `packages/registry/public/` | The served items, not committed (`.gitignore` in the package) |

Current schema, looked up first: `ui.shadcn.com/schema/registry.json` and
`registry-item.json`, shadcn `4.23.0` (npm, published 2026-10-27). Item
types used: `registry:lib`, `registry:ui`, `registry:style`, and
`registry:block` for templates. File type `registry:file` needs a `target`
(schema `if/then`); I give every file a target.

101 items: `core`, `theme`, `style-desk`, `style-neutral`, `style-studio`,
and one `registry:ui` item per React ready manifest (95 component folders plus
`bidi`). No blocks yet; a manifest of kind `template` becomes a
`registry:block` from `packages/react/src/templates/<Name>/` when one exists.

### How an item is made

- The import graph decides the files. The build walks from each component's
  `index.ts` with `ts.preProcessFile`; only reached files ship, so tests,
  demos and demo helpers (`Stack/DemoBox.tsx`, `ListBox/samples.ts`) never do.
  A file belongs to the item of its folder.
- `registryDependencies`: other system items a file imports (`@ds/button`,
  `@ds/theme`, `@ds/core`), as namespaced names. `dependencies`: npm packages
  imported, with the version range the packages declare
  (`radix-ui@^1.8.1`, `react-aria-components@1.22.1`, the fontsource
  packages). `react` and `react-dom` are left to the app.
- `cssVars`: none. Tokens ship as a file inside each `registry:style` item
  (`tokens/<id>.css` from the token build, self contained for that style).
- Layout in the app: everything under `<components alias>/ds/`, the repo
  tree kept, so relative imports between components work unchanged. The copies
  differ from the source in three ways: `@the-system/*` imports become
  relative paths into `ds/` (the packages are private and never published);
  each component `index.ts` ends with `import '<..>/css/components/<Name>.css'`;
  each CSS file starts with the layer order line.

Item shape (from `public/r/button.json`, contents cut):

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "button",
  "type": "registry:ui",
  "title": "Button",
  "description": "An action the person takes on this page: save, send, open, delete. ...",
  "dependencies": ["radix-ui@^1.8.1"],
  "registryDependencies": ["@ds/button-group", "@ds/core", "@ds/theme"],
  "files": [
    { "path": "packages/react/src/components/Button/Button.tsx", "type": "registry:ui", "target": "@components/ds/react/components/Button/Button.tsx", "content": "..." },
    { "path": "packages/css/src/components/Button.css", "type": "registry:file", "target": "@components/ds/css/components/Button.css", "content": "..." }
  ],
  "categories": ["actions"],
  "meta": { "manifest": "Button", "framework": "react", "since": "0.1.0" }
}
```

The app registers the namespace once in `components.json`:
`"registries": { "@ds": "http://localhost:4000/r/{name}.json" }`.

### Proofs

Schema and closure test (in `npm run check`):

```text
npx vitest run packages/registry
 Tests  7 passed (7)
```

It validates the catalog and all 101 items with Ajv against the copied
schemas, checks one item per React ready manifest and one style item per
pack, that no file is a test or demo or still imports `@the-system/*`, and
that every relative import in every TS and CSS file resolves to a file in the
item or in an item it reaches through `registryDependencies`.

The shadcn proof, in `<scratchpad>/1.13/app`, outside the repo:

```sh
npm create vite@latest app -- --template react-ts --no-interactive
# components.json written by hand (no Tailwind), "@/*" alias in tsconfig and vite.config
npx tsx packages/registry/serve.ts --port 4000            # from the repo
npx -y shadcn@4.23.0 add @ds/button @ds/dialog --yes      # exit 0, 111 files
npm run build                                             # tsc -b && vite build: built in 421ms
```

`main.tsx` imports `ds/ds.css` and `ds/style-studio.css`; `App.tsx` renders
`Theme`, a Button and a Dialog. Chromium against `vite preview`:

```json
{ "buttonBackground": "rgba(255, 255, 255, 0.2)", "theme": { "style": "studio", "scheme": "dark" },
  "tokenResolves": "--ds-border-width-default: 1px",
  "dialogOpened": true, "labelledBy": true, "closedOnEscape": true, "errors": [] }
```

The screenshot of the open dialog shows the Studio dark look (title bar,
body, footer with two buttons). File check after `shadcn add`:
`{"files":111,"exact":51,"headerCommentDropped":60,"otherwise":0}`: shadcn
drops the first comment of a file and changes nothing else.

Two findings from the proof, both handled and written in
`packages/registry/README.md`:

1. With `"cssVariables": false` in `components.json`, shadcn rewrites string
   literals as class lists and turns `viewBox: '0 0 24 24'` into `'0 24'`
   (an SVG error in the console). With `true` the files arrive intact. The
   README and `ds add` say to keep it `true`.
2. Dialog and Tooltip read `process.env.NODE_ENV`. The Vite template's
   `tsconfig.app.json` has `"types": ["vite/client"]`, so `tsc -b` fails
   with TS2591. The proof adds `"node"` to `types`. See the lead changes.

### Decisions

- Namespaced `registryDependencies` (`@ds/<name>`) and not full URLs: the
  items do not depend on where they are served, and the app names the host
  once. shadcn 4.23.0 resolves them, cycles included (Button and ButtonGroup
  import each other).
- `theme` depends on `core` and `style-studio`, the default style
  (`DEFAULT_STYLE` in `packages/shared/src/theme.ts`). An app on another
  style adds that style item too.
- `bidi` is an item with no files that depends on `theme`, because `Bidi`
  lives in the theme folder and the theme exports it.
- Item names follow the gallery slug rule of `scripts/gen-index.ts`
  (`OTPField` gives `otpfield`), so a name equals `/c/<slug>`.
- `registry.json` is a catalog, not a `shadcn build` source: `path` points at
  the repo file, and the served content is the rewritten copy.
- `homepage` is `/`: the docs site root, which has no host yet.

## 1.14 CLI

### What I built

`packages/cli`: `src/main.ts` (`run(argv, io)`, dispatch, help),
`src/output.ts` (envelope, error codes), `src/manifests.ts` (lookup in any
spelling, "did you mean"), `src/commands/{catalog,add,style}.ts`,
`bin/ds.mjs` (the `ds` bin, runs the source through `tsx`), tests with
snapshots, `README.md`. `node:util` `parseArgs`, no CLI library.

| Command | `type` | `data` |
| --- | --- | --- |
| `ds search <words> [--framework <fw>]` | `search.results` | `{ query, framework, results: [{ name, kind, family, summary, score, frameworks: { react, angular, native } }] }` |
| `ds docs <name>` | `docs.page` | `{ name, kind, family, slug, summary, useWhen, avoidWhen, insteadUse, anatomy, a11y, content, mistakes, frameworks, markdown }` |
| `ds manifest <name>` | `manifest` | the manifest |
| `ds add <name> --framework <fw> [--dir] [--registry <url>] [--overwrite] [--dry-run]` | `add.result` | `{ name, framework, items, files: [{ path, status }], dependencies, install, imports, shadcn }` |
| `ds style list` | `style.list` | `{ styles: [{ id, name, status, schemes, proposedSchemes, defaultScheme, defaultDensity, iconSet, motionPreset }] }` |
| `ds style check <id>` | `style.check` | `{ style, ok, checks: [{ id: contract\|contrast\|icons\|fonts, ok, checked, findings, known }] }` |
| `ds doctor [path]` | `doctor.report` | from order 1.12, unchanged |
| `ds init [--force]` | `init.result` | `{ framework, source, registryDir, evidence, llms, files }` |

Every command takes `--json` and prints `{ apiVersion: 1, type, data }`.
Errors: `{ apiVersion: 1, type: "error", data: { code, message, ... } }`,
exit 2. Codes: `DS_E_USAGE`, `DS_E_NOT_FOUND` (with `suggestions`),
`DS_E_FRAMEWORK` (unknown framework, or `not-applicable`), `DS_E_NOT_READY`
(`planned`, with `readyIn`), `DS_E_STYLE`, `DS_E_REGISTRY`, `DS_E_CONFIG`,
`DS_E_CONFLICT` (reserved). Exit 1 means the answer is a failure: a failing
style, files that differ in `ds add`.

- `ds add`, react: the registry items of 1.13, built in memory or read from
  `--registry http://host/r`. Writes the item and its closure under the
  components alias of `components.json` (else `src/components`), leaves a
  file that differs alone as `conflict` unless `--overwrite`, prints the
  install command for missing packages and the imports. It also adds the
  `ds/` folder to `exclude` in `ds.doctor.json`, because the copied system
  code imports `radix-ui` and renders the native button, which the doctor
  would flag in app code.
- `ds add`, angular and native: copies the component folder and every file it
  reaches through relative imports (`internal/host.ts`, the native theme
  files, `Button` for `IconButton`) to `src/ds/<framework>/`, so the copy
  compiles; `@the-system/*` imports stay. Prints the CSS and theme imports.
- `ds style check`: contract (`checkContract` from `packages/lint` on the
  style's modes), contrast (`checkContrast` with `CONTRAST_PAIRS`; recorded
  known failures are listed and do not fail), icons (the set in `style.json`
  exists, has all 94 system names, `icons.ts` names the same set, every map
  entry points at a shipped glyph), fonts (`sans` and `arabic` declared,
  `fonts.css` loads files and an Arabic font, `index.css` imports it).
- `ds doctor`: calls `main` of `@the-system/lint/doctor` with the paths made
  absolute from the current folder. Not rewritten.

### Proofs

```text
$ ds style check studio
pass  contract  672 checked     (336 contract names, dark and light)
pass  contrast  578 checked
pass  icons     94 checked
pass  fonts     2 checked
Studio passes.                       (desk: 8 known contrast failures, passes; neutral passes)

$ ds add bogus --framework react      DS_E_NOT_FOUND ... exit 2
$ ds add tabs --framework angular     DS_E_NOT_READY: Tabs is planned for angular. Ready for: react. exit 2
$ ds add window --framework native    DS_E_FRAMEWORK: Window does not exist for native: Phones and tablets have no free windows. ...
$ ds add dialog --framework react     (empty app) Dialog for react: 112 written ...; ds doctor: 0 files, 0 errors
$ ds add dialog --framework react --registry http://localhost:4000/r   same files as shadcn add, apart from the header comments shadcn drops
```

`npx vitest run packages/cli`: 24 tests pass (14 in `main.test.ts`, 10 in
`init.test.ts`). Snapshots of the JSON of `--version`, `search`, `docs`,
`add` (react, angular, native), `style list`, `style check` for the three
styles and every error code. `ds doctor examples/consumer-vite --json` gives a
`doctor.report` with 0 errors.

### Decisions

- `ds add` for react writes the files itself instead of calling the shadcn
  CLI: no network, no `components.json` needed, testable. The answer also
  carries the equivalent `npx shadcn@4.23.0 add @ds/<name>`.
- Snapshots keep volatile parts out (the core file list, contrast counts), so
  a new component or a token change does not break the CLI tests; those are
  checked with `arrayContaining` and `> 0`.
- `ds style check` runs the token build in memory, so it works without
  `dist`.
- `ds docs` gives the page sections in the order of the docs site (1.15) and
  no URL, since the docs routes are not fixed yet.

## 1.16 Agent files

### What I built

- `packages/cli/src/init/`: `detect.ts`, `templates.ts`, `init.ts`,
  `init.test.ts` with snapshots per framework.
- `packages/cli/skills/build-a-screen/SKILL.md` and
  `packages/cli/skills/review-a-screen/SKILL.md` (review runs `ds doctor`
  and axe through `@axe-core/playwright` in English and Arabic, dark and
  light).
- `examples/consumer-vite/AGENTS.md` and `DESIGN.md`, written by `ds init`.

`ds init` detects the framework from `package.json`, first match wins:
`expo`, `@angular/core`, `next`, `vite` (with `react`), `react`. It also
tells packages from copied registry files (`<components>/ds/ds.css` and no
`@the-system/*` dependency). `AGENTS.md`: how to find, read and add a
component, the rules (system components only, tokens only, logical
properties, shared axes, no native title, transform and opacity only), copy,
Arabic, WCAG 2.2 AA, how to run `ds doctor`. `DESIGN.md`: the CSS imports and
root theme for that framework and source, the axes table, where to look.

The text sits between `<!-- ds:init start ... -->` and `<!-- ds:init end -->`.
A second run replaces only that block, so it changes nothing when nothing
changed and keeps text the team wrote around it. `--force` replaces the file.

`llms.txt`: order 1.15 runs in another session, so `ds init` gives
`/llms.txt` on the docs site root (and `/llms-full.txt`), from one constant,
`LLMS_PATH` in `packages/cli/src/init/init.ts`.

### Proofs

```text
$ cd examples/consumer-vite && ds init
Framework: vite (from vite). System source: packages.
  written   AGENTS.md
  written   DESIGN.md
$ ds init --json      files: AGENTS.md unchanged, DESIGN.md unchanged
```

Tests: a snapshot of both files for next, vite, react, angular and expo; a
second run gives `unchanged` for each; text around the block survives; the
registry source is detected; `DS_E_FRAMEWORK` and `DS_E_CONFIG` on a bad app;
the committed files in `examples/consumer-vite` equal what `ds init` writes
(checked on a copy, the test never writes into the repo).

## What I could not do

- The Arabic copy cookbook (`/home/user/gobanana/docs/arabic-copy-cookbook.md`)
  is not in this session. The Arabic rules in `AGENTS.md` and the skills come
  from section 12 of `PLAN.md`. Compare them with the cookbook on merge.
- `npx ds` in an app needs the bin linked: see the lead changes.
- No fresh eyes review subagent ran; I checked the diff against the orders
  and the contracts myself.
- The registry rerun after batch 9 is for later; the build and the test cover
  any new component folder without changes.

## Changes needed from the lead

1. Wire the registry build into `npm run gen`, after `scripts/gen-index.ts`
   (it reads `manifests.gen.json`) and after the token build (the style items
   read `packages/tokens/dist/css/<id>.css`; without it the build stops with
   a clear message). In the root `package.json`:

   ```json
   "gen": "tsx scripts/gen-index.ts && tsx packages/registry/build.ts"
   ```

   `scripts/check.ts` already runs the token build before gen. Once wired, a
   test that the committed `packages/registry/registry.json` equals a fresh
   build can be added; I left it out so the check does not fail on every
   component change before the wiring.

2. Dependencies of `packages/cli`, then `npm install` so `node_modules/.bin/ds`
   is linked (they resolve today through hoisting). In
   `packages/cli/package.json`:

   ```json
   "dependencies": {
     "@the-system/icons": "0.0.0",
     "@the-system/lint": "0.0.0",
     "@the-system/registry": "0.0.0",
     "tsx": "^4.23.15",
     "typescript": "^6.0.3"
   }
   ```

   and in `packages/registry/package.json`: `"dependencies": { "typescript": "^6.0.3" }`.
   `tsx` and `typescript` are tools, not UI runtime; they are on the dev list
   of section 4. Say if you want them treated as a HUMAN GATE instead.

3. `THIRD_PARTY_NOTICES.md`: add the two shadcn schemas in
   `packages/registry/schema/` (MIT, shadcn/ui, fetched 2026-11-12 from
   `ui.shadcn.com/schema/`).

4. Route to the Dialog and Tooltip owners:
   `packages/react/src/components/Dialog/DialogBase.tsx:127` and
   `packages/react/src/components/Tooltip/Tooltip.tsx:200` read
   `process.env.NODE_ENV`. A fresh Vite app fails `tsc -b` (TS2591) unless it
   adds `"node"` to `types`. Options: keep it and document (done in the
   registry README and the `core` item docs), or read it through a typed
   helper in one shared file, for example
   `packages/react/src/internal/env.ts` with
   `export const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';`
   plus a local `declare const process: ...` that does not clash with
   `@types/node`. Bundlers still replace `process.env.NODE_ENV` in place.

5. Route to the doctor owner (ds-qa, `packages/lint`): an app on registry
   files imports components by path (`@/components/ds/react/components/Button`),
   so the doctor's `packages` list (module names) does not see them as system
   components, and rules that read component props (shared axes, slot limits)
   skip them. A path prefix in `packages`, or a default that matches
   `*/ds/react/components/*`, would cover it. `ds add` already excludes the
   copied `ds/` folder through `ds.doctor.json`.

6. `examples/consumer-next/next.config.ts` sets `agentRules: false` so
   `next dev` does not write its own `AGENTS.md`. `ds init` can write the
   system's `AGENTS.md` there too (not in my order's files); run
   `npx ds init` in `examples/consumer-next` if you want it.

7. Docs site (1.15): serve `llms.txt` and `llms-full.txt` at the site root,
   which is what `ds init` writes. If the path differs, change `LLMS_PATH` in
   `packages/cli/src/init/init.ts` and rerun `ds init` in
   `examples/consumer-vite`.

## Files touched

- `packages/registry/`: `package.json`, `.gitignore`, `README.md`, `build.ts`,
  `serve.ts`, `registry.json`, `files/ds.css`, `files/style-{desk,neutral,studio}.css`,
  `schema/registry.json`, `schema/registry-item.json`,
  `src/build-registry.ts`, `src/build-registry.test.ts`
- `packages/cli/`: `package.json`, `README.md`, `bin/ds.mjs`, `src/main.ts`,
  `src/output.ts`, `src/manifests.ts`, `src/commands/{add,catalog,style}.ts`,
  `src/main.test.ts`, `src/__snapshots__/main.test.ts.snap`,
  `src/init/{detect,templates,init}.ts`, `src/init/init.test.ts`,
  `src/init/__snapshots__/init.test.ts.snap`,
  `skills/build-a-screen/SKILL.md`, `skills/review-a-screen/SKILL.md`
- `examples/consumer-vite/AGENTS.md`, `examples/consumer-vite/DESIGN.md`
- `docs/reports/lanes/order-1-13.md`
