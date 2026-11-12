# Wave 1, batch 6: overlays (13)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 5 is green.

Every order also reads: `packages/react/src/components/Dialog/` (portal
theming, focus rule, Desk chrome, toasts above), `packages/shared/src/dialog-focus.ts`,
GB studio/`Dialog.tsx`, GB studio/`modalStack.ts`, GB css lines 609 to 741.
Overlays render in a portal that carries the resolved theme (as Dialog does).

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 6A Dialog base | Dialog bring up, AlertDialog, Drawer, Sheet | batch 5 green |
| 1 | 6B Floating | Popover, Tooltip, HoverCard, Tour | batch 5 green |
| 1 | 6C Menus | ContextMenu, Menubar | batch 5 green |
| 2 | 6D Dialog composites | CommandPalette, Lightbox | Dialog bring up green and lane 6C done |

Lane 6A alone may add blocks to `Dialog.css`; lane 6C alone may add blocks to
`DropdownMenu.css`. Slot 4 runs Angular A5. DropdownMenu (1.6.8) was built in
batch 1.

## 1.6.1 Dialog (bring up)

- Goal: extract the shared modal internals into `DialogBase.tsx` (as
  `ButtonBase.tsx`) so AlertDialog, Drawer, Sheet, CommandPalette and
  Lightbox reuse portal theming, the focus rule, scroll lock, Desk chrome and
  the toast layering. Render CloseButton (1.1.9) as the `close` part.
- Behavior: Radix Dialog (exists).
- Anatomy: unchanged.
- Owns: `packages/react/src/components/Dialog/`, `Dialog.css`,
  `Dialog.manifest.json`, `packages/styles/desk/recipes/Dialog.css`.
- Depends: 1.1.9, 1.0.c1.
- Accept: all Dialog tests and the contract pass unchanged; screenshots
  unchanged (`npm run shots -- --component dialog`); Angular Dialog compare
  still 0 pixels (CSS unchanged or the Angular lane told).

## 1.6.2 AlertDialog

- Goal: a modal question about an action that cannot be undone.
- Behavior: Radix AlertDialog on DialogBase.
- Anatomy: root (`data-ds="alert-dialog"`), `backdrop`, `panel`, `icon`,
  `title`, `description`, `footer`, `cancel`, `action`. No close part.
- Axes: size (`sm`, `md`), tone (`neutral`, `danger`).
- States: `data-state` (`open`, `closed`).
- Keys: focus opens on Cancel; Escape cancels; Tab is trapped; no backdrop
  click to close.
- Read: GB studio/`Dialog.tsx` (danger tone), GB `DeleteAccount.tsx` (path in
  batch 4, 1.4.6).
- Owns: standard set for AlertDialog, plus an `alert-dialog` block in
  `Dialog.css` (lane 6A only).
- Depends: 1.6.1 (same lane).
- Accept: checklist; the action names the consequence ("Delete board");
  `insteadUse` points undoable actions to a Toast with an undo action.

## 1.6.3 Drawer

- Goal: a side panel over the page for a secondary task (filters, details).
- Behavior: Radix Dialog on DialogBase, `side` `start` or `end`; modal by
  default, `modal={false}` allowed.
- Anatomy: root (`data-ds="drawer"`), `backdrop`, `panel`, `header`,
  `title`, `description`, `body`, `footer`, `close`.
- Axes: size (`sm`, `md`, `lg`, `xl` as widths).
- States: `data-state`, `data-side` (`start`, `end`).
- Keys: as Dialog; Escape closes.
- Read: no source: design from the dials table and the nearest existing
  component (Dialog).
- Owns: standard set for Drawer, plus a `drawer` block in `Dialog.css`.
- Depends: 1.6.2 (same lane).
- Accept: checklist; `sheet` motion from the side, mirrored in RTL (start is
  right in Arabic); full width under `breakpoint.phone`.

## 1.6.4 Sheet

- Goal: a panel from the block end (bottom) for phone layouts and quick
  tasks.
