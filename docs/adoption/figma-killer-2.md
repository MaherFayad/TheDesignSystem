# Adoption guide: Figma-Killer-2

How Figma-Killer-2 (FK2) moves from its own `src/ui/components` to the
system. Written in order 1.19 from a read only clone of
`maherfayad-stack/figma-killer-2` at commit `51b1994` (2026-09-18), the
contracts in `docs/contracts/`, the wave 1 orders and the manifests. Nothing
under `vendor/alm-design-system` was read.

Real adoption is a HUMAN GATE: the owner decides at the end of wave 1 whether
and when FK2 starts. This guide is the plan, not the change.

## What FK2 is today

- Vite 8 and React 19, TypeScript 6, built with `tsc -b` and a Bun script.
- 50 component folders under `src/ui/components`, styled with CSS Modules and
  the custom properties in `src/styles/globals.css`.
- Light theme through `[data-editor-theme='light']` on the root.
- No Radix and no other headless library: menus, selects, tooltips and
  dialogs are hand built.
- Already on `@fontsource-variable/inter`, the font of Studio.
- Icons from `pixel-art-icons` and the local `ElementIcons` and
  `InspectorIcons` folders.

The consumer that matches FK2 is `examples/consumer-vite`. Copy from it.

## What to install

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0"
}
```

`@the-system/react` brings `radix-ui` and `react-aria-components` (behavior),
`@the-system/icons`, `@the-system/motion` and `@the-system/shared`.
`@the-system/styles` brings the fonts (Inter, Instrument Sans, IBM Plex Sans
Arabic). React and React DOM stay FK2's own (peer dependencies, React 19).

The packages export TypeScript and CSS source. Vite compiles them with no
config beyond the React plugin.

For the checker and agent files, also add `@the-system/cli` as a dev
dependency (the `ds` binary).

## CSS import order

At the top of the entry file, before any other import that carries CSS:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

The system draws in cascade layers (`ds.reset`, `ds.tokens`, `ds.base`,
`ds.recipes`, `ds.overrides`). FK2's CSS Modules are not in a layer, so they
win over every system rule without `!important`. That is how a product
override works; it is also why a leftover module rule can hide a system style
during the move. Delete the module rule when its component moves.

Keep `globals.css` while components move. It goes last, in the step "Tokens
off globals.css" below.

## Root Theme

Stamp `<html>` before React renders, then render one root `Theme` with the
same axes, then the `Toaster` and one `TooltipProvider`:

```tsx
import { Theme, Toaster, TooltipProvider, themeAttributes } from '@the-system/react';

for (const [name, value] of Object.entries(themeAttributes({ style: 'studio', scheme, lang })))
  document.documentElement.setAttribute(name, value);

<Theme style="studio" scheme={scheme} lang={lang} density="compact">
  <Toaster />
  <TooltipProvider>{app}</TooltipProvider>
