# Lane 7A report: app navigation

Branch `claude/ds-lane-7a`. Orders 1.7.2 Sidebar, 1.7.3 Rail, 1.7.1 Navbar,
built in that order. All three are React `ready`, Angular `planned`.

| Order | Component | Commit | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.7.2 | Sidebar | `wo-1.7.2: sidebar`, then review fixes | green | 21 passed, 0 failed, 10 skipped |
| 1.7.3 | Rail | `wo-1.7.3: rail`, then review fixes | green | 21 passed, 0 failed, 0 skipped |
| 1.7.1 | Navbar | `wo-1.7.1: navbar` | green | 21 passed, 0 failed, 10 skipped |

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

See the section below, filled after its review.

## Token gaps

- No `sidebar.*`, `rail.*` or `navbar.*` component tokens. Private
  properties default to semantic and shell tokens (`shell.sidebar-width-min`,
  `shell.rail-width`, `shell.topbar-height`).
- No small raised z token for a sticky header inside an isolated sidebar:
  Sidebar uses `z.sidebar` inside its own `isolation: isolate` root, so the
  number never leaves it. A `z.raised` (1) would say it better.
- No `scale.menu-enter`: Navbar uses `scale.press` (0.97), as DropdownMenu
  does.

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
4. When Tooltip (1.6.6) lands: wrap each `SidebarItem` of a collapsed
   sidebar and each `RailItem` of a rail with `hideLabels` in a Tooltip with
   its label. The places are marked with a `Tooltip (1.6.6)` comment in
   `Sidebar.tsx` and `Rail.tsx`.
5. When Drawer (1.6.3) lands: replace Navbar's `mobile` disclosure panel with
   a Drawer root carrying `data-part="mobile"` (marked in the header comment
   of `Navbar.tsx`).
6. Generated files were refreshed with `npm run gen` and committed as
   generated (barrels, `packages/css/src/index.css`, `routes.gen.ts`,
   `manifests.gen.json`). `packages/styles/desk/index.css` picked up an
   import of `recipes/DropdownMenu.css` that the last gen on the lead's
   branch had missed. Regenerate on merge.
