# Consumers (order 0.18)

Two example apps consume the system as packages, the way the two source
products would. Both render the five wave 0 components from
`@the-system/react` on one small Boards screen: a toolbar with a search Field
and Input and the "Create board" Button, a list with a delete IconButton per
row, a create Dialog that validates its Field, a danger Dialog for delete that
ends in a toast with an "Undo delete" action, and in Desk a Window (with its
TitleBar and WindowControls) that holds the list. A style, scheme and
language switch is made of system Buttons only.

| App | Stack | How it consumes |
| --- | --- | --- |
| `examples/consumer-next` | Next 16.4.6 (Turbopack), React 19.3.1, app router, plain CSS | `transpilePackages`, `<html>` stamped with `themeAttributes` in the root layout, `/en` and `/ar` route segments, style and scheme from cookies |
| `examples/consumer-vite` | Vite 8.3.8, React 19.3.1, CSS Modules | No config beyond the React plugin, `<html>` stamped before render, style, scheme and language in the URL |

Gate 0 for consumers: both apps build, serve their production build and pass
a Playwright smoke test (`npm run smoke -w <workspace>`): 10 tests for Next,
11 for Vite.

## What the smoke tests prove

- Every root is on the page by its `data-ds`: button, icon-button, field and
  input; window, title-bar and window-controls in Desk; dialog and toast after
  interaction.
- The theme attributes sit on `<html>` and on the root Theme element, and the
  server render of Next matches the cookie (a reload keeps the theme).
- The create dialog opens with focus in its field, shows the error on an empty
  submit with `aria-invalid` and focus back in the field, closes on a valid
  submit and returns focus to "Create board".
- Delete opens a danger dialog with focus on "Keep board", the toast shows
  "Board deleted" with the "Undo delete" action, and the action restores the
  row.
- The switch changes `data-style`, `data-scheme`, `lang` and `dir`.
- No console errors, no hydration warnings (also checked by hand in `next
  dev` and `vite` dev, where React reports more).
- No sideways scroll at 320px in Studio and Desk, English and Arabic.
- axe is clean in Studio and Desk, English and Arabic, with and without the
  create dialog open.
- Vite only: a CSS Module class outside layers beats the system layers (the
  "Create board" Button takes `radius.sm` over the pill of `Button.css`).

Screenshots in `docs/reports/shots/consumers/`: each app in Studio dark, Desk
dark, Desk light and Desk dark Arabic, plus Next with the delete dialog under
a toast and Vite at 320px in Arabic with the dialog error.

## What worked with no friction

- `transpilePackages` was all Next needed for the TypeScript and CSS source.
- `with { type: 'json' }` in `packages/styles/registry.gen.ts` compiles in
  Turbopack and Vite.
- The `@layer` order statement survives Turbopack (lightningcss splits it
  into pieces but keeps the order: reset, tokens, base, recipes, overrides).
  No `@starting-style` is in the output.
- The fontsource `@import`s and the bare `url('@fontsource-variable/...')` in
  `studio/fonts.css` resolve in Turbopack and Vite; the fonts load.
- `themeAttributes` is pure and works in a server component; `Theme` and
  `Toaster` render from a server layout as client components through the same
  barrel.
- Toasts show above an open dialog and their action works after it closes.
- The Window close light sends focus to the "Show boards" Button that
  replaces it (its `origin`), and reopening focuses the window.

## Problems found in the packages, with the smallest fix

Status after order 1.0.d: problems 1, 2 and 3 are fixed in the packages and
the example workarounds are gone (`next build --webpack` now builds). Problem
5 waits on a root `overrides` entry (`"playwright-core": "1.63.0"`); the
casts stay until then. Problem 6 moved to order 1.0.c1.

1. **Webpack cannot resolve the Inter `url()`** (`next build --webpack`).
   `packages/styles/studio/fonts.css` writes
   `url('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')`.
   css-loader reads a bare `url()` as relative
   (`./@fontsource-variable/...`) and fails. Turbopack, the Next 16 default,
   and Vite resolve it, so the example builds with Turbopack.
   Smallest fix: replace the two hand written `@font-face` rules with
   `@import '@fontsource-variable/inter/wght.css';`. That file uses relative
   urls every bundler resolves; its extra subsets (cyrillic, greek,
   vietnamese) are only fetched when a page uses those characters.
2. **A Button rendered as a link keeps the link underline.** `Button` with
   `asChild` around a Next `<Link>` draws the browser's underline, because
   the root rule in `packages/css/src/components/Button.css` never resets
   `text-decoration-line`. Fix: add `text-decoration-line: none;` to the
   `[data-ds='button']` root rule; the `link` emphasis rule sets the
   underline back later in the file. The Next example works around it with
   one unlayered rule in `app/app.css`.
