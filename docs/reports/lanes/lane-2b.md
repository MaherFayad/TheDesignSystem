# Lane 2B report: input composites

Branch `claude/ds-lane-2b`, based on `762fb7f` (wo-1.6.8). Batch file
`docs/plan/wave-1-batch-2.md`. Four components, built in the lane order:
InputGroup (1.2.11), SearchField (1.2.7), PasswordField (1.2.8), InlineEdit
(1.2.12). Each has the standard set, a manifest, unit tests, a demo with
every case that applies, screenshots in `docs/reports/shots/wave-1/<slug>/`
(studio dark and light, desk dark and light, desk dark rtl ar) and one fresh
eyes review by a ds-qa subagent.

Final state of every check on the last commit:

- `npm run check`: green.
- `npm run contract -- --framework react --component InputGroup,SearchField,PasswordField,InlineEdit`:
  21 passed, 0 failed for each.

Generated files (barrels, `packages/css/src/index.css`,
`packages/styles/desk/index.css`, `routes.gen.ts`, `manifests.gen.json`)
were refreshed with `npm run gen` and committed as generated. They were
stale on the base commit (ButtonGroup, DropdownMenu and Link were missing
from `index.css`), so the first commit's generated diff is larger than this
lane. Regenerate on merge.

## One pattern for composites on Input

SearchField and PasswordField nest an Input; they do not copy it.

- The composite's root is the bordered box (`data-ds="search-field"`,
  `data-ds="password-field"`). It draws Input's look with its own private
  properties (`--_search-field-*`, `--_password-field-*`) that default to the
  same tokens as Input.css.
- The nested Input root carries `data-part="control"` through `rootProps`
  and keeps the native input, the Field wiring (`useFieldControl`), the ref
  merge and the autofill fix.
- The composite's CSS clears the nested box through Input's private
  properties (`--_input-border-color*`, `--_input-ring`, `--_input-bg`,
  `--_input-padding-inline`, `--_input-height`, `--_input-font-size`) and
  sets three declarations directly where Input has no property:
  `border-width: 0`, `opacity: 1` (the root dims once) and, in forced colors,
  `outline-style: none` (one focus outline). The selector carries
  `[data-part='control']` so it outranks Input's `lg:lang(ar)` rule.
- The nested Input is as tall as the root (over the root border), so the
  native input keeps a 24px target at xs; the contract target check passes in
  every density.
- The ring shows only while the control has focus
  (`:has(> [data-part='control']:focus-within)`), so a focused end button
  shows only its own ring.

InputGroup and InlineEdit keep the nested Input's own box.

## 1.2.11 InputGroup

An Input joined with add ons and actions in one seamed row.

```tsx
<InputGroup
  size?: 'xs' | 'sm' | 'md' | 'lg'      // default 'md', passed to children that leave it unset
  shape?: 'default' | 'pill'            // default 'default', passed on; only outer corners round
  invalid?: boolean                     // follows the Field
  disabled?: boolean                    // follows the Field; root gets aria-disabled
  readOnly?: boolean                    // follows the Field; add ons dash
  ref?: Ref<HTMLDivElement>
  {...div props}                        // role="group" is fixed
>
  <InputGroupAddon>https://</InputGroupAddon>   // data-part="addon"
  <Input />                                     // data-part="control" (via rootProps)
  <Button>Copy link</Button>                    // data-part="action"
</InputGroup>
```

Decisions:

- Parts are stamped on direct children: Button and IconButton become
  `action`, InputGroupAddon is `addon`, any other component is the
  `control` and gets `data-part` through `rootProps` (anatomy rule 8 makes
  `rootProps` standard on form controls). Fragments are not stamped; a
  wrapper around a Button would be read as the control. Both are in the
  manifest.
- Add on ids join the control's `aria-describedby` (after the Field
  description and error): add on text is a description, never the name.
- An action with no emphasis of its own is `outline`, so its border joins
  the control's. A child's own prop always wins.
- The seam: every child but the first drops its start border; inner corners
  are square with logical radius properties. The add on border that meets
  the control turns to the danger color while invalid.
- Focus rings of joined children are drawn inside (inset), as in
  ButtonGroup, so the next part never covers them. The same override is set
  for SearchField and PasswordField children.
- A long add on shrinks to half the row with an ellipsis, so the control
  keeps room at 320px (WCAG 1.4.10).
- The root carries `aria-disabled` while disabled, so axe treats the dimmed
  add on as part of an inactive control (1.4.3 exemption).
- A URL group in an Arabic page takes `dir="ltr"` (demo and manifest
  mistake), so `https://` stays before the host.

## 1.2.7 SearchField

```tsx
<SearchField
  size?: 'xs' | 'sm' | 'md' | 'lg'      // default 'md'; clear button xs, sm at lg
  shape?: 'default' | 'pill'            // default 'default' (radius.control: a pill in Studio and Desk)
  value?: string
  defaultValue?: string                 // default ''
  onValueChange?: (value: string) => void
  onSubmit?: (value: string) => void    // Enter
  onClear?: () => void
  clearLabel?: string                   // default 'Clear search'
  loading?: boolean                     // spinner before the end content, polite status
  loadingLabel?: string                 // default 'Searching'
  end?: ReactNode
  invalid?, disabled?, readOnly?        // follow the Field
  className?, style?, rootProps?        // root
  ref?: Ref<HTMLInputElement>           // native input, with every other native prop
/>
```

