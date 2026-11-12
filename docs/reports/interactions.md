# Interaction round (order 1.21)

Agent: ds-style, leading the round, with five family agents (ds-component).
Branch `claude/ds-order-1-21`. Every interaction in this report is
**proposed**: it waits for the owner.

## 1. What was studied

Both sites were reached on 2026-11-12. A plain fetch returned an empty shell
for each (both render on the client), so both were read in headless Chromium
through Playwright.

**khagwal.com/interactions.** A dated list of about 150 short screen
recordings, one interaction each, from April 2024 to November 2026. Each
recording is a square 960 px clip at 60 frames a second, about 5 to 19
seconds long, that loops one control through its states with a visible
pointer. Nineteen clips were downloaded and measured frame by frame (a
frame difference count on 64 px gray frames, then contact sheets read by
eye): Copy Confirmation, Stateful Button, Micro Progress Button, Morphing
Button, Discrete Tabs, Fluid Tabs, Inline Toast, Clamped Slider, Reveal and
Copy, Save Toggle, Pop Stepper, Scale to Cue Focus, Timed Undo Action,
Switch Mode, Stepper, Morphing Action Feedback, Confirm to Delete, Invite
Code and License Key. The clips were deleted after measuring; nothing from
them is in the repo.

What the collection shows, as kinds of feedback:

| Kind | Seen in | Timing measured |
| --- | --- | --- |
| A label or glyph swaps in place in answer to an action, old out and new in at once, then swaps back after about a second | Copy Confirmation, Stateful Button, Save Toggle, Reveal and Copy | Each swap about 250 to 270 ms; success held about 1 s |
| An indicator slides between items; the labels it leaves and reaches change color while it moves | Fluid Tabs, Discrete Tabs, Switch Mode | Slide about 250 to 330 ms; a two item switch 100 to 250 ms |
| A control answers the press before the release: a small scale down, or a thumb that widens | Scale to Cue Focus, Switch Mode, Stepper | The press lands within about 100 ms |
| A short message grows out of the control that caused it, waits, then folds back | Inline Toast, Timed Undo Action, Inline Feedback Action | Enter about 350 to 450 ms, held several seconds, exit about 300 ms |
| A value steps with a roll of its digits in the direction of the change | Pop Stepper, Stepper, Conditional Stepper | Each step about 180 to 300 ms; held steps repeat without stacking |
| A value fills cell by cell as it is typed or pasted | Invite Code, License Key | Each cell about 250 ms; a paste fills in a short run |
| A drag that pushes past the end resists and springs back on release | Clamped Slider, Adaptive Slider | The spring back about 300 to 400 ms |
| A button morphs into its own progress and back | Micro Progress Button, Morphing Button, Morphing Action Feedback | Each morph about 450 to 500 ms |
| A destructive action asks a second time in place | Confirm to Delete, Inline Action Confirmation | The second state appears in about 300 ms |

The pattern under all of them: feedback starts on the same frame as the
input, the state change is never held back by the motion, and motion that
answers a direct action (press, swap, slide) is short, 100 to 300 ms, while
motion that announces something (a toast, a morph) may run to about 450 ms.

**bestdesignsonx.com.** A feed of design posts collected from X, Instagram,
Dribbble and Behance (about 10 000 items, 84 pages), shown as image and
video thumbnails with the author's handle. The posts themselves carry almost
no text, so the feed gives no timing to measure. The page's own chrome shows
two kinds that are useful here: a subscriber count drawn as per digit
columns that roll to the new value, and a pill switch for the feed filter.
Both are already in the scope list (number roll, the sliding indicator).

Nothing was copied: no code, no asset, no name of an interaction. Only the
kind of feedback and its timing were taken, and every timing below comes
from the tokens of this system.

## 2. Ideas, mapped to a component and a catalog pattern

