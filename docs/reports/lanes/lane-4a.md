# Lane 4A report: Form core and FilterBar

Status: done. Four components built, one fresh eyes review each, every
blocker fixed, green.

Branch `claude/ds-lane-4a`, from `claude/relaxed-hypatia-7gseap` at `c6488c1`.

| Order | Component | Commit | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.4.2 | Fieldset | `wo-1.4.2: Fieldset` | green | 29 passed |
| 1.4.1 | Form | `wo-1.4.1: Form` | green | 29 passed |
| 1.4.6 | ConsentField | `wo-1.4.6: ConsentField` | green | 29 passed |
| 1.4.5 | FilterBar | `wo-1.4.5: FilterBar` | green | 29 passed, 15 skipped (open overlay checks, see FilterBar) |

The last run of `npm run check` and of
`npm run contract -- --framework react --component Fieldset,Form,ConsentField,FilterBar`
was on the FilterBar commit, with all four together.

Screenshots: `docs/reports/shots/wave-1/<slug>/` in studio dark, studio light,
desk dark, desk light and desk dark rtl ar, for `fieldset`, `form`,
`consent-field` and `filter-bar`. Extra: `form/desk-dark-dialog-error.png`
(the form in a dialog after Enter on an empty field) and
`filter-bar/desk-dark-rtl-320.png` (320px wide, RTL).

Sources: Figma-Killer-2 was cloned and `FilterBar/` and `FormField/` were
read. GoBanana could not be added to this session (the `add_repo` call was
refused), so `.st-section`, `TakedownForm.tsx`, `DeleteAccount.tsx` and
`GalleryFilter.tsx` were not read. Each CSS header and manifest says so where
it matters. The lead should recheck the Fieldset legend against `.st-section`
when GoBanana is available.

Generated files (`packages/react/src/index.ts`, `packages/css/src/index.css`,
`packages/manifest/manifests.gen.json`, `apps/gallery-react/src/routes.gen.ts`,
`packages/shared/src/index.ts`) are committed as `npm run gen` wrote them.
Regenerate on merge.

No file outside the owned folders was edited. No recipe file was needed: tokens
and the private properties cover Studio, Desk and Neutral.

## 1.4.2 Fieldset

Files: `packages/react/src/components/Fieldset/`, `packages/css/src/components/Fieldset.css`,
`packages/manifest/src/component/Fieldset.manifest.json`.

```ts
type FieldsetSize = 'sm' | 'md' | 'lg';
interface FieldsetProps extends Omit<ComponentProps<'fieldset'>, 'title'> {
  legend: ReactNode;          // required, native legend
  description?: ReactNode;    // joins aria-describedby
  error?: ReactNode;          // a FieldError root with data-part error
  size?: FieldsetSize;        // default 'md'
  disabled?: boolean;         // native disabled, reaches every control inside
  invalid?: boolean;          // default: invalid while an error shows; false hides it
}
```

Anatomy: root, legend, description, error, body.

Decisions:

- DOM order is legend, description, error, body: the group error sits above
  the fields, so it is seen before a long list of choices.
- The error part is the system FieldError. FieldError stamps `data-part` and
  its id only inside a Field, so Fieldset wraps the error alone in a
  `FieldContext` of its own. The review judged it sound; the fields in the
  body are not affected (tested).
- Disabled dims the legend, the description and the body with
  `opacity.disabled`, since the controls do not know about the native
  disabled of their fieldset.
- `data-invalid` is a hook only: the FieldError part carries the look.

Review: no blockers. Notes fixed: the disabled look, the legend slot type, a
test for the legend naming the first field's group. Left open: a shared
helper for the error part (see "Changes needed from the lead").

## 1.4.1 Form

Files: `packages/react/src/components/Form/`, `packages/css/src/components/Form.css`,
`packages/manifest/src/component/Form.manifest.json`, `packages/shared/src/form.ts`
and `form.test.ts`.

```ts
// packages/shared/src/form.ts
type FormValues = Record<string, unknown>;
type FormErrors = Record<string, string>;
type FormValidator<V> = (value: unknown, values: V) => string | null | undefined | false;
type FormValidators<V> = Partial<Record<string, FormValidator<V> | readonly FormValidator<V>[]>>;
function collectErrors(values, validators?, base?): FormErrors;
function hasErrors(errors): boolean;
function firstInvalid(order: readonly string[], errors): string | undefined;
function orderErrors(order, errors): { name: string; message: string }[];
function mapServerErrors(input: unknown, options?: { names?; rename?; formKeys? }): { fields: FormErrors; form: string[] };

// React
type FormSize = 'sm' | 'md' | 'lg';
type FormState = 'idle' | 'submitting' | 'submitted';
interface FormProps extends Omit<ComponentProps<'form'>, 'title' | 'onSubmit' | 'onInvalid' | 'noValidate' | 'ref' | 'action'> {
  size?: FormSize;                       // default 'md'
  orientation?: 'vertical' | 'horizontal'; // default for every FormField
  validators?: FormValidators;
  onSubmit?: (values: FormValues, form: HTMLFormElement) => unknown | Promise<unknown>; // return server errors to show them
  onErrors?: (errors: FormErrors) => void;
  serverErrors?: unknown;                // errors rendered with the page, compared by content
  actions?: ReactNode;
  labels?: Partial<FormLabels>;          // summary, notSent, failed, required, invalid (en and ar defaults)
  ref?: Ref<HTMLFormElement>;
}
FormField: FieldProps & { name: string }   // shows the Form's error for name
FormSubmit: ButtonProps                    // type submit, loading while submitting
useFormContext(), useFormFieldError(name)
```

