# Lane 3C report: List family

Branch `claude/ds-lane-3c`. Orders 1.3.11 ListBox, 1.3.7 Combobox, 1.3.8
Autocomplete, from `docs/plan/wave-1-batch-3.md`. All three are built,
committed and pushed.

| Order | Commit | Check | Contract (react) | Axe, popup open (lane script) |
| --- | --- | --- | --- | --- |
| 1.3.11 ListBox | `8f11a0a`, fixes in `cad11ff` | green | 21 passed | n/a |
| 1.3.7 Combobox | `cad11ff`, fixes in `1f3ee90` | green | 21 passed, 10 skipped | 0 violations, 5 style combinations |
| 1.3.8 Autocomplete | `5e82e25` | green | 21 passed, 10 skipped | 0 violations, 5 style combinations |

The 10 skipped checks are the suite's "open" checks (target size open, axe
open), which run only for overlays. See "Decisions" below for why Combobox
and Autocomplete are not overlays to the suite, and how the open popup was
checked instead.

Screenshots: `docs/reports/shots/wave-1/{list-box,combobox,autocomplete}/`,
studio dark and light, desk dark and light, desk dark rtl ar; the Combobox
and Autocomplete folders also hold `*-open.png` with a typed query.

Sources: GoBanana and Figma-Killer-2 were not fetched in this session. The
rows follow the DropdownMenu surface, the fields follow Input, the keys
follow the ARIA 1.2 combobox and APG listbox patterns. The manifests say so.

## Files

- `packages/shared/src/filter.ts`, `filter.test.ts`
- `packages/shared/src/listbox.ts`, `listbox.test.ts`
- `packages/react/src/components/ListBox/` (ListBox.tsx, test, demo, index,
  samples.ts with the city and sort data the three demos share)
- `packages/react/src/components/Combobox/` (ComboboxBase.tsx, the base
  Autocomplete reuses; Combobox.tsx, test, demo, index)
- `packages/react/src/components/Autocomplete/` (Autocomplete.tsx, test,
  demo, index)
- `packages/css/src/components/{ListBox,Combobox,Autocomplete}.css`
- `packages/styles/desk/recipes/{ListBox,Combobox}.css`
- `packages/manifest/src/component/{ListBox,Combobox,Autocomplete}.manifest.json`
- `docs/reports/shots/wave-1/{list-box,combobox,autocomplete}/`
- Generated, refreshed with `npm run gen`: the barrels, `css/src/index.css`,
  `styles/desk/index.css`, `manifests.gen.json`, `routes.gen.ts`,
  `shared/src/index.ts`.

## Shared logic

`filter.ts`:

- `normalize(s)`: lower case, Latin accents dropped (NFD), Arabic
  diacritics, Quranic marks and tatweel dropped, alef forms to ا, ى to ي,
  ة to ه, ؤ to و, ئ to ي, Arabic Indic and Persian digits to Western, white
  space collapsed.
- `fold(s)` keeps, for each folded code unit, its source range, so
  `matchRanges(text, query)` returns a range in the original text. The range
  takes in the marks after its last letter, so a `mark` never splits a
  letter from its harakat.
- `filterItems(items, query, text)` ranks prefix, then word start, then
  anywhere, label before keywords, stable inside a rank. 1000 options filter
  in under 16ms (best of five runs in the test).

`listbox.ts`: `nextEnabledIndex` (with loop), `edgeEnabledIndex`,
`createTypeahead` (500ms buffer), `typeaheadIndex` (normalized, a repeated
letter cycles), `selectValue` (single, multiple), `selectAllValues`.

## ListBox

```ts
interface ListBoxOption { value: string; label: string; description?: string; start?: IconName | ReactElement; disabled?: boolean; keywords?: readonly string[] }
interface ListBoxSection { label: string; options: readonly ListBoxOption[]; key?: string }
type ListBoxItem = ListBoxOption | ListBoxSection;

type ListBoxProps = (Single | Multiple) & {
  items: readonly ListBoxItem[];
  size?: 'sm' | 'md';                       // md
  orientation?: 'vertical' | 'horizontal';  // vertical
  highlightedValue?: string | null;         // controlled cursor, for owners
  onHighlightedValueChange?: (v: string | null) => void;
  virtualFocus?: boolean;                   // false: roving tabindex; true: owner keeps focus, aria-activedescendant
  query?: string;                           // marks the match
  loop?: boolean;                           // false
  empty?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  onOptionSelect?: (value: string) => void;
} & Omit<ComponentProps<'div'>, ...>;       // aria-label or aria-labelledby required
type Single = { selectionMode?: 'single'; value?: string | null; defaultValue?: string | null; onValueChange?: (v: string | null) => void; allowEmpty?: boolean };
type Multiple = { selectionMode: 'multiple'; value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (v: string[]) => void };

// helpers for owners (MultiSelect, TagField, CommandPalette)
flattenListBoxItems(items): ListBoxOption[]
filterListBoxItems(items, query): ListBoxItem[]   // groups kept, empty groups dropped
listBoxOptionId(listId, value): string            // stable, collision free
isListBoxSection(item)
```

