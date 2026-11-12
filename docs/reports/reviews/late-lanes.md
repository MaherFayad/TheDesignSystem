# Review: late lanes

Fresh eyes review by ds-qa of fourteen React components from batches 1, 2,
3, 4, 6 and 8: ToggleGroup, SegmentedControl, NumberField, ScrubInput,
Select, MultiSelect, TagField, Fieldset, Form, ConsentField, FilterBar,
CommandPalette, Lightbox and PageShell. Branch `claude/ds-review-late`, cut
from `claude/relaxed-hypatia-7gseap`. No component source, CSS, manifest,
token or test was edited. Four reviewers split the work (claude-opus-5-5 at
medium); the lead checked each blocker against the code or a screenshot
before it went into this file. The builders' lane reports were read only
after the findings were formed; where a finding repeats a point a lane left
open, it says so.

## Verdicts

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| ToggleGroup | fix needed | 2 | 3 |
| SegmentedControl | fix needed | 1 | 3 |
| NumberField | pass | 0 | 5 |
| ScrubInput | pass | 0 | 5 |
| Select | fix needed | 1 | 4 |
| MultiSelect | pass | 0 | 4 |
| TagField | fix needed | 3 | 4 |
| Form | fix needed | 3 | 2 |
| Fieldset | pass | 0 | 2 |
| FilterBar | fix needed | 1 | 4 |
| ConsentField | fix needed | 2 | 3 |
| CommandPalette | fix needed | 1 | 5 |
| Lightbox | fix needed | 3 | 4 |
| PageShell | pass | 0 | 5 |

Totals: 9 of 14 need a fix, 17 blockers.

`npm run check` is green on this branch. The contract command is green for
all fourteen; the per group output and the reason for every skip are under
each group below.

## Across the fourteen

Points that are not one component's defect, collected by the lead:

- note: `packages/contract-tests/src/contract.spec.ts:83`. `AXE_TAGS` has
  `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa` but not `wcag21a`, so the
  WCAG 2.1 level A rules (for example 2.5.1, 2.5.2, 2.5.3 checks) never run in
  the suite. Add the tag; the reviewers ran axe with it by hand and it found
  nothing new in these fourteen.
- note: the suite's "open" runs skip whenever a manifest has no
  `contract.trigger` or a demo has no `data-demo-trigger`. That hid the
  TagField suggestions and the FilterBar more menu (15 skips each), and it
  opens only the variants case, which is why it never saw the empty Select
  listbox. Give TagField and FilterBar a trigger hint, and let the suite open
  the `empty` case too.
- note: `packages/css/src/components/ListBox.css:156`. The virtual focus
  highlight is a fill change of about 1.3:1 with no ring (TagField blocker
  below). Combobox and Autocomplete use the same rule and were not in scope;
  check them in the same fix.
- note: reflow at 320px fails in the two segmented controls (ToggleGroup
  attached, SegmentedControl) for the same reason: items never wrap and the
  Button label truncates. One shared decision (wrap, scroll, or fall back to
  Select below a width) should fix both.

## ToggleGroup, SegmentedControl, NumberField, ScrubInput

```text
npm run contract -- --framework react --component ToggleGroup,SegmentedControl,NumberField,ScrubInput
pass  NumberField: 29 passed, 0 failed, 0 skipped
pass  ScrubInput: 29 passed, 0 failed, 0 skipped
pass  SegmentedControl: 29 passed, 0 failed, 0 skipped
pass  ToggleGroup: 29 passed, 0 failed, 0 skipped
```

The first combined run had one NumberField failure, "keyboard map", with
`page.goto: Test timeout of 90000ms exceeded`. Four reviewers were running
contract suites at the same time. A rerun of NumberField alone passed 29 of
29, and the same keys pass when driven by hand (below), so the failure was
load, not the component.

**What holds** across the four, checked in code and in Chromium against the
gallery on port 5310:

- Anatomy: `data-ds` roots; the items are ToggleButton roots carrying
  `data-part="item"`; NumberField's steppers are IconButton roots carrying
  `decrement` and `increment`. Every `data-part` rendered is in its manifest's
  `anatomy`, and every boolean state is present and empty (`data-attached=""`,
  `data-mixed=""`, `data-dragging=""` during a drag). The `states` lists match
  what is stamped, `data-orientation` included (Radix stamps it on the
  SegmentedControl root). React Aria's `"true"` data attributes are stripped.
  There is no bare `<button>` (the steppers come from IconButton) and no
  `title`.
- CSS: `@layer ds.base`, no `--ds-*` declared, logical properties only. The
  only animations are opacity fades and the thumb's `transform`. There is a
  reduced motion block and a forced colors block in every file, and the
  transparent outline is set only inside the focus selectors.
- Keyboard, driven by hand in LTR and in Arabic RTL. ToggleGroup and
  SegmentedControl have one tab stop and enter on the on item. The arrows
  move, wrap and reverse in RTL. Home and End work. ArrowDown and ArrowUp
  work in a vertical group. Space and Enter toggle in ToggleGroup and do
  nothing on SegmentedControl's selected item. Disabled items keep focus, stay
  in the arrow order and never toggle or select. Shift+Tab leaves from a
  disabled item.
  - NumberField (Seats, 1 to 50): ArrowUp and ArrowDown step by 1, PageUp and
    PageDown by 10, Home goes to 1 and End to 50. Values clamp at the bounds.
  - ScrubInput: arrows step by 1, Shift by 10, Alt by 0.1. `12*2` then Enter
    gives 24 and keeps focus. Escape reverts typed text. `5em` in a px field
    is refused. `٤٠px` gives 40. A read only field does not nudge, and a
    mixed field waits for a typed value.
  - Fast key presses: with zero delay between presses, Playwright lost some
    direction changes in both groups. The losses stop at one frame (16 ms)
    between presses, so this comes from the test tool, not from the
    components.
- Motion: SegmentedControl's thumb plays `tab-indicator` through the Web
  Animations API, on `transform` only, for 140 ms. Under reduced motion it
  plays nothing and jumps. ToggleGroup, NumberField and ScrubInput name
  `none`, which the catalog test accepts, and they play nothing.
- Reflow and axe: at 320 px, the document `scrollWidth` is 320 in every
  combination tried: 4 components, 3 styles, 2 schemes, LTR in English and
  RTL in Arabic, 48 runs in all. No component box goes past the viewport.
  `@axe-core/playwright` found no violations in any of the 48.
- Contrast: every text part is above 4.5:1 in all six style and scheme pairs.
  The lowest are 4.64 (NumberField placeholder, Desk light) and 4.83
  (ScrubInput mixed placeholder, Studio and Desk dark). NumberField's border
  is 3.32 to 4.18. SegmentedControl's thumb ring against the track is 4.18 to
  7.28.
- Targets (2.5.8): the smallest are the SegmentedControl xs item (39.7 by
  24), the ToggleGroup xs item (55 by 24), NumberField's steppers (24 by 24)
  and the ScrubInput handle (24 by 24 at xs).
- Forced colors: on items are Highlight. Focus shows the system outline,
  pulled inside attached items. The SegmentedControl thumb hides, and its
  track keeps a CanvasText border.

### ToggleGroup: fix needed

