# Wave 1, batch 3: selection (14)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 2 is green.

Every order also reads: `packages/react/src/components/Field/` (the control
context), GB css lines 402 to 528 (`.st-menu`, the option rows),
`packages/tokens/src/base/component.json` (`menu`, `list` tokens).

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 3A Checks and sliders | Checkbox, CheckboxGroup, Switch, Slider, RangeSlider | batch 2 green |
| 1 | 3B Radios | RadioGroup, RadioCard, Rating | batch 2 green |
| 1 | 3C List family | ListBox, Combobox, Autocomplete | batch 2 green |
| 2 | 3D Pickers | Select, MultiSelect, TagField | ListBox green and a slot free (slot 4 runs Angular A2 first) |

The popup of Combobox, Autocomplete, MultiSelect and TagField is a Radix
Popover Content carrying `data-part="popup"` with a ListBox root inside.
Filtering lives in `packages/shared/src/filter.ts` (owned by 1.3.11).

## 1.3.1 Checkbox

- Goal: one on or off choice, with an indeterminate state.
- Behavior: Radix Checkbox.
- Anatomy: root (`data-ds="checkbox"`), `control` (the box), `indicator`
  (check or minus icon), `label`, `description`.
- Axes: size (`sm`, `md`, `lg`), tone (`neutral`, `accent`, `danger`).
- States: `data-state` (`checked`, `unchecked`, `indeterminate`),
  `data-disabled`, `data-invalid`, `data-readonly`.
- Keys: Space toggles (Enter does not, as native).
- Read: FK2 `Checkbox/` (all files), GB `TakedownForm.tsx` line 275 (path in
  batch 2, 1.2.4).
- Owns: standard set for Checkbox.
- Depends: none.
- Accept: checklist; the 16px box sits in a 24px target (the label extends
  it); the check is an icon, never color alone.

## 1.3.2 CheckboxGroup

- Goal: several checkboxes under one question with one value array.
- Behavior: hand built on Checkbox; a `fieldset` with `legend`.
- Anatomy: root (`data-ds="checkbox-group"`), `legend`, `description`,
  `items`, `error` (a FieldError root).
- Axes: size (to items).
- States: `data-orientation`, `data-disabled`, `data-invalid`.
- Keys: Tab moves between checkboxes; Space toggles.
- Read: GB `TakedownForm.tsx`.
- Owns: standard set for CheckboxGroup.
- Depends: 1.3.1 (same lane).
- Accept: checklist; an optional "select all" item is indeterminate when
  some are checked.

## 1.3.3 RadioGroup

- Goal: one choice among a few visible options.
- Behavior: Radix RadioGroup.
- Anatomy: root (`data-ds="radio-group"`), `legend`, `item`, `control`,
  `indicator`, `label`, `description`.
- Axes: size (`sm`, `md`, `lg`), tone (`neutral`, `accent`).
- States: items `data-state` (`checked`, `unchecked`), `data-disabled`,
  `data-invalid`; root `data-orientation`.
- Keys: Tab enters the group at the checked item; arrows move and select
  (reading direction in RTL); Space selects.
- Read: GB `TakedownForm.tsx` lines 216 to 240.
- Owns: standard set for RadioGroup.
- Depends: none.
- Accept: checklist; `contract.keys` hints for arrows as `value-changes`.

## 1.3.4 RadioCard

- Goal: a radio choice drawn as a card with a title, text and an optional
  icon (plans, shipping options).
- Behavior: Radix RadioGroup.
- Anatomy: root (`data-ds="radio-card"`, the group), `item`, `indicator`,
  `icon`, `title`, `description`, `end`.
- Axes: size, tone.
- States: as RadioGroup.
- Keys: as RadioGroup.
- Read: no source: design from the dials table and the nearest existing
  component (RadioGroup, and Tile in GB css lines 974 to 1066).
- Owns: standard set for RadioCard.
- Depends: 1.3.3 (same lane).
- Accept: checklist; the checked card shows a border change and the
  indicator, not color alone; the whole card is the target.

## 1.3.5 Switch

- Goal: an immediate on or off setting.
- Behavior: Radix Switch.
- Anatomy: root (`data-ds="switch"`), `track`, `thumb`, `label`,
  `description`, `state-text` (optional On and Off words).
- Axes: size (`sm`, `md`, `lg`), tone (`accent`).
- States: `data-state` (`checked`, `unchecked`), `data-disabled`,
  `data-readonly`.
