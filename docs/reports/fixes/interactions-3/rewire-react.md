# Order 1.29: React rewired onto the shared motion helpers

React now imports the framework free motion helpers from `@the-system/motion`
(`packages/motion/src/helpers/`). The React copies are gone, and only the
React hooks and wiring stay in `packages/react/src`. This is a move, not a
fix: no React test changed what it asserts, and the five contract runs pass.

## Files deleted

| File | Now from `@the-system/motion` |
| --- | --- |
| `components/Tabs/ink.ts` | `helpers/nav-ink.ts` (`playInk`) |
| `components/Tabs/ink.test.tsx` | `helpers/nav-ink.test.ts` (the same four tests) |
| `components/Toast/stack.ts` | `helpers/toast-stack.ts` (`watchStack`) |
| `components/Toast/swipe.ts` | `helpers/toast-swipe.ts` (`rubberBand` is now `swipeRubberBand`) |
| `components/Alert/ghost.ts` | `helpers/exit-ghost.ts` (`dismissWithExit`, `ghostOf`, `placeOf`, `shrinkAway`) |
| `components/Input/fieldMotion.ts` | `helpers/field-motion.ts` (the beats, the leaving copy) |

`Input/fieldMotion.ts` was in the "trim" list, but it held no hook: its body
was the first half of `helpers/field-motion.ts`, line for line. Trimmed to
the hook, nothing was left, so it was deleted and its nine importers
(Rating, FieldError, OTPField, FormWizard, ConsentField, PasswordField,
Field, SearchField, Form) import from `@the-system/motion`.

## Files trimmed to the React hook

| File | Keeps | Calls |
| --- | --- | --- |
| `components/Switch/drag.ts` | `useSwitchDrag` (pointer wiring, `dragging` flag, click swallow) | `beginSwitchDrag`, `pastSlop`, `followPointer`, `clearDragProgress`, `releaseChecked`, `SWALLOW_CLICK_MS` |
| `components/Input/useErrorShake.ts` | `useErrorShake` (when to shake) | `ErrorShaker`, `ERROR_SHAKE`, `parentBox` |
| `components/NumberField/useDigitLayer.ts` | `useDigitLayer` (the ref, the `beforeinput` clear) | `digitLayerControl` |
| `components/ListBox/highlightMarker.tsx` | `useHighlightMarker`, `HighlightMarker` | `watchMarker`, `HIGHLIGHT_MARKER_ID` |
| `components/ListBox/selectionMotion.ts` | `useRowGlide`, `useFlipGroup`, `useStaggerOnOpen`, `usePopupRows` | `watchGlide`, `FlipGroup`, `staggerRows`, `POPUP_LIST_ROWS`, `POPUP_RESULTS`, `exitGhost` |
| `components/Stat/useDigitRoll.ts` | `useDigitRoll` | `DigitRoller` (`popMark` importers go to motion) |
| `components/AvatarGroup/useFlipList.ts` | `useFlipList` (render phase measure, layout effect play) | `FlipList` |
| `internal/indicator.ts` | `useIndicatorTrack`, `useActivated`, `useHoverFollow` | `createTrack`, `activated`, `hoverFollow` |

## Local copies removed

- `Slider/Slider.tsx`: `keyEnd`, `KEY_BUMP`, `ROLL_GAP`, `SLIDER_FILL`,
  `rubberBand`, `fillClip` and the body of `useGlide`. The hook now calls
  `sliderGlide` and keeps its state; `sliderKeyEnd`, `sliderRubberBand`,
  `SLIDER_ROLL_GAP`, `KEY_BUMP` come from motion.
- `Select/Select.tsx`: `rollValue` and `ROLL_ID`.
- `ProgressBar/ProgressBar.tsx`: `haloBurst` and the celebrate logic;
  `useCelebrate` keeps a `Celebrate`.
- `Skeleton/Skeleton.tsx`: `wipeAway`.
- `Meter/Meter.tsx`: `landValue`.
- `Stepper/Stepper.tsx`: `drawCheck` and `CHECK_LENGTH`; it calls `drawStepCheck`.
- `ToggleButton/ToggleButton.tsx`: `toggleLayerSpec` and its constants; the
  inline `share` is `pressShare`.

## Renames and importers

- `rubberBand` to `swipeRubberBand` (Toaster), `sliderRubberBand` (Slider),
  `switchRubberBand` (inside `followPointer`; Switch no longer names it).
