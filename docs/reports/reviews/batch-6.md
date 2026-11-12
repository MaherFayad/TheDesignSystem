# Review: batch 6, lanes 6A, 6B and 6C

Fresh eyes review by ds-qa of Dialog (after its bring up onto DialogBase),
AlertDialog, Drawer, Sheet (lane 6A), Popover, Tooltip, HoverCard, Tour (lane
6B), ContextMenu and Menubar (lane 6C), on branch `claude/ds-review-6`, cut
from `claude/relaxed-hypatia-7gseap`. No source file was edited. The lane
reports were read after the findings below were formed; where a finding
repeats a point they left open, it says so.

## Verdicts

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Dialog | fix needed | 1 | 2 |
| AlertDialog | pass | 0 | 1 |
| Drawer | pass | 0 | 3 |
| Sheet | fix needed | 1 | 3 |
| Popover | fix needed | 1 | 3 |
| Tooltip | pass | 0 | 2 |
| HoverCard | fix needed | 1 | 1 |
| Tour | fix needed | 1 | 3 |
| ContextMenu | pass | 0 | 1 |
| Menubar | pass | 0 | 3 |

`npm run check` is green. The contract command is green for nine of ten on
the first run and for all ten on a second run:

```text
npm run contract -- --framework react --component Dialog,AlertDialog,Drawer,Sheet,Popover,Tooltip,HoverCard,Tour,ContextMenu,Menubar
pass  AlertDialog: 44 passed, 0 failed, 0 skipped
pass  ContextMenu: 44 passed, 0 failed, 0 skipped
pass  Dialog: 44 passed, 0 failed, 0 skipped
pass  Drawer: 44 passed, 0 failed, 0 skipped
pass  HoverCard: 44 passed, 0 failed, 0 skipped
pass  Menubar: 29 passed, 0 failed, 15 skipped
FAIL  Popover: 43 passed, 1 failed, 0 skipped
      failed: anatomy, desk
pass  Sheet: 44 passed, 0 failed, 0 skipped
pass  Tooltip: 29 passed, 0 failed, 0 skipped
pass  Tour: 44 passed, 0 failed, 0 skipped

npm run contract -- --framework react --component Popover
pass  Popover: 44 passed, 0 failed, 0 skipped
```

