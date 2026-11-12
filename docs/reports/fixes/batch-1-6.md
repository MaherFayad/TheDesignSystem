# Fix round: reviews batch 1-2, 3-4 and 6

Branch `claude/ds-fix-1-6`, cut from `claude/relaxed-hypatia-7gseap`. One
commit per component (`fix: <Component>`), pushed after each. A fresh eyes
review of the whole diff ran once (ds-qa); its findings were fixed in a
second commit for ToggleButton, Tour and Sheet.

`npm run check` is green on the final tree. The contract run is green, 0
skipped, for ToggleButton, RangeSlider, Rating, Combobox, Dialog,
AlertDialog, Drawer, Sheet, Popover, HoverCard, Tour, FormWizard, Link,
Label, ButtonGroup, DropdownMenu and Switch. OTPField still skips on the
committed tree because of its gallery slug (blocker 2 below); with the slug
fix applied locally and reverted, it passes 29 of 29.

## Blockers

| # | Review | Component | Status | Fix | Test that catches it |
| --- | --- | --- | --- | --- | --- |
| 1 | 1-2 | ToggleButton | fixed | `Button.css` forced colors block: `forced-color-adjust: none` on a pressed toggle and its descendants, Highlight fill, HighlightText label, border and inner ring. Review round: the focus ring is CanvasText and a disabled pressed toggle is GrayText. Shot: `shots/wave-1/toggle-button/toggle-button-forced-colors-studio-dark.png` | `ToggleButton.test.tsx`, forced colors rule |
| 2 | 1-2 | OTPField slug | not fixed, lead | `scripts/gen-index.ts` is root tooling. Exact change under "Changes needed from the lead" | contract run with the patch: 29 passed |
| 3 | 1-2 | OTPField reflow | fixed | `min-inline-size: 0` on the root, so the cells shrink in a flex or grid parent. The demo grid column also was a fixed 22rem (352px), wider than a 320px screen; it is now `min(100%, 22rem)`. `scrollWidth` 320 at 320px in Studio, Desk and Neutral, LTR and RTL | `OTPField.test.tsx`, reflow |
| 4 | 3-4 | RangeSlider | fixed | The focused thumb's Radix wrapper is lifted (`:has(> [data-part='thumb']:focus)`), inside an isolated control. Radix focuses a thumb on pointer down too, so the pressed thumb is the one on top. The demo keeps the thumb centers 24px apart at 320px (`minStepsBetweenThumbs={3}` in the year case, 100 SAR apart in the error case). axe at 320px: 0 violations, Neutral light RTL and Studio dark LTR | `RangeSlider.test.tsx`: every demo slider measured against a 320px track, and the lift rule |
| 5 | 3-4 | Rating | fixed | Default names follow the Theme language: "3 من 5 نجوم", "4.5 من 5 نجوم", "بدون تقييم". The test is `startsWith('ar')`, so `ar-SA` works. The demo no longer passes Arabic labels by hand | `Rating.test.tsx`, Arabic Theme with no labels |
| 6 | 3-4 | Combobox | fixed | `contract.trigger` is `[data-ds='combobox'] [data-part='trigger']`. With the trigger the generic Tab check expected a tab stop in the open popup, which the design rules out (focus stays in the input), so a `contract.keys.Tab` hint was added. Contract: 44 passed, 0 skipped (was 29 and 15) | `Combobox.test.tsx`: the manifest trigger exists in the demo |
| 7 | 6 | Dialog | fixed | The close part is CloseButton in Dialog, Drawer, Sheet and Popover | Dialog, Drawer, Sheet and Popover tests check `data-ds="close-button"` |
| 8 | 6 | Sheet | fixed, one limit left | While a Sheet is open, a bottom toaster moves to the top edge and stacks as the top positions do (a `:root:has()` rule in `Dialog.css`). Measured: at 320 by 640 the toaster goes from 544 to 624px down to 16 to 96px; the footer starts at 579px. It returns when the Sheet closes. Limit: a size `lg` Sheet fills the screen, so there a top toast can cover the title and close part. The lasting fix belongs in the toast layer, see below | `Sheet.test.tsx`, the rule |
| 9 | 6 | Popover | fixed (option 1) | The manifest and the code comment now say Tab wraps inside the popover and Escape returns to the trigger. Option 2 (Tab leaves) was not taken: the review advised 1 now | `Popover.test.tsx`: six Tabs stay inside, and the manifest says "wraps" |
| 10 | 6 | HoverCard | fixed | The focus handler calls `preventDefault()` after `setOpen(true)`, so Radix skips its own handler and its `openDelay` timer never reopens the card after an early Escape | `HoverCard.test.tsx`: `openDelay={500}`, focus, Escape, 600ms, closed. Fails on the old code |
| 11 | 6 | Tour | fixed | A capture phase Tab handler (Radix FocusScope overrides a plain `onKeyDown`): Tab past the last control, or Shift+Tab from the first control or the panel, moves focus to the step's target and the tour stays open. A target that takes no focus gets `tabindex="-1"`; with no target, focus goes to the element that started the tour; Tab is cancelled only when focus really moved | `Tour.test.tsx`: two tests. Fails on the old code |

