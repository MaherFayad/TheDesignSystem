# Consolidation 2

The second consolidation pass, on branch `claude/ds-consolidation-2` from
`claude/relaxed-hypatia-7gseap` (`1e2214d`). One commit per item, `npm run
check` green before each. Inputs: consolidation 1 "For the lead", round 2 of
`docs/plan/wave-1-followups.md`, the fix reports for batch 5, batches 8 and 9
and the motion catalog, and the lane reports 1D, 2C, 3D, 6D and orders 1.13
and 1.15.

Every new rule and choice is in `DECISIONS.md`, section "Consolidation 2",
entries 1 to 24.

## Item 1. Anatomy contract text (`f530c11`)

`docs/contracts/anatomy.md`:

- Rule 1, private properties: the name list now has kinds, in order of
  preference: the base list (adds `padding-block`, `padding-end`,
  `font-weight`, `border-style`, `shadow`; suffixes add `-invalid`,
  `-checked`, `-readonly`), a part name in front of a base name or alone, a
  `-now` working value only state rules set, tone groups, layout, motion
  and drawing extras. Any other name needs a line in the CSS header.
- Rule 1 also records `--_menu-*` as the one shared family (every menu
  surface reads it; lane 3D asked for a ruling).
- Rule 11 is now a table of the layout and component attributes in use,
  with `data-width` for Container and the line that `data-variant` never
  stands in for a shared axis.
- Rule 12: `md` is 32px for controls only; every other component's `md` is
  the middle of its own scale, from tokens.

Component edit: `FloatingActionButton.css`, `--_fab-inset` renamed to
`--_floating-action-button-inset` (4 lines), so every private name starts
with the full `data-ds` value.

Also recorded: Container takes `width`, not `size`; the contract suite keeps
Studio as its single run style while Neutral is `proposed`.

## Item 2. Token requests (`3a4fdb1`)

Added to `contract.json` under `added` (base tokens, so every style and
scheme has them) and to the snapshots:

| Token | Value | Adopted in |
| --- | --- | --- |
| `delay.feedback` | 2000ms, kept under reduced motion | CopyButton (`HOLD_TOKEN`, was `delay.peek-hide`, 600ms) |
| `duration.pulse` | 1.4s | StatusDot (was `duration.shimmer`) |
| `z.raised` | 1 | ResizablePanels handle (was `z.dropdown`, 20) |
| `scale.menu-enter` | 0.97 | DropdownMenu, Combobox, Select, MultiSelect, TagField (was `scale.press`) |
| `size.icon.xl` | 36px | Spinner lg (was a calc) |
| `size.container.sm` to `xl` | 30, 48, 68.75, 84rem | Container (was breakpoints and a calc) |
| `size.grid.item-min.sm` to `lg` | 10, 15, 24rem | Grid (was breakpoint calcs) |
| `size.measure` | 33.75rem (540px) | EmptyState (was `5 * space.12xl`) |
| `menu.width.max` (component) | 400px | DropdownMenu (was a calc) |

Each equals what its component computed before, except the feedback delay,
which grows to the asked 2 seconds.

Scrollbar thumb: `scrollbar.thumb` and `thumb-hover` now reach 3:1 on body
and surface 1 to 5 in all six modes (SC 1.4.11). Light schemes and Neutral
dark alias `color.text.subtle` (hover `text.muted`); Studio and Desk dark use
an opaque `#b8b8b8` (3.21:1 on their surface 5 `#605f5f`, 10.6:1 on the
body), hover `text.default`, since muted text is 2.48:1 on that surface. The
contrast gate (`packages/lint/src/contrast-pairs.ts`) measures the new pair
"scrollbar thumb, at rest and on hover" on all six surfaces, and passes.
`ScrollArea.css` reads `--ds-scrollbar-thumb` again; its contrast test now
follows token aliases (a one function change in `ScrollArea.test.tsx`).

Declined, with the reason:

