# Lane Angular A2 report: text inputs

Status: done. All eleven components of A2.1, A2.2 and A2.3 are ported, proven and pushed. NumberField and ScrubInput are skipped: neither has a React version in `packages/react/src/components/`, so there is no spec to port from.

Branch `claude/ds-angular-a2`, created from `claude/relaxed-hypatia-7gseap` at `1570e25`.

| Order | Component | Unit tests | Contract (angular) | DOM against React | Pixels against React |
| --- | --- | --- | --- | --- | --- |
| A2.1 | Label | 5 | 29 passed | identical | 0 in all 18 shots |
| A2.1 | FieldError | 3 | 28 passed, 1 skipped (no keys) | identical | 0 in all 12 shots |
| A2.1 | Field | 4 | 29 passed | identical | 0 in all 12 shots |
| A2.1 | Input | 8 | 29 passed | identical | 0 in all 18 shots |
| A2.1 | Textarea | 6 | 29 passed | identical | 0 in all 18 shots |
| A2.1 | InputGroup | 6 | 29 passed | identical | 0 in all 12 shots |
| A2.2 | SearchField | 9 | 29 passed | identical | 0 in all 18 shots |
| A2.2 | PasswordField | 4 | 29 passed | identical | 0 in all 18 shots |
| A2.2 | InlineEdit | 7 | 29 passed | identical | 0 in all 18 shots |
| A2.3 | OTPField | 7 | 29 passed | identical | 0 in the component; see below |
| A2.3 | PhoneField | 10 | 29 passed | identical | 0 in all 18 shots |

The 92 Angular unit tests are the whole Angular suite, including the 21 that existed before. `npm run check` is green.

Commits: one per component, `a2: <Component>`. Two further commits hold the screenshot proofs. Four more commits hold the fixes from the review.

## How it was proven

- DOM: every demo case was dumped from both galleries in Chromium and compared, in studio dark (ltr) and desk light (rtl, ar). The method is the one in `docs/reports/shots/angular/compare-dom.mjs`: tag, sorted attributes, text, with ids normalized. I added the input, textarea and select `.value` and `.disabled` to the dump. All eleven are identical, line for line.
- Contract: `npm run contract -- --framework angular --component <Names>`. 29 checks per component, except FieldError at 28 plus 1 skipped, because it has no keyboard map. The components touched by the review fixes were run again afterwards.
- Pixels: I captured both frameworks for these components with `npm run shots -- --framework <f> --component <kebabs>`, then ran `npm run shots -- --compare react angular`. That gives 220 pairs, 0 over the limit, and 0 differing pixels in every pair except the 18 OTPField pairs. Files are in `docs/reports/shots/matrix/{react,angular,compare-react-angular}/`.
- OTPField pixels: each OTPField pair differs by 117 to 187 pixels, about 0.015 percent, all inside the gallery page title at the top start of the page.
  - The React shell prints "OTPField" from the route name; the Angular shell prints "OtpField" from the slug.
  - The component itself has 0 differing pixels.
  - React shots for OTPField came through a local proxy that serves the React routes module with slug `otp-field` (see "Changes needed from the lead").
- Review: one fresh eyes review by a subagent (claude-opus-5-5, medium) found 4 blockers and 7 notes.
  - Fixed: all 4 blockers and 4 of the notes (PhoneField draft, PhoneField needless emit, the missing pass-through inputs, and the Input number wipe).
  - Left open, listed under "What I could not do": the FieldError guard, `writeValue` firing `valueChange`, add on id order, and `autofocus`.

## Shared pieces

- `components/field/field-context.ts`: `DsFieldContext`, the abstract class `DsField` provides through DI, and `fieldControl(field, own)`, the twin of React's `useFieldControl`. It sets aria-describedby in the order description, error, then the control's own.
- `components/input-group/input-group-context.ts`: `DsInputGroupContext`. A composite field (SearchField, PasswordField, InlineEdit) provides `null` to its own view, so its inner Input is never taken for a group's control.
- `internal/visually-hidden.ts`: the inline style Radix VisuallyHidden writes, so hidden spans match attribute for attribute.
- `components/field/demo-bidi.ts`: a demo helper with the DOM of React's `Bidi`, which has no Angular port. It is not exported.
- Every control implements `ControlValueAccessor` (Input, Textarea, SearchField, PasswordField, InlineEdit, OTPField, PhoneField). `@angular/forms` is on the allow list and installed, but it is not declared in `packages/angular/package.json` (see below).

