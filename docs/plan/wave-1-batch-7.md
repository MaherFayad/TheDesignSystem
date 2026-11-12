# Wave 1, batch 7: navigation (13)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 6 is green.

Every order also reads: GB site/`SiteNav.tsx` (current page by weight and
`aria-current`, not color alone), GB desktop/`desktop.css` lines 154 to 283
(menu bar), `docs/contracts/anatomy.md` (landmarks are the consumer's
choice; a nav component renders `nav` with a label).

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 7A App navigation | Sidebar, Rail, Navbar | batch 6 green |
| 1 | 7B Bars | Tabs, Toolbar, TabBar, Dock | batch 6 green |
| 1 | 7C Wayfinding | SkipLink, Breadcrumbs, Pagination, TableOfContents, LanguageSwitch | batch 6 green |

Slot 4 runs 1.15 Docs site. Stepper (1.7.7) was built in batch 4.

## 1.7.1 Navbar

- Goal: the top bar of a site or app: brand slot, primary links with
  dropdown panels, actions at the end, a menu button on phones.
- Behavior: Radix NavigationMenu.
- Anatomy: root (`data-ds="navbar"`), `brand`, `list`, `item`, `link`,
  `trigger`, `content`, `indicator`, `viewport`, `end`, `menu-button` (an
  IconButton root), `mobile` (a Drawer root under `breakpoint.tablet`).
- Axes: size (`md`, `lg`).
- States: links `data-active`; triggers `data-state`.
- Keys: Tab between items; Enter and Space open a panel; ArrowDown into it;
  Escape closes; arrows move between triggers (reading direction).
- Read: GB site/`SiteNav.tsx`, GB desktop/`desktop.css` lines 154 to 283.
- Owns: standard set for Navbar, `packages/styles/desk/recipes/Navbar.css` if
  Desk draws it as the menu bar.
- Depends: 1.7.3 (same lane), 1.6.3.
- Accept: checklist; `aria-current="page"` plus weight; sticky form reserves
  scroll padding (2.4.11); no sideways scroll at 320px.

## 1.7.2 Sidebar

- Goal: the side navigation of an app with groups, icons, counts and a
  collapsed form.
- Behavior: hand built `nav`; groups on Radix Collapsible.
- Anatomy: root (`data-ds="sidebar"`), `header`, `group`, `group-label`,
  `group-trigger`, `item`, `item-icon`, `item-label`, `item-count`,
  `footer`, `toggle` (an IconButton root, icon `sidebar`).
- Axes: size (`sm`, `md`).
- States: `data-state` (`expanded`, `collapsed`); items `data-active`;
  groups `data-state`.
- Keys: Tab through items; Enter follows; group triggers Enter and Space.
- Read: GB admin/`AdminNav.tsx`, FK2 `Section/` (collapsible groups).
- Owns: standard set for Sidebar.
- Depends: none.
- Accept: checklist; collapsed items keep a Tooltip with the label (1.6.6);
  the side flips in RTL; `insteadUse` points a narrow icon column to Rail.

## 1.7.3 Rail

- Goal: a narrow column of icon destinations (the Studio rail).
- Behavior: hand built `nav`.
- Anatomy: root (`data-ds="rail"`), `item` (icon plus short label or a
  Tooltip), `item-badge`, `start`, `end`.
- Axes: size (`sm`, `md`).
- States: items `data-active`.
- Keys: Tab through items; Enter follows.
- Read: no source: design from the dials table and the nearest existing
  component (Sidebar). Studio dial 10 (rail, sidebars, inspector).
- Owns: standard set for Rail.
- Depends: 1.7.2 (same lane).
- Accept: checklist; every item has a visible label or a Tooltip; 24px
  targets in compact, 44px in touch templates.

## 1.7.4 Tabs

- Goal: switch between panels of related content in place.
- Behavior: Radix Tabs.
- Anatomy: root (`data-ds="tabs"`), `list`, `trigger`, `indicator`,
  `panel`, `count`.
- Axes: size (`sm`, `md`), emphasis (`soft`, `ghost` underline style through
  tokens).
- States: `data-orientation`; triggers `data-state` (`active`,
  `inactive`), `data-disabled`.
- Keys: arrows move and activate (automatic, option for manual); Home and
  End; Tab moves to the panel.
- Read: FK2 `Tabs/` (all files), GB site/`ExportTabs.tsx`, GB
  `banana-server/app/(site)/[locale]/(pages)/(home)/install/InstallTabs.tsx`.
- Owns: standard set for Tabs.
- Depends: none.
- Accept: checklist; `tab-indicator` motion; active by weight and indicator,
  not color alone; arrows reversed in RTL; overflow scrolls inside the list.

## 1.7.5 Breadcrumbs

- Goal: the path to the current page.
- Behavior: hand built `nav` with an ordered list.
- Anatomy: root (`data-ds="breadcrumbs"`), `list`, `item`, `link`,
  `separator` (chevron-forward, mirrored), `current`, `overflow` (a
  DropdownMenu root for collapsed middle items).
- Axes: size (`sm`, `md`).
- States: none.
- Keys: Tab through links.
- Read: no source: design from the dials table and the nearest existing
  component (Link).
- Owns: standard set for Breadcrumbs.
- Depends: 1.7.11 (same lane).
- Accept: checklist; `aria-current="page"` on the last item; separators are
  `aria-hidden`; long Arabic names truncate with the full text available.

## 1.7.6 Pagination

- Goal: move between pages of a list.
- Behavior: hand built `nav`; links or buttons.
- Anatomy: root (`data-ds="pagination"`), `first`, `previous`, `page`,
  `ellipsis`, `next`, `last`, `summary` ("21 to 40 of 312").
