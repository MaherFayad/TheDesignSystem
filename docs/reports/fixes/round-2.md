# Fix round 2

Branch `claude/ds-fix-round-2`, cut from `claude/relaxed-hypatia-7gseap` at
`ea9fc4e`. Source: `docs/reports/reviews/round-2.md`. Round 2 of 3 for these
components.

All six items are fixed. Each one has a test that fails on the old code,
and `npm run check` is green after every commit. The contract run is green
for Sheet (44 passed), Breadcrumbs (44 passed), Switch (29 passed), OTPField
(29 passed, 0 skipped) and Spinner (28 passed, 1 skipped: keyboard map, no
keys).

| Item | Finding | Result |
| --- | --- | --- |
| 1-2 | OTPField gallery slug (not fixed in round 2) | already fixed on this tree; guard test added |
| 6, C1 | Sheet: a toast on the top edge covers "Close sheet" on an lg Sheet (WCAG 2.4.11) | fixed |
| 7, B1 | Breadcrumbs: hover on a cut off step at 320px wraps it away from the pointer (WCAG 1.4.13, 1.4.10) | fixed |
| D1 | `pauseLoops` cannot reach the component CSS loops (WCAG 2.2.2) | fixed in `core.ts`; pause controls in components are still order 1.21 |
| lead | Switch: label and state text run together ("Snap to gridOn") in the sizes case | fixed; the fault was RTL only |

## OTPField: already fixed

`22040dc` (wo-1.0.6) changed `scripts/gen-index.ts`, so the slug is now the
same kebab case as `data-ds`. Proof on this tree:

- `apps/gallery-react/src/routes.gen.ts:70` has `slug: 'otp-field'`.
- In Chromium, `/c/otp-field` renders 11 `[data-demo-case]`, and the old
  `/c/otpfield` renders 0.
- `npm run contract -- --framework react --component OTPField`: 29 passed,
  0 failed, 0 skipped. The review saw OTPField skipped.

Test: `OTPField.test.tsx`, "has a gallery route at its data-ds name". It
reads `routes.gen.ts` and fails on the old `slug: 'otpfield'`.

Commit `0a0d54f`.

## Sheet: the toast covered the close control on an lg Sheet

Cause: while a Sheet is open, a bottom toaster moves to the top edge
(`Dialog.css`). An lg Sheet reaches the top edge, so the toast lay over its
header.

Fix: `SheetContent` measures where the toasts of any toaster on the top
edge end. It sets `--_sheet-toast-end` (in px) inline on the Sheet root
while they show. The root's top padding becomes
`max(space.5xl + safe area, --_sheet-toast-end + space.s)`, so a panel of
any size, with its close control, stays below the toasts. The private
property is declared as `0px` on the root.

- The measure runs at most once per frame. It runs only after changes that
  add or remove a toaster or a toast, a toaster resize, or a window resize.
- The value is capped at half the window height, so a tall stack of toasts
  on a short screen cannot squeeze the panel away (WCAG 1.4.10).
- A toaster in the lower half is ignored.
- The value is cleared when the toasts go and when the Sheet closes.

Measured in Chromium with a toaster injected (the gallery mounts none),
studio dark:

| Viewport | Size | Close control covered, before | After |
| --- | --- | --- | --- |
| 1280 by 800 | lg | 100% | 0% (panel top 23 to 84px) |
| 320 by 640 | lg | 88% | 0% (panel top 20 to 82px) |
| both | sm, md | 0% | 0% |

Test: `Sheet.test.tsx`, "keeps the panel below toasts on the top edge". It
covers a toast added and removed, a bottom toaster that is ignored, a close
while a toast shows, and the padding rule. It fails on the old
`Sheet.tsx`.

Shots: `docs/reports/shots/fix-round-2/sheet-lg-toast-studio-dark-1280.png`,
`-desk-light-320.png`, `-desk-dark-rtl-320.png`.

Commits `909cec7`, `c9df3d3`.

## Breadcrumbs: hover at 320px did not hold

Cause: the hover rule set `max-inline-size: 100%`. The step grew wider than
its place in the row and wrapped onto the next row, out from under the
pointer. It then lost hover and collapsed. Under a moving pointer this
repeated on every frame.