</Theme>
```

- `[data-editor-theme='light']` becomes `scheme="light"` (`data-scheme`).
- FK2 is an editor: `density="compact"` keeps controls at 28px (see the
  risks).
- Dialog, Toast, Tooltip and menu portals copy the root Theme, so they theme
  themselves outside the app tree.

## Component map

Every FK2 component folder with a system replacement. "Files" is how many
files in FK2 `src` import the folder (a grep at the commit above), so the
count is a guide to effort, not exact.

| FK2 folder | System component | Order | Files | Notes |
| --- | --- | --- | --- | --- |
| `Button/` | Button, IconButton | 0.9, 1.1.1, 1.1.2 | 248 | Icon only buttons become IconButton with a `label`. |
| `Toast/` (`ToastProvider`, `toastBus`) | Toast, `toast()` | 0.12, 1.5.4 | 106 | The bus keeps its shape: `toast(title, { description, action })`. |
| `Input/` | Input | 0.10, 1.2.3 | 82 | Wrap each in a Field for its label. |
| `ContextMenu/` | ContextMenu, DropdownMenu | 1.6.9, 1.6.8 | 48 | Right click menus to ContextMenu, button menus to DropdownMenu. `ContextMenuSubmenu` becomes a `Sub`. |
| `ContextMenu/MenuSearchHeader.tsx` | CommandPalette, Combobox, ListBox | 1.6.11, 1.3.7, 1.3.11 | | A menu with a search field is a Combobox or a CommandPalette. |
| `Select/` | Select | 1.3.6 | 43 | `SelectMenu` with typing is a Combobox (1.3.7). `selectKeyboard.ts` and `useSelectValue.ts` are replaced by the ListBox behavior (1.3.11). |
| `Dialog/` | Dialog, AlertDialog | 0.11, 1.6.1, 1.6.2 | 41 | A delete confirm is a Dialog with `tone="danger"` or an AlertDialog. |
| `ControlRow/` | DescriptionList | 1.9.8 | 27 | The 28px row and 100px label width are tokens (`control-row.height`, `control-row.label.width`). |
| `SegmentedControl/` | SegmentedControl | 1.1.7 | 26 | |
| `EmptyState/` | EmptyState | 1.9.12 | 26 | |
| `Section/` | Section, Sidebar | 1.8.4, 1.7.2 | 25 | Collapsible inspector groups follow Sidebar's groups. |
| `Skeleton/` | Skeleton | 1.5.8 | 23 | |
| `SearchBar/` | SearchField | 1.2.7 | 18 | |
| `ScrubInput/` | ScrubInput, NumberField | 1.2.6, 1.2.5 | 18 | `numericExpression.ts` and `scrubMath.ts` moved into the system. |
| `Switch/` | Switch | 1.3.5 | 17 | |
| `Tooltip/` | Tooltip | 1.6.6 | 16 | `CursorTooltip.tsx` has no system match yet: keep it. |
| `Checkbox/` | Checkbox, CheckboxGroup | 1.3.1, 1.3.2 | 14 | |
| `Card/` | Card | 1.9.9 | 10 | |
| `PropertyList/` | DescriptionList, List | 1.9.8, 1.9.7 | 9 | |
| `Kbd/` | Kbd | 1.9.5 | 6 | `splitShortcut.ts` moved into the system. |
| `VariableField/` | InlineEdit | 1.2.12 | 5 | The variable binding logic stays in FK2. |
| `TagPill/` | TagField, Chip, Badge | 1.3.10, 1.9.4, 1.9.3 | 5 | Removable pills in a field are TagField; a pressable pill is a Chip; a count or status is a Badge. |
| `Tabs/` | Tabs | 1.7.4 | 5 | |
| `FilterBar/` | FilterBar, ToggleGroup, ScrollArea | 1.4.5, 1.1.6, 1.8.7 | 5 | The edge fades are ScrollArea's. |
| `Separator/` | Separator | 1.8.6 | 3 | |
| `RangeTabs/` | SegmentedControl | 1.1.7 | 3 | |
| `FormField/` | Field, Label, FieldError, Form | 0.10, 1.2.1, 1.2.2, 1.4.3, 1.4.1 | 3 | |
| `AlignBar/` | Toolbar | 1.7.9 | 3 | |
| `Widget/` | Card, Surface | 1.9.9, 1.8.5 | 2 | |
| `SplitButton/` | SplitButton, ButtonGroup | 1.1.4, 1.1.3 | 2 | |
| `Alert/` | Alert, Callout | 1.5.1, 1.5.3 | 2 | Alert for a live message, Callout for static text. |
| `WidgetList/` | List | 1.9.7 | 1 | |
| `Stack/` | Stack | 1.8.1 | 1 | |
| `AddablePropertyField/` | TagField | 1.3.10 | 1 | |

Stay in FK2 for now (no system component in wave 1, or product specific):
`AlignGrid`, `CanvasModulePlaceholder`, `Code`, `ColorInput`,
`ColorPickerPopover`, `DataTable`, `ElementIcons`, `ErrorBoundary`,
`ExpandableFieldCluster`, `FileUpload`, `Heading`, `InspectorIcons`,
`InspectorPopover`, `MixedValue`, `Text`, `charts`, and `Tooltip/CursorTooltip`.
`InspectorPopover` can sit on Popover (1.6.5) later; it was not a source of
that order, so check its behavior first. `AlmLogo` belongs to a third party:
leave it as it is.

## Order of replacement

1. **Install and import.** The packages, the three CSS imports and the root
   Theme, with `globals.css` still loaded. Nothing changes on screen yet,
   because no component uses the system.
2. **Run `ds doctor` once** and keep the report as the baseline (see below).
3. **Leaves with the most use first:** Button and IconButton, then Toast,
   then Input inside Field. These three are about 430 imports, and every
   later component draws on the Button base and the Field wiring.
4. **Overlays:** Dialog, then ContextMenu and DropdownMenu, Select, Tooltip.
   This is the step that adds Radix: focus traps, Escape, focus return and
   RTL arrow keys come with it, so test each screen by keyboard.
5. **Inspector controls:** ControlRow, PropertyList, ScrubInput,
   SegmentedControl, Switch, Checkbox, SearchBar, Section. Use
   `density="compact"` here.
6. **The rest of the map**, by file count.
7. **Tokens off `globals.css`.** Replace each `var(--old-name)` in FK2's own
   CSS Modules with its `--ds-*` name from
   `docs/contracts/token-mapping.md` (section "Figma-Killer-2 globals.css",
   50 rows; Studio values that FK2 shares with GoBanana are in the GoBanana
   section). The tokens FK2 keeps on purpose (syntax colours, device bezel,
   plugin tints, tree drop lines, text scale settings) are product tokens:
   move them to an FK2 file of their own, then delete `globals.css`.
8. **`ds doctor` clean**, then `ds init` for `AGENTS.md` and `DESIGN.md`.

Each step ships on its own. Delete the FK2 folder and its CSS Module in the
same change that moves its last import.

## Risks

1. **28px versus 32px.** FK2 controls are 28px (`--control-row-h`). The
   system default size is `md`, 32px in the default density, decided in
   wave 0 (`docs/reports/wave-0.md`, "Default size"). Without a choice, every
   inspector row grows by 4px. Fix: `density="compact"` on the editor's
   Theme, where `md` is 28px. `size="sm"` (28px in the default density)
   gets the same height one control at a time; the density does it once for
   the editor and keeps the components on their default size. Both 28px and
   32px pass WCAG 2.2 SC 2.5.8 (target size, 24px minimum).
2. **Desk glass contrast.** FK2 uses Studio, not Desk, so this applies only
   if FK2 opens in Desk. In Desk dark, muted and subtle text on glass
   measures 3.04 to 4.33, and window text over a white backdrop 3.02 to
   3.37, below the 4.5:1 of WCAG 2.2 SC 1.4.3. These are the GoBanana values,
   kept as known failures and waiting on the owner
   (`docs/reports/wave-0.md`, "Waiting on the owner", item 2). Keep bright
   canvas content from sitting behind a Desk window, or keep FK2 on Studio.
   Desk Light is still "proposed".
3. **Unlayered CSS wins.** A module rule left behind for a moved component
   overrides the system silently. Delete the rule with the component.
4. **Behavior changes with Radix.** Menus and selects gain typeahead, focus
   return and RTL arrows; a test that counted on the old focus order breaks.
   That is the fix, not a regression; update the test.
5. **Known system bugs from order 1.18** (`docs/reports/lanes/order-1-18.md`):
   a Tooltip whose hint repeats an IconButton's label drops the button's own
   `onClick`, and `ds doctor` reports a Tooltip around a DropdownMenu trigger,
   DropdownMenuContent, and FieldLabel or FieldError as Field children.
   `examples/consumer-vite/src/Boards.tsx` shows the workaround for each until
   the fixes land.
6. **The third party folder.** FK2 depends on `alm-design-system` and has
   `src/modules/alm/`. The system replaces none of it. Keep it out of the
   move.

## How to run `ds doctor`

From the FK2 root, with `@the-system/cli` installed:

```sh
npx ds doctor            # text: one line per finding, then a count
npx ds doctor src/ui     # one folder
npx ds doctor --json     # { apiVersion: 1, type: "doctor.report", data: { findings, summary } }
```

It exits with 1 when there is an error, so it can gate CI. The rules have
stable ids (`ds/no-raw-color`, `ds/no-raw-value`, `ds/token-vocabulary`,
`ds/logical-properties`, `ds/direction`, `ds/primitives`, `ds/no-radix-import`,
`ds/touch-target`, `ds/copy`, `ds/no-dash`, `ds/slot-limits`,
`ds/shared-axes`, `ds/no-native-title`). During the move, put a
`ds.doctor.json` at the root to skip the folders not yet moved:

```json
{ "exclude": ["src/admin", "src/modules"] }
```

Remove each entry as its folder moves. Turning a rule `"off"` is possible
(`"rules": { "ds/copy": "off" }`) but hides real findings; prefer `exclude`.

## What was checked against the source

Checked in the clone: the stack (`package.json`), the component folders and
their files, the import counts, `[data-editor-theme='light']` in
`globals.css`, the use of `alm-design-system` outside `vendor/`. Not checked:
how each FK2 component behaves at runtime; the map follows the wave 1 orders
that read those folders.
