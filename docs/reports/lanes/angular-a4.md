# Lane Angular A4 report: forms

Status: done. All six components of A4.1 are ported, proven and pushed: Fieldset, Form, ConsentField, Stepper, FormWizard, FilterBar.

Branch `claude/ds-angular-a4`, created from `claude/relaxed-hypatia-7gseap` at `6ee8679`. One commit per component, `a4: <Component>`, in that order, then the review fixes and this report.

| Component | Unit tests | Contract (angular) | DOM against React | Pixels against React |
| --- | --- | --- | --- | --- |
| Fieldset | 5 | 29 passed | equal, every case | 0 in all 12 shots |
| Form | 9 | 29 passed | equal, every case; open dialog: see below | 0 in all 18 shots |
| ConsentField | 7 | 29 passed | equal, every case | 0 in all 18 shots |
| Stepper | 6 | 29 passed | equal, every case and after a step pick | 0 in all 12 shots |
| FormWizard | 5 | 29 passed | equal, every case and after next, back, a failed check and a submit | 18 shots under the limit, at most 136 px (0.009 percent); see below |
| FilterBar | 6 | 29 passed, 15 skipped | equal, every case, with the more menu open, and after chip, search, menu and clear all actions | 0 in all 12 shots |

`npm run check` is green after every commit. FilterBar's 15 skips are the open checks: its demo has no `data-demo-trigger`, so the suite skips them for React the same way (29 passed, 15 skipped there too).

## How it was proven

- DOM: `docs/reports/shots/angular/compare-dom.mjs` on `/c/<slug>?chrome=0` of both galleries, every demo case. Two normalizations on top of it, both for ids only: ids are renumbered in the order they appear in the sorted dump (the script numbers them in attribute insertion order, which differs between frameworks), and summary links `href="#<id>control"` are compared without the framework's generated id.
- Text: `textContent` of every case, whitespace kept, compared between the galleries. Equal for Form, ConsentField, Stepper and FilterBar. The differences in Fieldset and FormWizard all come from `dsField` labels (see "Changes needed from the lead", item 1).
- Behavior: Playwright traces that act in both galleries (click a step, next with empty fields, back, a server error step, submit to done, chip toggles, typing in the search, clear all, the more menu with ArrowDown, Space, Enter and Escape), then compare the DOM of the case and the focused element. Equal in every trace.
- Contract: `npm run contract -- --framework angular --component <Name>`.
- Pixels: `npm run shots -- --framework react|angular --component <kebab>` then `npm run shots -- --compare react angular`.

## Shared pieces

- `fieldset/error-context.ts`: `DsErrorContext`, a `DsFieldContext` whose register is a no op, and `hasContent`. Fieldset and ConsentField give their error part (the system `p[dsFieldError]`) a Field context of its own through `viewProviders`, the twin of the `FieldContext` value React wraps around the error alone. `viewProviders` reach the component's own template and never the projected fields.
- `consent-field/stand-ins.ts`: private stand ins for Checkbox and Switch (see "Stand ins").
- `filter-bar/stand-in-chip.ts`: a private stand in for the pressable Chip.
- `form/form-context.ts`: `DsFormContext` (size, orientation, state, errors), the twin of React's `FormContext`. FormField, FormSubmit and ConsentField read it.

## Stand ins

Angular batch A3 (Checkbox, Switch) is on another branch and Chip has no Angular port, so these render the React DOM from private components inside my folders. None is exported; each file says so at the top. Swap them for the real ports when they land: the DOM stays the same.

- `div[dsStandInCheckbox]` and `div[dsStandInSwitch]`: the root div, a `button[dsStandInControl]` with role checkbox or switch, the indicator or the track and thumb, the label, and inside a form the hidden input Radix adds (aria hidden, sized like the button, its `checked` kept in step, a `click` dispatched on it after a change so a form sees the toggle, as Radix does). Used by ConsentField and by the Fieldset, Form and ConsentField demos.
- `button[dsStandInChip]`: React's pressable Chip on the shared `DsButtonBase`, `data-ds="chip"`, `aria-pressed`, `data-selected` and the check icon while selected. Used by FilterBar.
- `button[dsStandInControl]` exists because the lint gate `ds/button-primitive` wants a `ds*` directive on every Angular button.

## API per component

### Fieldset

```html
<fieldset dsFieldset legend="Delivery address" description="Where we send the printed boards."
          [error]="error()" [invalid]="invalid()" size="md" disabled aria-describedby="extra">
  <div dsField label="City"><div dsInput></div></div>
</fieldset>
```

