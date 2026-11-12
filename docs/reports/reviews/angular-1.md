# Review: Angular batches A1, A2 and A5

Fresh eyes review by ds-qa of the Angular port on branch
`claude/ds-review-angular-1`, cut from `claude/relaxed-hypatia-7gseap`. No
source file was edited. Three ds-qa subagents (claude-opus-5-5, medium) took
one batch each; the lead ran the pixel compare, reproduced every blocker in
code or in Chromium, and read the builders' reports
(`docs/reports/lanes/angular-a1.md`, `-a2.md`, `-a5.md`) only after the
findings below were formed. Where a finding repeats a point a builder left
open, it says so.

Evidence: `docs/reports/reviews/shots/angular-1/` (`a1/`, `a2/`, `a5/`,
`pixels/`).

## Verdicts

| Batch | Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- | --- |
| A1 | ToggleButton | fix needed | 2 | 2 |
| A1 | CloseButton | pass | 0 | 1 |
| A1 | CopyButton | fix needed | 1 | 2 |
| A1 | FloatingActionButton | pass | 0 | 0 |
| A1 | Link | fix needed | 1 | 3 |
| A1 | ButtonGroup | pass | 0 | 0 |
| A1 | DropdownMenu | fix needed (demo) | 1 | 1 |
| A1 | SplitButton | pass | 0 | 2 |
| A1 | ToggleGroup, SegmentedControl | not ported | 1 | 0 |
| A2 | Label | pass | 0 | 1 |
| A2 | FieldError | pass | 0 | 1 |
| A2 | Field | pass | 0 | 0 |
| A2 | Input | pass | 0 | 3 |
| A2 | Textarea | pass | 0 | 0 |
| A2 | InputGroup | pass | 0 | 1 |
| A2 | SearchField | pass | 0 | 0 |
| A2 | PasswordField | pass | 0 | 0 |
| A2 | InlineEdit | fix needed | 1 | 1 |
| A2 | OTPField | fix needed (demo) | 1 | 1 |
| A2 | PhoneField | pass | 0 | 1 |
| A2 | NumberField, ScrubInput | not ported | 1 | 0 |
| A5 | Alert | pass | 0 | 3 |
| A5 | Callout | pass | 0 | 0 |
| A5 | Banner | pass | 0 | 2 |
| A5 | StatusDot | pass | 0 | 0 |
| A5 | Skeleton | pass | 0 | 0 |
| A5 | ErrorState | pass | 0 | 0 |
| A5 | NotificationCenter | pass | 0 | 2 |
| A5 | Spinner | pass | 0 | 0 |
| A5 | ProgressBar | pass | 0 | 1 |
| A5 | ProgressCircle | pass | 0 | 0 |
| A5 | Meter | pass | 0 | 1 |
| A5 | Toast | fix needed | 1 | 3 |

Eight blockers in shipped components (ToggleButton 2, CopyButton,
Link, DropdownMenu demo, InlineEdit, OTPField demo, Toast), plus two
unported pairs.

## What was run

- `npm run check`: green before the review started (every workspace,
  Angular unit tests 223 of 223, gallery build).
- Galleries: React on port 5301, Angular on port 5302, both dev servers,
  shared by every run below.
- DOM: `docs/reports/shots/angular/compare-dom.mjs` on every page in studio,
  desk and desk `dir=rtl&lang=ar` (93 comparisons), plus scripts that open
  the DropdownMenu, SplitButton and Toast portals and dump them the same way.
  Every closed page is identical except OTPField (A2 B2). Open menus are
  identical except the Arabic board menu (A1 B4). The toaster layer is
  identical.
