# Lane 2C report: Numbers (NumberField, ScrubInput)

Status: done. Both components are built, each reviewed once by a fresh eyes
subagent, every blocker is fixed, and both are green.

Branch: `claude/ds-lane-2c`.

| Order | Component | Commits | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.2.5 | NumberField | `wo-1.2.5: NumberField` | green | 29 passed, 0 failed |
| 1.2.6 | ScrubInput | `wo-1.2.6: ScrubInput`, `wo-1.2.6: ScrubInput review fixes` | green | 29 passed, 0 failed |

Screenshots are in `docs/reports/shots/wave-1/number-field/` and
`docs/reports/shots/wave-1/scrub-input/`. Each folder has studio dark, studio
light, desk dark, desk light and desk dark rtl ar.

Sources:

- Figma-Killer-2 `ScrubInput/` was cloned and read: `numericExpression.ts`,
  `scrubMath.ts`, `useScrubDrag.ts`, `ScrubInput.tsx`, the CSS and the tests.
- GoBanana was not added to this session. The NumberField box follows GB
  `.st-input` through Input.css. The ScrubInput fill comes from the
  `inspector.*` tokens. The Arabic copy follows the rules in AGENTS.md; the
  cookbook was not read.

Generated files are committed as `npm run gen` wrote them:

- `packages/react/src/index.ts`
- `packages/css/src/index.css`
- `packages/shared/src/index.ts`
- `packages/manifest/manifests.gen.json`
- `apps/gallery-react/src/routes.gen.ts`

Regenerate them on merge.

No new package. `react-aria-components@1.22.1` is used only in NumberField.

## 1.2.5 NumberField

Files:

- `packages/react/src/components/NumberField/` (`NumberField.tsx`,
  `NumberField.test.tsx`, `NumberField.demo.tsx`, `index.ts`)
- `packages/css/src/components/NumberField.css`
- `packages/manifest/src/component/NumberField.manifest.json`
- `packages/shared/src/number.ts`, `number.test.ts`

```ts
type NumberFieldSize = 'xs' | 'sm' | 'md' | 'lg';
type NumberFieldShape = 'default' | 'pill';
interface NumberFieldProps extends NativeInputProps {
  value?: number | null;           // controlled; null is empty
  defaultValue?: number | null;
  onChange?: (value: number | null) => void; // committed: step, blur, Enter
  min?: number;
  max?: number;
  step?: number;                   // React Aria default (1, or 0.01 for percent)
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;                 // default Theme lang, always with -u-nu-latn
  size?: NumberFieldSize;          // default md
  shape?: NumberFieldShape;        // default default
  invalid?: boolean; disabled?: boolean; readOnly?: boolean; required?: boolean;
  steppers?: boolean;              // default true; hidden while read only
  incrementLabel?: string;
  decrementLabel?: string;
  start?: IconName | string | ReactNode;
  end?: IconName | string | ReactNode;
  className?: string; style?: CSSProperties; rootProps?: DivProps;
  ref?: Ref<HTMLInputElement>;     // the native input
}
```

Shared `number.ts`:

- `formatNumber(value, locale?, options?)`
- `parseNumber(text, locale?)`
- `clamp(value, min?, max?)`
- `snapToStep(value, step, min?, max?)`
- `latinLocale(locale)`
- `numberSeparators(locale)`
- `decimalPlaces(n)`
- `roundTo(n, places)`
- the Arabic mark constants

It reuses `toLatinDigits` from `otp.ts` and does not define a second copy.

Decisions:

- **How React Aria is used.** React Aria's `render` prop is used on
  NumberField, Input and Button. Every element in the DOM is ours: the root
  div, the native input, and system IconButtons for the steppers. We drop
  React Aria's class, `data-rac` and its boolean `data-*="true"`
  attributes, and stamp our own empty-valued states.
- **Stepper layout.** Decrement sits at the inline start and increment at
  the inline end, so the order mirrors in RTL. The steppers are 24px
  IconButtons (32px at lg), so each one is a full WCAG 2.5.8 target. I did
  not use stacked chevrons, because two of them do not fit 24px each in a
  32px box.
- **Western digits.** React Aria gets `ar-u-nu-latn`, so digits stay
  Western. Arabic Indic digits and the Arabic marks become Western as they
  are typed or pasted. React Aria refuses those digits in its own native
  `beforeinput` listener, so our capture-phase listener on the root inserts
  the Western text first. This was checked in Chromium: typing `١٢٫٥` gives
  `12.5`, and pasting `٣٤` gives `34`.
- **PageUp and PageDown.** They move ten steps. React Aria moves one, so we
  handle these two keys ourselves. A caller's `onKeyDown` does not receive
  them, and the manifest says so.
- **Validation.** We use `validationBehavior="aria"`, so the control gets
  `aria-required` and never native `required` (the Field convention).
- **Inside a Field.** The steppers are named "Increase" plus the Field
  label, through `aria-labelledby`. React Aria did not do this when it got
  `aria-labelledby`; a DOM dump showed the buttons named only "Increase".
- **Mouse wheel.** It never changes the value: React Aria's group props are
  not on the root, so its focus-within state stays false. The manifest says
  so.
- **Motion.** `none`. Only the focus glow fades.

Review findings fixed:

