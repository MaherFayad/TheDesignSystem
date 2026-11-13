# Order 1.29: shared motion helpers

One copy of each framework free helper now lives in
`packages/motion/src/helpers/`, exported from `@the-system/motion`. Nothing
went to `packages/shared`: every family mixes timing or gesture physics with
its pure parts, so each family stays in one motion file.

| Helper family | Old React path | Old Angular path | New path | Differences resolved |
| --- | --- | --- | --- | --- |
| Switch drag core | `Switch/drag.ts` (pure parts) | `internal/toggles-switch-drag.ts` (pure parts) | `helpers/switch-drag.ts` | same code; `rubberBand` is `switchRubberBand`; the run is split into `beginSwitchDrag`, `pastSlop`, `followPointer`, `clearDragProgress`, `releaseSpeed`, `releaseChecked` |
| Toggle layer | `ToggleButton/ToggleButton.tsx` `toggleLayerSpec` | `internal/toggles-motion.ts` | `helpers/toggle-layer.ts` | same; `pressShare` replaces the inline share |
| Field motion | `Input/fieldMotion.ts`, `Input/useErrorShake.ts`, `NumberField/useDigitLayer.ts` | `internal/motion-fields.ts` | `helpers/field-motion.ts` | `snapshot` keeps React's zoom factor; digit layer placement keeps React's layout offsets |
| Slider | `Slider/Slider.tsx` | `internal/slider-fill.ts`, `slider/slider-base.ts` | `helpers/slider-fill.ts` | same logic; `sliderRubberBand`, `sliderGlide`, `sliderKeyEnd`, `SLIDER_ROLL_GAP` |
| Selection marker | `ListBox/highlightMarker.tsx` | `internal/selection-marker.ts` | `helpers/selection-marker.ts` | same; `watchMarker` exported |
| Selection motion and value roll | `ListBox/selectionMotion.ts`, `Select/Select.tsx` `rollValue` | `internal/motion-selection.ts`, `select/select.ts` | `helpers/selection-motion.ts` | `ghostOut` keeps React's drawn scale; `watchGlide` keeps React's hover form; `rollValue` uses the owner document; `glide` is `glideRow` |
| Toast stack | `Toast/stack.ts` | `internal/toast-stack.ts` | `helpers/toast-stack.ts` | identical |
| Toast swipe | `Toast/swipe.ts` | `internal/toast-swipe.ts` | `helpers/toast-swipe.ts` | identical; `swipeRubberBand` |
| Nav ink | `Tabs/ink.ts` | `internal/nav-ink.ts` | `helpers/nav-ink.ts` | identical |
| Indicator | `internal/indicator.ts` | `internal/indicator.ts` | `helpers/indicator.ts` | `between` is `rectBetween`; adds `activated` and a framework free `hoverFollow` |
| Exit ghost | `Alert/ghost.ts`, `Skeleton.tsx` `wipeAway` | `motion-feedback.ts`, `skeleton/skeleton.ts` | `helpers/exit-ghost.ts` | `placeOf` uses `nextElementSibling` in both |
| Digit roll and pop | `Stat/useDigitRoll.ts` | `motion-feedback.ts` | `helpers/digit-roller.ts` | `DigitRoller` is the shared class |
| Celebrate | `ProgressBar/ProgressBar.tsx` | `motion-feedback.ts` | `helpers/celebrate.ts` | same |
| FLIP list | `AvatarGroup/useFlipList.ts` | `motion-feedback.ts` | `helpers/flip-list.ts` | same |
| Meter value | `Meter/Meter.tsx` `landValue` | `meter/meter.ts` | `helpers/meter-value.ts` | identical |
| Stepper check | `Stepper/Stepper.tsx` `drawCheck` | `stepper/stepper.ts` | `helpers/step-check.ts` | identical; `drawStepCheck` |

Not moved: the framework hooks and wiring (`useActivated`,
`useIndicatorTrack`, `injectHoverFollow`, `openStaggered`,
`injectPopupResults`, `injectHighlightMarker`). `Toast/stackShift.ts` named
in an old header does not exist.

Tests: 11 files, 60 tests under `packages/motion/src/helpers/`, moved from
the React and Angular suites, plus new ones for the drag run, `ErrorShaker`,
the digit layer, `sliderKeyEnd`, `pressShare`, `drawStepCheck` and
`landValue`.

The rewiring of React and Angular onto these files and the deletion of the
duplicates is recorded below once done.