- Contract: `npm run contract -- --framework angular --url http://localhost:5302 --component <Name>`.
  Every component passes, 0 failed:

  ```text
  ToggleButton, CloseButton, CopyButton, FloatingActionButton, Link, ButtonGroup  29 passed each
  DropdownMenu  44 passed
  SplitButton   29 passed, 15 skipped (open checks; no contract.trigger, React skips the same)
  Label, Field, Input, Textarea, InputGroup, SearchField, PasswordField, InlineEdit, OTPField, PhoneField  29 passed each
  FieldError    28 passed, 1 skipped (no keys)
  Alert, Banner, ErrorState, NotificationCenter  29 passed each
  Toast         44 passed
  Callout, Meter, ProgressBar, ProgressCircle, Skeleton, Spinner, StatusDot  28 passed, 1 skipped (no keys)
  ```

  A green contract run does not clear InlineEdit: see A2 B1 and note N-C2.
- Pixels: `npm run shots` for React and Angular on the 31 kebabs in scope
  (480 and 498 shots, `--no-verify` for time), then
  `npm run shots -- --compare react angular`: 498 pairs in scope, 0 over the
  limit. Every pair is 0 differing pixels except OTPField (18 pairs, 117 to
  187 pixels, 0.011 to 0.018 percent). Table: `pixels/compare.md`.
- Keyboard: Playwright walks in LTR studio and RTL desk Arabic for every
  page, React and Angular side by side (Tab order, activation, arrows,
  Escape, focus return). Traces under `a1/keys-*`, `a2/keyboard/`,
  `a5/keys/`.
- axe: `@axe-core/playwright`, WCAG 2.0 to 2.2 A and AA plus best practice,
  both directions, both galleries. Results are equal in both frameworks for
  every page (`a1/axe-*.json`, `a2/axe/axe.json`, `a5/axe-*.json`).
- Forms: a temporary Vitest spec (deleted after the run, copy in
  `a2/forms/forms.qa.spec.ts`, result `a2/forms/result.txt`, 24 of 24) drives
  Input, Textarea, SearchField, PasswordField, InlineEdit, OTPField,
  PhoneField and InputGroup with an Input through `FormControl` and
  `ngModel`: model to view, view to model, `disable()` sets native
  `disabled` and `data-disabled` and clears both on enable, touched on blur,
  and inside a required Field: label `for`, `aria-required`, `aria-invalid`,
  `aria-describedby` order and `data-invalid`.
- Host attributes: a temporary probe spec (deleted, output in
  `a1/static-attributes-probe.txt`) renders each A1 directive with static
  inputs and checks what is left on the host.

## What holds across the three batches

Not repeated per component:

- Standalone, OnPush (directives excepted), signal inputs, no `@Input` or
  `@Output` decorators, no `NgZone`, no `markForCheck`. Timers only write
  signals, so they work zoneless.
- No wrapper element React does not have. No selector marker or consumed
  input attribute left on a host, in the gallery DOM or in the probes.
- Outputs follow the mapping: `openChange`, `pressedChange`, `checkedChange`,
  `valueChange`, `select`, `copied`, `copyFailed`. Node props take an icon
  name or a `TemplateRef`. Handlers a component must detect (`onClose`,
  `onDismiss`, `onRetry`, `onMarkAllRead`) are function inputs.
- Shared logic comes from `packages/shared` (otp, phone, toast). Toast does
  not reimplement the store.
- Overlays (DropdownMenu, SplitButton, Toast) use a CDK `ComponentPortal` on
  `document.body` whose host is the themed layer. No CDK Overlay pane, no CDK
  Dialog, no CDK FocusTrap, no CDK Menu.
- Every value control implements `ControlValueAccessor`; text entry uses
  native `disabled`, actions use `aria-disabled` and stay focusable.

## A1: actions

### ToggleButton: fix needed

1. **Blocker.** `packages/angular/src/components/toggle-button/toggle-button.ts:83-91`.
   A caller's `preventDefault()` does not stop the toggle on a real click or
   Space:

   ```ts
   await Promise.resolve();
   if (event.defaultPrevented) return;
   ```

   With a trusted event the browser runs microtasks between listeners, so
   the check runs before the caller's `(click)` listener. Measured, React
   then Angular: mouse `false -> false` and `false -> true`, Space the same,
   only a scripted `el.click()` gives `false -> false` in both. The unit test
   (`toggle-button.spec.ts:13`) uses `.click()`, so it passes. Evidence:
   `a1/prevent-default.txt`. The builder left this open on purpose, citing a
   different concern (a `preventDefault()` higher up the path also cancels);
   the measured failure is worse: the documented case does not work at all.
   Fix direction: decide synchronously in a listener added after the
   template's (for example in `afterNextRender`), or offer a `pressedChange`
   veto input.