- Blocker: Arabic Indic digits could not be typed in a real browser.
- Blocker: PageUp used step 1 on a percent field.
- Note: committing at a bound passed the number through `String()`.
- Note: there was no validation commit after PageUp and PageDown.
- Note: from an empty field, PageUp and PageDown now start at the bound, as
  React Aria does.
- Note: the manifest's wheel claim was wrong.
- Note: the xs inset is now explained in a comment.
- Note: tests added for percent PageUp and for a controlled value through a
  step.

Review findings left open:

- **Not changed: the "dead code" note on stepper naming.** The reviewer
  called it dead code. A DOM dump shows it is needed.
- **Not changed: the root is not `role="group"`.** This matches Input and
  keeps the wheel off.
- **Open: the end unit sits away from the value.** The control fills the
  row, so `px` is pushed to the far end. This matches Input's end
  adornment. If Input changes, change both.

## 1.2.6 ScrubInput

Files:

- `packages/react/src/components/ScrubInput/` (`ScrubInput.tsx`,
  `ScrubInput.test.tsx`, `ScrubInput.demo.tsx`, `index.ts`)
- `packages/css/src/components/ScrubInput.css`
- `packages/manifest/src/component/ScrubInput.manifest.json`
- `packages/shared/src/scrub.ts`, `scrub.test.ts`

```ts
type ScrubInputSize = 'xs' | 'sm' | 'md';
interface ScrubInputProps extends NativeInputProps {
  label: IconName | string | ReactNode; // the scrub handle, aria-hidden
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number) => void;     // every pixel of a drag, each nudge, a commit
  onChangeEnd?: (value: number) => void;  // once per gesture
  min?: number;
  max?: number;
  step?: number;                          // default 1; Shift x10, Alt x0.1
  precision?: number;                     // default 2
  unit?: string;                          // shown; a typed unit must match or be absent
  mixed?: boolean;
  mixedLabel?: string;                    // default "Mixed"
  size?: ScrubInputSize;                  // default md
  invalid?: boolean; disabled?: boolean; readOnly?: boolean; required?: boolean;
  className?: string; style?: CSSProperties; rootProps?: DivProps;
  ref?: Ref<HTMLInputElement>;
}
```

Shared `scrub.ts`:

- `evaluateExpression`
- `resolveCommit`
- `nudgeStepFor`
- `nudgeValue`
- `scrubValue`
- `formatScrub`
- `SHIFT_FACTOR`
- `FINE_FACTOR`

Decisions:

- **Values are numbers, not CSS strings.** The unit is a display part.
  FK2's keywords (`auto`, `fill`, `hug`) and `parseScrubValue` are not part
  of this field, so their tests were dropped. FK2's `onPreview` and rAF
  preview tests were dropped too: `onChange` per pixel plus `onChangeEnd`
  per gesture replaces that channel. Every other math test from
  `numericExpression.test.ts` and `scrubMath.test.ts` is ported to
  `scrub.test.ts`. The release test ("never drops the final value") is
  ported to `ScrubInput.test.tsx`.
- **Steps scale with `step`.** Shift moves ten steps and Alt a tenth of a
  step. FK2 used fixed values of 10 and 0.1.
- **What typing accepts.** The `×` and `÷` signs, the minus sign, Arabic
  Indic digits, the Arabic decimal mark, and `°` as a unit.
- **The handle.** It is an aria-hidden span, a pointer-only shortcut. The
  arrow keys on the input are its key path (WCAG 2.5.7). A press with no
  move focuses the input and selects its text, read only too.
- **RTL.** The drag direction flips. The handle's `ew-resize` cursor points
  both ways, so it needs no flip.
- **Escape.** It reverts the typed text and keeps focus (FK2 blurs). With
  nothing typed, Escape goes on to the parent.
- **State lists.** `data-readonly` is listed under states besides the
  order's four, because every text control reads the Field's read only
  state.
- **Disabled contrast.** The root gets `aria-disabled` while disabled, so
  axe treats the unit text as part of an inactive component (WCAG 1.4.3).
- **Mixed placeholder.** The mixed word is italic for Latin scripts only.
  Arabic has no italic.
- **Motion.** `none`.

Review findings fixed:

- Blocker: the arrow keys did nothing on an empty field.
- Blocker: hover replaced the fill. It is now the `::after` veil.
- Note: `onChangeEnd` added.
- Note: the release value now comes from the pointerup position.
- Note: a drag compares against the last value it sent, not the render's
  value.
- Note: a mixed drag no longer shows the dragging ring.
- Note: a press on a read only field focuses the input.
- Note: read only plus invalid keeps the red border.
- Note: the manifest lists `aria-label` and `placeholder`.

Review findings left open (notes):

- Changing Shift or Alt mid-drag rescales the whole drag. FK2 does the same.
- Escape does not cancel a drag.
- Long values clip with no ellipsis, as in Input.
- "متعدد" could read "قيم مختلفة". This is a wording preference.

## Token gaps

None. ScrubInput uses `inspector.field.bg`, `inspector.field.bg-hover` and
`inspector.field.radius`.

## Changes needed from the lead

- Gallery wide, not this lane: English demo copy inside an RTL page puts the
  final period on the wrong side (".more"). The DemoCase or gallery shell
  could isolate English strings with `dir="auto"` or `<bdi>`.
- None in other components' files.

## What I could not do

- Read the GoBanana Arabic copy cookbook. The repo was not added to this
  session.