- **blocker**: `packages/css/src/components/ToggleGroup.css:51`. The
  attached group sets `flex-wrap: nowrap`, and the item label ends in an
  ellipsis (`packages/css/src/components/Button.css:119`). At 320 px the
  long-text and long-arabic cases lose about half of each label. "Every
  comment and every reference on the board" shows 139 of 265 px. The Arabic
  "كل التعليقات والمراجع على اللوحة" shows 124 of 161 px, and "التعليقات
  اللي فيها إشارة لي فقط" shows 117 of 152 px. The page does not scroll
  sideways, but the words are gone, and nothing on screen shows the full
  text. WCAG 1.4.10 asks for reflow without loss of information. Fix: let an
  attached item's label wrap to a second line, or let an attached group wrap
  like a spaced one when its row is too narrow. Shot:
  `docs/reports/reviews/shots/late-lanes/toggle-group-reflow-320-ar.png`.
- **blocker**: `packages/react/src/components/ToggleGroup/ToggleGroup.demo.tsx:24`.
  The Arabic filter label "تنتهي هذا الأسبوع" is a verb phrase in MSA. The
  copy rule asks for noun form labels in white Saudi dialect. One way to fix
  it: "موعدها هالأسبوع". The other four chips (مفتوحة، مسندة لي، فيها
  تعليقات، متوقفة) follow the rule.
- note: `packages/css/src/components/ToggleGroup.css:22`.
  `--_toggle-group-divider` is not one of the private names in anatomy rule
  1. The same goes for SegmentedControl (`inset`, `thumb-bg`,
  `thumb-shadow`, `item-height`, `item-radius`), NumberField
  (`stepper-size`, `stepper-inset`) and ScrubInput (`label-fg`). Each name is
  documented in its file's header. The lead should decide whether the list
  in rule 1 is closed or only a list of examples, and record the decision.
- note: `packages/react/src/components/ToggleGroup/ToggleGroup.tsx:99`.
  `rest` is cast to the single type's props, so a `type="multiple"` group's
  array value reaches Radix through a wrong type. It works at runtime, and
  the multiple demos behave, but the cast hides type errors in the multiple
  form.
- note: `packages/manifest/src/component/ToggleGroup.manifest.json:151`.
  `native.accessibilityRole` is radiogroup, which fits only type single. The
  notes say so, but a generated native port reads this key, not the notes.

Verified: type single renders role radiogroup with radio items, and a click
on the on item turns it off. Type multiple renders role toolbar with pressed
buttons. Group axes reach the items, and an item's own prop wins. The
icon-only items are named by `label`. A Tab into a fully disabled group lands
on the on item. Arabic group names are noun form.

### SegmentedControl: fix needed

- **blocker**: `packages/css/src/components/SegmentedControl.css:140`.
  `min-inline-size: 0` lets the items shrink inside a track capped at
  `max-inline-size: 100%` (line 55), and Button.css clips each label with an
  ellipsis. At 320 px the "many" case, the documented five options in a
  normal row, shows "24 h...", "7 d...", "30 d...", "90 d..." and "1 y...":
  every label loses its unit. The long-text and long-arabic cases lose 10 to
  38 percent of each label. The accessible names stay whole, but sighted
  users lose the words, which fails WCAG 1.4.10 (reflow without loss of
  information). Fix: let a label wrap to two lines, or drop to a stacked
  layout under a container width. The builder left the too-many case open as
  a stress case. This finding is about the "many" case, which is not a
  stress case. Shot:
  `docs/reports/reviews/shots/late-lanes/segmented-control-reflow-320.png`.
- note: `packages/manifest/src/component/SegmentedControl.manifest.json:89`.
  The `fullWidth` text promises "Long labels end in an ellipsis". Once the
  blocker is fixed, change it to say what happens instead.
- note: `packages/css/src/components/SegmentedControl.css:39`. The track's
  hairline is 1.14 to 1.66:1 against the page. That is not a failure: the
  item labels and the 2px thumb ring (4.18:1 or more) identify the control
  and its state. But in light schemes the track nearly disappears.
- note: `packages/react/src/components/SegmentedControl/SegmentedControl.tsx:266`.
  Selection follows `focus`, so any programmatic focus also selects. That
  includes a dialog that returns focus to an item, and a script that focuses
  an item. Today that is harmless, because only the selected item is the tab
  stop. Keep it in mind for the Angular port.

Verified: the root is a radiogroup and the items are radios with
aria-checked. A press on the selected item does nothing, and the value never
goes empty. The arrows select, Home and End select, and Space and Enter do
nothing on the selected item. Focus on a disabled item does not select it.
The thumb is aria-hidden, measured on logical properties, and correct in RTL
and inside scaled parents. The manifest `slots.root` is min 2 and max 5, and
`insteadUse` points to Tabs and RadioGroup. The tokens list matches what the
CSS and the `tab-indicator` pattern read.

### NumberField: pass

- note: `packages/manifest/src/component/NumberField.manifest.json:147`.
  WCAG 1.3.1 and 4.1.2. React Aria renders a textbox with
  `aria-roledescription` ("Number field", and "حقل رقمي" in Arabic), not a
  spinbutton, so there is no `aria-valuenow`, `aria-valuemin` or
  `aria-valuemax`. The value is the text, which meets 4.1.2. The bounds,
  though, reach assistive tech only when the caller writes them into the
  Field description, as the demos do. The manifest says this, but as
  content advice. Make it a rule (`mistakes`: min and max with no
  description) so the checker can flag it.
- note: `packages/css/src/components/NumberField.css:125`. The value is
  pinned to the reading start and the `end` unit to the far edge. In a wide
  field, "1,440" and "px" sit a whole field apart (the "many" case at
  desktop). The unit is aria-hidden, so this is visual only.
- note: `packages/react/src/components/NumberField/NumberField.tsx:144`.
  In Arabic with Western digits, the comma is the group mark, so a typed
  "12,5" reads as 125 and clamps to 50 in the Seats field. That is correct
  for `ar-u-nu-latn`. People who type a comma as the decimal mark will be
  surprised, so say it in the manifest notes beside the Arabic decimal mark.
- note: `packages/manifest/src/component/NumberField.manifest.json:237`.
  `styles` has no `neutral` entry. ScrubInput is the same, at line 211.
  ToggleGroup and SegmentedControl both have one.
- note: `packages/manifest/src/component/NumberField.manifest.json:156`.
  Home and End take over the caret keys inside a text input. The order asks
  for this, but it removes the only keyboard way to move the caret to either
  end of a long value. Say so in `a11y.notes`.

Verified, with Seats 1 to 50:

- Clamping: a typed 100 becomes 50 and a typed 0 becomes 1. A minus sign and
  an `e` are refused while typing, because min is 1.
- Arabic Indic input: ٢٥ shows 25, and ٣٫٥ shows 3.5.
- Step snapping: in Price (step 0.5), a typed 3.3 commits as SAR 3.50.
  Discount PageUp goes from 15% to 25%.
- Bounds and pointer: at max, the increment button is `aria-disabled` and a
  forced click does nothing. Focus stays on the input after a stepper
  press. The mouse wheel does not change the value.
- Names: the steppers are named "Increase Seats" and "زيادة عدد المقاعد".
  Under a Field, the input is named by the Field label.
- States: read only hides the steppers. Disabled is native disabled.
  Invalid sets `aria-invalid`.
- Arabic formatting: currency and percent formats keep Western digits in
  Arabic.

### ScrubInput: pass

