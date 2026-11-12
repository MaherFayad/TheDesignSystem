# Lane 3A: checks and sliders

Branch `claude/ds-lane-3a`. Orders 1.3.1 Checkbox, 1.3.2 CheckboxGroup, 1.3.5
Switch, 1.3.12 Slider, 1.3.13 RangeSlider, all built in that order. One
commit per component, each pushed.

For every component:

- `npm run check` is green.
- `npm run contract -- --framework react --component <Name>` passes 21 of 21.
- Screenshots are in `docs/reports/shots/wave-1/<slug>/`: studio dark,
  studio light, desk dark, desk light, and desk dark rtl ar. I read each
  set and fixed what looked wrong.
- One fresh eyes review ran on each, by a ds-qa subagent on
  claude-opus-5-5 at medium.

The `ds/contrast` gate still prints its 8 known failures, as it did before
this lane. It does not fail the check.

Sources: Figma-Killer-2 was cloned and read (`Checkbox/`, `Switch/`).
GoBanana could not be fetched in this session. Where an order named a
GoBanana file (TakedownForm, TelemetrySwitch), I designed from FK2, the dials
table in PLAN.md 3.7 and the closest existing component (Field, Input). The
CSS headers say so.

## Checkbox (wo-1.3.1)

Radix Checkbox. The root `div[data-ds=checkbox]` holds:

- `control`: the Radix button with role checkbox, a 24px target. At lg it is
  the lg control height.
- `indicator`: the visible 16px box with a check or a minus glyph.
- `label`: a native label bound to the control.
- `description`: joins aria-describedby.

```ts
interface CheckboxProps extends Radix Checkbox.Root props (minus className, style, children, title, asChild, ref, value) {
  size?: 'sm' | 'md' | 'lg';              // box 12, 16, 24 px; default md
  tone?: 'neutral' | 'accent' | 'danger'; // default neutral
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean | 'indeterminate'; // default false
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  label?: ReactNode;
  description?: ReactNode;
  value?: string;          // inside a CheckboxGroup: the value it adds
  invalid?: boolean; disabled?: boolean; readOnly?: boolean; required?: boolean;
  className?: string; style?: CSSProperties;
  rootProps?: ComponentProps<'div'>;
  ref?: Ref<HTMLButtonElement>; // the control
}
```

Decisions:

