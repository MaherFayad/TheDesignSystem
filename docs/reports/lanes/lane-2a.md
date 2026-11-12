# Lane 2A: Field family

Branch `claude/ds-lane-2a`. Orders, in the order built: 1.2.2 Label, 1.4.3
FieldError, 1.2.1 Field bring up, 1.2.4 Textarea. All four are done.

| Order | Commit | Contract (react) |
| --- | --- | --- |
| 1.2.2 Label | `wo-1.2.2: label` | 21 passed |
| 1.4.3 FieldError | `wo-1.4.3: field error` | 20 passed, 1 skipped (no keys to check) |
| 1.2.1 Field bring up | `wo-1.2.1: field bring up` | 21 passed |
| 1.2.4 Textarea | `wo-1.2.4: textarea` | 21 passed |

`npm run check` is green on the branch head. Screenshots (studio dark and
light, desk dark and light, desk dark rtl ar) are in
`docs/reports/shots/wave-1/{label,field-error,field,textarea}/`.

## Setup notes

- `npm run check` was green before any change.
- GoBanana could not be attached to this session (the add_repo call was
  refused). Label, FieldError and Textarea are designed from Figma-Killer-2
  `FormField/` and from the wave 0 Field and Input, which were built from
  GoBanana `.st-input`. Each CSS header says so. GoBanana `.st-alert` and the
  takedown form were not read.
- Figma-Killer-2 was cloned read only. Nothing under `vendor/alm-design-system`
  was read.

## 1.2.2 Label

A native label on Radix Label. Alone it names a Switch, a Checkbox or a
Slider through `htmlFor`, or the control it wraps. Inside a Field it is the
`label` part (`data-ds="label" data-part="label"`).

```ts
export type LabelSize = 'sm' | 'md';
export interface LabelProps extends Omit<ComponentProps<'label'>, 'title'> {
  size?: LabelSize;            // default 'md'
  required?: boolean;          // inside a Field: follows the Field
  requiredText?: string;       // default 'required', 'مطلوب' under an Arabic Theme
  optional?: ReactNode;        // text after the label, never with required
  disabled?: boolean;          // inside a Field: follows the Field
  invalid?: boolean;           // inside a Field: follows the Field
  children?: ReactNode;
}
```

Decisions:

- Required is never a lone asterisk. The asterisk is always aria-hidden.
  Inside a required Field the control carries aria-required. Anywhere else
  (alone, or a required Label inside a Field that is not required) a
  visually hidden word joins the name: "Email required". The word follows
  the nearest Theme's language and can be replaced with `requiredText`.
- The hidden word uses Radix `VisuallyHidden`, as Toaster does.
- Optional text is separated by a real space in the markup, so the name
  reads "Company Optional".
- `invalid` draws nothing in the base: the control border and FieldError
  carry it. The attribute is there for recipes.
- At size sm, Arabic takes font.size.s, because base.css raises only s for
  Arabic and PLAN.md section 12 asks small Arabic text one step up.
- No motion key: nothing moves (same as Link).
- The Field context moved to `Field/context.ts` so Label and FieldError read
  it without importing Field, which renders them. `useField` is still
  exported from Field.

## 1.4.3 FieldError

```ts
export type FieldErrorSize = 'sm' | 'md';
export interface FieldErrorProps extends Omit<ComponentProps<'p'>, 'title'> {
  size?: FieldErrorSize;   // default 'md'
  children?: ReactNode;    // the message; nothing renders when empty
}
```

Anatomy: root `p[data-ds="field-error"]`, `icon` (the danger Icon, aria-hidden),
`message`. Inside a Field it also carries `data-part="error"`, takes the
Field's error id (an id passed in does not win there, so aria-describedby
always finds it), registers with the Field and is hidden by
`invalid={false}`. Alone, the caller points aria-describedby at its id and
sets aria-invalid. Never role alert, never a live region (same rule as the
wave 0 Field). An empty string now renders nothing; the wave 0 FieldError
rendered an empty line for it. sm in Arabic takes font.size.s, as in Label.

## 1.2.1 Field bring up

- `FieldLabel` renders the system `Label` with `data-part="label"`, the
  Field's label id and `htmlFor`. `FieldError` is the FieldError component,
  re-exported from Field so every Field export keeps working:
  `Field, FieldDescription, FieldError, FieldLabel, useField,
  useFieldControl` and their types. `useFieldControl()` is unchanged.
- Every existing Field test passes unchanged. New tests were added only.
- Field.css lost the label typography and the error styles (now in
  Label.css and FieldError.css). It passes its colors to the Label through
  `--_label-fg` and `--_label-fg-disabled`, so a `Label disabled={false}`
  inside a disabled Field stays at full color.
- Screenshots unchanged: the Field page was shot before the change
  (`docs/reports/shots/wave-1/field/before/`) and after
  (`docs/reports/shots/wave-1/field/`). A pixel compare of all five pairs
  found 0 differing pixels.