- `between` to `rectBetween`: only used inside the helper now. Lightbox's
  `between` is the core one (a transform string) and is unchanged.
- `glide` to `glideRow`: only used inside `watchGlide` now.
- Importers moved to `@the-system/motion`: SegmentedControl, Tabs,
  ToggleGroup, Navbar (`playInk`, `followIndicator`, `fromLocal`,
  `slideTo`), Pagination (`followIndicator`, `inlineSign`, `windUp`),
  Sidebar, Stepper, Rail, TableOfContents, LanguageSwitch, Alert, Banner,
  Avatar, AvatarGroup, Badge, NotificationCenter, ProgressBar, Chip, List,
  ListBox, DropdownMenu `menuShared`, Input, PasswordField. Each keeps the
  React hooks from the trimmed files.
- Comments that named the old React paths (`./ink.ts`, `Tabs/ink.ts`,
  `stack.ts`, `swipe.ts`, `./ghost.ts`, `react/src/internal/indicator.ts`)
  now name the helper in `@the-system/motion`.

## Tests removed, and why

Each one was a pure test of helper code that now lives, with the same
assertions, under `packages/motion/src/helpers/`.

| React test | Removed | Kept in motion |
| --- | --- | --- |
| `Tabs/ink.test.tsx` | the whole file (4 tests) | `nav-ink.test.ts` |
| `Toast/Toast.test.tsx` | stack layout, `watchStack` on a bare list, swipe rubber band, swipe close and speed (4 tests, and the `fakeHeights` helper only they used) | `toast.test.ts` |
| `ListBox/ListBox.motion.test.tsx` | the platform hook test, and the `exitGhost` part of the B6 test | `selection-marker.test.ts` |
| `Switch/Switch.drag.test.tsx` | the "switch-drag math" block (2 tests) | `switch-drag.test.ts` |
| `internal/indicator.test.ts` | slideFrames, boxes, slideTo and followIndicator, small answers (10 tests) | `indicator.test.ts` |
| `Slider/Slider.test.tsx` | the rubber band math test | `slider-fill.test.ts` |

Kept: every test that renders a component or a hook. The B6 test keeps its
CSS check (the exit only runs on the inert copy) under a narrower name; the
Toaster stack, timer and swipe wiring tests, the Switch drag on the control,
the Slider wiring tests and `useActivated` all stay. `Field.motion.test.tsx`
keeps its `shakeBeat` test, now importing it from motion.

## Step 7: other copies

A scan of every line over 45 characters of the helper sources against
`packages/react/src` found no other copy. `TabBar/pressOrigin.ts` looks
like `setPressPoint` but is not the same body (it rounds to whole px, skips
an empty box and has no zoom factor), so it was left alone: switching it
would change the values TabBar and Pagination write.

## Behaviour differences seen

All three come from choices the helpers made (see `helpers.md`); none shows
in a test or a contract run.

1. `placeOf` records `nextElementSibling`, not `nextSibling`. The ghost of
   an Alert, a Banner, a Skeleton or an AvatarGroup item goes back before
   the next element instead of the next node. They differ only when a text
   node sits between the leaving element and the next one.
2. `rollValue` makes the ghost label with `el.ownerDocument`, not the global
   `document`. Same result in one document; right in an iframe.
3. `useSwitchDrag`: a press where the thumb cannot travel now sets the run
   to null; before, it returned early and kept any earlier run. A run is
   always null between drags, so this is not reachable in normal use.

`DigitRoller`, `Celebrate`, `FlipList`, `ErrorShaker`, `FlipGroup` and
`activated` keep React's timing: the first call only records, as React's
`useRef(initial)` did.

## Proof

- `npx tsc --noEmit -p tsconfig.json`: clean.
- `npx vitest run packages/react packages/motion`: 151 files, 2004 tests pass.
- `npx eslint .`: clean.
- `npm run check`: every step passed but vitest, where two lint gate tests
  (`no-native-title`, `no-tailwind`) timed out at 5 s while the machine was
  busy with the other lane. Both pass when run alone (15 tests, 4.5 s).
  `check @the-system/angular` passed in this run.
- `npm run contract -- --framework react --component <name>`: Tabs 37,
  Switch 37, Toast 57, Slider 37, Select 57 passed, 0 failed.

## Changes needed from the lead

None. The lint gate timeouts may need a longer `testTimeout` when two lanes
run the full suite at once.
