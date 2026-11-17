# Order M9.14: Angular parity for M9.1, M9.3, M9.4 and M9.8

Status: proposed. Angular gains the parts React gained in orders M9.1, M9.3,
M9.4 and M9.8, on the components Angular already has. The shared CSS is
untouched. Nothing is committed.

## What changed

| Component | Ported | Files |
| --- | --- | --- |
| Input | `variant="plain"`; `clearable` with the `clear` part (a `dsCloseButton` between the control and the end slot, `data-part="clear"`, size `xs` or `sm` at `lg`, shape `pill`), shown while the box holds focus and a value; a pointer press keeps focus on the input, then the value clears through the native setter and an `input` event, so `[(value)]`, forms and `(input)` hear it; Escape clears it except inside `[role=dialog]`, `[role=alertdialog]` or `dialog`, and skips IME composition; `clearLabel`, default "Clear text" or "مسح النص" under an Arabic theme (`inputClearLabels`); `data-empty` on the root | `input/input.ts`, `input/index.ts`, `input/input.demo.ts` (case `plain`, clearable row in `long-arabic`) |
| Fieldset | `variant="inset"` stamped as `data-variant` | `fieldset/fieldset.ts`, `fieldset/index.ts`, `fieldset/fieldset.demo.ts` (case `inset`, inset groups in `long-arabic`, `error`, `readonly`) |
| Field | No code change. The projected `div[dsField]` host is a direct child of the body part and its label is a direct child of the field, so every row selector in `Field.css` matches. A row with no drawn label uses `label[dsFieldLabel] data-visually-hidden` | none |
| Select | `emphasis` (`outline`, `ghost`), stamped as `data-emphasis` only when passed; `SelectEmphasis` type | `select/select.ts`, `select/index.ts`, `select/select.demo.ts` (rows "emphasis outline, ghost", "ghost in a filter row", "Arabic ghost") |
| NumberField | `variant` (`field`, `stepper`), stamped as `data-variant` only when passed; stepper DOM order value, decrease, increase; the two halves are `dsIconButton` with emphasis `soft`, shape `pill`, a step under the field height (lg md, md sm, else xs); the hairline is the increment's start border in the CSS. Arabic names kept as they are today (خفض, زيادة, React Aria's words) | `number-field/number-field.ts`, `number-field/index.ts`, `number-field/number-field.demo.ts` |
| DropdownMenu | `div[dsDropdownMenuQuickActions]` (role group, `label` required, part `quick-actions`) and `div[dsDropdownMenuQuickAction]` (role menuitem, `icon` required, `tone`, parts `start` and `text`), on the item base, so select, typeahead and the highlight marker work; Left and Right move inside the row in reading order, mirrored in rtl, wrapping, skipping disabled; the key is prevented, and the submenu close listener now skips a prevented key, so a row in a submenu does not close it; the marker lights quick actions | `dropdown-menu/dropdown-menu.ts`, `dropdown-menu/index.ts`, `dropdown-menu/dropdown-menu.demo.ts` (case `quick-actions`, triggers `quick`, `quick-four`, `quick-long`, `quick-ar`, `quick-long-ar`) |
| Toast | `start` (icon name, a person `{ avatar: { name, src } }`, a TemplateRef, or a short text) and `meta` (text in a `span`, or a Date as a relative time in `<time datetime>` through `toastMeta()`, refreshed every 30 s); each toaster item asks `toastClosable(item, platform)`; the announcement reads meta after the description in the toast's language; Escape on a focused toast closes it (already there, now tested on a toast with no close button) | `toast/toast.ts`, `toast/toaster.ts`, `toast/index.ts`, new `toast/toast-avatar.ts`, `toast/toast.demo.ts` (banner triggers `banner`, `banner-quiet`, `banner-danger`, `banner-ar`, three static banners, an Arabic one) |

Manifests, `angular` block note only: Input, Field, Fieldset, Select,
NumberField, DropdownMenu, Toast. `npm run gen` was run after.

## Tests

New specs, the twins of the React tests for these orders:

- `input/input.clear.spec.ts` (7): plain, data-empty (typed and set from
  outside), the clear button shows and hides with focus, clears with focus
  back and an input event, Escape outside and inside a dialog, read only,
  Arabic and `clearLabel`.