- Behavior: Radix Dialog on DialogBase; a drag handle with a close button
  path (detents are wave 2).
- Anatomy: root (`data-ds="sheet"`), `backdrop`, `panel`, `handle`,
  `header`, `title`, `body`, `footer`, `close`.
- Axes: size (`sm`, `md`, `lg` as heights).
- States: `data-state`, `data-dragging`.
- Keys: as Dialog; the drag to dismiss has the close button and Escape as
  its key path (WCAG 2.5.7).
- Read: no source: design from the dials table and the nearest existing
  component (Dialog). `radius.sheet`, `spring.sheet`.
- Owns: standard set for Sheet, plus a `sheet` block in `Dialog.css`.
- Depends: 1.6.3 (same lane).
- Accept: checklist; respects `env(safe-area-inset-bottom)`; `sheet` motion;
  `insteadUse` points desktop side panels to Drawer.

## 1.6.5 Popover

- Goal: non modal content anchored to a trigger (a small form, details).
- Behavior: Radix Popover.
- Anatomy: root (`data-ds="popover"`, the content), `arrow`, `title`,
  `body`, `footer`, `close`.
- Axes: size (`sm`, `md`, `lg`).
- States: `data-state`, `data-side`, `data-align`.
- Keys: trigger Enter and Space open; focus moves into the content; Escape
  closes and returns focus.
- Read: GB desktop/`desktop.css` popover rules, GB css `.st-menu` (surface).
- Owns: standard set for Popover.
- Depends: none.
- Accept: checklist; `menu-scale` from the trigger side; flips sides in RTL.

## 1.6.6 Tooltip

- Goal: a short hint for a control on hover and focus. The only way to show a
  hint (no native `title`).
- Behavior: Radix Tooltip, one provider in Theme or a `TooltipProvider`.
- Anatomy: root (`data-ds="tooltip"`, the content), `arrow`, `shortcut`
  (a Kbd root once 1.9.5 exists; text before).
- Axes: none beyond `data-side`.
- States: `data-state` (`delayed-open`, `instant-open`, `closed`),
  `data-side`.
- Keys: shows on focus; Escape hides without moving focus.
- Read: GB studio/`Tooltip.tsx`, GB css lines 530 to 607, FK2 `Tooltip/` (all
  files).
- Owns: standard set for Tooltip.
- Depends: 1.6.5 (same lane).
- Accept: checklist; hoverable and dismissable (WCAG 1.4.13); never holds the
  only name of a control; report the exact change for IconButton to show its
  label in a Tooltip by default.

## 1.6.7 HoverCard

- Goal: a preview card for a link or a user on hover and focus.
- Behavior: Radix HoverCard.
- Anatomy: root (`data-ds="hover-card"`), `arrow`, `body`.
- Axes: size (`sm`, `md`).
- States: `data-state`, `data-side`.
- Keys: shows on focus of the trigger; Escape hides. Content is never the
  only way to reach its links.
- Read: no source: design from the dials table and the nearest existing
  component (Popover).
- Owns: standard set for HoverCard.
- Depends: 1.6.6 (same lane).
- Accept: checklist; `insteadUse` points interactive content to Popover.

## 1.6.9 ContextMenu

- Goal: the actions of an item on right click or long press.
- Behavior: Radix ContextMenu, items styled by `DropdownMenu.css`.
- Anatomy: as DropdownMenu with root `data-ds="context-menu"`.
- Axes: as DropdownMenu.
- States: as DropdownMenu.
- Keys: Shift+F10 and the Menu key open it on the focused item; then as
  DropdownMenu.
- Read: FK2 `ContextMenu/` (all files), GB css lines 402 to 528.
- Owns: standard set for ContextMenu, plus a `context-menu` block in
  `DropdownMenu.css` (lane 6C only).
- Depends: 1.6.8.
- Accept: checklist; every action is also reachable without the context menu
  (a DropdownMenu on the item), stated in `avoidWhen` and the demo.

