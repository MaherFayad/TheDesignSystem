# Review: Angular batches A3, A4 and the late ports

Fresh eyes review by ds-qa of the Angular port on branch
`claude/ds-review-angular-2`, cut from `claude/relaxed-hypatia-7gseap` at
`6fabe3c`. No source file was edited. Four ds-qa subagents (claude-opus-5-5,
medium) each took one slice: A3.1 and A3.2, A3.3, A4, and the late ports with
the recheck. The lead ran the screenshot matrix and the pixel compare,
explained every differing pixel, checked each blocker against the code, and
read the builders' reports (`docs/reports/lanes/angular-a3.md`,
`angular-a4.md`) only after the findings below were formed. There is no
`angular-sync.md`; the sync is commits `b86823a` to `45c0cee`. Where a
finding repeats a point a builder left open, it says so.

Evidence: `docs/reports/reviews/shots/angular-2/` (`a3-checks/`,
`a3-lists/`, `a4-forms/`, `late/`, `recheck/`, `pixels/`).

## Verdicts

| Batch | Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- | --- |
| A3.1 | Checkbox | fix needed | 1 | 1 |
| A3.1 | CheckboxGroup | fix needed | 1 | 1 |
| A3.1 | Switch | pass | 0 | 1 |
| A3.1 | Slider | pass | 0 | 3 |
| A3.1 | RangeSlider | pass | 0 | 1 |
| A3.2 | RadioGroup | fix needed | 1 | 1 |
| A3.2 | RadioCard | fix needed | 1 | 1 |
| A3.2 | Rating | fix needed | 1 | 2 |
| A3.3 | ListBox | pass | 0 | 4 |
| A3.3 | Combobox | pass | 0 | 1 |
| A3.3 | Autocomplete | pass | 0 | 2 |
| A3.3 | Select | fix needed | 2 | 2 |
| A3.3 | MultiSelect | fix needed | 1 | 2 |
| A3.3 | TagField | pass | 0 | 2 |
| A4 | Fieldset | fix needed | 1 | 3 |
| A4 | Form | fix needed | 5 | 3 |
| A4 | ConsentField | fix needed | 3 | 3 |
| A4 | Stepper | pass | 0 | 1 |
| A4 | FormWizard | pass | 0 | 3 |
| A4 | FilterBar | fix needed (in DropdownMenu) | 1 | 1 |
| A1.2 | ToggleGroup | pass | 0 | 2 |
| A1.2 | SegmentedControl | pass | 0 | 1 |
| A2.2 | NumberField | fix needed | 1 | 3 |
| A2.2 | ScrubInput | pass | 0 | 0 |

Twenty blockers in twelve of the 24 components. They come from fewer
causes than that:

- The Angular Form was ported before React's "fix-late: Form" (`754c1b1`)
  and was not synced. That one gap accounts for Form B1 to B5, ConsentField
  B1 and B3, and Fieldset B1.
- The hidden radio in RadioGroup, RadioCard and Rating fires no `click`
  (three blockers, one fix).
- Select and MultiSelect mark the control touched when the list opens (two
  blockers, one fix).

## Recheck of angular-1

| Item | angular-1 finding | Status | Evidence |
| --- | --- | --- | --- |
| ToggleButton | B1: a caller `preventDefault()` did not stop the toggle on a trusted click or Space | fixed | `recheck/prevent.react.txt`, `prevent.angular.txt` |
| ToggleButton | B2: the `null` binding removed a static `aria-label` | fixed for `aria-label` and `[aria-label]`; `[attr.aria-label]` still removed (note R1) | `recheck/static-attributes-probe.txt` t2, t3, t5 |
| CopyButton | B1: `preventDefault()` ignored; N2: clipboard write after a microtask | fixed; the write now starts inside the click | `recheck/prevent.*.txt` |
| Link | B1: static `tabindex="-1"` dropped; N2: `aria-disabled` not passed | fixed for the static and `[tabIndex]` forms; `[attr.tabindex]` and `[attr.aria-disabled]` still dropped (note R2) | probes l2, l2d, l3, l4, l5 |
| DropdownMenu demo | B4: Arabic board menu opened `dir=ltr lang=en` | fixed | `recheck/dropdown-arabic.txt`, `dropdown-menu-open.txt` |
| InlineEdit | B1: Enter, Space, click closed the editor at once, focus fell to body | fixed | `recheck/inline-edit.react.txt`, `inline-edit.angular.txt` |
| OTPField demo | B2: grid overflowed below 352px | fixed | `recheck/otp-field.txt` |
| OTPField | N2: heading "OtpField" | not fixed (Angular gallery) | `recheck/otp-field.txt` |
| OTPField | DOM equal to React | regressed: React moved ahead (note R3) | `recheck/otp-field.studio.diff` |
| Toast | B1: Dialog pulled focus out of the toaster | fixed | `recheck/toast-dialog-standin.txt` |
| Toast, Alert, Banner | close part on `dsIconButton` | fixed: all three and Dialog use `dsCloseButton` | `toast.ts:82`, `alert.ts:74`, `banner.ts:103`, `dialog.ts:326` |
| ToggleGroup, SegmentedControl | A1.2 not ported | ported, both pass; A1.2 closed | below |
| NumberField, ScrubInput | A2.2 not ported | ported; ScrubInput passes, NumberField has one blocker | below |
| N-C1 | slug `otpfield` vs `otp-field` | fixed on the React side; the Angular heading is still wrong | `recheck/otp-field.txt` |
| N-C3 | `@angular/forms` not declared | not fixed (note C3) | `packages/angular/package.json` |

