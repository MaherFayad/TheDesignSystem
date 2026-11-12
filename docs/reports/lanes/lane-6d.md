# Lane 6D report: CommandPalette, Lightbox, PageShell

Branch `claude/ds-lane-6d`. Three components, one commit each:
`wo-1.6.11: CommandPalette`, `wo-1.6.12: Lightbox`, `wo-1.8.12: PageShell`.
For each: unit tests, `npm run check` green, `npm run contract -- --framework react --component <Name>`
green, screenshots in `docs/reports/shots/wave-1/<slug>/` (studio dark and light,
desk dark and light, desk dark rtl ar), and one fresh eyes review by a ds-qa
subagent with its blockers fixed.

Sources: GoBanana was not reachable from this session (no `add_repo` for it
was attempted, by the brief's fallback rule). The designs come from the dials
table in PLAN.md 3.7 and the nearest components here (Dialog, ListBox,
Combobox, Drawer, Sidebar, SkipLink). Manifests and file headers say so.

## 1.6.11 CommandPalette

Files: `packages/react/src/components/CommandPalette/` (`CommandPalette.tsx`,
`matchShortcut.ts`, demo, test, index), `packages/css/src/components/CommandPalette.css`,
`packages/styles/desk/recipes/CommandPalette.css`, the manifest.

```tsx
<CommandPalette
  items={CommandPaletteItem[]}      // { value, label, description?, start?, shortcut?, keywords?, disabled?, onRun? } or { label, commands, key? }
  onRun?={(value, command) => void}
  recent?={string[]}                 // values, newest first; first group while the query is empty
  recentLabel?="Recent"
  size?="md" | "lg"                  // 520 or 640 px; rows 32 or 44 px
  shortcut?="Mod+K" | null           // opens and closes from anywhere
  label?="Command palette"  closeLabel?  placeholder?="Search commands"
  query? defaultQuery? onQueryChange?
  loading? loadingLabel? empty? formatCount? footer? closeOnRun?=true
  open? defaultOpen? onOpenChange?
  className? style? rootProps?
>
  <CommandPaletteTrigger><Button start="search">Search commands</Button></CommandPaletteTrigger>
</CommandPalette>
```

Anatomy: root, backdrop, panel, title (visually hidden), search (SearchField
root), close (IconButton), list, group, group-label, item, item-icon,
item-label, item-description, shortcut (Kbd root), empty, status, footer, hint.

Decisions:

- **The list is a hand built `role="listbox"`, not a ListBox root.** By the
  part ownership rule, options inside a ListBox root are ListBox parts, so
  the order's `item`, `group` and `shortcut` could not belong to the palette,
  and ListBox has no slot at the end of an option for a shortcut. The palette
  uses the same logic: `filterListBoxItems` (Arabic folding through
  `filter.ts`), `listBoxOptionId`, `nextEnabledIndex`, `edgeEnabledIndex`, and
  the same row tokens. See "Changes needed" for the way back to ListBox.
- Focus stays in the search input, a combobox with `aria-activedescendant`, as
  in Combobox. Rows never take focus; a click on a row runs it without moving
  focus.
- Escape clears the query (SearchField's own capture listener), and a second
  Escape closes.
- Mod+K toggles. Letters match by physical key (`event.code`) too, so Control
  K works on an Arabic layout. `matchShortcut` is private to the folder; it
  could move to `packages/shared/shortcut.ts` (see below).
- A command runs **after** the palette has closed and focus has returned (in
  the Radix close focus event), so a command may move focus. When the shortcut
  opened the palette, focus returns to the element that had it, not to a
  trigger elsewhere on the page.
- A close IconButton sits at the end of the search band. It is the touch way
  out, and it gives Tab a second stop (the contract's Tab check needs focus to
  move; with an empty query the input is otherwise the only tab stop).
- The panel sits high on the screen (`space.10xl` from the top), not centered,
  so it does not jump while the list grows and shrinks.
- z-index `z.dialog`, not `z.spotlight` (9000, under dialogs): a palette
  opened over a dialog must sit above it.
- Desk recipe: strong glass window, the yellow primary fill on the lit row, the
  window grow timing.
- Motion `dialog`, with its own keyframes (`ds-command-palette-in` and `-out`)
  on its own private properties. The backdrop reuses `ds-dialog-fade-in` and
  `-out` from Dialog.css.

## 1.6.12 Lightbox

Files: `packages/react/src/components/Lightbox/` (`Lightbox.tsx`, demo, test,
index), `packages/css/src/components/Lightbox.css`, the manifest.

```tsx
<Lightbox
  images={LightboxImage[]}           // { src, alt (required), caption?, srcSet?, sizes?, width?, height?, key? }
  index? defaultIndex?=0 onIndexChange?
  loop?=false
  label?="Image viewer"  closeLabel? previousLabel? nextLabel? zoomInLabel? zoomOutLabel? errorLabel?
  formatCounter?={(n, total) => string}   // "3 of 12"
  formatStatus?={(n, total, alt) => string} // "Image 3 of 12: alt"
  open? defaultOpen? onOpenChange?
  className? style? rootProps?
>
  <LightboxTrigger index={2}><Button start="image">View photo 3</Button></LightboxTrigger>
</Lightbox>
```

Anatomy: root, backdrop, panel, title (visually hidden), toolbar, counter,
zoom, close, stage, image, spinner (Spinner root), error, previous, next,
caption, status. States: `data-zoomed`, `data-loading`, `data-error`.

Decisions:

- Full screen on the scheme's solid page color (`color.bg.body`): light in
  light schemes, dark in dark. Images never sit on glass, in any style. No
  style recipe.
- Zoom is one step: twice the fitted width, measured when zooming and set
  inline on the image as `--_lightbox-image-inline-size`; the stage scrolls.
  While zoomed the arrows pan; `+`/`=` and `-`/`_` zoom; a double click
  toggles.
- Arrows follow the reading order (ArrowLeft is next in Arabic); Home and
  End go to the edges. A swipe (48 px, pointer capture) moves in reading
  order; the buttons and the arrows are its key path.
- The visible counter is `aria-hidden`; a polite status says "Image 3 of 12:
  alt" once per image.
- Focus opens on Next when there is a next image, else on Close; it returns to
  the trigger that opened the viewer.
- Development builds warn when an image has no alt text.
- The neighbours of the image on show load ahead, across the wrap with `loop`.
- No `loading`, `disabled` or `readonly` demo case: loading is per image and
  short lived (covered by the unit tests); the empty case shows a disabled
  trigger with a reason.

## 1.8.12 PageShell

Files: `packages/react/src/components/PageShell/` (`PageShell.tsx`, demo,
test, index), `packages/css/src/components/PageShell.css`, the manifest.

```tsx
<PageShell
  header?={node} nav?={<Sidebar/> | <Rail/>} aside?={node} asideLabel?="More on this page" footer?={node}
  mainId?="main" skipLabel?
  sidebar?="expanded" | "collapsed" | "hidden"  defaultSidebar?="expanded"  onSidebarChange?
  menuLabel?="Open navigation" drawerTitle?="Navigation"
  embedded?=false
>
  main content
</PageShell>

const { sidebar, wideSidebar, setSidebar, narrow, setDrawerOpen } = usePageShell();
```

Anatomy: root, skip (SkipLink root), header, menu (IconButton), nav, main,
aside, footer. State: `data-sidebar` (`expanded`, `collapsed`, `hidden`).

Decisions:

- The `nav` part is a plain element: Sidebar and Rail are each a labelled nav
  landmark already. A second `nav` around them would read twice.
- `hidden` means the column is not drawn: always under `breakpoint.tablet`
  (the order's "becomes a Drawer"), and on wide screens when the app hides it.
  The menu IconButton then opens the same nav in a Drawer from the inline
  start. The column is not rendered while hidden, so its links are never in
  the page twice. A media query hides the column and shows the menu from the
  first paint, before hydration.
- The menu button is a plain IconButton with `aria-expanded`, not a
  DrawerTrigger: the Radix trigger stamps `data-state` on the part, which the
  shell has no state for. Focus still returns to it (DialogBase).
- The app keeps one state for the column: `usePageShell()` plus
  `collapsed={sidebar === 'collapsed'}` on the Sidebar.
- `embedded` draws the frame without landmarks (main becomes a named region).
  The gallery wraps every demo in a `main`, so a real PageShell there would
  nest landmarks; previews in docs need the same.
- Under `breakpoint.desktop` the aside goes under main; under
  `breakpoint.tablet` everything is one column.
- Motion `none`; the Drawer brings its own.

## Token gaps

- No viewport height token. PageShell uses `min-block-size: 100%` (the app
  sets html and body heights). A `size.viewport.full` (100dvh with a 100vh
  fallback) would let the shell fill the screen and the nav column stick with
  its own scroll. Navbar and TableOfContents note the same gap.
- No inspector or aside width token. PageShell uses `dialog.width.sm` (360
  px). A `layout.aside.width` would be clearer.
- No command palette offset token. The palette uses `space.10xl` from the top.

## Review findings

CommandPalette, fixed: group label ids built from labels with spaces (broken
`aria-labelledby`); focus return after a Mod+K open went to the trigger instead
of the element that had focus; the lit row's icon and description in forced
colors; the loading label read twice; the highlight reset when items loaded
later; a pending command could run on an unrelated close; the input shared
the dialog's name; a physical `overflow-x`; the Arabic variant not in an RTL
theme; a bare noun label; a retry button that did nothing; weak tests (group
names, Arabic folding, once per query, focus return). Also fixed before the
review: the panel animation read Dialog's private properties.

Lightbox, fixed: the measured zoom width never reached the image; `+` doubled
the zoom on every press; state selectors writing `opacity` and `touch-action`
directly (now private properties); the cursor on a failed image (`data-error`);
the image fade that ran while it was still loading (removed); no pointer
capture on swipe; `scrollIntoView` moving the page behind; neighbours across
the wrap not preloaded; focus opening on a disabled Next; a stale trigger
after a programmatic open; manifest keys and style entries.

PageShell, fixed (in the commit after `wo-1.8.12`, which went out with an
unused import that failed eslint): the unused `DrawerTrigger` import; the
Arabic demo row not in an RTL theme; an empty banner when there is a nav and
no header; the Drawer staying open after a link in it is followed; the skip
link English under `ar-SA` (the shell now passes its own word); the private
name `divider-color` renamed `border-color`; the too many demo Sidebar not
wired to `usePageShell`; demo captions; tests for no duplicate links while
the Drawer is open and for the empty banner; the Tab order in the manifest.

Left open (notes):

- CommandPalette: `MarkedLabel` is a copy of the one in `ListBox.tsx`
  (see "Changes needed").
- Both overlays cast their kind: `'command-palette' as string as DialogKind`
  (see "Changes needed").
- PageShell: the aside width borrows `dialog.width.sm`, a component token,
  where batch 8 asks layout to use only space, size and breakpoint tokens.
  Commented in the CSS; see "Token gaps".
- PageShell: no server render test (`renderToString`). The hook reads
  `window` only in an effect, and the first paint on narrow screens comes from
  the media query.

## Changes needed from the lead

1. `packages/react/src/components/Dialog/DialogBase.tsx` line 57: widen the
   type, then drop the two casts.
   - Before: `export type DialogKind = 'dialog' | 'alert-dialog' | 'drawer' | 'sheet';`
   - After: `export type DialogKind = 'dialog' | 'alert-dialog' | 'drawer' | 'sheet' | 'command-palette' | 'lightbox';`
   - Then in `CommandPalette.tsx` and `Lightbox.tsx`:
     `kind={'command-palette' as string as DialogKind}` becomes
     `kind="command-palette"` (the same for `lightbox`), and the `DialogKind`
     import goes.
2. `packages/react/src/components/ListBox/ListBox.tsx` line 128: export
   `MarkedLabel` (`export function MarkedLabel`) and add it to the ListBox
   `index.ts`. CommandPalette can then import it and delete its copy.
3. Optional, for a later wave: an `end` slot on `ListBoxOption` (a node at
   the inline end of the row). With it, and with a palette root that owns the
   rows through ListBox, the palette could render a ListBox root as `list`.
   The order's item, group and shortcut parts would then be ListBox parts, so
   the order's anatomy would need the same change.
4. Optional: move `matchShortcut` from
   `packages/react/src/components/CommandPalette/matchShortcut.ts` to
   `packages/shared/src/shortcut.ts` (its tests are in
   `CommandPalette.test.tsx`, `describe('matchShortcut')`), so Angular and
   Tooltip can use the same matcher.
5. Tokens: see "Token gaps".

## What I could not do

- No GoBanana or Figma-Killer-2 sources (not reachable); designs come from
  the dials table and the existing components.
- Neutral was not screenshotted separately; all three components use tokens
  only, and the contract ran its axe and target size passes in every style
  pack present, Neutral included.