| Idea | Component | Pattern | Why | Status |
| --- | --- | --- | --- | --- |
| Press feedback: scale to `scale.press` on press, back on release | Button, IconButton, ToggleButton, CopyButton | `press` | The press lands before the release, as in every press seen; 70 ms is under the 100 ms a direct action should answer in | proposed |
| Copy success swap: the copy glyph rolls out, the check rolls in, both at once | CopyButton | `swap` | The most common feedback in the collection; the clipboard write and the announcement do not wait | proposed |
| A check mark that draws from the inline start | Checkbox | `fade` (wipe) | Drawing a stroke needs `stroke-dashoffset`, which may not animate here; a transform only wipe reads the same | proposed |
| A switch thumb that widens while pressed and slides on toggle | Switch | `press` | Answers the press before the release and shows the direction of travel | proposed |
| Stars that pop in a short run up to the chosen one | Rating | `pop` | A value that fills mark by mark, capped so the run ends quickly | proposed |
| A focus glow that fades in and grows to its ring | Input, PasswordField, OTPField, NumberField | `fade` | The ring itself shows at once (WCAG 2.4.7); only the glow moves | proposed |
| An error shake, once, two swings | Input, PasswordField, OTPField, NumberField | `shake` | A refused value is felt on the field, not only read; one play per error, no luminance change | proposed |
| A password reveal: the eye glyph swaps and the text fades back | PasswordField | `swap` | The type change is instant; the swap makes the new state legible | proposed |
| OTP cells that pop as they fill, a paste fills in a short run | OTPField | `pop` | As in the code entry clips; focus moves on at once | proposed |
| A value that rolls in the direction of a step | NumberField, Stat | `number-roll` | As in the steppers; a held key does not stack rolls | proposed |
| Menus and popovers that scale out of their trigger side | DropdownMenu, Popover | `menu-scale` | The surface reads as coming from the control that opened it | proposed |
| A tooltip that rises a few px from its side | Tooltip | `fade-rise` | Small, quick, and instant inside a delay group | proposed |
| A toast stack that shifts to make room and a swipe that follows the finger | Toast | `toast` | As in the inline toast clips, with the pause on hover kept | proposed |
| Dialog and sheet entries on a spring like curve | Dialog, Sheet, Drawer | `dialog`, `sheet` | Spring tokens exist; CSS needs an ease token to use them | proposed |
| A tab indicator that slides between triggers | Tabs | `tab-indicator` | As in the tab clips | proposed |
| An accordion that reveals without squashing its text | Accordion | `accordion-height` | Closes note N9 of the catalog review | proposed |
| A skeleton that stops shimmering before five seconds and fades to the content | Skeleton | `skeleton-shimmer` | Closes note N10; WCAG 2.2.2 | proposed |
| A list that staggers in on first paint only | List | `list-stagger` | Content is there and readable at once; the stagger is capped | proposed |
| A slider thumb that lifts while held and nudges at the ends | Slider, RangeSlider | `press`, `shake` | The pull and release of the slider clips, kept to transforms on the thumb | proposed |

## 3. Rejected ideas

| Idea | Seen in | Why it is rejected |
| --- | --- | --- |
| Blur while an indicator or a label moves | Fluid Tabs, Copy Confirmation | `filter` may not animate (only `transform` and `opacity`), and blur costs a paint on every frame |
| A button that morphs its width into a progress pill | Micro Progress Button, Morphing Button | Animating width breaks the transform and opacity rule; a scale of the whole button distorts its label and radius |
| A stroke that draws (a signature, a check, a chart line) | Draw Signature, Save Toggle | `stroke-dashoffset` may not animate; the check uses a transform only wipe instead |
| A color shift through the hue wheel while waiting | Chromatic Thinking | A color loop is a luminance change that can pass three flashes a second; and color may not animate |
| Height that grows to show more detail | Expand Details, Card Splitting Accordion | Height may not animate; the accordion uses a clip and a counter transform |
| Cards that wiggle to show they can move | Wiggling Cards | A loop with no end and no pause control (WCAG 2.2.2), and no information |
| A rubber band that follows the pointer past the end of a slider | Clamped Slider | It needs the drag position outside the range, which Radix clamps; the end nudge gives the same message from the key and the drag |

## 4. What was added, per component

Every row is in the registry, `packages/motion/src/interactions.ts` (family
files under `packages/motion/src/interactions/`), with its trigger, its
feedback, its reduced form and, for a CSS interaction, the private
properties a style sets to turn it off. The gallery page `/interactions`
plays each one, with a reduced motion switch and the style axis of the
shell. Timings below are token names; the ms are the base values (Neutral
reads `duration.base` as 150ms and `duration.medium` as 180ms).