ToggleButton and CopyButton: `internal/late-listener.ts` adds the
component's click listener in `afterNextRender`, after the template's
`(click)`, and decides synchronously (`toggle-button.ts:78,86-92`,
`copy-button.ts:99,115-118`, `toggle-group/group-item.ts:382-389`). A caller
listener where a template `(click)` sits keeps the state by mouse, Space and
`el.click()`; the clipboard keeps its sentinel. angular-1's own script still
toggles in Angular, because it adds a bubble listener after the first render,
which now runs after the component's. That is not where an Angular caller's
listener sits; count it as fixed and write the limit in the manifest's
angular note.

InlineEdit: `inline-edit.ts:303-304` ignores a `focusout` from the display
part or from a node no longer in the page. Enter, Space and click give
`state=editing focus=INPUT/control` with the text selected, in LTR and RTL,
line for line with React. Unit test `inline-edit.spec.ts:82`. React still
relies on closure timing (`InlineEdit.tsx:225-236`), as angular-1 said.

Toast: `dialog.ts:378` (keydown) and `:397` (focusin) return early for
`isInsideToaster`, with Angular twins of the React tests in
`dialog/dialog-toast.spec.ts:77,101,111`. Driven live with a stand in
`div[data-toaster-layer]` inside an open Angular Dialog (no gallery page has
both): focus stays in the layer, a click and Escape there leave the dialog
open; without the attribute focus is pulled back and Escape closes.

### Notes from the recheck

- **R1.** `toggle-button.ts:28` and `toggle-group/group-item.ts:335` bind
  `aria-label` to `null` when the input is unset, which removes a caller's
  `[attr.aria-label]`. The input forms work. Write "use `[aria-label]`" in
  the manifest notes, or bind only when the input is set.
- **R2.** WCAG 2.4.3. `link.ts:42,47`: `[attr.tabindex]="-1"` and
  `[attr.aria-disabled]` are dropped, so a link bound that way is back in the
  tab order: the angular-1 B1 effect through another syntax. `[tabIndex]`,
  `[tabindex]` and the static attribute work. Same fix as R1.
- **R3.** `OTPField.tsx:148-166,379` now wraps each filled character in a
  `<span>` for the `otp-fill` motion (wo-1.21). Angular has neither; the DOM
  diff is 315 lines; pixels still pass. Part of note C5.

## What was run

- `npm run check`: green at the start, and green again at the end run alone
  (every workspace, Angular unit tests, gallery build). Runs during the
  review failed on the reviewers' temporary specs and on load timeouts
  (`tag-field.spec.ts` "Enter adds the typed text", two lint tests at
  5000 ms); none reproduced alone.
- Galleries: React on port 5301, Angular on port 5302, both dev servers,
  shared by every run.
- DOM: `docs/reports/shots/angular/compare-dom.mjs` on every page in scope in
  studio, desk and desk `dir=rtl&lang=ar`, plus probes that open every popup
  (Select, Combobox, Autocomplete, MultiSelect, TagField, the FilterBar and
  DropdownMenu menus) and dump the portal with ids normalized.
- Contract: `npm run contract -- --framework angular --url http://localhost:5302 --component <Name>`.
  Every component passes, 0 failed:

  ```text
  Checkbox, CheckboxGroup, Switch, Slider, RangeSlider        29 passed each
  RadioGroup, RadioCard, Rating                               29 passed each
  ListBox                                                     29 passed
  Combobox, Select, MultiSelect                               44 passed each
  Autocomplete, TagField                                      29 passed, 15 skipped (React the same)
  Fieldset, Form, ConsentField, Stepper, FormWizard           29 passed each
  FilterBar                                                   29 passed, 15 skipped (React the same)
  ToggleGroup, SegmentedControl, NumberField, ScrubInput      29 passed each
  recheck: ToggleButton, CopyButton, Link, InlineEdit, OTPField 29 each; DropdownMenu, Toast, Dialog 44 each
  ```

  A green contract run does not clear Form, ConsentField or Select: the suite
  never submits a form and never opens the empty Select. See note C7.
- Pixels: `npm run shots` for React and Angular on the 24 kebabs in scope
  (414 shots each, `--no-verify`), then `npm run shots -- --compare react angular`:
  372 pairs in scope, 372 pass, 336 at 0 pixels, 36 with differing pixels,
  all explained below. Table: `pixels/compare.md`.
