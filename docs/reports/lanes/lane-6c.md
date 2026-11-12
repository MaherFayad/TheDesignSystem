# Lane 6C report: Menus (ContextMenu, Menubar)

Branch `claude/ds-lane-6c`, from `claude/relaxed-hypatia-7gseap`.

| Order | Component | Status | Commits |
| --- | --- | --- | --- |
| 1.6.9 | ContextMenu | done | `wo-1.6.9: ContextMenu`, `wo-1.6.9: ContextMenu review fixes` |
| 1.6.10 | Menubar | done | `wo-1.6.10: Menubar`, `wo-1.6.10: Menubar review fixes` |

Proof, at the last commit: `npm run check` green;
`npm run contract -- --framework react --component ContextMenu,Menubar,DropdownMenu`
green (ContextMenu 31 passed; DropdownMenu 31 passed, unchanged; Menubar 21
passed, 10 skipped, see "Menubar and the contract suite"). DropdownMenu unit
tests (17) pass unchanged.

## Shared change: `DropdownMenu/menuShared.tsx`

The helpers the three menus share moved out of `DropdownMenu.tsx` into
`packages/react/src/components/DropdownMenu/menuShared.tsx`: `useMenuLayer`,
`ItemContent`, `IndicatorGlyph`, `physicalSide`, `assignRef`, `textOf`,
`VIEWPORT_GUTTER`, `TRIGGER_GAP`, `ITEM_SELECTOR`, and the `MenuSide` type.
`DropdownMenu.tsx` imports them; its exported names, props and DOM are
unchanged (`DropdownMenuSide` is now an alias of `MenuSide`, the same union).

They are not re-exported from `DropdownMenu/index.ts` on purpose: they are
internals, and the package barrel re-exports every component `index.ts`.
ContextMenu and Menubar import the file by path, as DropdownMenu already
imports `../Window/useControllable`.

`useMenuLayer(open, kind = '')` gained one argument: the value of
`data-menu-layer`. DropdownMenu and ContextMenu pass nothing (the attribute
stays empty); Menubar passes `menubar`.

## Blocks added to `DropdownMenu.css`

1. `[data-ds='context-menu']`: maps `--radix-context-menu-content-*` to
   `--_menu-available-width`, `--_menu-available-height`, `--_menu-origin`.
   Content and SubContent of Radix ContextMenu both set those names.
2. `[data-menu-layer='menubar'] [data-ds='dropdown-menu']`: maps
   `--radix-menubar-content-*` the same way. A Menubar menu is a
   dropdown-menu root, so it cannot be told apart by `data-ds`; the layer
   is the hook, and it covers submenus too. (Written in the ContextMenu
   commit, ahead of 1.6.10, together with the `kind` argument.)
3. Header comment: the two new roots in the anatomy list.

No existing rule was changed.

## 1.6.9 ContextMenu

Radix ContextMenu; the DropdownMenu surface and parts on a
`data-ds="context-menu"` root (the shared `:is()` list already covered it).
Files: `packages/react/src/components/ContextMenu/` (ContextMenu.tsx, test,
demo, index.ts), `packages/manifest/src/component/ContextMenu.manifest.json`,
shots in `docs/reports/shots/wave-1/context-menu/`.

```tsx
<ContextMenu size?="sm" | "md" onOpenChange? modal?={false}>
  <ContextMenuTrigger disabled?>            // asChild: the item itself, must take focus
    <div tabIndex={0} role="group" aria-label="Q3 roadmap">...</div>
  </ContextMenuTrigger>
  <ContextMenuContent collisionPadding?={8}>
    <ContextMenuLabel />
    <ContextMenuItem start? end? shortcut? tone?="neutral" | "danger" disabled? onSelect? textValue? />
    <ContextMenuCheckboxItem checked? onCheckedChange? start? end? shortcut? />
    <ContextMenuRadioGroup value? onValueChange?>
      <ContextMenuRadioItem value />
    </ContextMenuRadioGroup>
    <ContextMenuGroup />
    <ContextMenuSeparator />
    <ContextMenuSub open? defaultOpen? onOpenChange?>
      <ContextMenuSubTrigger start? />
      <ContextMenuSubContent />
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>
```

Decisions:

- **Keyboard path.** Radix opens only on the `contextmenu` event, which
  browsers send for Shift+F10 and the Menu key inconsistently and never
  anchor to the focused item. The trigger handles both keys: it prevents
  the default and sends one `contextmenu` event from the focused element at
  its inline start and block end corner. Focus goes to the first item.
- **Opens toward the inline end** of the pointer: `side` is `right` in LTR,
  `left` in RTL (Radix hard codes `right`).
