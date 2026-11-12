# Lane angular-sync: Angular after review angular-1

Branch `claude/ds-angular-sync`, from `claude/relaxed-hypatia-7gseap`. One
commit per component, `a-sync: <Component>`, pushed after each batch.
The lead session fixed the blockers, synced DOM changes, swapped the stand
ins and ran the proofs. Three subagents (claude-opus-5-5, medium), each in
its own git worktree, built the four new ports and the Field API move. The
lead copied their files, ran `npm run gen` and `npm run check` again, and
committed them.

Only `packages/angular/src/**`, the `angular` block of four manifests, the
generated files and the reports were changed. No CSS, React or shared file
was touched. No dependency was added.

`npm run check` is green after every batch: Angular unit tests 223 at the
review, 490 now; root vitest 2042.

## Task 1: blockers and short notes from review angular-1

| Component | Finding | What changed |
| --- | --- | --- |
| ToggleButton | B1: a caller preventDefault did not stop the toggle with trusted events | The toggle decides in a click listener added after the first render (`internal/late-listener.ts`), so it runs after the caller's `(click)` and reads `defaultPrevented` synchronously. No microtask wait. Test: the state is decided inside the click. |
| ToggleButton | B2: a caller `aria-label` on the text form was removed (WCAG 4.1.2) | New input `aria-label` (property `ariaLabel`) feeds the host binding on the text form; the icon form still uses `label`. |
| CopyButton | B1: same microtask check; clipboard write after a microtask | Same late listener. The clipboard write starts inside the click (note 2). The hold time reads `--ds-delay-feedback`, as React since `3a4fdb1`. |
| Link | B1: a static `tabindex="-1"` never reached the input (WCAG 2.4.3) | New input alias `tabindex` (number transform); `tabIndex` wins when both are set. |
| Link | N2: a caller `aria-disabled` was removed | New input alias `aria-disabled`, passed through while not disabled. |
| Link, Label | N3, A2 N1: `ar-SA` read as English (WCAG 3.1.2) | `lang.toLowerCase().startsWith('ar')`, as React. |
| DropdownMenu demo | B1: the Arabic board menu opened with `dir="ltr" lang="en"` (WCAG 3.1.2, 1.3.2) | The Arabic case has its own template, declared inside the Arabic `dsTheme`. |
| InlineEdit | B1: Enter, Space and click on the display closed the editor at once (WCAG 2.1.1, 2.4.3) | `onRootBlur` ignores a focusout from the display part or a node no longer connected. Test: a focusout from the display with no relatedTarget keeps the editor open. |
| OTPField demo | B1: the grid did not reflow below 352px (WCAG 1.4.10) | The column minimum is `min(min(100%, 22rem), 100%)`, the exact style React's `DemoGrid` writes. |
| Toast (Dialog) | B1: focus could not reach a toast while a dialog was open (WCAG 2.1.1) | `dialog.ts`: `onDocumentFocusin` and `onDocumentKeydown` return for `isInsideToaster(target)`; `hideOthers` skips `[data-toaster-layer]`. `dialog-toast.spec.ts` holds the Angular twins of the three React tests (toasts readable and clickable above a dialog with focus allowed in, Escape closes the dialog and the danger toast stays, Escape closes only the top of nested dialogs). |
| Toast | Close part | `dsCloseButton`, `toast-close.ts` deleted (task 5). |
| Alert, Banner | N1: close part was `dsIconButton` with a static `data-ds` | `dsCloseButton`. Same DOM. |

Notes not taken, with the reason:

- ToggleButton N3, CloseButton N1: the base inputs (`loading`, `tone` on
  CloseButton) come from `DsButtonBase`. Removing them needs a narrower base;
  no DOM effect today.
- ToggleButton N4: the one way `[pressed]` flips locally on click, as an
  Angular `model` does. Manifest note left to the lead (manifest notes are
  outside the `angular` ready fields this lane set).
