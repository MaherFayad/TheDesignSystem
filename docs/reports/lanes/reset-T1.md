# T1: doctor false positives and one main per page

Order T1 of `docs/plan/reset-mobile.md`, section "Fix round from the first
three test screens".

## 1. `ds doctor`, rule `ds/slot-limits`

### What the rule got wrong

- **Wrappers read as their own content.** The rule took the children of a
  component from the component's `root` slot. For DropdownMenu and
  ContextMenu the manifest says the root part is rendered by another part
  component (`"DropdownMenuContent": "root"`), so the children of
  `DropdownMenu` (its trigger and its content) were checked against the item
  list of the menu. The documented composition failed: a 12 line probe gave
  2 findings, `music-library.tsx` 6, and `inbox-swipe.tsx` passed only
  because it built the menu from expressions.
- **A slot filled by a prop.** StatusDot (and Stat) take their text from the
  `label` prop and accept no children; the rule read the `label` slot as
  children and called `<StatusDot label="Unread" />` empty.
- Found on the way, same root cause:
  - an app component inside a content part (`<SongMenuItems />` in
    `DropdownMenuContent`) was checked as if it were the item itself;
  - in Angular, `<ng-container dsDropdownMenuSub>` (and any `ng-container`
    that hosts a system directive) was opened up as a plain group, so a sub
    menu's trigger and template were read as items of the parent menu;
  - a dialog opened from a footer (`<DialogFooter>` holding a `<Dialog>`
    with its trigger) was read as a Dialog in the footer, where in place it
    renders only its trigger Button;
  - `<ng-container [ngTemplateOutlet]>` inside a content template (the
    SplitButton) was read as nothing, so the menu was called empty.

### The fix (no component named in the rule; all read from the manifests)

- `manifests.ts`: `partOwner` finds the part component that renders a part.
  `childrenSlot` no longer gives a component a `root` or `label` slot that
  one of its part components renders: `DropdownMenu` has no children slot,
  `DropdownMenuContent` keeps the root slot with its accepts, min and max.
  `contentPart` names the part that renders an overlay's `root` or `panel`
  (DropdownMenuContent, ContextMenuContent, PopoverContent, DialogContent,
  SheetContent, ActionSheetContent). `slotProp` is true when the manifest has
  a prop of the slot's name (StatusDot `label`, Stat `label`).
- `checks.ts`: a slot with `min` is not empty when the component's prop of
  that name is set. In a slot, an overlay wrapper stands for what it renders
  in place (its trigger), its content part left out. An app component
  counts like an expression child (present, never checked against
  `accepts`, not counted toward `max`). An `ng-container` that hosts a
  system directive is that component, not a group; one with
  `ngTemplateOutlet` is an expression.
- `elements.ts`: the JSX reader marks app components (`local`): capitalized
  names declared at the top of the file or imported from a relative path
  that is not a system module. A tag from `react-native` is not marked, so a
  `View` in a slot still fails. The Angular reader names an `ng-container`
  after its system directive even when the manifests do not list it
  (`DropdownMenuSub`), as the JSX reader already does for an import.
- Tooltip, Select: nothing to change. Tooltip's manifest has no parts and
  takes its trigger as its one child; Select's only part is itself.

### Fixtures and tests

`packages/lint/fixtures/doctor/wrappers/` with a test block in
`packages/lint/src/gates/doctor.test.ts`:

- `right/Menus.tsx`: DropdownMenu, ContextMenu, Popover, Dialog (with a
  second dialog opened from its footer), Sheet and ActionSheet with trigger
  and content as children; an app component and a local function inside a
  content part; Tooltip; StatusDot named by `label`. 0 findings.
- `right/menus.html`: the Angular menu with a sub menu and a projected
  template, StatusDot with `label`. 0 findings.
- `wrong/Menus.tsx` and `wrong/menus.html` must still fail, 7 findings, each
  listed in the test: a Button and a div among the items, 13 items where the
  root slot takes 12, an empty content part, a StatusDot with no name (React
  and Angular), a button among Angular menu items.
- A unit test on hand made manifests (`Menu`, `Modal`, `Dot`) proves the
  wrapper and the prop are read from `parts` and `props`, not from names.

### Findings, whole repo (`node packages/cli/bin/ds.mjs doctor . --json`)

| | Files | Errors | Warnings | ds/slot-limits |
| --- | --- | --- | --- | --- |
| Before | 1859 | 3383 | 16 | 177 |
| After | 1868 | 3287 | 16 | 81 |

