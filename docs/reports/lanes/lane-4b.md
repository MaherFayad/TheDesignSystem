# Lane 4B: Steps

Branch `claude/ds-lane-4b`. Orders 1.7.7 Stepper and 1.4.4 FormWizard, from
`docs/plan/wave-1-batch-4.md`. Both are built, green and pushed.

| Commit | What |
| --- | --- |
| `1555f74 wo-1.7.7: stepper` | Stepper, `packages/shared/src/stepper.ts` |
| `883108c wo-1.4.4: form wizard` | FormWizard |
| `b718266 wo-1.4.4: form wizard review fixes` | Fixes from the fresh eyes review |

Proof, on the last commit:

- `npm run check`: green.
- `npm run contract -- --framework react --component Stepper,FormWizard`:
  Stepper 21 passed, FormWizard 21 passed, 0 failed.
- Unit tests: `stepper.test.ts` 18, `Stepper.test.tsx` 21,
  `FormWizard.test.tsx` 22.
- Screenshots: `docs/reports/shots/wave-1/stepper/` and
  `docs/reports/shots/wave-1/form-wizard/`. Each folder has Studio dark and
  light, Desk dark and light, Desk dark RTL, Desk light RTL, Studio dark
  compact, Desk dark comfortable, and Studio dark at 360px.

Sources: no source is named for either order, and GoBanana could not be
fetched in this session. Both components are designed from the dials table in
PLAN.md 3.7 and the nearest components in this repo (Button, Field, Input,
Link). The manifests say so.

## Stepper (1.7.7)

### What was built

- `packages/shared/src/stepper.ts` with tests. This is a pure state machine:
  `createStepperState`, `stepStatus`, `canGoTo`, `goTo`, `next`, `back`,
  `setStepComplete`, `resetStepper`, `isFirstStep`, `isLastStep`, `isDone`,
  and `formatStepPosition` ("Step 2 of 4", "الخطوة 2 من 4"). It also has
  `createStepper()`, a small store with `subscribe`, for Tour (1.6.13).
  Linear mode reaches earlier steps, and a later step only when every step
  before it is complete. Free mode reaches any step. Disabled steps are
  skipped by `next` and `back`, and they never block the steps after them. A
  move that is not allowed returns the same object.
- `packages/react/src/components/Stepper/`: the component, the tests, the
  demo and `index.ts`.
- `packages/css/src/components/Stepper.css`.
- `packages/manifest/src/component/Stepper.manifest.json`, with motion
  `tab-indicator`.

### Props

```ts
type StepperSize = 'sm' | 'md';
type StepperOrientation = 'horizontal' | 'vertical';
type StepperMode = 'linear' | 'free';

interface StepperStep {
  title: ReactNode;          // a short noun
  description?: ReactNode;
  invalid?: boolean;         // danger glyph and "has errors"
  disabled?: boolean;        // dashed dim indicator and "unavailable"; skipped by next and back
  href?: string;             // a reachable step renders as a link (Button asChild)
  id?: string;
}

interface StepperProps extends Omit<ComponentProps<'ol'>, 'title' | 'onChange' | 'ref'> {
  steps: readonly StepperStep[];
  current?: number;                       // controlled
  defaultCurrent?: number;                // 0
  completed?: readonly number[];          // default: every step before the furthest step reached
  mode?: StepperMode;                     // 'linear'
  onStepSelect?: (index: number) => void; // makes reachable steps actions
  orientation?: StepperOrientation;       // 'horizontal'; vertical under breakpoint.phone
  size?: StepperSize;                     // 'md'
  labels?: Partial<{ list: string; current: string; complete: string; invalid: string; disabled: string }>;
  ref?: Ref<HTMLOListElement>;
}
```

### Decisions

