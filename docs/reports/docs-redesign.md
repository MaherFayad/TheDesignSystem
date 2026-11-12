# Docs redesign (order 1.27)

The owner asked for a docs site as clean and clear as the FlyonUI docs. This
report covers what was studied, the page model, what changed, the proof and
what is left.

## What I studied

Headless Chromium through Playwright, at 1440px and 390px, light and dark:
FlyonUI (introduction, quick start, button, switch, modal, select), shadcn/ui
(button) and HeroUI (button). Structure, proportions and feel only. No code,
class names, copy, assets or logos were taken, and the reference screenshots
stay out of the repo.

What makes them clear:

- One frame on every page. A top bar about 64px high: product name and
  version, a search box with a keyboard hint, three or four section links, a
  theme control. A left sidebar about 260px wide, grouped under short headings
  (Getting started, Components and so on), the current page tinted. A right
  "on this page" rail with the current section marked. Content in one column
  of about 790px.
- One rhythm on every component page. A title and a one or two line summary,
  then one section per variant: a small heading, one sentence, a framed live
  preview, and the code right under it with tabs and a copy control. The
  preview frame is light, bordered, rounded, with even inner padding, so the
  component is the only thing with weight.
- A plain type scale: about 36px titles, 18 to 24px section headings, 16px
  body, 14px in the sidebar and the rail. Generous space between sections
  (about 48 to 64px), tight space inside a section.
- Newcomers are led by steps: the quick start numbers each step and puts a
  copyable command under it. shadcn adds previous and next links on every
  page. HeroUI puts the props table at the end.
- On a phone the sidebar becomes a menu, the rail goes away, the search
  becomes an icon, and code scrolls in its own box.

## The page model

The site no longer uses the Starlight theme. Plain Astro layouts reach the
target with less code than overriding Starlight, and need no new dependency
(Astro and its built in Shiki are already allowed). There is no client
framework: one small script, `public/docs.js`.

- Frame (`src/components/Layout.astro`): skip link; top bar with the product
  name and version from `ds.config.json`, search, links to Components,
  Styles, Platforms and Interactions, a preview style switch, a light and dark
  switch and an English and Arabic switch (no source link, since no public URL
  exists); a grouped sidebar (Getting started, Foundations, Styles,
  Platforms, Components by family with collapsible families, Patterns,
  Accessibility, Content, Frameworks); the "on this page" rail; previous and
  next; a footer with `llms.txt`, the Markdown twin and the gallery.
- The chrome is drawn with the system's own tokens: the built token CSS
  (`@the-system/tokens/css/tokens.css`), Neutral style, light and dark, with
  Inter and IBM Plex Sans Arabic. Logical properties only.
- Home: two sentences, three numbered cards (install, pick a style, build a
  screen), a live strip with the same form in each style pack, and the
  component count per framework read from the manifests.
- Getting started: install for React, Angular and React Native, the CSS
  import order, the root Theme, the first Button, each in a copyable block.
- Component page (`src/components/ComponentPage.astro`), from the manifest and
  the demo files: family, title, one line summary, "Open in gallery", a status
  row (React, Angular, React Native: ready or planned); a hero preview with
  switches for style, scheme, platform, density, direction and language that
  drive every preview on the page; then one section per demo case, read from
  the React demo (`<DemoCase id>`), each with a heading, a sentence, a lazy
  iframe of the bundled gallery with `?case=<id>` and code tabs React,
  Angular, React Native with the real source of that case (extracted at build
  time by `scripts/cases.ts`; "planned" where a framework has none) and a copy
  control; then use when and avoid when, use instead (linked), anatomy, props
  (type, default, description), states, accessibility (role, focus, keys
  table, announcements, notes, the WCAG 2.2 criteria), content rules in
  English and Arabic, tokens and per style notes, motion (pattern, the
  interactions that play on the component, each linked to the gallery), common
  mistakes.
- Styles: one page per folder in `packages/styles/` with a `style.json`, so a
  new style appears with no change: status badge, facts, dials, the palette in
  each scheme as live swatches with the resolved values, radius, type scale,
  and the home strip screen in that style.
- Platforms (with Rail previews per platform), Interactions (live samples from
  the gallery's `/interactions?focus=<id>`), Foundations tokens (live
  swatches and the spacing scale from the built tokens), Patterns (planned),
  Coverage (status of every component per framework).
