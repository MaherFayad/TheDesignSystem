# Lane 2D (Codes): report

Branch `claude/ds-lane-2d`. Batch file `docs/plan/wave-1-batch-2.md`.

| Order | Component | Commit | Check | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.2.9 | OTPField | `wo-1.2.9: OTPField` | green | 21 passed (with the slug fix below) |
| 1.2.10 | PhoneField | `wo-1.2.10: PhoneField`, then `wo-1.2.10: PhoneField review fixes` | green | 21 passed |

Both are hand built. No dependency added. No file outside the lane's owned
set was edited by hand; the generated files were refreshed with `npm run gen`.

## Changes needed from the lead

1. **Route slug for acronym names.** `scripts/gen-index.ts` line 127 builds
   the gallery slug with one regex, so `OTPField` becomes `otpfield`. The
   contract suite (`packages/contract-tests/src/lib.ts` `kebabCase`) and
   `data-ds` use `otp-field`, so the contract skips OTPField with "no
   gallery route". Change line 127:

   ```ts
   // before
   const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
   // after
   const slug = name
     .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
     .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
     .toLowerCase();
   ```

   Then `npm run gen`. I patched `routes.gen.ts` locally only to run the
   contract and the screenshots; the committed `routes.gen.ts` is the
   generator's output (`otpfield`).
2. **Private property names.** `anatomy.md` lists the private names
   `height`, `padding-inline`, `gap`, `font-size`, `radius`, `bg`, `fg`,
   `border-color`, `ring` with state suffixes. These lanes also use
   `--_otp-field-border-color-invalid` (as Input does),
   `--_otp-field-separator-color`, `--_phone-field-code-bg` (with `-hover`
   and `-focus`) and `--_phone-field-autofill-bg` (as Input's
   `--_input-autofill-bg`). Add them to the list, or name the rule for a
   part's own fill.
3. **Read only border style** is written directly (`border-style: dashed`)
   in both components, as in Input.css. If the convention wants every state
   to swap properties, add `--_<c>-border-style` to the list.
4. `packages/styles/desk/index.css` gained `@import './recipes/DropdownMenu.css'`
   from `npm run gen`: the recipe was on the branch I started from but the
   index was not regenerated. Not my change; committed as generated.