- `fieldset/fieldset.inset.spec.ts` (1): `data-variant` and the DOM the
  row selectors read.
- `select/select.emphasis.spec.ts` (1).
- `number-field/number-field.stepper.spec.ts` (4): order, soft pill halves
  and their sizes, stepping, read only, Arabic names.
- `dropdown-menu/dropdown-menu.quick.spec.ts` (6): anatomy, Up and Down
  through the row, Left and Right with wrap and a disabled action, rtl, a
  row in a submenu does not close it, select closes the menu.
- `toast/toast.banner.spec.ts` (9): ios and web and android close rules,
  the danger refusal and its warning, Escape on a banner with no close
  button, DOM order with the avatar and `<time>`, the announcement, every
  start form, Arabic meta with Western digits.

Proof:

- `npm run check -w @the-system/angular`: three runs, three passed (118
  files, 799 tests each).
- `npm run contract -- --framework angular --platform ios --component Input,Field,Fieldset,Select,NumberField,DropdownMenu,Toast`:
  357 passed, 4 failed in the first run. All four were axe runs cut by a
  page navigation ("Execution context was destroyed"), the gallery dev
  server reloading while other lanes edited shared files. A rerun of
  Fieldset and Select: 106 passed, 0 failed.
- The same with `--platform web`: 361 passed, 0 failed.

## Flaky specs in the full run

- `slider/slider.motion.spec.ts` (two tests failed in one full run of
  eight). Cause: `meter/meter-motion.spec.ts` saved the inherited
  `getBoundingClientRect` and wrote it back as an own property of
  `HTMLElement.prototype`, and `toggle-group/toggle-group.perf.spec.ts`
  did the same for `animate`, `getAnimations` and `getBoundingClientRect`
  through `Object.assign`. The unit test runner keeps one jsdom per worker
  (not isolated), so when one of them ran before the slider spec in the
  same worker, that own property hid the slider spec's spy on
  `Element.prototype`, every box measured 0 and the drag went nowhere.
  Fix: both specs now save the own descriptor and put it back, or delete
  the property when there was none.
- `tag-field/tag-field.spec.ts`, "Enter adds the typed text and drops
  duplicates" (failed in the first full run). The status is written in a
  frame callback and drawn by the change detection that write schedules.
  The test slept a fixed 40 ms and read the DOM. In a shared worker the
  loop can be late (a 40 ms sleep measured 92 ms in one run), and the 40 ms
  timer is then already due and runs before the queued change detection.
  Fix: the test waits for the text with `vi.waitFor`. No component change.

## Selectors that could not be matched

None. Every selector in `Input.css`, `Fieldset.css`, `Field.css`,
`Select.css`, `NumberField.css`, `DropdownMenu.css`, `Toast.css` and
`Avatar.css` that these parts use matches the Angular DOM.

## Decisions

- Angular has no Avatar. The toast's person is drawn by a private
  `span[dsToastAvatar]` in the toast folder on React's decorative Avatar
  DOM (`data-ds="avatar"`, size md, shape default, `aria-hidden`, the hue
  variable, the image only once loaded, the fallback initials or the user
  icon, the 600 ms fallback delay while an image loads). The Avatar port
  replaces it.
- `trackPressed` is not used: React stamps no `data-pressed` on the new
  parts. The clear part is a CloseButton, which already tracks the press
  through the button base; the quick action is a menu item, which React
  does not mark either.
- The Arabic quick menu and the Arabic contact card are declared inside
  their Arabic `dsTheme` (a template takes its theme from where it is
  declared), so the clear button and the menu read Arabic.
- `DsToast` takes `start` and `meta` as inputs; a node `start` is a
  TemplateRef, as other Angular node props.

## Not done

- Pixel compare against React within the threshold: not run in this lane.
- ContextMenu quick actions: Angular has no ContextMenu.
- The `react` block notes of `Select.manifest.json` and
  `NumberField.manifest.json` still say the Angular input "waits for order
  M9.14". That block is not this lane's to edit; the lead may drop the
  sentence.
- Files outside the owned folders, edited for test isolation only, as the
  order asked: `packages/angular/src/components/meter/meter-motion.spec.ts`,
  `packages/angular/src/components/toggle-group/toggle-group.perf.spec.ts`,
  `packages/angular/src/components/tag-field/tag-field.spec.ts`.
