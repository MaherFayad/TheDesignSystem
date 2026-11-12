# Order 1.15: docs site

Branch `claude/ds-order-1-15`, from `claude/relaxed-hypatia-7gseap` at
`1570e25`. Agent: ds-docs.

## What I built

An Astro Starlight site in `apps/docs`, English at the root and Arabic under
`/ar/` (`lang="ar"`, `dir="rtl"`).

| Part | Where | Does |
| --- | --- | --- |
| Site config | `apps/docs/astro.config.ts` | Starlight, two locales, the sidebar. The component part of the sidebar is built from the manifests on every build: one group per kind, one collapsed sub group per family. |
| Manifest reader | `apps/docs/scripts/manifests.ts` | Lists `packages/manifest/src/<kind>/*.manifest.json`. Slug rule equals the gallery's (`scripts/gen-index.ts`). Family and kind labels in English and Arabic; an unknown family shows its id in words. |
| Page renderer | `apps/docs/scripts/render.ts` | One model, two outputs: the Starlight page and its plain Markdown twin. Arabic chrome dictionary. |
| Page generator | `apps/docs/scripts/gen-pages.ts` | Writes `components/<slug>.md` and `ar/components/<slug>.md`, a section index per kind, and a twin of every page (generated and hand written) under `public/`. Clears its own output first, so a removed manifest leaves nothing behind. |
| llms files | `scripts/gen-llms.ts` | `llms.txt` (llmstxt.org layout: guides, then every manifest with its summary and the frameworks it is ready in) and `llms-full.txt` (every English twin, guides first). |
| Link check | `apps/docs/scripts/check-links.ts` | On `dist/`: every internal `href` and `src` resolves, every `#fragment` exists, every manifest has a page and a twin in both languages, `llms.txt` lists every manifest, and no em or en dash in any built HTML, twin or llms file. No plugin, no network. |
| Behavior | `apps/docs/public/docs.js` | Preview axis selects; code tabs (ARIA tabs, arrow keys follow the reading direction, Home and End); focus for tables and code blocks that scroll. |
| Look | `apps/docs/src/styles/docs.css` | Preview, tabs, Arabic type (zero letter spacing, taller line, no italics), LTR isolates, code always LTR. Logical properties only. |
| UI strings | `apps/docs/src/content/i18n/{en,ar}.json` | Every Starlight and Pagefind string overridden. Arabic: Gulf MSA, noun forms, no diacritics, no exclamation marks (the stock Arabic set had diacritics, imperatives and "تم النسخ!"). |
| Hand pages | `apps/docs/src/content/docs/**` | Overview; foundations (tokens, runtime axes); styles; frameworks setup (install, CSS import order, the `.d.ts` note, root Theme, Angular, React Native); content (English, Arabic with the two registers); accessibility. Each in English and Arabic. |

### A component page

Sections in this order: summary, preview, use when, do not use when, use
instead (a value that is a manifest name links to its page), anatomy and
variants (parts, sub components, slots, props table, states), content rules
(`en` and `ar`), accessibility (role, focus, announce, keyboard table,
notes), common mistakes, styles (per style note, motion pattern, tokens), code
(a tab per framework: status, behavior, note, and the example file from
`frameworks.<x>.example`; "Planned. No code yet." when planned).

Preview: an iframe of the built React gallery at
`<gallery>/c/<slug>?chrome=0&style=&scheme=&density=&dir=&lang=` with five
selects. It opens on Neutral, the docs' current scheme, and the page's
language and direction. Shown only when the React folder has a demo (Bidi and
Theme have none, so their pages have no preview).

Arabic pages: Arabic chrome and headings. Manifest prose stays English inside
a left to right block (`<div dir="ltr" lang="en">`) or an inline isolate in
table cells, under one line that says so. Code is always left to right.

### Adding a manifest

Nothing to change. The generator, the sidebar, `llms.txt` and the link check
all list the manifest folder on every run. A new kind (pattern, template)
gets its own section `/<kind>s/`.

## Versions installed

Looked up on 2026-11-12 with `npm view`.

| Package | Version | Published | Where |
| --- | --- | --- | --- |
| `astro` | 7.4.11 (exact) | 2026-11-11 | `apps/docs` devDependencies |
| `@astrojs/starlight` | 0.42.10 (exact) | 2026-11-06 | `apps/docs` devDependencies |