- note: `packages/css/src/components/ScrubInput.css:32`. WCAG 1.4.11. There
  is no border at rest, so the fill alone marks the field. The fill is
  1.35:1 against the page in Studio and Desk dark, 1.13 and 1.15 in light,
  and 1.03 in Neutral light. In an inspector the letter, the value and the
  unit identify the field, so I do not call it a failure. But section 12
  asks for control borders at 3:1, and in Neutral light the field reads as
  plain text. Give Neutral a `inspector.field.bg` that steps up, or draw
  `border.control` at rest outside Studio.
- note: `packages/react/src/components/ScrubInput/ScrubInput.tsx:305`. WCAG
  2.5.7. There are two paths besides the drag. The keyboard path is the
  arrows on the input, which meets the plan's "key or button path". The
  single pointer path is a click on the input followed by typing. Most
  readings of 2.5.7 accept a typed field as the non-drag alternative, and
  the order sets "avoid on touch first screens". The plan's own wording
  ("key or button path") is weaker than 2.5.7's single pointer wording, so
  the lead may want to record that a typed field counts.
- note: `packages/react/src/components/ScrubInput/ScrubInput.tsx:316`.
  WCAG 4.1.2. An arrow nudge rewrites the value of a plain textbox, and
  screen readers often do not speak a value change in a focused text field.
  Consider `role="spinbutton"` with `aria-valuenow` and `aria-valuetext`
  (value and unit) while not typing, or a polite live region on nudge.
- note: `packages/react/src/components/ScrubInput/ScrubInput.tsx:313`.
  Escape does not cancel a drag. Pointer capture holds until release, so a
  wrong scrub can only be undone afterward. The builder left this open too.
- note: `packages/manifest/src/component/ScrubInput.manifest.json:211`.
  `styles` has no `neutral` entry, as for NumberField.

Verified:

- Drag: a drag of 20 px to the right grows 100 to 120 in LTR and shrinks it
  to 80 in RTL. `data-dragging` is set during the drag. The cursor is
  `ew-resize`. A press with no move focuses the input and selects its text.
- Names: in a Field (long-arabic), the input is named by the Field label
  ("المسافة بين العناصر داخل المجموعة"). Outside a Field it is named by
  `aria-label`. The unit is read once, through `aria-describedby`.
- Mixed: the placeholder is "متعدد", and it is not italic in Arabic.
- Read only: the `readonly` attribute is set, and there is no nudge and no
  scrub.
- Typed values: min clamps a typed -3 to 0.

## Select, MultiSelect, TagField

```text
npm run contract -- --framework react --component Select,MultiSelect,TagField
pass  MultiSelect: 44 passed, 0 failed, 0 skipped
pass  Select: 44 passed, 0 failed, 0 skipped
pass  TagField: 29 passed, 0 failed, 15 skipped
```

The 15 TagField skips are the "target size open" and "axe open" runs: the
manifest has no `contract.trigger`, so the suite never opens the suggestions.
A separate axe run with the suggestions open is reported below.

### What holds across Select, MultiSelect and TagField

Checked in code and in Chromium against the React gallery on port 5310, and
not repeated per component below:

- Anatomy: `data-ds` roots, the popup and content roots carry the parent's
  `data-part`, shared axis words only (`sm`, `md`, `lg`; `default`, `pill`),
  boolean states present and empty, no class for state, `ref` as a prop, no
  `forwardRef`, `"use client"` on every component file and on `popupLayer.tsx`.
  The system Button, CloseButton and SearchField are used for every
  interactive part; no JSX `<button>`, no `title`, no em or en dash.
- CSS: `@layer ds.base`, private `--_<component>-*` plumbing (the `--_menu-*`
  names aside, see the notes), no `--ds-*` declared, logical properties only,
  only `transform` and `opacity` animate, states swap private properties,
  the transparent outline only inside focus selectors, a reduced motion,
  more contrast and forced colors block in every file.
- Motion: `menu-scale` exists in `packages/motion/src/patterns/menu-scale.ts`
  and the CSS plays the same values (`scale.press`, `duration.base`,
  `ease.emphasized` in; `duration.quick`, `ease.exit` out for the two Popover
  popups; Select has no exit, as its manifest says). With reduced motion the
  computed animation is `none 0s` and each popup leaves the DOM within 17ms;
  without it MultiSelect and TagField popups leave after the 120ms exit, and
  no portal Theme layer is left behind.
- Contrast: every text node in all three demos, triggers and open popups,
  in Studio, Desk and Neutral, dark and light, composited against every
  ancestor background. Lowest: the placeholder at 4.64:1 (Desk light, Select
  and MultiSelect), option descriptions 5.0:1, MultiSelect action buttons
  5.0:1, tag labels 8.78:1. Nothing below 4.5:1 outside the disabled cases.
- Rows: Select option rows equal ListBox option rows in all three styles
  (28px, 9.55px inline padding, 11.77px type, weight 560 Studio and Neutral,
  400 Desk, radius 12px Studio, 8px Desk, 6px Neutral; Neutral 32px rows).
- Targets (2.5.8): Select and MultiSelect options 24px at compact density,
  MultiSelect actions 24px high, the trigger box fills the root, every
  TagField remove button 24 by 24 in all three styles at compact and default density.
- Reflow (1.4.10): at 320px, in Studio dark LTR and Neutral light Arabic
  RTL, `scrollWidth` is 320 for all three pages, and every open popup sits
  inside the viewport (Select long Arabic 48 to 304, MultiSelect too-many
  flips above at 8 to 298, TagField 16 to 304; at a 400px tall viewport the
  MultiSelect popup ends at 392).
- Forced colors: borders on triggers, popups and tags, the lit row in
  Highlight with HighlightText, the chosen option keeps its check, and the
  focus ring on a TagField remove button shows.
- axe (wcag2a to wcag22aa) with each overlay open, in Studio dark LTR, Desk
  light Arabic RTL and Neutral dark LTR: MultiSelect too-many with a search
  that matches nothing, empty and loading, TagField suggestions in the empty
  and variants cases and a focused remove button, Select too-many: clean.
  The one violation is the Select empty case below.

### Select: fix needed

- **blocker**: `packages/react/src/components/Select/Select.tsx:219`. With no
  option, the list still opens and Radix Content is a `role="listbox"` whose
  only child is the `role="presentation"` empty text. axe reports
  `aria-required-children` on the open listbox in all three styles (WCAG
  1.3.1, 4.1.2). The contract suite only opens the variants trigger, so it
  never sees this. Fix: do not open the list when `options.length === 0`
  (describe the trigger with the empty text, as loading already does at
  line 297), or render the empty text as a disabled option.
- note: `packages/manifest/src/component/Select.manifest.json:155`. `closed`
  is listed under `states`, but no element ever carries
  `data-state="closed"`: the trigger stamps none and the content leaves the
  DOM on close. Note 190 says so; the states list should hold only what is
  stamped (`open`, `checked`, `unchecked` and the booleans).
- note: `packages/css/src/components/Select.css:181`. The content declares
  `--_menu-*` private names, not `--_select-*` (anatomy rule 1). The same in
  `MultiSelect.css:232` and `TagField.css:219`. This repeats the point the
  lane left open for the lead; it needs a DECISIONS entry for a shared
  menu surface family, or a rename.
- note: `packages/react/src/components/Select/popupLayer.tsx:8`. The layer
  copies the one inside ComboboxBase, lives in the Select folder and is
  imported by MultiSelect and TagField, and line 5 relies on
  `DropdownMenu.css:60` to draw the layer as `display: contents`. Move it to
  `packages/react/src/internal/` with ComboboxBase using it too, and move the
  layer rule to a shared stylesheet, so a Select does not depend on another
  component's CSS.