3. **The CSS entry points have no type declarations.** TypeScript 6 checks
   side effect imports, so `import '@the-system/css'` fails with TS2882 in a
   consumer (the Next build runs tsc and stops). Fix: a `types` condition per
   CSS export, for example `"./css": { "types": "./css.d.ts", "default":
   "./dist/css/tokens.css" }` with `css.d.ts` holding `export {};`, in
   `tokens`, `css` and `styles`. Both examples declare the three modules in a
   `.d.ts` today, as the gallery does.
4. **The token CSS must be built first.** `@the-system/tokens/css` points at
   `dist/`, which is not committed. Known and by design for now; both
   examples run `npm run build -w @the-system/tokens` in `predev` and
   `prebuild`. A fresh clone that skips it fails to resolve the import.
5. **Repo tooling: two playwright-core versions.** `@axe-core/playwright`
   4.14 brings playwright-core 1.65 while the repo pins `@playwright/test`
   1.63, so `new AxeBuilder({ page })` does not type check. The specs cast,
   as the contract suite does. Fix: an npm `overrides` entry that pins
   playwright-core for `@axe-core/playwright`, or an axe version built on 1.63.
6. **Dialog focus return when the trigger is gone.** A controlled dialog
   returns focus to the element that had it before. After "Delete board" that
   element (the row's IconButton) is removed, and focus falls to the body.
   The examples pass `onCloseAutoFocus` and focus "Create board". Possible
   fix: when the return target is disconnected, focus the nearest focusable
   ancestor that is still connected, or document the `onCloseAutoFocus`
   pattern in the manifest.

No package change was needed to make either app work, and none was made.

## What a consumer had to know that the manifests did not say

The manifests were the API docs. These needed the source:

- **`toast()` call shape.** The Toast manifest lists `duration`, `action`,
  `id`, `dedupeKey` and `lang` as props, but not how to call it:
  `toast(title, options)`, `toast.success(...)`, `toast.danger(...)`,
  `toast.dismiss(id)`, `toast.update(id, patch)`. Read in
  `packages/shared/src/toast.ts`.
- **The root Theme is needed even with `<html>` stamped.**
  `themeAttributes` is mentioned only in the React framework note of the
  Theme manifest. Nothing says that `<html>` attributes give no React
  context, so `useTheme` and the Dialog and Toaster portals fall back to
  Studio dark unless a `<Theme>` wraps the app as well.
- **Window labels are English only.** Dialog and Toast switch their chrome
  labels to Arabic under `lang="ar"`; Window, TitleBar and WindowControls do
  not, and their manifests do not say so. The examples pass five Arabic
  labels.
- **A Window outside a WindowLayer.** The props mention WindowLayer but it is
  not in `parts` or in any manifest. That a Window with no layer sits in the
  page flow (position relative, no frame, not movable) came from
  `Window.css`. That a controlled `open={false}` must stay rendered so the
  close motion plays came from the source.
- **Dialog content props.** The manifest says Radix Content props go to the
  panel but does not name the useful ones (`onCloseAutoFocus`,
  `onOpenAutoFocus`, `onEscapeKeyDown`).
- **A form in a dialog.** No manifest shows the pattern: the form lives in
  DialogBody and the submit Button in DialogFooter takes `form={id}` and
  `type="submit"`.
- **CSS import order and setup** (three entry points, system first, token
  build first, the `.d.ts` above) live in `docs/contracts/frameworks.md` and
  DECISIONS.md, not in any manifest. A consumer reading only the manifests
  or llms files would miss them.
- **A pressed Button.** No toggle or segmented control exists in wave 0. The
  switches use `Button` with `aria-pressed` and a solid or ghost emphasis;
  the Button manifest says a toggle is its own component but gives no
  interim pattern.

## Bundle size

Production builds, gzip level 9 measured on the emitted files. Fonts are
separate files and load per unicode range.

| App | JS | CSS |
| --- | --- | --- |
| Next, first load of `/en` (8 chunks: Next runtime, React, the app) | 709 kB, 220 kB gzip | 116 kB, 17 kB gzip (2 files) |
| Vite (1 chunk: React, Radix, the system, the app) | 348 kB, 109 kB gzip | 115 kB, 16 kB gzip (1 file) |

The CSS holds both style packs (Studio and Desk), every scheme and both
directions. An app that ships one style could import
`@the-system/styles/<id>` and `@the-system/tokens/css/<id>.css` instead; not
tried here.

## Not done

- No webpack build of Next (see problem 1).
- Density, contrast and glass have no switch on the screen; they are covered
  by the gallery matrix (order 0.19).
