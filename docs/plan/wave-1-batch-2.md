# Wave 1, batch 2: text inputs (12, plus FieldError)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`, unless it says otherwise.
Starts when batch 1 is green.

Every order also reads: `packages/react/src/components/{Field,Input}/`,
`packages/css/src/components/{Field,Input}.css`, GB css lines 310 to 400
(`.st-input`), FK2 `Input/`, FK2 `FormField/`. Every text control reads the
Field context (ids, invalid, disabled, read only, required) the way Input
does, and works alone with an `aria-label` too.

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 0 | lead | 1.2.0 install `react-aria-components` | batch 1 green, no other install running |
| 1 | 2A Field family | Label, FieldError (1.4.3), Field bring up, Textarea | batch 1 green |
| 1 | 2B Input composites | InputGroup, SearchField, PasswordField, InlineEdit | batch 1 green |
| 1 | 2C Numbers | NumberField, ScrubInput | 1.2.0 done |
| 2 | 2D Codes | OTPField, PhoneField | the first of 2A to 2C ends (slot 4 runs Angular A1) |

## 1.2.0 Install React Aria (lead)

- Installs: yes. Alone.
- Command: `npm install react-aria-components@<latest stable, exact> -w
  @the-system/react`. On the allow list (section 4). Record the version in
  `DECISIONS.md`. Check it brings no second React copy (`npm ls react`).
- Accept: `npm run check` green with no code change.

## 1.2.1 Field (bring up)

- Goal: Field renders the new Label (1.2.2) as its `label` part and
  FieldError (1.4.3) as its `error` part; the public API stays.
- Behavior: hand built (exists).
- Anatomy: unchanged: root, `label` (a Label root carrying
  `data-part="label"`), `required`, `description`, `error` (a FieldError root
  carrying `data-part="error"`).
- Also: `slots.root.accepts` lists every control of batches 2 and 3 (Input,
  Textarea, NumberField, ScrubInput, SearchField, PasswordField, OTPField,
  PhoneField, InputGroup, Select, Combobox, Autocomplete, MultiSelect,
  TagField, Slider, RangeSlider, Switch, Checkbox), and `insteadUse` points a
  group of choices to Fieldset.
- Read: `packages/react/src/components/Field/` (all files).
- Owns: `packages/react/src/components/Field/`, `Field.css`,
  `Field.manifest.json`.
- Depends: 1.2.2, 1.4.3 (same lane).
- Accept: all existing Field tests pass unchanged; contract green for Field,
  Label, FieldError; screenshots unchanged.

## 1.2.2 Label

- Goal: a visible label for a control outside a Field (next to a Switch, a
  Checkbox, a Slider), and the label part inside Field.
