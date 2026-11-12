# Review: batches 1 and 2

Fresh eyes review by ds-qa of the React components of batch 1 (Link,
ButtonGroup, DropdownMenu, ToggleButton, CloseButton, CopyButton,
FloatingActionButton, SplitButton) and batch 2 (Label, FieldError, Textarea,
InputGroup, SearchField, PasswordField, InlineEdit, OTPField, PhoneField) on
branch `claude/ds-review-1-2`, cut from `claude/relaxed-hypatia-7gseap`. No
source file was edited. The builders' lane reports were read after the
findings below were formed; where a finding repeats a point a lane left
open, it says so.

## Verdicts

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Link | pass | 0 | 1 |
| ButtonGroup | pass | 0 | 1 |
| DropdownMenu | pass | 0 | 1 |
| ToggleButton | fix needed | 1 | 0 |
| CloseButton | pass | 0 | 0 |
| CopyButton | pass | 0 | 1 |
| FloatingActionButton | pass | 0 | 2 |
| SplitButton | pass | 0 | 2 |
| Label | pass | 0 | 1 |
| FieldError | pass | 0 | 0 |
| Textarea | pass | 0 | 0 |
| InputGroup | pass | 0 | 2 |
| SearchField | pass | 0 | 2 |
| PasswordField | pass | 0 | 2 |
| InlineEdit | pass | 0 | 3 |
| OTPField | fix needed | 2 | 0 |
| PhoneField | pass | 0 | 0 |

Three blockers in all: one in ToggleButton (forced colors), two in OTPField
(the contract never runs, and the lg size does not reflow at 320px in
Neutral).

`npm run check` is green. The contract command passes for sixteen of the
seventeen, and skips OTPField without failing:

```text
npm run contract -- --framework react --component Link,ButtonGroup,DropdownMenu,ToggleButton,CloseButton,CopyButton,FloatingActionButton,SplitButton,Label,FieldError,Textarea,InputGroup,SearchField,PasswordField,InlineEdit,OTPField,PhoneField
note: OTPField is ready for react but http://localhost:44643/c/otp-field renders no demo case. Its checks are skipped.
pass  ButtonGroup: 29 passed, 0 failed, 0 skipped
pass  CloseButton: 29 passed, 0 failed, 0 skipped
pass  CopyButton: 29 passed, 0 failed, 0 skipped
pass  DropdownMenu: 44 passed, 0 failed, 0 skipped
pass  FieldError: 28 passed, 0 failed, 1 skipped
pass  FloatingActionButton: 29 passed, 0 failed, 0 skipped
pass  InlineEdit: 29 passed, 0 failed, 0 skipped
pass  InputGroup: 29 passed, 0 failed, 0 skipped
pass  Label: 29 passed, 0 failed, 0 skipped
pass  Link: 29 passed, 0 failed, 0 skipped
skip  OTPField: 0 passed, 0 failed, 1 skipped
pass  PasswordField: 29 passed, 0 failed, 0 skipped
pass  PhoneField: 29 passed, 0 failed, 0 skipped
pass  SearchField: 29 passed, 0 failed, 0 skipped
pass  SplitButton: 29 passed, 0 failed, 15 skipped
pass  Textarea: 29 passed, 0 failed, 0 skipped
pass  ToggleButton: 29 passed, 0 failed, 0 skipped
```

With the route slug patched to `otp-field` in a working copy (and reverted
before commit), OTPField passes: `29 passed, 0 failed, 0 skipped`. The
FieldError skip is the key run (it has no keys). The 15 SplitButton skips are
the "open" target size and axe runs, which look for an open root of
`split-button`; the menu that opens is a `dropdown-menu` root, covered by
the DropdownMenu run.

## How it was checked

- Code, CSS, manifest, demo and tests of each component read against its
  order in `docs/plan/wave-1-batch-1.md` or `wave-1-batch-2.md`, the
  anatomy contract and the checklist in section 6 of `PLAN.md`.
- A Playwright sweep of the React gallery at `/c/<slug>?chrome=0`: Studio,
  Desk and Neutral, dark and light, LTR English and RTL Arabic, at 320px and
  1280px (408 renders). Each render checked for horizontal scroll (WCAG
  1.4.10), console errors and page errors. axe with the WCAG 2.0, 2.1 and
  2.2 A and AA tags at every 1280px render (204 runs).
- Forced colors and reduced motion together (`forcedColors: active`,
  `reducedMotion: reduce`), Studio and Neutral dark, every component, with
  DropdownMenu and SplitButton opened by the keyboard.
