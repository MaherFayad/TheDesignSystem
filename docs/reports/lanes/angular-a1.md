# Lane angular-a1: Angular batch A1 (actions)

Branch `claude/ds-angular-a1`, from `claude/relaxed-hypatia-7gseap`. One
commit per component, in this order: ButtonGroup, ToggleButton, CloseButton,
CopyButton, FloatingActionButton, Link (A1.1), DropdownMenu, SplitButton
(A1.2). Every commit builds on its own: each one carries only the barrel
lines, gallery routes and generated manifest entries of the components it
contains.

Skipped: ToggleGroup and SegmentedControl. Neither has a React version in
`packages/react/src/components/`, so there is no spec to port.

## Result

| Component | DOM diff vs React | Contract (angular) | Pixels vs React | Unit tests |
| --- | --- | --- | --- | --- |
| ButtonGroup | 0 lines differ (en, ar rtl desk) | 29 passed | 18 shots, 0 px | 4 |
| ToggleButton | 0 (en, ar rtl desk) | 29 passed | 18 shots, 0 px | 6 |
| CloseButton | 0 | 29 passed | 18 shots, 0 px | 4 |
| CopyButton | 0 | 29 passed | 18 shots, 0 px | 7 |
| FloatingActionButton | 0 | 29 passed | 18 shots, 0 px | 3 |
| Link | 0 (en, ar rtl desk) | 29 passed | 18 shots, 0 px | 4 |
| DropdownMenu | 0, closed page and every open menu (see below) | 44 passed | 24 shots (12 open), 0 px | 13 |
| SplitButton | 0, closed page and open menu, en and ar rtl | 29 passed, 15 skipped | 12 shots, 0 px | 4 |