Fix: the hover and focus rule no longer changes the width. The step keeps
its truncated width (`--_breadcrumbs-item-max`), wraps in place and grows
downward only. Its first line stays under the pointer. The list now aligns
its steps to the start (`align-items: flex-start`), so the other steps of
the row stay put while one grows. At rest every step is the same height,
and the item centers match at 1000px.

Measured in Chromium at 320px, pointer moved 20 times over "Quarterly
planning...":

| Theme | Before | After |
| --- | --- | --- |
| studio dark LTR | 20 enters and 20 leaves, `:hover` false | 1 enter, `:hover` true, 200 by 48, scrollWidth equals clientWidth |
| neutral light RTL | the same | 1 enter, 200 by 72, whole text shown |
| desk light LTR | the same | 1 enter, 200 by 48 |

Keyboard focus at 320px: 200 by 48, whole text shown, page width 320.

The step now wraps at 200px at every width, where before it widened to the
row on hover. This look change is on purpose: it is the only form that
cannot move the step to another row.

Test: `Breadcrumbs.test.tsx`, "a hovered or focused step shows whole: it
wraps in place, at its own width". It checks that the hover rule sets no
width or flex, that the cap rule keeps `--_breadcrumbs-item-max`, and that
the list is start aligned. It fails on the old CSS. It reads the CSS, as
the old test did; a browser hover check needs the shared contract suite
(see the lead list).

Manifest: the a11y note now says the step wraps in place.

Shots: `breadcrumbs-hover-320-studio-dark.png`, `-neutral-light-rtl-ar.png`,
`-desk-light.png`, `breadcrumbs-focus-320-studio-dark.png`,
`breadcrumbs-variants-1000-studio-dark.png`.

Commits `49d03b8`, `207982d`.

## Motion loops: pauseLoops reached no component loop

`packages/motion/src/core.ts`. I edited this file because D1 names it.
Another session is adding motion, so the change is kept to the
`loopsUnder`, `pauseLoops` and `resumeLoops` block and one doc comment.

- `loopsUnder` now also takes any animation with infinite iterations, not
  only `ds-motion:` ids. That includes the id less CSS spinners.
- `pauseLoops` remembers what it paused (a WeakSet). `resumeLoops` plays
  only those, so a loop the CSS paused on purpose stays paused.
- A loop that starts after the pause is a new Animation: a spinner that
  mounts, or a CSS animation that restarts. While a root is paused, one
  capture listener for `animationstart` on its document pauses each new
  loop under it. `resumeLoops` removes the listener once no root is paused.
  The fresh eyes review raised this as a blocker; it is fixed.
- The doc comments say that `pauseLoops(document)` reaches every endless
  animation on the page, and that `resumeLoops` plays over a later CSS
  pause. The `settled()` comment says never to await a loop (review D4).

Chromium, the real `core.ts` through Vite, `pauseLoops(document)` then
`resumeLoops(document)`:

| Route | Loops | Paused | Still for 300ms | Resumed |
| --- | --- | --- | --- | --- |
| spinner | 36 | 36 | yes | 36 |
| button | 6 | 6 | yes | 6 |
| icon-button | 5 | 5 | yes | 5 |
| floating-action-button | 2 | 2 | yes | 2 |
| split-button | 2 | 2 | yes | 2 |
| search-field | 1 | 1 | yes | 1 |
| select | 1 | 1 | yes | 1 |
| multi-select | 1 | 1 | yes | 1 |
| combobox | 1 | 1 | yes | 1 |
| progress-circle | 7 | 7 | yes | 7 |
| progress-bar | 5 | 5 | yes | 5 |

On `/c/spinner`, after the pause I added one spinner and restarted another.
Running while paused: 0 of 37. After the resume: 37 of 37 running.

Tests (`play.test.ts`):

- "pauseLoops also pauses the endless CSS loops components play" (review
  D2): an id less infinite loop is paused, a single run fade is not, and a
  loop the CSS held stays paused on resume.
- "a loop that starts while its root is paused is paused as it starts".