- Keyboard: Playwright walks in LTR studio and RTL desk Arabic for every
  page, React and Angular side by side (Tab order, Space, Enter, arrows with
  the RTL flip, Home, End, PageUp, PageDown, typeahead, Escape, focus
  return), plus pointer drags in RTL for the sliders and ScrubInput. Traces
  under `a3-checks/keys/`, `a3-lists/keys/`, `a4-forms/probes/`,
  `late/keys/`.
- axe: `@axe-core/playwright`, WCAG 2.0 to 2.2 A and AA plus best practice,
  both directions, both galleries. Equal in both frameworks on every page
  except the Select empty case (Select B1).
- Forms: temporary Vitest specs, deleted from the tree after the run, copies
  in `a3-checks/forms/`, `a3-lists/qa-specs/`, `a4-forms/specs/`,
  `late/forms/`. Each control through `FormControl` and `ngModel`: model to
  view, view to model, `disable()` and `enable()`, touched on blur,
  validators, the error in a `dsForm` summary, and inside a required
  `div[dsField]`: label `for`, `aria-describedby` order, `aria-invalid`,
  `aria-required`, `data-invalid`. React twins where a result needed one.
- Hygiene: static input probes on every host; grep for `@Input`, `@Output`,
  `NgZone`, `markForCheck`, `NG_VALUE_ACCESSOR`, `model(`, raw `<button>`.

### Every differing pixel

| Component | Pairs | Pixels | Cause |
| --- | --- | --- | --- |
| Switch | 18 of 18 | 103 to 134 (at most 0.013 percent) | Demo copy. The Arabic off text is `متوقف` in `switch.demo.ts:135`; React's demo says `غير مفعل` (`Switch.demo.tsx:51,92`). Crops: `pixels/switch-studio-dark-ltr-react.png`, `-angular.png`. |
| FormWizard | 18 of 18 | 32 to 136 (at most 0.009 percent) | The required asterisk sits about 4 px further from the label. `field/field.ts:97` renders the `label` input through `{{ text }}` on its own line, so the label text is `" Full name "` and the trailing space shows before the mark. React renders `"Full name"`. Crops: `pixels/form-wizard-a-react.png`, `-angular.png`. Note C1. |

Every other pair in scope is 0 pixels, Combobox, Select and MultiSelect open
states included. The Field whitespace also sits on Select, Slider and every
`dsField [label]` page, but shows only where a required mark follows the
text.

## What holds across the 24

Not repeated per component:

- Standalone, OnPush (directives excepted), signal inputs, no `@Input` or
  `@Output` decorators, no `NgZone`, no `markForCheck` outside one spec.
  Value props are `model()`; every value control implements
  `ControlValueAccessor`.
- No wrapper element React does not have. No selector marker or consumed
  static input left on a host, in the gallery DOM or in the probes.
- Popups (Select, Combobox, Autocomplete, MultiSelect, TagField) use a CDK
  `ComponentPortal` on body whose host is the themed layer; no CDK Overlay
  pane. Every Arabic demo popup opens with `dir="rtl" lang="ar"`. The only
  body level difference is Radix's two focus guard spans; Angular wraps Tab
  by hand.
- Roving groups and sliders flip arrows in RTL in both frameworks.
- Shared logic comes from `packages/shared`: `filter.ts`, `listbox.ts`,
  `tags.ts`, `number.ts`, `scrub.ts`, `form.ts`, `stepper.ts`.
- The Field API: every control in scope, inside a required `div[dsField]`,
  gets label `for` on the focusable control, `aria-describedby` with
  description then error, `aria-invalid`, `aria-required` and `data-invalid`
  as React. CheckboxGroup, RadioGroup and RadioCard read the Field as
  React's do (see their notes).

## A3.1: checks and sliders

### Checkbox: fix needed

Keys, axe, contract, forms, Field wiring and the static probe equal React.

1. **Blocker.** `packages/angular/src/components/checkbox/checkbox.ts:92`.
   The check draw markup from wo-1.21 (`f3e65e7`) is missing. React renders
   the indicator with `forceMount` and keeps a `<span aria-hidden="true">`
   with the last glyph inside it while unchecked (`Checkbox.tsx:106-112,160-164`);
   `Checkbox.css:158-187` animates `> span`. Angular renders the svg straight
   in the indicator and only while checked or indeterminate. The DOM diff is
   about 400 lines per page (`a3-checks/dom/checkbox-*.diff`), and
   `getAnimations()` after a check gives React
   `CSSTransition:transform:SPAN, CSSTransition:transform:svg` and Angular
   nothing (`a3-checks/checkbox-draw/result.txt`). Static pixels are 0, so the
   compare cannot see it. The sync commit `8823fb8` came after `f3e65e7` and
   did not pick it up. Fix: render the span always and keep the last glyph.
2. Note. `checkbox.ts:121`: `defaultChecked` has no transform, so the bare
   attribute fails the type check (TS2322). Switch accepts it.

### CheckboxGroup: fix needed