| Request | Why not now |
| --- | --- |
| `color.border.control` at 3:1 on surface 4 and 5 (batch 8-9) | Surface 4 and 5 are the hover and pressed fills of rows and buttons, not surfaces a control sits on; the gate narrows control borders to body to surface 3 on purpose. Raising the token changes every input border in every style. For the Separator and the resize line, the owner can read `border.strong` on those fills. |
| Neutral dark `state.success.solid` at 3:1 on the overlay track (batch 5) | Adopted the other option: anatomy rule 16, marks use `state.*.border` or `primary.border`. |
| `color.selected.ring` | With no style asking for a different value it would be an alias of `focus.ring`; Card and Tile already draw it through a private property. Add when a style differs. |
| `size.viewport.full` (lane 6D) | DTCG dimensions allow px and rem only; a `dvh` value is a number with `ds.unit` and needs a build change. PageShell works with `min-block-size: 100%`. |
| `layout.aside.width`, a palette offset token (lane 6D) | One user each; the existing tokens (`dialog.width.sm`, `space.10xl`) hold the same values. |
| `focus.shadow.ring-inset` (lane 1D) | A composite shadow built from the focus colors; it belongs to the style owner with the focus recipes, not to a value pass. |
| `segmented-control.*`, `tag-field.*`, a popup width (lanes 1D, 3D) | No style draws them differently yet. |
| Color veils, `color.neutral.solid`, `text.on-inverse`, progress track and ring tokens, `kbd.height.*`, `list.row.inset`, `scrollbar.size.sm`, `icon.stroke.width`, `fab.height.*`, `stat.value.font-size.*`, `opacity.muted`, a skeleton fill, `color.primary.graphic`, `ease.linear` | Each needs a design value per style or has a working recipe today; none was asked with a failing check behind it. Skeleton already runs linear. Left for the token owner's wave 2 pass. |
| Per density style tokens (`$extensions["ds.density"]`) | A build change, not a token; for the token owner. |

## Item 3. Motion (`61827dd`)

- `fade`: Input, Textarea, PasswordField, PhoneField, OTPField, InlineEdit,
  Checkbox, CheckboxGroup, RadioGroup, RadioCard, Rating, Slider,
  RangeSlider, Switch, NumberField, ScrubInput.
