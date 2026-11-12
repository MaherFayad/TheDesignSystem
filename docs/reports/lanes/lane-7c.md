# Lane 7C: Wayfinding

Branch `claude/ds-lane-7c`. Batch file `docs/plan/wave-1-batch-7.md`. All five
components are built, in order: SkipLink (1.7.11), Breadcrumbs (1.7.5),
Pagination (1.7.6), TableOfContents (1.7.10), LanguageSwitch (1.7.13).

Each has its own commit, then a second commit for the fixes from one fresh
eyes review. Each review ran as a ds-qa subagent on claude-opus-5-5 at medium
effort.

## Proof

- `npm run check`: green after the last commit. It covers tokens, gen,
  typecheck, eslint, manifests, vitest, and the Angular, native and consumer
  checks.
- `npm run contract -- --framework react --component SkipLink,Breadcrumbs,Pagination,TableOfContents,LanguageSwitch`:
  every component passes 21 checks with 0 failures.
  - Breadcrumbs and LanguageSwitch each skip 10 "open" checks. Their menu is
    a DropdownMenu, so it is not one of their own roots. See their decisions
    below.
- Screenshots are in `docs/reports/shots/wave-1/<slug>/`, in five themes:
  studio dark, studio light, desk dark, desk light, and desk dark RTL Arabic.
  Some components also have extra shots: focused, scrolled, menu open, and
  320px phone. I read every PNG and fixed what looked wrong.
- Source repos: `add_repo` for GoBanana was denied in this session, so I
  never read GoBanana `site.css`, `AnchorScroll.tsx` or `SiteNav.tsx`.
  - The design comes from the dials table and the nearest existing
    components (Link, Button, DropdownMenu).
  - Each component's header comment says so.
  - The Arabic copy cookbook was not available either.

## SkipLink (1.7.11)

```ts
interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  href?: string;          // default '#main'; the target is found by id
  children?: ReactNode;   // default 'Skip to main content' / 'الانتقال للمحتوى الرئيسي'
  ref?: Ref<HTMLAnchorElement>;
}
export function focusFragment(href: string, doc?: Document): boolean;
```

Decisions:

- The `href` is the target, so there is no second prop.
- On activation, focus moves to the target. The target gets `tabindex="-1"`
  only when focus does not land on it as it is. That covers a region, an
  anchor with no href, and a disabled control.
- After focus moves, the fragment is set through `location.hash`, so
  `hashchange` and `:target` fire.
- A click with a modifier key, or a middle click, is left to the browser.
- The link is visually hidden at rest and drawn on any focus, at the
  block-start and inline-start corner. It is `position: absolute` with
  `z.spotlight`.
- A long label wraps.
- There is no motion key in the manifest, the same as Link: nothing moves.

Review fixes:

- **Blocker fixed:** a target that reports tabIndex 0 but cannot take focus
  now gets tabindex -1.
- **Blocker fixed:** modifier clicks and middle clicks pass through to the
  browser.
- Paint moved to the root rule, and `:focus` now only unhides the link.
- Padding and shadow are now private properties.
- Manifest: added the font token and fixed the native note.
- Demo: retitled a case, labelled the nav per language, and added
  block-start room.

Left open:

- The manifest has no `motion` key. The lead should confirm that leaving it
  out is right for components with no motion, as with Link.

## Breadcrumbs (1.7.5)

```ts
interface BreadcrumbItem { label: string; href?: string; link?: ReactElement }
interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  items: readonly BreadcrumbItem[];   // last item is the current page
  size?: 'sm' | 'md';                 // default 'md'
  maxItems?: number;                  // collapse: first, overflow menu, last maxItems-2
  label?: string;                     // nav name, default 'Breadcrumbs' / 'مسار التنقل'
  overflowLabel?: string;             // default 'Show hidden pages' / 'الصفحات المخفية'
  onNavigate?: (item: BreadcrumbItem, index: number) => void;
  ref?: Ref<HTMLElement>;
}
export function collapseItems(count: number, maxItems?: number): (number | 'overflow')[];
```

Decisions:

- The DOM is `nav > ol[data-part=list] > li[data-part=item]`.
- Each step is a system Link: `standalone`, `data-part="link"`,
  `dir="auto"`.
- The current page is a `span` with `aria-current="page"`. It never
  truncates; it wraps.
- Separators are a `chevron-forward` icon, `aria-hidden` and mirrored. Each
  separator sits inside the item it follows.
- `overflow` is the DropdownMenu trigger: an IconButton carrying
  `data-part="overflow"`.
  - The trigger carries `data-state`, so the manifest lists `open` and
    `closed`. It explains that the root itself has no state.
  - Escape belongs to the overflow menu. It is described under the arrow
    keys entry, not as its own key, because the suite would read Escape as
    closing Breadcrumbs. Setting `contract.trigger` made the suite treat
    the DropdownMenu root as a Breadcrumbs overlay, and 8 checks failed, so
    I removed it.
- Truncation:
  - With a hover pointer, `@media (hover: hover)`, long link steps truncate
    at `menu.width.min`. Hover and keyboard focus show the full text.
  - On touch, steps wrap.
  - The full text is always the accessible name.
  - Headless Chromium reports no hover, so the screenshots show the wrapped
    form.