1. **Blocker.** `checkbox.ts:164`:
   `itemName = computed(() => this.name() ?? this.group?.name())`. The select
   all item has no value, so React gives it no group context and its bubble
   input no name. In Angular it takes the group name and posts an extra
   entry. FormData after select all: React `channels=a&channels=b`, Angular
   `channels=on&channels=a&channels=b` (`a3-checks/forms/react-result.txt`,
   `angular-result.txt`). Fix: take the group name only when `inGroup()`.
2. Note, shared with React. Inside a Field the label `for` points at the
   first item's control, which takes the Field's id, `aria-describedby` and
   `aria-required`, while the fieldset gets nothing. React's CheckboxGroup
   does not read the Field either. Contract question for the lead: a group
   in a Field should be named by `aria-labelledby` on the group.

### Switch: pass

1. Note. `switch.demo.ts:135`: the Arabic off text, see the pixel table.

### Slider: pass

Keys in LTR and RTL (arrows flip, Up and Down keep their sense, PageUp,
PageDown and Shift+arrow move 10 steps, Home, End, step 0.05),
`aria-valuetext` with units, pointer drag in RTL, clamping, the hidden input
(`volume=31`, `name[]` with two thumbs, reset), forms and Field wiring all
equal React.

1. Note. `slider/slider-base.ts:92`: the hidden input never dispatches
   `input`; Radix's bubble input does. No user effect was found in jsdom;
   fix it with the radio blocker below.
2. Note. React plays `slider-nudge` at the ends; Angular has no motion. See
   C5.
3. Note. `slider/format.ts` copies the React `format.ts`. Move it to
   `packages/shared`.

### RangeSlider: pass

Thumbs never cross by key or drag; Home and End stop at the other thumb
minus the gap; forms post `price[]=21&price[]=80`.

1. Note. `slider-base.ts:86,312`: Angular stamps `data-active` on the last
   pressed or focused thumb and writes an inline `z-index: 1` on its wrapper.
   React lifts the focused thumb in CSS with `:has(:focus)`
   (`RangeSlider.css:26`), so after any interaction the DOM differs and after
   blur the last thumb stays on top only in Angular. The inline value is a
   raw z-index. The builder asked React to copy the Angular approach
   (`angular-a3.md`, change 5); React went the CSS way instead. Remove the
   Angular state and the comment at `range-slider.ts:13-17`.

## A3.2: radios

### RadioGroup: fix needed

DOM, contract, axe and keys equal React: one tab stop, entry at the checked
item, arrows move and select in reading order and flip in RTL, Home, End,
PageUp and PageDown, Space selects, Enter does nothing.

1. **Blocker.** WCAG 3.3.1 error identification.
   `packages/angular/src/components/radio-group/radio-group.ts:262-272`: the
   hidden radio gets its `checked` state but no `click` is dispatched.
   Radix dispatches one so a form sees the change, and Checkbox and Switch
   copy that (`checkbox.ts:206-212`). `dsForm` clears an error on `click`
   from a radio input (`form/form.ts:483-486`), so after a failed submit,
   picking an option leaves its entry in the summary until the next submit.
   Measured with the same markup: React `Form` summary after picking view,
   plan and score: `Pick 10 or more.`; Angular `dsForm`:
   `Pick 10 or more. | Fill in this field. | Fill in this field. | Fill in this field.`
   Form listener: React `click:view click:plan click:score`, Angular none.
   Fix: dispatch `click` on the hidden radio after a change, as Checkbox does.
2. Note, shared with React. Inside a Field the label `for` points at nothing
   and the group gets no `aria-labelledby` from the Field. Same contract
   question as CheckboxGroup.

### RadioCard: fix needed

1. **Blocker.** As RadioGroup 1, at `radio-card/radio-card.ts:296-306`.
2. Note. The Field gap, as RadioGroup.

### Rating: fix needed

Keys (horizontal, no loop, arrows flip in RTL, Home and End pick 1 and max),
Arabic names, read only `role="img"` and forms equal React.

1. **Blocker.** As RadioGroup 1, at `rating/rating.ts:143-153`.
2. Note. `rating-fill` is not played (animations after a pick: React 5,
   Angular 1). See C5.
3. Note. `rating.ts:200`: projected text is read once, as the file says.

## A3.3: list family

Across all six: the closed DOM, the open popup DOM, 19 keyboard traces
(arrows, Home, End, typeahead with Arabic alef folding, Space, Enter, Ctrl+A,
Escape twice, Alt+ArrowDown, Tab, Backspace and Delete on tags, the RTL flip
of the horizontal ListBox), outside click and focus return all equal React.

### ListBox: pass

1. Note. `list-box/list-box.ts:421`:
   `if (this.virtualFocus() || this.highlightedValue() !== undefined) return;`
   skips `onTouched()` when a consumer binds `[(highlightedValue)]`, so that
   control is never touched. Call `onTouched` on leave either way.
2. Note. In a `dsForm` summary the ListBox entry has no field name. Form's
   `labelOf` reads `.labels` then `aria-label` (React the same,
   `Form.tsx:276`). See C6.