2. **Blocker.** WCAG 4.1.2 name, role, value. `toggle-button.ts:27`:
   `'[attr.aria-label]': 'icon() !== undefined ? label() : null'`. On a text
   toggle the binding writes `null`, which removes a caller's static
   `aria-label`. React passes `rest['aria-label']` through. Probe:
   `<button dsToggleButton aria-label="Bold text">B</button>` renders with no
   name override (`a1/static-attributes-probe.txt`, t2).
3. Note. `packages/angular/src/components/button/button-base.ts:62-71`: the
   base inputs `loading`, `loadingLabel`, `type`, `href` and `role` are
   inherited, though React's ToggleButton omits them; `loading` sets
   `aria-busy` and `data-loading` with no spinner. Same for CopyButton.
4. Note. With a one way `[pressed]`, the local state flips on click; a
   controlled React `pressed` would not. That is how an Angular `model`
   works; say so in the manifest's angular note.

### CloseButton: pass

DOM, contract 29 of 29, keyboard, axe all equal to React. Static `disabled`,
`size` and `label` are consumed (probe c1); the Arabic default name comes
from the theme.

1. Note. `close-button.ts` still accepts `tone` from `DsButtonBase`. React's
   CloseButton leaves `tone` out of its props and always passes `neutral`.

### CopyButton: fix needed

1. **Blocker.** `packages/angular/src/components/copy-button/copy-button.ts:110-115`.
   The same microtask check as ToggleButton. With a caller listener that
   calls `preventDefault()`, React stays `data-state=idle` with the clipboard
   untouched; Angular goes to `copied` and writes the clipboard, by mouse and
   by Space. `copy-button.spec.ts:86-94` uses `.click()` and passes.
   Evidence: `a1/prevent-default.txt`.
2. Note. The clipboard write runs after `await Promise.resolve()`, not inside
   the click handler as order A1.1 asks. Chromium keeps transient activation
   across one microtask, so it works today; the fix for item 1 should make
   the call synchronous.

### FloatingActionButton: pass

Static `extended`, `position` and `disabled` are consumed (probe f1). The
default `lg` wins over a group size, as in React.

### Link: fix needed

1. **Blocker.** WCAG 2.4.3 focus order. `packages/angular/src/components/link/link.ts:41`:
   `'[attr.tabindex]': 'disabled() ? (tabIndex() ?? 0) : (tabIndex() ?? null)'`.
   The input is `tabIndex`, so the plain static `tabindex="-1"` an author
   writes never reaches it, and the `null` binding then removes the
   attribute. `<a dsLink href="#a" tabindex="-1">` is back in the tab order
   (probe l2). React keeps `tabIndex`. Fix direction: read the static
   `tabindex` attribute as the input default, or bind only when the input is
   set.
2. Note. `link.ts:36`: `aria-disabled` is bound to `null` when not
   disabled, which removes a caller's `aria-disabled` (probe l3). React
   passes it through.
3. Note. WCAG 3.1.2. `link.ts:81`: `this.theme.value().lang === 'ar'`, where
   React uses `lang.toLowerCase().startsWith('ar')`. Under `lang="ar-SA"` the
   external link suffix is English. Label has the same pattern (A2 N1).
4. Note. React blocks `onKeyDown` while disabled; Angular has no equivalent.
   Enter does not navigate either way (no `href`), so the impact is low.

### ButtonGroup: pass

Axes reach the children through DI (`DS_BUTTON_GROUP`,
`button-base.ts:79-86`); a child's own `size` wins (probes g1b, g1t). Every
child stays in the tab order and arrows do nothing, as in React.

### DropdownMenu: fix needed (demo)