Anatomy: root, `icon`, `control` (nested Input root), `clear`, `end`,
`spinner`, `status`. States: `data-empty`, `data-invalid`, `data-disabled`,
`data-readonly`, `data-loading`.

Decisions:

- The clear part is an IconButton (`icon="close"`, `data-part="clear"`):
  CloseButton (1.1.9) does not exist yet. Swap it in when it lands; the part
  name stays.
- Escape clears and stops there; Escape on an empty box bubbles. Radix
  layers (the system Dialog) listen for Escape on the document in the
  capture phase, before React sees the key, so the clear runs in a window
  capture listener that comes first and marks the key handled. Tested
  inside a Dialog: the first Escape clears, the second closes it. Enter calls
  `onSubmit` and a form still submits. Keys that end an IME composition
  (`isComposing` or keyCode 229) are ignored.
- The native search cancel button and decoration are hidden and the control
  has `appearance: none`.
- The status (`role="status"`, visually hidden) is always in the DOM and
  says the loading label while loading. `aria-busy` was dropped from the
  input after review (it can hide the value from screen readers).
- `data-invalid` and `data-readonly` were added to the order's states, since
  the root draws the box and must show them.
- Motion `spinner`.

## 1.2.8 PasswordField

```tsx
<PasswordField
  size?: 'xs' | 'sm' | 'md' | 'lg'      // default 'md'; toggle xs, sm at lg
  shape?: 'default' | 'pill'            // default 'default'
  visible?: boolean
  defaultVisible?: boolean              // default false
  onVisibleChange?: (visible: boolean) => void   // also false on form submit
  showLabel?: string                    // default 'Show password'
  hideLabel?: string                    // default 'Hide password'
  autoComplete?: 'current-password' | 'new-password' | 'off' | string   // default 'current-password'
  invalid?, disabled?, readOnly?        // follow the Field
  className?, style?, rootProps?        // root
  ref?: Ref<HTMLInputElement>
/>
```

Anatomy: root, `control`, `toggle`. States: `data-visible`, `data-invalid`,
`data-disabled`, `data-readonly`.

Decisions:

- Hand built: the Radix password toggle field is exported as `unstable_`.
- The toggle has `aria-pressed` and `aria-controls` (the input id from the
  Field, the caller, or `useId`). Its name also changes (Show password, Hide
  password), as the order asks, so the name always says what a press does.
- Paste is never blocked; `autoComplete` passes through (WCAG 3.3.8).
  Spell check, autocorrect and autocapitalize are off.
- The value hides on the form's `submit` event, with `flushSync` so the
  input is `type=password` again before the browser reads the form. A script
  that calls `form.submit()` skips that event (noted in the manifest).
- Edge's own reveal button (`::-ms-reveal`) is hidden.
- The toggle stays enabled while read only; while disabled it keeps
  `aria-disabled` and does not dim twice.
- Motion `fade` (the focus glow, as Input).

## 1.2.12 InlineEdit

```tsx
<InlineEdit
  label: string                         // required: the editor's name, part of the display's
  value?: string
  defaultValue?: string                 // default ''
  onValueChange?: (value: string) => void   // on save, only when changed
  defaultEditing?: boolean              // default false; never takes focus on the first render
  onEditingChange?: (editing: boolean) => void
  validate?: (value: string) => string | undefined | null
  placeholder?: string                  // default 'Add a name'
  editLabel?: string                    // default `Edit ${label.toLowerCase()}`
  saveLabel?: string                    // default 'Save changes'
  cancelLabel?: string                  // default 'Discard changes'
  savedLabel?: string                   // default 'Saved'
  size?: 'xs' | 'sm' | 'md' | 'lg'      // default 'md'
  disabled?: boolean
  invalid?: boolean
  error?: ReactNode                     // a message from outside, shown in both states
  inputRef?: Ref<HTMLInputElement>
  ref?: Ref<HTMLDivElement>
/>
```

Anatomy: root, `display` (ghost Button), `control` (Input root), `save`,
`cancel` (IconButtons), `error`, `status`. States: `data-state` `viewing` or
`editing`, `data-empty`, `data-invalid`, `data-disabled`.

Decisions:

- Two parts beyond the order: `error` (an icon plus the message from
  `validate`, linked by `aria-describedby`) and `status` (the polite region
  that says Saved once, or the message once on a failed save). FieldError
  (1.4.3) is in lane 2A, so the message part is local; it can become a
  FieldError root carrying `data-part="error"` once that lands.