- In the overflow menu, a step with only a router `link` falls back to that
  link's `href`.
- A middle step with no href renders as a disabled Link.

Review fixes:

- **Blockers fixed:**
  - The router link fallback in the overflow menu.
  - Link's `standalone` is used instead of rebuilding its box.
  - Full text is now reachable on touch.
- `dir="auto"` added, so Latin names truncate at their own end in RTL.
- A passed `aria-label` now wins over the default.
- The key map now covers Space.
- `slots` removed.
- Added a keyboard test for the collapsed path.

## Pagination (1.7.6)

```ts
interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children' | 'onChange'> {
  page?: number; defaultPage?: number; onPageChange?: (page: number) => void;
  pageCount?: number;            // default from itemCount/pageSize, else 1; under 1 or NaN reads as 1
  itemCount?: number;            // turns on the summary
  pageSize?: number;             // default 20
  siblings?: number;             // default 1
  boundaries?: number;           // default 1
  showEnds?: boolean;            // default true
  getHref?: (page: number) => string;   // link mode (Button asChild)
  size?: 'sm' | 'md' | 'lg';     // default 'md'
  shape?: 'default' | 'pill' | 'square';
  disabled?: boolean;
  label?: string;                // default 'Pagination' / 'التنقل بين الصفحات'
  formatSummary?: (start: number, end: number, total: number) => string;
  ref?: Ref<HTMLElement>;
}
```

Shared logic is in `packages/shared/src/pagination.ts` and has tests:

- `pageRange(current, total, siblings, boundaries)` returns page numbers plus
  `'ellipsis-start'` and `'ellipsis-end'` markers. The length is constant
  as the page moves.
- `itemRange(page, pageSize, total)`.
- `pageCount`, `clampPage` and `isEllipsis`.

Decisions:

- Controls are system Buttons and IconButtons. Each page control is keyed by
  its number, so focus stays on the pressed page.
- The end controls stay focusable with `aria-disabled`.
- The current page is a soft fill, plus a strong border and
  `aria-current="page"`.
- Numbers use Western digits with en grouping (12,480).
- The empty-list summary reads "No items" and "ما فيه عناصر".
- Compact form, under `breakpoint.phone`:
  - It shows the end controls, the current page and the last page.
  - A compact-only ellipsis, `data-ellipsis-compact`, sits between the
    current and the last page when pages are hidden. It is listed in
    `states`.
  - The summary wraps onto its own line.
- `motion: "press"` is the Button press.

Review fixes:

- **Blocker fixed:** a `pageCount` of 0 or NaN no longer produces page 0.
- Link mode leaves modifier clicks to the browser.
- The current-page colors now go through `--_pagination-*` private
  properties.
- The summary wraps in the compact form.
- The compact form keeps the last page.
- Added a `long-text` case.
- NaN siblings and boundaries are now guarded.
- The Arabic empty text is now in dialect.

Left open:

- The note that `useControllable` is imported from
  `../Window/useControllable`. See "Changes needed from the lead".

## TableOfContents (1.7.10)

```ts
interface TableOfContentsProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  items: readonly TocHeading[];        // { id, label, level }
  title?: ReactNode | false;           // default 'On this page' / 'محتوى الصفحة'
  size?: 'sm' | 'md';                  // default 'md'
  offset?: number;                     // sticky header height in px, default 0
  sticky?: boolean;                    // default false
  active?: string | null;              // controlled
  onActiveChange?: (id: string | null) => void;
  ref?: Ref<HTMLElement>;
}
```

Shared logic is in `packages/shared/src/toc.ts` and has tests:

- `buildTree(headings)`: a skipped level nests one step down.
- `flattenTree`.
- `activeHeading(rects, offset, atEnd)`.

Decisions:

- The title is a `p` that names the nav through `aria-labelledby`, so the
  list adds no heading to the page outline.
- Links are plain anchors with no underline at rest. The active link is
  marked by medium weight, the indicator bar and `aria-current="location"`.
- Link text has `dir="auto"` on an inner span. The row itself keeps the page
  direction for its indent.
- The reading line is `offset` plus a fifth of the viewport, at most 64px.
  - An IntersectionObserver on that line triggers a measure, at most once
    per frame.
  - `scrollend` also measures, which marks the last section at the bottom of
    the page.
  - A ResizeObserver re-measures the indicator when the list reflows.
- Enter or a click does four things:
  - Scrolls smoothly, or jumps under reduced motion.
  - Moves focus to the heading, adding tabindex -1 only if needed.
  - Sets the fragment through `pushState`, so there is no second jump.
  - Holds the mark on the chosen section until `scrollend`, so it does not
    flicker on the way. A 1s fallback lifts the hold if no `scrollend`
    fires.
- On load, the fragment in the URL picks the first active section.
- The indicator moves by transform only, as the `tab-indicator` pattern.
  Its length is set at once.
- Sticky form:
  - The list sits below `offset + space.l`, set inline.
  - It has `scroll-padding-block`.
  - It keeps the active link in view inside the list without scrolling the
    page.
  - It scrolls inside past `dialog.height.max`. See token gaps.