1. **Blocker.** WCAG 3.1.2 language of parts and 1.3.2 meaningful sequence.
   `packages/angular/src/components/dropdown-menu/dropdown-menu.demo.ts:81`
   declares `<ng-template #boardMenu ...>` at the top of the demo, outside
   the Arabic `<div dsTheme [lang]="'ar'">` at `:136-138` that renders it.
   DI follows declaration (frameworks.md), so the Arabic menu opens with
   `dir="ltr" lang="en"` on the layer, the wrapper and the menu, where React
   has `dir="rtl" lang="ar"`. A screen reader reads Arabic with an English
   voice, icons and the submenu chevron sit on the wrong side, and the
   submenu opens with ArrowRight instead of ArrowLeft. The two other Arabic
   cases (`:204`, `:233`) are right. The builder's open-menu compare
   included an "Arabic" trigger and reported 0 differences; this review finds
   6 to 36 differing lines in studio and desk, all from this trigger.
   Evidence: `a1/dropdown-menu-arabic-react.png`,
   `a1/dropdown-menu-arabic-angular.png`,
   `a1/dropdown-menu-open-studio-keysub.diff`, `a1/dom-diff-summary.txt`.
   Fix: declare the template inside the dsTheme, or give the Arabic instance
   its own template. The component itself is right.
2. Note. `dropdown-menu.ts:513`: `ref.changeDetectorRef.detectChanges()` runs
   on every reposition inside `place()`. Not zone dependent, but the layer is
   OnPush with signals, so it should not be needed. The call at `:486` (first
   render) follows the Dialog precedent and is fine.

Everything else equals React: open DOM by keyboard and pointer with
submenus, contract 44 of 44, Up, Down, Home, End without wrap, typeahead,
Tab held in the menu, Escape back to the trigger, submenu arrows mirrored in
RTL.

### SplitButton: pass

1. Note. React's `onClick` is the output `action`
   (`split-button.ts:128`), because a `click` output would also fire for the
   trigger. That is a fair choice, but it is not one of the mapped forms in
   `docs/contracts/frameworks.md`. The lead should add it to the list.
2. Note. The suite skips the 15 open checks in both frameworks: no
   `data-demo-trigger` and no `contract.trigger` in the manifest. The open
   state was checked by hand here (DOM, axe, keyboard all equal to React).
   Add `contract.trigger` to `SplitButton.manifest.json` so the suite covers
   it.

### ToggleGroup and SegmentedControl: not ported

**Blocker** for order A1.2, not for any shipped component. Neither
`packages/angular/src/components/toggle-group/` nor `segmented-control/`
exists; both manifests are `planned`
(`packages/manifest/src/component/ToggleGroup.manifest.json:193`,
`SegmentedControl.manifest.json:177`). The builder skipped them because
React had no version at the time; React has both now (commit `dc57270` for
SegmentedControl). A1.2 needs a new order.

## A2: text inputs

### Label: pass

1. Note. WCAG 3.1.2. `packages/angular/src/components/label/label.ts:112`:
   `this.theme.value().lang === 'ar' ? 'مطلوب' : 'required'`. React uses
   `startsWith('ar')`, so `ar-SA` reads "required" in Angular.

### FieldError: pass

1. Note. A hand written `<p dsFieldError>` inside a Field with
   `[invalid]="false"` still renders; React hides it. Documented at
   `field-error.ts:11-16`; the `error` input of Field covers the common case.

### Field: pass

Ids and state reach the control through DI (`DsFieldContext`); the forms spec
proves `for`, `aria-required`, `aria-invalid` and the `aria-describedby`
order.

### Input: pass

1. Note. `packages/angular/src/components/input/input.ts:132`:
   `[attr.value]="value() ?? null"` makes the `value` attribute follow each
   keystroke. Uncontrolled React keeps the first value. Only a `[value]` CSS
   selector would see it.
2. Note. `input.ts:226-229` writes the native value only when it differs, so
   after a scripted `focus()` (Dialog autofocus) the caret is at 0 in Angular
   and at the end in React: typing gives "abclaunch" against "launchabc"
   (`a2/keyboard/kb.ltr.*`). Tab focus selects all in both.