- Keyboard and name checks in Chromium: SplitButton disabled trigger by
  click, Enter, ArrowDown and ArrowUp; DropdownMenu Escape returns focus to
  the trigger (12 triggers), arrows over disabled items; PasswordField
  toggle by Enter; CopyButton name and status after a copy; the Arabic
  names of CloseButton, CopyButton, FloatingActionButton, SearchField,
  InlineEdit and Link.

## What holds across both batches

Checked in code and in Chromium, not repeated per component below:

- axe: zero violations in all 204 runs.
- Reflow: no horizontal scroll at 320px in any style, scheme or direction,
  except OTPField in Neutral (blocker below).
- No console error or page error in any render.
- Anatomy: `data-ds` roots, own parts only, shared axis words, boolean state
  attributes present and empty, `ref` as a prop, `"use client"` on every
  interactive file. Nested system components keep their own `data-ds` and
  carry the parent's part (SplitButton action and trigger, InlineEdit
  display, SearchField clear, PasswordField toggle).
- CSS: `@layer ds.base`, private `--_<component>-*` properties, logical
  properties, only `transform` and `opacity` animate, every spinner and the
  menu motion stop under reduced motion, the transparent outline only
  inside focus selectors.
- Disabled actions stay focusable with `aria-disabled` and swallow click,
  pointer down and keys in `ButtonBase.tsx:143` to `162`, so a disabled
  SplitButton trigger opens no menu by click or by key (checked). Text entry
  uses native `disabled`.
- Forced colors: DropdownMenu, SplitButton and FloatingActionButton keep
  borders, the highlighted row and the check marks
  (`shots/batch-1-2/dropdown-menu-forced-colors-open.png`,
  `split-button-forced-colors-open.png`,
  `floating-action-button-forced-colors.png`). ToggleButton is the
  exception (blocker below).
