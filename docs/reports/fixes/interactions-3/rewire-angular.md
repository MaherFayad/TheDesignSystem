# Order 1.29: Angular rewired onto the shared motion helpers

Angular now imports every framework free motion helper from
`@the-system/motion` (`packages/motion/src/helpers/`). The Angular copies are
gone. `packages/angular/src/internal/` keeps only what needs an injection
context or Angular signals. Scope: `packages/angular/src/**` only.

## What changed

Deleted, now imported from `@the-system/motion`:

- `internal/nav-ink.ts` (SegmentedControl, ToggleGroup)
- `internal/toast-stack.ts`, `internal/toast-swipe.ts` (Toaster)
- `internal/slider-fill.ts` (Slider)
- `internal/toggles-motion.ts` (ToggleButton)
- `internal/motion-feedback.ts`. Every part of it was framework free:
  `dismissWithExit`, `ghostOf`, `placeOf`, `fadeAway`, `DigitRoller`,
  `popMark`, `Celebrate`, `haloBurst`, `FlipList`. No Angular wiring was
  left, so the file went.

Trimmed to Angular wiring only:

| File | Keeps |
| --- | --- |
| `internal/toggles-switch-drag.ts` | `SwitchDrag` class (pointer events, `dragging` signal, click swallow). It calls `beginSwitchDrag`, `pastSlop`, `followPointer`, `clearDragProgress`, `releaseChecked`, `SWALLOW_CLICK_MS` |
| `internal/motion-fields.ts` | `errorShake` (on `ErrorShaker`) and `digitLayer` (on `digitLayerControl`), both in an injection context |
| `internal/selection-marker.ts` | `injectHighlightMarker` |
| `internal/motion-selection.ts` | `injectRowGlide`, `injectFlipGroup`, `openStaggered` with `StaggerLayer`, `injectPopupResults` with `ResultsLayer` (now on `POPUP_RESULTS`) |
| `internal/indicator.ts` | `injectHoverFollow` |

Local copies removed from components:

- `select/select.ts`: `rollValue` (the shared one, same code)
- `skeleton/skeleton.ts`: `wipeAway`
- `meter/meter.ts`: `landValue`
- `stepper/stepper.ts`: `drawCheck` and `CHECK_LENGTH`, now `drawStepCheck`
- `slider/slider-base.ts`: `keyEnd`, `ROLL_GAP` and the `SliderEnd` type,
  now `sliderKeyEnd`, `SLIDER_ROLL_GAP` and `SliderEnd`

Renames: `rubberBand` is now `sliderRubberBand` (slider), `swipeRubberBand`
(toaster) or `switchRubberBand` (switch spec). `glide` is now `sliderGlide`
in the slider (with `SliderGlideState`), and `glideRow` in the selection
helpers. Nothing in Angular called the indicator's `between` outside the
moved file. The shared file calls it `rectBetween`.

Specs: deleted `internal/nav-ink.spec.ts` and `internal/motion-feedback.spec.ts`
(all pure, covered by `packages/motion/src/helpers/nav-ink.test.ts` and
`feedback.test.ts`). `internal/motion-selection.spec.ts` keeps the
`openStaggered` test only. `internal/motion-fields.spec.ts` keeps the two
`errorShake` TestBed tests only. `internal/indicator.spec.ts` and the
component specs now import from `@the-system/motion`.

Header comments that said "copy of" or "move them into packages/motion" are
rewritten. Comments that named the deleted files (alert, banner,
progress-circle, notification-center, segmented-control, toggle-group,
toaster) now name the helper in `@the-system/motion`.

No barrel, manifest, CSS or React file was touched. No public export
changed: `rollValue`, `wipeAway`, `landValue` and `drawCheck` were exported
from component files but not from any component `index.ts`.

## Resolved differences, checked in the Angular gallery

A Playwright probe ran against the Angular gallery (`ng serve`, the
`/interactions?focus=<id>&style=neutral&scheme=light&chrome=0` stage), in LTR
and RTL (`&dir=rtl&lang=ar`), at page zoom 1 and 1.5 (CSS `zoom` on `<html>`,
set before the first render). Largest gap between the motion copy and what
it stands for, in drawn px:

| Check | Stage | Zoom 1 | Zoom 1.5 |
| --- | --- | --- | --- |
| Digit layer placement (React's layout offsets, physical `left` and `top`) | `field-step` (NumberField) | 0.13 | 0.5 |
| Digit layer placement | `scrub-roll` (ScrubInput) | 0.48 | 0.72 |
| `snapshot` with React's zoom factor | `search-clear` (leaving copy of the clear button) | 0.08 | 0.58 |
| `ghostOut` divided by the drawn scale | `collection-flip` (TagField, removed tag; centre and layout size) | 0.30 | 0.39 |

Same figures in RTL. All under 1 px, which is sub pixel rounding of the
`getBoundingClientRect` values. Before the change, Angular's digit layer
used a logical `inset-inline-start` on a layer that is `direction: ltr`, so
the RTL value was measured from the right and applied from the left. The
shared form uses physical sides and has no such case. At zoom 1.5 the old
`snapshot` and `ghostOut` wrote drawn px as CSS px, so the copy was drawn
1.5 times too large.

`rollValue` (Select), `drawStepCheck` (Stepper), `landValue` (Meter) and
`wipeAway` (Skeleton) are the same code as the Angular copies, so they were
not probed. Their component specs pass.

## Proof

- `npx tsc --noEmit -p tsconfig.json`: pass.
- `npm run check -w @the-system/angular` (`ngc` then `ng test`): pass, 108
  files, 723 tests.
- `npx eslint .`: pass. `npx vitest run`: pass, 197 files, 2499 tests.
- `npm run contract -- --framework angular --component Switch,Slider,Toast,Select`:
  188 passed (Select 57, Slider 37, Switch 37, Toast 57), 0 failed.
- `npm run check`: one run went red on two steps while the React lane and
  the contract run were busy at the same time. The vitest step was the React
  lane's work in progress. The Angular step failed once on
  `tag-field.spec.ts` "Enter adds the typed text and drops duplicates", an
  assertion that waits a fixed 40 ms for a status message. It passes on
  every run alone and does not touch motion. The final run, with nothing
  else running, passed every step (tokens build, gen, typecheck, eslint,
  manifests, vitest and all seven workspace checks).

## Decisions

- `motion-feedback.ts` is deleted, not left empty. It had no Angular wiring.
- `injectRowGlide` and `injectHoverFollow` are kept, though no component
  calls them now. They are Angular wiring, and removing API was not in the
  order.
- Component specs that test pure helpers through Angular (switch rubber
  band, toast swipe, slider rubber band) were only repointed, as the order
  says for specs other than the four named.

## Note for the lead

`FlipGroup` stores its spots in drawn px. If the page zoom changes between
two renders, the next ghost is sized with the new scale applied to old
spots. This is the same in React, it only shows when the zoom changes
between two renders, and it is not a regression. Not fixed here: the file
is outside this lane.