| Interaction | Components | Drive, pattern | What the person sees | Reduced form |
| --- | --- | --- | --- | --- |
| `button-press` | Button, IconButton, ToggleButton, CopyButton | CSS, `press` | Pointer down, Space or Enter scales the control to `scale.press` (0.97) over `duration.instant` on `ease.out`; release returns. Enter has no `:active`, so ButtonBase plays the catalog `press` on Enter keydown and keyup. Never on a disabled or loading control | No scale |
| `copy-swap` | CopyButton | WAAPI, `swap` | After a copy, the copy glyph rolls up and out while the check (or warning) rolls in from below, both at once, `duration.base`; it rolls back down when the success state ends. The clipboard write, `data-state` and the status text are not delayed. The visible label does not change: that would change the accessible name and the width | Cross fade |
| `check-draw` | Checkbox | CSS, `fade` | The fill appears at once, then the check or dash wipes in from the inline start over `duration.medium` on `ease.out` (a clip that slides in while the mark inside slides the other way, so only transforms move). Uncheck fades over `duration.fast`. A box checked at first paint draws nothing | The mark appears at once |
| `switch-stretch` | Switch | CSS, `press` | While pressed the thumb widens about 15% toward its travel, its trailing edge still, over `duration.instant`; on toggle it slides over `duration.medium` on `ease.emphasized` and settles to its width | The thumb jumps |
| `rating-fill` | Rating | WAAPI, `pop` | A pick pops the stars from the first to the chosen one, each half a `delay.reveal-step` after the last (the fifth starts at 160ms), over `duration.medium`. Not on first paint, a controlled change, read only, or the same score. Hover preview stays instant | Fade |
| `focus-glow` | Input, PasswordField, OTPField, NumberField | CSS, `fade` | The focus ring now shows at once (it used to fade in with the glow, against WCAG 2.4.7). Only the glow on `::before` fades in and grows from `scale.dialog-enter` over `duration.base` on `ease.out`; it fades out over `duration.fast` | Glow appears at once |
| `error-shake` | Input, PasswordField, OTPField, NumberField | WAAPI, `shake` | When the field turns invalid, or the browser refuses a submit, the field moves `space.3xs` along the inline axis and back twice within `duration.roll`. Once per error, never on first paint, never while a shake runs. No luminance change, so not a flash | None: the error color and message carry it |
| `password-reveal` | PasswordField | WAAPI, `swap` | On the toggle press the type changes at once; the eye glyph rolls in (up on show, down on hide) and the text fades back in | Fade |
| `otp-fill` | OTPField | WAAPI, `pop` | Each character lands in its cell; a paste or an SMS fill runs over the cells half a `delay.reveal-step` apart. Focus moves on at once; Backspace pops nothing | Fade |
| `field-step` | NumberField | WAAPI, `swap` | ArrowUp, ArrowDown, PageUp, PageDown or the step buttons slide the value text in from the side of the change over `duration.base`; typing does not. A step while the last one plays changes the value with no slide | Fade |
| `menu-origin` | DropdownMenu, ContextMenu, Menubar, Popover | CSS, `menu-scale` | The surface scales up from `scale.menu-enter` out of the Radix transform origin while it fades in, `duration.base` on `ease.emphasized`; exit `duration.quick` on `ease.exit`, with no pointer. Popover now follows the menus (it had its own side travel and timing) | Fade |
| `tooltip-rise` | Tooltip | CSS, `fade-rise` | After the open delay the tooltip travels `space.xs` from its side while it fades in, `duration.base`. An `instant-open` (inside a delay group, by keyboard focus, or controlled) has no motion | Fade |
| `toast-enter` | Toast | CSS, `toast` | The new toast travels in from the toaster edge and scales up from `scale.dialog-enter` over `duration.toast-enter`; the exit fades and shrinks over `duration.toast-exit` | Fade |
| `toast-stack` | Toast | WAAPI, `drag-drop` (drop) | When a toast joins or leaves, the toasts that stay move from their old place to the new one (a FLIP) over `duration.slow` on `ease.emphasized`. Layout never animates; the store never waits; pause on hover and focus is kept (WCAG 2.2.1, 2.2.2) | None |
| `toast-swipe` | Toast | CSS, `toast` | The toast follows the finger; let go early and it springs back over `duration.base` on `ease.emphasized`; past the threshold it travels on out in the swipe direction while it fades | Fade |
| `dialog-spring` | Dialog, AlertDialog | CSS, `dialog` | The panel rises `space.2xs` and scales from `scale.dialog-enter`, now on `ease.emphasized` through `--_dialog-ease-in`, so an `ease.spring-sheet` token can drop in later | Fade |
| `sheet-spring` | Sheet, Drawer | CSS, `sheet` | The slide reads its ease and travel from root plumbing (`--_dialog-slide`, `--_dialog-enter-opacity`), so a style can turn it into a fade | Fade |
| `tab-slide` | Tabs | WAAPI, `tab-indicator` | The indicator moves from the old trigger's box to the new one (a FLIP), `duration.medium`; RTL needs nothing because boxes are measured | None |
| `accordion-reveal` | Accordion | CSS, `accordion-height` | The panel takes its height at once and clips; one inner layer slides down from a full layer above while it fades in, `duration.slow`. The text never scales (note N9 closed). Closing is at once | None |
| `skeleton-swap` | Skeleton | CSS, `skeleton-shimmer` | The band sweeps linear three times (4.2s) and then rests outside the clip, so nothing moves past five seconds (note N10 closed, WCAG 2.2.2). `--_skeleton-loops` lets a style that slows the sweep play fewer | No band |
| `list-stagger` | List | WAAPI, `list-stagger` | Rows fade and rise on first paint only, capped steps. Not on re-render, added rows, reorders or rows from server HTML. Every row is in the DOM and read at once | Fade with no delay |
| `stat-roll` | Stat | WAAPI, `number-roll` | The number rolls up when it grows and down when it falls, inside a clip, through the catalog (note N11 closed). A roll is skipped when the last one started less than one roll ago, so a live counter never flashes. The roll now keys on the formatted string, not a React node | Fade |
| `slider-pull` | Slider, RangeSlider | CSS, `press` | While held the thumb lifts about 15% and settles on release, `duration.base` on `ease.emphasized` | No lift |
| `slider-nudge` | Slider, RangeSlider | WAAPI, `shake` | A key or a drag past the minimum or maximum nudges the thumb toward that end and back once (composite add, on top of the lift). A held key nudges once | None |