## Notes fixed (a few lines each)

- Popover: Arabic close name "إغلاق" (was "إغلاق النافذة").
- Drawer: Arabic close name "إغلاق الشريط الجانبي" (was "إغلاق اللوحة الجانبية", the board word).
- Dialog demo: "Install later" is now "Skip update".
- Sheet demo: "Close share" is now "Discard invite".
- Combobox manifest: `a11y.focus` says `data-state` is on the popup part.
- FormWizard: `aria-label` goes to the Stepper only when `stepsLabel` is set, so the list keeps the name "Steps". Test added.
- Link and Label: the Arabic test is `startsWith('ar')`, so `ar-SA` gets Arabic. Tests added.
- ButtonGroup manifest: `slots.root.min` is 2.
- DropdownMenu: the disabled item comment matches Radix and the manifest.
- Switch demo and manifest: Arabic state pair "مفعل" and "غير مفعل".

Notes left open: the rest of the notes in the three reviews (language
defaults for SearchField, PasswordField, InlineEdit and FloatingActionButton,
CopyButton re-announce, SplitButton group name, Slider track and marks,
RadioGroup target pattern, ListBox notes, Tooltip Kbd, Tour on
`stepper.ts`, the Arabic filler copy). Each takes more than a few lines or
touches shared copy.

## Decisions

- Rating digits stay Western in Arabic ("3 من 5 نجوم"), not formatted with
  Intl into Arabic Indic digits. AGENTS.md and the lane brief require
  Western digits in Arabic copy. The review asked for the count "formatted
  for the language"; this reads it as the words, not the digits.
- Popover keeps the Radix Tab loop (review option 1). Tour lets focus leave
  because its order says it never blocks the page.
- Sheet: the toaster move lives in `Dialog.css`, because Toast.css is not
  in this round's ownership. It writes `inset-block-*` and `flex-direction`
  on the toaster root and its toasts' private `--_toast-enter-y`. That is
  outside the "a parent restyles a nested component through private
  properties" rule, since the toaster is not nested. See the request below.

## DOM changes (for the Angular port)

1. Dialog, Drawer, Sheet and Popover: the close part is now
   `data-ds="close-button" data-part="close"` (was `data-ds="icon-button"`).
   Its default name rules are unchanged except Popover Arabic ("إغلاق") and
   Drawer Arabic ("إغلاق الشريط الجانبي").
2. Tour: on Tab out of the panel, a target that takes no focus gets
   `tabindex="-1"` set on it (page content, not a Tour part).
3. FormWizard: no `aria-label` attribute on the step list when `stepsLabel`
   is not set; Stepper's default applies.

No part or state attribute was added or renamed.

## Token requests

- `z.raised`, value `1`: a local lift inside an isolated stacking context
  (the focused RangeSlider thumb). Today the rule borrows
  `--ds-z-canvas-selection` (51); any value works inside the isolated
  control, but the name is wrong. `calc(var(--ds-z-canvas) + 1)` is read as
  a raw value by `ds/no-raw-value`.

## Changes needed from the lead

1. `scripts/gen-index.ts:127`, the gallery slug, so `OTPField` gives
   `otp-field` as `kebabCase` in `packages/contract-tests/src/lib.ts` does:

   ```ts
   const slug = name.replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
   ```

   Verified locally (and reverted): `npm run gen`, then the OTPField
   contract passes 29 of 29. Consider failing, not skipping, a ready
   component with no route.
2. Toast layer, for the Sheet blocker in full: move the rule from
   `Dialog.css` into `Toast.css` keyed on an attribute DialogBase sets (for
   example `data-sheet-open` on the toaster), or route it to the Toast
   owner. For a size `lg` Sheet the top edge is covered too, so the toast
   needs another answer there: reachable by keyboard while a Sheet is open
   (reopens DECISIONS.md, Components 1, owner call) or a danger toast that
   docks above the Sheet footer.
3. The `z.raised` token above, then swap it in `RangeSlider.css`.
4. `packages/manifest/manifests.gen.json` is regenerated and committed with
   this report; regenerate on merge.