- Manifest: `slots.root.accepts` lists the 18 controls of batches 2 and 3.
  `insteadUse` already pointed a group of choices to Fieldset.
- Decision, against the order text: `required` left Field's anatomy. The
  mark now sits inside the Label root, and anatomy.md says a part of a
  nested component belongs to that component's manifest (the contract suite
  would fail it otherwise). Label's manifest lists `required`.

## 1.2.4 Textarea

```ts
export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg';
export type TextareaShape = 'default';
export interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'title' | 'ref' | 'className' | 'style' | 'maxLength'> {
  size?: TextareaSize;          // default 'md'
  shape?: TextareaShape;        // default 'default'
  invalid?: boolean;            // always true past the limit
  rows?: number;                // default 3, the floor
  maxRows?: number;             // the cap, none by default
  autoHeight?: boolean;         // default true
  limit?: number;               // count limit, never truncates
  showCount?: boolean;          // default true when limit is set
  countMessage?: (left: number) => string;
  className?: string;           // root
  style?: CSSProperties;        // root
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  ref?: Ref<HTMLTextAreaElement>; // the textarea
}
```

Decisions:

- Same root and control split as Input: the bordered box is the root, the
  native textarea is `control` and gets the ref and every native prop. It
  reads the Field through `useFieldControl()`.
- Radius is radius.field (8px in every style) because radius.control is a
  pill in Studio and Desk, and a pill never wraps lines.
- Auto height: `field-sizing: content` with a floor of `rows` lines and a
  cap of `maxRows` lines, in the line height of the text
  (`font size * font.leading.normal`, which base.css swaps for Arabic). The
  `lh` unit was refused by the raw value gate. Where `field-sizing` is not
  supported, a script sets the height from scrollHeight on input.
  `autoHeight={false}` keeps rows lines with a vertical resize handle; the
  root then lacks `data-auto-height`, a state attribute listed in the
  manifest.
- The count: `length/limit`, code points (an emoji counts as one), digits
  left to right at the inline end. It joins aria-describedby. There is no
  native maxlength, so a paste is never cut. Past the limit: `data-over`,
  `aria-invalid`, danger count.
- Announcement: a polite visually hidden live region. Its text changes only
  when the zone changes: entering the near zone (the last tenth, at least
  the last 10 characters) says "9 characters left", going past says "3
  characters over the limit", going back under clears it. Arabic under an
  Arabic Theme ("باقي 5 حروف", "زاد حرفين عن الحد"), or `countMessage`.
- A press anywhere in the box focuses the textarea, as in Input.
- Motion: `fade`, the same focus glow fade as Input. The 1.11 catalog list
  has no `fade` id; Input names it too, so the two move together when 1.11
  lands.

## Review findings

One fresh eyes review per component (ds-qa, claude-opus-5-5, medium).

Fixed:

- Label: a required Label inside a Field that is not required showed a lone
  asterisk. Now the hidden word shows unless the Field is required.
- Label and FieldError: Arabic small text one step up at sm.
- Label: hand written visually hidden CSS replaced by Radix VisuallyHidden;
  `--_label-mark-fg` renamed `--_label-fg-muted`; an unused token dropped
  from the manifest; the demo no longer sets aria-required next to a
  required Label (read twice); a test for a wrapped control.
- Field: Label color plumbing (above). FieldError id inside a Field.
- FieldError: manifest role wording, insteadUse points at Field's
  description prop, demo long messages now say how to fix the value, a
  forced colors rule that did nothing removed.
- Textarea: see the Textarea round below.

Left open (notes, not blockers):

- Field's manifest still lists `parts.FieldError: "error"` although
  FieldError has its own manifest. Kept, because Field renders it from the
  error prop. A generator that lists parts may show it twice.
- Some Label review fixes landed in the `wo-1.2.1` commit, since they were
  made after `wo-1.2.2` was committed.

## Changes needed from the lead

1. Regenerate the barrels on merge (`npm run gen`). The branch's last commit
   carries the generated files as they were here; they also hold other
   lanes' entries that were not regenerated on the base branch
   (ButtonGroup, DropdownMenu, Link, the Desk DropdownMenu recipe import).
2. `docs/plan/wave-1-batch-2.md`, order 1.2.1, Anatomy line. Before:
   "Anatomy: unchanged: root, `label` (...), `required`, `description`,
   `error` (...)". After: "Anatomy: root, `label` (a Label root carrying
   `data-part="label"`), `description`, `error` (a FieldError root carrying
   `data-part="error"`). The required mark is Label's part." And a
   DECISIONS.md line for it.
3. Order 1.11 (motion catalog): Input and Textarea name `fade`, which is not
   in the 18 ids. Either add `fade` (an opacity fade of the focus glow) or
   name the id they should use.

## Could not do

- Read GoBanana (see setup notes).