Both use fake animations; the browser numbers above are the behavior proof.

Still open from D1: no component has a pause control yet. That is order
1.21, as the review says.

Commits `cd03bb0`, `b91f413`.

## Switch: "Snap to gridOn"

Cause: the gap is there in LTR (5.5px, `margin-inline-start` on the state
text). On an RTL page, the English label "Snap to grid" and the state text
"On" joined one left to right bidi run. "On" sat against "grid" with no
gap, and its inline start margin, which is the right side in RTL, landed on
the far side next to the switch. Arabic labels were fine.

Fix: `unicode-bidi: isolate` on `[data-part='state-text']`. The state is now
its own run, placed in the switch's direction with the margin between it and
the label.

Gap between the label's last glyph and the state text, sizes case:

| Theme | Before | After |
| --- | --- | --- |
| studio dark LTR | 5px | 5px |
| desk light LTR | 5px | 5px |
| desk dark RTL, English rows | text joined, margin on the far side | 5px |
| neutral light RTL, English rows | text joined | 7px |
| Arabic row, all | 5 to 7px | 5 to 7px |

Test: `Switch.test.tsx`, "the state text is its own bidi run". It checks the
DOM place of the state text and the isolate in the CSS, and fails on the
old CSS.

Shots: `switch-sizes-studio-dark.png`, `-desk-light.png`,
`-desk-dark-rtl-ar.png`, `-neutral-light-rtl-ar.png`.

Commit `5f1aa5b`.

## DOM changes

- Sheet: while toasts show on the top edge, the root (`data-ds="sheet"`)
  carries an inline style `--_sheet-toast-end: <n>px`. Nothing else
  changed. The Angular Sheet needs the same measurement to match. The CSS is
  shared, so without it the Angular lg Sheet keeps the old overlap.
- Breadcrumbs, Switch, OTPField, motion: no DOM change.

## Fresh eyes review

One subagent (claude-opus-5-5, medium) read the diff. It found one blocker
and nine notes.

Fixed:

- The blocker: loops that start after a pause.
- The per mutation measure, now batched to a frame and filtered.
- No cap on the gap, now half the window height.
- Breadcrumbs row re-centering.
- The truncation cap assertion.
- The Sheet close and bottom toaster test cases.
- The doc comment on what `pauseLoops` reaches.

Left as notes:

- When the gap exceeds `space.5xl`, sm and md Sheets shrink a little while
  a toast shows. The lg panel resizes in one step when a toast comes and
  goes. This costs a reflow, not content.
- A toaster that only changes position, with no resize or DOM change, is
  not re-measured. Today the move to the top happens in the same commit as
  the open, before the first measure.
- The motion and Switch tests are structural (fakes, CSS reads). The
  browser runs above are the behavior proof.

## Changes needed from the lead

1. `packages/contract-tests/src/contract.spec.ts:99`: fail, do not skip, a
   component whose manifest says react ready when `/c/<kebab>` renders no
   demo case (review C3). This is what hid the OTPField slug.
2. Browser checks in the contract suite, which I do not own:
   - Breadcrumbs: at 320 by 640, move the pointer over a truncated step 10
     times and expect one `pointerenter` and `:hover` true at the end.
   - Sheet: inject `[data-ds='toaster'][data-position='bottom-end']` with a
     toast while an lg Sheet is open, and expect 0% overlap with
     `[data-part='close']` at 1280 by 800 and 320 by 640. The scripts I used
     are described in the sections above.
3. Mount a Toaster in the gallery, or give the Sheet demo a case that raises
   a toast, so the suites can see this without injection.
4. The lasting toast fix is still in the toast layer: toasts reachable while
   a modal is open, and the toaster move rule moved from `Dialog.css` into
   `Toast.css` behind an attribute DialogBase sets (review C2, fix report
   lead change 2). When that lands, `useTopToastEnd` in `Sheet.tsx` can read
   the same attribute.
5. Angular: port the Sheet toast measurement (the DOM change above).
6. Motion: I edited `packages/motion/src/core.ts` (the loops block only).
   Tell the motion session, or merge this branch before theirs.

No token requests.
