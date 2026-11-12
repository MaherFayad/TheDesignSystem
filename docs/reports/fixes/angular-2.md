# Fix round angular-2 (round 1 of 3)

Branch `claude/ds-angular-fix-2`, cut from `claude/relaxed-hypatia-7gseap`.
Source: `docs/reports/reviews/angular-2.md`. One commit per component,
`a-fix: <Component>`, pushed after each. Only `packages/angular/src/**`,
`apps/gallery-angular/src/app/axes.ts` and the Angular screenshot matrix
changed. No CSS, React, shared, manifest or root file was touched. No
dependency was added.

One subagent (claude-opus-5-5, medium) fixed Form, ConsentField and
Fieldset in the same tree; the lead fixed the rest, ran every proof and
committed.

## Blockers

All 20 are fixed. Each has a unit test that fails on the old code.

| Component | Blocker | Fix | Test |
| --- | --- | --- | --- |
| Checkbox | B1: no check draw markup | The indicator always holds `<span aria-hidden="true">` with the last glyph (a check before any), as React's `forceMount`. DOM now 0 lines against React | "keeps the indicator and a hidden span with the last glyph while unchecked" |
| CheckboxGroup | B1: select all posted `channels=on` | `itemName` takes the group name only when the box has a value (`inGroup()`) | "the select all box takes no group name, so select all posts only the items" |
| RadioGroup | B1: no `click` on the hidden radio | New `internal/bubble-event.ts`: after the checked state of a bubble input changes, dispatch `click` (radio, checkbox) or `input` (slider), as Radix. The first value seen is the start, not a change | "dispatches a click on the hidden radio after a pick" |
| RadioCard | B1: as RadioGroup | Same helper in the bubble effect | same name |
| Rating | B1: as RadioGroup | Same helper over the five inputs | same name |
| Select | B1: an empty Select opened an empty listbox, no description | `isEmpty` joins `inert`; one hidden note span after the trigger holds the loading or empty words (a TemplateRef `empty` renders into it) and joins `aria-describedby`; the in-list `data-part="empty"` row and the list's describedby are gone (late-lanes DOM change) | "an empty list does not open; a hidden note with the empty words describes the trigger" |
| Select | B2: touched when the list opened | Trigger blur skips while open or when focus moves into the layer; closing without focus return marks touched | "is not touched when the list opens and focus moves into it" |
| MultiSelect | B1: as Select B2 | Same rule on the trigger and in `unmount` | "is not touched when the popup opens" |
| Fieldset | B1: no `name` | `name` input, `data-name`, the Form error for that name in the error part, `name` consumed from the host | "with name, inside a Form: shows the Form error for that name" |
| Form | B1: browser `validationMessage` in the summary | Copy per ValidityState flag from the Form labels, in the form's language | "a constraint failure uses the Form copy in the page language" |
| Form | B2: labels shape, validator keys, precedence | React's full `FormLabels` with its English and Arabic defaults; `requiredChoice` for a box or switch, `requiredOption` for a radio group; Angular keys `email`, `pattern`, `min`, `max`, `minlength`, `maxlength`, `required`, `requiredTrue` map to the matching copy; required first, then validators, then constraint copy, as React's `checkAll` | four tests, see the Form spec |
| Form | B3: a passing submit said nothing | The status says `labels.submitted` | "announces a submit that passes" |
| Form | B4: group named after its first option | `groupLabelOf` (legend or radiogroup name) | the choices test ("How should we reach you: ...") |
| Form | B5: demo behind React | "many" case: postal description, `addressChecks`, the reach fieldset | "the demo postal code says which format it wants" |
| ConsentField | B1: `requiredError` missed the summary and replaced other errors | `DsFormContext.setRequiredMessage(name, message)`, React's `useFormRequiredMessage`; the field shows the form error for the name, else `error`. `requiredError` is a string | three tests, including "requiredError never replaces a server error" |
| ConsentField | B2: not touched on blur | Host `focusout` marks touched when focus leaves the field | "is touched when focus leaves the field, with no change" |
| ConsentField | B3: demo behind React `868edaa` | "Purpose and the details link only" case, the Fieldset description with "Read how we use your data", "Each switch saves at once", the long purpose copy | "the demo gives no warning ..." |
| FilterBar (DropdownMenu) | B1: second Space within 1 s did not uncheck | The content keydown returns on `defaultPrevented`, as Radix composes it, so a Space the item used never feeds typeahead. Fixes every checkbox and radio menu item | "a second Space on a checkbox item within the typeahead pause toggles it back" (fails without the fix, checked) |
| NumberField | B1: refused key collapsed the selection | Refuse in `beforeinput` with `preventDefault()`, as React Aria; the `input` fallback stays for input that skips `beforeinput` | "refuses a key in beforeinput, so the selection stays" |

### PDPL check on ConsentField

Saudi PDPL consent, held by code and tests: explicit (no default checked;
a static `checked`, `checked="true"` or `defaultChecked` stays denied, and
a development warning names a stray `defaultChecked`), unbundled (one
purpose per control; the demo test asserts each purpose is its own field),
never pre ticked (only a choice on record with `meta` may start given, and
a warning fires otherwise), withdrawal as easy as giving (one click or
Space either way; a warning fires when a given consent is disabled and so
cannot be withdrawn).

## Recheck of angular-1: items still open