### Per style (presets in `packages/styles/<id>/motion.ts`)

- **Studio, flat and fast.** Presses, swaps and slides stay: they answer
  an action. Marks land without a pop (`pop` reduced), a field error does
  not shake, a number step and a Stat number change in place, the list
  stagger is a fade.
- **Desk, windows and rolls.** Every interaction in full; swaps roll like
  the roll labels of Desk controls; numbers roll.
- **Neutral, 150 to 200ms ease out.** Every moving pattern resolves to 150
  to 200ms on `ease.out` (a test in `preset.test.ts` checks every pattern,
  with the loops and the press exempt); the shake plays over
  `duration.slow`; the list stagger is a fade, since its last row would end
  past 200ms. The dialog keeps `ease.out` on enter.

### How a style tunes or turns one off

- An interaction played from code goes through `useMotion()`
  (`packages/react/src/internal/motion.ts`), which reads the style's
  `motionPreset` from the Theme at run time. This closes note N15 for
  these interactions: the preset's pattern rows and interaction rows now
  reach the components.
- A CSS interaction reads private motion plumbing on the component root.
  `interactionRecipes(styleId, preset)` writes a `ds.recipes` rule that sets
  the `off` properties of every CSS interaction a style plays reduced or not
  at all. Today no style turns a CSS interaction off, so the output is
  empty; the gallery injects it anyway. The generator writes `off` rows
  only; it cannot carry a timing row to CSS (for that the CSS timing comes
  from the style's tokens).
- A page can ask for reduced motion from its own setting with
  `data-motion="reduce"` on `<html>` (WCAG 2.3.3); `prefersReducedMotion()`
  reads it.

### New in `packages/motion`

- Patterns `shake`, `pop` and `swap` (23 ids now), each with token paths,
  a reduced form and native values.
- `spring.ts`: `springCurve()` turns a spring token into a CSS `linear()`
  easing and a settle time, for the Web Animations API now and for ease
  tokens later. `spring.sheet` settles in 508ms with 0.4% overshoot.
- The catalog matches the CSS: `menu-scale` reads `scale.menu-enter`,
  `dialog` enters on `ease.emphasized`, `accordion-height` slides an inner
  layer instead of scaling the clip (N9).

## 5. Proof

| Check | Result |
| --- | --- |
| `npm run check` | green before the content commit (every step pass) |
| Contract suite, react, every touched component (28) | see below |
| `npm run check -w @the-system/angular` | 35 files, 223 tests pass (run by each family agent and again inside `npm run check`) |
| Frame strips | `docs/reports/shots/interactions/<id>.<style>.<normal or reduced>.png`: 24 interactions, Studio dark, Desk dark and Neutral light, each in normal and reduced motion (144 strips). The first frame is before the action, then seven steps over the measured timing of the animations the action started. The script is `docs/reports/shots/interactions/strips.cjs` |

What the frames showed and what was fixed: the first run timed every strip
at the cap because a shimmer elsewhere on the page was still running; the
script now finishes earlier animations and times only the new ones. Toasts
with one title deduplicated instead of stacking; the stage now numbers
them. In every strip the reduced form changes state at once with no
travel, and the Neutral strips run 150 to 180ms.

Things seen in the frames that are accepted, not bugs: the rating pop
starts from opacity 0, so stars that were already filled blink out for one
frame and land again (once per pick, under three times a second); the
accordion chevron rotates with the reveal.

## 6. Rejected in the build

| Idea | Why |
| --- | --- |
| Full height number roll on NumberField | The input has no clip: the digits drew below the border, the hit area moved, and clipping the field would cut the focus ring and the stepper rings. It plays the short `swap` travel instead |
| A "Copied" label swap on CopyButton | It would change the accessible name and the width for existing users; only the glyph swaps |
| Driving the toast stack in CSS | CSS cannot know the height of the new toast; it is a FLIP from code |
| A content fade when a Skeleton finishes | Skeleton has no loaded state. Proposed API, not built: `<Skeleton loading={bool}>{content}</Skeleton>`, where the content fades in over the placeholder (opacity, `duration.base`) as the shape leaves |
| `drag-lift` on List | List does not reorder |
| A nudge on vertical sliders | The `shake` pattern moves on the inline axis only |

## 7. Token requests

| Token | Value | Why | Used meanwhile |
| --- | --- | --- | --- |
| `scale.stretch` | about 1.15 | Switch thumb stretch | `calc(2 - scale.window-enter²)` |
| `scale.lift` | about 1.15 | Slider thumb lift | the same calc |
| `scale.field-glow` (or `scale.enter`) | 0.98 | Start size of the focus glow | `scale.dialog-enter` |
| `ease.spring-press`, `ease.spring-sheet`, `ease.spring-merge` | `linear()` from `springCurve()` | Dialog, sheet and toast springs in CSS | `ease.emphasized`. Measured against `spring.sheet`: `ease.reveal` is closest (mean gap 0.040), then `ease.window` (0.045), `ease.emphasized` (0.062), `ease.out` (0.180) |
| A duration near 500ms | settle time of `spring.sheet` | Only if CSS should ever match the spring's settle | none |
| Reduced motion under `:root[data-motion='reduce']` | the same zeroed list | So an in app setting zeroes durations without a media query | the gallery declares it in `apps/gallery-react/src/interactions.css` |

## 8. Work for Angular and native

Angular shares the CSS, so every CSS interaction already plays there.
Interactions played from code need an Angular player that reads the style
preset the way `useMotion()` does (a small service over `@the-system/motion`):

| Angular component | Work |
| --- | --- |
| `button-base.ts` | Enter press: on host keydown Enter (not repeat, not inert, only button, icon-button, toggle-button, copy-button) play `press` enter; on keyup Enter or blur play the exit, only after a press |
| `copy-button.ts` | Render the leaving glyph in `<span aria-hidden="true">` inside `[data-part="icon"]` while the swap plays; `swap` enter on the new glyph, exit on the span (`up` for the result, `down` back to idle); remove it after `settled()` |
| `input.ts` | `error-shake`: remember the last invalid value, play `shake` on the root when it turns on (skip when the root has `data-part`), listen for `invalid` on the input |
| `password-field.ts` | `error-shake` on the root; `password-reveal`: after the toggle, play `swap` on `[data-part="toggle"] > [data-part="icon"]` and `fade` on the input |
| `otp-field.ts` | Template: `@if (code()[i]) { <span>{{ code()[i] }}</span> }` in each cell, so the DOM matches React; play `pop` with a running index on each changed cell; `error-shake` on the root |
| `toast` | Port `watchStackShift` (`packages/react/src/components/Toast/stackShift.ts`) and start it on the toaster after view init |
| Not yet ported (Checkbox, Switch, Rating, NumberField, Tabs, Accordion, List, Stat, Slider) | Build the same logic when each port is built: the Checkbox indicator holds `<span aria-hidden="true">` with the glyph, the Accordion content holds one unnamed `div`, Stat wraps a number in one unnamed `span` |

Native (wave 2): every new pattern carries native numbers (`shake`
distance and swings, `pop` from scale and spring, `swap` travel); the
Reanimated helper should read them, and N5 (native values ignore the style)
still stands.

## 9. Interactions for the components held by the fix round

Not touched in this round. For a later pass:

| Component | Interaction | Pattern |
| --- | --- | --- |
| ToggleGroup | Press on each item, and a selection mark that slides between items like `tab-slide` | `press`, `tab-indicator` |
| SegmentedControl | The thumb slides between segments (it already plays `tab-indicator`); add a press widen like `switch-stretch` | `tab-indicator`, `press` |
| Select | Its list opens with `menu-origin`; the chosen value in the trigger rolls in with `swap` | `menu-scale`, `swap` |
| TagField | A new tag pops in, a removed tag fades out while the others shift with a FLIP | `pop`, `drag-drop` |
| Form | A refused submit shakes the first invalid field once and moves focus to it at once | `shake` |
| FilterBar | An added filter chip pops in; the result count rolls | `pop`, `number-roll` |
| ConsentField | The check draws like `check-draw` | `fade` |
| CommandPalette | Opens with `dialog`; results fade in place (no stagger, they change on every key) | `dialog`, `fade` |
| Lightbox | The image grows out of its thumbnail (FLIP) and back on close | `window-grow` |
| Sidebar | Collapse slides the labels out with a fade while the rail keeps its width at once | `fade-rise` |
| CloseButton, FloatingActionButton | The same `button-press` (they share Button.css; add their roots to the selectors, to `PRESS_DS` and to `off`) | `press` |

## 10. Changes needed from the lead

1. **Manifests.** Set `motion` to the pattern each component now plays:
   `Rating.manifest.json` `pop`, `Switch.manifest.json` `press`,
   `NumberField.manifest.json` `swap`, `PasswordField.manifest.json` `swap`,
   `OTPField.manifest.json` `pop`, `Slider.manifest.json` and
   `RangeSlider.manifest.json` `press`. The field manifests may keep `fade`
   if the field's main motion is taken to be the focus glow; the field
   names one pattern only. The others already name the right pattern.
2. **Generated style motion CSS.** Have `scripts/gen-index.ts` write
   `interactionRecipes(id, preset)` for each style to
   `packages/styles/<id>/motion.css` and import it in that style's
   `index.css`, so a style that turns a CSS interaction off does so in
   apps, not only in the gallery.
3. **Token build.** Emit the reduced motion block under
   `:root[data-motion='reduce']` too, and add the tokens in section 7.
   Then remove the block from `apps/gallery-react/src/interactions.css`.
4. **InputGroup.css.** The focus ring moved to the root's own box shadow.
   Add `--_input-shadow-focus: none;` and `--_password-field-shadow-focus: none;`
   next to the lines that set `--_input-ring` and `--_password-field-ring`,
   so a joined field draws no glow. Today the inset ring sits about 1px
   further in than before and the glow shows.
5. **Window.** `packages/react/src/components/Window/styleMotion.ts` keeps
   its own map of presets (Studio and Desk only). It can use
   `motionPresetFor()` from `packages/react/src/internal/motion.ts`, which
   knows Neutral too.
6. **Dialog focus return.** Radix returns focus when the content unmounts,
   after the exit (up to 120ms, 220ms in Desk). Returning it on close
   would need a change in `DialogBase.tsx` and its Angular mirror. Your
   call.
7. **Contract suite.** The axe step runs right after load, while first
   paint animations still play; List once read 4.17:1 mid fade in Desk
   dark. Awaiting the finite animations after `open()` in the axe test
   would remove that flake.
8. **Drawer demo.** Under `dir=rtl&lang=ar` the English cases still open at
   the right edge; the cases set their own direction. Not motion; noted.
9. **Owner decision.** Every interaction here is proposed. The strips and
   `/interactions` are what to look at.