- Node: astro 7.4.11 needs `>=22.23.4`. The container runs 22.23.4.
- No second React: `npm ls react` shows the same copies before and after the
  install (19.3.1 for the web, 19.3.0 under `gallery-native`). Starlight pulls
  no React.
- Nothing else added. Starlight's own dependencies (Pagefind, Expressive
  Code, `@astrojs/mdx`, `@astrojs/sitemap`, the `@astrojs/markdown-remark`
  peer) come in through it.

## Proofs

- `npm run check`: green, all 13 steps. `check @the-system/docs` (build plus
  link check) takes about 9 s; the whole site builds in about 15 s cold.
- Build: 213 pages (107 English including the 404, 106 Arabic). 97 manifests,
  196 generated pages, 212 Markdown twins.
- Link check: 33029 internal links and assets checked, every fragment found,
  97 manifests with a page and a twin in both languages, `llms.txt` lists all
  97, no dash. The one external origin is the gallery
  (`http://localhost:4173`), listed and not fetched.
- The dash part of the check was proved on a planted file holding the HTML entity for an en dash, and it
  caught a real case on the first build: smart punctuation turned the private
  property names `--_sidebar-width` and friends into en dashes. Smart
  punctuation is now off.
- Screenshots in `docs/reports/shots/docs/`: Button in English and Arabic,
  light and dark, at 390 and 1440, top of page and the code tabs (16 files),
  plus `setup-ar-390.png`. Read and fixed:
  - Code blocks on Arabic guide pages were right to left and opened scrolled
    to the line ends. Code is now always left to right.
  - A parenthesis around a code span in Arabic wrapped badly; the sentence is
    rewritten.
  - The search chip read "K Ctrl" in Arabic; the chip is now hidden (see the
    axe finding below).
- No sideways page scroll at 320 and 390 on Button, Dialog and an Arabic
  guide (`scrollWidth` equals the viewport). Wide tables scroll in their own
  box.
- Keyboard: the code tabs move with the arrow keys in the reading direction
  (Right in English, Left in Arabic), Home and End work, the panel follows.
- axe (WCAG 2.0, 2.1, 2.2 A and AA plus best practice), the gallery iframe
  excluded: Button and Dialog in English and Arabic and the Arabic setup page,
  light and dark, 390 and 1440. 18 of 20 runs have no violation. The other 2
  carry one moderate best-practice finding, below. Results in
  `docs/reports/shots/docs/axe.json`.

## Decisions

1. **English at the root, Arabic under `/ar/`.** The Starlight default
   locale is `root`, so English URLs carry no prefix and the twin of
   `/components/button/` is `/components/button.md`.
2. **Generated pages and twins are not committed.** `apps/docs/.gitignore`
   lists them; the build regenerates them. Reason: they change after every
   batch and are build output. The repo dash gate therefore does not see
   them, so the link check runs its own dash check on `dist/`.