## A2.1

### Label

```ts
// <label dsLabel for="id" required>Email</label>
// <label dsFieldLabel>Email</label>   FieldLabel form, inside dsField
type LabelSize = 'sm' | 'md';
size: LabelSize = 'md';
required?: boolean;           // inside a Field it follows the Field
requiredText?: string;        // default "required", "مطلوب" in an Arabic theme
optional?: string | TemplateRef<unknown>;
disabled?: boolean;
invalid?: boolean;
id?: string;
htmlFor?: string;             // or the native `for` attribute
```

How the names differ from React:
- React's `htmlFor` is the `htmlFor` input, and the native `for` also works.
- React's `FieldLabel` is the same component written `label[dsFieldLabel]`: it takes the field's label id, points at the control and carries `data-part="label"`.
- `optional` takes a string or a TemplateRef instead of a node.

### FieldError

```ts
// <p dsFieldError id="width-error" size="sm">Use 1 px or more.</p>
type FieldErrorSize = 'sm' | 'md';
size: FieldErrorSize = 'md';
id?: string;                  // inside a Field the field's error id wins
```

How it differs from React:
- React renders nothing for a FieldError without children. An Angular host element cannot leave the DOM by itself, so the caller wraps it in `@if`.
- The one line `error` input of dsField already does that, and also follows `[invalid]="false"`.

### Field

```ts
// <div dsField label="Board name" description="..." [error]="err()"><div dsInput></div></div>
type FieldOrientation = 'vertical' | 'horizontal';
type FieldText = string | TemplateRef<unknown>;
invalid?: boolean;            // unset: invalid while an error shows; false hides the error
disabled = false; readOnly = false; required = false;
orientation: FieldOrientation = 'vertical';
label?: FieldText; description?: FieldText; error?: FieldText;
// parts: label[dsFieldLabel], p[dsFieldDescription], p[dsFieldError]
```

How it differs from React: label, description and error take a string or a TemplateRef instead of a node.

### Input

```ts
// <div dsInput type="email" placeholder="name@example.com" [(value)]="email"></div>
type InputSize = 'xs' | 'sm' | 'md' | 'lg';
type InputShape = 'default' | 'pill';
type InputType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'password' | 'search';
type InputAdornment = IconName | string | TemplateRef<unknown>;
size?: InputSize;             // md; inside an InputGroup it follows the group
shape?: InputShape;           // default; idem
type: InputType = 'text';
value: model<string | undefined>;
start?: InputAdornment; end?: InputAdornment;
invalid?, disabled?, readOnly?, required?: boolean;
id?, name?, placeholder?, autoComplete?, inputMode?, maxLength?, minLength?,
pattern?, enterKeyHint?, autoCapitalize?, autoCorrect?, spellCheck?,
'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?;
autofocus: boolean;           // stamps data-autofocus for the Dialog focus rule
nativeInput: HTMLInputElement; focus(): void;
```

How it differs from React:
- React spreads native props on the inner input. Angular cannot forward attributes, so the native props are inputs with the React names.
- `defaultValue` is `value`.
- `onChange` is the `valueChange` output of the model, and DOM events bubble to the host.
- A static `data-part` written on the host is kept. That is how SearchField marks its inner Input as the control.

### Textarea

```ts
// <div dsTextarea [limit]="200" [(value)]="summary"></div>
size: Size = 'md'; shape: 'default' = 'default';
rows = 3; maxRows?: number; autoHeight = true;
limit?: number; showCount?: boolean; countMessage?: (left: number) => string;
value: model<string | undefined>;
invalid?, disabled?, readOnly?, required?: boolean;
id?, name?, placeholder?, autoComplete?, inputMode?, enterKeyHint?, minLength?,
spellCheck?, 'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?; autofocus: boolean;
```