- **No controlled `open`, no `side` or `align`.** The menu opens at the
  pointer; a menu opened by code has no place. `onOpenChange` is kept.
- **`modal` defaults to false**, as DropdownMenu (Radix defaults true), for
  the same axe reason written in the DropdownMenu manifest.
- **No `ContextMenu.css`.** Anatomy rule 10: built on the DropdownMenu
  surface and styled in its file; nothing differs, so no thin file. The
  Desk recipe `DropdownMenu.css` already selects `context-menu`.
- **Portal events.** React bubbles events through portals, so a right click
  or Shift+F10 inside an open DropdownMenu on the item reached the trigger.
  The trigger now ignores events whose target is outside its own DOM (a
  prevented `contextmenu` makes Radix skip it; the long press likewise).
- **Demo.** Every tile carries a DropdownMenu (a More actions IconButton)
  rendered from the same menu body as its context menu, so every action is
  reachable without a right click, with the same words in the same order
  (a unit test compares the labels). The "Show menu" buttons focus a tile and
  send Shift+F10: a plain click stands in for the right click, so the
  gallery and the contract suite can open the menu.
- **Contract keys:** Shift+F10 and ContextMenu are checked with
  `contract.keys` hints on a focused tile (`focus-moves`).

Review (one round, fresh ds-qa subagent):

- Fixed, blocker: the tiles' DropdownMenus did not match their context
  menus. Each case now writes its menu once and renders it in both.
- Fixed, blocker: the manifest claims about the demo, true after the fix.
- Fixed, blocker: portal event bubbling opened a context menu over the
  dropdown.
- Fixed, notes: test now compares labels; Arabic copy "إضافة للمفضلة" and
  "مشترك مع كل فريق التصميم"; "Arrange" is now "Arrange frame".
- Open, note: on Windows, Chrome may send the native `contextmenu` for the
  Menu key on keyup, after the keydown we prevent. Not testable here
  (headless Linux). If it shows, the menu re-anchors at the same item or
  the browser menu shows; the fix is to swallow the next native
  `contextmenu` after a key open. Needs a Windows check.
- Left, note: the menubar block landed with 1.6.9, ahead of its order.
- Answered, note: `packages/css/src/index.css`, `packages/styles/desk/index.css`
  and `manifests.gen.json` changed more than this lane's files (ButtonGroup,
  Link, DropdownMenu imports). That is `npm run gen` catching up with the
  lead branch, where these generated files were stale; nothing was edited
  by hand.

## 1.6.10 Menubar

Radix Menubar. Files: `packages/react/src/components/Menubar/`,
`packages/css/src/components/Menubar.css`,
`packages/styles/desk/recipes/Menubar.css`,
`packages/manifest/src/component/Menubar.manifest.json`, shots in
`docs/reports/shots/wave-1/menubar/`.

```tsx
<Menubar aria-label="Application menu" size?="sm" | "md" value? defaultValue?="" onValueChange? loop?={true} className? style?>
  // className and style go to the root; every other prop (aria-label included) to the bar
  <MenubarMenu value?>                       // renders no element
    <MenubarTrigger disabled?>File</MenubarTrigger>
    <MenubarContent side?="block-end" align?="start" sideOffset?={4} collisionPadding?={8}>
      <MenubarLabel /> <MenubarItem start? end? shortcut? tone? disabled? onSelect? />
      <MenubarCheckboxItem /> <MenubarRadioGroup><MenubarRadioItem /></MenubarRadioGroup>
      <MenubarGroup /> <MenubarSeparator />
      <MenubarSub><MenubarSubTrigger /><MenubarSubContent /></MenubarSub>
    </MenubarContent>
  </MenubarMenu>
  <MenubarEnd><time>Thu 12 Nov 9:41</time></MenubarEnd>
</Menubar>
```

DOM: `div[data-ds=menubar][data-size]` (the row, no role) >
`div[data-part=bar][role=menubar]` > `button[data-part=trigger][role=menuitem]`
> `span[data-part=text][data-text]`; and, next to the bar,
`div[data-part=end]`. Each menu:
`div[data-ds=dropdown-menu][data-part=content]` in a
`[data-ds=theme][data-menu-layer=menubar]` layer; submenus
`data-part="sub-content"`.

Decisions:

- **Anatomy differs from the order:** root, `bar`, `trigger`, `text`,
  `content`, `end`. The `bar` part holds role menubar, so the `end` slot
  sits outside that role (role menubar may own only menu items and
  groups; text inside it is never reached in menu mode). No `menu` part: Radix `Menubar.Menu` renders no element, and a
  wrapper would add DOM for nothing. A `text` part was added (below). Item
  parts belong to the nested dropdown-menu root, per anatomy.md.
