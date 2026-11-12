# Wave 1, Angular batches 1 to 5

Rules and constraints: `docs/plan/wave-1.md`. Owner of every order:
ds-angular. One order per lane: the DOM is copied from React, so one agent
ports a whole sub family in sequence. Each batch starts when its React batch
is green and reviewed by ds-qa. Lanes of one batch run one at a time in the
Angular slot of the schedule, or two at once when a React lane slot is idle.

Count: 55 components (batches 1 to 5 of section 7), plus two early ports
(DropdownMenu, Stepper) that their React batch needs.

## What every Angular order does

Read first: `docs/contracts/frameworks.md` (the Angular section and the wave
0 findings), `docs/reports/angular-proof.md` ("What the contract could not
express in Angular", "What wave 1 should take from this"),
`packages/angular/src/` (Theme, Button, Dialog, `internal/host.ts`,
`behavior/`), and for each component: the React folder, its CSS file, its
manifest and its demo.

Rules:

- Standalone, signal inputs, OnPush, zoneless safe. Attribute selectors so the
  host is the part (`button[dsToggleButton]`, `[dsSelectItem]`). No wrapper
  element React does not have.
- Every directive removes its selector marker and static input attributes
  from the host (`internal/host.ts`), so the DOM equals React's attribute for
  attribute.
- Themes are written `dsTheme="<id>"`, never a static `style`.
- Input names equal React prop names, with the mapped forms in
  `frameworks.md`: no `asChild` (the attribute selector on `a` is the link
  form), `onOpenChange` is the `openChange` output of `[(open)]`, node props
  take an icon name or a `TemplateRef`, value props are models
  (`[(value)]`, `[(checked)]`), and form controls implement
  `ControlValueAccessor` so they work with `@angular/forms`.
- Behavior from `@angular/cdk` first (a11y `ActiveDescendantKeyManager`,
  `FocusKeyManager`, `InteractivityChecker`, bidi `Directionality`,
  `FlexibleConnectedPositionStrategy` on our own element), then
  `@angular/aria` imported only in `packages/angular/src/behavior/`.
- Overlays (DropdownMenu, Select, the list family popups): no CDK Overlay
  pane, no CDK Dialog, no CDK FocusTrap inside a root. A CDK
  `ComponentPortal` whose host is the themed portal wrapper, positioned by
  hand or with the CDK position strategy applied to our element.
- Shared logic comes from `packages/shared` (theme, filter, listbox, number,
  scrub, otp, phone, tags, form, stepper, toast). Never reimplement it.
- `packages/css` is never edited. If the Angular DOM cannot match the CSS,
  stop and report: that is a contract bug.
- Files: `packages/angular/src/components/<kebab>/` with `<kebab>.ts`,
  `<kebab>.spec.ts`, `<kebab>.demo.ts`, `index.ts`; the gallery route comes
  from `npm run gen`. Manifests: only the `angular` block (`ready`,
  `behavior`, `example`).

Proof method (from wave 0), per component:

1. DOM diff against React: `node docs/reports/shots/angular/compare-dom.mjs`
   (or its successor) on every demo case. Zero attribute differences, or
   each one explained.
2. Contract suite: `npm run contract -- --framework angular --component <Names>`.
3. Pixels: `npm run shots -- --framework angular --component <kebabs>`, then
   `npm run shots -- --compare react angular`: 0 differing pixels within the
   threshold (0.1, limit 0.5 percent).
4. `npm run check` (Angular unit tests and the gallery build included).

Acceptance for every order: the four proofs green for every component in the
lane; the `angular` block `ready`; no file outside the lane's folders and the
manifests' `angular` blocks touched; report each React name that has a
different Angular form.

## A1: actions (starts when React batch 1 is green and reviewed)

| Order | Lane | Components | Notes |
| --- | --- | --- | --- |
| A1.1 | Button base | ToggleButton, CloseButton, CopyButton, FloatingActionButton, Link, ButtonGroup | On `DsButtonBase`. Clipboard inside the click handler. ButtonGroup passes axes through DI to child directives. |
| A1.2 | Toggles and menu | ToggleGroup, SegmentedControl, DropdownMenu (early port), SplitButton | Roving focus with `FocusKeyManager` and `Directionality`. DropdownMenu: Angular Aria Menu if it renders no extra element (check), else hand built on the CDK key manager; portal as Dialog does. |

Owns: `packages/angular/src/components/{toggle-button,close-button,copy-button,floating-action-button,link,button-group}/`
(A1.1), `packages/angular/src/components/{toggle-group,segmented-control,dropdown-menu,split-button}/`
(A1.2), the `angular` block of those manifests. Button and IconButton were
ported in wave 0.

## A2: text inputs (starts when React batch 2 is green and reviewed)

| Order | Lane | Components | Notes |
| --- | --- | --- | --- |
| A2.1 | Field family | Label, FieldError, Field, Input, Textarea, InputGroup | Field and Input exist as minimums from wave 0: finish them, add demos. Field provides the ids and state through DI to the control directive. Native props on the inner element are inputs (`type`, `placeholder`, `autocomplete`). |
| A2.2 | Composite text | SearchField, PasswordField, InlineEdit, NumberField, ScrubInput | NumberField: React uses React Aria, Angular is hand built on `packages/shared/src/number.ts` with the same DOM and keys; prove the keys with the contract suite. ScrubInput on `scrub.ts`. |
| A2.3 | Codes | OTPField, PhoneField | Paste and `autocomplete="one-time-code"` tested; the native select for the country. |

Owns: the matching `packages/angular/src/components/<kebab>/` folders and the
`angular` blocks.

## A3: selection (starts when React batch 3 is green and reviewed)

| Order | Lane | Components | Notes |
| --- | --- | --- | --- |
| A3.0 | lead | install `@angular/aria` | Installs: yes, alone. Exact version pinned in `packages/angular`; imported only in `src/behavior/`. Check stable or preview on the day (wave 0 found it stable in 22). |
| A3.1 | Checks and sliders | Checkbox, CheckboxGroup, Switch, Slider, RangeSlider | Slider keys and pointer by hand (no CDK slider); `ControlValueAccessor` on each. |
| A3.2 | Radios | RadioGroup, RadioCard, Rating | Roving focus with selection following focus. |
| A3.3 | List family | ListBox, Combobox, Autocomplete, Select, MultiSelect, TagField | Angular Aria Listbox and Combobox where they render no extra element; else `ActiveDescendantKeyManager`. Filtering from `filter.ts`. Select: same DOM as Radix Select, popup through the portal. |

## A4: forms (starts when React batch 4 is green and reviewed)

| Order | Lane | Components | Notes |
| --- | --- | --- | --- |
| A4.1 | Forms | Fieldset, Form, ConsentField, Stepper (early port), FormWizard, FilterBar | Form works with Angular reactive forms and template forms: it reads `FormGroup` errors and maps them to the summary through `form.ts`. ConsentField has no default checked input. |

## A5: feedback (starts when React batch 5 is green and reviewed)

| Order | Lane | Components | Notes |
| --- | --- | --- | --- |
| A5.1 | Messages and states | Alert, Callout, Banner, StatusDot, Skeleton, ErrorState, NotificationCenter | Live roles exactly as React. |
| A5.2 | Progress and toast | Spinner, ProgressBar, ProgressCircle, Meter, Toast | Toast on `packages/shared/src/toast.ts`: a `DsToaster` region in a portal above dialogs, the same timing rules (danger and action toasts stay). |

## Done for the Angular track

All 55 components plus the two early ports pass the contract suite with
`--framework angular` in one full run, and the React and Angular screenshot
compare is clean. This proves the gate 1 condition "the 55 Angular
components pass the contract suite".