3. Note. `input.ts:214`: `disabled: this.disabled() ?? this.group?.disabled() ?? (this.formDisabled() || undefined)`.
   An explicit `[disabled]="false"` beats a form's `disable()`. SearchField,
   PasswordField, OTPField and PhoneField use the same order. Decide which
   wins and write it down.

### Textarea: pass

### InputGroup: pass

1. Note. `input-group.ts:20-21`: `DsInputGroupAction` does not fill size,
   shape or `emphasis="outline"` on its action, so the caller writes them.
   The demo does and its DOM equals React's. List it as a different Angular
   form.

### SearchField: pass

First Escape clears, the second passes through; clear by Enter, Space or
click returns focus to the input, in both directions.

### PasswordField: pass

The reveal toggle flips `type`, `aria-pressed`, the label and
`data-visible` by Enter, Space and click; the visible state DOM equals
React's.

### InlineEdit: fix needed

1. **Blocker.** WCAG 2.1.1 keyboard and 2.4.3 focus order. Enter, Space or a
   click on the display never opens the editor, and focus falls to `<body>`.
   Reproduced by the lead:

   ```text
   react after Enter: state editing focus INPUT control
   angular after Enter: state viewing focus BODY
   ```

   Cause: `packages/angular/src/components/inline-edit/inline-edit.ts:85`
   listens to `(focusout)` on the root, and `onRootBlur` at `:297-308` reads:

   ```ts
   if (!this.editing()) return;
   const next = event.relatedTarget as Node | null;
   if (next && (event.currentTarget as Element).contains(next)) return;
   if (this.draft() === this.current()) {
     this.ownError.set(null);
     this.setEditing(false, 'none');
   ```

   `start()` sets `editing` true; the render removes the focused display
   button; Chromium fires `focusout` on it with no `relatedTarget`; the
   handler now sees `editing()` true and an unchanged draft and closes at
   once. React escapes only because its blur handler is still the closure
   from before the state change, so React carries the same weakness hidden
   by timing. jsdom fires no blur on removal, so the unit tests miss it.
   Evidence: `a2/keyboard/inline-edit-events.react.txt`,
   `a2/keyboard/inline-edit-events.angular.txt`, `a2/keyboard/kb2.*`. Fix
   direction: ignore a `focusout` whose target is the display part (or is no
   longer the editor), in both frameworks.
2. Note. The contract keyboard map passed because `expect: "state-changes"`
   saw the brief flip to editing and back. See N-C2.

### OTPField: fix needed (demo)

1. **Blocker.** WCAG 1.4.10 reflow. `packages/angular/src/components/otp-field/otp-field.demo.ts:20`:
   `style="grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));"`.
   React's demo uses `min="min(100%, 22rem)"`, so below 352px the Angular
   grid overflows where React's does not. The demo DOM differs from React
   (`a2/dom/otp-field.*.diff`). The contract 320px check passed; it does not
   look at this grid.
2. Note. The pixel diff (18 pairs, up to 187 pixels) is only the page
   heading: "OTPField" in React, "OtpField" in Angular
   (`pixels/otp-field-heading-*.png`, `pixels/otp-field-diff-studio-dark-ltr.png`).
   It comes from the gallery, see N-C1. The React side of that compare is
   the committed baseline, because the live React route is `/c/otpfield`.

Keys equal React: typing advances, Backspace goes back, Home and End, a
letter is refused, a paste of "987 654" or Arabic Indic digits fills the
code, `data-complete` is set, `autocomplete="one-time-code"` is present. The
root carries `dir="ltr"` in both frameworks, so arrows are not mirrored in
RTL, by design.

### PhoneField: pass

Native country select, formatting ("50 123 4567"), Backspace, country
change, the "+97" draft and a "+971" value switching the country all equal
React.

1. Note. `phone-field.ts:215`: `readonly country = input<string | undefined>(undefined);`
   plus a `countryChange` output. `[(country)]` works, but the order says
   value props are models. Use `model()`.

### NumberField and ScrubInput: not ported

**Blocker** for order A2.2. No Angular folders; both manifests `planned`.
The builder skipped them because React had none at the time; React has both
now (commit `427229d` for NumberField). A2.2 needs a new order.