- note: `packages/react/src/components/Select/Select.tsx:63`. The default
  empty text "No options to choose from yet." does not say what to do next,
  which the manifest itself asks for. A default cannot know the next step;
  say in the prop doc that `empty` should be passed.

Verified: ArrowDown, ArrowUp, Enter and Space open the list with focus on
the chosen option (roving focus, Radix moves DOM focus to each option);
ArrowDown skips the disabled "File size"; End lands on the last enabled
option and Home on the first; typeahead in the list and on the closed
trigger ("d", "t", "i" chose Done, To do, In progress after the 1 second
buffer reset); Escape closes without changing the value and focus returns
to the trigger; Tab keeps focus in the open list, as the manifest says;
Enter on an option chooses it and closes. `aria-expanded`,
`aria-selected`, `aria-disabled` and the option `aria-describedby` targets
all resolve; the open listbox is named by the Field label; the read only
trigger reads "combobox City: Doha" and does not open. The trigger stamps
no `data-state`, the content stamps `data-state="open"`, items
`checked` and `unchecked`, as the manifest says.

### MultiSelect: pass

- note: `packages/react/src/components/MultiSelect/MultiSelect.tsx:464`.
  Read only with more values than `maxTags`: the popup never opens and the
  rest show only as "+3", so a sighted reader cannot see which values are
  chosen (the hidden summary text serves screen readers only). Open the
  popup read only, or show the full list in a Tooltip on the +N tag.
- note: `packages/react/src/components/MultiSelect/MultiSelect.tsx:441`.
  `aria-haspopup="listbox"`, while opening moves focus to a search text box
  (more than 8 options) and the popup holds two Buttons. A screen reader
  announces a listbox and lands in an edit field. It works and the manifest
  explains it; `aria-haspopup="dialog"` with the popup named would describe
  it better (4.1.2 is met either way).
- note: `packages/css/src/components/MultiSelect.css:286`. The nested
  ListBox keeps a transparent border, which forced colors draws, so the
  popup shows two nested frames. Set the ListBox border width to 0 in the
  popup instead. The same at `TagField.css:266`.
- note: `packages/css/src/components/MultiSelect.css:231`. The popup block
  repeats the Combobox popup, as do TagField and their two Desk recipes.
  The lane's change 1 for the lead folds them into `Combobox.css`; still
  open.

Verified: Enter, Space, ArrowDown and ArrowUp on the trigger open the popup;
focus goes to the first chosen option (roving `tabindex`, no
`aria-activedescendant`), or to the search field when there are more than
8 options; ArrowDown in the search moves into the list; Space toggles,
Enter closes and returns focus to the trigger; End and Home skip the
disabled "Legal review"; typeahead "r" moves to Research; Ctrl+A selects
every shown enabled option and a second Ctrl+A clears them; Tab and
Shift+Tab cycle list, Select all, Clear selection and stay in the popup; in
the search, the first Escape clears the query (1 match back to 30 options)
and the second closes; a press outside closes and leaves focus where it
lands; Select all after a search adds only the matches. The listbox has
`aria-multiselectable="true"` and the Field label; the trigger reads
"combobox Labels: Design and Copy", in Arabic "التصنيفات: تصميم وخلل", and
in count mode "3 selected" and "3 عناصر محددة" (Intl.PluralRules, Western
digits). A press on the Field label focuses the trigger (unit test).

### TagField: fix needed

- **blocker**: `packages/react/src/components/TagField/TagField.tsx:335`.
  Text past `max` is lost when it is ended with a comma. `onInputChange`
  calls `add()` and ignores the overflow it returns, then line 336 keeps only
  the text after the last separator. With 10 tags and `max={12}`, typing
  "Alpha, Beta, Gamma," adds Alpha and Beta and Gamma is gone from the
  control; typing "Delta" and Enter keeps "Delta" in it. The manifest says
  "Text past max stays in the control"
  (`TagField.manifest.json:161`), so the manifest is wrong for this path.
  The lane fixed this for Enter and paste only. Fix: put
  `add(...).join(', ')` in front of the remaining text, as `commitText`
  does. Evidence: `shots/late-lanes/tag-field-max-and-duplicate-no-visible-message.png`.
- **blocker**: `packages/react/src/components/TagField/TagField.tsx:198`.
  The max and duplicate errors are written only to the status at line 499,
  which `TagField.css:168` hides visually. A sighted person who types a
  duplicate sees the text vanish with no message; at the max the text stays
  and nothing says why (WCAG 3.3.1). The same screenshot shows 12 tags, an
  empty control and no message after "design" and Enter, while the status
  reads "design is already added". Fix: show the max and duplicate words as
  visible text under the field (the Field error slot or a description that
  the control is described by), keep the polite status for adds and
  removals.
- **blocker**: `packages/css/src/components/ListBox.css:156`, used by
  `TagField.tsx:402` (`virtualFocus`). The active suggestion is marked only
  by a fill change: 1.36:1 against the resting row in Studio and Neutral
  dark, 1.24:1 in Studio and Neutral light, 1.32:1 in Desk light. The inset
  ring at line 162 is drawn only on `:focus-visible`, which an
  `aria-activedescendant` option never gets (WCAG 2.4.7, 1.4.11). Fix in
  ListBox: draw the ring on `[data-highlighted]` when the list is in
  virtual focus mode. Combobox and Autocomplete use the same mode, so they
  likely share this; worth a check by their reviewer. Evidence:
  `shots/late-lanes/tag-field-active-option-studio-light.png`.
- note: `packages/react/src/components/TagField/TagField.demo.tsx:18`. The
  Latin run "Enter" sits in the Arabic hint without `Bidi` (PLAN section
  12); the same string is in `TagField.manifest.json:175`. It renders in the
  right order here, but the rule asks for the wrapper.
- note: `packages/react/src/components/TagField/TagField.demo.tsx:19`.
  "أضف وسما واحدا على الأقل" carries the formal case ending; white Saudi
  dialect reads "أضف وسم واحد على الأقل". The lane took it from an earlier
  review, so the lead should settle the register once (the MultiSelect
  plural register is the same open point). Also `TagField.manifest.json:177`.
- note: `packages/manifest/src/component/TagField.manifest.json`. No
  `contract` hint lets the suite open the suggestions, so the 15 open runs
  skip. A `contract.open` hint (focus the control, press ArrowDown) in
  `packages/contract-tests` would let the suite cover it; my manual axe run
  with the suggestions open was clean.
- note: `packages/react/src/components/TagField/TagField.tsx:190`. `say()`
  schedules a `requestAnimationFrame` that is never cancelled, so a removal
  just before unmount sets state on an unmounted component. Harmless in
  React 19, but cancel it in an effect cleanup.

Verified: Enter, the comma and the Arabic comma add; "design" against
"Design" is dropped as a duplicate; Backspace on the empty control focuses
"Remove tag Beta", ArrowLeft moves to the tag before, Home to the first,
Delete removes it ("Removed tag Design" read once from the status) and
focus moves to the next tag, End returns to the control. In Arabic RTL,
ArrowRight from the control goes to the last tag and on toward the first,
ArrowLeft goes back to the control. With suggestions: ArrowDown opens,
the next ArrowDown sets `aria-activedescendant`, typing filters with prefix
matches first, Enter adds the highlighted one, Escape closes, Tab closes and
leaves. Every remove button has its own name ("Remove tag Design",
"حذف الوسم بحث"), the tags sit in a group named by the Field label, the
status is `role="status"` and present from the first render, and the
remove buttons are 24 by 24.