- Link N4 and the Button sync from `22040dc` (inert controls pass only
  navigation keys to `onKeyDown`): Angular cannot hold back a caller's
  `(keydown)` on the same element without `stopImmediatePropagation`, which
  would also stop the key reaching ancestors (a dialog's Escape). Left as is;
  an inert Angular control passes every key to its caller.
- DropdownMenu N2: `detectChanges()` in `place()` was kept. The side and
  align signals set in the loop change the menu size, and removing the call
  needs a run in a real browser to prove the placement holds.
- Input N2, N3, InputGroup N1, PhoneField N1, NotificationCenter N1 and N2,
  ProgressBar N1, Banner N2, Alert N2 and N3, Toast N2: larger than a few
  lines or shared with React. Not done.

## Task 2: the four unported components

| Component | Selectors | DOM vs React | Contract | Unit tests |
| --- | --- | --- | --- | --- |
| ToggleGroup | `div[dsToggleGroup]`, `button[dsToggleGroupItem]` | 0 lines, default, studio, desk rtl ar | 29 passed | 16 |
| SegmentedControl | `div[dsSegmentedControl]`, `button[dsSegmentedControlItem]` | 0 lines, indicator styles included | 29 passed | 14 |
| NumberField | `div[dsNumberField]` | 0 lines, default and desk light rtl ar | 29 passed | 11 |
| ScrubInput | `div[dsScrubInput]` | 0 lines, default and desk light rtl ar | 29 passed | 9 |

- Both item kinds share `DsGroupItemBase` (`toggle-group/group-item.ts`) on
  `DsButtonBase`, and roving focus from `behavior/roving-radio.ts`
  unchanged. A press is decided in the same after-the-caller listener as
  ToggleButton.
- NumberField is hand built on `packages/shared/src/number.ts`, following
  React Aria's rules read from its source: stepping from typed text and from
  empty, snap on commit only when `step` is set, steppers disabled at the
  bounds, press and hold repeat (400 ms, then 60 ms), English and Arabic
  stepper names. Driven side by side in Chromium with trusted events (steppers,
  hold, Page keys, Home, End, Arabic digits, a refused letter, percent,
  currency, scrub drag, expressions, Shift+Arrow): equal results.
- Mapped names: `onChange` is `valueChange` of `[(value)]`; ScrubInput's
  `onChangeEnd` is the `changeEnd` output; `start`, `end` and ScrubInput's
  `label` take an icon name, a text or a TemplateRef.
- Gaps: stepper words in English and Arabic only (React Aria ships about 30
  locales); the wheel never steps (as the manifest says; React Aria steps on
  wheel while focused); `writeValue` also emits `valueChange`, as in A2.

## Task 3: React DOM changes after the Angular ports

Read: "DOM changes" in `docs/reports/fixes/batch-1-6.md` and `batch-7.md`.
`late-lanes.md` and `round-2.md` do not exist under `docs/reports/fixes/`.
Also checked: every React or CSS commit on a ported component that is not
an ancestor of the last Angular commit for it.

| Source | Change | Angular |
| --- | --- | --- |
| batch-1-6 DOM 1 | Dialog close part is `data-ds="close-button"` | Dialog renders `dsCloseButton` |
| batch-1-6 DOM 3 | FormWizard: no step list `aria-label` without `stepsLabel` | Already so (`[aria-label]` passes undefined, Stepper's default applies) |
| batch-1-6 DOM 2, batch-7 | Tour, Drawer, Sheet, Popover, Navbar, Sidebar, Rail, Avatar, Chip, TableOfContents, Pagination | No Angular port; nothing to apply |
| `3a4fdb1` | CopyButton hold time `delay.feedback` | Applied |
| `6022983`, `9ce7d07` | Label and Link `startsWith('ar')` | Applied (task 1) |
| `c74aa4f` | OTPField demo grid | Applied (task 1) |
| `b424a1d` | Rating names follow the theme language, any `ar` tag, Western digits | `isArabic()` as React; the `ar-u-nu-latn` formatter is replaced by plain digits, as React |
| `bd27ca6` | RangeSlider demo: year case 2019 to 2022 with 3 steps between thumbs; price error case 400 to 500, "at least 150 SAR" | Applied |
| `e179b2b` | WindowControls labels default by theme language | Applied, with a new spec |
| `e179b2b` | TitleBar `moveHint` Arabic default | Not applicable: the Angular TitleBar has no move handle yet (arrives with Window) |
| `eb67252` | Switch demo Arabic state words مفعل and غير مفعل | Applied (found by the pixel compare) |
| `8e7f76e`, `e550d76`, `086fb03` | CSS and tests only | Nothing to port |
| `22040dc` | Inert Button and Link pass navigation keys | Not portable, see task 1 notes |

## Task 4: Field API for the A3 controls

All A3 controls that read the Field now use `fieldControl()` from
`field/field-context.ts`. Two differences from React were found and fixed:

1. They injected the concrete `DsField`, not `DsFieldContext`, so inside a
   `dsFormField` or any other context provider they read no Field.
2. A control with its own `id` did not call `setControlId`, so the label's
   `for` pointed at the Field's default id.

| Control | Change |
| --- | --- |
| Checkbox | Helper; own description id joins describedby; group invalid, disabled, readOnly. Also: dispatches a click on the hidden input after a change, as the Radix bubble input does (found by the ConsentField form test) |
| Switch | Helper; same bubble click |
| Slider, RangeSlider (`slider-base.ts`) | Helper for id, describedby, invalid, disabled (React passes no readOnly or required); the Field id goes on the first thumb |
| Combobox, Autocomplete (`combobox-base.ts`) | Helper |
| Select | Helper; the loading id follows the own describedby, as React |
| MultiSelect, TagField | Helper |
| RadioGroup, RadioCard, Rating, CheckboxGroup, ListBox | No change: they do not read the Field in React either |
| ConsentField, Fieldset | Providers of an error context, not readers |

Each changed control has a `<Class> in a Field` describe (18 tests): label
`for` equals the control id, `aria-describedby` is description then error,
`aria-invalid`, `aria-required` (absent on the sliders, as React), an own id
moves the label `for`, Field `disabled` disables the control. `aria-labelledby`
on thumbs, lists and triggers stays hand wired from `labelId`, as React's
`useField()`.

Field itself: its text template rendered a string with a space on each side,
which put a visible gap before the required mark in FormWizard (the pixel
compare). It is now on one line, as React renders the string.

## Task 5: stand ins

| Stand in | Result |
| --- | --- |
| `toast/toast-close.ts` (`dsToastClose`) | Replaced by `dsCloseButton`, deleted |
| `consent-field/stand-ins.ts` (Checkbox, Switch) | Replaced by `dsCheckbox` and `dsSwitch` in ConsentField and the Fieldset demo, deleted. The control carries `data-part="control"` as React's `rootProps`. A private `dsNoFieldContext` directive gives the control a null Field context: ConsentField's error context is a `viewProviders` entry that reaches its whole template, and React wraps only the error in it |
| `filter-bar/stand-in-chip.ts` | Kept: Chip has no Angular port |
| Alert, Banner close parts | `dsCloseButton` (task 1) |

## Task 6: contract and pixel compare

### Contract, full Angular run

`npm run contract -- --framework angular`: 1779 passed, 0 failed, 54
skipped, 13.9 minutes. JSON: `docs/reports/contract-angular.json`.

| Component | Passed | Failed | Skipped |
| --- | --- | --- | --- |
| Alert | 29 | 0 | 0 |
| Autocomplete | 29 | 0 | 15 |
| Banner | 29 | 0 | 0 |
| Button | 29 | 0 | 0 |
| ButtonGroup | 29 | 0 | 0 |
| Callout | 28 | 0 | 1 |
| Checkbox | 29 | 0 | 0 |
| CheckboxGroup | 29 | 0 | 0 |
| CloseButton | 29 | 0 | 0 |
| Combobox | 44 | 0 | 0 |
| ConsentField | 29 | 0 | 0 |
| CopyButton | 29 | 0 | 0 |
| Dialog | 44 | 0 | 0 |
| DropdownMenu | 44 | 0 | 0 |
| ErrorState | 29 | 0 | 0 |
| Field | 29 | 0 | 0 |
| FieldError | 28 | 0 | 1 |
| Fieldset | 29 | 0 | 0 |
| FilterBar | 29 | 0 | 15 |
| FloatingActionButton | 29 | 0 | 0 |
| Form | 29 | 0 | 0 |
| FormWizard | 29 | 0 | 0 |
| IconButton | 29 | 0 | 0 |
| InlineEdit | 29 | 0 | 0 |
| Input | 29 | 0 | 0 |
| InputGroup | 29 | 0 | 0 |
| Label | 29 | 0 | 0 |
| Link | 29 | 0 | 0 |
| ListBox | 29 | 0 | 0 |
| Meter | 28 | 0 | 1 |
| MultiSelect | 44 | 0 | 0 |
| NotificationCenter | 29 | 0 | 0 |
| NumberField | 29 | 0 | 0 |
| OTPField | 29 | 0 | 0 |
| PasswordField | 29 | 0 | 0 |
| PhoneField | 29 | 0 | 0 |
| ProgressBar | 28 | 0 | 1 |
| ProgressCircle | 28 | 0 | 1 |
| RadioCard | 29 | 0 | 0 |
| RadioGroup | 29 | 0 | 0 |
| RangeSlider | 29 | 0 | 0 |
| Rating | 29 | 0 | 0 |
| ScrubInput | 29 | 0 | 0 |
| SearchField | 29 | 0 | 0 |
| SegmentedControl | 29 | 0 | 0 |
| Select | 44 | 0 | 0 |
| Skeleton | 28 | 0 | 1 |
| Slider | 29 | 0 | 0 |
| Spinner | 28 | 0 | 1 |
| SplitButton | 44 | 0 | 0 |
| StatusDot | 28 | 0 | 1 |
| Stepper | 29 | 0 | 0 |
| Switch | 29 | 0 | 0 |
| TagField | 29 | 0 | 15 |
| Textarea | 29 | 0 | 0 |
| Theme | 0 | 0 | 1 |
| Toast | 44 | 0 | 0 |
| ToggleButton | 29 | 0 | 0 |
| ToggleGroup | 29 | 0 | 0 |

Skips: the 15 open checks of Autocomplete, FilterBar and TagField (no
`contract.trigger`; React skips the same), the keys check of components
with no keyboard map, and Theme (no demo route by design).

### Pixels, React against Angular

`npm run shots -- --framework angular --no-verify` (972 shots, every Angular
route), `npm run shots -- --framework react --no-verify`, then
`npm run shots -- --compare react angular`: **972 pairs, 972 pass, 0 over
the limit** (threshold 0.1, limit 0.5 percent). Table:
`docs/reports/shots/matrix/compare-react-angular/index.md`.

The fresh React captures were compared, then the React matrix folder was
restored to its committed state: React is not this lane's folder. The
Angular matrix and the compare folder are committed.

Every pair is 0 differing pixels except OTPField: 18 pairs, up to 187
pixels (0.018 percent), only the gallery heading "OtpField" against
"OTPField" (review N-C1, lead file).

The first compare also showed Switch (up to 106 pixels, the Arabic state
word) and FormWizard (up to 136 pixels, a space before the required mark).
Both were fixed (`a-sync: Switch demo`, `a-sync: Field`) and the Angular
matrix was captured again.

Open shots that failed, in both runs: SplitButton, 12 in each framework
(the open part is a menu, and the script looks for a second
`[data-ds=split-button]`). React alone also failed Breadcrumbs,
LanguageSwitch and Menubar open shots (no Angular port). Script detail, see
the lead list.

| Component (kebab) | Pairs | Pass | Pairs with any differing pixel | Most pixels |
| --- | --- | --- | --- | --- |
| alert | 18 | 18 | 0 | 0 |
| autocomplete | 12 | 12 | 0 | 0 |
| banner | 12 | 12 | 0 | 0 |
| button | 18 | 18 | 0 | 0 |
| button-group | 18 | 18 | 0 | 0 |
| callout | 12 | 12 | 0 | 0 |
| checkbox | 18 | 18 | 0 | 0 |
| checkbox-group | 18 | 18 | 0 | 0 |
| close-button | 18 | 18 | 0 | 0 |
| combobox | 24 | 24 | 0 | 0 |
| consent-field | 18 | 18 | 0 | 0 |
| copy-button | 18 | 18 | 0 | 0 |
| dialog | 24 | 24 | 0 | 0 |
| dropdown-menu | 24 | 24 | 0 | 0 |
| error-state | 18 | 18 | 0 | 0 |
| field | 12 | 12 | 0 | 0 |
| field-error | 12 | 12 | 0 | 0 |
| fieldset | 12 | 12 | 0 | 0 |
| filter-bar | 12 | 12 | 0 | 0 |
| floating-action-button | 18 | 18 | 0 | 0 |
| form | 18 | 18 | 0 | 0 |
| form-wizard | 18 | 18 | 0 | 0 |
| icon-button | 18 | 18 | 0 | 0 |
| inline-edit | 18 | 18 | 0 | 0 |
| input | 18 | 18 | 0 | 0 |
| input-group | 18 | 18 | 0 | 0 |
| label | 12 | 12 | 0 | 0 |
| link | 18 | 18 | 0 | 0 |
| list-box | 18 | 18 | 0 | 0 |
| meter | 12 | 12 | 0 | 0 |
| multi-select | 24 | 24 | 0 | 0 |
| notification-center | 18 | 18 | 0 | 0 |
| number-field | 18 | 18 | 0 | 0 |
| otp-field | 18 | 18 | 18 | 187 |
| password-field | 18 | 18 | 0 | 0 |
| phone-field | 18 | 18 | 0 | 0 |
| progress-bar | 12 | 12 | 0 | 0 |
| progress-circle | 12 | 12 | 0 | 0 |
| radio-card | 18 | 18 | 0 | 0 |
| radio-group | 18 | 18 | 0 | 0 |
| range-slider | 18 | 18 | 0 | 0 |
| rating | 12 | 12 | 0 | 0 |
| scrub-input | 18 | 18 | 0 | 0 |
| search-field | 18 | 18 | 0 | 0 |
| segmented-control | 18 | 18 | 0 | 0 |
| select | 24 | 24 | 0 | 0 |
| skeleton | 12 | 12 | 0 | 0 |
| slider | 18 | 18 | 0 | 0 |
| spinner | 12 | 12 | 0 | 0 |
| split-button | 12 | 12 | 0 | 0 |
| status-dot | 12 | 12 | 0 | 0 |
| stepper | 12 | 12 | 0 | 0 |
| switch | 18 | 18 | 0 | 0 |
| tag-field | 12 | 12 | 0 | 0 |
| textarea | 18 | 18 | 0 | 0 |
| toast | 24 | 24 | 0 | 0 |
| toggle-button | 18 | 18 | 0 | 0 |
| toggle-group | 18 | 18 | 0 | 0 |

## What could not be done

- Inert Button and Link keys (`22040dc`, Link N4): not expressible in
  Angular without stopping propagation to ancestors.
- TitleBar move handle and its Arabic hint: the Angular TitleBar has none.
- FilterBar keeps its Chip stand in until Chip is ported.
- The larger review notes listed under task 1.
- Shots ran with `--no-verify` (single capture) to fit the time.

## Changes needed from the lead

1. `packages/angular/package.json`: SegmentedControl imports
   `@the-system/motion` (catalog, settle), and seven components import
   `@angular/forms` (review N-C3). Both resolve through the workspace; declare
   them.
2. Gallery slug for acronyms (review N-C1): the Angular gallery heading still
   reads "OtpField", the only pixel difference left (OTPField, 18 pairs, up
   to 187 pixels, the heading only).
3. `field/field-context.ts` (suggestion from the Field subagent): the
   `setControlId` effect is now copied in ten controls; a small helper next
   to `fieldControl()` would remove the copies.
4. Manifest notes: ToggleButton's one way `[pressed]` (review A1 N4), and
   SplitButton `contract.trigger` (review A1 SplitButton N2) and the
   `action` output in `frameworks.md` (N-C4).
5. `scripts/shots.ts` open shots fail for SplitButton in both frameworks
   ("the first trigger opens no [data-ds=split-button]": the open part is a
   menu, not a second split-button root), and for Breadcrumbs, LanguageSwitch
   and Menubar in React. Script owner.
6. `npm run check` is sensitive to load: `no-native-title.test.ts` and a
   TagField status test (40 ms wait) timed out once while three checks ran at
   the same time. Both pass alone.