## A5: feedback

### Alert: pass

1. Note. `packages/angular/src/components/alert/alert.ts:74-75`: the close
   part is `<button dsIconButton data-ds="close-button" ...>` under the
   comment "Swap for dsCloseButton when the A1 port merges". A1 has merged.
   See the close button section.
2. Note. `alert/message.ts:52-77`: `DsFilledPart` swaps rendered elements
   for a comment by hand (`el.replaceWith(placeholder)`). The DOM matches
   today, but it is fragile if Angular re-renders around it.
3. Note. `alert.ts:70`: `@if (actions(); as a)` hides the actions part for
   an empty string; React renders it. Edge case.

Shared with React, not a port issue: dismissing the "one" demo alert leaves
focus on `body` (WCAG 2.4.3); Alert does not manage focus in either
framework.

### Callout: pass

`aside[dsCallout]` stands in for React's `as`, like `a[dsButton]`;
`role="note"` only on the div form, as React.

### Banner: pass

1. Note. `banner/banner.ts:103-104`: the same out of date close button
   comment and `dsIconButton data-ds="close-button"`.
2. Note. `banner.ts:150`: sticky padding in `afterRenderEffect` where React
   uses `useLayoutEffect`. No visible difference.

### StatusDot, Skeleton, ErrorState, Spinner, ProgressCircle: pass

Roles, `aria-hidden` on decorative parts, `aria-busy` on retry, and
`aria-valuenow`, `-min`, `-max`, `-valuetext` (absent `aria-valuenow` when
indeterminate) all equal React.

### NotificationCenter: pass

1. Note. `notification-center.ts:211`: `const now = this.now() ?? new Date();`
   inside a `computed`. Relative times refresh only when an input changes;
   React recomputes on every render.
2. Note. `notification-center.ts:201`: the `itemIds` map never drops ids of
   removed items.

### ProgressBar and Meter: pass

1. Note. `progress-bar/progress-bar.ts:93` and `meter.ts` use a module
   counter for ids where other components use the CDK `_IdGenerator`.
   Consistency only. The builder also asked to move `format.ts` to
   `packages/shared`; that is still open.

### Toast: fix needed

1. **Blocker.** WCAG 2.1.1 keyboard. Order A5.2 puts the toaster "above
   dialogs". With an Angular Dialog open, keyboard focus cannot reach a
   toast: F8 focuses the toaster, and
   `packages/angular/src/components/dialog/dialog.ts:385-394`
   (`onDocumentFocusin`) pulls it straight back into the panel. It exempts
   only `[data-menu-layer]`:

   ```ts
   if (target instanceof Element && target.closest('[data-menu-layer]')) return;
   (tabbables(panel, this.checker)[0] ?? panel).focus();
   ```

   React lets focus and pointer presses into the toaster
   (`packages/react/src/components/Dialog/DialogBase.tsx:305-316`, three
   `isInsideToaster` checks). `isInsideToaster` exists in Angular
   (`toast/is-inside-toaster.ts`) but nothing outside the toast spec uses it.
   A danger or action toast, which never times out, has an action no
   keyboard user can reach while a dialog is open. The builder found this
   and listed it as lead change 5 in `angular-a5.md`; it is still not
   applied. No Angular test covers toasts above a dialog; React has three
   (`Dialog.test.tsx:596` onward). Fix: the one line return for
   `isInsideToaster(target)` in `onDocumentFocusin`, plus Angular twins of
   the three React tests. The file is in the Dialog lane.
2. Note. WCAG 4.1.3, shared with React. `toast/toaster.ts:498` (twin of
   `Toaster.tsx:232-240`): a new toast more than 100 ms after another empties
   the live regions with `this.lines.set([])`, which can drop a danger line
   from the assertive region about 100 ms after it was written. In the LTR
   run both galleries end with `assertive=[]` after a danger then an action
   toast. Evidence: `a5/toast/`. Fix in both frameworks.