- `press`: Button, IconButton, WindowControls, Pagination, ToggleGroup.
- That is the 13 `fade` and 1 `press` of the 14 set to `none` in `c6488c1`,
  the 4 the motion report added (Button, IconButton, WindowControls, Input),
  and 3 more for the same reason (NumberField and ScrubInput fade their
  focus glow as Input does; ToggleGroup items keep Button's press).
  PageShell stays `none`.
- The "no catalog pattern" sentences are rewritten. Button, IconButton and
  WindowControls notes say the web press is still a color swap until the
  component plays the pattern.
- The schema's `motion` key is an enum of `none` plus `PATTERN_IDS`,
  written by `scripts/gen-index.ts` from `packages/motion/src/core.ts`.
- Neutral preset rows and the Studio stagger change from the motion report
  (`packages/styles/neutral/motion.ts`, `studio/motion.ts`).
- Not done: the Neutral 150 to 200ms test in `packages/motion` (the motion
  owner's file), Stat playing `number-roll`, the loop pause wiring (order
  1.21).

## Item 4. Registry and llms in `npm run gen` (`8cc30bb`)

- `npm run gen` = barrels and routes, the token build, the registry build,
  the docs pages and llms files. `npm run check` runs the same gen, so
  `packages/registry/registry.json` stays fresh like `manifests.gen.json`.
  It was stale at the start of this pass.
- Root `engines.node` is `>=22.23.4` (astro 7.4.11).
- `packages/cli` declares its workspace dependencies (icons, lint,
  registry). `tsx` and `typescript` are not declared: as runtime
  dependencies of a published CLI they are a release wave question for the
  owner.
- `THIRD_PARTY_NOTICES.md` lists the two shadcn/ui registry schemas (MIT).
- The doctor (`packages/lint`) matches path patterns in `packages`, and its
  default adds `**/ds/react/components/*`, so apps on registry files are
  checked. Tests in `doctor.test.ts`.
- `ds init` points at `/llms.txt`; the docs serve it at the root. Nothing to
  change.

Declined: the `process.env.NODE_ENV` helper (order 1.13, 4) touches
`DialogBase.tsx` and `Tooltip.tsx`, which other sessions are fixing; routed
to their owners with the order's proposal. `npx ds init` in
`examples/consumer-next` (order 1.13, 6): writing an `AGENTS.md` into an
example is the owner's call. The gallery base path (order 1.15, 2) is a
gallery app change outside this pass's files; routed to the gallery owner.
`text.ar` in the manifest schema (order 1.15, 5) waits on HUMAN GATE 4 (the
Arabic register).

## Item 5. Dialog demo (`c36b09f`)

The Angular Dialog demo now wraps every English case in
`<div dsTheme [lang]="'en'" data-demo="content">`, as React's `DemoCase
lang="en"` does; the Arabic row and the long Arabic case keep their `ar`
Theme. `npm run shots -- --compare react angular` after fresh Dialog
captures in both frameworks: 48 pairs, 48 pass. The 24 Dialog pairs (six
modes, ltr and rtl, closed and open) all have 0 differing pixels, and so do
the 24 Button and IconButton pairs. (The commit message says 48 Dialog
pairs; it is 24 Dialog pairs and 24 others.) The Dialog shots in
`docs/reports/shots/matrix/` are refreshed, including the Neutral ones.

## Item 6. Round 2 requests (`22040dc`)

Done:

| From | Change |
| --- | --- |
| Lane 1E 1, 2; lane 6C 1; lane 7C 3 | Contract suite: `contract.opens` (the opened root's `data-ds`) runs the open target size and open axe checks on that root; a key hint may `open` a trigger first and `expect: focus-returns`. Schema, README and unit tests updated. SplitButton gets an Escape hint; SplitButton, Menubar, Breadcrumbs and LanguageSwitch get `opens: dropdown-menu`. All four: 44 passed, 0 failed, 0 skipped (before: 15 skipped each). |
| Lane 2D 1 | Gallery route slugs use the `data-ds` kebab case (`otp-field`, was `otpfield`). The docs slug function changed the same way (`apps/docs/scripts/manifests.ts`), or the docs preview link would have broken. |
| Lane 2B 1, 2D 2, 3, 3B 1, 9A 4 | Private names: rule 1 (item 1) plus `padding-end`. |
| Lanes 2B 2, 2D 5 | Field `slots.root.accepts` already lists them. Nothing to change. |
| Batch 5, 4; lane 7A 4; lane 9A 4; lane 3B 2; lane 7B 5 | `anatomy.md` rules 5, 6, 7 and new 13 to 18. |
| Batch 5, 6 | `[data-visually-hidden]` in `packages/css/src/base.css`. |
| Batch 5, 2 | `DemoGrid` columns are `minmax(min(<min>, 100%), 1fr)`. |
| Batch 8-9, 3 | `scripts/a11y.ts` skips the open pass when a demo has no trigger, and runs it for `contract.opens`. |
| Lanes 7B 1, 1D 3 | A disabled or loading Button and a disabled Link pass navigation keys (arrows, Home, End, Page keys, Tab) to `onKeyDown`; every other key stays swallowed (a disabled Chip still blocks Delete). The key list is `packages/react/src/internal/keys.ts`. Test in `Button.test.tsx`. |
| Lane 9A 1 | `ButtonDs` takes `chip`; Chip drops its cast. |
| Lane 6D 1 | `DialogKind` takes `command-palette` and `lightbox`; both casts go. |
| Lanes 2A 3, 2B 5, 3A 3, 3B 3, 7C 4, 9A 5 | Motion ids (item 3). |
| DECISIONS.md | Lanes 2A 2, 3A 2, 3B 2, 3C 1 and 3, 7A 3, 7B 5, 9A 4, batch 8-9 1, lane 3D 2: entries 16 to 24. |

Component edits in this item, all small: `ButtonBase.tsx`, `Link.tsx`,
`Chip.tsx`, `DialogBase.tsx`, `CommandPalette.tsx`, `Lightbox.tsx`,
`Button.test.tsx`, and the four manifests above.

Declined, with the reason:

| From | Request | Why |
| --- | --- | --- |
| Lane 2A 2, lane 3A 1, lane 7B 4 | Edits to `docs/plan/wave-1-batch-*.md` | The plans are the record of what was ordered; the decision is in DECISIONS.md and the manifests. |
| Lane 6B 1 | IconButton shows its label in a Tooltip by default | The Radix Tooltip trigger stamps `data-state` on the button, so the React IconButton DOM would stop matching the Angular IconButton, which has no Tooltip yet. Needs the Angular Tooltip in the same commit. |
| Lane 6A 2, lane 2B 3, lane 9A 3 | CloseButton in Dialog, Drawer, SearchField and Chip | Dialog's DOM is mirrored by the Angular Dialog; the others are component swaps for their owners. Same reason as consolidation 1, item 4. |
| Lane 3D 1, lane 3C 2 | Fold the MultiSelect and TagField popup CSS into Combobox.css | Deletes two blocks in four component CSS files and two Desk recipes while other sessions edit component files. An order for the list family owner, with shots before and after. |
| Lane 3D 3, lane 3C 4, lane 6D 2, 4 | Move `usePopupLayer`, `filterListBoxItems`, `MarkedLabel`, `matchShortcut` | Each is a move across component files with its tests; route as one small order. `packages/shared` is ready to take the two pure ones. |
| Lane 3A 4 | Slider uses `formatNumber` | `packages/shared/src/number.ts` has landed; the swap is the Slider owner's. |
| Lane 4B 2 | Form requirements for FormWizard | Form (order 1.4) has not landed; the requirement goes into that order. |
| Lane 4B 4, lane 7A 1, 2 | `--_button-decoration`, `--_button-font-weight`; Sidebar adopts `--_button-justify` | Button.css and Sidebar.css edits with visual risk; the names are now legal in rule 1. For the Button and Sidebar owners. |
| Lane 7A 5, 6; lane 7B 2, 3 | Tooltips in Sidebar, Rail, Toolbar, Tabs; Drawer in Navbar; ToolbarToggleItem on ToggleButton | Component work for their owners. Tooltip and Drawer have landed. |
| Lane 7B 6 | `data-demo="narrow"` in demo.css | Gallery chrome outside this pass's files. |
| Batch 8-9, 2 | `gallery.css` excludes `[data-part='link']` | Gallery app file outside this pass's files; a one line selector change for the gallery owner. |
| Batch 5, 3, 5, 7, 8 | Shared test helper move, Toast language gap, SkeletonGroup, ErrorState native role | Owners' files, a new component needing an order, and the native owner. |
| Lane 1D 1 | `label` required when ToggleButton has an `icon` | A type change in three components and their demos; for the button family owner. |
| Lane 1D 2, lane 7C 5 | The GoBanana cookbook and source checks | GoBanana is not cloned in this container (`/home/user/gobanana` is missing). |
| Lane 2C, gallery wide | Isolate English demo copy in rtl pages | Changes every rtl screenshot. A gallery decision: the Dialog way (`DemoCase lang="en"`) is the candidate. |
| Lane 3D 4, order 1.15 5 | Arabic register for built in counts; `text.ar` | HUMAN GATE 4, the owner's register decision. |
| Lanes 2A 1, 3A 5, 4B 1, 6A 3, 6C 3, 7A 7, 7B 7, 7C 2 | Regenerate on merge | `npm run gen` and `npm run check` now do it on every run. |
| Lane 6C 2, order 1.15 6 | STATE.md | Not this pass's file. |

## Item 7. Contract suite

Full runs on the tree after item 6. Reports committed:
`docs/reports/contract-react.json` and `docs/reports/contract-angular.json`.

| Framework | Components | Passed | Failed | Skipped | Time |
| --- | --- | --- | --- | --- | --- |
| React | 107 manifests: 103 pass, 2 fail, 2 skip (Bidi, Theme) | 3291 | 3 | 143 | 44 min |
| Angular | Button, Dialog, IconButton pass; Theme skips | 102 | 0 | 1 | 38 s |

Consolidation 1 had 6 React failures (reflow at 320px for Meter,
NotificationCenter and ScrollArea). All 6 pass now.

Failures, with their owners:

| Test | Failure | Owner | Notes |
| --- | --- | --- | --- |
| Popover: anatomy, neutral | Trigger 7, "Open popover on end", adds no open `[data-ds=popover]` | Popover owner (lane 6B) | Flaky: a rerun of Popover alone passes 44 of 44. The end placed trigger is the one to look at; it may open after the 5s poll or close on the scroll that brings it into view. |
| Sidebar: axe, neutral light ar rtl | `target-size` (serious): the `#folder-8` item link in the `too-many` case is under 24px or too close to its neighbors | Sidebar owner (lane 7A) | Fails the same way in two reruns. Only in Neutral and only in rtl: Neutral opens at comfortable density. Not caused by this pass: the failure stays with the DemoGrid change reverted, Sidebar.css was not touched, and the token changes here keep the values each component had. The old report has no Sidebar, so this is its first full run. |
| Sidebar: axe, neutral dark ar rtl | The same | Sidebar owner (lane 7A) | The same |

The Angular gallery has field, input, title-bar and window-controls folders,
but their manifests do not mark Angular `ready`, so the suite runs three
components.

## For the lead

- **Waiting on the owner:** whether `tsx` and `typescript` become runtime
  dependencies of the CLI (item 4); the Arabic register for built in words
  and a `text.ar` manifest key (HUMAN GATE 4); approval of Neutral, after
  which it joins the contract suite's single runs.
- **Orders to write:**
  - List family popups: fold the MultiSelect and TagField popup CSS into
    Combobox.css and its Desk recipe (lane 3D 1), with before and after
    shots. Move `usePopupLayer` to `packages/react/src/internal/`.
  - Small moves: `filterListBoxItems` and `matchShortcut` to
    `packages/shared`, export `MarkedLabel` from ListBox and drop the
    CommandPalette copy, the ProgressBar contrast test helper to a shared
    test folder.
  - Button family: `--_button-font-weight` and `--_button-decoration`, then
    Sidebar, Navbar, Accordion and Stepper set them instead of writing
    declarations; `label` required with `icon` on ToggleButton,
    ToggleGroupItem and SegmentedControlItem.
  - Tooltips where lanes marked them (IconButton default, Sidebar and Rail
    collapsed items, Toolbar icon items, cut Tabs labels), with the Angular
    Tooltip so the IconButton DOM stays equal in both frameworks.
  - CloseButton swaps: Dialog and Drawer (with the Angular Dialog), SearchField
    clear, Chip remove, Window close.
  - Toolbar: pass the system `disabled` now that inert Buttons hand on
    navigation keys, and drop `inertProps`.
  - Button plays `press` on the web (the manifests now name it).
  - Motion owner: the Neutral 150 to 200ms preset test; Stat plays
    `number-roll`; loops get `pauseLoops` (order 1.21).
- **For the owners named in item 7:** the Sidebar target size in Neutral rtl
  and the flaky Popover end trigger.
- **Gallery, outside this pass's files:** `gallery.css` should leave
  `[data-part='link']` alone (batch 8-9, 2); a base path for the React
  gallery so the docs can ship it (order 1.15, 2); `data-demo="narrow"`; a
  ruling on English demo copy in rtl pages (the Dialog way is the
  candidate).
- **Routed:** `process.env.NODE_ENV` in DialogBase and Tooltip (order 1.13,
  4); Slider on `formatNumber`; the Toast language gap; the ErrorState native
  role; SkeletonGroup needs an order.
- **STATE.md:** this pass changed no order's status. Orders 1.13 to 1.15
  asked for STATE lines; they are yours.
- **GoBanana is not in this container**, so no copy or source check against
  it was possible (lanes 1D and 7C asked).