## 1.6.10 Menubar

- Goal: the application menu row (File, Edit, View), Desk's menu bar.
- Behavior: Radix Menubar.
- Anatomy: root (`data-ds="menubar"`), `menu`, `trigger`, `content` (styled by
  `DropdownMenu.css`), `item` and the DropdownMenu item parts, `end`
  (clock slot).
- Axes: size (`sm`, `md`).
- States: triggers `data-state`, `data-highlighted`.
- Keys: ArrowLeft and ArrowRight move between menus (reading direction);
  ArrowDown opens; Escape closes; typeahead.
- Read: GB desktop/`MenuBarMenu.tsx`, GB desktop/`desktop.css` lines 154 to
  400, GB desktop/`MenuClock.tsx`.
- Owns: standard set for Menubar, plus a `menubar` block in
  `DropdownMenu.css` (lane 6C only), `packages/styles/desk/recipes/Menubar.css`.
- Depends: 1.6.9 (same lane).
- Accept: checklist; the current menu is shown by weight and fill, not color
  alone; Desk uses `color.material.menubar`.

## 1.6.11 CommandPalette

- Goal: search and run commands from anywhere (Ctrl+K or Cmd+K).
- Behavior: DialogBase plus ListBox (1.3.11) with `filter.ts`.
- Anatomy: root (`data-ds="command-palette"`), `backdrop`, `panel`, `search`
  (a SearchField root), `list` (a ListBox root), `group`, `item`,
  `shortcut`, `empty`, `footer` (key hints).
- Axes: size (`md`, `lg`).
- States: `data-state`, `data-loading`.
- Keys: the open shortcut (configurable, default Mod+K); typing filters;
  ArrowDown and ArrowUp; Enter runs; Escape clears, then closes.
- Read: FK2 `ContextMenu/MenuSearchHeader.tsx`, GB studio/`shortcutKeys.ts`.
- Owns: standard set for CommandPalette.
- Depends: 1.6.1, 1.3.11. Lane 6D.
- Accept: checklist; result count announced once per query; recent items
  group; Arabic matching through `filter.ts`; focus returns to the element
  that had it.

## 1.6.12 Lightbox

- Goal: view images full screen with previous, next, zoom and a caption.
- Behavior: DialogBase.
- Anatomy: root (`data-ds="lightbox"`), `backdrop`, `panel`, `image`,
  `caption`, `previous`, `next`, `zoom`, `counter`, `close`.
- Axes: none.
- States: `data-state`, `data-zoomed`, `data-loading`.
- Keys: ArrowLeft and ArrowRight move (reading direction); `+` and `-` zoom;
  Escape closes; swipe has the buttons and arrows as its key path.
- Read: no source: design from the dials table and the nearest existing
  component (Dialog).
- Owns: standard set for Lightbox.
- Depends: 1.6.11 (same lane).
- Accept: checklist; alt text required per image; "Image 3 of 12" announced;
  images never on glass.

## 1.6.13 Tour

- Goal: a short guided tour that points at real parts of the screen.
- Behavior: Radix Popover anchored to each target; state from
  `packages/shared/src/stepper.ts`.
- Anatomy: root (`data-ds="tour"`, the content), `arrow`, `title`, `body`,
  `progress`, `back`, `next`, `skip`, `highlight` (the ring around the
  target).
- Axes: size (`sm`, `md`).
- States: `data-state`, `data-side`.
- Keys: focus moves into the step; Escape ends the tour; back and next are
  buttons.
- Read: no source: design from the dials table and the nearest existing
  component (Popover, Stepper).
- Owns: standard set for Tour.
- Depends: 1.6.7 (same lane), 1.7.7.
- Accept: checklist; never blocks the page (non modal); skip is always
  there; the highlight is a ring, not a dimmed page; the target scrolls into
  view without motion under reduced motion.

## Pointer

1.6.8 DropdownMenu: built in batch 1 (`wave-1-batch-1.md`).