The Popover failure ("trigger 4 Open popover on top adds no open
[data-ds=popover]") did not come back alone; it is a timing flake under the
load of ten components at once. Note for the contract suite owner: the
anatomy step should wait for the open root, not a fixed delay. The 15 Menubar
skips are the "open" target size and axe runs: a menubar has no
`[data-demo-trigger]`, and its open menu is covered by the `open` demo case.

## What holds across the batch

Checked in code and in Chromium against the React gallery, and not repeated
per component below:

- Anatomy: `data-ds` roots, own parts only, shared axis words, `data-state`
  values from the manifests, `ref` as a prop, rest props to the documented
  element, `"use client"` on every file with hooks.
- CSS: `@layer ds.base`, private `--_<component>-*` properties only, logical
  properties only, only `transform` and `opacity` animate, a reduced motion
  block that sets every animation to none, a forced colors block in every
  file, glass dropped under reduced transparency and more contrast (the Desk
  HoverCard and Tour recipes do it in `ds.recipes`, which is right, since the
  recipe layer wins).
- Portal theming: in all 140 combinations below, the portal Theme carries the
  same `data-style`, `data-scheme`, `data-density`, `data-contrast`,
  `data-platform` and `data-glass` as the page Theme, and `dir` and `lang`
  follow the case.
- Axe with the overlay open, WCAG 2.0, 2.1 and 2.2 A and AA tags: 0
  violations in 140 combinations (10 components, studio, desk and neutral,
  dark and light, English LTR and Arabic RTL at 1280px, plus neutral light at
  320px in both directions). Under emulated forced colors, the only
  violations are on the gallery's own headings (`h1`, `[data-demo=title]`),
  not on any component part.
- Reflow, WCAG 1.4.10: at 320px no combination scrolls sideways
  (`scrollWidth` equals `clientWidth`) and no overlay leaves the viewport.
- Nested layers and Escape order, checked in a scratch page with a Popover,
  a Tooltip, a DropdownMenu and a second Dialog inside a Dialog: each Escape
  closes only the top layer and returns focus to the control that opened it,
  then the next Escape closes the Dialog and focus goes back to its trigger.
- Focus trap: 14 Tabs in a Dialog with seven controls wrap and never leave.
- Toasts raised from inside a Dialog render above the backdrop and their
  buttons take a pointer click without closing the Dialog. F8 and Tab do not
  reach them while the Dialog is open; this is DECISIONS.md, Components 1,
  and is not reopened here (but see the Sheet blocker).
- Reduced motion: every panel and backdrop computes `animation-name: none`,
  the Sheet drag snaps with a 0s transition, and the Tour scrolls its target
  with `behavior: instant`.
- Copy, English: no "OK", "Continue", "Confirm" or "Yes" in any overlay of
  any demo. Arabic: the demo questions are white Saudi dialect ("تبي تحذف
  لوحة إطلاق الربيع؟"), the buttons are noun forms ("إبقاء اللوحة", "حذف
  اللوحة", "تخطي الجولة"), no diacritics.

## Findings

### Dialog: fix needed

- **blocker**: `packages/react/src/components/Dialog/Dialog.tsx:391`. Order
  1.6.1 says "Render CloseButton (1.1.9) as the close part". The close part
  is still an IconButton. The lane could not do it because CloseButton was
  not merged then (lane 6A report, "After CloseButton merges"). It is merged
  now (`7a372de`), so the one line change the lane wrote down is unblocked
  and the order is not done until it lands. The same line applies to
  `Drawer/Drawer.tsx:226` (Drawer and Sheet share it) and, outside lane 6A,
  `Popover/Popover.tsx:321`. Toast and Alert already use CloseButton, so
  today a toast close and a dialog close are two different components.
- note: `packages/react/src/components/Dialog/Dialog.demo.tsx:278`. "Install
  later" is a verb and an adverb, not a verb and a noun. Use "Skip
  update".
- note: three copies of the same Arabic test: `labelsFor` in
  `Dialog/Dialog.tsx:111`, `isArabic` in `Drawer/Drawer.tsx:55` and in
  `Popover/FloatingLayer.tsx:113`. One helper in `packages/shared` (or the
  existing CloseButton test, `lang.startsWith('ar')`) for all of them.

Verified: the focus rule (live, a neutral dialog with no field opens on its
footer action; the danger rule on Cancel through the unit tests), the Desk title bar with only the close light working
(`dialog-desk-dark-titlebar.png`), `dismissible={false}` disabling the close
control while Escape and the backdrop do nothing, the phone layout at 320px
(`dialog-phone-toast-clear-of-footer.png`: a toast raised from inside does
not cover the footer).

### AlertDialog: pass

- note: `packages/react/src/demo/index.tsx:111`. The long Arabic description
  of the alert dialog is the shared `sample.ar.long` filler, which talks
  about saving a file and sending it as JSON, under the question "تبي تحذف
  لوحة إطلاق الربيع مع كل الإطارات...؟" (`alert-dialog-arabic-filler-description.png`).
  An alert dialog's description is the consequence; a reviewer reading the
  demo learns the wrong pattern. The same filler sits in the Drawer, Tour and
  HoverCard long Arabic cases. Write a long Arabic sentence per component
  that fits the case, for example "اللوحة وكل الإطارات والتعليقات والملفات
  المرفقة فيها تنحذف نهائيا، وما تقدر ترجعها بعدين."

Verified: role alertdialog, focus on Cancel in both tones, Enter never runs
the action, no close part, no backdrop close, Escape cancels, `insteadUse`
points undoable actions to a Toast with an undo action. Every action names
its consequence ("Delete board", "Remove member", "Delete the workspace for
good").

### Drawer: pass

- note: `packages/react/src/components/Drawer/Drawer.tsx:51`. The Arabic close
  name "إغلاق اللوحة الجانبية" uses "اللوحة", the word the whole demo uses
  for a board ("حذف اللوحة" deletes a board). A screen reader user hears
  "close the side board". "إغلاق القائمة الجانبية" is wrong too (a list).
  Recommendation: "إغلاق الشريط الجانبي" for Drawer, or the plain
  CloseButton default "إغلاق" once the blocker above lands, since the drawer
  title already names what closes.
- note: `Drawer/Drawer.demo.tsx:243` and `Sheet/Sheet.demo.tsx:209`. "Close
  notes" sits next to the close control "Close drawer": two buttons that do
  the same thing. In a read only panel the footer action can go.
- note: the long Arabic description is the unrelated filler (see
  AlertDialog).

Verified: side end opens on the left under Arabic RTL and side start on the
right (`drawer-rtl-end-side.png`), full width under 480px, focus on the first
field, non modal: no backdrop, the page stays usable, an Escape typed in a
page field keeps the drawer open, an Escape in the drawer closes it and
focus goes back to the trigger.

### Sheet: fix needed

- **blocker** (WCAG 2.4.11 at its limit, 2.4.12 failed, and section 12 of
  PLAN.md: "Sticky and floating bars reserve scroll padding"): an error
  toast raised from a Sheet covers the Sheet footer. At 320px the toast
  covers 88% of the focused "Send invite" and 89% of "Close share"; at
  1280px it covers 90% of "Send invite" (`sheet-danger-toast-covers-footer-320.png`).
  The Toaster sits at `bottom-end` and the Sheet footer is pinned to the
  block end (`packages/css/src/components/Dialog.css:578`). Only a 4px strip
  under the toast is left, so the AA letter ("not entirely hidden") holds by
  4px. In practice it is worse: a danger toast never times out (DECISIONS.md,
  Components 1) and keyboard focus cannot reach it while the Sheet is open,
  so the footer stays covered until the person closes the Sheet with Escape
  and loses the task. Options, in the order I would ship them:
  1. While a Sheet is open, the Toaster moves to `top-center` (a data
     attribute on the Toaster layer set by DialogBase for kind `sheet`, read
     by `Toast.css`). No change to the toast store.
  2. The Sheet reserves the toast stack height as `padding-block-end` on its
     footer while toasts show. Harder: the height changes per toast.
  3. Document it in the Sheet manifest `mistakes` and leave it. Not
     acceptable for a component meant for phone layouts.
- note: `packages/css/src/components/Dialog.css:597`. The handle strip
  measures 23.97px tall (rem rounding of
  `(target-min - space-2xs) / 2 * 2 + space-2xs`). WCAG 2.5.8 is still met
  through its equivalent exception (the close control and Escape), and the
  handle is `aria-hidden`, so this is cosmetic; a `min-block-size:
  var(--ds-size-target-min)` would make it exact.
- note: `Sheet/Sheet.demo.tsx:42`. "Close share" is a verb and a noun, but
  "share" reads as a verb. "Cancel invite" or "Discard invite".
- note: the Arabic close name "إغلاق النافذة السفلية" is accurate. Keep it
  if Drawer keeps a specific name; otherwise the CloseButton default.

Verified: drag past a quarter closes, a short slow drag snaps back, the drag
never rises above the open place, focus returns to the trigger after a drag
close, no animation under reduced motion, the handle bar keeps its color
under forced colors (`sheet-forced-colors.png`), safe area padding on the
footer.

### Popover: fix needed

- **blocker** (manifest honesty, WCAG 2.1.1 keyboard map):
  `packages/manifest/src/component/Popover.manifest.json:89` says "Tab past its
  last control leaves the page content", and `Popover.tsx:24` says "Tab
  leaves the popover at its end". It does not. Radix Popover runs its focus
  scope with `loop` on even when not modal, so Tab wraps inside: in the
  `one` case, five Tabs stay on "Close popover"; in a popover with a field,
  Tab goes field, close, field, close. Lane 6B believed the opposite and
  fixed the manifest wording toward it. Two ways out:
  1. Keep the loop and say so: "Tab moves through the popover and wraps;
     Escape returns to the trigger". Cheapest, and honest. Not a 2.1.2 trap,
     since Escape is a standard exit.
  2. Make Tab past the last control close the popover and move focus to the
     element after the trigger (the WAI non modal dialog pattern), with a
     key handler on the content. Better for a non modal surface, more code.
  I would ship 1 now and 2 with Tour (below), since both need the same
  handler.
- note: `Popover/Popover.tsx:67`. The Arabic close name "إغلاق النافذة"
  (close window) is the Dialog's word; a popover is not a window. Use the
  CloseButton default "إغلاق", which the blocker on Dialog brings anyway.
- note: `Popover/Popover.demo.tsx`. The English cases are not wrapped in an
  English Theme, so under `lang=ar` the English title and fields carry
  `lang="ar"` and lay out right to left
  (`popover-demo-english-under-lang-ar.png`), against WCAG 3.1.2 in the
  gallery. Dialog, Drawer and Sheet demos wrap their English cases; Popover
  and Tour do not.
- note: the contract flake above (anatomy, desk).

Verified: focus on the first field, else the first footer action, else the
root; Escape and the close control return focus to the trigger; the
untitled case is named by `aria-label` ("Layer options"); side start opens
on the right in RTL.

### Tooltip: pass

- note: `Tooltip/Tooltip.tsx:248`. The shortcut is text in a `bdi`. Order
  1.6.6 says "a Kbd root once 1.9.5 exists"; Kbd is merged now (`e92dc00`).
  The swap is one element.
- note: the IconButton change the order asked for is written up in lane 6B's
  report ("IconButton shows its label in a Tooltip by default") and is not
  applied: `IconButton/IconButton.tsx:24` still says the pairing "arrives
  with Tooltip". The lead should route it.

Verified, WCAG 1.4.13: hoverable (the pointer moved from the trigger onto
the tooltip keeps it open), dismissable (Escape closes it whether the
pointer is on the trigger or on the tooltip, and it does not come back while
the pointer stays), persistent until hover or focus leaves. Escape inside a
Dialog closes only the tooltip. Opens at once on focus. A hint equal to the
IconButton label is not also wired as the description.

### HoverCard: fix needed

- **blocker** (WCAG 1.4.13, dismissable):
  `packages/react/src/components/HoverCard/HoverCard.tsx:123`. Keyboard focus
  opens the card at once through `ctx.setOpen(true)`, but the Radix trigger
  handler still runs after it and starts its own `openDelay` timer. An
  Escape pressed before that timer fires closes the card, then the timer
  opens it again. With the default `openDelay` of 500ms: Escape at 200ms or
  300ms after focus, card open again 900ms later; Escape at 1000ms, card
  stays closed (`hover-card-escape-undone-by-open-delay.png`). The gallery
  and the unit test (`HoverCard.test.tsx:77`) both use `openDelay={0}`, so
  neither sees it. Fix: call `event.preventDefault()` after `setOpen(true)`
  in the focus handler (Radix `composeEventHandlers` then skips its own), or
  clear the open through a controlled `open` that ignores Radix's late
  `onOpenChange(true)` after an Escape until the next focus or hover. Add a
  test with `openDelay={500}`, focus, Escape at once, advance timers 600ms,
  expect closed.
- note: the long Arabic body is the unrelated filler (see AlertDialog).

Verified: links inside the card get `tabindex="-1"`, so the card adds no
tab stop and never holds the only path to a link; hover close delay works;
`insteadUse` points interactive content to Popover.

### Tour: fix needed

- **blocker** (order 1.6.13 "never blocks the page", manifest honesty):
  `packages/manifest/src/component/Tour.manifest.json:65` says Tab moves
  "then out to the page (not modal, no trap)". Tab wraps inside the panel:
  Next or Finish, then Skip, then Next again (`tour-tab-loops-inside-panel.png`).
  The cause is the same Radix Popover loop as Popover. With focus moved
  into the panel on every step, a keyboard user cannot reach the page while
  the tour is open, except by ending it; a pointer user can. That is the
  blocking the order rules out. Fix: on Tab from the last control (and Shift
  Tab from the first), let focus leave to the step's target, which is the
  natural next place, and keep the tour open; the manifest then stays as
  written.
- note: `Tour/Tour.tsx:111`. Step state is still the local `clampStep`.
  `packages/shared/src/stepper.ts` is merged (`1555f74`), and the order says
  state comes from it. Lane 6B wrote the swap down.
- note: an Escape anywhere on the page ends the tour, also one typed to
  clear a search field (the Tour test at line 124 keeps focus in the field,
  which is right, but the tour still ends). Drawer, also non modal, keeps
  itself open for an Escape in a page field. One rule for both would be
  clearer; I would take Drawer's.
- note: `Tour/Tour.demo.tsx`. English cases are not wrapped in an English
  Theme (see Popover), and the long Arabic body is the filler.

Verified: the ring follows the target on scroll and resize, focus goes to
the panel on every step and back to the starter on Escape, Skip is on every
step, no dimmed page, the last step reads "Finish tour", the target scrolls
without motion under reduced motion, no ring and no arrow when the target is
missing.

### ContextMenu: pass

- note: `ContextMenu/ContextMenu.tsx:161`. On a browser that already sends a
  `contextmenu` event for Shift+F10 or the Menu key, the trigger prevents the
  keydown and sends its own event; whether the native event still follows
  could not be checked here (headless Chromium on Linux sends none). Lane 6C
  left the same question open for Windows Chrome. Worth one manual check.

Verified: Shift+F10 and the Menu key open the menu at the item's inline
start and block end corner, in RTL too (the menu's right edge at 1260 for
an item ending at 1262); arrows move through items; Escape returns focus to
the item; Tab stays in the menu as the manifest says; each demo item has a
"More actions" DropdownMenu with the same actions, stated in `avoidWhen`.

### Menubar: pass

- note: `Menubar/Menubar.tsx:157`. Rest props spread onto the inner Radix
  root (part `bar`), while `className` and `style` go to the outer root.
  `aria-label` belongs on the bar, so this is deliberate, but convention 8 of
  `anatomy.md` says props spread onto the root. Say it in the props comment
  and the manifest, or split `barProps`.
- note: `Menubar/Menubar.demo.tsx:298`. The demo case `open` is not in the
  case list of `anatomy.md` ("variants, empty, one, ...").
  Either add it to the contract or rename it to an existing id.
- note: the order's anatomy listed a `menu` part; the manifest has `bar` and
  `text` instead. The structure is sound (the bar is the menubar role, the
  root also holds the `end` slot outside it), and the lane said why; the
  order text should follow.

Verified: one tab stop for the row, ArrowLeft and ArrowRight follow reading
direction (under `dir=rtl` ArrowLeft moves to the next title), ArrowDown
opens, arrows move between open menus, Escape returns focus to the title,
the open title is shown by fill and weight, and under forced colors by
Highlight (`menubar-rtl-forced-colors.png`). Desk reads
`color.material.menubar`.

## Not a finding, recorded for the lead

- Three carry overs are unblocked now that their dependencies merged:
  CloseButton in Dialog, Drawer, Sheet and Popover (`7a372de`); Kbd in the
  Tooltip shortcut (`e92dc00`); Tour on `stepper.ts` (`1555f74`). Route them
  together.
- Lanes 6B and 6C could not read GoBanana. Popover, Tooltip, HoverCard,
  Tour, ContextMenu and Menubar follow Figma-Killer-2, the dials table and
  the tokens. A pass against GoBanana is still owed before gate 1.
- Toasts above a modal are not reachable by keyboard by decision. The Sheet
  blocker shows the cost of that decision is highest on phones, where the
  toast and the footer share the bottom edge.

## How this was checked

- `npm install`, `npm run check`: green.
- `npm run contract -- --framework react --component Dialog,AlertDialog,Drawer,Sheet,Popover,Tooltip,HoverCard,Tour,ContextMenu,Menubar`,
  then Popover alone: results above.
- React gallery on port 5191, Chromium headless through Playwright from node
  scripts in the scratchpad:
  - every overlay opened in studio, desk and neutral, dark and light,
    English LTR and Arabic RTL at 1280 by 800, plus neutral light at 320 by
    640 in both directions: a screenshot, axe with the overlay open, the
    portal Theme axes against the page Theme, `scrollWidth` and the overlay
    box (140 runs);
  - the same in neutral with `forcedColors: 'active'` (40 runs);
  - the copy of every button in every overlay of every demo case, in both
    page languages;
  - a scratch page (not committed) with a Popover, Tooltip, DropdownMenu,
    nested Dialog and two toast buttons inside a Dialog, a non modal Drawer,
    a HoverCard, a Tour and a Sheet that raises a danger toast: Escape
    order, focus return, the focus trap, toast hit testing and keyboard
    reach, focus obscured measurements at 320 and 1280;
  - HoverCard Escape at 100, 200, 300, 700, 1000 and 1200ms after focus,
    with `openDelay` 0 (gallery) and 500 (default);
  - Tooltip hover onto the tooltip and Escape with the pointer still on it;
  - Popover and Tour Tab and Shift Tab sequences;
  - ContextMenu Shift+F10, Menu key, arrows, Escape and Tab, LTR and RTL;
  - Menubar arrows, Escape and Tab in an English and an Arabic bar;
  - Sheet handle drag with the mouse, with and without reduced motion.
- Screenshots: `docs/reports/reviews/shots/batch-6/`.