As in React, the value is also the text content of the native textarea.

### InputGroup

```ts
// <div dsInputGroup size="sm">
//   <span dsInputGroupAddon>https://</span>
//   <div dsInput aria-label="Board address"></div>
//   <button dsIconButton icon="copy" label="Copy address" size="sm" emphasis="outline"></button>
// </div>
// import DS_INPUT_GROUP = [DsInputGroup, DsInputGroupAddon, DsInputGroupAction]
size: Size = 'md'; shape: 'default' | 'pill' = 'default';
invalid?, disabled?, readOnly?: boolean;   // inside a Field each follows the Field
```

How it differs from React:
- React clones its children to stamp the parts. Angular reads the group through DI instead.
- The control (dsInput, dsSearchField, dsPasswordField) takes:
  - `data-part="control"`;
  - the group's size, shape and state, wherever it sets none;
  - the add on ids in aria-describedby.
- `DsInputGroupAction` stamps `data-part="action"` on a dsButton or dsIconButton in the group. It also disables the action while the group or its Field is disabled: aria-disabled and data-disabled, click blocked.
- It cannot fill the button's own size, shape or emphasis inputs, so the caller writes `emphasis="outline"`, size and shape on each action.

## A2.2

### SearchField

```ts
// <div dsSearchField aria-label="Search boards" [(value)]="query" (submit)="run($event)" (clear)="reset()"></div>
size?: Size; shape?: 'default' | 'pill';
value: model<string> = '';
clearLabel = 'Clear search'; loading = false; loadingLabel = 'Searching';
end?: TemplateRef<unknown>;
invalid?, disabled?, readOnly?, required?: boolean;
id?, name?, placeholder?, autoComplete?, inputMode?, enterKeyHint?, maxLength?, minLength?, pattern?,
'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?;
submit: output<string>; clear: output<void>;
```

How the names differ from React: `onValueChange` is `valueChange`, `onSubmit` is `submit`, `onClear` is `clear`, and `defaultValue` is `value`. `end` takes a TemplateRef instead of a node.

### PasswordField

```ts
// <div dsPasswordField autoComplete="new-password" [(value)]="pw" [(visible)]="shown"></div>
size?: Size; shape?: 'default' | 'pill';
value: model<string | undefined>; visible: model<boolean> = false;
showLabel = 'Show password'; hideLabel = 'Hide password';
autoComplete = 'current-password';
invalid?, disabled?, readOnly?, required?: boolean;
id?, name?, placeholder?, inputMode?, enterKeyHint?, maxLength?, minLength?, pattern?,
'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?;
```

How the names differ from React: `visible` and `defaultVisible` are one model, written `[(visible)]` (a bare `visible` attribute does not work on a model; write `[visible]="true"`). `onVisibleChange` is `visibleChange`.

### InlineEdit

```ts
// <div dsInlineEdit label="Board name" [(value)]="name" [validate]="required" (editingChange)="..."></div>
label: string (required);
value: model<string> = '';    // valueChange fires on save
defaultEditing = false;
validate?: (value: string) => string | undefined | null;
placeholder = 'Add a name'; editLabel?: string;
saveLabel = 'Save changes'; cancelLabel = 'Discard changes'; savedLabel = 'Saved';
size: Size = 'md'; disabled = false; invalid = false;
error?: string | TemplateRef<unknown>;
editingChange: output<boolean>;
start(); save(focusBack); cancel();
```

How the names differ from React: `onEditingChange` is `editingChange`, and `inputRef` becomes a `viewChild` of the component. `error` takes a string or a TemplateRef instead of a node.

## A2.3

### OTPField