- The order says `control` is "the box". I made the control the 24px target
  and the indicator the drawn 16px box, so the box sits inside a 24px target
  (the order's acceptance line) with no second hit layer.
- Read only is not part of Radix. Clicks are prevented (Space is a click), the
  control gets `aria-readonly`, and the box draws dashed with a quiet fill.
- It joins a Field through `useFieldControl()`, as Input does. Group wiring
  lives in `Checkbox/group-context.ts`, which CheckboxGroup provides.
- Checked uses the tone fill with a contrasting glyph. neutral is the text
  color on the body color (FK2). accent is `color.primary.fill` with
  `text.on-primary`: a quiet overlay in Studio, yellow in Desk.

## CheckboxGroup (wo-1.3.2)

A native fieldset, hand built on Checkbox. Parts:

- `legend`.
- `description`.
- `items`.
- `select-all`: an optional Checkbox root that carries the group's part.
- `error`.

```ts
interface CheckboxGroupProps extends fieldset props (minus title, defaultValue, onChange, disabled) {
  legend: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  value?: readonly string[];
  defaultValue?: readonly string[];      // default []
  onValueChange?: (value: string[]) => void;
  size?: 'sm' | 'md' | 'lg';             // default md, passed to items
  orientation?: 'vertical' | 'horizontal'; // default vertical
  name?: string; disabled?: boolean; invalid?: boolean; readOnly?: boolean;
  selectAll?: ReactNode;                 // label of the select all item
}
```

Decisions:

- Items are `<Checkbox value=...>` children. Each one registers its value, so
  select all knows the full set. Select all is indeterminate when some items
  are checked.
- The group manifest lists `checked`, `unchecked` and `indeterminate`. The
  contract suite reads the select-all part's `data-state` against the group.
- The error is the group's own `p[data-part=error]` with the Field error
  look. It is not a FieldError: FieldError needs a Field context for its id.
  The order says "a FieldError root". See the open items.

## Switch (wo-1.3.5)

Radix Switch. Parts:

- `control`: the 24px target button. Added to the order's anatomy.
- `track`, with `thumb` inside it.
- `label`.
- `state-text`: optional On and Off words, aria-hidden, rendered inside the
  label so they follow its last line.
- `description`.

```ts
interface SwitchProps extends Radix Switch.Root props (minus className, style, children, title, asChild, ref) {
  size?: 'sm' | 'md' | 'lg';   // track 16, 24, 32 px high; default md
  tone?: 'accent';
  checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode; description?: ReactNode;
  stateText?: { on: ReactNode; off: ReactNode };
  invalid?: boolean; disabled?: boolean; readOnly?: boolean; required?: boolean;
  className?: string; style?: CSSProperties; rootProps?: ComponentProps<'div'>;
  ref?: Ref<HTMLButtonElement>;
}
```

Decisions:

- The `control` part exists so a 16px sm track still meets WCAG 2.5.8.
- The state shows in two ways that do not depend on color:
  - the thumb moves to the inline end, with transform only and a
    `--_switch-dir` of -1 under `:dir(rtl)`;
  - the track fills.
- `insteadUse` points a form value that saves later to Checkbox.
- Track size comes from the size tokens (icon md and lg, control md), and
  the width is 1.75 times the height. The FK2 values (38 by 22) have no
  tokens.

## Slider (wo-1.3.12)

Radix Slider. Parts:

- `label`.
- `value`: an aria-hidden output.
- `control`: the Radix root. Added to the order's anatomy.
- `track`, `range` and `thumb`.
- `marks`.

```ts
interface SliderProps extends Radix Slider.Root props (minus value handlers, dir, inverted, className, style, children, title, asChild, ref) {
  size?: 'sm' | 'md' | 'lg';  // thumb 12, 16, 24 px in a target of at least 24 px; default md
  tone?: 'accent';
  value?: number; defaultValue?: number;   // default min
  onValueChange?: (value: number) => void; // every change
  onValueCommit?: (value: number) => void; // drag end or key
  min?: number; max?: number; step?: number; orientation?: 'horizontal' | 'vertical';
  label?: ReactNode; showValue?: boolean; unit?: string;
  formatOptions?: Intl.NumberFormatOptions; formatValue?: (v: number) => string;
  marks?: (number | { value: number; label?: ReactNode })[]; // horizontal only
  invalid?: boolean; disabled?: boolean; 'aria-label'?: string;
  className?: string; style?: CSSProperties; rootProps?: ComponentProps<'div'>;
  ref?: Ref<HTMLSpanElement>; // the thumb
}
```

Decisions:

- The thumb is its own target, at least 24px. The drawn circle is its
  content box (`background-clip`). `::before` is the focus glow. `::after`
  draws the circle's edge, because Slider has no hover veil.
- `aria-valuetext` carries the formatted value with its unit, in Western
  digits. `packages/shared/src/number.ts` does not exist yet (the NumberField
  order owns it), so `Slider/format.ts` is a private stand-in.
- The track is inset by half a target, so the range ends exactly at the
  thumb centers, which Radix keeps half a thumb from the ends. Marks use
  the same inset.
- How the thumb gets its name:
  - the visible label, through aria-labelledby;
  - else `aria-label`;
  - else, inside a Field, the Field label. A Field label's `for` cannot reach
    a span.
- Disabled dims the control and the marks only. The label and value stay
  readable; axe failed the dimmed value text.
- `data-dragging` is set on pointer down. It clears on commit or on lost
  pointer capture.

## RangeSlider (wo-1.3.13)

Built on `SliderBase` from the Slider folder. Slider.css styles both roots
(anatomy rule 10). RangeSlider.css only isolates the value pair. The thumbs
carry `data-thumb="start"` and `data-thumb="end"`.

```ts
interface RangeSliderProps extends SliderBaseProps (minus aria-label, aria-labelledby) {
  value?: [number, number]; defaultValue?: [number, number]; // default [min, max]
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  thumbLabels: [string, string];   // required: "Minimum price", "Maximum price"
  minStepsBetweenThumbs?: number;  // default 1
  ref?: Ref<HTMLSpanElement>;      // the start thumb
}
```

Decisions:

- The thumbs never cross. Keys stop `minStepsBetweenThumbs` steps short of
  the other thumb, and a drag stops at it (`preserveThumbOrder`).
- Radix sends Home to the start thumb and End to the end thumb, whichever has
  focus. SliderBase intercepts both keys, so they move the focused thumb as
  far as the other allows.
- With a label, the root is `role="group"` named by it. Each thumb keeps its
  own name.
- Each value in the visible pair is a `bdi`, so "200 SAR" keeps its order on
  an Arabic page.

## Review findings

Fixed:

- Checkbox:
  - The Arabic label used a verb form; it now uses a noun form.
  - The error case had no message; it now uses a Field with an error.
  - Read only set the box fill and wrote `border-style` directly; both now go
    through private properties.
  - Copy notes and test gaps: indeterminate then click, label click while read
    only.
  - The lg target wording now says 40 to 48 px.
  - `name` and `id` are in the manifest.
- CheckboxGroup:
  - Select all did not show invalid; it does now.
  - The column gap is a private property.
  - The select all copy follows the manifest rule.
  - "اختر" became the dialect form "اختار".
  - A Space key test was added.
- Switch:
  - The forced colors focus outline moved to the track.
  - A disabled thumb draws in GrayText in forced colors.
  - Invalid shows while on too.
  - Read only uses a stronger fill (overlay 40).
  - The header lists every private property.
  - The demo no longer uses state words as labels, and the Arabic error copy
    was reworded.
- Slider:
  - A Slider inside a Field label had no name.
  - In forced colors the focus outline sat flush on the thumb.
  - The pseudo element roles now follow the convention.
  - Marks are horizontal only, and `inverted` is not accepted.
  - Disabled swaps a private property, and the disabled range draws in
    GrayText in forced colors.
  - The value is isolated.
  - Tests cover PageDown, ArrowDown, formatValue, the Field label and
    vertical marks.
- RangeSlider:
  - Home and End now move the focused thumb (blocker), and the End contract
    hint is fixed (blocker).
  - Drags stop at the other thumb (`preserveThumbOrder`).
  - The root is a labelled group.
  - `aria-label` is not accepted on the root.
  - The range overshot the thumbs at the ends.
  - The manifest texts for `name` and `rootProps` were corrected.
  - The thumb names, the demo gap and the Arabic label were reworded.

Left open (notes, not blockers):

- CheckboxGroup:
  - Select all also checks items that are disabled on their own.
  - On the server, select all renders unchecked until the items register.
  - Inside a Field, every item gets the Field's control id.
  - A horizontal select all is not indented.
- Checkbox: inside a group, `checked` and `defaultChecked` are ignored. The
  JSDoc says so; there is no dev warning.
- Slider:
  - The labels of the first and last marks can stick out past the root by
    half their width.
  - Track thickness is a border width token times 2 or 3.
- RangeSlider: `thumbLabels` are accessible names only, but rule 7 of
  anatomy.md says `label` means visible text. Rename to `thumbNames`, or
  record the exception.
- Not every edge case has a test: form submission, disabled select all, and
  the RTL arrows on RangeSlider. The RTL arrows are covered on Slider.

## Token gaps

- No pattern in the motion catalog fits these controls: a check glyph, a
  thumb that slides, a focus ring that fades. Every manifest names `fade`, as
  Input does. Proposal for order 1.11: add `toggle` (thumb translate and
  glyph fade, with an opacity only reduced form). Switch would then name it.
- Switch and Slider have no component tokens for track size. Sizes come from
  `size.icon.*`, `size.control.md` and `border.width.strong` times 2 or 3.
  Proposal: `switch.track.height.{sm,md,lg}` and
  `slider.track.thickness.{sm,md,lg}`.
- The checkbox box sizes reuse `size.icon.*`. Proposal:
  `checkbox.box.{sm,md,lg}`.

## Changes needed from the lead

1. `docs/plan/wave-1-batch-3.md`:
   - 1.3.5 Switch and 1.3.12 Slider: add `control` to the anatomy, for the
     reasons above.
   - 1.3.1 Checkbox: change "`control` (the box)" to "`control` (the 24px
     target)" and "`indicator` (check or minus icon)" to "`indicator` (the
     box with the check or minus glyph)".
2. 1.3.2 CheckboxGroup says the error is "a FieldError root". Either accept
   the group's own error part, or have FieldError take an `id` without a
   Field context (a change to `Field.tsx`, which this lane does not own).
3. When 1.11 lands, decide on a `toggle` pattern and update the `motion` of
   Checkbox, Switch, Slider and RangeSlider.
4. When `packages/shared/src/number.ts` lands, replace
   `Slider/format.ts` with `formatNumber`. Keep Western digits and the unit
   rule: symbols and px join the number; words get a space.
5. Regenerate on merge. Each commit carries the `npm run gen` output from its
   own tree: the barrels, `index.css`, `manifests.gen.json` and
   `routes.gen.ts`.

## What I could not do

- GoBanana was not available, so `TakedownForm.tsx`, `TelemetrySwitch.tsx`
  and the GB css lines were not read.
- I took no Neutral screenshots: that style is not in this checkout. All
  colors and sizes come from tokens, so Neutral applies once it lands.
- Angular and native stay `planned` in every manifest.