- Keys: Space and Enter toggle.
- Read: FK2 `Switch/` (all files), GB admin/`TelemetrySwitch.tsx`.
- Owns: standard set for Switch.
- Depends: 1.3.2 (same lane).
- Accept: checklist; the thumb side and the track fill show the state, not
  color alone; the thumb moves to the inline end in RTL; `insteadUse` points
  a form value that saves later to Checkbox.

## 1.3.6 Select

- Goal: one value from a list in a closed trigger.
- Behavior: Radix Select.
- Anatomy: root (`data-ds="select"`, the trigger box), `value`, `icon`
  (chevrons-up-down), `content` (the popup), `viewport`, `item`,
  `indicator`, `group`, `label`, `separator`, `scroll-up`, `scroll-down`.
- Axes: size, shape (pill trigger in Studio and Desk through tokens).
- States: `data-state` (`open`, `closed`), `data-placeholder`,
  `data-invalid`, `data-disabled`; items `data-highlighted`,
  `data-state`.
- Keys: Space, Enter, ArrowDown and ArrowUp open; arrows move; typeahead;
  Enter selects; Escape closes.
- Read: FK2 `Select/` (all files, `selectKeyboard.ts`), GB css `.st-menu`.
- Owns: standard set for Select.
- Depends: none (lane 3D).
- Accept: checklist; option rows equal ListBox option rows in size and
  tokens (compare screenshots); `insteadUse` points a long list to Combobox.

## 1.3.7 Combobox

- Goal: pick one value from a long list by typing to filter.
- Behavior: hand built on ListBox (1.3.11) and Radix Popover; ARIA 1.2
  combobox with `aria-activedescendant`.
- Anatomy: root (`data-ds="combobox"`), `control`, `trigger` (IconButton),
  `clear`, `popup` (a Popover content) holding a ListBox root, `empty`.
- Axes: size, shape.
- States: `data-state` (`open`, `closed`), `data-invalid`, `data-disabled`,
  `data-loading`.
- Keys: typing filters and opens; ArrowDown and ArrowUp move; Enter selects;
  Escape closes, a second Escape clears; Alt+ArrowDown opens without moving.
- Shared: uses `filter.ts`.
- Read: FK2 `Select/SelectMenu.tsx`, FK2 `ContextMenu/MenuSearchHeader.tsx`.
- Owns: standard set for Combobox.
- Depends: 1.3.11 (same lane).
- Accept: checklist; Arabic input matches without diacritics and across alef
  forms; result count announced politely once per query; `contract.trigger`
  set.

## 1.3.8 Autocomplete

- Goal: free text with suggestions (a city, a tag name) where any text is
  allowed.
- Behavior: hand built on ListBox and Radix Popover (list autocomplete).
- Anatomy: root (`data-ds="autocomplete"`), `control`, `popup`, `empty`.
- Axes: size, shape.
- States: as Combobox.
- Keys: as Combobox; Enter with no highlighted option submits the typed text.
- Read: no source: design from the dials table and the nearest existing
  component (Combobox).
- Owns: standard set for Autocomplete.
- Depends: 1.3.7 (same lane).
- Accept: checklist; `insteadUse` explains Combobox (value must be in the
  list) against Autocomplete (any text).

## 1.3.9 MultiSelect

- Goal: several values from a list, shown as a count or tags in the trigger.
- Behavior: hand built on ListBox (multiple) and Radix Popover.
- Anatomy: root (`data-ds="multi-select"`), `trigger`, `value` (summary),
  `tag` (repeated), `popup`, `search` (a SearchField root), `actions`
  (select all, clear).
- Axes: size, shape.
- States: `data-state`, `data-invalid`, `data-disabled`.
- Keys: in the list Space toggles an option, Enter closes; Ctrl+A selects
  all; Escape closes.
- Read: no source: design from the dials table and the nearest existing
  component (Select, ListBox).
- Owns: standard set for MultiSelect.
- Depends: 1.3.11, 1.3.6 (same lane).
- Accept: checklist; summary says "3 selected" (pluralized in Arabic with
  `Intl.PluralRules`); `slots` notes a max visible tag count.

## 1.3.10 TagField

- Goal: type and add free tags, with optional suggestions.
- Behavior: hand built; suggestions through ListBox and Radix Popover.
- Anatomy: root (`data-ds="tag-field"`), `tag` (repeated), `tag-label`,
  `tag-remove` (CloseButton root), `control`, `popup`.