| Item | Result |
| --- | --- |
| R1: ToggleButton and ToggleGroup item drop a caller `[attr.aria-label]` | Fixed. New `internal/own-attribute.ts` writes the attribute only while the component has a value and removes only what it wrote. Test: "keeps a caller aria-label on the text form" now covers `[attr.aria-label]` |
| R2: Link drops `[attr.tabindex]` and `[attr.aria-disabled]` (WCAG 2.4.3) | Fixed with the same helper. Test: "keeps a caller [attr.tabindex] and [attr.aria-disabled]" |
| OTPField N2: heading "OtpField" | Fixed in `apps/gallery-angular/src/app/axes.ts` (`nameOf` with an acronym table). The 18 OTPField pairs are now 0 pixels |
| OTPField R3: DOM behind React | Each filled character sits in a `<span>`, as React. The `otp-fill` motion itself is not played (C5) |
| N-C3: `@angular/forms` not declared | Not fixed: `packages/angular/package.json` is outside `src/**`. Lead change 1 |

## Notes done

- Slider note 1: the hidden input dispatches `input` after a change.
- Checkbox note 2: `defaultChecked` takes the bare attribute.
- Select note 3, MultiSelect spinner: `span[dsSpinner]` replaces the hand built spinner.
- TagField note 1: remove buttons are `button[dsCloseButton]`; `DsNativeButton` is gone from TagField.
- TagField note 2: the Arabic hint goes through Bidi (`<bdi dir="ltr">Enter</bdi>`), WCAG 1.3.2.
- ToggleGroup demo: `موعدها هالأسبوع`. SegmentedControl demo: "labels wrap".
- C4: every Angular demo grid writes `minmax(min(Nrem, 100%), 1fr)`, as React's DemoGrid (WCAG 1.4.10).
- Form note 8: the summary link and first focus land on a radio item even at `tabindex="-1"`. React has the same gap (lead change 2).
- ConsentField note 5: React's development warnings are ported.
- Checkbox bubble input: the inline style keeps Radix's property order (`dsOrderedStyle`), as Switch.

## Notes not done

- MultiSelect note 2: the search box is still inline SearchField DOM; swapping to `div[dsSearchField]` touches focus and Escape handling. Round 2.
- ListBox note 1 (`onTouched` skipped with a bound `highlightedValue`), RangeSlider note 1 (`data-active` and inline `z-index`), NumberField note 3 (Home on "-"): not a few lines with a test each; round 2.
- Slider note 3 (`format.ts` to `packages/shared`), C2, C3, C5 to C10: outside my files or lead decisions.
- ConsentField note 4: the manifest `angular.note`; manifests are not mine this round (lead change 3).
- DOM changes from `round-2.md`: the Sheet toast measurement has no Angular Sheet to land in. Breadcrumbs, Switch, OTPField, motion: no DOM change. From `late-lanes.md`: Select, TagField and Fieldset applied above; Form `body` is CSS only; ToggleGroup and SegmentedControl CSS only; the rest no DOM change.

## Proofs

- `npm run check`: green before any change (the first run raced an edit in progress; every step before the Angular check passed), and green after all fixes (summary: every step pass).
- Contract, `npm run contract -- --framework angular --url http://localhost:5302 --component <Name>`, 0 failed for all 21:

  ```text
  Checkbox, CheckboxGroup, ConsentField, Fieldset, Form              29 passed each
  RadioGroup, RadioCard, Rating, Slider, RangeSlider                 29 passed each
  NumberField, OTPField, Link, ToggleButton, ToggleGroup             29 passed each
  SegmentedControl                                                   29 passed
  TagField, FilterBar                                                29 passed, 15 skipped (React the same)
  Select, MultiSelect, DropdownMenu                                  44 passed each
  ```

- DOM, `docs/reports/shots/angular/compare-dom.mjs` on `/c/<kebab>?chrome=0`, React 5301 against Angular 5302: 0 lines for Checkbox, CheckboxGroup, RadioGroup, RadioCard, Rating, Select, MultiSelect, Slider, RangeSlider, TagField, DropdownMenu, FilterBar, Fieldset, ToggleGroup, SegmentedControl, Link, ToggleButton. What remains, each explained:
  - Form, NumberField, OTPField: React's `style="transform-origin: 50% 50%"` on invalid inputs, from the error shake (`useErrorShake`). Angular has no shake (C5).
  - Form: summary link `href` values carry the generated control ids, which the script does not normalize.
  - ConsentField: the control and purpose label ids are numbered in the other order; the relation (`for`, `aria-labelledby`) is the same.
- Pixels: fresh captures of the 21 kebabs in both frameworks (`--no-verify`), then `npm run shots -- --compare react angular`: 372 pairs in scope, 372 pass, all 0 differing pixels. Table: `docs/reports/fixes/angular-2-compare.md`. The Angular PNGs are committed; the React matrix folder and the full compare table were restored, because a narrowed run rewrites the full index with fewer pairs.

## Changes needed from the lead

1. `packages/angular/package.json`: declare `@angular/forms` and `@the-system/motion` (review C3, fifth report).
2. React `Form.tsx` `visibleTarget`: a radio item at `tabindex="-1"` is a valid target, so a named RadioGroup with no value gets a summary link and first focus. Line to add: `if (prev instanceof HTMLButtonElement && prev.getAttribute('role') === 'radio' && !prev.disabled) return prev;`
3. ConsentField manifest `angular.note`: drop "private stand ins"; the real `dsCheckbox` and `dsSwitch` are used.
4. An Angular motion order for wo-1.21 (C5): Input, NumberField and OTPField error shake, `field-step`, `otp-fill`, Slider nudge, Rating fill. The DOM hooks (Checkbox draw span, OTPField character span) are in place.
5. C6: `labelOf` in both Form ports ignores `aria-labelledby` (ListBox, MultiSelect, Slider summary entries have no name). Best fixed once in `packages/shared/src/form.ts`.
6. C7: the contract suite should submit a form (summary text, focus, status) and open an empty Select; both kinds of blocker in this round passed a green contract run.
7. A full `npm run shots` for both frameworks to refresh the committed compare table with this round's Angular captures.
