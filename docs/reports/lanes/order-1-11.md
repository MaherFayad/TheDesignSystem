# Lane order-1-11: motion catalog (order 1.11)

Branch `claude/ds-order-1-11`, commit `wo-1.11: motion catalog`.
`npm run check` green (tokens build, gen, typecheck, eslint, manifests,
vitest, Angular, native, consumers). 150 motion tests.

## What was built

`packages/motion` now holds the 18 patterns of order 1.11, one file each in
`src/patterns/`, gathered by `src/catalog.ts`.

```ts
import { catalog, getPattern, isPatternId, settled } from '@the-system/motion';

const p = catalog.dialog;
p.id;                    // 'dialog'
p.tokens;                // token paths it reads, full and reduced forms
p.keyframes(input?);     // WAAPI keyframes, full form
p.reduced(input?);       // WAAPI keyframes, opacity only or []
p.spec(input?);          // keyframes + duration, easing, fill, origin, iterations, delay (token names)
p.reducedSpec(input?);
p.specFor(input?, { reduced?, preset? }); // what a style plays, or null
p.native;                // numbers for Reanimated: ms, bezier, scales, px, springs
const a = p.animate(el, { phase: 'enter', reduced?, preset?, prefix? }); // Animation | null
await settled(a);        // never transitionend or animationend
```

Files:

- `src/core.ts`: `PATTERN_IDS`, the types, `definePattern`, keyframe helpers
  (`between`, `usableRect`, `byPhase`, `fadeSpec`, `stillSpec`,
  `animatedProperties`) and the web helper (`tokenVar`, `parseDuration`,
  `readDuration`, `readEasing`, `readDir`, `prefersReducedMotion`, `settle`,
  `play`, `settled`).
- `src/tokens.ts`: the base token values as numbers (durations, delays,
  eases, scales, the space steps used, springs) for `native` and for the CSS
  fallbacks. `tokens.test.ts` checks every row against
  `packages/tokens/src/base`.
- `src/catalog.ts`: `catalog`, `getPattern`, `isPatternId`, the pattern
  input types.
- `src/patterns/*.ts`: the 18 patterns, `values.ts` (token as CSS),
  `window-shared.ts`.
- `src/preset.ts`: `StyleMotionPreset` (now with `patterns`),
  `WindowMotionMode`, `patternPreset`, `resolvePreset`.
- `src/window.ts`: kept for Window.tsx. Same exports as before
  (`animateWindow`, `windowGrow`, `windowClose`, `windowZoom`,
  `windowMinimize`, `windowMotionFor`, `windowPatterns`, `WINDOW_REST_SCALE`,
  the window types); `between`, `tokenVar`, `parseDuration`, `settle`,
  `settled`, `readDuration`, `readEasing`, `prefersReducedMotion` now come
  from `core.ts` through the same barrel.
- Tests: `catalog.test.ts`, `tokens.test.ts`, `preset.test.ts`,
  `window.test.ts` (unchanged cases, imports split), `testing/base-tokens.ts`.
- Style presets: `packages/styles/studio/motion.ts`,
  `packages/styles/desk/motion.ts`.

How values reach the page: durations, delays and eases are token names read
from the element's CSS variables when the animation starts (0ms under
reduced motion, and a style can override them). Distances and scales sit in
the keyframes as `var(--ds-space-xs, 6px)`, `var(--ds-scale-press, 0.97)`:
the browser resolves the live token, the fallback is the base value.

## The 18 patterns

