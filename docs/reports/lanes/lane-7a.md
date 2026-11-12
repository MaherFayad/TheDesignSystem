# Lane 7A report: app navigation

Branch `claude/ds-lane-7a`. Orders 1.7.2 Sidebar, 1.7.3 Rail, 1.7.1 Navbar,
built in that order. All three are React `ready`, Angular `planned`.

| Order | Component | Commit | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.7.2 | Sidebar | `wo-1.7.2: sidebar`, then review fixes | green | 21 passed, 0 failed, 10 skipped |
| 1.7.3 | Rail | `wo-1.7.3: rail`, then review fixes | green | 21 passed, 0 failed, 0 skipped |
| 1.7.1 | Navbar | `wo-1.7.1: navbar`, then review fixes | green | 21 passed, 0 failed, 10 skipped |

The skipped Sidebar and Navbar tests are the overlay only cases ("target size
open", "axe open"), which do not apply: neither is an overlay.

Screenshots: `docs/reports/shots/wave-1/{sidebar,rail,navbar}/`, full demo
pages in studio dark and light, desk dark and light, and desk dark with
`dir=rtl&lang=ar`. Navbar also has `phone-studio-dark.png` and
`phone-desk-light-rtl.png`: 320px wide with the phone list open, page
`scrollWidth` 320 in both (no sideways scroll).

## Sources

GoBanana (`AdminNav.tsx`, `SiteNav.tsx`, `desktop.css`) could not be fetched:
adding the private repo was refused in this session. Figma-Killer-2 was
cloned; `Section/` gave the collapsible group of Sidebar (the title is the
toggle, the chevron beside it). Everything else is designed from the dials
table in section 3.7 of PLAN.md and the nearest components (DropdownMenu
rows and surface, Link, Button). Each file header says so.

## Sidebar (1.7.2)

What it is: a `nav` landmark with a header (brand plus the collapse toggle),
groups of links with icons and counts, a footer, and a collapsed icon column.

```tsx
<Sidebar
  label="Main"                 // required, aria-label of the nav
  size="md"                    // 'sm' | 'md', default 'md' (rows: size.control.sm / md)
  collapsed={boolean}          // controlled
  defaultCollapsed={false}
  onCollapsedChange={(collapsed) => {}}
  collapsible={true}           // renders the toggle IconButton, icon `sidebar`
  toggleLabels={{ collapse: 'Collapse sidebar', expand: 'Expand sidebar' }}
>
  <SidebarHeader>{brand}</SidebarHeader>
  <SidebarGroup
    label="Projects"           // heading and list name
    collapsible={false}        // heading becomes a ghost Button, Radix Collapsible
    open defaultOpen={true} onOpenChange
  >
    <SidebarItem
      href="#" start="inbox"   // icon name or node
      count={12} countLabel="12 unread"
      active disabled asChild
    >Inbox</SidebarItem>
  </SidebarGroup>
  <SidebarFooter>{items}</SidebarFooter>
</Sidebar>
useSidebar() // { collapsed, size, setCollapsed, ... } for a compact brand
```

Decisions:

- Anatomy adds `list` (the `ul` of a group) to the order's list: the CSS
  needs an attribute to reset the list, and tag selectors are not allowed.
- The active item: `aria-current="page"`, bold weight, an overlay fill and a
  bar on the inline start edge drawn by `::before` (the glow layer).
- Collapsed: the width snaps (width may not animate). Labels stay in the DOM,
  visually hidden, as the accessible names. Collapsible groups are held open
  and their trigger hidden, and stay mounted so focus is kept. Counts become
  a dot. Group headings become hairlines.
- The toggle's name says the next action and it carries no `aria-expanded`:
  every link stays in place, only drawn smaller.
- A `SidebarHeader` anywhere in the tree registers itself; without one, the
  sidebar adds a header for the toggle.
- Counts over 99 show `99+` (with `dir="ltr"` so Arabic keeps the order); 0
  draws nothing.
- Disabled items drop the href and stay focusable (the Link rule). A disabled
  `asChild` item renders the plain anchor, so a router child's own click
  never runs.
- The sidebar's edge is `--_sidebar-border-end-color`; a sidebar at the
  inline end swaps it with `--_sidebar-border-start-color`.
- Motion `fade-rise`: an opened group's list fades in and rises one step;
  closing is instant. None under reduced motion.
- Demo case `empty` does not apply (a navigation with no destinations is the
  page's empty state, not the sidebar's) and is left out.

## Rail (1.7.3)

What it is: a narrow `nav` column of icon links with short labels, a `start`
(brand) and an `end` (settings), with badges.

```tsx
<Rail
  label="Main"                  // required
  size="md"                     // 'sm' | 'md', default 'md' (size.control.sm / md)
  hideLabels={false}            // labels only as accessible names; pair with Tooltip later
  start={<Brand />}
  end={<RailItem href="#settings" icon="settings" label="Settings" />}
>
  <RailItem
    href="#" icon="inbox" label="Inbox"   // icon and label required
    badge={3}                             // number, or true for a dot
    badgeLabel="3 new"                    // read after the label; needed for a dot
    active disabled asChild
  />
</Rail>
```

Decisions:

- Anatomy adds `list`, `item-icon` and `item-label` (style targets); `end`
  is a second `ul`, so its items are list items too.
- Sizes follow anatomy rule 12 (md is 32px). The order's 44px touch target
  comes from the platform axis: under `data-platform="ios"` or `"android"`
  items take `size.touch.ios` (44) or `size.touch.android` (48).
- Item width: the wider of 1.5 times `shell.rail-width` and the item size;
  with `hideLabels` it is the item size.
- Labels carry `dir="auto"`, so a Latin label in an Arabic rail ends in its
  own ellipsis. The full label is always the accessible name.
- The badge sits inside the icon box on its top end corner; the label is
  first in the DOM (drawn under the icon with `order`) so the name reads
  "Inbox 3".
- The list scrolls when the column runs out of room; start and end stay in
  view.
- No motion pattern: nothing moves. The manifest names none, as Link and
  ButtonGroup do. The lead may want to confirm that.
- Demo case `empty` does not apply and is left out.

## Navbar (1.7.1)

What it is: the top bar of a site or app on Radix NavigationMenu: a brand,
links and menus with panels, actions at the end, and under breakpoint.tablet
a menu button with a phone list.

```tsx
<Navbar
  label="Main"                         // required
  size="md"                            // 'md' | 'lg', default 'md' (size.control.md / lg)
  brand={<Link href="/" standalone>Northwind</Link>}
  items={[
    { label: 'Overview', href: '/', start: 'home', active: true },
    { label: 'Product', links: [
      { label: 'Boards', href: '/boards', description: 'Plan work on one shared canvas', start: 'grid' },
    ] },
  ]}
  end={<Button>Sign in</Button>}
  sticky={false}                       // data-sticky, z.topbar, scroll padding on :root
  linkAs={RouterLink}                  // default 'a'
  defaultOpenMenu="Product"            // a menu open at first render
  menuLabels={{ button: 'Menu', panel: 'Site menu' }}
/>
```

Decisions:

- Items are data, not children: one list draws both the bar and the phone
  list. `linkAs` takes a router link.
- Anatomy adds `link-label`, `link-description` (panel links),
  `content-list` (the panel `ul`) and `trigger-icon` (the chevron, so the
  navbar turns a part it owns, not Button's `end`).
- The trigger is a ghost Button through `NavigationMenu.Trigger asChild`; a
  menu holding the current page takes the bold weight.
- The current link: `aria-current="page"` (from Radix `active`), bold weight
  and a bar under it (the `::before` glow layer); in a panel the bar runs
  down the inline start edge.
- `mobile`: Drawer (1.6.3) is not built, so the phone list is a disclosure
  panel under the bar holding a Sidebar (`collapsible={false}`, one group per
  menu, plain links in one unnamed group). The menu button keeps one name,
  "Menu", with `aria-expanded` and `aria-controls`. Escape (in the list or on
  the button) closes it and returns focus to the button. Following a link
  closes it. Growing past the breakpoint closes it and moves focus into the
  bar. No items: no menu button.
- Sticky: `scroll-padding-block-start` on `:root` is one row of the bar plus
  its border at the `:root` density (WCAG 2.4.11). A bar that wraps, or a
  denser nested Theme, covers more; the manifest says so. The open phone
  list scrolls inside a sticky bar, capped at `dialog.height-max`.
- Phones: the bar stays on one row; the actions shrink to an ellipsis and a
  long brand wraps between words.
- Motion `menu-scale`: the viewport scales from 0.97 and fades; the
  indicator slides under the open trigger. None under reduced motion.
- `contract.skipAxeRules: ["aria-hidden-focus"]`: while a panel is open,
  Radix renders an aria-hidden focus proxy span (tabindex 0) that forwards
  Tab into the viewport. Only the long-arabic case (open at first render, so
  the Escape hint can test closing) shows it.
- Radix item values are indexes, never labels: Radix builds element ids from
  them and a label with a space made an invalid id.

## Review findings

One fresh eyes review per component (ds-qa, claude-opus-5-5 at medium).

Sidebar, 2 blockers and 12 notes. Fixed: a SidebarHeader nested in another
component made a second header (now it registers through context); Arabic
group headings and counts stayed at font.size.xs (now one step up); the
toggle announced its state twice (aria-expanded dropped); groups remounted
on collapse and lost focus (the Collapsible stays mounted); no auxclick guard
on disabled items; count 0 drew "0"; group, list and label selectors are
anchored with child combinators; radius from `radius.field` instead of the
menu's token; the edge is two private border properties; native role fixed
in the manifest; the empty case removed; a fragment Arabic word replaced.
Left open: item selectors are still descendant selectors under the root (a
nested component in the header with an `item` part would match); `z.sidebar`
inside the isolated root (see token gaps); no dev warning for an item without
`start` in a collapsible sidebar.

Rail, 3 blockers and 12 notes. Fixed: md was 44px against anatomy rule 12
(now 32px, touch sizes from the platform axis); Latin labels in RTL lost
their first letters (`dir="auto"`); a disabled `asChild` item still ran the
router child's click (the plain anchor renders; the same fix in Sidebar);
the badge sits on the icon; the width is based on `shell.rail-width`; thin
scrollbar; Arabic badge words and a distinct Arabic landmark name;
`start`/`end` of null render nothing; `end` is a second list; missing tokens
listed; the `a11y.native` block dropped; more tests. Left open: `badge={true}`
without `badgeLabel` is not a type error (a mistake entry covers it); no
motion pattern named (see Rail decisions).

Navbar, 1 blocker and 18 notes. Fixed: a sticky bar with the phone list open
could not scroll (the list now scrolls inside); scroll padding adds the
border and the manifest no longer says "never hidden"; the bar wrapped at
320px with lg (one row now); links in the phone list close it; one stable
menu button name; Escape on the button closes the list; focus moves into the
bar on resize; keys by index; one column for a single panel link; state
rules swap properties only; the chevron is a navbar part; `slots.mobile`
removed; `horizontal` listed; empty and sticky demo cases; four more tests.
Left open: the viewport always sits at the inline start of the bar, not under
its trigger; the `48rem` media query in `Navbar.tsx` is a literal with a
comment (no shared breakpoint constant exists); the phone list is a nested
`nav` named "Site menu" until Drawer replaces it; landmark names under the
prop `label` (see changes needed).

## Token gaps

- No `sidebar.*`, `rail.*` or `navbar.*` component tokens. Private
  properties default to semantic and shell tokens (`shell.sidebar-width-min`,
  `shell.rail-width`, `shell.topbar-height`).
- No small raised z token for a sticky header inside an isolated sidebar:
  Sidebar uses `z.sidebar` inside its own `isolation: isolate` root, so the
  number never leaves it. A `z.raised` (1) would say it better.
- No `scale.menu-enter`: Navbar uses `scale.press` (0.97), as DropdownMenu
  does.
- No viewport height token: the open phone list of a sticky Navbar is capped
  at `dialog.height-max` (80dvh). A `size.viewport-block` (100dvh) would let
  it be `100dvh` minus the bar.
- No shared breakpoint constant for TypeScript: `Navbar.tsx` closes the phone
  list on `(min-width: 48rem)` with a `breakpoint.tablet` comment.

## Changes needed from the lead

1. `packages/css/src/components/Button.css`: add a private
   `--_button-justify` (default `center`) used by `justify-content`, and a
   `--_button-label-align` used by the `[data-wrap] > [data-part='label']`
   rule (default `center`). Sidebar's group trigger now sets
   `justify-content: space-between` directly and overrides the label's
   `text-align` (`Sidebar.css`, the group trigger block), which reaches into
   Button's own declarations. With the two properties it would set
   `--_button-justify: space-between` and `--_button-label-align: start`
   instead.
2. Same file: Button's font weight is a direct declaration. A
   `--_button-font-weight` (default `var(--ds-font-weight-bold)`) would let
   Navbar's trigger match the link weight through a property; today
   `Navbar.css` sets `font-weight` on the trigger directly.
3. `DECISIONS.md` (optional): record that the Rail's 44px target comes from
   the platform axis, not from `md`.
4. `DECISIONS.md` or `anatomy.md` rule 7: Sidebar, Rail and Navbar take a
   required `label` that names the `nav` landmark and is never drawn. Rule 7
   says `label` is visible text except on icon only components. Either add a
   written exception for landmark names or rename the prop to a required
   `aria-label` across the navigation family.
5. When Tooltip (1.6.6) lands: wrap each `SidebarItem` of a collapsed
   sidebar and each `RailItem` of a rail with `hideLabels` in a Tooltip with
   its label. The places are marked with a `Tooltip (1.6.6)` comment in
   `Sidebar.tsx` and `Rail.tsx`.
6. When Drawer (1.6.3) lands: replace Navbar's `mobile` disclosure panel with
   a Drawer root carrying `data-part="mobile"` (marked in the header comment
   of `Navbar.tsx`).
7. Generated files were refreshed with `npm run gen` and committed as
   generated (barrels, `packages/css/src/index.css`, `routes.gen.ts`,
   `manifests.gen.json`). `packages/styles/desk/index.css` picked up an
   import of `recipes/DropdownMenu.css` that the last gen on the lead's
   branch had missed. Regenerate on merge.

## What I could not do

- Read GoBanana: adding the private repo was refused in this session.
- Tooltip on collapsed Sidebar items and on Rail items with hidden labels:
  Tooltip is another lane's order (places marked).
- Navbar's `mobile` as a Drawer root: Drawer is not built (place marked).
- A Desk menu bar recipe for Navbar (`packages/styles/desk/recipes/Navbar.css`):
  it needs the GoBanana menu bar CSS, which I could not read.
