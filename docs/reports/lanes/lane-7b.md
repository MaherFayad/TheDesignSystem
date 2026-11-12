# Lane 7B report: Bars (Tabs, Toolbar, TabBar, Dock)

Branch `claude/ds-lane-7b`, from `claude/relaxed-hypatia-7gseap`. Built in
order: Tabs (1.7.4), Toolbar (1.7.9), TabBar (1.7.8), Dock (1.7.12). Each
component has one build commit and one review fix commit.

State at the end of the lane:

- `npm run check` is green.
- `npm run contract -- --framework react --component Tabs,Toolbar,TabBar,Dock`
  is green: 21 passed for each. Toolbar also skips 10 "open" checks, because
  it is not an overlay.
- Screenshots are in `docs/reports/shots/wave-1/<slug>/`: studio and desk,
  dark and light, desk dark RTL, studio light RTL, studio compact, and desk
  comfortable. Extra shots: `toolbar/desk-light-more-open.png` and
  `dock/*-hover.png`.
- Each component had one fresh eyes review (claude-opus-5-5, medium). The
  findings are listed under each component below.

## Sources

The GoBanana sources were not reachable: `add_repo` for `MaherFayad/GoBanana`
was denied in this session, and `/home/user/gobanana` does not exist. So I did
not read the "Read" lines of these files:

- `ExportTabs.tsx`
- `InstallTabs.tsx`
- `Dashboard.tsx`
- `desktop.css` 1169 to 1287 and 1327 to 1542
- `Dock.tsx`
- `SiteNav.tsx`
- `desktop.css` 154 to 283

Figma-Killer-2 `Tabs/`, `RangeTabs/` and `AlignBar/` were read. Where no
source could be read, the design follows the dials table and the nearest
component, and the source comments of each file say so. The Desk look of
TabBar and Dock should be checked against GoBanana once the clone is back.

## 1.7.4 Tabs

Radix Tabs. Parts: `list`, `trigger`, `indicator`, `start`, `label`, `count`,
`panel`. Emphasis is `ghost` (an underline on the list hairline, the default)
or `soft` (a pill on a quiet track). Sizes are `sm` and `md`. Orientation is
horizontal or vertical. Activation is automatic or manual. The list scrolls
inside itself and keeps the active tab in view: it scrolls the list only,
never the page.

```tsx
<Tabs value? defaultValue size="sm|md" emphasis="ghost|soft" orientation activationMode onValueChange>
  <TabsList aria-label loop?>
    <TabsTrigger value start? count? disabled?>Label</TabsTrigger>
  </TabsList>
  <TabsPanel value forceMount?>...</TabsPanel>
</Tabs>
```

TabsProps requires `defaultValue` when `value` is not set.

Decisions:

- **The trigger is Radix's own button (role tab), not a system Button.** The
  indicator and count must be parts of Tabs. Inside a Button root, they
  would belong to Button. No `<button>` JSX is written, and the lint gate
  passes.
- **Disabled tabs use Radix's native `disabled`.** A tab is not an action,
  so it is skipped. This departs from anatomy rule 5. The lead should log
  it in DECISIONS.md.
- **The indicator sits inside the active trigger.** On a change it plays a
  FLIP from the previous trigger with the Web Animations API (translate and
  scale only). It reads `--_tabs-indicator-duration` and `-ease`, which are
  `duration.medium` and `ease.emphasized`. Under reduced motion the token is
  0ms, so nothing plays. The duration is parsed with `parseDuration` from
  `@the-system/motion`.
- **The focus ring is inset**, so a scrolling list never clips it.
- **The active tab's line and pill use the bright text color**, not the
  Desk yellow, so a tab never reads as a primary action.

Review fixes:

- Every selector now uses child combinators, so a Tabs nested in a panel
  keeps its own look.
- `data-orientation` is listed under states.
- Hovering the active tab no longer changes it.
- The vertical list is capped at 50%, and triggers are capped at 100%.
- The panel is a 24px target, because it is focusable.
- Arabic `sm` text moves one step up.
- The disabled case says why Billing is disabled.
- The long text panel copy now matches its tab.
- The manifest has Arabic panel copy.

Left open:

- The soft pill's corners squash during the FLIP. This is cosmetic.
- Triggers declare `--_tabs-trigger-*` themselves, because the state sits
  on the trigger. The CSS header explains why.

## 1.7.9 Toolbar