## Form, Fieldset, FilterBar, ConsentField

```text
npm run contract -- --framework react --component Form,Fieldset,FilterBar,ConsentField
pass  ConsentField: 29 passed, 0 failed, 0 skipped
pass  Fieldset: 29 passed, 0 failed, 0 skipped
pass  FilterBar: 29 passed, 0 failed, 15 skipped
pass  Form: 29 passed, 0 failed, 0 skipped
```

The 15 FilterBar skips are the "open" target size and axe runs: the more
menu trigger has no `data-demo-trigger`, so the suite never opens it. The
lane left this open. I opened the menu by hand and ran axe on it (below):
clean.

### What holds across the four

Checked in code and in Chromium against the React gallery on port 5310, not
repeated per component:

- Axe (wcag2a, 2aa, 21a, 21aa, 22aa) is clean on every demo page in studio,
  desk and neutral, dark and light, en LTR and ar RTL, at 320px and
  1280px: 96 runs, with the FilterBar more menu open in each FilterBar run
  (one `role="menu"`, three `menuitemcheckbox`). That covers color contrast
  for the muted count, the consent meta line and the required mark.
- Reflow (1.4.10): `scrollWidth` equals the viewport at 320px on every page
  in all those combinations. The FilterBar chip strip scrolls inside itself
  (288px wide, 839px of content in `too-many`).
- Anatomy: `data-ds` roots, own parts only, boolean states present and
  empty, `"use client"` on all four, `ref` as a prop, no bare `<button>`, no
  native `title` in the DOM (every `title=` in the source is a component
  prop), Arabic copy has no diacritics and uses Western digits.
- CSS: `@layer ds.base`, private `--_<component>-*` only, no `--ds-*`
  declared, every `--ds-*` name used exists in
  `packages/tokens/dist/css/tokens.css`, logical properties only, no raw
  values, no `!important`, a forced colors block in all four files.
- Motion: all four manifests say `none`, and `document.getAnimations()` is
  empty on all four pages. Reduced motion has nothing to collapse.
- Forced colors (emulated, desk dark): the Form summary, field errors and
  focus ring, the selected chip check, the consent box and its error all
  draw.
- Arabic rows nested in English cases get `dir="rtl"` from their Theme.

### Form: fix needed