3. Note, shared with React. axe best practice `label-content-name-mismatch`
   on options with a description.
4. Note (demo). `list-box.demo.ts:65`, `combobox.demo.ts:76`,
   `autocomplete.demo.ts:80`: the grid minimum, see C4.

### Combobox: pass

Forms both ways, `setValue(null)` clears the text, `disable()` sets native
`disabled` and `data-disabled`, touched on blur, Field wiring on the input.

1. Note (demo). C4.

### Autocomplete: pass

1. Note. axe `target-size` lists one extra node in React and none in
   Angular, depending on popup overlap at that moment. Angular is not worse.
2. Note (demo). C4.

### Select: fix needed

The open DOM equals Radix Select (content, `<style>`, viewport, items,
wrapper `dir`), as do the keys, typeahead on the closed trigger, Escape and
focus return, and the bubble `<select>` in a form.

1. **Blocker.** WCAG 4.1.2 name, role, value and 1.3.1 info and
   relationships. `packages/angular/src/components/select/select.ts:239`:

   ```ts
   private readonly inert = computed(() => this.isReadOnly() || this.loading());
   ```

   React: `Select.tsx:156` `hasNote = loading || isEmpty`, `:173`
   `inert = Boolean(controlReadOnly || loading || isEmpty)`. With no option
   React does not open and describes the trigger with a hidden span holding
   the empty words. Angular, measured on the empty case: no description, and
   click or ArrowDown opens a `role="listbox"` with no option. axe on that
   state: Angular `aria-required-children` on the list, React nothing.
   Evidence: `a3-lists/dom/closed-select-*.diff`,
   `a3-lists/open/select-empty-key.diff`, `a3-lists/axe/`. Fix: add the
   empty check to `inert`, render the note span for `loading || empty` and
   add its id to `describedBy` (`:227`, effect at `:347`).
2. **Blocker.** Forms. `select.ts:142`: `'(blur)': 'onTouched()'`. Opening
   the list moves focus to an item, so the trigger blurs and the control is
   touched before anything is picked; an `invalid && touched` error then
   shows under the open list. Spec `a3-lists/qa-specs/select.qa.spec.ts`,
   "touched on blur, and when the list opens", fails. Fix: mark touched when
   focus leaves both the trigger and the layer, or skip it while open.
3. Note. `select.ts:144` writes the spinner DOM by hand; `span[dsSpinner]`
   exists and React uses `<Spinner size="sm" decorative />`. A stand in to
   replace. The DOM is equal.
4. Note, shared with React. axe `aria-hidden-focus`, `region`,
   `landmark-one-main`, `page-has-heading-one` on the open list, because the
   app is hidden while the list is modal.

### MultiSelect: fix needed

1. **Blocker.** Forms. `multi-select/multi-select.ts:158`:
   `(blur)="onTouched()"` on the trigger, the same as Select B2.
   `a3-lists/qa-specs/run.txt`.
2. Note. `multi-select.ts:29-33` says SearchField has no Angular port;
   `div[dsSearchField]` exists (`search-field.ts:79`) and React uses it, yet
   `:163` writes its DOM inline, and the spinner is hand built too. Two stale
   stand ins. The builder's change 7 (an Arabic `clearLabel`) also waits on
   this.
3. Note. The summary link reads "Fill in this field." without the field
   name: a `div[role=combobox]` has no `.labels`. See C6.

### TagField: pass

1. Note. `tag-field/tag-field.ts:28-32,117` copies the CloseButton DOM onto
   `button dsNativeButton` with a comment that CloseButton has no port.
   `button[dsCloseButton]` exists (`close-button/close-button.ts:21`) and
   React uses it. `DsNativeButton` is meant for parts Radix renders as plain
   buttons; here it carries a CloseButton copy past the button gate. Swap it.
2. Note (demo). `tag-field.demo.ts:89` passes `copy.ar.hint` as plain text;
   React wraps it in `<Bidi>`, which isolates "Enter" in `<bdi dir="ltr">`.
   Use `field/demo-bidi.ts`. WCAG 1.3.2 meaningful sequence for the mixed
   direction line.

## A4: forms

### Fieldset: fix needed

DOM, axe, contract and keyboard equal React apart from the items below.

1. **Blocker.** `packages/angular/src/components/fieldset/fieldset.ts:52-103`
   has no `name` input. React's Fieldset takes `name`, writes `data-name` and
   shows the Form error for that name in its error part
   (`useFormFieldError(name)`, tested at `Form.test.tsx:324`). In Angular a
   static `name="reach"` stays on the host as a native attribute React does
   not render, and the group error never shows. Measured:
   `fieldset dataName=null nameAttr="reach" invalid=false error=null describedby=null`
   (`a4-forms/specs/form.qa.result.txt`, GROUP). Fix: a `name` input read
   against `DsFormContext.errors()`, `data-name`, and `name` in
   `consumeHostAttributes`.
2. Note. The demo's Checkbox shows Checkbox B1 (`a4-forms/dom/fieldset-*.diff`).
3. Note (demo). `fieldset.demo.ts:43,51,86`, `form.demo.ts:60`,
   `consent-field.demo.ts:33,38`: C4.