- Display name: the shown text first, then the edit label ("Spring launch,
  Edit board name"), so voice control works (2.5.3).
- Leaving the editor (Tab, a click elsewhere) saves a changed valid value,
  closes an unchanged one without a check, and leaves focus where it went;
  a changed invalid value keeps the editor open with its message.
- An outside check (`invalid` with `error`) shows its message under the
  display or the editor, linked to both by `aria-describedby`, so the state
  is never color alone (1.4.1, 3.3.1). Save and cancel prevent default on mousedown, so a press never
  reads as leaving (also in Safari, where buttons do not take focus).
- Escape cancels through the same window capture listener as SearchField,
  so a Dialog around the editor stays open (tested).
- Enter, Escape, save and cancel return focus to the display. Focus moves
  only when the editing state changes, so StrictMode double effects and
  `defaultEditing` never steal focus on load.
- The display takes the Input's inline padding per size, so the text does
  not move when the editor opens. The edit icon fades in on hover and focus.
- Motion `fade`.

## Token gaps

None. Every value comes from an existing token.

## Review findings

### Fixed

InputGroup: stale RTL screenshot (retaken, `https://` is at the left in the
ltr URL groups); `accepts` listed components not yet styled (PasswordField
was added back once built, with ring overrides for both composites); invalid
color missing on the add on side of the seam; xs add on padding now follows
Input's end radius rule; long add on squeezing the control at 320px; private
names `--_input-group-bg` and `--_input-group-fg`; read only state mirrored;
duplicate group and control names in the demo; tests for read only and a
SearchField child.

SearchField: the spinner replaced a focused end button (focus loss); IME
Escape and Enter; `aria-busy` dropped; forced colors spinner colors;
`appearance: none` on the control; Arabic "جاري البحث"; `Kbd` removed from
`slots.end.accepts` until it exists.

PasswordField: Edge's reveal eye hidden; double dim of the disabled toggle;
motion `fade`; `accessibilityRole` removed; `flushSync` on submit; tests for
read only, a custom id, and controlled submit.

InlineEdit: Escape closed a Dialog around the editor (now handled in a
window capture listener, as in SearchField, which had the same bug); an
outside `invalid` was color alone (new `error` prop, shown in both states);
the display text was bold and reflowed into the regular editor; the
display's hover and active colors now follow its own; the edit icon shows on
touch screens; blur on an unchanged value closes without a check; a stable
`inputRef`; manifest focus text and notes; tests for the Dialog, the outside
message, a second Saved and IME Enter.

### Left open

- `--_search-field-padding-end` and `--_password-field-padding-end` are not
  in the private names list of anatomy.md rule 1. They hold the smaller end
  inset beside a button. See "Changes needed from the lead".
- Two elements carry `data-part="control"` in SearchField and PasswordField
  (the nested Input root, owned by the composite, and the native input,
  owned by Input). This follows the ownership rule; noted in the manifest.
- At xs the 24px clear and toggle buttons sit in a 24px box with 1px
  borders, so they overlap the border by 1px. Targets pass; accepted.
- PasswordField `insteadUse` points to OTPField (order 1.2.9, lane 2D), which
  has no manifest yet. The validator accepts it.
- InputGroup decides parts by elimination, so a wrapper child is read as the
  control. Documented; an explicit marker would need a change in Button.
- InlineEdit: a long English value in an Arabic page is cut at the start by
  the ellipsis (the Button label runs in the page direction). Pass `dir` on
  the root for such values; Button's label part has no bidi isolation.
- InlineEdit: the default edit label lower cases the label and is English;
  the manifest says to pass `editLabel` in other languages.
- English demo values in the rtl screenshots show the full stop on the left.
  That is the demo content in an rtl page, not the component.

## Changes needed from the lead

1. `docs/contracts/anatomy.md`, "One convention", rule 1, the list of
   private names: add `padding-end` (the end inset when a button sits at the
   end of a text box). Used by SearchField.css and PasswordField.css.
2. `packages/manifest/src/component/Field.manifest.json` (owned by lane 2A,
   order 1.2.1): `slots.root.accepts` should list InputGroup, SearchField
   and PasswordField (the order already names them).
3. When CloseButton (1.1.9) lands: in `SearchField.tsx`, replace the clear
   `IconButton` with `CloseButton` carrying `data-part="clear"`, and remove
   the last note in the SearchField manifest `a11y.notes`.
4. When FieldError (1.4.3) lands: InlineEdit's `error` part can render a
   FieldError root carrying `data-part="error"`.
5. The motion ids `fade` (Input, PasswordField, InlineEdit) is not in the
   order 1.11 list. If the catalog test rejects it, add `fade` to the
   catalog or map these to `fade-rise`.

## Not done

- No Angular or native work (out of scope; manifests say `planned`).
- The `too-many` and `loading` cases were left out where they do not apply:
  PasswordField has no list or loading state, InlineEdit has no loading state
  and no `readonly` (a read only value is plain text), and SearchField has
  no `too-many` list of its own beyond the narrow container case.
- Sources: Figma-Killer-2 was cloned and read (`SearchBar/`, `VariableField/`,
  `Input/`). GoBanana was not fetched; the Input look comes from Input.css,
  which was built from it.