Radix Toolbar. The root draws a quiet `surface-2` bar. Items are system
`Button`, `IconButton` and `Link` roots (through `asChild`) that carry
`data-part="item"`. The other parts are `group`, `separator` and `more`.
Size (`xs` to `lg`) and emphasis (`ghost`, `soft`, `outline`) pass to items
that do not set their own.

```tsx
<Toolbar aria-label size="xs|sm|md|lg" emphasis="ghost|soft|outline" orientation loop overflow="menu|wrap" moreLabel?>
  <ToolbarToggleGroup type="single|multiple" aria-label value? defaultValue? onValueChange?>
    <ToolbarToggleItem value icon? label? disabled?>Label</ToolbarToggleItem>
  </ToolbarToggleGroup>
  <ToolbarSeparator />
  <ToolbarGroup aria-label>
    <ToolbarButton icon="zoom-in" label="Zoom in" />
  </ToolbarGroup>
  <ToolbarButton start="plus">Add frame</ToolbarButton>
  <ToolbarLink href>Open the guide</ToolbarLink>
</Toolbar>
```

Decisions:

- **Overflow (`overflow="menu"`, the default).**
  - The toolbar measures its top level children. It sets `data-measuring`
    for one synchronous read, and remeasures through a ResizeObserver on
    itself and its parent.
  - The children that do not fit get `data-overflowed` and are hidden. The
    root gets `data-overflowing`, and the More tools trigger (an
    IconButton, `data-part="more"`) appears.
  - The menu (the system DropdownMenu) is built from the hidden items when
    it opens. Each entry takes its name, icon, pressed state and disabled
    state from the item. Choosing an entry clicks the hidden item, so the
    item's own handler, toggle or link runs.
  - `overflow="wrap"` sets `data-wrap` and lets the row wrap instead.
- **`more` is a new anatomy part**, beyond the order's list. The overflow
  needs a trigger.
- **Disabled items** get `aria-disabled` and a cancelled click. They never
  get the system `disabled`, because ButtonBase and Link swallow every key
  while disabled, which traps the roving arrow keys.
- **Toggle items** use Radix `ToolbarToggleGroup` with `asChild` onto
  Button or IconButton, because ToggleButton and ToggleGroup are not built
  yet. The on state draws `overlay-20` plus a `text-muted` border, for 3:1
  (WCAG 1.4.11). In forced colors it is a Highlight frame.
- **Vertical toolbars:** ArrowUp and ArrowDown on the More trigger move focus
  instead of opening the menu.
- **Focus fallback:** if the focused item moves into the menu, focus goes to
  the More trigger.

Review fixes: all four blockers, which were:

- a disabled item trapped the arrow keys;
- `disabled` on a toggle group gave items with no `aria-disabled`;
- the vertical arrows opened the menu;
- the on state was faint.

Also fixed from the notes: the focus fallback, the `title` on separators,
measuring only on change, `data-wrap`, the native note, and the demo icon.

Left open:

- Items of a single group appear in the More menu as checkbox items, not
  radio items.
- A disabled item still shows the hover fill. Button draws hover only from
  its own `data-disabled`.
- The Toolbar CSS sets Button's private properties for the on state. This
  should move into ToggleButton.

## 1.7.8 TabBar

A hand built `nav` of links. Parts: `item`, `item-icon`, `item-label`,
`item-badge`, `item-status` (the badge words, visually hidden). Sizes are
`md` and `lg`. At `lg`, items are at least
`max(size.control.lg, size.touch-ios)`.

The current item is marked by `aria-current`, a bolder label and a pill
behind its icon. The bar pads the safe area: the block end inset, and the
larger of the two side insets on both sides. Arabic labels move one step
up.

```tsx
<TabBar aria-label size="md|lg">
  <TabBarItem href icon label active? badge?={number|true} badgeLabel? asChild?>{routerLink?}</TabBarItem>
</TabBar>
```

Decisions:

- The badge words join the link name: "Inbox, 3 new". A dot badge says
  "New".
- The badge text is `dir="ltr"`, so "99+" does not flip.
- Positioning (fixed or not) is left to the layout.

Review fixes:

- Arabic text moves one step up.
- The side insets are symmetric in RTL.
- `lg` targets stay at 44px or more in compact density.
- The icon size comes from the bar through context, not a CSS override.
- The weights are declared on the root.
- The demo cases changed: `too-many` is now five long Arabic labels at
  `lg` in a narrow box, and the long English case renders LTR.
- The manifest notes cover `viewport-fit=cover` and landmark naming.
- A test covers a badge of 0 and of false.