```ts
type FieldsetSize = 'sm' | 'md' | 'lg';
type FieldsetText = string | TemplateRef<unknown>;
legend: FieldsetText (required);
description?: FieldsetText; error?: FieldsetText;
size: FieldsetSize = 'md';
disabled = false;             // native disabled on the fieldset
invalid?: boolean;            // unset: invalid while an error shows; false hides it
'aria-describedby'?: string;  // joins after the description and error ids
```

Names that differ from React: `legend`, `description` and `error` take a string or a TemplateRef instead of a node.

### Form

```html
<form dsForm size="md" orientation="vertical" [validators]="validators" [onSubmit]="send"
      [serverErrors]="server()" [labels]="labels" [actions]="actions" (errors)="log($event)">
  <div dsFormField name="email" label="Work email" required description="We reply within one working day.">
    <div dsInput name="email" type="email"></div>
  </div>
  <ng-template #actions><button dsFormSubmit>Send request</button></ng-template>
</form>

<!-- Reactive forms -->
<form dsForm [formGroup]="group" [onSubmit]="save">
  <div dsFormField name="name" label="Full name"><div dsInput formControlName="name"></div></div>
</form>

<!-- Template forms -->
<form dsForm>
  <div dsFormField name="city" label="City"><div dsInput name="city" [(ngModel)]="city" required></div></div>
</form>
```

```ts
// form[dsForm]
size: 'sm' | 'md' | 'lg' = 'md';
orientation: 'vertical' | 'horizontal' = 'vertical';
validators?: FormValidators;                     // packages/shared/src/form.ts
onSubmit?: (values: FormValues, form: HTMLFormElement) => unknown | Promise<unknown>;
serverErrors?: unknown;                          // any shape mapServerErrors reads
actions?: TemplateRef<unknown>;
labels?: Partial<FormLabels>;
errors: output<FormErrors>;                      // React's onErrors
// exportAs dsForm; provides DsFormContext { size, orientation, state, errors }

// div[dsFormField]: the Field DOM bound to a form name
name: string (required); label?, description?, error?: string | TemplateRef;
invalid?, disabled, readOnly, required: boolean; orientation?: 'vertical' | 'horizontal';

// button[dsFormSubmit]: DsButton with type submit, tone accent, emphasis solid
loading?: boolean; loadingLabel?: string;        // plus every Button input
```