- The root is the `<ol>` itself, so no `list` part is needed.
- The order lists six parts. The anatomy adds a seventh, `status`: the
  visually hidden words after each title ("current step", "complete", "has
  errors", "unavailable"). Without them, complete and invalid would reach a
  screen reader only as an icon or a color.
- A step the user can reach renders its `title` part as a system Button
  (`data-ds="button" data-part="title"`, emphasis ghost, size xs, wrap). With
  `href`, the Button uses `asChild` over an `<a>`. The current step is never
  an action, and `aria-current="step"` sits on its `<li>`.
- The indicator is `aria-hidden`. The `<ol>` already gives the position
  ("2 of 4"), so the number is not read twice.
- When the stepper is uncontrolled, it keeps the furthest step reached. Going
  back keeps the later steps complete, so the user can go forward again.
- A disabled step does not dim its text. The indicator dims and its ring
  turns dashed, and the title keeps `text.muted` at full strength. Dimming
  the text failed axe contrast (1.76:1).
- The connector is a border, so it stays visible in forced colors. Its fill
  is `::before`, scaled from the start side, with `transform-origin` flipped
  through `:dir(rtl)`. The step `::before` is not a focus layer here, because
  only the title Button takes focus.
- A horizontal stepper takes the vertical layout under `breakpoint.phone`
  (`@media (width < 30rem) /* breakpoint.phone */`, the same pattern as
  Dialog). `data-orientation` keeps the value the caller passed.
- Twelve steps do not fit in a horizontal row. Titles would break inside
  words, so the too-many case shows the vertical form. The manifest lists the
  horizontal row as a mistake.
- `createStepperState` moves an explicit `current` that points at a disabled
  step to the nearest step that is not disabled, looking forward first.

### Token gaps

None. One more Stepper component token would let a recipe tune the
indicator, but none is needed today.

## FormWizard (1.4.4)

### What was built

- `packages/react/src/components/FormWizard/`: the component, the tests, the
  demo and `index.ts`. `readFormValues()` is exported.
- `packages/css/src/components/FormWizard.css`.
- `packages/manifest/src/component/FormWizard.manifest.json`, with motion
  `fade-rise`.

### Props

```ts
type FormWizardSize = 'sm' | 'md';
type FormWizardState = 'editing' | 'submitting' | 'done';
type FormWizardValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
type FormWizardErrors = Record<string, string>;

interface FormWizardStep {
  id: string;
  title: string;
  description?: ReactNode;
  content: ReactNode | ((ctx: { values: FormWizardValues; errors: FormWizardErrors }) => ReactNode);
  validate?: (values: FormWizardValues) => FormWizardErrors | void | Promise<FormWizardErrors | void>;
  nextLabel?: string;   // "Review order"
  backLabel?: string;   // "Edit address"
}

interface FormWizardProps extends Omit<ComponentProps<'div'>, 'title' | 'onSubmit' | 'ref'> {
  steps: readonly FormWizardStep[];
  defaultStep?: number;                                  // 0; steps before it start complete
  mode?: StepperMode;                                    // 'linear'; read at mount
  onSubmit?: (values, form: HTMLFormElement) => void | Promise<void>;
  onStepChange?: (index: number) => void;
  submitLabel?: string;                                  // 'Send form'
  done?: ReactNode;
  doneTitle?: string;                                    // 'Form sent'
  orientation?: StepperOrientation;                      // 'horizontal'
  size?: FormWizardSize;                                 // 'md'
  stepsLabel?: string;
  labels?: Partial<FormWizardLabels>;  // next, back, submit, required, done, submitError, checking, sending, separator
  defaultErrors?: Record<number, FormWizardErrors>;      // errors sent back by a server
  formProps?: Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'ref'>;
  formRef?: Ref<HTMLFormElement>;
  ref?: Ref<HTMLDivElement>;
}
```

### Anatomy

`root` (div, `data-ds="form-wizard"`, `data-size`, `data-state`), `steps` (a
Stepper root), `panel` (the native `<form>`, `noValidate`, named by the
title), `title` (an h2 with `tabindex=-1`), `body` (one per step, with
`hidden` when the step is not current), `error` (shown when a submit fails),
`actions`, `back`, `next` and `submit` (system Buttons), and `status` (a
polite live region).

Three parts were added beyond the order's list. `body` keeps every step in
the DOM, so data is kept when the user goes back (WCAG 3.3.7). `status` makes
the "Step 2 of 4, Address" announcement. `error` reports a failed submit
(WCAG 3.3.1, 4.1.3).

### How it works with a plain form and Field, and where Form plugs in

- One native `<form>` holds every step. Steps that are not current stay in
  the DOM with `hidden`, so the final FormData has every field.
- The built in check for a step runs in this order:
  1. An empty control with `aria-required="true"` gets the `required` words.
     Field `required` sets that attribute, not the native `required`.
  2. The browser's constraint validation runs (type, pattern, min, max).
  3. The step's `validate` function runs.
  The function form of `content` gets `errors`, and each error is passed to a
  Field `error`.
- Next is the submit button, so Enter in a field moves to the next step.
- Focus moves to the title on a step change. When a check fails, focus moves
  to the first field with an error, in a layout effect after the commit, so
  the error is already in that field's `aria-describedby`.
- **Form (1.4.1, lane 4A) plugs in at the panel.** It will render
  `<Form data-part="panel">` in place of the plain `<form>`, and bring the
  error summary and server error mapping. The step check would then call
  `collectErrors` from `packages/shared/src/form.ts` in place of the private
  `stepErrors`. This is noted in `FormWizard.tsx` at the top and in the
  manifest.

### Decisions

- **Default labels.** English: "Go to next step", "Go to previous step",
  "Send form". Arabic: "الانتقال للخطوة التالية", "الرجوع للخطوة السابقة",
  "إرسال النموذج". The demos pass a verb plus a noun for each step: Save
  account, Save address, Review order, Place order, Edit account.
- **Free mode** still checks the current step before a forward move, and
  submit checks every step again. On failure it goes to the first step that
  fails.
- **One check or submit at a time.** A second Enter does nothing while one is
  running. Back and the steps are inactive while a check runs. A check that
  resolves after the user has moved away is dropped.
- **`mode` and the number of steps** are read once, at mount.
- **`defaultStep`** marks the steps before it complete. Submit checks them
  again.
- **Vertical Stepper.** The steps column fits its titles up to a third of
  the row, and is never narrower than `field.label-width`. On a phone the
  steps stack above the panel.

## Fresh eyes review

One subagent per component reviewed the work (claude-opus-5-5, medium, read
only).

**Stepper, fixed:**

- Going back lost progress (blocker).
- Titles broke inside words in the too-many row (blocker).
- A disabled current step was allowed.
- The default completed list read the raw `current`.
- There were no hidden words for "current step".
- The `status` selector was too broad.
- The React Native state claimed `selected`.
- Some tokens were missing from the manifest.
- More screenshots were needed (RTL light, densities).

**FormWizard, fixed:**

- Pressing Enter twice could submit twice (blocker).
- Back during an async check could step back and then jump forward again
  (blocker).
- A rejected submit gave no feedback (blocker).
- Focus jumped to the title on the change from editing to submitting.
- Focus reached a field before its error was linked to it.
- The review step showed empty values at mount.
- The loading label was hard coded.
- The Arabic default labels had no action.
- `formRef` was attached again on every render.
- Private property names were off the convention list.
- A reduced motion comment was wrong.
- The vertical steps column was too narrow.
- The manifest listed an `actions` slot callers cannot fill, and was missing
  `formRef` and `ref`.
- The `many` and `error` cases had no Arabic rows.
- Tests were missing for async checks, double submit and the describedby
  link.

**Left open:**

- `Stepper.css` writes a few declarations on the nested Button directly:
  `justify-content`, `justify-self`, `margin-inline-start`,
  `text-decoration-*` and `text-align`. Button has no private property for
  them. ButtonGroup does the same for radii, under the rule "where Button has
  no property for it".
- `data-orientation` stays in Stepper `states`, as ButtonGroup has it. Rule
  11 of anatomy.md calls it a layout attribute. The lead decides whether
  manifests should list it.
- The FormWizard demo has no `loading` or `disabled` case. Submitting and
  done need a user action, and unit tests cover both. A static `loading`
  case would need a prop that forces the state, which the order does not ask
  for.
- No tab order test runs across the steps, the panel and the actions. The
  DOM order gives that order, and the contract Tab check passes.

## Changes needed from the lead

1. **Generated files.** I ran `npm run gen` and committed the result. The
   lead's committed copies were already stale: they were missing
   ButtonGroup, DropdownMenu and Link. Regenerate on merge:
   `apps/gallery-react/src/routes.gen.ts`, `packages/css/src/index.css`,
   `packages/manifest/manifests.gen.json`, `packages/react/src/index.ts`,
   `packages/shared/src/index.ts` (adds `export * from './stepper';`) and
   `packages/styles/desk/index.css`.
2. **Lane 4A, Form.** When Form lands, change the panel in
   `packages/react/src/components/FormWizard/FormWizard.tsx` from `<form
   ...>` to `<Form data-part="panel" ...>`, and route the step check through
   `collectErrors`. This needs Form to accept `noValidate`, `onSubmit`,
   `aria-labelledby` and a `ref`, and to let a caller check a subset of
   fields (one step). Please give that order the requirement.
3. **Motion catalog (1.11).** Stepper names `tab-indicator` and FormWizard
   names `fade-rise`. Both are on the 1.11 list. No catalog package exists
   yet, so the catalog test will check them.
4. **Optional, Button.** Add private properties for justify and text
   decoration (`--_button-justify`, `--_button-decoration-line`), so a parent
   such as Stepper can restyle a quiet inline Button without direct
   declarations.

## What I could not do

- GoBanana is private and was not fetched. Neither order names a source, so
  nothing depended on it.
- Neutral style screenshots: the Neutral style is not in this checkout. Both
  components use tokens only, so Neutral should apply without a recipe.
