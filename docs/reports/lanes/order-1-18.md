# Orders 1.18 and 1.19 (ds-docs)

Branch `claude/ds-order-1-18`, from `claude/relaxed-hypatia-7gseap`. Two
commits: `wo-1.18: consumers on wave 1`, `wo-1.19: adoption guides`, then this
report. `npm run check` green before each commit (baseline green before any
change).

## 1.18 Consumers on wave 1

### What changed

Both apps (`examples/consumer-vite`, `examples/consumer-next`) now use only
system components for buttons, dialogs, toasts, tooltips, menus and forms.

| Order asks | Done |
| --- | --- |
| Tooltip on every IconButton in the toolbar | The toolbar gained a "Sort by name" IconButton (`aria-pressed`, sorts the list). It and every row actions trigger sit in a Tooltip. One `TooltipProvider` inside the root Theme. |
| DropdownMenu for row actions | The row delete IconButton became a "more" IconButton that opens a DropdownMenu: "Duplicate board", a separator, "Delete board" (danger tone, opens the danger Dialog as before). |
| Create dialog on Form, Field, Label and FieldError | `Form` (id tied to the footer submit Button) with one required `Field` around the Input. Field renders the system Label and FieldError. An empty submit shows the Form summary, the inline error, `aria-invalid`, and moves focus to the input; typing a name clears the error. The Form's `required` label is set to the board copy. |
| Switches on SegmentedControl | Style and scheme are two SegmentedControls (`size="sm"`). |
| Arabic Window labels from the defaults (1.0.f) | The Arabic label table and the five label props are gone. The Window reads its labels from the theme language. |

Decision: the language switch is a `LanguageSwitch`, not a SegmentedControl.
Changing language moves to another page (Next: `/en` and `/ar`; Vite: the
URL with `lang=`). That is what LanguageSwitch is for, and it names each
language in its own language with `lang` and `hreflang`. The
SegmentedControl manifest's `avoidWhen` and the LanguageSwitch `mistakes` agree.

Copy added (English, verb plus noun; Arabic noun forms, no diacritics,
Western digits): "Sort by name" / "الترتيب حسب الاسم", "Actions for {name}" /
"إجراءات {name}", "Duplicate board" / "تكرار اللوحة", "Board duplicated" /
"نسخة اللوحة جاهزة", "{name} copy" / "نسخة من {name}".

Files: `examples/consumer-vite/src/{Boards.tsx,App.tsx,copy.ts,Boards.module.css}`,
`examples/consumer-vite/e2e/smoke.spec.ts`, `examples/consumer-vite/README.md`,
`examples/consumer-next/components/{BoardsScreen.tsx,DisplaySwitch.tsx}`,
`examples/consumer-next/app/[locale]/layout.tsx`, `examples/consumer-next/app/app.css`,
`examples/consumer-next/lib/copy.ts`, `examples/consumer-next/e2e/smoke.spec.ts`,
`examples/consumer-next/README.md`. The smoke tests also rewrote the ten
screenshots in `docs/reports/shots/consumers/` (committed: they are the
proof).

### Proofs

`npm run smoke -w @the-system/consumer-vite`: 14 passed.

```
✓  1 Studio renders the components from the packages, themed
✓  2 Desk renders the list in a Window with a title bar and lights
✓  3 an unlayered CSS Module class wins over the system layers
✓  4 the create dialog opens, validates, closes and returns focus
✓  5 delete asks in a danger dialog and the toast undoes it
✓  6 the switch changes style, scheme and language
✓  7 every IconButton shows its label in a Tooltip on focus
✓  8 the sort IconButton sorts by name and the row menu duplicates a board
✓  9 the Window takes its Arabic labels from its own defaults
✓ 10 to 13 studio and desk, en and ar: no sideways scroll at 320px and axe is clean
✓ 14 screenshots
```

`npm run smoke -w @the-system/consumer-next`: 13 passed (the same list
without the CSS Module layering test, which is Vite only; no console errors
and no hydration warnings in every test). `next build --webpack` also builds.