```ts
// <div dsOTPField [groups]="[3, 3]" [(value)]="code" (complete)="verify($event)"></div>
length = 6; groups?: number[]; charset: 'numeric' | 'alphanumeric' = 'numeric';
value: model<string> = '';
size: Size = 'md'; shape: 'default' | 'pill' = 'default';
invalid?, disabled?, readOnly?, required?: boolean;
id?, name?, form?, autoComplete = 'one-time-code', inputMode?, enterKeyHint = 'done',
'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?, 'aria-busy'?;
complete: output<string>;
```

The DOM, the keys, paste and `autocomplete="one-time-code"` are all as in React.
- The input shows the parsed code at once, so a refused key leaves no trace without a re-render.
- Tested: typed digits, a refused letter, Arabic Indic digits, a paste with dashes, `complete` firing once, and arrows and Home moving the active cell.

### PhoneField

```ts
// <div dsPhoneField name="mobile" [(value)]="phone" [(country)]="country" (valueDetail)="..."></div>
value: model<string | undefined>;          // E.164
country?: string;                          // input; with countryChange it is [(country)]
defaultCountry = 'SA';
countries?: string[]; locale?: string; labels?: PhoneFieldLabels; name?: string;
size: Size = 'md'; shape: 'default' | 'pill' = 'default';
invalid?, disabled?, readOnly?, required?: boolean;
id?, placeholder?, autoComplete?, inputMode?, form?,
'aria-label'?, 'aria-labelledby'?, 'aria-describedby'?, 'aria-busy'?;
valueDetail: output<PhoneValueDetail>; countryChange: output<string>;
```

How the names differ from React: `onValueChange(value, detail)` is split into the model's `valueChange` (value) and the `valueDetail` output (detail). The country uses the native select as in React.

## What I could not do

- FieldError is not hidden by itself when it has no content or when the Field has `invalid` false. The caller uses `@if`. A hand written `<p dsFieldError>` always registers.
- `writeValue` calls `model.set`, so a form reset or patch also fires the `valueChange` output. React's `onValueChange` does not fire for a value the parent sets. InlineEdit's "valueChange fires on save only" holds for typing, not for forms.
- InputGroup add on ids follow the order the add ons were created, not DOM order. An add on added later with `@if` lands at the end. An add on's own id is read from a static `id` attribute only.
- `autofocus` on Input and Textarea only stamps `data-autofocus` for the Dialog rule. It does not focus on mount, unlike React's `autoFocus`.
- InputGroup cannot fill an action's size, shape or emphasis. It does fill disabled.
- NumberField and ScrubInput: skipped, no React version.

## Changes needed from the lead

1. `scripts/gen-index.ts` line 127: the React slug for OTPField is `otpfield`, while the contract suite, `scripts/shots.ts` and the Angular gallery use `otp-field` (`kebabCase` in `packages/contract-tests/src/lib.ts`).
   - Use the same rule: add `.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')` before the existing replace, and regenerate.
   - Until then the React contract and the React shots cannot find OTPField.
2. `packages/angular/package.json`: declare `"@angular/forms": "^22.2.6"` under dependencies.
   - It is on the allow list and already installed (a CDK peer), and every control in this lane imports it.
   - I did not touch package.json or the lockfile.
3. After A1 merges: if A1 adds a DI token through which ButtonGroup passes axes to buttons, have `DsInputGroup` provide it with emphasis outline, size and shape. That closes the last gap in InputGroup's action fill.
4. The Angular gallery shell titles a page from its slug ("OtpField"); the React shell uses the component name ("OTPField"). This causes the only differing pixels in the compare. The shell could take the name from the manifest.

## Files

- `packages/angular/src/components/{label,field-error,field,input,textarea,input-group,search-field,password-field,inline-edit,otp-field,phone-field}/` (component, spec, demo, index)
- `packages/angular/src/internal/visually-hidden.ts`
- the `angular` block of the eleven manifests
- generated: `packages/angular/src/index.ts`, `apps/gallery-angular/src/app/routes.gen.ts`, `packages/manifest/manifests.gen.json` (regenerate on merge)
- `docs/reports/shots/matrix/{react,angular,compare-react-angular}/`

No file in `packages/css`, `packages/react`, `packages/styles` or the A1 button family was changed.
