# Interaction round 2, family (c): selection controls and lists

Order 1.22. Agent: ds-component, family (c), claude-opus-5-5 at medium.
Branch `claude/ds-order-1-22`. Every interaction here is **proposed**: it
waits for the owner.

Components: Checkbox, CheckboxGroup, RadioGroup, RadioCard, Slider,
RangeSlider, Select, Combobox, Autocomplete, MultiSelect, TagField, ListBox,
List, Chip, FilterBar.

## 1. Interactions

Timings are token names with the base values per style in the order
Neutral, Desk, Studio. Under `prefers-reduced-motion` and under
`:root[data-motion='reduce']` every duration and delay token is 0ms, and the
CSS reduced blocks below set the size changes to 1 as well.

| Id | Components | Trigger | Beats | Reduced form | Files |
| --- | --- | --- | --- | --- | --- |
| `check-draw` (round 1 id, reworked) | Checkbox, CheckboxGroup | Press and check a box; select all | Anticipation: the box (indicator, not the target) dips to `scale.anticipate` (0.95, 0.9, 0.97) over `duration.instant` (70ms) on `ease.out` while the control or label is `:active`. Action: on release the fill shows at once; the clip and the counter moving mark run on `ease.spring-bouncy` over `duration.spring-bouncy` (220, 440, 120ms). Overshoot: the mark grows from `scale.morph` (0.5, 0.3, 0.8) past its size; the box springs back past its size on the same spring. Stagger: under select all, box n waits n `delay.stagger` (24, 45, 0ms), capped at 6. Exit: the mark fades over `duration.fast` (80ms), then the clip jumps back with `step-end` | Mark at once, no dip | Checkbox.css, CheckboxGroup.tsx |
| `radio-pop` | RadioGroup | Press and pick | Anticipation: the circle dips to `scale.anticipate` over `duration.instant`. Action and overshoot: the new dot grows from `scale.morph` on the bouncy spring. Secondary: the old dot shrinks and fades over `duration.quick` (100ms) on `ease.exit`, faster than the land | Dot at once, no dip | RadioGroup.css |
| `radio-card-lift` | RadioCard | Press and pick a card | Anticipation: the card dips to `scale.press` (0.97). Action and overshoot: the chosen card rises by `distance.lift` (2, 4, 0px) on the bouncy spring and stays up; the card it leaves settles on `ease.spring-soft` over `duration.spring-soft` (220, 340, 100ms). Secondary: its dot (a new aria-hidden span inside the indicator) pops as in radio-pop | No lift, no dip, dot at once | RadioCard.css, RadioCard.tsx |
| `slider-pull` (round 1 id, reworked) | Slider, RangeSlider | Hold a thumb, let go | Action: the thumb grows to `scale.stretch` (1.15, 1.3, 1.08) on `ease.spring-snappy` over `duration.spring-snappy` (180, 300, 80ms). Release: it returns on the bouncy spring, under its size and back | No lift | Slider.css |
| `slider-bubble` | Slider, RangeSlider | Hold a thumb and move it | Action and overshoot: an aria-hidden bubble inside the thumb rises from `distance.enter` and grows from `scale.morph` on the bouncy spring. Secondary: its digits roll (`rollDigits`, snappy spring, columns one `delay.stagger` apart, up when the value grows). Exit: `duration.quick` on `ease.exit`. The thumb keeps `aria-valuetext`, the value output keeps the text | Bubble shows at once, digits fade | Slider.css, Slider.tsx |
| `slider-nudge` (round 1, kept) | Slider, RangeSlider | A key or a drag past an end | Unchanged, added on top of the lift | None | Slider.tsx |
| `picker-chevron-turn` | Select, Combobox (and Autocomplete has no trigger), MultiSelect | The list opens or closes | The trigger icon turns to 180deg on the snappy spring and back | Turns at once | Select.css, Combobox.css, MultiSelect.css |
| `menu-rows` | Select, Combobox, Autocomplete, MultiSelect, TagField | The popup opens | After the surface (menu-scale, unchanged) the first 12 rows rise from `distance.enter` (6, 12, 4px) and fade on `ease.spring-soft`, row n after n plus 1 `delay.stagger`, capped at 6 steps (`staggerGroup`). Only on open: results that change while open do not stagger. Every row is in the DOM and pickable from the first frame | Rows fade together | selectionMotion.ts, Select.tsx, ComboboxBase.tsx, MultiSelect.tsx, TagField.tsx |
| `picker-value-roll` | Select | A new value is picked | The value part rises from `distance.enter` and fades in on the snappy spring (`staggerGroup`, one part); the value part clips it | Fade | Select.tsx |
| `row-glide` | ListBox (so Combobox, Autocomplete, MultiSelect, TagField and any ListBox owner), Select, List | The lit row changes: highlight by pointer or keys; hover between linked List rows | Each row holds an unnamed aria-hidden span as a fill layer under its content. The new lit row's layer travels from the old row's layer box on the snappy spring with a stretch to `scale.stretch` on the block axis at the middle (`flipPlay` with `scale` and `stretch: 'y'`). The rows, the hit areas and the ring never move; the new row is lit from the first frame | The fill moves at once | selectionMotion.ts, ListBox.tsx/.css, Select.tsx/.css, List.tsx/.css |
| `collection-flip` | List, TagField, MultiSelect (trigger tags), FilterBar (bar parts and chips), Chip (in a FilterBar) | Items added, removed or moved | Moved items travel from their old box on the snappy spring. New items rise from `distance.shift` and grow from `scale.enter` on the bouncy spring, one stagger step apart. A removed item is drawn again by an inert, aria-hidden clone with no ids that shrinks to `scale.enter` and fades over `duration.quick` on `ease.exit` (`flipExit`), while the rest close the gap. First paint and rows arriving in an empty list play nothing (List keeps `list-stagger` for that). Focus moves first, as before (TagField and FilterBar already do it) | Nothing travels; enter and exit fade | selectionMotion.ts, List.tsx, TagField.tsx, MultiSelect.tsx, FilterBar.tsx |
| `chip-check-pop` | Chip, FilterBar | A pressable chip is selected or cleared | The chip glyph turns in from minus 45 degrees and grows from `scale.morph` on the bouncy spring (`iconMorph`); in a FilterBar the chips after it make room (collection-flip). The press is the existing button press | Glyph fades in | Chip.tsx |
| `filter-count-roll` | FilterBar | The active or result count changes | The count part now holds a visually hidden copy (read) and an aria-hidden copy (drawn) that rolls digit by digit (`rollDigits`, up or down from the numbers). The polite announcement is unchanged | Changed characters fade | FilterBar.tsx |
| `list-stagger` (round 1, kept) | List | First paint | Unchanged | Fade | List.tsx |