## 1.7.12 Dock

A hand built `nav` of links. Parts: `item`, `item-icon` (a system icon tile
or a node), `item-label`, `item-status`, `item-indicator` (the open dot),
`separator`. Sizes are `md` (44px tiles) and `lg`.

The base is a plain row. The Desk recipe
(`packages/styles/desk/recipes/Dock.css`) adds:

- the glass dock material and blur;
- the window radius and soft shadow;
- magnify: the tile grows 1.25 times and lifts, and its neighbors grow 1.1
  times.

The glass turns solid under reduced transparency and more contrast.
Magnify is off under reduced motion.

```tsx
<Dock aria-label size="md|lg">
  <DockItem href icon="folder" | icon={<img alt="" />} label active? open? openLabel? asChild?>{routerLink?}</DockItem>
  <DockSeparator />
</Dock>
```

Decisions:

- **Every item is a link.** The order allows buttons, but a system Button
  would own the item's parts. An app that opens a window keeps an href and
  handles onClick.
- **The name is the link text.** At rest it has zero width and opacity 0,
  so it is still read and never causes sideways scroll. It is drawn on hover
  and focus, capped at `tooltip.width-max`. Escape hides it until focus or
  the pointer leaves (WCAG 1.4.13).
- **md tiles are 44px**, against anatomy rule 12 (md is 32px), for WCAG
  2.5.8. The lead should log this.
- **`motion: fade-rise`** uses only the fade.

Review fixes:

- The neighbor magnify now runs through `--_dock-neighbor-scale`, so it is
  off under reduced motion.
- Escape dismisses the name.
- A `many` case shows a page that reserves the dock's room (padding and
  scroll padding).
- Reduced motion collapses the transform values on the root.
- Focus is distinct from the active frame in forced colors.
- Long names wrap within `tooltip.width-max`.
- Hover rules apply only under `@media (hover: hover)`.

Left open:

- A label on the first or last tile at a viewport edge can extend past the
  edge while it is shown.

## Changes needed from the lead

1. **ButtonBase.** `packages/react/src/components/Button/ButtonBase.tsx`,
   lines 145 to 147, `onKeyDown` while inert:
   - Before: `if (!inert) onKeyDown?.(event);`
   - After: `if (!inert || (event.key !== 'Enter' && event.key !== ' ')) onKeyDown?.(event);`
   - Why: as it stands, a disabled Button inside any roving focus group
     (Toolbar, a future ToggleGroup or Menubar) traps the arrow keys.
   - Do the same in `Link.tsx` (`onKeyDown` while disabled).
   - Once this lands, Toolbar can pass the system `disabled` again and drop
     its `inertProps` helper and its aria-disabled CSS.
2. **ToggleButton and ToggleGroup** (batch 1), when merged: make
   `ToolbarToggleItem` render a ToggleButton, and move the on state styling
   from `Toolbar.css` into the ToggleButton block of `Button.css`.
3. **Tooltip** (1.6.6), when merged, add it in these places:
   - every icon only `ToolbarButton` and `ToolbarToggleItem`;
   - the More tools trigger;
   - a Tabs trigger whose label is cut by an ellipsis.

   Dock's drawn name stays a part of the link, not a Tooltip.
4. **PageShell** (1.8.12): add to Accept: "a bottom TabBar or Dock slot
   reserves its block size as `padding-block-end` and
   `scroll-padding-block-end` (WCAG 2.4.11)". The TabBar and Dock manifests
   point to it.
5. **DECISIONS.md**: log three decisions:
   - Tabs use native `disabled` on triggers;
   - Dock `md` tiles are 44px;
   - Toolbar disabled items use aria-disabled without the system `disabled`,
     until change 1 lands.
6. **demo.css**: an optional `data-demo="narrow"` helper would replace the
   inline `maxInlineSize` styles in the Toolbar, TabBar and Dock demos.
7. **Regenerate.** Generated files were regenerated with `npm run gen` and
   committed. Run it again on merge.

## Token gaps

- No `scale.magnify` token: the Dock recipe writes 1.25 and 1.1 as unitless
  numbers.
- No `dock.tile` size: `lg` is `size.control.lg * 1.25`.
- No `tab-bar.height` token for the room a layout reserves.

## Not done

- No source reads from GoBanana (see Sources).
- No `contract.keys` hint for Dock Escape: the suite does not watch part
  states. Unit tests cover it.
- No native or Angular ports. Both are `planned`, as the orders say.