- Behavior: Radix Label.
- Anatomy: root (`data-ds="label"`), `required` (the mark, `aria-hidden`,
  with the word "required" in the control's name), `optional` (text).
- Axes: size (`sm`, `md`).
- States: `data-disabled`, `data-invalid`.
- Keys: none (a click on the label focuses or toggles the control).
- Read: FK2 `FormField/FormField.tsx`, `Field.tsx` label part.
- Owns: standard set for Label.
- Depends: none.
- Accept: checklist; required is never a lone asterisk (text or
  `aria-required` on the control).

## 1.2.4 Textarea

- Goal: multi line text with an optional character count and auto height.
- Behavior: hand built `<textarea>`; auto height with `field-sizing: content`
  and a `rows` floor and `maxRows` cap (no script measuring when supported).
- Anatomy: root (`data-ds="textarea"`), `control` (the textarea), `count`.
- Axes: size, shape (`default` only; a pill never wraps lines).
- States: `data-invalid`, `data-disabled`, `data-readonly`, `data-over`
  (count past the limit).
- Keys: native; Enter adds a line.
- Read: GB `banana-server/app/(site)/[locale]/(pages)/takedown/TakedownForm.tsx`
  (line 257), GB css `.st-input`.
- Owns: standard set for Textarea.
- Depends: 1.2.1 (same lane).
- Accept: checklist; the count is announced politely only near and past the
  limit, not on every key; over the limit marks invalid but never truncates.

## 1.2.5 NumberField

- Goal: a number with step buttons, locale formatting, units and bounds.
- Behavior: React Aria `NumberField` (from `react-aria-components`), styled by
  our CSS through `data-*` attributes we set.
- Anatomy: root (`data-ds="number-field"`), `control`, `decrement`,
  `increment` (IconButton roots carrying those parts), `start`, `end`.
- Axes: size, shape.
- States: `data-invalid`, `data-disabled`, `data-readonly`.
- Keys: ArrowUp and ArrowDown step; PageUp and PageDown step by ten; Home and
  End go to min and max; typing allows locale digits.
- Shared: `packages/shared/src/number.ts`: `formatNumber`, `parseNumber`
  (Latin and Arabic Indic digits, Arabic comma and decimal mark), `clamp`,
  `snapToStep`. Intl only.
- Read: FK2 `ScrubInput/numericExpression.ts`, FK2 `ScrubInput/scrubMath.ts`.
- Owns: standard set for NumberField, `packages/shared/src/number.ts`.
- Depends: 1.2.0.
- Accept: checklist; Western digits by default, Arabic Indic accepted on
  input; steppers are 24px targets; no value jump on blur.

## 1.2.6 ScrubInput

- Goal: the Studio inspector number: drag the label to scrub, type a value or
  an expression (`12*2`), arrows to nudge.
- Behavior: hand built, pointer capture for the scrub.
- Anatomy: root (`data-ds="scrub-input"`), `label` (the scrub handle),
  `control`, `unit`.
- Axes: size (`xs`, `sm`, `md`).
- States: `data-dragging`, `data-invalid`, `data-disabled`, `data-mixed`.
- Keys: ArrowUp and ArrowDown by step, Shift by ten, Alt by a tenth; Enter
  commits; Escape reverts. The drag has this key path (WCAG 2.5.7).
- Shared: `packages/shared/src/scrub.ts` (expression parse, scrub math from
  FK2), uses `number.ts`.
- Read: FK2 `ScrubInput/` (all files and its `__tests__`),
  `packages/tokens/src/base/component.json` (inspector tokens).
- Owns: standard set for ScrubInput, `packages/shared/src/scrub.ts`.
- Depends: 1.2.5 (same lane).
- Accept: checklist; port FK2's tests to `scrub.test.ts`; cursor and drag
  direction flip in RTL.

## 1.2.7 SearchField

- Goal: a search box with a clear button and an optional submit.
- Behavior: hand built on Input (`type="search"`, `role="searchbox"` implied).
- Anatomy: root (`data-ds="search-field"`), `icon` (search), `control`,
  `clear` (a CloseButton root carrying `data-part="clear"`), `end`.
- Axes: size, shape (`pill` default in Studio and Desk through tokens).
- States: `data-empty`, `data-disabled`, `data-loading` (spinner in `end`).
- Keys: Escape clears (a second Escape bubbles); Enter submits.
- Read: FK2 `SearchBar/` (all files).
- Owns: standard set for SearchField.
- Depends: 1.2.11 (same lane), 1.1.9.
- Accept: checklist; clear returns focus to the control; the native clear
  button is hidden so only one shows.

## 1.2.8 PasswordField

- Goal: a password input with a show and hide toggle.
- Behavior: hand built on Input. Radix Password Toggle Field is Preview, so
  not used.
- Anatomy: root (`data-ds="password-field"`), `control`, `toggle` (an
  IconButton root carrying `data-part="toggle"`, eye and eye-off).
- Axes: size, shape.
- States: `data-visible`, `data-invalid`, `data-disabled`.
- Keys: Tab reaches the toggle; Enter and Space toggle; focus stays on the
  toggle.
- Read: no source: design from the dials table and the nearest existing
  component (Input with an `end` IconButton).
- Owns: standard set for PasswordField.
- Depends: 1.2.7 (same lane).
- Accept: checklist; `autocomplete` passes through (`current-password`,
  `new-password`) so password managers work (WCAG 3.3.8); paste allowed; the
  toggle name changes ("Show password", "Hide password") and its state is
  `aria-pressed`; the value is hidden again on form submit.

## 1.2.9 OTPField

- Goal: a one time code in separate boxes.
- Behavior: hand built on native inputs (Radix One Time Password Field is
  Preview). One real `<input autocomplete="one-time-code"
  inputmode="numeric">` per box, or one hidden input that holds the value;
  pick the form that keeps paste and autofill working and say why.
- Anatomy: root (`data-ds="otp-field"`), `cell` (repeated), `separator`.
- Axes: size, shape.
- States: `data-invalid`, `data-disabled`, `data-complete`.
- Keys: typing moves to the next cell; Backspace clears and moves back;
  ArrowLeft and ArrowRight move (reading direction); paste fills all cells.
- Shared: `packages/shared/src/otp.ts`: `parseCode` (strip spaces and
  dashes, Arabic Indic digits to Latin, length check).
- Read: no source: design from the dials table and the nearest existing
  component (Input).
- Owns: standard set for OTPField, `packages/shared/src/otp.ts`.
- Depends: none (lane 2D).
- Accept: checklist; paste allowed and tested; password managers and the SMS
  autofill fill it (WCAG 3.3.8); cells stay left to right in RTL (codes are
  LTR, `dir="ltr"` on the group); one group label names the field.

## 1.2.10 PhoneField

- Goal: a phone number with a country code picker, Gulf first.
- Behavior: hand built. The country is a native `<select>` (decision 4 in
  `wave-1.md`); the number is an Input with `type="tel"`,
  `autocomplete="tel-national"`.
- Anatomy: root (`data-ds="phone-field"`), `country` (the select), `code`
  (the dial code), `control`.
- Axes: size, shape.
- States: `data-invalid`, `data-disabled`, `data-readonly`.
- Keys: native select keys; the number is free typing.
- Shared: `packages/shared/src/phone.ts`: the country list with SA (+966),
  AE (+971), KW (+965), QA (+974), BH (+973), OM (+968) first, then the rest
  by name in the current language; `formatNational`, `toE164`, length rules
  for the six Gulf codes; Arabic Indic digits to Latin.
- Read: no source: design from the dials table and the nearest existing
  component (Input with a start part).
- Owns: standard set for PhoneField, `packages/shared/src/phone.ts`.
- Depends: 1.2.9 (same lane).
- Accept: checklist; the number reads LTR inside RTL (`Bidi`); a pasted
  `+9665...` sets the country; the value out is E.164.

## 1.2.11 InputGroup

- Goal: an Input joined with add ons and buttons (a unit, a prefix URL, a
  Button at the end).
- Behavior: hand built.
- Anatomy: root (`data-ds="input-group"`), `addon` (text), children Inputs
  and Buttons carry `data-part="control"` and `data-part="action"`.
- Axes: size, shape (passed to children).
- States: `data-invalid`, `data-disabled`.
- Keys: Tab moves between parts.
- Read: GB css lines 310 to 400, matrix finding 5 (adornment baseline).
- Owns: standard set for InputGroup.
- Depends: none.
- Accept: checklist; joined corners use logical radius; add on text is part
  of the accessible description, not the name.

## 1.2.12 InlineEdit

- Goal: text that turns into an Input to edit in place (a board name).
- Behavior: hand built.
- Anatomy: root (`data-ds="inline-edit"`), `display` (a Button root
  carrying `data-part="display"`, ghost), `control`, `save`, `cancel`.
- Axes: size.
- States: `data-state` (`viewing`, `editing`), `data-invalid`,
  `data-disabled`.
- Keys: Enter or Space on the display starts editing; Enter saves; Escape
  cancels and returns focus to the display.
- Read: FK2 `VariableField/`, FK2 `Input/`.
- Owns: standard set for InlineEdit.
- Depends: 1.2.8 (same lane).
- Accept: checklist; never saves on blur when invalid; announces "Saved" once.

## 1.4.3 FieldError (built here, home batch 4)

- Goal: an error message tied to a control or a group, also used as Field's
  `error` part and by Fieldset and Form.
- Behavior: hand built.
- Anatomy: root (`data-ds="field-error"`), `icon` (danger), `message`.
- Axes: size (`sm`, `md`).
- States: none (rendered only when there is an error).
- Keys: none.
- Read: `Field.tsx` error part, GB css `.st-alert` (lines 1137 to 1207), FK2
  `FormField/`.
- Owns: standard set for FieldError.
- Depends: 1.2.2 (same lane).
- Accept: checklist; linked through `aria-describedby` and `aria-invalid`;
  never color alone (icon plus text); content rule: says how to fix it.

## Pointer

1.2.3 Input: done in wave 0 (orders 0.10, 1.0.b). Nothing in section 7 adds
to it.