4. Note, shared with React. A native `disabled` fieldset does not disable
   controls that are not native form controls: the Slider thumb still moves,
   the RadioGroup stays in the tab order, a click opens the Select, and no
   child gets `data-disabled` (`a4-forms/probes/fieldset-disabled.txt`). The
   same in both frameworks. A lead decision for both.

### Form: fix needed

What works, with FormGroup and with ngModel, using Input, Checkbox,
RadioGroup, Select, Slider, Switch and ConsentField: every error reaches the
summary, focus moves to the first invalid field on submit, each summary link
focuses the visible control, and `markAllAsTouched` runs on submit
(`a4-forms/specs/form.qa.result.txt`). The A4 builder reported Form equal in
every case; React then landed `754c1b1` ("fix-late: Form", 15:42) and the
Angular review fixes (`d944e12`, 15:51) did not port it. Items 1 to 5 are
that gap.

1. **Blocker.** WCAG 3.3.3 error suggestion and 3.1.2 language of parts.
   `packages/angular/src/components/form/form.ts:176`:

   ```ts
   else if (!c.checkValidity()) out[c.name] = c.validationMessage || labels.invalid;
   ```

   The summary shows the browser's message, in the browser's language. React
   uses Form copy per ValidityState flag. Arabic form, email "sara": React
   `اكتب بريد إلكتروني صحيح، مثل name@example.com.`, Angular
   `Please include an '@' in the email address. 'sara' is missing an '@'.`
   Postal "12": React "Enter the 5 digit postal code.", Angular "Please
   match the requested format." (`a4-forms/probes/form-arabic.txt`,
   `form-submit.txt`).
2. **Blocker.** WCAG 3.3.1. `form.ts:75-104` and `angular-forms.ts:25,33`:
   `FormLabels` lacks React's `requiredChoice`, `requiredOption`,
   `typeMismatch`, `patternMismatch`, `tooShort`, `tooLong`,
   `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput` and
   `submitted`. A required Checkbox, Switch, RadioGroup or ConsentField says
   "Fill in this field." where React says "Tick this box to go on." or "Pick
   one option to go on."; Angular validator errors such as `min` all read
   "Check the value in this field.". The `labels` input is not React's
   shape. By code reading only: `builtInErrors` (`:380-382`, passed as
   `base` at `:415`) lets a constraint message beat a custom validator for
   the same name; React's `checkAll` lets the validator win.
3. **Blocker.** WCAG 4.1.3 status messages. `form.ts:427,449`: a passing
   submit sets `submitted` but announces nothing. React's status says "The
   form was sent.". Measured status text: React `"The form was sent. "`,
   Angular `""` (`a4-forms/probes/form-submit.txt`).
4. **Blocker.** WCAG 3.3.1. `form.ts:360`: the summary label is always
   `labelOf(target)`; React's `groupLabelOf` (the legend or the radiogroup
   name) is missing, so a group is named after its first option. Measured:
   "Email: Pick at least one way to reach you." where React says "How should
   we reach you: ...".
5. **Blocker (demo).** `form.demo.ts:102-128` ("many") lacks React's postal
   description, its `addressChecks` validators and the `reach` checkbox
   fieldset (React demo lines 128-150). DOM diff 335 lines in studio
   (`a4-forms/dom/form-style_studio.diff`).
6. Note. Desk: React's invalid inputs carry `style="transform-origin: 50% 50%"`
   from the error shake (`useErrorShake`, `e93564a`). Angular Input has no
   shake. See C5.
7. Note. The Slider summary entry has no field name, because `labelOf`
   ignores `aria-labelledby`. See C6.
8. Note, likely shared with React. A named RadioGroup with no value gives a
   summary item with no link, and as the first invalid field, script focus
   lands on its `aria-hidden` input: `visibleTarget` needs `tabIndex >= 0`
   and every roving item is -1. React not measured (no such demo).

### ConsentField: fix needed

No default checked input: a static `checked` fails the type check,
`defaultChecked` is consumed, the state starts denied. Space and a click on
the purpose toggle, the details link is in the tab order, axe is clean,
`disable()` and `enable()` set and clear native `disabled` and
`data-disabled`. The private Checkbox and Switch stand ins the A4 builder
left (`consent-field/stand-ins.ts`) are gone; the real `DsCheckbox` and
`DsSwitch` are used.

1. **Blocker.** WCAG 3.3.1. `requiredError` never reaches the summary:
   `form.ts` has no `setRequiredMessage` (React `useFormRequiredMessage`).
   The field says "Agree to the terms to open an account."; the summary says
   "I agree to the terms.: Fill in this field.". React shows the same words
   in both. Also `consent-field.ts:172`
   (`fromForm !== undefined ? (this.requiredError() ?? fromForm)`) replaces
   any form, validator or server error for the name with `requiredError` in
   the field, so field and summary disagree.