Anatomy: root, summary (an Alert root), body, actions.

Decisions:

- Native form with `noValidate`; constraint attributes still feed the check
  through `checkValidity()`. An empty control with `required` or
  `aria-required` (Field sets the latter) gets the required message.
- Check on submit. After a submit, a fix removes its error at once; a change
  never adds one.
- Errors announced once per submit by a visually hidden polite status (WCAG
  4.1.3). The summary is not live. Focus moves to the first invalid field, or
  to the summary after it renders when no field can take it.
- Summary links read "Label: message", so each link makes sense alone
  (WCAG 2.4.4), and are `standalone` Links (24px targets).
- The `action` prop is not taken: React does not run an action on a stopped
  submit. Server actions are called from `onSubmit`; `serverErrors` shows a
  result rendered with the page.
- When `onSubmit` throws, the summary says the form could not be sent.
- Read only, hidden and disabled controls (also inside a disabled Fieldset)
  are not checked.
- The Radix Checkbox and Switch keep a hidden input next to their button;
  focus goes to the button.
- Form in a dialog is the `dialog` demo case: the form has an id and the
  footer submit Button takes `form`.

Review: 4 blockers, all fixed (summary focus before render, disabled
Fieldset controls checked, inline `serverErrors` reset on every render, the
silent `action` prop). Notes fixed: unknown names render as plain items,
`serverErrors` announced after mount, form level messages are not counted as
fields, the thrown `onSubmit`, the comment, the hidden input rule, the ref
cleanup, tests for each. Left open: the private property names (below) and a
loading state for a footer submit outside the Form (documented in the
manifest).

## 1.4.6 ConsentField

Files: `packages/react/src/components/ConsentField/`, `packages/css/src/components/ConsentField.css`,
`packages/manifest/src/component/ConsentField.manifest.json`.

```ts
type ConsentFieldSize = 'sm' | 'md' | 'lg';
interface ConsentRecord { name?: string; granted: boolean; version?: string; at: string }
type ConsentFieldProps = BaseProps & (
  | { checked: boolean; onCheckedChange: (granted: boolean) => void }   // controlled needs the handler
  | { checked?: undefined; onCheckedChange?: (granted: boolean) => void }
);
interface BaseProps extends Omit<ComponentProps<'div'>, 'title' | 'onChange' | 'defaultChecked' | 'children'> {
  purpose: ReactNode;                 // required, the control's label
  onDecision?: (record: ConsentRecord) => void;
  control?: 'checkbox' | 'switch';    // default 'checkbox'
  name?: string; value?: string;      // value default 'granted'
  detailsHref?: string; detailsLabel?: ReactNode; detailsExternal?: boolean;
  meta?: ReactNode; version?: string;
  required?: boolean; disabled?: boolean; invalid?: boolean;
  error?: ReactNode; requiredError?: ReactNode;  // requiredError: copy when a Form finds it left off
  size?: ConsentFieldSize;            // default 'md'
}
```

Anatomy: root, control (a Checkbox or Switch root), text, purpose, required,
meta, details (a Link root), error (a FieldError root). `text`, `required`
and `error` are added to the order's anatomy: `text` holds the column next to
the control, `required` is the aria-hidden mark, and an invalid consent needs
a message.

Decisions:

- Never ticked in advance: no `defaultChecked` in the types, a stray one is
  dropped at runtime, the uncontrolled state starts denied. Tested with
  `@ts-expect-error`.
- One purpose per control; the manifest `mistakes` shows a bundled consent as
  wrong. The demo copy names one use each ("Send me offers by email.").
- Withdrawing is the same one action as giving; `control="switch"` for
  settings that save at once.
- The details link sits outside the label, so a click on it never toggles.
- The PDPL design note is in `a11y.notes`: design aid only, not legal advice,
  copy and legal basis to be checked by someone qualified in PDPL.
- Radix keeps a hidden input next to the control inside a form, moved out
  with a transform. In RTL at 320px it scrolled the page, so the root clips
  on the inline axis (`overflow-x: clip` with a margin for the focus ring).