- **blocker**: `packages/react/src/components/Form/Form.tsx:225`. A constraint
  failure falls back to the browser's `validationMessage`, which is in the
  browser's language and says nothing about how to fix the value. In the
  Arabic form (`long-arabic`) a bad email shows "Please include an '@' in
  the email address. 'sara' is missing an '@'." in English inside
  `lang="ar"`, with the bidi run scrambled, in the field and in the summary
  (WCAG 3.1.2, and the Arabic copy rule). In `many` the postal code pattern
  (`Form.demo.tsx:137`) gives "Please match the requested format.", which
  names no format (WCAG 3.3.3). Map each `ValidityState` flag to copy in
  `FormLabels` (type mismatch, pattern, too short, range) with an en and ar
  default, and give the demo postal field a validator message ("Enter the 5
  digit postal code."). Shots:
  `docs/reports/reviews/shots/late-lanes/form-native-message-ar.png`,
  `docs/reports/reviews/shots/late-lanes/form-pattern-message.png`.
- **blocker**: `packages/react/src/components/Form/Form.tsx:223`. Every empty
  required control gets `labels.required`, "Fill in this field.", a
  checkbox, a switch and a consent included. Verified with a required
  Checkbox: the summary reads "I accept the terms: Fill in this field." A
  box is not filled in (WCAG 3.3.3). Add a `requiredChoice` label ("Tick
  this box to go on." and an Arabic default) for checkbox, radio and Radix
  hidden inputs. See ConsentField for the case where the field shows other
  copy than the summary.
- **blocker**: `packages/react/src/components/Form/Form.tsx:399`. A
  validator on a checkbox group (several controls with one `name` inside a
  Fieldset) is listed in the summary under the first control's label:
  "Email: Pick at least one way to reach you." for the group "How should we
  reach you". Focus lands on that first checkbox, which has no
  `aria-invalid` and no `aria-describedby` to the message, and the
  Fieldset shows no error. Verified in a scratch test. The error is not
  identified at the place it applies (WCAG 3.3.1). For a name shared by
  several controls, label the link with the nearest `legend` and send the
  message to that Fieldset's error part (see the Fieldset note), or document
  that groups need FormField with a name binding and give Fieldset one.
- note: `packages/react/src/components/Form/Form.tsx:317`. A successful
  submit clears the status and sets `data-state="submitted"`, and nothing
  else changes on the page: in the `loading` demo the button spins for 4
  seconds and then nothing is said or shown. WCAG 4.1.3 is only failed when
  a status message exists, so this is a note, but add a `submitted` label
  announced through the same status region, or a documented `onSubmitted`
  pattern with a demo that shows the result.
- note: `packages/manifest/src/component/Form.manifest.json:29`. `parts`
  maps FormField to `body` and FormSubmit to `actions`, but neither renders
  that `data-part`: they render a Field root and a Button root placed
  inside those parts. `slots` already says this. Drop the `parts` entries so
  the docs and registry do not claim FormField is the body.

Verified: focus moves to the first invalid field on submit (and to the
summary when only form messages come back), the summary is not live and one
polite status says "Fix 1 field to send the form" per submit; each field
carries `aria-invalid="true"` and `aria-describedby` to its error; a fix
removes the error at once and the summary goes with it; values are kept
after a failed submit and `autocomplete` values are untouched (3.3.7, 3.3.8);
`noValidate` is set, so no browser bubble shows; Enter in a single line
field submits; Enter on a summary link moves focus to the field; while
`onSubmit` runs the form has `aria-busy`, `data-state="submitting"`, the
submit Button is `aria-disabled` with its loading status "Sending", and a
second Enter does nothing; reset clears values and errors; the dialog case
submits from the footer button and focuses the empty email field. Copy:
every button is a verb plus a noun ("Send request", "Join waitlist", "Cancel
invite"), Arabic summary and errors are white Saudi dialect. Manifest
anatomy, states, keys and props match the code.

### Fieldset: pass

- note: `packages/react/src/components/Fieldset/Fieldset.tsx:47`. Fieldset
  has no `name` binding to a Form, unlike FormField and ConsentField, so a
  group error found by a Form validator never reaches the error part (see
  the third Form blocker). The manifest note at
  `packages/manifest/src/component/Fieldset.manifest.json:111` ("A form that
  checks on submit moves focus to the first control of the invalid group")
  reads as if this were wired. Add a `name` prop that reads
  `useFormFieldError`, as ConsentField does, or reword the note.
- note: `packages/react/src/components/Fieldset/Fieldset.tsx:84`. The group
  error is on the fieldset's `aria-describedby` only; the controls inside
  carry no `aria-invalid`. Screen readers read a group description
  inconsistently on entry (NVDA yes, VoiceOver often not), so a person
  tabbing into an invalid group may not hear that it is invalid (3.3.1 is
  met by the visible text; this is about the spoken path). Consider
  `aria-invalid` on the controls through context when the group is invalid.

Verified: the accessibility tree shows `group "How should we reach you"`
from the native legend for every case, Arabic included, and the
description and error are on the group's `aria-describedby`; the error is a
FieldError root with `data-part="error"`, not live, above the body; native
`disabled` reaches the Input and the Radix Checkbox button (both
`:disabled`, both read as disabled), and the legend, description and body
take one `opacity.disabled` (0.38 effective, not compounded); the legend
wraps at 320px in Arabic.

### FilterBar: fix needed

- **blocker**: `packages/react/src/components/FilterBar/FilterBar.tsx:206`.
  The announcement effect depends on `labels.results`, and `labels` is a new
  object each render (`:131`). When `labels` is passed inline, as anyone
  adding a third language will do, any render of the parent in the 600ms
  wait runs the effect cleanup, which clears the timer, and the effect then
  returns early because the count did not change: the result count is never
  read (WCAG 4.1.3). Proved in a scratch test: the same sequence (change,
  render after 200ms, wait 1000ms) gives "3 results" with the default
  labels and "" with `labels={{ results: (n) => ... }}`. Keep the latest
  `results` function in a ref and drop it from the dependency list.
- note: `packages/react/src/components/FilterBar/FilterBar.tsx:69`. "More
  filters" is not a verb plus a noun. It is the usual wording for a menu
  trigger; record the exception in the manifest `content`, as the
  Pagination review asked for "Next page".
- note: `packages/react/src/components/FilterBar/FilterBar.tsx:232`. Each
  chip is its own tab stop, so the `too-many` case is 12 stops before the
  more button. The order asked for ToggleGroup keys inside (arrow keys,
  one stop). The lane documented why (no ToggleGroup at the time); keep it
  open until the swap.
- note: `packages/react/src/components/FilterBar/FilterBar.demo.tsx:32`.
  The grid and list toggles have a fixed `aria-pressed` and no handler:
  pressing "Show as list" changes nothing. Wire them to state so the demo
  does not teach a toggle that lies.
- note: `packages/manifest/src/component/FilterBar.manifest.json:116`.
  `states` lists `open`, `closed` and `data-selected`, which sit on the
  nested more Button and Chip roots, not on the FilterBar root. The notes
  say so, but the rule is that a manifest lists its own states; leave them
  to the Button and Chip manifests. Also the private basis properties at
  `packages/css/src/components/FilterBar.css:27` borrow
  `field-label-width` and `dialog-width-sm`, as the lane noted.

Verified: Tab order is search, each chip, more, clear, then the end slot;
Space on a chip toggles `aria-pressed` and the check; Enter on more opens
the menu with focus on the first `menuitemcheckbox`, Space ticks it and the
menu stays open, the button reads "More filters (1)", Escape returns focus
to the more button; clear all empties the chips, the menu filters and the
query, hides itself and moves focus to the search input. The status is
polite and atomic and spoke "1 result", "6 results", "1 result" once each
after the last change in a live run, and nothing when a change kept the
count. Edge fades: in LTR only the end fades at rest and only the start
once scrolled to the end; in Arabic RTL the angle flips to 270deg,
`scrollLeft` goes negative and the fades follow the logical edges; the
focused chip stays fully visible. Copy: "Clear filters", Arabic "مسح
الفلاتر", counts with Arabic dual and plural forms.

### ConsentField: fix needed

- **blocker**: `packages/react/src/components/ConsentField/ConsentField.tsx:151`.
  `requiredError` changes only the copy under the consent. The Form summary
  still lists the Form's own message, so a required consent left off reads
  "Share my medical history with the clinic.: Fill in this field." in the
  summary and "The booking needs this consent. Tick the box, or book by
  phone." at the box. Verified in a scratch test. Two different messages
  for one error, and the summary one gives the wrong action (WCAG 3.3.3).
  The lane report says `requiredError` makes "the Form show the consent's
  own" message; it does so only at the field. Feed `requiredError` to the
  Form (a registered per name message) so the summary and the field agree.
- **blocker**: `packages/react/src/components/ConsentField/ConsentField.demo.tsx:91`.
  The long purpose "Share my order history, delivery address and phone
  number with the delivery partner, so they can plan delivery times and
  call me when the driver is near" names two uses joined with "and"; the
  Arabic one at `:100` does the same ("عشان يرتب مواعيد التوصيل ويتصل علي").
  The manifest content rule says "Never a bundle joined with and", and the
  order asks for one purpose per control (PDPL: consent is specific to one
  purpose, Implementing Regulations Article 11 as we read it). Listing
  several data items for one use is fine; two uses are two ConsentFields.
  Make the long case one use with a long recipient and data list.
- note: `packages/react/src/components/ConsentField/ConsentField.tsx:140`.
  Pre-ticking is still one prop away: `checked={true}` with a no op
  `onCheckedChange` renders a ticked box with nothing to show it is a
  choice on record, and a stray `defaultChecked` is dropped without a word.
  Neither warns. Add a development warning for `defaultChecked`, and for a
  controlled `checked` that starts true with no `meta` (the record line the
  docs ask for), so the misuse is caught (PDPL explicit consent).
- note: `packages/react/src/components/ConsentField/ConsentField.tsx:188`.
  `disabled` with `checked` true locks a given consent so it cannot be
  withdrawn. Nothing stops it. Warn in development, or keep a granted
  consent enabled (PDPL Article 5: withdrawal at any time, as easy as
  giving).
- note: `packages/react/src/components/ConsentField/ConsentField.tsx:225`.
  `detailsHref` is optional, and three demos show consents with no way to
  the privacy notice: `empty` (`ConsentField.demo.tsx:62`), `disabled`
  (`:122`) and the 12 switch "Privacy settings" list (`:81`), which has no
  link and no description on the group either. Informed consent needs the
  notice one step away. Give the settings Fieldset a description with a
  link, and warn in development when a consent has no `detailsHref` and no
  surrounding notice is declared.

Verified: every consent in every demo starts denied (`aria-checked="false"`,
`data-state="denied"`) except the settings row whose meta says "You agreed
on 3 November 2026"; a test proves `defaultChecked` is not forwarded. The
control is a real Radix checkbox or switch named by the purpose through a
native label and `aria-labelledby`, with the meta and error on
`aria-describedby` and the required mark `aria-hidden` (3.3.2, 1.3.1).
Space gives and withdraws, a click on the purpose toggles, a click on the
details link does not, Enter does not toggle. Withdrawal in the settings
row is the same one action and the meta changes to "You withdrew just now.
Text version 2.1." An optional consent left off does not block a Form
submit (`data-state="submitted"`, no `data-invalid`); a required one blocks
it, focus goes to the visible box and ticking it clears the error at once.
`onDecision` hands back name, granted, version and an ISO time. The
manifest carries the PDPL design note and says the copy must be checked by
someone qualified; its anatomy (root, control, text, purpose, required,
meta, details, error), states, keys and props match what renders. Copy:
"How we use your data", Arabic "طريقة استخدام بياناتك", Arabic purposes
start with أوافق, no diacritics.

## CommandPalette, Lightbox, PageShell

```text
npm run contract -- --framework react --component CommandPalette,Lightbox,PageShell
pass  CommandPalette: 44 passed, 0 failed, 0 skipped
pass  Lightbox: 44 passed, 0 failed, 0 skipped
pass  PageShell: 29 passed, 0 failed, 0 skipped
```

`npm run check` is green after the review (13 of 13 steps).

### What holds

Checked in code and in Chromium against the React gallery on port 5310, and
not repeated per component below:

- Anatomy: each `data-ds` root renders exactly the parts its manifest lists
  (a script listed every `data-part` under each root; nested SearchField, Kbd,
  IconButton, Spinner and SkipLink parts belong to their own manifests).
  Boolean states are present and empty (`data-loading=""`, `data-zoomed=""`,
  `data-error=""`, `data-highlighted=""`), `data-state` is on the overlay
  roots and absent on PageShell, `ref` is a prop, `"use client"` heads all
  three files.
- CSS: `@layer ds.base`, private `--_<component>-*` properties only, no
  `--ds-*` declared, every `--ds-*` name used in the three base files and the
  Desk CommandPalette recipe exists in `packages/tokens/dist/css/tokens.css`,
  no physical property, no raw color, duration or z-index, no `!important`,
  only `transform` and `opacity` animate, the transparent outline only inside
  the focus selector.
- No native `title` attribute and no bare `<button>` in any of the three
  components or demos (every `title=` is a DemoCase or DrawerContent prop).
- Reflow: at 320 by 640, in Studio, Desk and Neutral, dark and light, LTR
  English and RTL Arabic, the open palette and the open lightbox fit the
  viewport (panel inside 0 to 320, `scrollWidth` 320), and the full page
  PageShell has a `scrollWidth` of 320 (WCAG 1.4.10).
- Axe with the overlays open (tags wcag2a, wcag2aa, wcag21a, wcag21aa,
  wcag22aa): no violation in the 24 style, scheme, direction and width runs
  of each overlay, apart from the items under each component below.
- Reduced motion: with `reducedMotion: 'reduce'` no animation runs on open or
  close of either overlay (`document.getAnimations()` is empty); without it
  the backdrop fade and the panel keyframes run at the `duration.base` value,
  so the motion named "dialog" is the one played. PageShell names "none" and
  has no motion of its own.
- Forced colors: both overlays draw a CanvasText border, the palette lit row
  takes Highlight with readable keycaps, the lightbox IconButtons get borders.
- Dialog semantics: both panels are `role="dialog"` named by a visually hidden
  title (Command palette, Image viewer, and the Arabic words under `lang=ar`).
  Radix sets no `aria-modal`; the page behind is `aria-hidden` and the Tab
  order wraps inside the panel, the same as Dialog.
- Gate note, not a finding on these components:
  `packages/contract-tests/src/contract.spec.ts:83` runs axe with
  `wcag2a, wcag2aa, wcag21aa, wcag22aa` and leaves out `wcag21a`, so the
  WCAG 2.1 level A rules (2.5.3 label in name, 1.3.4, 1.3.5) never run in the
  contract suite.

### CommandPalette: fix needed

- **blocker**: `packages/react/src/components/CommandPalette/CommandPalette.tsx:296`.
  The open shortcut listener checks only `defaultPrevented`, `repeat` and
  `isComposing`; it never looks at the event target. The prop accepts any
  string, and `matchShortcut('/', ...)` and `matchShortcut('?', ...)` return
  true for a plain key press (checked in the browser), so `shortcut="/"`, a
  common choice, opens the palette and swallows the character in every text
  field, textarea and contenteditable on the page. A character key shortcut
  that the user cannot turn off or remap fails WCAG 2.1.4. Fix: when the
  shortcut has no Ctrl, Meta or Alt, ignore events whose target is editable
  (input, textarea, select, `isContentEditable`), and say so in the manifest
  `keys` entry. The default `Mod+K` is fine: Ctrl+K typed in an injected
  input opened the palette and left the field value untouched, and focus
  came back to the input on Escape.
- note: `packages/react/src/components/CommandPalette/matchShortcut.ts:80`.
  The physical key fallback (`event.code`) also fires on Latin layouts, so two
  keys match one shortcut: `Mod+Q` matches Ctrl with the key labelled A on
  AZERTY (`key: 'a', code: 'KeyQ'`), which takes select all away, and the
  default `Mod+K` matches Ctrl+E on Colemak. Use the code fallback only when
  `event.key` is not a Latin letter or digit (the Arabic case it was made for
  still passes).
- note: `packages/react/src/components/CommandPalette/matchShortcut.ts:77`.
  A shortcut that names Shift with a symbol, `Mod+Shift+/`, never matches on
  a US layout (the event key is `?`), and `Mod+/` never matches on an Arabic
  layout (the key is `ظ`, and the code fallback covers letters and digits
  only). Both are open shortcut strings the prop accepts.
- note: `packages/react/src/components/CommandPalette/CommandPalette.tsx:387`.
  The count counts rows, and the recent group repeats commands, so the
  variants palette announces "11 results" on open for 9 commands. Count
  distinct values, or announce only once a query is typed.
- note: `packages/react/src/components/CommandPalette/CommandPalette.tsx:450`.
  With tag wcag21a, axe `label-content-name-mismatch` flags every row with a
  shortcut or a description (the option is named by `item-label` only, and
  axe counts the hidden keycaps and the description as visible text). The
  name starts with the visible label, so WCAG 2.5.3 holds; this is a rule
  heuristic. Worth a `contract.skipAxeRules` entry with the reason once the
  gate runs wcag21a.
- note: the order says `list` is a ListBox root; the palette draws its own
  listbox on the shared ListBox logic. The reason is in the file header and
  the lane report, and the manifest is honest about it. Home and End move the
  caret in the search box, as in an editable combobox; the manifest does not
  claim them.

Verified: dialog role and name; focus lands in the search input, a combobox
with `aria-expanded`, `aria-controls` and `aria-activedescendant` pointing at
the lit option; ArrowDown and ArrowUp move and wrap and skip the disabled
command; typing filters (expo leaves Export as PDF; Arabic انشاء without the
hamza finds إنشاء لوحة with the match in a `<mark>`); Enter runs the command
after the palette closes and focus is back on the trigger (Ran: Invite
people); Escape clears a query first, then closes; focus returns to the
trigger, to the other button that had focus when Mod+K opened it, and to an
input; a backdrop click closes; Tab wraps between the search box and the
close button, and reaches the Load commands button in the error case. The
polite status says the count once per query after typing pauses (11 results,
5 results, No results, and نتيجة وحدة in Arabic), empties between queries,
and stays quiet while loading, when the SearchField says Loading commands.
Group headings name their groups through `aria-labelledby`. Keycaps are
`dir="ltr"` inside RTL rows, hidden from assistive tech, and each row carries
`aria-keyshortcuts`. matchShortcut: Mod is Meta on Mac and Ctrl elsewhere,
Ctrl+K does not open on Mac, Ctrl+Shift+K does not match Mod+K, AltGr (Ctrl
plus Alt) does not match, Option+K on Mac matches Alt+K through the code, and
Ctrl+K on an Arabic layout matches. Size lg is 640 wide with 44px rows. Long
English and long Arabic rows wrap inside the panel at 320; the too many list
scrolls inside the panel and keeps the lit row in view. Copy: verb plus noun
commands and buttons, plural noun groups, an empty state that says what to
do next, white Saudi Arabic (ما فيه أوامر مطابقة. جرب كلمة ثانية.) with no
diacritics and Western digits. Manifest anatomy, states, props, keys and
motion match the code; react is ready.

### Lightbox: fix needed

- **blocker**: `packages/react/src/components/Lightbox/Lightbox.tsx:345` and
  `:411`. A double click on the image never zooms. `onStagePointerDown` sets
  pointer capture on the stage, so Chromium sends the `dblclick` to the stage,
  and the check `event.target === imageRef.current` fails every time
  (a capture phase listener logged `dblclick` on `stage`; `data-zoomed`
  stayed absent on the one case). The manifest promises it
  (`packages/manifest/src/component/Lightbox.manifest.json:157`) and the image
  shows a zoom in cursor (`packages/css/src/components/Lightbox.css:47`). The
  unit test never fires a double click. Fix: compare with
  `imageRef.current?.contains(document.elementFromPoint(event.clientX,
  event.clientY))`, or release the capture on pointer up before the click;
  add a browser level test.
- **blocker**: `packages/css/src/components/Lightbox.css:86`. Under
  `breakpoint.phone` the nav space is 0, so previous and next sit over the
  image, and they are ghost IconButtons with no fill
  (`packages/react/src/components/Lightbox/Lightbox.tsx:442`). In every dark
  scheme the light chevron sits on the light sky of the demo images: 1.49:1 in
  Neutral dark, 1.53:1 in Desk dark, 1.96:1 in Studio dark, measured from the
  pixels of the 12 image case at 320 by 640. The light schemes reach 3.8:1 to
  13.7:1 on these images, but a dark photo would drop them the same way. The
  controls must read on any image, light or dark (WCAG 1.4.11). Fix: give the
  side buttons a solid backing from tokens (for example the surface color as
  the IconButton fill, or a scrim behind them) whenever they overlap the
  image. Screenshot:
  `docs/reports/reviews/shots/late-lanes/lightbox-controls-over-image.png`.
- **blocker**: `packages/react/src/components/Lightbox/Lightbox.demo.tsx:75`.
  The Arabic row of the variants case is not in an Arabic theme: the trigger
  عرض الصور and the Arabic alt text sit under `lang="en"`, `dir="ltr"`, and
  the viewer it opens speaks English (Image viewer, Close image viewer) around
  Arabic alt text. A screen reader reads the Arabic with the English voice
  (WCAG 3.1.2). Wrap the row in `<Theme lang="ar" dir="rtl">`, as
  `CommandPalette.demo.tsx:136` does. The lane fixed this for CommandPalette
  and PageShell, not here.
- note: `packages/css/src/components/Lightbox.css:177`. While zoomed, axe
  reports `scrollable-region-focusable` (serious) on the stage in LTR and RTL.
  Keyboard users can still pan, because the panel turns the arrows into
  scroll steps wherever focus is in the viewer, so WCAG 2.1.1 holds. Either
  make the stage a named focusable region while zoomed, or record the rule in
  `contract.skipAxeRules` with that reason. The contract never zooms, so it
  does not see this.
- note: `packages/react/src/components/Lightbox/Lightbox.demo.tsx:131`. No
  `loading` case, though the component has `data-loading` and a spinner part;
  the data URL images load at once. A case with a slow or never resolving
  source would show the spinner and the zoom button off.
- note: `packages/manifest/src/component/Lightbox.manifest.json:127`.
  `LightboxTrigger` is listed under `props`; it is a component, and it is
  already under `parts` (line 42).
- note: the arrows pan the zoomed image instead of moving to the next image,
  and Escape closes while zoomed. Both match the manifest; a press on `-`
  first and then an arrow is the way to move on. Worth a line in the docs.

Verified: dialog role and name, the caption as `aria-describedby`; focus opens
on Next (on Close for one image) and returns to the thumbnail Button that
opened the viewer; Tab wraps through zoom, close, previous and next; Escape
closes. ArrowRight and ArrowLeft move in reading order and swap in RTL
(ArrowLeft is next in Arabic), Home and End go to the first and last, `+` and
`-` zoom and unzoom once, the arrows pan the zoomed stage (scroll positions
change, negative scrollLeft in RTL), a mouse swipe of 120px moves to the next
image. Previous and Next stay focusable with `aria-disabled` at the ends, so
focus never drops. The status says "Image 1 of 4: Blue hills under a pale sky
with a low sun" once per image (صورة 1 من 4 in Arabic) and the visible counter
is hidden from assistive tech; the error image is an alert and the zoom
button turns off. Zoom and close are 32 by 32, previous and next 44 by 44
(WCAG 2.5.8). Nothing auto advances, so 2.2.2 does not apply. The stage keeps
`touch-action: pan-y pinch-zoom`, so the browser pinch zoom still works
(1.4.4), and the swipe has the buttons and the arrows as its key path
(2.5.7). The panel is the solid body color in every style: images never sit
on glass. Alt text is a required field in the type and the dev warning names
an image with empty alt (1.1.1). Copy: View photo, View 12 photos, View a
missing photo; captions in sentence case; Arabic captions in white Saudi
dialect with Western digits. Manifest anatomy, states (including
`data-error`), keys and motion match the code; react is ready.

### PageShell: pass

- note: `packages/css/src/components/PageShell.css:63`. Neither the header
  nor the nav column is sticky, so nothing can cover focus and WCAG 2.4.11 is
  not at risk; but on a long page the navigation scrolls away with main, and
  an app that pins the header gets no hook for `scroll-padding-block-start`.
  This sits with the missing viewport height token the lane left open.
- note: `packages/css/src/components/PageShell.css:42`. The aside width
  borrows `dialog.width.sm`. The lane left this open; it repeats their note.
- note: `packages/css/src/components/PageShell.css:149`. The footer writes
  `color: var(--ds-color-text-muted)` directly, not through a private
  property, so a recipe cannot change it the way rule 1 of the convention
  asks.
- note: `packages/react/src/components/PageShell/PageShell.demo.tsx:76`.
  Every demo case is `embedded`, so the gallery and the contract never see the
  real landmarks (the reason, a gallery that wraps demos in a `main`, is in
  the lane report). The full page form was checked by mounting a PageShell on
  a bare body through the gallery's Vite server; see Verified.
- note: `packages/react/src/components/PageShell/PageShell.demo.tsx:129`. The
  Arabic Sidebar is labelled الرئيسية, the same word as its first link (line
  32), so the navigation landmark and the Home link share a name. التنقل or
  القائمة الرئيسية reads better. `usePageShell` is listed under `props` in
  `packages/manifest/src/component/PageShell.manifest.json:129`; it is a hook.

Verified: mounted on a bare body (not embedded) at 1280, 900 and 320, LTR
English and RTL Arabic, with a Sidebar, header, aside and footer: one each of
banner, navigation (the Sidebar, named Main or التنقل الرئيسي), main
(`id="main"`), complementary (named More on this page or تفاصيل إضافية) and
contentinfo; axe clean in all four. The first Tab reaches the skip link,
drawn on focus at the inline start (top right in RTL); Enter moves focus to
main and the next Tab reaches the first link in main (WCAG 2.4.1, 2.4.3).
At 320 the column is not rendered, `data-sidebar` is hidden, the menu button
(Open navigation) opens the navigation in a 320 wide Drawer, axe is clean with
it open, and Escape returns focus to the menu button. At 900 the aside moves
under main. In RTL the column sits on the right with its border on the inline
end. The gallery cases pass the contract axe and reflow runs in every style,
scheme and direction. The Sidebar toggle and the shell agree through
`usePageShell`. Manifest anatomy (with `menu`), the `data-sidebar` state, the
Tab order in `keys`, motion `none` and react ready match the code.
