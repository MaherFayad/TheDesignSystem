# Docs site takes the chosen style (order 1.30)

The owner used the style switch in the top bar and said the switch should set
the whole site, not only the component previews, and the switch menu showed as
a raw white native list on a dark page. Both are fixed. The top bar switch now
sets the style of the entire chrome, the previews follow it, and every switch
is a styled accessible menu. This report covers what changed, which system CSS
the chrome reuses, the proof and the gaps.

## What changed

The chrome was drawn from the Neutral token CSS and the Inter and Instrument
fonts, hard wired. Now `<html>` carries `data-ds="theme"` with `data-style`
and `data-scheme`, and every surface reads only semantic tokens, so the style
and scheme on the root paint the whole page.

- `src/styles/system.css` (new): imports the token CSS, `@the-system/css/base.css`,
  the component files the chrome reuses, and `@the-system/styles` (every pack's
  fonts and recipes). The pack CSS carries its own font faces with
  `font-display: swap` and a unicode range, so a style's font loads only when
  that style draws text, and the first paint is never blocked.
- `src/styles/docs.css`: every hard coded Neutral value and Neutral only
  assumption replaced with a token. The page color, the bar material, the
  glass blur, the radius, the display font and tracking, the current page
  color, the focus ring and line colors are all tokens now. The element
  defaults (links, code, focus) moved into a `docs-base` layer declared before
  the system `ds` layer, so a component rule always wins.
- `src/lib/chrome.ts` (new): reads each pack's `icons.ts` and `style.json` and
  emits, at build time, the rules that show the current style's icon set and
  turn the page into a floating glass layout for a pack with `usesGlass`. A new
  pack appears with no change here.
- `src/components/Menu.astro` (new): the switch, a Button that opens the
  system's DropdownMenu surface.
- `src/components/Layout.astro`: the top bar, sidebar and footer rebuilt on the
  system components; a head script applies the saved style, scheme, platform
  and language before the first paint.
- `public/docs.js`: the menu behavior, the site and preview settings, and
  persistence (replaces the old select and scheme toggle code).
- `src/components/ComponentPage.astro`, `Home.astro`, `ComponentsIndex.astro`,
  `Extras.astro`, `Coverage.astro`, `StylePage.astro`, `src/pages/404.astro`:
  buttons, badges, cards and code tabs moved onto the system components.
- `src/lib/i18n.ts`: strings for the switches and the preview note.

## The chrome controls are the system's own components

Static markup with `data-ds` attributes, drawn by the system CSS. No client
framework was added; the behavior is in `public/docs.js`.

| Chrome part | System component (`data-ds`) | File |
| --- | --- | --- |
| Brand version, framework status, family counts, proposed marks, status chips | `badge` | `@the-system/css/components/Badge.css` |
| Menu button, hero "open in gallery", home actions, copy control, menu trigger | `button` | `Button.css` |
| Menu, sidebar and search close buttons | `icon-button` | `IconButton.css` |
| Top bar section links, code framework tabs | `tabs` (soft, on links and on tab buttons) | `Tabs.css` |
| Style, scheme, language and preview switches | `dropdown-menu` surface opened by a `button` | `DropdownMenu.css` |
| Search shortcut hint | `kbd` | `Kbd.css` |
| Home steps, component, style cards | `card` | `Card.css` |
| The Theme element, Arabic, focus, reduced motion | `base.css` | `@the-system/css/base.css` |

The sidebar items, the search field and the search results are drawn in
`docs.css` from tokens (`menu.item.radius`, `bg.overlay`, the primary tint),
not from a component class, because none of the system components matches a
scrolling navigation list or a search dialog exactly; they follow the same
token shapes so they read as the style.

## What each style gives the chrome

- **Neutral**: white and soft gray, blue primary, 1px borders, small radius,
  as before.
- **Desk**: the grained black desk (the Theme element paints it, the grain is
  a background image from the Desk recipe, so it comes with no code here),
  glass top bar and floating glass sidebar with a light edge, the yellow
  primary on "read the install guide" and "save changes", Instrument Sans,
  pixel icons, pill controls.
- **Liquid**: glass bars over solid content, capsule buttons, the blue tint,
  the system font stack, line icons, 20 to 24px panel radius.
- **Studio**: flat monochrome, square controls and panels, the neutral primary
  (a white cell in dark, black in light), pixel icons, hairline rules.

A person can name the style from the top bar alone: the primary action color,
the control shape, the font and the icon set all change. See the screenshots.

## The switches

The native `<select>` menus are gone. Each switch (style, scheme, language, and
the six preview settings) is a button with `aria-haspopup="menu"` and
`aria-expanded`, opening a popover list of `menuitemradio` rows that looks like
the system's DropdownMenu in the current style. The script (dependency free)
gives it roving focus, Up, Down, Home, End, type ahead, Enter and Space to
pick, Escape and Tab and click outside to close, and focus back on the button.
The checked row carries the check glyph; a proposed style shows a "proposed"
badge. No native list shows in any style, scheme or forced colors.