Review: no blockers. Notes fixed: controlled `checked` needs its handler,
`defaultChecked` dropped, `requiredError` so the Form shows the consent's own
copy, bundled "offers and news" copy, Arabic wording ("سجلي الطبي", "استلام
العروض على بريدي", "حدد المربع"), the long meta copy, one disabled look.

## 1.4.5 FilterBar

Files: `packages/react/src/components/FilterBar/`, `packages/css/src/components/FilterBar.css`,
`packages/manifest/src/component/FilterBar.manifest.json`.

```ts
type FilterBarSize = 'sm' | 'md';
interface FilterBarFilter { value: string; label: ReactNode; textValue?: string; disabled?: boolean }
interface FilterBarProps extends Omit<ComponentProps<'div'>, 'title' | 'defaultValue' | 'onChange'> {
  search?: Omit<SearchFieldProps, 'size'>;
  filters?: readonly FilterBarFilter[];   // chips
  more?: readonly FilterBarFilter[];      // menu checkbox items
  value?: readonly string[]; defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  onClear?: () => void;
  resultCount?: number;
  end?: ReactNode;
  size?: FilterBarSize;                   // default 'md'
  labels?: Partial<FilterBarLabels>;      // filters, more, moreOn, clear, active, results
}
```

Anatomy: root, search (SearchField root), filters, more (the Button that opens
a DropdownMenu), count, clear (Button root), end.

Decisions:

- ToggleGroup, MultiSelect and Select do not exist in this checkout. Filters
  are pressable Chips (aria-pressed and a check) in a role group named
  Filters, each its own tab stop as in the Figma-Killer-2 source; more is a
  DropdownMenu of checkbox items that stays open while the person picks. The
  anatomy stays when ToggleGroup lands.
- One value array for the chips and the menu. A search query counts as one
  filter on, and clear all empties it.
- The chip strip scrolls inside itself; below `dialog.width.sm` it takes a
  line of its own. `data-overflow-start` and `data-overflow-end` are
  measured in logical terms (`Math.abs(scrollLeft)`), and the mask angle flips
  under `:dir(rtl)`.
- The result count is announced once, politely, when `resultCount` changes
  after a filter or search change, 600ms after the last such change. A change
  that leaves the count the same is not announced.
- The 15 skipped contract checks are the "open" ones: the trigger is inside
  the component, so the demo cannot mark it with `data-demo-trigger`. The
  DropdownMenu contract covers the open menu.

Review: 3 blockers, all fixed (announcement timing with a slow count, array
identity re-announcing, `dialog.width.sm` missing from the manifest tokens).
Notes fixed: StrictMode double announce, focus target after clear all, stale
overflow after a selection, a needless `onValueChange([])`, a `moreOn` label,
manifest notes on the search count and the nested states, the more slot.

## Token gaps

- `filter-bar.strip-min`: FilterBar borrows `dialog.width.sm` (360px) as the
  width below which the chip strip wraps to its own line, and
  `field.label.width` as the search box minimum.
- No `focus.*` width or offset token for an outline ring: the Form summary
  uses `border.width.strong` for the transparent outline and
  `focus.shadow.ring` for the ring, as Link does.

## Changes needed from the lead

1. `packages/react/src/components/FieldError/FieldError.tsx`, the line
   `data-part={field ? 'error' : undefined}`: keep a passed part outside a
   Field, `data-part={field ? 'error' : rest['data-part']}`. Or add an
   `ErrorPartProvider({ id, invalidProp })` next to `Field/context.ts`. Either
   lets Fieldset, ConsentField, CheckboxGroup and RadioGroup drop the made up
   Field context. CheckboxGroup still draws its group error as a plain `<p>`;
   moving it to FieldError would make all group errors match.
2. Size through context (order 1.4.1, "size passed to fields through
   context"): Form exports `useFormContext()` with `size`. Input, SearchField,
   Textarea, Checkbox and Switch should take `size ?? useFormContext()?.size`
   as their default. Today the demo passes `size` to each control by hand.
3. `useFieldControl` in `Field/Field.tsx` could read a disabled Fieldset, so a
   control inside one draws its own disabled look instead of the Fieldset
   dimming the whole body.
4. Radix Checkbox and Switch inside a `<form>` render a hidden input moved out
   with `translateX(-100%)`. In RTL near the page edge it scrolls the page
   sideways. Checkbox.css and Switch.css could give their root
   `position: relative` and clip it, as ConsentField does.
5. `docs/contracts/anatomy.md` private property names: Form uses
   `--_form-body-gap` and `--_form-actions-gap`, Fieldset `--_fieldset-body-gap`,
   FilterBar `--_filter-bar-chip-gap` and others, outside the listed names.
   Either list part prefixed gaps as allowed or rename them on merge.
6. FormWizard (lane 4B) can now render `<Form data-part="panel">` and call
   `collectErrors` from `packages/shared/src/form.ts`, as its header comment
   plans.

## What I could not do

- GoBanana sources (see Sources).
- ToggleGroup, MultiSelect and Select for FilterBar (see FilterBar).
- The open overlay contract checks for FilterBar's more menu.