Registry: `packages/motion/src/interactions/selection.ts` (round 2 rows with
`beats`, `styles`, `primitive`, `reduced`, `off`). Stages:
`apps/gallery-react/src/interactions/selection.tsx`, one per id, each with
`data-interaction-trigger`.

Shared helper (not exported): `packages/react/src/components/ListBox/selectionMotion.ts`
with `useRowGlide` (a ref callback; a MutationObserver on `data-highlighted`
or pointerover for hover), `useFlipGroup` (measures after each commit
relative to the container, so scroll is not read as a move; ghosts removed
items) and `useStaggerOnOpen`.

## 2. Decisions

- The glide layer lives inside each row, not one layer per list: a `ul`
  may only hold `li`, rows scroll with their list for free, and the color
  stays the row's own private property. The new row's layer flies from the
  old one's box.
- In ListBox alone (roving focus) the glide follows the highlight, which
  is keyboard focus; the pointer hover keeps the round 1 veil. In an owner
  (virtual focus) the pointer moves the highlight, so the glide follows the
  pointer. The glide now also plays in CommandPalette, which renders ListBox.
- TagField tags are now keyed by the tag (tags are unique by `hasTag`)
  instead of index plus tag, so a removal keeps the elements of the tags
  after it and they can travel.
- FilterBar's count part now holds two spans (visually hidden text, aria
  hidden roll). The part's `textContent` doubles; the unit tests read the
  hidden span.
- The release spring of the slider thumb is the bouncy spring, the lift the
  snappy one. The lift reads `scale.stretch`, the nearest token to the
  round 1 1.15 (`scale.lift` is 1.01 and reads as a card lift).
- The slider bubble starts a digit roll at most once every 120ms while a
  drag changes the value every frame; the steps between are written still.
  On the busy machine a drag on the full /interactions page cost about a
  second per pointer move before this.