The top bar switch is the site style; it sets `data-style` on `<html>`. A
preview page keeps its own "Preview style" menu, labelled so, that overrides
the style for that page's previews only; its note says the previews follow the
site style and the settings change this page only.

## Persistence and no flash

Style, scheme, platform and language persist in `localStorage` (wrapped in try
and catch). A head script applies them before the first paint, so there is no
flash. Scheme follows `prefers-color-scheme` until the person picks a scheme
("Match system" is the default and an explicit choice). Every preview iframe
and every gallery link gets `?style=&scheme=&platform=` from the current
settings, so the site and the previews always match. The saved language sends a
first visit to the home page to the saved language only; a direct link to a
page in either language is never redirected.

## The style list is read from the packs

The style menu, the icon rules and the glass rules are all read from
`packages/styles/*/` at build time. A new folder with a `style.json` appears in
the switch, draws its own icon set, and gets glass bars if its `usesGlass` is
true, with no change in `apps/docs`. A pack with `"status": "proposed"` shows a
"proposed" badge in the menu.

## Proof

Build and serve: `npm run build:site -w @the-system/docs` then
`npm run serve:site -w @the-system/docs`. The proof scripts are in
`apps/docs/scripts/proof/`.

### Screenshots

`docs/reports/shots/docs-styles/`: the home page, the Button page and the open
style menu in each of the four styles, dark and light, at 1440px and 390px;
the Arabic Button page in every style, both schemes, both widths; the Desk home
at 320px; the open menu under forced colors. I read every one. Fixed after
reading: the top bar text was muted, which fell to 4.32:1 over Desk's yellow as
it scrolled under the glass (now the default text color, which the menu bar
rule sets on the Tabs too); the Arabic note box took the control radius and
drew as a pill in Desk and Liquid (now the card radius); the brand name, the
switch values and the search label collapse to their icons in order as the
viewport narrows, with no overflow.

### Axe

`axe-core` (WCAG 2.0, 2.1 and 2.2, A and AA) on the home page, the Button page
and the style page, in all four styles, dark and light, at 1440px, plus the
open style menu on each home run, and the home and Button pages at 390px: 72
runs, 0 violations (`shots/docs-styles/axe.json`). The preview iframes are
excluded; they are gallery pages, covered by `npm run a11y`.

### Contrast on glass

`apps/docs/scripts/proof/glass-contrast.ts` resolves the real token values and
composites the bar material over the page, a surface and the primary fill. The
chrome text on the Desk and Liquid glass bars, over every backdrop, is 5.82:1
at the lowest (the sidebar current page color on Desk light); body text is
13:1 or more. The top bar uses only the default text color, never muted, so
content of any color scrolling under the glass still passes.

### Keyboard, persistence and the preview URL

`apps/docs/scripts/proof/behavior.mjs` (23 checks, all pass,
`shots/docs-styles/behavior.txt`): the menu opens on the checked item, Up, Down,
Home, End and type ahead move, Escape and click outside close and return focus,
Enter picks; the choice of style, scheme, platform and language survives a
reload; the preview iframe URL and the gallery links carry the chosen style,
scheme and platform; the saved language reaches a fresh visit to the home page
and a direct link is left alone.

### Other checks

- No sideways scroll at 320px in any style on the home, Button, Arabic Button
  or style pages, and every top bar control stays inside the viewport.
- No layout shift of the frame when the style changes: the top bar, the
  sidebar and the switches keep their geometry; only text widths move, by the
  few pixels each style's font differs.
- Arabic right to left mirrors correctly: the bar, the menus and the sidebar
  flip, the chevrons turn, the menu opens from the correct side.
- The link check is green.
- The docs `check` script runs in about 12 seconds.

## Token gaps

None blocked the work. Two notes:

- There is no single "glass bar text" token; the chrome uses the default text
  color on the bars and never the muted color, so text over the brightest
  backdrop (Desk's yellow scrolling under the bar) still passes. If a future
  pack sets a very light `material.menubar`, revisit.
- The sidebar current page sits on `primary.tint` with `primary.on-surface`
  text, which is 5.82:1 at the lowest across the glass styles. A dedicated
  "selected nav item" token pair would make that explicit rather than derived.

## Changes needed from the lead

None required. Two optional follow ups:

1. The proof scripts in `apps/docs/scripts/proof/` need `playwright` and
   `@axe-core/playwright` on `NODE_PATH` (the repo root `node_modules`); they
   are run by hand, not wired into `npm run check`, to keep the check under two
   minutes. Wire them into a separate `proof:site` script if you want them in
   CI.
2. `packages/styles/neutral/style.json` is marked `"status": "proposed"`, so
   Neutral shows a "proposed" badge in the style menu. That matches the pack
   today; if Neutral is meant to be the stable default, flip its status (a
   `packages/**` change, not mine).