New assertions: the Form summary, `[data-ds="label"]` and
`[data-ds="field-error"]` in the create dialog and the error clearing on
input; delete through the row menu; each IconButton's tooltip shows its
label on focus; sort and duplicate; the Arabic Window close light is named
"إغلاق النافذة" and no English label is left. The layering test now
compares the "Create board" trigger with the dialog's submit Button (same
Button, no class), because the style switch is no longer made of Buttons.

`ds doctor` (from the repo root):

```
$ npx ds doctor examples/consumer-next
11 files, 0 errors, 0 warnings.
$ npx ds doctor examples/consumer-vite
12 files, 0 errors, 0 warnings.
$ npx ds doctor examples/consumer-next --json   (data.summary)
{ files: 11, errors: 0, warnings: 0, byRule: {}, skipped: [] }
```

Screenshots read after the run: `vite-studio-dark-en.png`,
`vite-desk-dark-ar-320-dialog-error.png`, `next-desk-dark-ar.png`. Toolbar,
row menus, segmented switches, language links and the Arabic dialog error
look right in both directions.

### System bugs found (worked around in the examples, not edited)

1. **Tooltip drops the trigger's own handlers when the hint repeats its
   name.** `packages/react/src/components/Tooltip/Tooltip.tsx`,
   `WithoutTooltipDescription` (around line 141): when `content` equals the
   child's `label` or `aria-label`, the Radix Trigger Slot merges its props
   onto `WithoutTooltipDescription`, which then calls
   `cloneElement(children, { ...rest, 'aria-describedby': own })`. `rest`
   holds Radix's `onClick`, `onPointerDown`, `onFocus` and `ref`, which
   replace the IconButton's own. Result: `<Tooltip content="Sort by name"><IconButton label="Sort by name" onClick={f} /></Tooltip>`
   never calls `f`. This is the pattern the Tooltip manifest recommends.
   Workaround: `TipIconButton` in both examples (the Tooltip clones the
   wrapper, which composes both handlers).
2. **Tooltip reads the name only from its direct child.** `nameOf` and
   `isUnnamed` in `Tooltip.tsx` look at the direct child. Around a
   `DropdownMenuTrigger` the child has no name, so in development a warning
   prints and the hint is added as `aria-describedby` (the name is read
   twice). Workaround: the trigger also gets `aria-label={label}`.
3. **`ds doctor` `ds/slot-limits` false positives on compound components.**
   `packages/lint/src/doctor/checks.ts`, lines 257 to 290.
   - DropdownMenu: the manifest root slot lists the items, but in React the
     items are children of `DropdownMenuContent`, and `DropdownMenu` holds
     the trigger and the content. Writing the documented structure gives
     "<Tooltip> in the DropdownMenu root slot" and "<DropdownMenuContent> in
     the DropdownMenu root slot". Workaround: the trigger and the content go
     in as expressions (`{trigger}{menu}`), which the rule does not read.
   - Field: the root slot accepts one control, so the documented
     composition (`FieldLabel`, the Input, `FieldDescription`, `FieldError`
     as children, as in `Field.demo.tsx`) gives "Field holds 3 items" and
     "<FieldLabel> in the Field root slot". Workaround: the `label`,
     `description` and `error` props.
4. **Environment, not code:** `npm install` put `@next/swc-linux-x64-musl`
   in `node_modules` on this glibc machine and not `@next/swc-linux-x64-gnu`
   (the lockfile lists both), so `next build` (Turbopack) failed with "native
   bindings are not available". I unpacked the locked
   `@next/swc-linux-x64-gnu@16.4.6` into `node_modules` by hand. No
   lockfile or `package.json` change. `npm run check` does not build Next,
   so it passed either way.

### Notes, not bugs

- The Form summary repeats the one inline error in a one field dialog. It
  is the system behavior and reads fine; a `summary` off switch for one
  field forms could be a later Form prop.