2. **Blocker.** Forms. Not touched on blur: `onTouched` runs only in
   `decide` (`consent-field.ts:213`). After focus and blur with no change,
   `touched` stays false, so `updateOn: 'blur'` and error on touched
   patterns fail.
3. **Blocker (demo).** The demo is behind React's "fix-late: ConsentField"
   (`868edaa`): the "Purpose and the details link only" case, the Fieldset
   description with "Read how we use your data", and the "Each switch saves
   at once" copy are missing; the long purpose copy differs
   (`a4-forms/dom/consent-field-style_studio.diff`).
4. Note. The manifest `angular.note` still says the Checkbox and Switch are
   private stand ins. They are not.
5. Note. React's development warnings (stray `defaultChecked`, a given
   consent that is disabled, no `detailsHref`) are not ported.
6. Note. ngModel model to view after the first render could not be proven in
   the zoneless test harness; a plain `dsCheckbox` fails the same way there,
   so it reads as the harness (see angular-1 N-C7).

### Stepper: pass

DOM 0 lines in all three modes, `aria-current="step"` on the `li`, Arabic
status words.

1. Note, shared with React. WCAG 2.4.3. After Enter or Space on a step
   action, focus falls to `body` in both frameworks: the picked step becomes
   plain text (`a4-forms/probes/keys.txt`).

### FormWizard: pass

Next on an empty step keeps the step, marks it invalid and focuses the first
field; a valid Next focuses the h2 and announces "Step 2 of 4, Address";
earlier steps keep their values (`a4-forms/probes/wizard.txt`).

1. Note, shared with React. `form-wizard.ts:169` and React's `stepErrors` use
   `validationMessage`, the browser's language. WCAG 3.1.2.
2. Note. The panel does not read FormGroup errors; step checks see only the
   DOM and `validate`.
3. Note. The pixel difference: C1. The desk shake: C5.

### FilterBar: fix needed (blocker in DropdownMenu)

Closed DOM and open more menu DOM 0 lines in studio and RTL Arabic; chips by
Space and Enter with `aria-pressed`; Escape back to the trigger; clear all
focuses the search box.

1. **Blocker.** WCAG 2.1.1 keyboard. In the more menu, a second Space within
   1 s does not uncheck the item: Space, Space 200 ms apart on "Archived":
   React `true -> false`, Angular `true -> true`; with a 1.3 s pause Angular
   works (`a4-forms/probes/filter-more.txt`, `filter-more-2.txt`). Cause:
   `packages/angular/src/components/dropdown-menu/dropdown-menu.ts:318`
   feeds typeahead the Space the item already used (`:899-901` calls
   `preventDefault`), so the next Space is read as a search character
   (`:897`, `search !== ''`). Radix skips typeahead when `defaultPrevented`.
   Fix: return early from typeahead on `event.defaultPrevented`. The fix is
   in DropdownMenu (A1.2), so every checkbox and radio menu item has it.
2. Note. The chips are a private stand in (`filter-bar/stand-in-chip.ts`).
   Justified: there is no Angular Chip port. React uses Chip.

## Late ports

### ToggleGroup: pass

DOM equal; 33 groups walked in LTR and RTL identical (Tab enters on the on
item, ArrowRight goes back in RTL, wrap, Home, End, vertical groups,
`aria-pressed` for multiple and `role=radio` with `aria-checked` for single,
disabled items stay in the arrow order). Forms both ways, `disable()` sets
`aria-disabled` and `data-disabled`.

1. Note. `group-item.ts:335`: R1.
2. Note (demo). The Arabic chip `تنتهي هذا الأسبوع`; React now has
   `موعدها هالأسبوع`.

### SegmentedControl: pass

DOM with the indicator equal, selection follows focus, arrows mirrored in
RTL, the value never empties.

1. Note (demo). `segmented-control.demo.ts:91` says "labels end in an
   ellipsis"; React now says "labels wrap" (`SegmentedControl.demo.tsx:110`).

### NumberField: fix needed

No role, `aria-roledescription` "Number field" or "حقل رقمي",
`inputmode=numeric`, named steppers with `tabindex=-1`, ArrowUp, ArrowDown,
PageUp, PageDown, Home, End, Enter formats, blur clamps, Arabic digits
`١٢٫٥` read as 12.5, the wheel never changes the value, live region and
Field wiring all equal React (`late/keys/number-field.*.txt`, `late/forms/`).

1. **Blocker.** React parity a user
   notices on every typed correction.
   `packages/angular/src/components/number-field/number-field.ts:541-551`
   refuses a key in `(input)`, after the browser has replaced the
   selection, then restores the old text with a collapsed caret:

   ```ts
   el.value = this.text();
   el.setSelectionRange(caret, caret);
   ```

   Select all of "320" and type "-5": React "5", Angular "3205", which
   Enter formats to "3,205". "x5" does the same. Selection after the refused
   key: React 0 to 3, Angular 3 to 3 (`late/keys/number-refused.txt`,
   `number-detail.*.txt`). Fix: refuse in `beforeinput` with
   `preventDefault()`, as React Aria does, or restore the saved selection.