Angular forms: with `[formGroup]` or NgForm on the same form there is a `ControlContainer` on the element. On submit dsForm marks every control touched, reads the errors of the enabled leaf controls by dotted path (`angularErrors` in `form/angular-forms.ts`) and maps each to a message: `required` and `requiredTrue` say the form's required words, an error whose value is a string or has a `message` string says that text (a custom validator can return `{ adult: 'You need to be 18 or older.' }`), any other error says the invalid words. These merge with the browser's checks (the browser's message wins for a name both report) and go through `collectErrors`, `orderErrors` and `firstInvalid` from `packages/shared/src/form.ts`, as in React. The summary links each error to the control with that `name`, or to the `formControlName` host (with its `formGroupName` ancestors) when the control has no name. A change after a submit removes an error the moment Angular or the browser stops reporting it. `onSubmit` gets the FormData values merged with the group's raw value.

Names that differ from React:
- `onSubmit` is a function input, not an output: it returns server errors or a promise the form waits on, and an output cannot return. A `submit` output would also clash with the native submit event of the host.
- `onErrors` is the `errors` output.
- `actions` takes a TemplateRef. It renders with the form's injector, so a `dsFormSubmit` inside finds the form wherever the template is declared.
- `onChange` and `onReset` are the native `change` and `reset` events of the host.
- `FormField` is its own component, `div[dsFormField]`, with the Field DOM and the Field's DI context. A directive next to `dsField` cannot feed the form's error and orientation into dsField's signal inputs.
- `FormSubmit` extends DsButton: it derives `loading`, `loadingLabel` and `type` from the form, and keeps aliased inputs for the caller's `loading` and `loadingLabel`. A `type` attribute is read and ignored.

### ConsentField

```html
<div dsConsentField name="marketing" purpose="Send me offers by email." detailsHref="/privacy"
     meta="Text version 2.1." version="2.1" control="checkbox" size="md"
     [(checked)]="granted" (decision)="store($event)"></div>

<div dsConsentField purpose="Send me a survey." [formControl]="survey"></div>
```

```ts
type ConsentFieldText = string | TemplateRef<unknown>;
purpose: ConsentFieldText (required);
checked: model<boolean> = false;            // no defaultChecked
control: 'checkbox' | 'switch' = 'checkbox';
name?: string; value = 'granted';
detailsHref?: string; detailsLabel?: ConsentFieldText; detailsExternal = false;
meta?: ConsentFieldText; version?: string;
required = false; disabled = false; invalid?: boolean;
error?: ConsentFieldText; requiredError?: ConsentFieldText;
size: 'sm' | 'md' | 'lg' = 'md';
'aria-describedby'?: string;
decision: output<ConsentRecord>;            // { name, granted, version, at }
// ControlValueAccessor with a boolean value
```

No default checked: there is no `defaultChecked` input, a static `defaultChecked` attribute is removed and dropped, a static `checked` attribute does not type check under strict templates (tested), and the state starts denied. Inside a dsForm, the form's error for `name` shows, with `requiredError` in its place when given.

Names that differ from React: `onCheckedChange` is the `checkedChange` output of `[(checked)]`; `onDecision` is the `decision` output; the node props take a string or a TemplateRef.

### Stepper

```html
<ol dsStepper [steps]="steps" [current]="current()" [completed]="[0, 1]" mode="linear"
    [onStepSelect]="go" orientation="horizontal" size="md" [labels]="labels" aria-label="Checkout steps"></ol>
```

```ts
interface StepperStep { title: string | TemplateRef; description?: string | TemplateRef;
  invalid?: boolean; disabled?: boolean; href?: string; id?: string; }
steps: readonly StepperStep[] (required);
current?: number;                 // controlled: a pick does not change it
defaultCurrent = 0;
completed?: readonly number[];
mode: 'linear' | 'free' = 'linear';
onStepSelect?: (index: number) => void;
orientation: 'horizontal' | 'vertical' = 'horizontal';
size: 'sm' | 'md' = 'md';
labels?: Partial<StepperLabels>;
'aria-label'?: string; 'aria-labelledby'?: string;
```

Names that differ from React: `onStepSelect` is a function input, not an output. The stepper must know whether it is set: reachable steps become actions only then (or when a step has `href`), as in React. A step's title and description take a string or a TemplateRef. Reachable steps render as `button[dsButton]`, or `a[dsButton]` with `href`, with React's ghost xs wrap look.

### FormWizard

```html
<div dsFormWizard [steps]="steps" stepsLabel="Checkout steps" submitLabel="Place order"
     doneTitle="Order placed" [done]="doneTemplate" [defaultStep]="0" [defaultErrors]="serverErrors"
     mode="linear" orientation="horizontal" size="md" [formProps]="{ autoComplete: 'on' }"
     [onSubmit]="place" (stepChange)="track($event)" #wizard="dsFormWizard"></div>

<ng-template #account let-errors="errors" let-values="values">
  <div dsField label="Full name" required [error]="errors.name"><div dsInput name="name"></div></div>
</ng-template>
```

```ts
interface FormWizardStep { id: string; title: string; description?: string | TemplateRef;
  content: TemplateRef<{ $implicit: { values, errors }; values; errors }>;
  validate?: (values) => FormWizardErrors | void | Promise<FormWizardErrors | void>;
  nextLabel?: string; backLabel?: string; }
steps (required); defaultStep = 0; mode = 'linear';            // read once, at start
onSubmit?: (values, form: HTMLFormElement) => void | Promise<void>;
submitLabel?: string; done?: string | TemplateRef; doneTitle?: string;
orientation = 'horizontal'; size: 'sm' | 'md' = 'md'; stepsLabel?: string;
labels?: Partial<FormWizardLabels>;
defaultErrors?: Record<number, FormWizardErrors>;              // read once, at start
formProps?: Record<string, string>;
stepChange: output<number>;
formElement: HTMLFormElement;                                  // through exportAs dsFormWizard
```

Names that differ from React:
- A step's `content` is a TemplateRef. React's function form gets `{ values, errors }`; the template gets the same object as `$implicit` and both fields by name (`let-errors="errors"`).
- `onSubmit` is a function input (it returns a promise the wizard waits on); `onStepChange` is the `stepChange` output.
- `formProps` is a record of attributes set on the panel form, because Angular cannot spread props. `formRef` has no input: read `formElement` through `exportAs: 'dsFormWizard'`.
- `ref` has no form: the host is the root.

### FilterBar

```html
<div dsFilterBar size="md" [search]="{ 'aria-label': 'Search files', placeholder: 'Search files', value: query(), onValueChange: setQuery }"
     [filters]="kinds" [more]="more" [(value)]="on" [defaultValue]="[]" [resultCount]="count()"
     [end]="toggles" [labels]="labels" (clear)="reset()"></div>
```

```ts
interface FilterBarFilter { value: string; label: string | TemplateRef; textValue?: string; disabled?: boolean; }
interface FilterBarSearch { 'aria-label'?; 'aria-labelledby'?; placeholder?; value?; defaultValue?;
  onValueChange?; loading?; loadingLabel?; clearLabel?; name?; id?; disabled?; }
search?: FilterBarSearch;
filters: readonly FilterBarFilter[] = []; more: readonly FilterBarFilter[] = [];
value: model<readonly string[] | undefined>; defaultValue: readonly string[] = [];
resultCount?: number; end?: string | TemplateRef;
size: 'sm' | 'md' = 'md'; labels?: Partial<FilterBarLabels>;
clear: output<void>;                     // React's onClear
```

Names that differ from React:
- `search` takes the SearchField props in `FilterBarSearch`, with React's names, because Angular cannot spread props onto a component.
- `onValueChange` is the `valueChange` output of `[(value)]`; `onClear` is the `clear` output.
- `end` and a filter's `label` take a string or a TemplateRef.

## Differences left, each explained

- FormWizard pixels: 32 to 136 differing pixels per shot (at most 0.009 percent, limit 0.5). The diff images show only the required asterisks of the field labels, a few pixels apart. Cause: the existing `dsField` template (A2) renders a one line label as `" Full name "` with spaces around the text, and the space before the asterisk is visible. React renders `"Full name"`. My FormField copies the Field template with the whitespace removed, which is why Form is at 0 px. Fix in "Changes needed from the lead", item 1.
- Fieldset and FormWizard text: the same `dsField` spaces show in their `textContent`; the Fieldset pixels are 0 because none of its fields is required.
- Form, open dialog: the dialog layer differs from React in two attributes that belong to the existing Dialog port, not to Form: the panel has `aria-modal="true"`, and the close button is `data-ds="icon-button"` where React has `data-ds="close-button"` (Dialog predates the A1 CloseButton). Item 3.
- FilterBar: dsSearchField binds its `data-part` to `"control"` inside an InputGroup and to `null` elsewhere, which drops the static `data-part="search"` React passes through `rootProps`. FilterBar stamps the part after render; the binding stays null and never writes again. It works and is tested, but the proper fix is in SearchField. Item 2.
- FormWizard demo: React's `Checkout` is an `ng-template` here, and its Arabic stamps pass the Arabic theme's injector (`*ngTemplateOutlet="...; injector: ..."` from a small demo directive), because DI follows declaration: without it the Stepper inside read the page theme and said "complete" in an Arabic row.

## What I could not do

- Checkbox, Switch and Chip are stand ins, not the real ports. They carry only the inputs this batch needs (no `readOnly`, no `tone`, no `description`, no indeterminate state) and are not exported.
- Form with Angular forms: server errors (from `onSubmit` or `serverErrors`) show in the summary and the fields, but are not written into the controls with `setErrors`, so `control.invalid` does not reflect them. A nested `formGroupName` control without a `name` is linked by its dotted path; a `formArrayName` path is read the same way but not tested.
- Form: `writeValue` style updates from Angular forms do not count as a change for clearing an error; only DOM `input`, `change` and the checkbox `click` do, as React's change event.
- FormWizard has no Angular forms binding of its own: it reads the native form like React does. Controls with `formControlName` inside a wizard work for values only if they carry a `name`.
- Stepper: `current` is an input and `onStepSelect` a function input, as React. There is no `[(current)]` two way binding; a model would make the stepper set its own current on a pick, which a controlled React stepper never does.

## Review

One fresh eyes review (ds-qa, claude-opus-5-5 at medium) of the whole diff. Fixed in the commit "a4: review fixes":

- Blocker: ConsentField started granted when `checked` arrived as a truthy string (a static `checked="true"` in a template without strict types). The state is now `checked() === true` everywhere. Test added.
- Blocker: FormWizard scheduled focus with `afterNextRender` after an await, which throws once the wizard is destroyed (an `onSubmit` that navigates away). A destroyed flag now stops every step after an await.
- Note: the same destroyed guard in Form after `await onSubmit`.
- Note: FormSubmit now sets emphasis solid on itself, so a ButtonGroup's emphasis does not override it, as React's explicit prop.
- Note: Form passes `group.value` (no disabled controls) to onSubmit, as FormData leaves them out.
- Note: FormWizard reads the step's built in errors before awaiting `validate`, as React.
- Note: FormWizard `formProps` no longer overrides the panel's own attributes (data-part, novalidate, aria-labelledby, aria-describedby, aria-busy) and maps `className`, `htmlFor` and `acceptCharset` to their attribute names.
- Note: Stepper reads `defaultCurrent` once, as React's useState.

Left open, with the reason:

- ConsentField gives its error context through `viewProviders`, which also reaches the stand in control. The stand ins do not inject it; `dsCheckbox` and `dsSwitch` from A3 will. When they are swapped in (item 4 below), move the context onto the `p[dsFieldError]` with a small directive, and diff the DOM again.
- Form finds Angular controls by a static `formcontrolname` attribute. A bound `[formControlName]` has no attribute, so its summary entry has no link and its error clears only on the next submit; a control with both `name` and a different `formControlName` is listed twice. The full fix reads `NgControl.path` through a content query.
- ConsentField with `formControlName` and no `name` does not show the form's error for its path. Pass `name` as well.
- FilterBar `value` and ConsentField `checked` are models: a one way binding acts as a starting value that the component then changes, where a React controlled value never changes without the parent. This is how `model()` works; write `[(value)]` or `[(checked)]` for a controlled use.

## Changes needed from the lead

1. `packages/angular/src/components/field/field.ts`, the `#textTemplate` at the end of the template: write it on one line so no space lands around the text:
   `<ng-template #textTemplate let-text>@if (isText(text)) {{{ text }}} @else {<ng-container [ngTemplateOutlet]="text" />}</ng-template>`.
   Today a one line `label` renders `" Board name "`, and with `required` the asterisk sits one space further than in React. This is the only cause of the FormWizard pixel differences, and it shows in every dsField one line label with `required` (the Field shots stay at 0 only because the variants case uses a compound label).
2. `packages/angular/src/components/search-field/search-field.ts` line 88: keep a static `data-part`, as Input does: `'[attr.data-part]': 'group ? "control" : ownPart'` with `protected readonly ownPart = inject(new HostAttributeToken('data-part'), { optional: true });`. Then remove the `afterRenderEffect` that stamps `data-part="search"` in `filter-bar/filter-bar.ts` and write `data-part="search"` on the `dsSearchField` element in its template.
3. `packages/angular/src/components/dialog/dialog.ts`: the panel's `aria-modal="true"` and the close button's `data-ds="icon-button"` differ from React's Dialog DOM (React has no `aria-modal` on the panel and `data-ds="close-button"`). Use `dsCloseButton` for the close button now that A1 has merged, and either drop `aria-modal` or add it to React.
4. When A3 merges: replace `StandInCheckbox` and `StandInSwitch` (`consent-field/stand-ins.ts`) with `dsCheckbox` and `dsSwitch` in `consent-field.ts` and in the Fieldset, Form and ConsentField demos, then delete `stand-ins.ts`. Keep `managed` behavior: ConsentField owns the state, a click only reports the new value. The DOM diff and the ConsentField spec are the test.
5. When Chip has an Angular port: replace `StandInChip` (`filter-bar/stand-in-chip.ts`) with it in `filter-bar.ts` and delete the stand in.
6. `packages/angular/package.json`: declare `"@angular/forms"` under dependencies (A2 asked for the same). Form, FormField and ConsentField import it; it is on the allow list and installed.
7. `docs/contracts/frameworks.md`, Angular section, names list: "A handler whose return value the component uses (Form and FormWizard `onSubmit`) is a function input, like a handler the component must detect (Stepper `onStepSelect`)." And: "A node prop that React renders per item with data (FormWizard step `content`) is a TemplateRef whose context carries that data, both as `$implicit` and by name."
8. `docs/contracts/frameworks.md`: "A component that React renders as a Field with extra wiring (FormField) is its own component with the Field DOM and the Field's DI context, because a directive cannot set another component's signal inputs."
9. `docs/reports/shots/angular/compare-dom.mjs`: number ids after sorting the attributes (today it numbers them in insertion order, so the same wiring can read `ID1` and `ID2` swapped between frameworks), and normalize an `href` that points at a generated id.
10. `STATE.md`: A4.1 done, six components.

## Files

- `packages/angular/src/components/{fieldset,form,consent-field,stepper,form-wizard,filter-bar}/` (component, spec, demo, index, plus `fieldset/error-context.ts`, `form/form-context.ts`, `form/form-field.ts`, `form/form-submit.ts`, `form/angular-forms.ts`, `consent-field/stand-ins.ts`, `filter-bar/stand-in-chip.ts`)
- the `frameworks.angular` block of the six manifests
- generated: `packages/angular/src/index.ts`, `apps/gallery-angular/src/app/routes.gen.ts`, `packages/manifest/manifests.gen.json`
- `docs/reports/shots/matrix/{react,angular,compare-react-angular}/` for the six slugs

No file in `packages/css`, `packages/react`, `packages/styles` or another component's Angular folder was changed.