| id | full form | tokens | reduced form |
| --- | --- | --- | --- |
| `fade-rise` | fade in, rise from `space.xs`; exit backward | duration.base, ease.out, ease.exit, space.xs | fade, duration.base |
| `menu-scale` | scale from `scale.press` at the trigger side (`origin`) with a fade; exit shorter | duration.base, duration.quick, ease.emphasized, ease.exit, ease.out, scale.press | fade (base in, quick out) |
| `dialog` | rise `space.2xs` and scale from `scale.dialog-enter` with a fade; exit backward. Same values as Dialog.css | duration.base, ease.out, ease.exit, scale.dialog-enter, space.2xs | fade, duration.base |
| `sheet` | slide in from its edge (`top`, `bottom`, logical `start`, `end`, flips in RTL); native spring.sheet | duration.slow, duration.base, ease.emphasized, ease.exit, ease.out, spring.sheet | fade, duration.base |
| `toast` | in from its edge `space.xs` and from `scale.dialog-enter`; exit shrinks and fades. Same values as Toast.css | duration.toast-enter, duration.toast-exit, ease.out, ease.exit, scale.dialog-enter, space.xs | fade on toast-enter and toast-exit |
| `accordion-height` | the clip (inner wrapper, overflow hidden) scales in on the block axis from the top with a fade; height never animates | duration.slow, duration.base, ease.standard, ease.exit, ease.out | fade of the clip |
| `tab-indicator` | FLIP from the old item rect to the new one | duration.medium, ease.standard | none, the mark jumps |
| `list-stagger` | fade and rise from `space.s`, each item one `delay.reveal-step` later, capped at 8 steps; first paint only | duration.slow, duration.base, ease.reveal, ease.out, delay.reveal-step, space.s | fade, no delay |
| `drag-drop` | `lift`: up `space.4xs`; `drop`: FLIP from the release rect to the slot; native spring.merge | duration.quick, duration.slow, ease.out, ease.emphasized, space.4xs, spring.merge | none |
| `window-grow` | grow from the trigger rect (or from 92%); exit is `window-close`, back into the trigger. Moved from window.ts, same values | duration.window-open, duration.window-close, duration.base, ease.window, ease.exit, scale.window-enter | fade, duration.base |
| `window-zoom` | FLIP between two frames. Same values | duration.window-zoom, ease.window | none |
| `window-minimize` | narrows, then falls into the dock, bottom center first. Same values | duration.window-minimize, duration.base, ease.window | fade, duration.base |
| `skeleton-shimmer` | highlight layer travels across in the reading direction, linear, 3 loops (4.2s) | duration.shimmer | none, still block |
| `spinner` | one turn per `duration.spin`, linear, loops while work runs | duration.spin | none, still icon (label carries state) |
| `number-roll` | new value rolls in from below (up) or above (down); `exit` rolls the old one out | duration.roll, duration.base, ease.emphasized, ease.out, ease.exit | fade |
| `chart-draw` | the series group scales in from the start of its value axis (`inline` flips in RTL, `block` from the baseline); never stroke-dashoffset | duration.reveal, duration.base, ease.reveal, ease.out | fade |
| `thinking` | three dots lift `space.4xs` and brighten in turn (`index`), 1.4s cycle | duration.shimmer, ease.default, space.4xs | none, still dots |
| `streaming-text` | each streamed chunk fades in; opacity only, text never moves | duration.base, ease.out | none, the text appears |

Every pattern has a unit test for its token paths (each exists in
`packages/tokens/src/base`, and every token its specs read is listed), its
full form (transform and opacity only) and its reduced form (opacity only or
nothing).

## Style presets

- Studio (`flat`): windows fade (`window-grow`, `window-minimize` reduced,
  `window-zoom` none), `number-roll` reduced, `sheet`, `list-stagger` and
  `drag-drop` on duration.base, `chart-draw` on duration.zoom. A test keeps
  every Studio duration at or under 220ms.
- Desk (`window`): windows grow, zoom and minimize; numbers roll; the rest
  full.
- Neutral: 1.10 is not on this branch. Its preset is one file,
  `packages/styles/neutral/motion.ts`, owned by whoever lands 1.10 after
  this: `{ id: '<neutral motionPreset>', window: 'fade', patterns: {} }`
  plus `duration.moderate` or `duration.slow` overrides for the 150 to 200ms
  ease out of 1.21.