2. Note. No `field-step` or error shake motion. See C5.
3. Note. Home with no min on the text "-": React keeps the caret at 1,
   Angular moves it to 0 (`number-field.ts:586-592`).
4. Note. The stepper disabled state at a bound can show one frame apart
   between frameworks. Timing only.

### ScrubInput: pass

A 40 px drag right gives +40 in LTR and -40 in RTL, Shift drags ten steps, a
press without a move focuses and selects, ArrowUp with Shift and Alt,
"(2+3)*4" then Enter gives 20, Arabic digits read, Escape reverts, "5em"
reverts on blur, `aria-describedby` is description, error, then unit. The
only differences are generated ids.

## Cross-cutting notes

- **C1.** `packages/angular/src/components/field/field.ts:97`: the
  `#textTemplate` renders `{{ text }}` on its own line, so every
  `div[dsField]` label, description and error text carries a leading and a
  trailing space. Visible only before a required mark (FormWizard pixels).
  The A4 builder found this and listed it as lead change 1; Form copied the
  template without the whitespace, which is why Form is at 0 pixels. Still
  not applied. Write the template on one line.
- **C2.** `@angular/aria` is not installed: not in
  `packages/angular/package.json`, not in `node_modules/@angular/`, not in
  the lockfile. Order A3.0 was skipped (the A3 builder says so). Seven
  comments still promise a replacement "once order A3.0 installs
  @angular/aria" (`internal/list-highlight.ts:13-15`, `list-box.ts:24-25`,
  `combobox-base.ts:35-36`, `autocomplete.ts:16-17`, `select.ts:33-35`,
  `multi-select.ts:26-27`, `tag-field.ts:26-27`). The hand built behavior
  matches React in every trace, so this is a note: either run A3.0 with a
  spike on whether `ngListbox` and `ngCombobox` sit on our elements with no
  extra element, or record in DECISIONS.md that the list family stays on
  `listbox.ts` and reword the comments. Also, `internal/list-highlight.ts:36-92`
  keeps a CDK `ActiveDescendantKeyManager` in step but lets it decide
  nothing; say so in the comment.
- **C3.** `@angular/forms` is imported in 54 files under
  `packages/angular/src` and still not declared in
  `packages/angular/package.json`. Fourth report (angular-1 N-C3, builders
  A2, A3 change 1, A4 change 6). Lead file.
- **C4.** Every Angular demo grid uses `minmax(Nrem, 1fr)`; React's helper
  writes `minmax(min(Nrem, 100%), 1fr)` (`react/src/demo/index.tsx:89`).
  This is the last line in most DOM diffs and a reflow risk below the
  minimum (WCAG 1.4.10). An Angular demo helper like React's would stop the
  drift.
- **C5.** No wo-1.21 motion reached Angular: Checkbox check draw (a blocker,
  because the DOM differs), Input and NumberField error shake, NumberField
  `field-step`, OTPField `otp-fill`, Slider nudge, Rating fill. There is no
  Angular order for wo-1.21. Lead: write one, and say which of these are
  still proposed.
- **C6.** Form's `labelOf` reads `.labels` then `aria-label` and ignores
  `aria-labelledby`, so ListBox, MultiSelect and the Slider get summary
  entries with no field name, in both frameworks (`Form.tsx:276`). Fix in
  `packages/shared/src/form.ts` or both Form ports.
- **C7.** The contract suite misses what this review found in Form,
  ConsentField and Select: it never submits a form and never opens an empty
  Select. ds-qa should add a submit case (summary text, focus, status) and
  an empty list case to the suite.
- **C8.** The committed screenshot matrix has no shots for ToggleGroup,
  SegmentedControl, NumberField and ScrubInput, and no Combobox open shots,
  in either framework; this review captured them (all 0 pixels) and did not
  commit them. The sync should commit them.
- **C9.** Two ports of the Radix positioning steps: `internal/popper.ts:135`
  (list family) and `behavior/popper.ts:163` (DropdownMenu). Pixel equal
  today; fold them into one.
- **C10.** The A3 builder's manifest asks are still open: Combobox
  `contract.trigger` and a Tab key, and `data-demo-trigger` hooks for
  Autocomplete and TagField so their 15 open checks run (they are skipped in
  both frameworks).

## What was not done

- Pixels ran with `--no-verify`; no pair was near the limit. Three React
  RadioCard shots timed out under load and were recaptured alone. The
  matrix folders were restored after the compare; the table for the scope is
  `pixels/compare.md`.
- A toast above an open dialog was driven with a stand in toaster layer, not
  a real toast: no gallery page has both, and there is no React result for
  the stand in.
- The React side of Form with RadioGroup, Select and Slider was not measured
  (no React demo); Form note 8 rests on code.
- The validator against constraint precedence (Form B2, last sentence) was
  read in code, not reproduced.
- Slider form clearing on `input` was not confirmed in a browser.
- Pointer drag to select on the Select trigger and the auto scroll buttons
  were not driven.
