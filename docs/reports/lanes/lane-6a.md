# Lane 6A report: Dialog base

Branch `claude/ds-lane-6a`, from `762fb7f` on `claude/relaxed-hypatia-7gseap`.
Batch file `docs/plan/wave-1-batch-6.md`. Every order in the lane is done.

| Order | Component | Commit | Unit tests | Contract (react) | Shots |
| --- | --- | --- | --- | --- | --- |
| 1.6.1 | Dialog bring up | `wo-1.6.1: dialog bring up` | 28 of 28, unchanged | 31 passed | 0 px changed, 16 of 16 |
| 1.6.2 | AlertDialog | `wo-1.6.2: alert dialog`, plus review fixes | 11 | 31 passed | `docs/reports/shots/wave-1/alert-dialog/` |
| 1.6.3 | Drawer | `wo-1.6.3: drawer` | 8 | 31 passed | `docs/reports/shots/wave-1/drawer/` |
| 1.6.4 | Sheet | `wo-1.6.4: sheet` | 9 | 31 passed | `docs/reports/shots/wave-1/sheet/` |

`npm run check` passes on the last commit.

## 1.6.1 Dialog bring up

What changed:

- New `packages/react/src/components/Dialog/DialogBase.tsx`. It holds the
  modal internals that every member shares: the themed portal (a Theme that
  copies every axis), the root layer that stays mounted until the backdrop
  and the panel have played their exit, the focus rule and the focus return
  from `packages/shared/src/dialog-focus.ts` (reused, not edited), the Escape
  rule while a toast is above, outside clicks and focus that land in the
  Toaster, and `dismissible`. It takes the Radix `Overlay` and `Content` of
  the caller's primitive, so Radix Dialog and Radix AlertDialog both run on
  it with their own behavior. It also exports `assignRef`, the `DialogKind`
  type and `usePanelElement()` (the Sheet handle reads the panel through it).
- `Dialog.tsx`: `DialogContent` now renders through DialogBase. Every
  exported name, prop and default is the same. The DOM is the same: same
  elements, parts, attributes and order.
- `Dialog.css`: the shared rules (root, sizes, tone, phone gutter, backdrop,
  panel, focus, description, body, footer, motion, reduced motion,
  contrast, forced colors) now select
  `:is([data-ds='dialog'], [data-ds='alert-dialog'], [data-ds='drawer'], [data-ds='sheet'])`.
  `:is()` of attribute selectors has the specificity of one attribute, so
  every Dialog rule keeps its weight. The title band, the close part and the
  title bar stay Dialog only. New blocks follow the Dialog rules:
  `alert-dialog`, `drawer`, the drawer and sheet header, `sheet`, and the
  `ds-sheet-*` keyframes.
- Desk recipe `packages/styles/desk/recipes/Dialog.css`: the glass,
  hairline, radius and shadow apply to the four roots. The window grow
  (padding, enter scale, window open timing) applies to Dialog and
  AlertDialog only. Sheet keeps `radius.sheet`.

Proof the bring up changed nothing for Dialog:

- All 28 Dialog unit tests pass with no edit to `Dialog.test.tsx`.
- `npm run contract -- --framework react --component Dialog`: 31 passed.
- `npm run shots -- --component dialog` before the change (at `762fb7f`) and
  after the last CSS change: all 16 PNGs equal pixel for pixel (compared with
  pngjs, 0 differing pixels). The captures were kept in the session scratch,
  not committed.
- Angular: the Angular Dialog uses `Dialog.css` as is. Its DOM is unchanged
  and every Dialog selector keeps its specificity and its declarations, so
  the Angular compare should stay 0 px. I did not run
  `npm run shots -- --compare react angular` in this session. See "Changes
  needed from the lead".

CloseButton (1.1.9) is not in this repo yet (lane 1A builds it). The close
part stays the IconButton. Once CloseButton lands, one line changes in
`Dialog.tsx` (the `closeButton` constant) and one in `Drawer.tsx`
(`splitHeader`). Both are listed below.