- **The trigger is not a system Button.** Radix renders the `<button>` (no
  `<button>` in this code, so `ds/button-primitive` is satisfied). A
  Button's fill, bold weight and Desk roll label are wrong for a menu title,
  and Menubar.css would have to restyle Button declarations, which the
  brief allows only through private properties.
- **Current menu by fill and weight**, not color alone: the open trigger
  takes `--_menubar-trigger-bg-open` and `--_menubar-trigger-weight-open`
  (Studio: menu weight to bold; Desk: regular to semibold). The `text` part
  lays out a hidden copy of the title at the open weight (`::after`,
  `content: attr(data-text) / ''` so it is never read), so the row never
  shifts. A title passed as a node gets no reservation.
- **Row wraps** at narrow widths instead of scrolling (WCAG 1.4.10).
- **`MenubarEnd` sits outside role menubar**, as a sibling of the bar;
  Menubar pulls it out of its children. Status text only.
- **Disabled title** keeps the native `disabled` Radix Menubar sets (out of
  the arrow key order): an exception to anatomy rule 5, written in the
  manifest. Making it aria-disabled would need Radix to treat it as enabled
  for roving focus and still never open it, which its content keydown path
  does not allow.
- **Escape focuses the title at once**, instead of after the exit motion
  (Radix returns focus on unmount). Found through a flaky contract run.
- **Sizes:** md row `size.control.md`, trigger `size.control.sm`; sm row
  `size.control.sm`, trigger `size.control.xs`. Menus take the same size.
- **Desk recipe:** the blur behind `color.material.menubar`, regular and
  semibold title weights, the field radius. Solid under reduced
  transparency, more contrast, forced colors and without backdrop filter.
- **Sources.** GoBanana was not reachable from this session (adding the
  repo was denied), so `MenuBarMenu.tsx`, `MenuClock.tsx` and the
  desktop.css menu bar rules were not read. The row is designed from the
  dials table, the Desk DropdownMenu recipe (itself from GoBanana
  `.mb-menu`) and `color.material.menubar`. Worth a visual pass against
  GoBanana by the lead.

### Menubar and the contract suite

The root is a static row, while `data-state` open and closed live on the
triggers, so the manifest lists `open` and `closed` (honest), which makes
the suite treat Menubar as an overlay. No demo trigger can add a
`[data-ds=menubar]` root, so the demo has no `[data-demo-trigger]`; the
suite then skips the "target size open" and "axe open" tests (10 skips).
Coverage instead:

- an `open` demo case with `defaultValue="edit"`, so a menu is open at
  load: the static axe pass checks it in every style, scheme and direction;
- `contract.keys` hints: ArrowRight, ArrowLeft, ArrowDown on a variants
  trigger, and Escape on an item of the menu open at load (`focus-moves`).

A suite option for "the trigger opens a root of another kind" (here a
dropdown-menu) would let Menubar run the open checks; see below.

Review (one round, fresh ds-qa subagent):

- Fixed, blocker: `MenubarEnd` inside role menubar. Now a sibling of the
  `bar` part.
- Fixed, blocker: the manifest said disabled titles get aria-disabled. It
  now says native disabled and records the exception.
- Fixed, notes: typeahead works in menus, not on titles (manifest); the
  open state swaps `--_menubar-trigger-fg` instead of writing `color`; the
  `::after` copy on the text part is explained in a comment; the `-open`
  suffix is written down in the header; the end slot and titles shrink and
  wrap; "Paste here" is now "Paste selection"; the Arabic recent boards are
  in Arabic.
- Left, note: the item parts are not in the Menubar anatomy. They belong to
  the nested dropdown-menu root (anatomy.md, own parts only); the manifest
  notes say so.

## Changes needed from the lead

1. Optional, `packages/contract-tests`: let `contract.trigger` name the
   opened root kind, for example `"opens": "dropdown-menu"`, so Menubar can
   run the open target size and axe checks without an open-at-load case.
2. `STATE.md`: 1.6.9 and 1.6.10 done; lane 6D (CommandPalette, Lightbox)
   is unblocked on the lane 6C side.
3. Regenerate on merge (`npm run gen`). The generated files in this branch
   are gen output.

## What I could not do

- Read GoBanana (access denied). Figma-Killer-2 was read for ContextMenu.
- Check the Menu key on Windows Chrome (see the open note).
- Neutral style: not in this checkout (`packages/styles` has studio and
  desk only). Both components use tokens and the shared surface only, so
  Neutral applies once its pack lands.