- `data-level` is on every item but is not listed under `states`. The suite
  requires listed states to have an empty value. The manifest note explains
  this.

Review fixes:

- **Blockers fixed:**
  - The reading line and the observer margin now match, and the page bottom
    is detected.
  - The sticky top honors `offset`.
  - Scroll padding added, and the active link is kept in view.
  - No more flicker during a smooth scroll.
- The root callback ref is now stable.
- ResizeObserver added.
- Fragment seeding on load.
- Logical margins.
- `forced-color-adjust: none` on the indicator.
- Manifest wording now matches the code.
- Added tests for unmount, the scroll hold, the fragment and the sticky
  offset.

## LanguageSwitch (1.7.13)

```ts
interface LanguageOption { code: string; name: string; href: string }
interface LanguageSwitchProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  languages: readonly LanguageOption[];  // 2: link pair, 3+: menu, under 2: renders nothing
  current: string;                       // no match marks nothing
  size?: 'sm' | 'md';                    // default 'md'
  emphasis?: 'ghost' | 'soft';           // the menu trigger; default 'ghost'
  label?: string;                        // default 'Language' / 'اللغة'
  onNavigate?: (language: LanguageOption) => void;
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- Pair form:
  - The items are system Links with `hreflang`, `lang` and `dir`. `dir`
    comes from `directionOf` in shared.
  - The active link has `aria-current="page"` and `data-active`, medium
    weight, and no underline.
  - There is never a flag.
- Menu form:
  - A Button trigger, `data-part="trigger"`, with the `language` icon. Its
    accessible name is "English, Language": the visible name first, for
    WCAG 2.5.3.
  - The menu is a DropdownMenu with `data-part="menu"` and radio items
    carrying `lang`.
  - Rows have no href, so the menu form needs script. The manifest says so.
- `emphasis` styles the trigger only.
- `open` and `closed` are in `states` because the trigger carries
  `data-state`. Escape is handled as in Breadcrumbs.
- The manifest has the React Native restart note in `a11y.notes` and in
  `frameworks.native`.

Review fixes:

- **Blocker fixed:** Arabic sizing now goes through `--_link-font-size`, and
  the items carry Link sizes.
- **Blocker fixed:** the manifest no longer claims `hreflang` on menu rows.
- Forced colors now go through `--_link-fg`.
- The trigger name now starts with the visible name.
- The shared `directionOf` replaces a local copy.
- An unmatched `current` and a single language are handled.
- `aria-current` is now `page`.
- The long Arabic case now uses a real language name.
- Added a shot of the too-many menu open.

## Token gaps

- **`z.skip-link`:** SkipLink uses `z.spotlight` (9000). It sits above the
  page chrome and below dialogs.
- **A breadcrumb step max width:** Breadcrumbs borrows `menu.width.min`
  (200px).
- **A viewport height for panels (`shell.panel.height-max`):**
  TableOfContents sticky borrows `dialog.height.max` (80dvh). The raw-value
  gate forbids `100dvh` in component CSS.
- **No height token for a demo frame:** the TableOfContents `too-many` demo
  uses `calc(8 * size.control.lg)`.

## Changes needed from the lead

1. **Move `useControllable` to a shared hooks location.** Pagination imports
   it from `packages/react/src/components/Window/useControllable.ts`, the
   same way DropdownMenu does. Move it to
   `packages/react/src/hooks/useControllable.ts` and update the imports in
   Window, DropdownMenu and Pagination. It is not my file, so I left it.
2. **Generated files.** Barrels, `css/src/index.css`, `styles/*/index.css`,
   `routes.gen.ts`, `manifests.gen.json` and `shared/src/index.ts` were
   refreshed with `npm run gen` and committed. Regenerate them on merge.
3. **Contract suite support for components that wrap a DropdownMenu.**
   - Breadcrumbs and LanguageSwitch own a DropdownMenu trigger. The suite
     treats `open` and `closed` in `states` as an overlay of the component
     itself, so their "open" axe and target-size checks are skipped.
     DropdownMenu's own contract covers the menu.
   - A hint would let the suite open a nested overlay and check it under
     the parent, for example `contract.nestedTrigger`.
   - Separately, the suite has no way to say that a part's own `data-state`
     is not the component's state.
4. **Schema decision.** Decide whether `motion` may be left out for
   components with no motion (SkipLink, Breadcrumbs, LanguageSwitch). Link
   already does this. Or add a `none` pattern to the catalog.
5. **GoBanana source check.** Add GoBanana to the lane environment, or have
   someone review these components against GoBanana `site.css` lines 77 to
   100, `AnchorScroll.tsx` and `SiteNav.tsx`. I could not read them.

## What I could not do

- I could not read the GoBanana sources or the Arabic copy cookbook. The
  Arabic copy follows the brief's rules: noun forms, no diacritics, white
  Saudi dialect where a sentence is needed.
- Neutral style screenshots: Neutral is not in this checkout. The components
  use only tokens and private properties, so Neutral should apply with no
  recipe.
- No recipe files were needed for Studio or Desk.