## 1.6.2 AlertDialog

Built on Radix AlertDialog through DialogBase. Styled by the `alert-dialog`
block of `Dialog.css`.

```tsx
<AlertDialog
  open?: boolean
  defaultOpen?: boolean            // false
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'md'               // 'md': dialog.width sm 360, md 440
  tone?: 'neutral' | 'danger'      // 'neutral'
  dismissible?: boolean            // true; false: Escape does nothing while the action runs
>
  <AlertDialogTrigger><Button /></AlertDialogTrigger>
  <AlertDialogContent
    title?: ReactNode
    description?: ReactNode
    icon?: IconName | ReactElement | false   // 'info', 'warning' for danger
    className? style? rootProps? ref?        // ref and Radix Content props go to the panel
  >
    <AlertDialogTitle />
    <AlertDialogDescription />
    <AlertDialogFooter>
      <AlertDialogCancel><Button>Keep board</Button></AlertDialogCancel>
      <AlertDialogAction><Button tone="danger" emphasis="solid">Delete board</Button></AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

DOM: `alert-dialog` root > `backdrop`, `panel` (role alertdialog) > `icon`,
`title`, `description`, `footer` > `cancel`, `action` (system Buttons that
carry the parent's part).

Decisions:

- Focus opens on Cancel in both tones: DialogBase runs the focus rule as
  danger for this member. When no Cancel is there, focus goes to the first
  action, else the panel. Radix's own fallback would focus an empty ref.
- No close part and no close on a backdrop click (Radix AlertDialog).
  Escape cancels.
- `dismissible` is kept, as in Dialog, for the wait while the action runs:
  `event.preventDefault()` in the action's onClick keeps the alert open,
  then the app closes it.
- The icon is decoration in a tinted disc, `aria-hidden`. The default is
  `info` for neutral and `warning` for danger.
- A title or description child wins over the `title` or `description`
  prop, so there is only ever one of each.
- `insteadUse` points undoable actions to a Toast with an undo action.
- The demo error case keeps a `role="alert"` span in the description from
  the start and fills it on failure, so the error is announced.

## 1.6.3 Drawer

Built on Radix Dialog through DialogBase. Styled by the `drawer` and header
blocks of `Dialog.css`.

```tsx
<Drawer
  open?: boolean
  defaultOpen?: boolean            // false
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl' // 'md': widths from dialog.width; full width under breakpoint.phone
  side?: 'start' | 'end'           // 'end'; start is the right in Arabic
  modal?: boolean                  // true
  dismissible?: boolean            // true
>
  <DrawerTrigger><Button /></DrawerTrigger>
  <DrawerContent title? description? closeLabel? className? style? rootProps? ref?>
    <DrawerTitle /> <DrawerDescription />   // lifted into the header
    <DrawerBody />
    <DrawerFooter>
      <DrawerClose><Button /></DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

DOM: `drawer` root (`data-size`, `data-side`, `data-state`) > `backdrop`
(modal only), `panel` (role dialog) > `header` > `title`, `description`,
`close`; `body`; `footer`.

Decisions:

- The widths reuse the `dialog.width.*` tokens. No `drawer.width` token
  exists. See "Token gaps".
- Non modal (`modal={false}`): no backdrop, no focus trap, the page keeps
  scrolling. A click or focus on the page does not close the drawer.
  Escape and the close control do. The fixed root stops taking pointer
  events, so the page under it stays usable. The backdrop and the panel
  take pointer events again.
- Motion is the `sheet` pattern: a slide from the drawer's side on
  `duration.slow` and `ease.emphasized`. `--_dialog-slide` flips with
  `:dir(rtl)`.
- The panel is full height and flush with its edge. Only the inner corners
  are rounded. Under breakpoint.phone it fills the width with square
  corners.
- `splitHeader()` in `Drawer.tsx` builds the header band (the title and
  the description lifted out of the children, then the close IconButton).
  Sheet reuses it.

## 1.6.4 Sheet