3. **The preview points at `DOCS_GALLERY_URL`**, default
   `http://localhost:4173` (the gallery's `vite preview` port). The gallery
   matches `/c/<slug>` at the origin root, so it cannot be bundled under a
   sub path of the docs without a gallery change (see the requests). Each
   preview says where it expects the gallery.
4. **Plain Markdown pages, not MDX.** Manifest prose has braces and angle
   brackets; plain Markdown with an escaper is safer than MDX. The preview
   and the tab panels are small HTML blocks; the tabs are built by
   `docs.js`, and without the script every panel shows under its heading.
5. **Code tabs show the framework's demo file**, as the manifest names it.
   If the manifest names none, the generator tries `<Name>.demo.tsx`
   (`<kebab>.demo.ts` for Angular), then says no example is listed.
6. **Smart punctuation off** (`markdown.smartypants: false`). Astro 7 marks
   the key deprecated in favor of a processor option; moving it needs an
   import of `@astrojs/markdown-remark` or `@astrojs/markdown-satteri`,
   which `apps/docs` does not list. The build prints one deprecation line.
7. **The search shortcut chip is hidden.** Starlight's search button shows
   "Ctrl K" but its accessible name is "Search", which fails WCAG 2.5.3
   (label in name). The shortcut still works.
8. **Every Starlight UI string is overridden** in both languages, so no
   stock exclamation mark, diacritic or imperative reaches the page.
9. **Arabic register**: docs chrome and prose in Gulf modern standard
   Arabic (noun forms, no diacritics, Western digits, Arabic comma). Demo
   copy inside previews is the gallery's own, white Saudi dialect.
10. **Interactive markup built by script uses native buttons** in
    `docs.js` for the tab triggers. The no bare button rule is for system
    components; the docs chrome is not built on `@the-system/react` because
    an Astro React island would need `@astrojs/react` (open question 2).

## What I could not do

- **The preview off this machine.** It needs the gallery served at
  `DOCS_GALLERY_URL`. A deployed docs site needs the gallery deployed too, or
  the gallery change below.
- **Arabic manifest prose.** No schema key yet (HUMAN GATE candidate 4 in
  wave 1). The renderer has one place to switch per field once it exists.
- **One axe best-practice finding left open:** `landmark-unique` (moderate,
  not a WCAG criterion) on pages with two scrolling code blocks. Expressive
  Code gives each scrolling `pre` `role="region"` with the same name. Fixing
  it means a Starlight component override; left as is.
- **Fonts.** The Arabic stack names IBM Plex Sans Arabic and falls back to
  the system font. Loading the font file would need
  `@fontsource/ibm-plex-sans-arabic` as a dependency of `apps/docs`, and the
  order allows no other dependency.
- **Sitemap.** Starlight skips it without a `site`. Set `DOCS_SITE_URL` at
  build time to get the sitemap and absolute `llms.txt` links.

## Changes needed from the lead

1. **Root `npm run gen` should write the llms files** (PLAN section 4 says
   `npm run gen` does "barrels, registry, llms files"). In `package.json`:

   ```diff
   - "gen": "tsx scripts/gen-index.ts",
   + "gen": "tsx scripts/gen-index.ts && npm run gen -w @the-system/docs",
   ```

   or call `generate()` from `apps/docs/scripts/gen-pages.ts` and
   `genLlms()` from `scripts/gen-llms.ts` at the end of
   `scripts/gen-index.ts`. Both are exported.

2. **Optional, so the docs can ship the gallery inside their own build:**
   let the React gallery run under a base path. In
   `apps/gallery-react/src/App.tsx`, line 30:

   ```diff
   - const path = url.pathname.replace(/\/+$/, '') || '/';
   + const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
   + const inner = base && url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname;
   + const path = inner.replace(/\/+$/, '') || '/';
   ```

   and prefix `base` on the hrefs in `Index` and `Shell` (`/c/...`, `/all`,
   `/`). Then the docs build can run
   `vite build --base /gallery/ --outDir ../docs/dist/gallery` and set
   `DOCS_GALLERY_URL=/gallery`, and the preview works wherever the docs are
   hosted. I can do the docs side once this lands.

3. **Root `engines`**: astro 7.4.11 needs Node `>=22.23.4`; the root says
   `>=22`. Suggest `"node": ">=22.23.4"`.

4. **DECISIONS.md**, if accepted: decisions 1 to 4, 6 and 7 above.

5. **Manifest schema** (with the owner's register decision, HUMAN GATE 4):
   an optional `text.ar` with `summary`, `useWhen`, `avoidWhen`,
   `insteadUse`, `mistakes`. The docs will read it with no other change than
   the renderer's field lookup.

6. **STATE.md**: order 1.15 done on this branch; the preview depends on a
   served gallery (request 2).

## Files

- `package-lock.json` (the install)
- `apps/docs/.gitignore`, `astro.config.ts`, `package.json`, `tsconfig.json`
- `apps/docs/public/docs.js`, `apps/docs/public/favicon.svg`
- `apps/docs/scripts/check-links.ts`, `gen-pages.ts`, `manifests.ts`,
  `render.ts`
- `apps/docs/src/content.config.ts`, `src/styles/docs.css`,
  `src/content/i18n/en.json`, `src/content/i18n/ar.json`
- `apps/docs/src/content/docs/`: `index.md`, `styles.md`, `accessibility.md`,
  `foundations/tokens.md`, `foundations/axes.md`, `frameworks/setup.md`,
  `content/english.md`, `content/arabic.md`, and the same under `ar/`
- `scripts/gen-llms.ts`
- `docs/reports/shots/docs/` (17 screenshots, `axe.json`)
- `docs/reports/lanes/order-1-15.md` (this report)