- Copy: English actions are a verb plus a noun ("Publish page", "Create
  board", "Copy command", "Write note"); Arabic labels are noun forms with no
  diacritics ("إغلاق", "نسخ", "إنشاء لوحة", "نشر الصفحة", "رمز الدولة").

## Findings

### Link: pass

- note: `packages/react/src/components/Link/Link.tsx:96`. The language test
  is `lang === 'ar'`, while CloseButton, CopyButton, Textarea and PhoneField
  use `startsWith('ar')`. Under `lang="ar-SA"` the hidden external text
  falls back to English. Use one helper for all components. Label has the
  same test at `Label/Label.tsx:51`.

Checked and fine: the underline is drawn at rest (WCAG 1.4.1), the external
icon mirrors in RTL (`matrix(-1, 0, 0, 1, 0, 0)`), the hidden text reads
"، يفتح في تبويب جديد" with the Arabic comma and is 1px wide, a disabled link
loses its href and keeps `role="link"` and a tab stop.

### ButtonGroup: pass

- note: `packages/manifest/src/component/ButtonGroup.manifest.json:30`.
  `slots.root.min` is 1, while the prop doc at
  `ButtonGroup/ButtonGroup.tsx:28` says "Two to five". A group of one is not
  a group; set `min` to 2 so the checker and the docs agree.

### DropdownMenu: pass

- note: `packages/react/src/components/DropdownMenu/DropdownMenu.tsx:286`.
  The doc comment says a disabled item "keeps it focusable with
  aria-disabled". In Chromium ArrowDown in the File menu of the disabled
  case visits only "New board" and skips all three disabled items, which is
  Radix behavior and what the manifest says (`a11y.keys.ArrowDown`,
  `props.disabled`). The manifest is honest; fix the comment.

### ToggleButton: fix needed

- **blocker**: `packages/css/src/components/Button.css:527` to `531`. In
  forced colors a pressed toggle gets `background-color: Highlight` and
  `color: HighlightText`, but the label text keeps the browser's text
  backplate, drawn in `Canvas`. Dark mode: the label of every pressed toggle
  becomes a black box on the Highlight fill with black text inside it, so
  the words disappear (WCAG 1.4.3 and 1.4.11; the order's own acceptance,
  "forced colors shows the pressed state", is met for the state but the
  name is lost). Only icons stay visible. Evidence:
  `shots/batch-1-2/toggle-button-forced-colors-pressed-label-lost.png`
  (every "on" column, the Arabic rows, "Bold" in the formatting bar). Fix
  with `forced-color-adjust: none` on the pressed toggle and its parts, or
  keep `ButtonFace` and `ButtonText` and show pressed with a thicker
  `Highlight` border instead of a fill.

Checked and fine outside forced colors: pressed is not color alone (inner
2px ring plus fill, `Button.css:403` to `433`), `aria-pressed` follows the
state, Space and Enter toggle.

### CloseButton: pass

No findings. Default name "Close", "إغلاق" under an Arabic Theme, 24px at
`xs`. The change for Dialog, Toast and Window to adopt it is still open in
their owners' orders, as the order asked.

### CopyButton: pass

- note: `packages/react/src/components/CopyButton/CopyButton.tsx:93`. A
  second copy inside the hold time sets the same status text, "Copied",
  so the live region does not change and nothing is announced again (WCAG
  4.1.3). Clear the status for one frame before setting it again, or append
  nothing and accept it; say which in the manifest.

Checked and fine: after Enter the button keeps its name "Copy command" and
the status reads "Copied" once; the status stays outside the name.

### FloatingActionButton: pass

- note: `packages/react/src/components/FloatingActionButton/FloatingActionButton.tsx:165`.
  `loadingLabel` defaults to English "Loading" under an Arabic Theme. CloseButton
  and CopyButton pick their default by language; this one should too
  ("جار التحميل", as `ButtonBase.tsx:46` documents). The same holds for
  Button and SplitButton, which take the Button default.
- note: `packages/css/src/components/Button.css` floating-action-button
  block. `md` is 44px and `lg` 48px, so `md` here does not mean the 32px of
  anatomy rule 12. The order allowed `md` and `lg`; record the meaning in
  DECISIONS so it is not read as a size word drift.

### SplitButton: pass

- note: `packages/react/src/components/SplitButton/SplitButton.tsx:309`. The
  root has no `role="group"` and no name, while ButtonGroup requires one.
  A screen reader hears two loose buttons. Add `role="group"` with
  `aria-label` taken from the action label, or document why not.
- note: the long text case truncates the action with an ellipsis ("Your
  changes are sav..."). The accessible name stays whole, but the visible
  words are lost at every width. Offer the `data-wrap` form Button has, or
  say in the manifest `mistakes` that a split action label stays short.

Trigger names are specific ("More publish options", "خيارات النشر الأخرى",
"More save options"), as the order asked. The menu aligns to the inline end
in both directions.

### Label: pass

- note: `packages/react/src/components/Label/Label.tsx:51`. The same
  `lang === 'ar'` test as Link; "مطلوب" does not appear under `ar-SA`.

### FieldError: pass

No findings. Icon plus text, not a live region, joins `aria-describedby`
inside a Field, Arabic small text one step up.

### Textarea: pass

No findings. The live message changes only when the zone changes (near,
over), over the limit marks invalid and never truncates, the Arabic count
words follow number agreement ("حرفين", "3 حروف", "11 حرف").

### InputGroup: pass

- note: `packages/react/src/components/InputGroup/InputGroup.tsx:123`. Any
  child that is not a host element, an addon, Button or IconButton is
  treated as a control and gets `rootProps`, `invalid` and `readOnly`. A
  ToggleButton or CopyButton put in the group (both on ButtonBase) would get
  `rootProps` and `invalid` spread onto a `<button>` as unknown attributes.
  Match by a list of controls, as `ACTIONS` does for actions.
- note: the group has `role="group"` and no name. Not required, but when two
  groups sit on one page they read the same. Accept `aria-label` in the
  docs example.

### SearchField: pass

- note: `packages/react/src/components/SearchField/SearchField.tsx:218`. The
  order's anatomy says `clear` is a CloseButton root; the code renders an
  IconButton (`data-ds="icon-button"`). The behavior is right; either use
  CloseButton or record the change in the manifest.
- note: `SearchField.tsx:78` and `80`. `clearLabel` and `loadingLabel`
  default to English ("Clear search", "Searching") under an Arabic Theme. The
  Arabic demo passes "مسح البحث" by hand; pick the default by language as
  CloseButton does.

### PasswordField: pass

- note: `packages/react/src/components/PasswordField/PasswordField.tsx:172`
  and `173`. The toggle changes its name ("Show password" to "Hide
  password") and also sets `aria-pressed`. After Enter a screen reader hears
  "Hide password, toggle button, pressed", which reads as two opposite
  states. The order asked for both, so this is an order conflict, not a
  builder fault: the WAI-ARIA toggle button pattern says a toggle's label
  should not change when its state changes. Keep one: a fixed name "Show
  password" with `aria-pressed`, or a changing name with no `aria-pressed`.
  Route to the architect.
- note: `PasswordField.tsx:61` and `62`. English defaults under an Arabic
  Theme, as SearchField.

Checked and fine: Enter on the toggle flips the input to `type="text"` and
focus stays on the toggle; `autocomplete` defaults to `current-password` and
passes through (WCAG 3.3.8).

### InlineEdit: pass

- note: `packages/react/src/components/InlineEdit/InlineEdit.tsx:125`. The
  display name joins the value and the action with a Latin comma and an
  English fallback: "إطلاق الربيع, تعديل اسم اللوحة" in the Arabic case, and
  "Edit <label>" when `editLabel` is not passed. Use "،" under Arabic, and an
  Arabic fallback.
- note: `InlineEdit.tsx:92` to `96`. Every default ("Add a name", "Save
  changes", "Discard changes", "Saved") is English only.
- note: `InlineEdit.tsx:287`. The error part is a hand made `<p>` with an
  icon, not a FieldError root carrying `data-part="error"`, which order 1.4.3
  names as the one error message. Use FieldError so the look and the copy
  rule stay in one place.

### OTPField: fix needed

- **blocker**: `scripts/gen-index.ts:127`. The gallery slug regex turns
  `OTPField` into `otpfield`, while `data-ds`, the anatomy contract URL and
  the contract suite use `otp-field`. `/c/otp-field` renders nothing, so the
  contract suite skips every OTPField check and still exits 0. The order's
  acceptance (contract green) is not met on the committed tree. Lane 2D
  reported the exact fix (`docs/reports/lanes/lane-2d.md`, item 1); it was
  not applied. Owner: the lead (`gen-index.ts` is root tooling). With the fix
  applied locally the contract passes, 29 of 29. Also consider failing the
  contract run, not skipping, when a ready component has no route.
- **blocker**: `packages/css/src/components/OTPField.css:36` to `46` and
  `124` to `128`. At 320px in Neutral (light and dark, LTR and RTL) the `lg`
  rows of the variants case overflow: the root is 328px in a 288px
  container and the page scrolls sideways to 344px (WCAG 1.4.10). The cells
  have `flex: 0 1 auto` and a 24px floor, so they could shrink, but the root
  has no `min-inline-size: 0`; as a grid or flex item its automatic minimum
  is the cells' specified width (6 times 48px plus 5 gaps), so
  `max-inline-size: 100%` never wins. Studio and Desk fit only because their
  `lg` cells are smaller. Fix: `min-inline-size: 0` on the root. Evidence:
  `shots/batch-1-2/otp-field-320px-neutral-lg-overflow.png` (the two `lg`
  rows are cut at the start edge).

Checked and fine: one real input with `autocomplete="one-time-code"` keeps
paste and SMS autofill working (WCAG 3.3.8), the group is `dir="ltr"` in
Arabic, cells are `aria-hidden` and the input carries the value.

### PhoneField: pass

No findings. Gulf countries first in their own `optgroup`, dial codes held
LTR with isolates inside Arabic options, the number input `dir="ltr"`, the
hidden form value E.164, the select named "رمز الدولة" plus the field label.
Evidence of the RTL layout at 320px:
`shots/batch-1-2/phone-field-320px-rtl-studio-dark.png`.

## Across the gallery

- note: demos in every component render their English cases unchanged
  under `dir=rtl&lang=ar`, so trailing punctuation lands on the wrong side
  (".We send a sign in code to this number" in
  `phone-field-320px-rtl-studio-dark.png`, ".in 1234" in the OTPField shot).
  It is demo copy, not component output, but the gallery is where Arabic
  review happens. Wrap English demo text in `lang="en" dir="ltr"`, or show
  Arabic copy in every case under `lang=ar`. Owner: the gallery and the
  demo authors; not a blocker for any one component.
- note: several components pick defaults by language (CloseButton,
  CopyButton, Textarea, PhoneField) and several do not (SearchField,
  PasswordField, InlineEdit, FloatingActionButton and Button
  `loadingLabel`). A shared `useDefaultCopy(component)` in one place would
  close every English leak at once and give the Arabic copy one owner.

## After reading the lane reports

- Lane 2D left the OTPField slug fix open, as said above. Its focus and
  forced colors shots of OTPField are at desktop width and do not cover the
  320px Neutral overflow.
- No lane report mentions the forced colors label loss of a pressed
  ToggleButton.