- Axes: size, shape.
- States: `data-invalid`, `data-disabled`, `data-readonly`.
- Keys: Enter or comma (and the Arabic comma) adds; Backspace on an empty
  control focuses the last tag, a second Backspace removes it; ArrowLeft and
  ArrowRight move between tags (reading direction).
- Shared: `packages/shared/src/tags.ts`: split on comma, Arabic comma and new
  line; trim; dedupe case and diacritic insensitive.
- Read: FK2 `TagPill/` (all files), FK2 `AddablePropertyField/`.
- Owns: standard set for TagField, `packages/shared/src/tags.ts`.
- Depends: 1.3.9 (same lane).
- Accept: checklist; every tag remove has a name ("Remove tag design");
  removal announced once.

## 1.3.11 ListBox

- Goal: the shared option list: single or multiple selection, groups,
  descriptions, used inline and inside the popups of the list family and
  CommandPalette.
- Behavior: hand built; `role="listbox"`, options `role="option"`, focus
  stays on the owner (`aria-activedescendant`) when inside a combobox, or
  roving on the list when alone.
- Anatomy: root (`data-ds="list-box"`), `group`, `group-label`, `option`,
  `option-icon`, `option-label`, `option-description`, `indicator`,
  `empty`, `separator`.
- Axes: size (`sm`, `md`).
- States: `data-orientation`; options `data-highlighted`, `data-selected`,
  `data-disabled`.
- Keys: ArrowDown and ArrowUp; Home and End; typeahead; Space toggles in
  multiple; Enter selects.
- Shared: `packages/shared/src/filter.ts` (`normalize` for Arabic: strip
  diacritics and tatweel, unify alef forms, `matchRanges` for highlighting,
  `filterItems` with prefix first ranking) and
  `packages/shared/src/listbox.ts` (next enabled index with wrap, typeahead
  buffer, selection model for single and multiple). No DOM in either.
- Read: GB css lines 449 to 528, FK2 `Select/selectKeyboard.ts`, FK2
  `Select/useSelectValue.ts`, FK2 `ContextMenu/MenuSearchHeader.tsx`.
- Owns: standard set for ListBox, `packages/shared/src/{filter,listbox}.ts`.
- Depends: none.
- Accept: checklist; the matched part of an option is marked with `mark`, not
  color alone; 1000 options filter in under 16ms in a unit test (no
  virtualization in wave 1, noted in the manifest).

## 1.3.12 Slider

- Goal: one value on a range.
- Behavior: Radix Slider.
- Anatomy: root (`data-ds="slider"`), `track`, `range`, `thumb`, `label`,
  `value` (output), `marks`.
- Axes: size (`sm`, `md`, `lg`), tone (`accent`).
- States: `data-orientation`, `data-disabled`, `data-dragging`.
- Keys: arrows by step (reading direction in RTL), PageUp and PageDown by
  ten steps, Home and End. The drag has this key path (WCAG 2.5.7).
- Read: no source: design from the dials table and the nearest existing
  component (Switch track and thumb).
- Owns: standard set for Slider.
- Depends: 1.3.5 (same lane).
- Accept: checklist; the thumb is a 24px target; `aria-valuetext` uses
  `number.ts` formatting with the unit.

## 1.3.13 RangeSlider

- Goal: a low and high value on one track (price range).
- Behavior: Radix Slider with two thumbs.
- Anatomy: as Slider, `thumb` repeated with `data-thumb="start"` and `"end"`.
- Axes: as Slider.
- States: as Slider.
- Keys: as Slider per thumb; thumbs cannot cross (`minStepsBetweenThumbs`).
- Read: no source: design from the dials table and the nearest existing
  component (Slider).
- Owns: standard set for RangeSlider.
- Depends: 1.3.12 (same lane).
- Accept: checklist; each thumb has its own name ("Minimum price", "Maximum
  price").

## 1.3.14 Rating

- Goal: pick or show a score from 1 to 5 (or 10).
- Behavior: Radix RadioGroup with star items; read only form is plain text
  plus icons with `role="img"` and a label.
- Anatomy: root (`data-ds="rating"`), `item`, `icon` (star, star-filled,
  star-half), `value` (text).
- Axes: size (`sm`, `md`, `lg`), tone (`accent`, `warning`).
- States: `data-readonly`, `data-disabled`; items `data-state`.
- Keys: arrows change the value (reading direction); Home and End.
- Read: GB admin/`FeedbackList.tsx` (rating display).
- Owns: standard set for Rating.
- Depends: 1.3.4 (same lane).
- Accept: checklist; half stars mirror in RTL; each item named "3 of 5
  stars"; never color alone (filled shape).