- In Next, the SegmentedControl selects on arrow keys (selection follows
  focus), so each arrow press writes the cookie and refreshes the route. It
  works; a slower server would make it feel heavy.

## 1.19 Adoption guides

`docs/adoption/figma-killer-2.md` and `docs/adoption/gobanana.md`: what to
install, the CSS import order, the root Theme, a component map (every source
component with its system component and order id), the order of
replacement, the risks (Desk glass contrast with the measured values and
WCAG 2.2 SC 1.4.3; 28px versus 32px with the compact density fix and SC
2.5.8; unlayered CSS; Radix behavior; the 1.18 bugs), how to run `ds doctor`
with a `ds.doctor.json` for the move, and what was or was not checked.

- **Figma-Killer-2:** checked against a read only public clone at commit
  `51b1994`: stack, the 50 component folders, import counts per folder (used
  to order the replacement), the light theme selector, and where
  `alm-design-system` is used. Nothing under `vendor/alm-design-system` was
  read. 33 folders mapped; 16 folders and `CursorTooltip` stay in FK2;
  `AlmLogo` (third party) is left alone.
- **GoBanana:** not checked against the source. `add_repo` for
  `MaherFayad/GoBanana` (read access) was refused in this session. The guide
  is built from `docs/contracts/token-mapping.md`, `AGENTS.md`, the wave 0
  and wave 1 orders' "Read" lines (every GB path and line range comes from
  them), the manifests and the wave 0 reports. It says so at the top and
  ends with a "Check before the move starts" list (paths at GB's current
  commit, versions, import counts, `toastBus.ts` call sites, doctor paths).

## What I could not do

- Fetch GoBanana. The GB guide is unverified against the source, as above.
- No fresh eyes subagent review was run on these orders.
- `docs/reports/consumers.md` is now out of date (it says 10 and 11 tests and
  describes the wave 0 screen). I do not own it.

## Changes needed from the lead

1. `packages/react/src/components/Tooltip/Tooltip.tsx`, in
   `WithoutTooltipDescription`:
   before `return cloneElement(children as ReactElement<Record<string, unknown>>, { ...rest, 'aria-describedby': own });`
   after `return <Slot.Root {...rest} aria-describedby={own}>{children}</Slot.Root>;`
   with `import { Slot } from 'radix-ui';`. Radix Slot composes handlers and
   refs with the child's. Add a test: an IconButton with `onClick` inside a
   Tooltip whose content equals its label calls `onClick` once on click.
   Then remove `TipIconButton` from both examples.
2. `Tooltip.tsx`, `nameOf` and `isUnnamed`: when the child has no name and
   holds exactly one element child, read the name from that child (one
   level, for `DropdownMenuTrigger`, `PopoverTrigger`, `DialogTrigger`).
   Then drop the extra `aria-label` on the examples' menu triggers.
3. `packages/lint/src/doctor/checks.ts`, `ds/slot-limits` children check:
   (a) a child whose component name starts with the owner's name and is not
   a manifest of its own (`FieldLabel`, `FieldDescription`, `FieldError`,
   `DropdownMenuTrigger`, `DropdownMenuContent`) is an own part: do not
   count it and do not reject it; (b) when that own part is
   `<Owner>Content`, apply the owner's root slot to the part's children
   instead; (c) a Tooltip whose single child is an own part is transparent.
   Add right fixtures for `DropdownMenu` with a tooltipped trigger and for a
   composed Field. Then the examples can go back to the inline forms.
4. Check why `npm install` picks the musl SWC binary on glibc (npm
   version, lockfile `libc` fields) so `npm run smoke -w
   @the-system/consumer-next` works in a fresh session.
5. `docs/reports/consumers.md`: change "10 tests for Next, 11 for Vite" to
   "13 tests for Next, 14 for Vite" and add a line that the screen now
   carries the wave 1 parts listed in the examples' READMEs.
6. GoBanana access for a later session, to run the "Check before the move
   starts" list in `docs/adoption/gobanana.md`.