- DOM diff: `docs/reports/shots/angular/compare-dom.mjs` on `/c/<slug>?chrome=0`
  for both galleries; for menus a variant of it that opens a trigger with the
  keyboard (and a submenu with ArrowRight) and walks every
  `[data-menu-layer]`. DropdownMenu was compared open for the md, sm, icon,
  Arabic, grouped (with the Arrange submenu), too-many (en and ar), long-text
  and disabled triggers, in neutral, studio dark and desk rtl. The only
  difference left is outside the compared tree: Radix adds two focus guard
  spans at the ends of body; the Angular port does not (see "What I could
  not do").
- Contract: `npm run contract -- --framework angular --component <Name>`.
  SplitButton's 15 skips are the open checks (target size open, axe open):
  its demo has no `data-demo-trigger`, in React as in Angular, so the suite
  skips them the same way for both.
- Pixels: `npm run shots -- --framework react|angular --component <kebabs>`
  then `npm run shots -- --compare react angular`: 184 pairs, 0 over the
  limit, and every pair of this lane at 0 differing pixels.
- `npm run check` green after each component.
- Pointer and keyboard traces for DropdownMenu (click open, hover the sub
  trigger, move into the submenu, click outside, toggle on the trigger, rtl
  ArrowLeft and ArrowRight) produce the same open counts and the same focused
  element step for step in both galleries.

## API per component

Names follow React. Where a name differs, the reason is under each block.

### ButtonGroup

```html
<div dsButtonGroup attached emphasis="outline" size="sm" shape="pill" orientation="vertical" fullWidth aria-label="Board view">
  <button dsIconButton icon="list" label="Show as list"></button>
</div>
```

Inputs: `size` (xs, sm, md, lg; default md), `emphasis` (solid, soft,
outline, ghost), `shape` (default, pill, square), `orientation` (horizontal,
vertical), `attached`, `fullWidth`. The name is the native `aria-label` or
`aria-labelledby`.

- The axes reach children through the `DS_BUTTON_GROUP` injection token
  (`button-group/button-group-context.ts`), the twin of
  `ButtonGroupContext`. `DsButtonBase` injects it as optional, so Button,
  IconButton, ToggleButton, CloseButton, CopyButton and FloatingActionButton
  all read it; SplitButton reads it too. A child's own input wins. DI follows
  the template where the child is declared, so a wrapper element between the
  group and the child is fine (tested).
- For this, `DsButtonBase` changed (A1.1 note: "On DsButtonBase, ButtonGroup
  passes axes through DI"): `size` and `shape` default to undefined and
  resolve as input, then group, then md or default; emphasis moved into the
  base as `resolvedEmphasis` with a per component `defaultEmphasis`, and an
  icon only control never takes link from a group, as in React. Button and
  IconButton DOM is unchanged (diffed again: 0 lines).

### ToggleButton

```html
<button dsToggleButton start="grid" [(pressed)]="grid">Grid view</button>
<button dsToggleButton icon="eye" label="Show guides" defaultPressed emphasis="ghost"></button>
```

Inputs: `pressed` (model), `defaultPressed`, `start`, `end`, `icon`, `label`,
`emphasis`, plus the base `size`, `tone`, `shape`, `disabled`. Output
`pressedChange`.

- `onPressedChange` is the `pressedChange` output of `[(pressed)]`.
- `start`, `end`, `icon` take an icon name or a `TemplateRef`.
- No `loading`, as React: the base inputs exist but are not documented for it.

### CloseButton

```html
<button dsCloseButton (click)="close()"></button>
<button dsCloseButton label="Close panel" size="sm" shape="pill"></button>
<a dsCloseButton href="#back"></a>
```

Inputs: `label` (default Close, or إغلاق under an Arabic dsTheme), `size`,
`shape`, `disabled`, `type`.

- No `asChild`: `a[dsCloseButton]` is the link form.
- React omits `tone`, `emphasis` and `loading` from the props. Angular
  cannot remove inherited inputs: emphasis is fixed (not an input), `tone`
  and `loading` are inherited inputs of the base and should stay unset.

### CopyButton

```html
<button dsCopyButton [value]="command" label="Copy command" target="command-text"
  (copied)="onCopied($event)" (copyFailed)="onFailed($event)"></button>
```

Inputs: `value` (required), `label`, `iconOnly`, `copiedLabel`,
`failedLabel`, `target`, `emphasis` (default ghost), plus the base axes and
`disabled`. Outputs: `copied`, `copyFailed`.

- `onCopied` and `onCopyFailed` are the `copied` and `copyFailed` outputs.
- The clipboard call runs inside the click handler. A `(click)` of the
  caller that calls `preventDefault()` cancels the copy, as `onClick` does in
  React: the handler awaits one microtask so a caller listener on the same
  element runs first, which stays inside the click's user activation.
- `copy.ts` is a copy of the React file (see "Changes needed from the lead").

### FloatingActionButton

```html
<button dsFloatingActionButton icon="plus" label="Create board"></button>
<button dsFloatingActionButton icon="plus" label="Create board" extended position="absolute" size="md"></button>
```

Inputs: `icon` (required), `label` (required), `extended`, `position`
(fixed, absolute, static; default fixed), `size` (md, lg; default lg), `tone`
(default accent), `shape`, `loading`, `loadingLabel`, `disabled`.

- No `asChild`: `a[dsFloatingActionButton]` is the link form.
- Emphasis is always solid (not an input), as React. Size defaults to lg
  and so does not take a ButtonGroup's size, as in React. The `size` input is
  typed with the Button sizes because the base declares it; the doc says md
  or lg.

### Link

```html
<p>Storage is almost full. <a dsLink href="#storage">Review large files</a>.</p>
<a dsLink standalone external size="sm" tone="accent" href="https://example.com/docs">Open the docs</a>
```

Inputs: `tone` (neutral, accent), `size` (xs, sm, md, lg; default none),
`external`, `externalLabel`, `standalone`, `disabled`, `href`, `target`,
`rel`, `role`, `tabIndex`.

- No `asChild`: a router link is the same `a[dsLink]` with the router
  directive on it.
- `href`, `target`, `rel`, `role` and `tabIndex` are inputs, not plain
  attributes, because disabled and external rewrite them (React does this
  with the spread props).
- Disabled blocks click and auxclick with a capture listener, as
  `DsButtonBase` does.

### DropdownMenu

```html
<ng-container dsDropdownMenu [(open)]="open" size="sm" modal>
  <button dsButton dsDropdownMenuTrigger end="chevron-down">Board actions</button>
  <ng-template dsDropdownMenuContent side="block-end" align="start" [sideOffset]="4" [collisionPadding]="8">
    <div dsDropdownMenuLabel>Board</div>
    <div dsDropdownMenuItem start="edit" shortcut="F2" tone="danger" textValue="Rename" disabled (select)="rename($event)">Rename board</div>
    <ng-container dsDropdownMenuSub [(open)]="subOpen">
      <div dsDropdownMenuSubTrigger start="link">Share board</div>
      <ng-template dsDropdownMenuSubContent [sideOffset]="0" [alignOffset]="-5">
        <div dsDropdownMenuItem>Copy link</div>
      </ng-template>
    </ng-container>
    <div dsDropdownMenuSeparator></div>
    <div dsDropdownMenuGroup>
      <div dsDropdownMenuCheckboxItem [(checked)]="grid" shortcut="Ctrl+G">Show grid</div>
    </div>
    <div dsDropdownMenuRadioGroup [(value)]="sort">
      <div dsDropdownMenuRadioItem value="name">Name</div>
    </div>
  </ng-template>
</ng-container>
```

Import `DS_DROPDOWN_MENU` for all of them.

- `DropdownMenu` renders no element in React; `dsDropdownMenu` sits on an
  `ng-container`, like `dsDialog`.
- `DropdownMenuTrigger` renders its child button in React (asChild). Here
  `dsDropdownMenuTrigger` goes on the system button itself. Its own
  `disabled` input stops it opening; also set `disabled` on the button (one
  attribute feeds both directives).
- `DropdownMenuContent` and `DropdownMenuSubContent` are `ng-template`
  directives, rendered through a CDK `ComponentPortal` whose host is the
  themed layer `div[data-menu-layer]`, as Dialog does.
- `onOpenChange`, `onCheckedChange`, `onValueChange` are the `openChange`,
  `checkedChange`, `valueChange` outputs of `[(open)]`, `[(checked)]`,
  `[(value)]`. `defaultOpen` seeds the local state when `open` is not bound.
- `onSelect` is the `select` output. It emits a cancelable event;
  `preventDefault()` keeps the menu open, as in Radix.
- `DropdownMenuContent` has one extra input, `part`: React passes
  `data-part="menu"` as a spread prop (SplitButton does), an `ng-template`
  has no attributes to spread.
- The DOM keeps Radix's internal names: `data-radix-popper-content-wrapper`,
  `data-radix-menu-content`, `data-radix-collection-item`,
  `data-radix-popper-side` and `-align` on the trigger while placed, and the
  `--radix-popper-*` and `--radix-dropdown-menu-content-*` variables.
  DropdownMenu.css reads the variables and Tour.css reads the wrapper, so
  they are part of the CSS contract today; the rest is kept so the DOM diffs
  clean.
- Behavior is hand built. Angular Aria is not installed (A3.0 installs it),
  and both Angular Aria Menu and the CDK Menu stamp their own attributes and
  classes on the trigger and items, and the CDK Menu opens in an Overlay
  pane, an element React does not have. What is built, after Radix Menu:
  pointer press toggles from the trigger; Enter, Space, ArrowDown open with
  focus on the first item, ArrowUp on the last; a pointer open focuses the
  menu; roving tab stop and `data-highlighted`; ArrowDown, ArrowUp, Home,
  End, PageUp, PageDown without wrap, skipping disabled items; typeahead with
  Radix's matching rule and 1 s reset; Tab is held; Escape from any level
  closes all and returns focus to the trigger; a click or focus outside
  closes without moving focus; a select closes and returns focus;
  submenus open on ArrowRight (ArrowLeft in rtl), Enter, Space, click or a
  100 ms hover, close on ArrowLeft (ArrowRight in rtl) with focus back to
  the sub trigger, on focus moving elsewhere, and with their parent; the
  exit waits for `getAnimations()` on the menu, so nothing waits on
  `animationend`.
- Placement: `packages/angular/src/behavior/popper.ts`, a small twin of the
  Floating UI steps Radix runs (offset, shift with limitShift, flip with
  flipAlignment, size, the transform origin), written onto the wrapper in
  Radix's order, kept placed on resize, scroll and size changes. No
  dependency added. The CDK `FlexibleConnectedPositionStrategy` was not used:
  it positions an overlay pane, has its own fallback order and does not give
  the available sizes or the origin the CSS reads.

### SplitButton

```html
<div dsSplitButton tone="accent" emphasis="solid" start="upload" label="Publish page"
     menuLabel="More publish options" [(open)]="open" (action)="publish()">
  <ng-template dsSplitButtonMenu>
    <div dsDropdownMenuItem start="clock">Schedule publish</div>
  </ng-template>
</div>
```

Inputs: `label` (required), `menuLabel` (required), `start`, `size`, `tone`,
`emphasis`, `shape`, `loading`, `loadingLabel`, `disabled`, `open` (model),
`defaultOpen`. Outputs: `action`, `openChange`.

- `children` (the menu items) is an `ng-template dsSplitButtonMenu`, not
  projected content: the items render inside the menu layer and their DI must
  reach the menu. The host provides `DsDropdownMenu` and `DS_MENU_PANEL` to
  that template from its own view.
- `onClick` is the `action` output. A `click` output would also fire for a
  click on the trigger half, because the native click bubbles to the host.
- `label` is a string (React takes a node).
- `actionRef` has no input: query the action through `exportAs:
  'dsSplitButton'` or a view query.
- Reads the ButtonGroup axes through the same token as the buttons.

## Review

One fresh eyes review (ds-qa, claude-opus-5-5 at medium) of the whole diff.
Fixed in the commit "a1: review fixes":

- Blocker: a DropdownMenu inside a Dialog closed as soon as it opened. The
  dialog's focusin listener pulled focus from the menu layer back into the
  panel, and the menu read that as focus outside. The dialog now leaves focus
  that lands inside a `[data-menu-layer]` alone (`dialog.ts`, one line).
  Test: "a menu inside a dialog stays open and takes focus". Dialog contract
  44 of 44 again.
- Blocker: a menu or submenu reopened during its exit animation skipped its
  open rules: a submenu was not re-registered with its parent, so the parent
  treated it as outside and closed everything; the root got no focus and lost
  its placement attributes. The reopen path now places again and runs the
  open rules.
- Note: with a submenu opened by hover, ArrowRight, Enter or Space on the sub
  trigger now moves focus into it, as Radix does. Test added.
- Note: ToggleButton now keeps its state when a caller's `(click)` calls
  `preventDefault()`, as Radix Toggle does. Angular runs the host listener
  before the caller's, so it waits one microtask, as CopyButton does. Test
  added.
- Note: CopyButton no longer sets state or a timer after it is destroyed
  during a pending copy.
- Extra: a menu whose host is destroyed while open now runs its close rules
  (focus back to the trigger, the submenu leaves its parent) before the layer
  goes.

Left open, with the reason:

- No pointer grace area toward a submenu (see "What I could not do").
- ToggleButton and CopyButton read `defaultPrevented` after one microtask,
  so a `preventDefault()` anywhere on the propagation path (a clickable card
  around the button) also cancels, where React only sees the caller's own
  `onClick`. Rare, and the alternative (ordering listeners on one element)
  has no Angular API.
- `behavior/popper.ts` flip: the alignment side used for the cross axis
  check differs from Floating UI's `getAlignmentSides` when the anchor is
  wider than the menu, and center alignment skips the cross axis check. This
  only matters when no placement fits and a tie must be broken at a viewport
  edge. All shots are at 0 pixels; the edge cases are not covered by a demo.

## Changes outside the component folders

- `packages/angular/src/components/button/button-base.ts`, `button.ts`,
  `icon-button/icon-button.ts`: the ButtonGroup DI described above. The A1.1
  row asks for it ("On DsButtonBase"). Button and IconButton DOM, contract
  and pixels are unchanged.
- `packages/angular/src/behavior/popper.ts`: new, the positioning above.
- `packages/angular/src/components/dialog/dialog.ts`: the one line focusin
  fix from the review, so a menu can open inside a dialog.
- `apps/gallery-angular/src/app/app.ts`: a click listener that resolves
  in-page links (`href="#..."`) against the current page. The Angular CLI
  needs `<base href="/">` for its script paths, and with it `#sharing` opened
  `/#sharing`, away from the demo, so the Link contract's Enter check
  navigated off the page and timed out. The React gallery has no base
  element. Modified plain left clicks only; a click a component already
  prevented (a disabled link) is left alone.
- `packages/manifest/src/component/*.manifest.json`: only the
  `frameworks.angular` block of the eight components, now `ready`.

## What I could not do

- Radix's focus guards (two `span` elements with tabindex 0 at the start and
  end of body while a menu is open) are not added. They hold no layout and no
  pixels, and the menu holds Tab itself.
- The pointer grace area toward a submenu (Radix lets the pointer cross other
  items diagonally on its way into an open submenu) is not built. Moving the
  pointer over another item of the parent menu closes the submenu at once.
- `modal` on DropdownMenu hides the rest of the page from assistive tech
  (the Dialog's `hideOthers`) but does not block outside pointer events or
  scroll, as Radix does with `modal`. No demo uses it.
- The DOM diffs of open menus were taken with a keyboard open; pointer
  hover states were compared by trace (open count and focused element), not
  by full DOM dump.

## Changes needed from the lead

1. Move `packages/react/src/components/CopyButton/copy.ts` to
   `packages/shared/src/copy.ts` (it has no React code) and export it from the
   shared barrel; then delete
   `packages/angular/src/components/copy-button/copy.ts` and import
   `copyToClipboard`, `selectTextOf` and `readTimeToken` from
   `@the-system/shared` in both frameworks. Until then the two copies must stay
   equal.
2. `docs/contracts/frameworks.md`, Angular section, add to the names list:
   "A component whose React children render inside a portal takes them as an
   `ng-template` (SplitButton: `ng-template dsSplitButtonMenu`), because DI
   follows declaration. An output that would shadow a bubbling native event
   on the host takes another name (SplitButton `onClick` is `action`)." And:
   "Overlay content directives on an `ng-template` take a `part` input where
   React spreads `data-part` onto the root."
3. `docs/contracts/frameworks.md`: say whether the Radix internal names in
   the DOM (`data-radix-*` attributes, `--radix-*` variables) are part of the
   contract. Today DropdownMenu.css, Tooltip.css, Popover.css, Tour.css,
   Combobox.css, Navbar.css and Toast.css read `--radix-*` variables and
   Tour.css reads `[data-radix-popper-content-wrapper]`, so an Angular port
   must write them. A neutral name (for example `--ds-popper-available-width`
   set by both frameworks, mapped once in CSS) would let a later Angular port
   drop the Radix names.
4. `apps/gallery-angular/src/index.html`: consider the in-page link fix
   above as permanent gallery behavior (it lives in `app.ts` now), or move
   the CLI output to absolute script paths and drop `<base href="/">`.
5. The A3.0 Angular Aria install: when it lands, DropdownMenu can be checked
   again against Angular Aria Menu. It should only replace the hand built
   keys if it renders no extra element and no extra attribute on the trigger
   and items; the contract and the DOM diff here are the test.
6. `STATE.md`: A1.1 done (six components), A1.2 done for DropdownMenu and
   SplitButton; ToggleGroup and SegmentedControl wait for their React
   versions.