## Manifests that name a pattern missing from the catalog

The catalog test reads `packages/manifest/manifests.gen.json` and fails on
any `motion` value that is not a catalog id. Two values in use today are not
ids. They sit in an explicit `PENDING_RENAME` list in `catalog.test.ts`, so
check stays green; the test also fails if a listed name stops being used,
so the list can only shrink. Every other name fails.

| manifest | motion today | change to |
| --- | --- | --- |
| `Button.manifest.json` | `press` | `none` now; a `press` pattern in 1.21 if the owner wants a 19th id |
| `IconButton.manifest.json` | `press` | same as Button |
| `WindowControls.manifest.json` | `press` | same as Button |
| `Input.manifest.json` | `fade` | `fade-rise` (its hint and error appear with an opacity transition today) |

`Dialog` (`dialog`), `Toast` (`toast`) and `Window` (`window-grow`) already
name catalog ids.

## Changes needed from the lead

1. The four manifest edits above (one line each, `"motion": ...`). Then
   delete the matching rows of `PENDING_RENAME` in
   `packages/motion/src/catalog.test.ts`; the test tells you when.
2. Decide on `press`: either accept `none` for press feedback (CSS only, no
   catalog entry) or let 1.21 add a 19th id `press` (scale.press,
   spring.press). The 18 ids were fixed by the order, so I did not add it.
3. Window.tsx: no change needed. `animateWindow`, `settle` and `settled` are
   exported from the barrel as before, and `styleMotion.ts` still finds
   `WindowMotionMode` and `preset.window`. Optional later: read
   `patternPreset(style, 'window-grow')` instead of the `window` mode once
   the Theme carries presets.
4. Toast.css line 158 and 165 use a raw `scale(0.98)`. The catalog reads
   `scale.dialog-enter` (0.98). Suggested change in Toast.css:
   `scale(0.98)` to `scale(var(--ds-scale-dialog-enter))` in both
   keyframes. Same value, now a token.
5. `packages/manifest/manifests.gen.json` on the lead branch is stale
   against the source manifests (`npm run gen` rewrites it). I left it as
   it was; regenerate on merge.

## Decisions

- `window-close` is not one of the 18 ids. It is the exit phase of
  `window-grow`; the function `windowClose` and the `window-close` spec name
  stay for Window.tsx.
- Window keyframes keep their literal numbers (0.92, 0.2, 0.55, 0.7, 0.35)
  so the values are the same as before; `WINDOW_REST_SCALE` is checked
  against `scale.window-enter`.
- Loops and WCAG 2.2.2 (pause, stop, hide): `skeleton-shimmer` stops after 3
  loops (4.2s). `spinner` and `thinking` loop while work runs: they are the
  activity indicator itself, stop when the work ends, show nothing under
  reduced motion, and must carry a text state. `thinking` cycles at 1.4s,
  far under three flashes a second (WCAG 2.3.1).
- `accordion-height` puts the motion on an inner clip: the panel takes its
  height at once and the clip scales on the block axis. Components need a
  clip element for it.
- `animate` cancels only the running animation it started on that element
  (`id` `ds-motion:<pattern>`), so a spinner and a fade on one element do
  not cancel each other. `animateWindow` still cancels everything, as
  before.
- Distances and scales in keyframes use `var(--ds-..., fallback)`. If a
  browser could not resolve `var()` in WAAPI keyframes it would drop that
  frame's transform; Chromium, Firefox and Safari resolve it.

## Review

No subagent review in this lane. Self review against the order: 18 ids, one
file each, values from tokens, reduced forms, WAAPI helper returning the
Animation, native numbers, window patterns moved with the same values,
style presets, the manifest test. Open for the lead's QA: the patterns
other than dialog, toast and window are not yet played by a component, so
their look is unproven until 1.21.

## Could not do

- Neutral preset: 1.10 not on this branch.
- A `/motion` gallery page: not required by the order.
