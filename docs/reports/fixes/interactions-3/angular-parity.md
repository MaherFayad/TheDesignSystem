# Order 1.29: Angular parity lane

Angular follows this round's React DOM and behaviour changes from the
actions and navigation, fields and feedback, overlays and toasts, and
(already committed parts of) toggles and selection lanes. The 27 Angular
spec failures the lead saw on the full check are resolved: each came from a
shared helper or a React DOM change. The specs now expect the new shared
behaviour, and Angular renders the same DOM as React.

## Per component

| Component | Ported | Spec (fails before, passes after) |
| --- | --- | --- |
| Button | Last child `span[data-part=hit][aria-hidden]` (B10); `span[data-result-label]` with the result word inside the `result` part (N7). The leaving spinner already sat after the parts with no remount, so it needed no change. | `button.spec.ts`, `button-motion.spec.ts`, `button.round3.spec.ts` (part lists end in `hit`; result label text and place) |
| IconButton, CloseButton, CopyButton, FloatingActionButton, ToggleButton | `hit` part last (B10) | each component's spec: part lists; `close-button.spec.ts` new check |
| ToggleGroup item, SegmentedControl item | `hit` part last (React renders them through `ButtonRoot`) | `toggle-group.spec.ts`, `segmented-control.spec.ts` |
| FormSubmit | `hit` part last and the leaving spinner, as React's FormSubmit (a Button) | `form/form.parity.spec.ts` (new) |
| SegmentedControl | B14: `place` reads, then returns its writes; a slide runs in `inFrame` with `planSlide` and `planInk` (ends on the item's box, passes `indicator` so a hidden pill draws no ink), as React | `segmented-control.spec.ts`: the slide frames now start from the item's box (`-119px`, `-59.5px` in the fake layout; the old path gave `-120px`, `-60px`) |
| ToggleGroup | Already keeps its ink label apart from the track and calls `playInk` as React does: no change | (existing tab-slide spec) |
| Field | `placeFloatingLabel(root)` after every render while floating, a ResizeObserver on the children, both properties cleared on teardown or when floating turns off (B6); `new FollowGlide().watch(root)` unless the parent is `[data-ds=form]` (N12) | `field/field.parity.spec.ts` (new, 4 tests) |
| Field demo | Cases `floating` and `floating-arabic`, as React's demo | DOM diff 54 to 0 |
| Input | `variant` was already ported. Demo case `variant` added | DOM diff 19 to 0 |
| Form | `new FollowGlide().watchChildren(form)` (N12) | `field.parity.spec.ts` (the form watches its rows) |
| FormWizard | Checking is set only when a check is still pending two frames after Next or Send (N13) | `form-wizard.spec.ts`: no loading for a quick check; loading after two frames for a slow one |
| PasswordField | The text eases back from 0.6 (`TEXT_RETURN` through `playBeat`), in full and reduced motion (N11) | `password-field-motion.spec.ts` |
| Meter | `data-held` and `data-revealing` attributes, no inline transform or transition, no timer; the next value change drops `data-revealing` (N33) | `meter-motion.spec.ts` (3 tests) |
| Skeleton | The `--_skeleton-swap: none` off row swaps at once with no ghost (`styleTurnsOff`, N31) | `skeleton-motion.spec.ts` |
| ProgressCircle | The `--_progress-circle-duration` off row changes the text with no roll (N31) | `progress-circle-motion.spec.ts` |
| FilterBar | The flip groups see no items until the bar has settled two frames, so nothing plays on mount (as React, angular-sync-3 section 6 item 4) | `filter-bar.motion.spec.ts` (new test; the clear test waits two frames) |
| Toaster | `resolveToasterPosition` is `toasterPlacement` (every position is top centre on ios, B7); the swipe is `toasterSwipe`; the progress line mounts with a negative `animation-delay` from when the store showed that version (N29), fixed per version; `watchStack` was already shared (N44) | `toaster-motion.spec.ts`: ios expectation changed (`top-end` now `top-center`); 3 new tests |
| Dialog | A refused backdrop press prevents the `pointerdown` and `mousedown` defaults, so focus stays (B8) | `dialog-refuse.spec.ts` (2 new tests) |
| Checkbox | `data-enter` on the mark when it is drawn straight from unchecked (B5) | `checkbox.spec.ts` |
| Switch | While dragging, the root `data-state` shows the side the thumb is on and the control keeps `aria-checked` (B4); `data-released` from a release to the next press or key (N1) | `switch.round3.spec.ts` (2 new tests) |
| Select, Autocomplete, Combobox, MultiSelect, TagField | No code change: the shared `staggerRows` now fades every row with the surface and staggers only the rise (ten weakest #9). The specs replay `staggerRows` itself and expect two animations a row in full motion. | each `*.motion.spec.ts`; `internal/motion-selection.spec.ts` |

Fail-first proof: the pre-port Angular sources (commit 8aeb19b) were put
back in place, the specs run, and my versions restored. 33 specs failed, at
least one for each row above that changed code (log in the lane's
scratchpad, summarized here). Checkbox and Switch were proved the same way
by reading the old DOM (no `data-enter`, root `data-state` fixed during a
drag).

## Contract

`npx tsx packages/contract-tests/run.ts --framework angular --url <static
build on 5188> --component ...`, every touched component, 0 failed:

| Component | Passed | Skipped |
| --- | --- | --- |
| Button, IconButton, CloseButton, CopyButton, FloatingActionButton, ToggleButton, ToggleGroup, SegmentedControl, Field, Input, Form, FormWizard, PasswordField, Checkbox, Switch | 37 each | 0 |
| Dialog, Toast, Select, Combobox, MultiSelect | 57 each | 0 |
| Autocomplete, FilterBar, TagField | 37 each | 20 each |
| Meter, ProgressCircle, Skeleton | 36 each | 1 each |

Every touched manifest already had angular `ready`; none was changed.

## DOM diff

`docs/reports/shots/angular-sync-3/dom-diff.mjs`, React dev gallery on
5187, Angular static development build on 5188 (the dev server served stale
bundles while files changed). Evidence in
`angular-parity.dom-diff.json`. All 60 Angular components show 0 lines,
except:

- `checkbox-group` 10: React's select-all box first commits unchecked (its
  items register after mount), so its mixed mark carries `data-enter` at
  rest. Angular computes mixed on the first render. This is a React quirk,
  so Angular does not imitate it (see "Changes needed").
- `title-bar`, `window-controls`: no Angular `/c/` demo (known, angular-sync-3
  item 9).

## Proof

- `npm run check -w @the-system/angular`: ngc clean, 110 files, 743 tests
  passed.
- `npm run check`: every step passes except two, and neither is in this
  lane's files once one lane fix is made. eslint flagged one unused variable
  in `select.motion.spec.ts` (mine, fixed after the run; eslint on
  `packages/angular/src` is now clean). vitest has 2 failures outside this
  lane: `packages/lint/src/gates/forced-colors-fallback.test.ts`
  (`packages/css/src/platform/android.css:314`, a transparent switch thumb
  outline outside a focus selector, CSS lane) and
  `packages/lint/src/gates/no-native-title.test.ts` (5s timeout under load).
- Contract and DOM diff: above.

## Not ported

- Sheet, Drawer, AlertDialog, Popover, Tooltip: no Angular component.
- Tabs, Navbar, Pagination, Sidebar, Badge, Avatar, Stat: no Angular
  component (B1, the Navbar ink, the Avatar status off row).
- The toggles and selection lane report was not out when this lane ended.
  Its committed Checkbox (B5) and Switch (B4, N1) changes are ported. Any
  later change (the ToggleGroup label dip and others) still needs a pass.

## Changes needed from the lead

1. React Field skips its own glide when `parentElement` is
   `[data-ds="form"]`, but Form renders its children in
   `<div data-part="body">`. So the guard never matches inside a Form, and a
   Field there glides itself and is glided by the Form too. Angular keeps
   the same guard, so the DOM and behaviour match. A fix (for example
   `closest('[data-ds="form"] > [data-part="body"]')` or the parent's parent)
   belongs to the fields lane and then to both frameworks.
2. React CheckboxGroup select-all: `data-enter` at rest on mount (above).
   Either the box should treat its first committed state as its mount state,
   or Angular should copy the quirk. Lead's call.
3. `AGENTS.md` or `frameworks.md`: Angular unit tests run with `ng test`;
   plain `npx vitest run` in `packages/angular` fails to parse the specs.