5. `Field.manifest.json` `slots.root.accepts` should list OTPField and
   PhoneField (order 1.2.1 says so; that is lane 2A's file).

## 1.2.9 OTPField

Files: `packages/react/src/components/OTPField/` (`OTPField.tsx`,
`OTPField.test.tsx`, `OTPField.demo.tsx`, `index.ts`),
`packages/css/src/components/OTPField.css`,
`packages/manifest/src/component/OTPField.manifest.json`,
`packages/shared/src/otp.ts`, `otp.test.ts`,
`docs/reports/shots/wave-1/otp-field/` (5 matrix shots, 2 focus shots, 1
forced colors shot).

```ts
interface OTPFieldProps extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'value' | 'defaultValue' | 'maxLength' | 'minLength' | 'pattern' | 'title' | 'ref' | 'className' | 'style' | 'children'> {
  length?: number;                      // default 6
  groups?: number[];                    // [3, 3] draws a separator; ignored unless it adds up to length
  charset?: 'numeric' | 'alphanumeric'; // default numeric
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void; // each time the code becomes a new full code
  size?: 'xs' | 'sm' | 'md' | 'lg';     // default md
  shape?: 'default' | 'pill';           // default radius.field
  invalid?: boolean;                    // disabled, readOnly, required: native, Field aware
  className?: string;
  style?: CSSProperties;
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  ref?: Ref<HTMLInputElement>;
}
// shared: parseCode(text, { length, charset }) -> { value, complete, rejected },
//         toLatinDigits, codeInputHints, codeSeparatorIndexes
```

Anatomy: root (`data-ds="otp-field"`, `dir="ltr"`), `control` (the one
input), `cell` (repeated, `aria-hidden`), `separator` (`aria-hidden`).
States: `data-invalid`, `data-disabled`, `data-readonly`, `data-complete` on
the root; `data-active` and `data-filled` on cells.

Decisions:

- **One input, not one per cell** (the order asked to pick and say why). One
  `<input autocomplete="one-time-code" inputmode="numeric">` holds the whole
  code, transparent text and caret, laid over the cells. The SMS autofill of
  iOS and Android and password managers fill one field with the whole code;
  a paste lands in one field with no script to split it; a screen reader
  meets one named textbox whose value is the code, not six unnamed boxes; and
  a Field label points at it with `htmlFor` like any control. This adds a
  `control` part to the order's anatomy (root, cell, separator).
- No `maxlength`: a pasted "123 456" would be cut before it is read. The code
  is cut after `parseCode`.
- The field keeps one character selected, so typing replaces the active cell
  and moves on. Backspace is the native delete (so forms hear the input
  event), then the cell before becomes active. Arrow keys move physically;
  inside the `dir="ltr"` group that is the reading direction. Shift with an
  arrow keeps native selection. A paste selects all first, then the native
  paste runs, so it replaces the whole code.
- `parseCode` drops spaces and dashes, reads Arabic Indic and Eastern Arabic
  Indic digits, and finds the one code run in an SMS sentence ("Your code is
  482913."). A single key the code cannot hold is refused and the cell keeps
  its character.
- `shape="default"` uses `radius.field` (8px), not `radius.control`: the
  style's control radius is a pill, which would make every cell a circle.
  `pill` gives round cells.
- The input uses `font.size.fixed-m` so phones do not zoom on focus.
- The root is `inline-size: fit-content`: a stretched `dir="ltr"` root would
  push the cells to the left edge of an Arabic form. Cells shrink in a narrow
  container, never under the 24px target.
- In forced colors the input gets `forced-color-adjust: none`, so the system
  does not paint the code text over the cells.

Review (one round, fresh agent): 4 blockers fixed: onComplete did not fire
again after a full code was edited; typing the same digit did not move on; a
letter typed over a filled cell deleted the digit; forced colors painted the
input text. Notes fixed: Shift with an arrow, a stale caret when a controlled
parent refuses a change, the Backspace and arrow wording in the manifest, an
Arabic typo, six more tests, focus and forced colors shots. Left open: the
private name list and the read only border style (Changes needed, items 2
and 3).

## 1.2.10 PhoneField

Files: `packages/react/src/components/PhoneField/` (`PhoneField.tsx`,
`PhoneField.test.tsx`, `PhoneField.demo.tsx`, `index.ts`),
`packages/css/src/components/PhoneField.css`,
`packages/manifest/src/component/PhoneField.manifest.json`,
`packages/shared/src/phone.ts`, `phone.test.ts`,
`docs/reports/shots/wave-1/phone-field/` (5 matrix shots, 2 focus shots, 1
forced colors shot).

```ts
interface PhoneFieldProps extends Omit<ComponentProps<'input'>, 'size' | 'type' | 'value' | 'defaultValue' | 'title' | 'ref' | 'className' | 'style' | 'children' | 'name'> {
  value?: string;            // E.164, controlled
  defaultValue?: string;     // E.164
  onValueChange?: (value: string, detail: { country: string; national: string; valid: boolean }) => void;
  country?: string;          // ISO code, controlled
  defaultCountry?: string;   // default SA
  onCountryChange?: (country: string) => void;
  countries?: string[];      // limit the picker
  locale?: string;           // country names; default the Theme lang
  labels?: { country?: string; gulf?: string; all?: string };
  name?: string;             // hidden input posts E.164
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill';
  invalid?: boolean;         // disabled, readOnly, required: Field aware
  className?: string;
  style?: CSSProperties;
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  ref?: Ref<HTMLInputElement>;
}
// shared: GULF_COUNTRIES, PHONE_COUNTRIES, phoneCountryOptions(locale, only),
//         parsePhone, nationalDigits, formatNational, toE164, isValidNational,
//         maxNationalLength, phoneExample, findPhoneCountry, isGulfCountry
```

Anatomy: root (`data-ds="phone-field"`), `code` (the dial code and a
chevron), `country` (the native select, inside `code`), `control` (the tel
input). States: `data-invalid`, `data-disabled`, `data-readonly`.

Decisions:

- **The native select is transparent over the dial code** (decision 4 says
  native select). Closed, the field shows "+966"; open, the platform list
  shows "Saudi Arabia +966" in two groups, Gulf (SA, AE, KW, QA, BH, OM) and
  all other countries by name in the current language. The select is named
  "Country code" ("رمز الدولة" in Arabic) and fills the dial code while it has
  focus, so it is clear which of the two stops has focus.
- **Country names come from `Intl.DisplayNames`**, so `phone.ts` holds only
  ISO and dial codes (245 entries) and names follow the language. ICU names
  SA "المملكة العربية السعودية" in Arabic.
- **Gulf rules, from the national numbering plans** (national digits, no
  trunk 0): SA 9 (50 123 4567), AE 9 mobile or 8 landline (50 123 4567, 4 123
  4567), KW, QA, BH and OM 8 (5000 1234). SA and AE drop a typed trunk 0.
  Only lengths are checked, no leading digit rules, so a valid new range is
  never refused. Other countries keep digits as typed with the E.164 limit.
- **Paste**: `+9665...`, `009665...`, `+966 (0) 5...` and Arabic Indic digits
  set the country. A shared dial code keeps the current country when it
  shares it (+1 in a CA field), else goes to the main one (+1 to US, +44 to
  GB). While a typed "+9" or "+97" matches no code yet, the raw text stays.
- **RTL**: the number input has `dir="ltr"`; the dial code is in a `bdi`. In
  Arabic the dial code sits at the inline start (right) and the number is
  right aligned next to it, which keeps the Tab order and the visual order
  the same. The other option, the whole box left to right with the code on
  the left, is one CSS line (`flex-direction: row-reverse` under
  `:dir(rtl)`) if the owner prefers it.
- **Read only** drops the select: a native select cannot be read only.
- The select and the input reach over the root's 1px border, so each is
  24px tall at `xs` (WCAG 2.5.8); the contract caught 22px.
- The dimmed dial code of a disabled field carries `aria-disabled` on its
  span: inactive text is exempt from 1.4.3. Axe needs the attribute; without
  it the contract fails on the disabled case (checked both ways).
- Changing the country keeps the digits (SA 501234567 to KW stays 9 digits)
  and `detail.valid` reports the length, so nothing is lost without a word.
  `toE164` never cuts digits; typing is capped at the country's longest
  length.
- The picker is named by its own label plus the Field label ("Country code,
  Office number"), so three phone fields in one form have three names.
- The full ISO list is shown by default. A product that must limit the list
  passes `countries`.

Review (one round, fresh agent): 5 blockers fixed: a controlled value from
another country kept the old country (the hidden input posted +966 with AE
digits); Backspace or Delete on a group space got stuck; typing "+" over a
full number left the old number in the value; a read only dial code was
hidden from screen readers (now it describes the number); AE mobile numbers
took the landline groups until the ninth digit. Notes fixed: picker names,
digits kept on a country change, a lone "0" or "00" kept as a draft, a
controlled reset ends a draft, `form` on the hidden input, the number paints
above the glow, a private property for the chevron color, the placeholder
bidi rule from Input, GrayText placeholder in forced colors, a valid German
demo number, the manifest wording for `detail.valid`, five more tests, and an
Arabic demo description where "50 123 4567" read in reverse order. Left open:
the read only border style (Changes needed, item 3).

## Token gaps

None needed a new token. Both components reuse Input's tokens; OTPField adds
`radius.field`, `font.size.xl` and `font.size.3xl`, `color.border.strong`.

## Arabic copy

All Arabic demo copy and `content.ar` rules were written without the
GoBanana copy cookbook (not available in this session). Labels are noun form
(رمز التحقق، رقم الجوال، رمز الدولة), white Saudi dialect in the sentences
(اللي، تقدر، وش), no diacritics, Western digits. A native reviewer should
read the demos once.

## Could not do

- Real SMS autofill and password manager fills cannot run in headless
  Chromium. They were checked by reasoning (one input with
  `autocomplete="one-time-code"`, no maxlength) and by a test that sets the
  whole value in one change.
- Neutral is not on this branch; both components use tokens only.
- The Gulf numbering rules were written from the national numbering plans as
  I know them (SA 9 digits for mobile and landline, AE 9 mobile and 8
  landline, KW, QA, BH and OM 8). Only lengths are enforced, so a new range
  is never refused, but the lead may want them checked against the current
  CST, TDRA, CITRA, CRA, TRA and TRA Oman plans.
