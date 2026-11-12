# Wave 1, batch 4: forms (6, plus Stepper)

Rules, standard set, checklist and constraints: `docs/plan/wave-1.md`. Every
order is owned by ds-component, `installs: no`. Starts when batch 3 is green.

Every order also reads: `packages/react/src/components/{Field,FieldError,Label}/`,
`docs/reports/consumers.md` ("A form in a dialog").

## Lanes

| Step | Lane | Components (in order) | Starts when |
| --- | --- | --- | --- |
| 1 | 4A Form core | Fieldset, Form, ConsentField | batch 3 green |
| 1 | 4B Steps | Stepper (1.7.7), FormWizard | batch 3 green |
| 1 | 4C Filters | FilterBar | batch 3 green |

Slot 4 runs Angular A3. FieldError (1.4.3) was built in batch 2.

## 1.4.1 Form

- Goal: a form that validates on submit, shows an error summary, moves focus
  to the first invalid field, and never asks for the same data twice.
- Behavior: hand built on the native `<form>` (Radix Form is not used; see
  decision 6 in `wave-1.md`). Constraint validation plus custom validators;
  server errors mapped by field name.
- Anatomy: root (`data-ds="form"`), `summary` (an Alert like list of errors
  with links to the fields), `body`, `actions`.
- Axes: size (passed to fields through context), `data-orientation`
  (`vertical`, `horizontal` labels).
- States: `data-state` (`idle`, `submitting`, `submitted`), `data-invalid`.
- Keys: Enter in a single line field submits; links in the summary move
  focus to the field.
- Shared: `packages/shared/src/form.ts`: `collectErrors`, `firstInvalid`,
  `mapServerErrors` (pure, on plain records).
- Read: GB `TakedownForm.tsx` (path in batch 2, 1.2.4), FK2 `FormField/`.
- Owns: standard set for Form, `packages/shared/src/form.ts`.
- Depends: 1.4.2 (same lane).
- Accept: checklist; errors announced once on submit (WCAG 4.1.3);
  `autocomplete` values kept (3.3.7, 3.3.8); the form in a dialog pattern is
  a demo case; `insteadUse` points multi step flows to FormWizard.

## 1.4.2 Fieldset

- Goal: a group of fields or choices under one legend.
- Behavior: hand built native `fieldset` and `legend`.
- Anatomy: root (`data-ds="fieldset"`), `legend`, `description`, `body`,
  `error` (a FieldError root).
- Axes: size.
- States: `data-disabled` (native `disabled` disables all children),
  `data-invalid`.
- Keys: none.
- Read: GB css `.st-section` (lines 1068 to 1135) for the legend style.
- Owns: standard set for Fieldset.
- Depends: none.
- Accept: checklist; the legend is the group name read with the first field.

## 1.4.4 FormWizard

- Goal: a long form split into steps with a Stepper, back and next, and a
  review step.
- Behavior: hand built; state from `packages/shared/src/stepper.ts`
  (1.7.7). Each step validates before next.
- Anatomy: root (`data-ds="form-wizard"`), `steps` (a Stepper root carrying
  `data-part="steps"`), `panel`, `title`, `actions` (back, next, submit).
- Axes: size, `data-orientation` of the Stepper.
- States: `data-state` (`editing`, `submitting`, `done`).
- Keys: Tab order is steps, then panel, then actions; moving to a step
  moves focus to its title.
- Read: no source: design from the dials table and the nearest existing
  component (Form, Stepper).
- Owns: standard set for FormWizard.
- Depends: 1.7.7 (same lane), 1.4.1.
- Accept: checklist; "Step 2 of 4" announced on change; data entered is kept
  when going back (3.3.7); button labels are a verb plus a noun ("Review
  order", never "Next" alone in the demo copy rules).

## 1.4.5 FilterBar

- Goal: the row above a list: search, filter chips, active filter count,
  clear all, and a trailing slot for view toggles.
- Behavior: hand built on SearchField, ToggleGroup (multiple), MultiSelect
  and Select for filters with many values.
- Anatomy: root (`data-ds="filter-bar"`), `search` (SearchField root),
  `filters` (ToggleGroup root), `more` (a DropdownMenu or MultiSelect),
  `count`, `clear` (a Button root), `end`.
- Axes: size.
- States: `data-active` (any filter on), edge fades from scroll position
  (`data-overflow-start`, `data-overflow-end`).
- Keys: Tab moves between parts; ToggleGroup keys inside.
- Read: FK2 `FilterBar/` (all files), GB `banana-server/app/(site)/[locale]/(pages)/gallery/GalleryFilter.tsx`.
- Owns: standard set for FilterBar.
- Depends: none in this batch (uses batches 1 to 3).
- Accept: checklist; result count announced politely once after a change;
  wraps or scrolls without sideways page scroll at 320px; edge fades flip in
  RTL.

## 1.4.6 ConsentField

- Goal: one consent with its purpose, a link to the details, and a record of
  the choice.
- Behavior: hand built on Checkbox (or Switch in settings).
- Anatomy: root (`data-ds="consent-field"`), `control` (a Checkbox root),
  `purpose`, `details` (a Link root), `meta` (when given, version or date).
- Axes: size.
- States: `data-state` (`granted`, `denied`), `data-required`,
  `data-invalid`, `data-disabled`.
- Keys: Space toggles.
- Read: GB `TakedownForm.tsx` line 275, GB `banana-server/app/(site)/[locale]/(pages)/(home)/account/DeleteAccount.tsx`.
- Owns: standard set for ConsentField.
- Depends: 1.4.1 (same lane).
- Accept: checklist; one purpose per control (a manifest `mistakes` pair
  shows a bundled consent as wrong); never ticked in advance (the component
  has no `defaultChecked` and a test proves it); withdrawing is as easy as
  giving; a design note in the manifest cites Saudi PDPL awareness and says
  the copy must be checked by someone qualified (design note only, not
  legal advice).

## 1.7.7 Stepper (built here, home batch 7)

- Goal: shows the steps of a process and where the user is.
- Behavior: hand built; an ordered list; steps can be links or buttons when
  navigation is allowed.
- Anatomy: root (`data-ds="stepper"`), `step`, `indicator` (number or check),
  `title`, `description`, `connector`.
- Axes: size (`sm`, `md`).
- States: `data-orientation`; steps `data-state` (`complete`, `current`,
  `upcoming`), `data-invalid`, `data-disabled`.
- Keys: Tab to each navigable step; Enter activates.
- Shared: `packages/shared/src/stepper.ts`: a state machine with `current`,
  `completed`, `canGoTo(index)`, `next`, `back`, linear and free modes. Tour
  (1.6.13) reuses it.
- Read: no source: design from the dials table and the nearest existing
  component (Tabs in FK2 `Tabs/`).
- Owns: standard set for Stepper, `packages/shared/src/stepper.ts`.
- Depends: none.
- Accept: checklist; `aria-current="step"` on the current step; complete
  shown with a check, not color alone; connectors flip in RTL; vertical on
  narrow screens through `breakpoint.phone`.