- Axes: size, shape.
- States: pages `data-active`; ends `data-disabled`.
- Keys: Tab through controls; Enter follows.
- Shared: `packages/shared/src/pagination.ts`: `pageRange(current, total,
  siblings, boundaries)` with ellipsis markers; `itemRange(page, pageSize,
  total)`.
- Read: no source: design from the dials table and the nearest existing
  component (ToggleGroup items, Button ghost).
- Owns: standard set for Pagination, `packages/shared/src/pagination.ts`.
- Depends: 1.7.5 (same lane).
- Accept: checklist; `aria-current="page"`; previous and next icons mirror in
  RTL; numbers use Western digits by default; compact form under
  `breakpoint.phone`.

## 1.7.8 TabBar

- Goal: the bottom bar of 3 to 5 destinations on phone layouts (web).
- Behavior: hand built `nav` of links.
- Anatomy: root (`data-ds="tab-bar"`), `item`, `item-icon`, `item-label`,
  `item-badge`.
- Axes: size (`md`, `lg`).
- States: items `data-active`.
- Keys: Tab through items; Enter follows.
- Read: GB desktop/`desktop.css` lines 1327 to 1542 (phone home screen).
- Owns: standard set for TabBar.
- Depends: 1.7.9 (same lane).
- Accept: checklist; 44px targets at `lg`; safe area padding; labels always
  visible; `insteadUse` points in page panels to Tabs.

## 1.7.9 Toolbar

- Goal: a row of controls for one context (a text editor, a canvas).
- Behavior: Radix Toolbar.
- Anatomy: root (`data-ds="toolbar"`), `group`, `separator`, items are
  system Buttons, ToggleButtons, ToggleGroups, Links carrying
  `data-part="item"`.
- Axes: size, emphasis (to items).
- States: `data-orientation`.
- Keys: one tab stop; arrows move (reading direction); Home and End.
- Read: FK2 `AlignBar/`, GB `banana-server/app/(site)/[locale]/(pages)/(home)/canvases/Dashboard.tsx`.
- Owns: standard set for Toolbar.
- Depends: 1.7.4 (same lane).
- Accept: checklist; a label is required; overflow moves into a DropdownMenu
  "More tools".

## 1.7.10 TableOfContents

- Goal: links to the headings of a long page, with the current section
  marked as the reader scrolls.
- Behavior: hand built `nav`; IntersectionObserver in an effect.
- Anatomy: root (`data-ds="table-of-contents"`), `title`, `list`, `item`,
  `link`, `indicator`.
- Axes: size (`sm`, `md`).
- States: items `data-active`; nesting `data-level`.
- Keys: Tab through links; Enter scrolls and moves focus to the heading.
- Shared: `packages/shared/src/toc.ts`: `activeHeading(rects, offset)` and
  `buildTree(headings)`, pure.
- Read: GB site/`AnchorScroll.tsx` (smooth scroll, focus to target, reduced
  motion jump).
- Owns: standard set for TableOfContents, `packages/shared/src/toc.ts`.
- Depends: 1.7.6 (same lane).
- Accept: checklist; `aria-current="location"`; jumps under reduced motion;
  sticky form reserves scroll padding.

## 1.7.11 SkipLink

- Goal: the first focusable link that jumps to main content.
- Behavior: hand built; visible on focus; moves focus to the target.
- Anatomy: root (`data-ds="skip-link"`).
- Axes: none.
- States: none.
- Keys: Enter moves focus to the target (`#main` by default).
- Read: GB `banana-server/app/(site)/site.css` lines 77 to 100, GB
  `banana-server/app/(site)/[locale]/layout.tsx`.
- Owns: standard set for SkipLink.
- Depends: none.
- Accept: checklist; WCAG 2.4.1; measured focused for target size (24px);
  the target gets `tabindex="-1"` only if it is not focusable; PageShell
  (1.8.12) renders it first.

## 1.7.12 Dock

- Goal: Desk's dock of app shortcuts at the block end, and a plain icon row
  in other styles.
- Behavior: hand built `nav` of links or buttons.
- Anatomy: root (`data-ds="dock"`), `item`, `item-icon`, `item-label`
  (shown on hover and focus), `item-indicator` (open app), `separator`.
- Axes: size (`md`, `lg`).
- States: items `data-active`, `data-open`.
- Keys: Tab through items; Enter follows.
- Read: GB desktop/`Dock.tsx`, GB desktop/`desktop.css` lines 1169 to 1287.
- Owns: standard set for Dock, `packages/styles/desk/recipes/Dock.css`.
- Depends: 1.7.8 (same lane).
- Accept: checklist; the name is always in the link (label shown on hover
  and focus, never only a native title); pages keep bottom room so the dock
  never covers content; magnify effect off under reduced motion.

## 1.7.13 LanguageSwitch

- Goal: switch between English and Arabic (and more later), keeping the
  page.
- Behavior: hand built; two languages render as a link pair, more render a
  DropdownMenu.
- Anatomy: root (`data-ds="language-switch"`), `item` (a Link root with
  `hreflang` and `lang`), `trigger`, `menu`.
- Axes: size, emphasis.
- States: items `data-active`.
- Keys: as Link or DropdownMenu.
- Read: GB site/`SiteNav.tsx` (`switchLocalePath`).
- Owns: standard set for LanguageSwitch.
- Depends: 1.7.10 (same lane).
- Accept: checklist; each language name is written in its own language with
  `lang` set ("English", "العربية"); never a flag; a manifest note says a
  direction change on React Native needs a restart.

## Pointer

1.7.7 Stepper: built in batch 4 (`wave-1-batch-4.md`).