Built on Radix Dialog through DialogBase. Styled by the `sheet` block of
`Dialog.css`.

```tsx
<Sheet
  open?: boolean
  defaultOpen?: boolean            // false
  onOpenChange?: (open: boolean) => void   // also false on a drag down
  size?: 'sm' | 'md' | 'lg'        // 'md': at most 50%, 75%, all of the height under a top gap
  dismissible?: boolean            // true; false: drag, Escape and backdrop do nothing
>
  <SheetTrigger><Button /></SheetTrigger>
  <SheetContent title? description? closeLabel? className? style? rootProps? ref?>
    <SheetTitle /> <SheetDescription />
    <SheetBody />
    <SheetFooter>
      <SheetClose><Button /></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

DOM: `sheet` root (`data-size`, `data-state`, `data-dragging`) > `backdrop`,
`panel` > `handle`, `header` > `title`, `description`, `close`; `body`;
`footer`.

Decisions:

- Anatomy adds `description` to the order's list. A sheet often carries one
  line under its title, and Radix names the description for assistive
  tech. It is optional.
- The drag uses pointer events with pointer capture on the handle. The
  panel follows through `--_dialog-drag-y` (down only). A release past a
  quarter of the panel's height, or a flick faster than 0.5 px per ms,
  closes the sheet. Otherwise it snaps back on `duration.base`. With
  `data-dragging` the snap transition is off, and under reduced motion it
  is always off. Nothing waits on `transitionend`.
- The handle is `aria-hidden` and out of the tab order. The close control
  and Escape are the key path (WCAG 2.5.7). The handle strip is the 24px
  target height.
- The handle bar has square ends. Chromium paints a background clipped to
  the content box over the whole padding box once any `border-radius` is
  set, tested with a pill radius and with half the height. At 4 to 5px tall
  the square ends do not show.
- The panel is at most the `xl` dialog width and centered on wide screens.
  Its top corners use `radius.sheet`. It pads its block end with
  `env(safe-area-inset-bottom)`.
- Forced colors: the bar keeps `CanvasText` through `forced-color-adjust:
  none`, since forced colors paint every background as Canvas.
- `insteadUse` points desktop side panels to Drawer.

## Token gaps

- `drawer.width.*`: none. Drawer uses `dialog.width.sm` to `xl`. A
  separate set only matters if drawers ever need other widths.
- `sheet.height.*`: none. Sheet heights are percentages of the screen in
  `Dialog.css` (50%, 75%, 100% under a `space.5xl` gap). Percentages pass
  the raw value gate.
- Web motion for `sheet`: `spring.sheet.*` is native only. The web slide
  uses `duration.slow` and `ease.emphasized`. When the motion catalog
  (1.11) lands, its `sheet` pattern should read the same two tokens.

## Review findings

Each component got one fresh eyes review (claude-opus-5-5, medium).

Round 1, Dialog bring up and AlertDialog. Fixed:

- Blocker: the AlertDialog manifest `tokens` list was missing the Desk
  recipe tokens and three base tokens. It now lists them.
- AlertDialog dropped a caller's `onFocusOutside`. It is now passed through.
- An AlertDialog with no Cancel left focus behind the modal. It now
  focuses the first action, else the panel.
- No toast-above test for AlertDialog. One was added: a toast action stays
  clickable, and an Escape from inside the panel cancels while the toast
  stays.
- The live region was added in the same update as its text. It is now in
  place from the start.
- `content.ar.error` and `a11y.native` were added to the AlertDialog
  manifest.
- "Stay on board" became "Keep access".
- A title prop and a title child both rendered. Now only one renders.
- The Desk recipe gave Drawer and Sheet the window timing and radius. Now
  only the centered members get the window timing, and Sheet keeps
  `radius.sheet`.
- `DialogBase` `kind` is now typed as `DialogKind`.
- "No proof that Dialog shots are unchanged": the 0 px compare above.

Left open:

- `a11y.native` is still absent from `Dialog.manifest.json`. It is outside
  this lane's orders and the schema treats the key as optional.

Round 2, Drawer and Sheet. Fixed:

- Blocker: a non modal Drawer moved focus to its trigger on close even
  while the person worked on the page. It now leaves focus where it is.
  There is a test for it.
- A non modal Drawer closed on an Escape typed in a page field. Escape now
  closes it only from inside the drawer. There is a test, and the manifest
  note says so.
- A controlled Sheet kept open after a drag stayed partway down. The offset
  is now cleared when the panel is still open. There is a test.
- The flick speed was averaged over the whole drag. It is now the speed of
  the last move.
- Losing pointer capture left `data-dragging` set. There is now an
  `onLostPointerCapture` handler and a test.
- The safe area padding showed the panel color under the footer band. The
  footer now takes the safe area inside itself.
- `radius.pill` was removed from the Sheet tokens.
- Drawer `frameworks.native` is now `planned` (tablets).
- Demos: Drawer gained `one` and `disabled` cases, Sheet gained a
  `disabled` case (`dismissible={false}` while an action runs).
- Copy: "Clear filters" closed without clearing and became "Discard
  changes" (تجاهل التغييرات). "Cancel invite" became "Close share"
  (إغلاق المشاركة). "Cancel board" became "Discard board". Both Arabic
  drawer triggers read "فتح الفلاتر" and the row labels tell them apart.

Left open, accepted:

- When the whole Sheet panel scrolls (a short viewport, 400% zoom), the
  handle scrolls away with the header. The close control stays, and both
  the CSS comment and the manifest say so.

## Changes needed from the lead

1. **Angular lane (A5 or the Dialog port owner):** `Dialog.css` and
   `packages/styles/desk/recipes/Dialog.css` changed selectors from
   `[data-ds='dialog']` to `:is([data-ds='dialog'], [data-ds='alert-dialog'], [data-ds='drawer'], [data-ds='sheet'])`.
   Declarations and specificity are unchanged and the React shots are
   identical. Please run
   `npm run shots -- --framework angular --component dialog` and
   `npm run shots -- --compare react angular` after merge to confirm 0 px.
2. **After CloseButton (1.1.9) merges:** in
   `packages/react/src/components/Dialog/Dialog.tsx`, the `closeButton`
   constant, replace
   `<IconButton data-part="close" icon="close" label={closeName} size="sm" disabled={!ctx.dismissible} />`
   with the CloseButton equivalent (`<CloseButton data-part="close" label={closeName} size="sm" disabled={!ctx.dismissible} />`),
   and do the same in `splitHeader` in
   `packages/react/src/components/Drawer/Drawer.tsx`. Lane 6A owns both
   files, so a follow up order for this lane can do it. The `close` part
   rules in `Dialog.css` select only `[data-part='close']`, so no CSS
   change is needed.
3. **Generated files:** `npm run gen` was run and its output committed
   (barrels, `index.css`, `routes.gen.ts`, `manifests.gen.json`,
   `packages/styles/desk/index.css`). At `762fb7f` they were already stale
   for ButtonGroup, DropdownMenu and Link, so the diff in those files
   includes those entries too. Regenerate on merge.
4. **Motion catalog (1.11):** the `dialog` and `sheet` patterns this lane
   names should match the CSS here: `dialog` as already defined, and
   `sheet` as a slide of 100% from the side (Drawer, mirrored in rtl) or
   from the block end (Sheet), on `duration.slow`, `ease.emphasized` in and
   `duration.base`, `ease.exit` out.

## Could not do

- I did not run the Angular pixel compare (item 1 above).
- `npm run shots` was not committed for the new components. Per the brief,
  the new shots were taken with a session script at
  `/c/<slug>?chrome=0` in studio dark, studio light, desk dark, desk light
  and desk dark rtl ar, plus phone widths and the Arabic trigger. They are
  under `docs/reports/shots/wave-1/{alert-dialog,drawer,sheet}/`.
- Detents for Sheet are wave 2, as the order says.