- Search: an index per language built at build time
  (`/search/en.json`, `/search/ar.json`) from the manifests, the style packs
  and the hand written pages. A native dialog, opened by the button, Ctrl K,
  Cmd K or `/`; a combobox with a listbox, arrow keys, Enter and Escape.
  Arabic matching ignores diacritics, tatweel and the alef, ya and ta marbuta
  variants.
- Arabic: every page has an `/ar/` twin with full right to left layout. Chrome
  and headings are Gulf modern standard Arabic with no diacritics and Western
  digits. Manifest prose with no Arabic field stays English in a `dir="ltr"`
  `lang="en"` isolate, with a note on the page.
- Previews: `docs.js` sets each iframe source from the page settings. The
  bundled gallery is same origin, so the script hides the gallery's own
  headings inside the frame and sizes the frame to its content. Each frame
  starts at a measured height (`src/data/preview-heights.json`, written by
  `scripts/measure-previews.ts`), so the page does not shift when previews
  load. A skeleton shows until the frame is ready.

## What changed

- New: `src/components/*`, `src/lib/*`, `src/pages/[...path].astro`,
  `src/pages/search/[lang].json.ts`, `src/pages/404.astro`,
  `src/data/preview-heights.json`, `scripts/cases.ts`, `scripts/styles.ts`,
  `scripts/measure-previews.ts`, hand pages `getting-started`, `platforms`,
  `interactions`, `patterns` in both languages.
- `index.md` became `overview.md` (the home is now a built page).
- `scripts/gen-pages.ts` writes only the Markdown twins now, adds a twin for
  the home, every style pack and the coverage table, lists the cases in every
  component twin, and runs the token build when its output is missing.
- `scripts/gen-llms.ts` lists the new guides.
- `scripts/manifests.ts` finds the repo root when bundled inside the build.
- `npm run build:site`, `npm run serve:site`, `npm run deploy:site`, the link
  check, the twins, `llms.txt` and `llms-full.txt` all keep working. The docs
  `check` script takes about 10 seconds.

## Screenshots

`docs/reports/shots/docs-redesign/`: home, getting started, Button, Switch,
Dialog, Select, the Neutral style page and the Arabic Button page, each light
and dark at 1440px and 390px (32 files, named `<page>-<width>-<scheme>.png`).
I read every one. Fixed after reading: the brand cut off at 390px (the style
switch moves into the menu under 480px), the copy control covering code on a
phone, a dark inner box in dark previews (frames now show the style's own
background), the chevron direction in the Arabic sidebar, a Latin comma in an
Arabic label.

## Axe

axe-core on the same eight pages, both widths, both schemes, tags WCAG 2.0,
2.1 and 2.2 A and AA: 0 violations in 32 runs. The preview iframes are
excluded: they are gallery pages, covered by `npm run a11y`. The first run
found two issues, both fixed: the search button lost its name when its text
was hidden at 390px, and the language link's label did not contain its
visible text.

Other checks: no sideways scroll at 390px on any of the eight pages (scroll
width equals the viewport); keyboard search, code tabs (arrow keys, Home,
End) and the style switch tested with Playwright; link check green on 259
pages, 45197 internal links.

## Not done

- Components with no React demo (Bidi, Theme) show no previews, only the
  manifest sections.
- The WCAG criteria per component are derived from the manifest (keys,
  announcements, role, family, motion) on top of a base set. A `wcag` key in
  the manifest would be more exact.
- Screenshots at 320px were not saved; the layout has a rule for it and the
  390px pages show no overflow.
- Interaction embeds use a fixed starting height (not measured).
- The style switch changes the previews, not the docs chrome, which stays
  Neutral as ordered.

## Changes needed from the lead

1. `apps/docs/package.json` still lists `@astrojs/starlight`. Nothing imports
   it. Remove it and refresh `package-lock.json` (root config, not mine).
2. Gallery, optional: a `bare=1` query that hides the demo title and the case
   heading and drops the stage padding, and a `postMessage` of the content
   height to the parent. Today `docs.js` does both by reaching into the same
   origin frame, which works for the bundled site but not for a gallery on
   another origin (the plain `npm run build` with the gallery on port 4173
   falls back to the measured heights).
3. Manifests, optional: an `ar` copy of `summary`, `useWhen`, `avoidWhen` and
   the a11y prose, so Arabic pages need no English isolates; and a `wcag` list.
4. `PLAN.md` section 4 lists `apps/docs` as "Astro Starlight". It is now plain
   Astro with the same allowed packages.