3. Note. `toaster.ts:183`: `ref.changeDetectorRef.detectChanges()` on the
   first portal render, the Dialog pattern. Fine.

Behavior otherwise equals React: focus stays on the trigger when a toast
shows; F8 reaches the list; Tab walks newest first; Escape and close move
focus to the list; hover and focus pause; success closes at about 4.0 s;
danger and action toasts stay past 8 s; under reduced motion the exit ends
in under 200 ms without waiting on `animationend`.

### Should Toast use DsCloseButton

Yes, now. Nothing blocks it and the DOM does not change.

- `toast/toast-close.ts` (`dsToastClose`) and `dsCloseButton size="xs"`
  render the same attributes: `type`, `data-ds="close-button"`, `data-size`,
  `data-tone="neutral"`, `data-emphasis="ghost"`, `data-shape="default"`,
  `aria-label`, and the `close` icon in `span[data-part=icon]`. Both match
  React's CloseButton (`a5/close.mjs`).
- Differences in `DsCloseButton` that do not change the output: it returns
  true from `isIconOnly()` (only affects emphasis from a ButtonGroup, fixed
  to ghost anyway), its `label` defaults to Close or إغلاق (Toast always
  passes `closeLabel`), it allows `a[dsCloseButton]`, and it injects the
  root provided `DsThemeService`.
- The swap, in `toast/toast.ts:21,82,86`:
  `<button dsCloseButton data-part="close" [label]="p.closeLabel" size="xs" data-radix-toast-announce-exclude="" (click)="close()"></button>`,
  import `DsCloseButton` in `TOAST_PARTS_IMPORTS`, delete `toast-close.ts`
  (its own header says to).
- Do Alert (`alert.ts:75`) and Banner (`banner.ts:104`) in the same order.
  Today they rely on a static `data-ds="close-button"` overriding the
  `data-ds="icon-button"` that DsIconButton's host binding writes, which is
  fragile. React uses `CloseButton` in all three (`Alert.tsx:117`,
  `Banner.tsx:171`, `Toast.tsx:97`). Callout and NotificationCenter have no
  close button in either framework.

## Cross-cutting notes

- **N-C1.** `scripts/gen-index.ts:127` makes the React slug from the
  folder name with `/([a-z0-9])([A-Z])/`, so `OTPField` becomes `otpfield`,
  while the Angular route and the contract `kebabCase`
  (`packages/contract-tests/src/lib.ts:91`) use `otp-field`. The React
  contract and shots therefore cannot find OTPField, and the Angular gallery
  heading reads "OtpField". The same split hits any name with an acronym.
  Lead file.
- **N-C2.** The contract suite has two gaps (ds-qa owned, for a later
  order): a component with no route is dropped silently (NumberField,
  ScrubInput give no line at all; it should print "no route"), and the
  `state-changes` keyboard check should assert the final state, which would
  have caught InlineEdit.
- **N-C3.** Seven components import `@angular/forms`, but
  `packages/angular/package.json` does not declare it; it resolves through
  `@angular/cdk`. It is on the allow list. Lead: add it. The builder reported
  this too.
- **N-C4.** `SplitButton`'s `action` output is a new mapped name; add it to
  frameworks.md with the others.
- **N-C5.** The `theme lang === 'ar'` test appears in Label and Link; React
  uses `startsWith('ar')` in both. One helper in `packages/shared` would stop
  the drift.
- **N-C6.** axe `landmark-unique` on the Banner and NotificationCenter demo
  pages in both frameworks: several sections share one name. Demo copy, not
  the components.
- **N-C7.** Zoneless tests need one frame after a key event before reading
  the DOM, and a host `[disabled]` in an `ngModel` test must be a signal to
  update. Harness detail, worth a line in the Angular test notes.

## What was not done

- A toast above an open dialog was not driven live: no gallery page has
  both. The blocker above rests on the code and on the builder's own report.
- Shots ran with `--no-verify` (single capture) to fit the time; no pair was
  near the limit.
- The screenshot matrix folders were restored after the compare, so this
  branch does not carry 70 MB of recaptured PNGs; the table for the scope is
  `pixels/compare.md`.