- Readable staggers (the lead's rule): every stagger here plays through
  `staggerGroup`, `flipPlay` or `rollDigits`, so it inherits `stepsWithin`
  and `readableEnter`. The CheckboxGroup select all cascade (CSS) is capped
  at three steps. The `list-stagger` and `menu-rows` rows say so.
- CheckboxGroup "selection lifts slightly" is built as the select all
  cascade plus the box dip and land, not as a lift: a checked row that stays
  2px higher misaligns a column of boxes. RadioCard does lift.
- The ring layers of Checkbox, RadioGroup, RadioCard and Slider no longer
  fade (B1). The ring layers of Select, Combobox, MultiSelect and TagField
  hold the glow and the ring together and still fade; they follow Input's
  fix in a later pass.

## 3. Review fixes of order 1.21 (added scope)

| Finding | Status | What |
| --- | --- | --- |
| B1 Checkbox | fixed | `::before` ring has no transition; test `Checkbox.motion.test.tsx` |
| B1 Slider | fixed | thumb `::before` ring has no transition; test `Slider.motion.test.tsx` |
| B2 (my files) | fixed | every reduced block in Checkbox, RadioGroup, RadioCard, Slider, Select, Combobox, MultiSelect and TagField CSS is repeated under `:root[data-motion='reduce']` (size changes to 1 included); tests in the motion test files |
| B5 | fixed | `[data-highlighted]` options take the ListBox inset ring (the focus ring color); test `ListBox.motion.test.tsx` |
| N10 | fixed for my files | Checkbox.css: no raw `0s` (step timing instead); Slider.css: `--ds-scale-stretch` replaces the window-enter calc; tests in the two motion test files |
| N20 | fixed | TagField.css no longer sets `--_list-box-option-ring`; test `ListBox.motion.test.tsx` |
| N25 | noted | Autocomplete opens through ComboboxBase, so `menu-rows` plays on its open too; the contract run below shows no skip change from this work |

## 4. Rejected ideas

| Idea | Why |
| --- | --- |
| One highlight layer per list container | Invalid in a `ul`, and needs scroll and RTL offsets; the per row layer does the same with less |
| A pop of the whole Chip on mount for standalone chips | No way to tell a first paint from an addition without a container; the FLIP lives in the containers this family owns |
| A transient lift of a checked row in CheckboxGroup | A keyframe on the checked state plays on first paint; a transition cannot come back on its own |
| A rolling Select value by digits | The value is a label, not a number; one part rise reads as the roll |

## 5. Needs a rule change

| Idea | Property | Built instead |
| --- | --- | --- |
| The glide layer that grows its height between rows of different height | `block-size` | `flipPlay` with `scale: true` (a transform scale of the layer) |
| A slider bubble that tints with the fill as it fills | `background-color` | A still surface bubble (tooltip tokens) |
| A RadioCard lift with a deeper shadow | `box-shadow` | translate only |

## 6. Work for Angular and native

- CSS rules that need a React inner element degrade to the round 1 look when
  it is missing: the row fill layer (ListBox, Select, List), the RadioCard
  dot span, the Slider bubble span.
- Angular needs: the row fill span (first child of each ListBox option and
  List row) and a glide player (MutationObserver on `data-highlighted`,
  `flipPlay` from the old layer box); the RadioCard dot span; the Slider
  bubble span with `renderDigits` and `rollDigits`; the select all
  `--_checkbox-step` inline values in CheckboxGroup; the open stagger in the
  Combobox, Autocomplete, MultiSelect and TagField popups; a port of
  `useFlipGroup` for List, TagField, MultiSelect and FilterBar; the FilterBar
  count as two spans with the roll; Chip `iconMorph` on a selected change.
- CSS only interactions (check-draw, radio-pop, radio-card-lift, slider-pull,
  picker-chevron-turn) play in Angular as is.
- Native: the bubble roll and the glide map to Reanimated layout transitions;
  not built.

## 7. Token requests

None new. The work uses only the order 1.22 tokens.

## 8. Preset rows needed from the lead

None required: every row reads its feel from the style tokens (Studio's
stagger is 0ms and its springs are steps). If the owner wants Studio
flatter: `studio`, `row-glide`, `reduced`; `studio`, `radio-card-lift`
already plays no lift through `distance.lift` 0.

## 9. Changes needed from the lead

None.

## 10. Proof

- `npx tsc --noEmit -p tsconfig.json`: clean.
- Family unit tests and `packages/motion/src/interactions.test.ts`: pass
  (Combobox, CheckboxGroup, CommandPalette rerun alone: 64 of 64). List,
  Slider and FilterBar tests were updated for the new motion; new files
  `*.motion.test.tsx` in Checkbox, CheckboxGroup, RadioGroup, Slider,
  ListBox, Select, FilterBar and List (one test per review fix).
- `npm run check`: every step passes except vitest, whose failures are in
  files other families own or are load timeouts that pass alone: the lint
  gates (raw `z-index: -1` in Breadcrumbs, CommandPalette, DropdownMenu,
  Menubar; a bare button in `angular/.../form-copy.spec.ts`; title and
  Tailwind gates timing out), PhoneField, Sidebar, `packages/cli` docs, and
  a Combobox and a CommandPalette test that pass when run alone. Machine
  load was about 55 on 4 cores during the run.
- Contract suite, react: all 15 components green. Checkbox, CheckboxGroup,
  Chip, Combobox, Autocomplete, FilterBar, ListBox, MultiSelect, RadioGroup,
  RangeSlider, Select and TagField in the first runs; List and RadioCard
  (one axe and one anatomy flake under load) green on rerun; Slider and
  TagField keyboard map timed out at 90s under load, then green alone. After
  the lead's readable stagger rule, `--component List,Slider` passed
  29 of 29 each, which covers List axe in Studio, Desk and Neutral.
- Recordings (960 px wide, VP9): `docs/reports/shots/interactions-2/selection.neutral.webm`
  (light, 3.5 MB), `selection.studio.webm` (dark, 3.0 MB),
  `selection.desk.webm` (dark, 4.0 MB). The script shows only this family
  on /interactions (the other families are hidden in the recording page),
  so the busy machine draws every frame.
- Frames read: the value bubble shows over the held thumb with the rolled
  value (Neutral 1,510 SAR, Studio 71%, Desk 69%); Desk Select rows mid
  stagger (two rows in, the rest arriving); the highlighted option carries
  the inset ring in ListBox and the popups (B5); hover fill on a linked List
  row; added reviewers and the tag Brand in place, Design removed; the
  FilterBar count "1 filter on, 91 results". Fixed after reading: the first
  Studio take was covered by a Vite error overlay from another family's
  file mid edit, retaken; the first takes stalled on slider drags, which led
  to the roll gap above and to hiding the other families while recording.