The 9 new files are the 4 fixtures and files other lanes added meanwhile.
Of the 81, 7 are the new wrong fixtures. Every other rule count is unchanged.

103 findings disappeared, all `ds/slot-limits`, all false:

| Count | Finding | Why it was false |
| --- | --- | --- |
| 61 | `<button>`, `<ng-template>`, `<div>`, `<Button>`, `<IconButton>`, `<FloatingActionButton>`, `<DropdownMenuContent>` in the DropdownMenu root slot | the trigger and the content of a DropdownMenu, its documented children |
| 5 | `<ListItem>`, `<div>`, `<ContextMenuContent>` in the ContextMenu root slot | the same for ContextMenu |
| 2 | `<SongMenuItems>` in the DropdownMenu and ContextMenu root slots | an app component that renders menu items; the doctor cannot see inside it |
| 19 | StatusDot is empty | named by its `label` prop (Angular demos and specs, React gallery) |
| 1 | Stat is empty | named by its `label` prop |
| 2 | `<ng-template>` in the Dialog footer slot | the content of a dialog opened from the footer; in place the footer holds its trigger Button |
| 2 | `<div>`, `<ng-template>` in the DropdownMenu sub slot | trigger and content of an Angular sub menu |
| 1 | DropdownMenuContent is empty (SplitButton, Angular) | the items come through `ngTemplateOutlet` |

3 more pairs show as gone and added only because other lanes edited
`Duo.tsx` and `Platforms.tsx` during the run: same message, new line.

Still reported, not touched by this order (they look like real findings or
are of another kind): Field root slot (36), Tabs label slot (10), AlertDialog
footer (6), Field label text (8), DropdownMenu sub-content holding quick
actions in an Angular spec (the manifest does not accept them there), and a
few single ones. Field and Tabs may deserve the same look later.

### Screens

- `apps/gallery-react/src/ios-screens/`: 20 files, 6 errors before, 0 after.
- `inbox-swipe.tsx`: the menu is written as documented again (trigger and
  content as children of DropdownMenu) and the StatusDot as
  `<StatusDot tone="accent" label={w.unreadDot} hideLabel />`; both
  workaround comments are gone. `music-library.tsx` had no workaround to
  remove; its 6 findings were the false ones above.

## 2. One main per page in the gallery

`apps/gallery-react/src/App.tsx`: the stage is a `div` on the two routes that
render a whole page in a PageShell (`/screens/ios/<id>/screen` and
`/platforms/duo/screen`), and a `main` everywhere else. The choice is by
route, not by `chrome=0`, so the screens have one main with the chrome on
too. Every gallery and contract selector names the stage by
`[data-gallery='stage']`, never by tag; the recorder's `locator('main')`
reads its own frame page, not the gallery. PageShell's skip link still
points at its own `main#main`.

Axe (`@axe-core/playwright`, Chromium, 390 by 844), before and after:

| Route | Before | After |
| --- | --- | --- |
| `/screens/ios/inbox-swipe/screen?chrome=0&platform=ios` | 2 mains; fails landmark-main-is-top-level, landmark-no-duplicate-main, landmark-unique | 1 main, stage div; all three pass, 0 violations |
| `/screens/ios/music-library/screen?chrome=0&platform=ios` | the same three fail | 0 violations |
| `/platforms/duo/screen?chrome=0` | the same three fail, and page-has-heading-one | landmark rules pass; page-has-heading-one is left (the Duo screen has no h1, not part of this order) |
| `/c/button` | stage main, 0 violations | unchanged |
| `/c/page-shell` | stage main, landmark-unique (2) | unchanged (the PageShell demo's own landmarks) |

## 3. Package

`apps/gallery-react/package.json` depends on `@the-system/shared` at
`0.0.0`, the form of the other workspace dependencies. `npm install` was
not run, so `package-lock.json` does not list it yet: the lead runs it with
the next install.

## Proof

- `npx vitest run packages/lint packages/cli`: 132 of 133 pass. The one
  failure is `packages/cli/src/main.test.ts`, "add, react", a snapshot of
  `ds add kbd` whose install line now carries `@internationalized/date`
  from another lane's change to the registry. Not caused by this order.
- `npm run typecheck`: clean.
- `npm run check` not run, as the order asks.
- Every server this order started was stopped. A gallery dev server started
  at 15:11 by another lane is still running.