Anatomy: root, option, indicator, option-icon, option-label,
option-description, group, group-label, separator, empty.

## Combobox

```ts
interface ComboboxProps extends Omit<ComponentProps<'input'>, ...> {
  items: readonly ListBoxItem[];
  value?: string | null; defaultValue?: string | null; onValueChange?: (v: string | null) => void;
  inputValue?: string; defaultInputValue?: string; onInputValueChange?: (t: string) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (o: boolean) => void;
  size?: 'sm' | 'md' | 'lg';          // md
  shape?: 'default' | 'pill';         // default
  invalid?: boolean; disabled?: boolean; readOnly?: boolean; required?: boolean;  // follow Field
  loading?: boolean; loadingLabel?: string;          // "Loading options"
  empty?: ReactNode;                                 // "No results. Try another word."
  formatCount?: (count: number) => string;           // "3 results", Arabic plural forms
  loop?: boolean;                                    // true
  triggerLabel?: string;                             // "Show options"
  clearLabel?: string;                               // "Clear value"
  name?: string;                                     // hidden input
  className?; style?; rootProps?; ref?: Ref<HTMLInputElement>;
}
```

Anatomy: root, control, clear, trigger, status (the polite count, visually
hidden; added to the order's anatomy, because the count needs a home), popup,
empty.

## Autocomplete

```ts
interface AutocompleteProps extends Omit<ComboboxBaseProps, 'inputValue' | ...> {
  items: readonly ListBoxItem[];
  value?: string; defaultValue?: string; onValueChange?: (text: string) => void;
  onCommit?: (text: string) => void;   // Enter with nothing highlighted; the form still submits
  empty?: ReactNode;                   // default none: the popup closes when nothing matches
  name?: string;                       // on the input itself
  // size, shape, open, loading, formatCount, ... as Combobox
}
```

Anatomy: root, control, status, popup, empty. There is no trigger and no
clear button.

## Decisions

1. **The popup is its own root.** It is `data-ds="combobox|autocomplete"`
   plus `data-part="popup"`, like the DropdownMenu sub-content, because it is
   portaled out of the field. The themed portal follows the DropdownMenu
   pattern. `data-state` (open, closed) is on the popup root only. The field
   shows open through `aria-expanded` on the input.
2. **No `contract.trigger` (a deviation from 1.3.7 "Accept").** With states
   open and closed plus a trigger, the suite treats Combobox as an overlay.
   It then requires a tab stop inside the opened root, and requires that a
   static example never stamps `data-state`. A combobox popup never takes
   focus, by the ARIA pattern. So Combobox and Autocomplete run as fields:
   - `contract.keys` hints check ArrowDown (aria-expanded changes) and
     Escape (the value clears) on the input.
   - Axe with the popup open ran from a lane Playwright script
     (`@axe-core/playwright`, wcag2a through wcag22aa, reduced motion) in all
     five style combinations: 0 violations.
   - **Lead:** sign off, or teach the suite a "combobox" overlay kind whose
     popup needs no tab stop.
3. **The popup sets the DropdownMenu `--_menu-*` surface properties** with
   the same defaults, and hands the row colors to the nested ListBox through
   its `--_list-box-*` properties. The Desk recipe for the popup repeats the
   Desk menu glass. DropdownMenu files were not edited.
4. **`Combobox.css` holds the list family popup** for both components,
   through `:is([data-ds='combobox'], [data-ds='autocomplete'])`.
   `Autocomplete.css` is a thin file, as anatomy rule 10 allows.
5. **z-index is `z.menu`, not `z.dropdown`.** `z.dropdown` is 20, so a
   Combobox in a Dialog (9500) would open under it.
6. **An empty ListBox is `role="group"`.** Axe fails a listbox with no
   option (`aria-required-children`), so the empty root keeps its name and
   holds the empty text.
7. **ListBox md rows are `list.row.height`** (24, 28, 32px by density), as
   the menus use `menu.item.height`. This is not the 32px md of anatomy
   rule 12, which is about controls; a list row is not a control height.
8. **Select mode highlights the first match** while typing, so Enter picks
   it (APG list autocomplete with automatic selection). Free mode highlights
   nothing, so Enter keeps the text (without automatic selection).
9. **The result count is read once per query,** 400ms after typing pauses.
   The status empties first, so the same count after a new query is read
   again.
10. **Motion is `menu-scale` on all three manifests.** ListBox has no motion
    of its own: it rides in the popup, as its manifest note says.

## Token gaps

None blocking. These read existing tokens through `calc`:

- The ListBox alone shows 10 rows (`list.row.height * 10`).
- The popup shows 8 rows.

A `list.max-rows` or `menu.height.max` token would name them.

## Review findings

ListBox (fresh eyes, 2 blockers, 13 notes).

Fixed:
- Blocker: with virtualFocus, the highlight did not scroll into view.
- Blocker: `matchRanges` left trailing harakat outside the mark.
- Option ids could collide.
- A disabled list could not be moved through.
- The highlight stayed lit on blur, and Tab came back to a stale row.
- The Arabic regex is now written with `\u` escapes.
- The Angular behavior no longer names `cdk:listbox`.
- The manifest now names `filterListBoxItems`.
- Test gaps filled; the perf test is now the best of five runs.

Left open:
- Space is never part of a typeahead buffer.
- Lam-alef presentation forms and Persian ی and ک are not folded.
- The private names `-highlight`, `meta-fg`, `mark-weight`, `max-height` and
  `separator-color` go past the suffix list in anatomy.md. They mirror the
  DropdownMenu `--_menu-*` names. The lead decides whether to record them in
  DECISIONS.md.
- `overflow-x` and `overflow-y` are physical axes, as in DropdownMenu.css;
  the lint does not flag them.
- `filterListBoxItems` lives in the React package. Angular and native will
  need it; moving it to `packages/shared` is a small change for the lead to
  route.
- The manifest types `value` as string although multiple mode takes an
  array. The schema has no union type.

Combobox (fresh eyes, 1 blocker, 9 notes).

Fixed:
- Blocker: a press on the popup padding, a group label or the scrollbar
  closed the list and took focus out of the input.
- An IME Enter (keyCode 229) is now ignored.
- Alt+ArrowUp on a closed list now does nothing.
- The count is read again after a new query with the same count.
- An inline `formatCount` no longer restarts the timer.
- One filter pass per keystroke.
- Escape on an open state with nothing shown now clears.
- The source comment no longer claims sources that were not read.
- Tests added: form not submitted, IME, popup press, controlled props,
  Arabic diacritics and tatweel.

Recorded in the manifests:
- Inside a Dialog, the second Escape closes the Dialog: Radix handles Escape
  on the document first.
- Without a Field, the list needs `aria-label`.

Left open:
- A controlled `open` stays true while there is nothing to show (no match
  and `empty={null}`, or free mode with no suggestion). `aria-expanded` is
  false then, which is what assistive tech reads.

Autocomplete: see the addendum below.

## Changes needed from the lead

1. **The Combobox contract (decision 2).** Approve it in DECISIONS.md, or
   add a combobox overlay kind to `packages/contract-tests` whose opened root
   needs no tab stop. Then set `contract.trigger` on both manifests.
2. **The MultiSelect and TagField orders (lane 3D)** need an Owns line that
   lets them add `[data-ds='multi-select']` and `[data-ds='tag-field']` to
   the selector lists in `packages/css/src/components/Combobox.css` and
   `packages/styles/desk/recipes/Combobox.css`. They can reuse
   `ComboboxBase.tsx` only for a single text value; MultiSelect needs its own
   trigger and the ListBox in multiple mode.
3. **DECISIONS.md:**
   - the list family popup uses `z.menu`;
   - list rows follow `list.row.height`;
   - the private names in "Left open" above.
4. **Optional:** move `filterListBoxItems` from
   `packages/react/src/components/ListBox/ListBox.tsx` to
   `packages/shared/src/filter.ts` (pure data), and export it from there for
   Angular and native.

## What I could not do

- Read GoBanana and Figma-Killer-2: neither repo was fetched in this
  session.
- Run the suite's own "axe open" and "target size open" checks for Combobox
  and Autocomplete (decision 2). The lane axe script stands in for axe.
  Target size in the popup: rows are at least `size.target-min` by CSS, and
  the rows are ListBox rows, which pass in the ListBox contract.
- Check the Neutral style: it is not in this branch.

## Addendum: Autocomplete review

Fresh eyes, 3 blockers, 8 notes. Fixed in the commit after `4014af7`.

Blockers fixed:

- The Autocomplete padding rule lost to the shared rule in Combobox.css,
  because the barrel imports Autocomplete.css first. `[data-size]` now lifts
  it. The computed padding is even on both sides; checked in the browser.
- In free mode, text with no match announced "No results". The count is now
  read only while the popup shows.
- The Escape key text named a clear button that Autocomplete does not have.

Notes fixed:

- The closing popup no longer flashes the default empty text in free mode:
  ComboboxBase resolves the empty content once, as `emptyContent`.
- Manifest wording: placeholder, "An Autocomplete", and Typing now says
  "or when empty is set". The `status` part is explained in `a11y.notes`.
- A duplicate comment in ComboboxBase was removed.
- Tests added: Enter lets the form submit with nothing highlighted, and does
  not on a suggestion; Escape clears at once when nothing shows; the status
  stays silent when nothing matches; Alt+ArrowUp chooses.

Left open:

- The token list matches Combobox's. The Desk popup recipe does use the
  primary fill and ring tokens for Autocomplete too, so the list stays.

After the fixes: `npm run check` green, contract green for all three
components, lane axe with the popup open shows 0 violations, and the
Autocomplete screenshots are retaken.
