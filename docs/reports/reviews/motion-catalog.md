# Review: motion catalog (order 1.11)

Reviewer: ds-qa, fresh eyes. Branch `claude/ds-review-9`. Scope:
`packages/motion/**` and `packages/styles/{studio,desk,neutral}/motion.ts`.
No source file was edited.

## Summary

Overall verdict: **fix needed before order 1.21 builds on it.** The
catalog is close to done. All 18 ids exist with the exact names. Every
token path exists in the base tokens, in `tokens.css` and in every native
theme. Every keyframe, full and reduced, holds only `transform` and
`opacity`. The reduced forms are honest. The window patterns kept their
values (600 input cases compared with the old `window.ts`, 0 differences),
and the React Window contract run passes (29 of 29). Native values are
numbers. Nothing in the catalog flashes more than three times a second at
the token values in use.

Three blockers:

1. `settled()` never resolves when it is called after the Animation was
   cancelled (proved in Chromium). Its doc comment promises the opposite.
2. Four manifests name a pattern that is not in the catalog (`press` three
   times, `fade` once), and the manifest test lets them pass through a
   `PENDING_RENAME` allow list, so the check order 1.11 asked for does not
   fail.
3. `spinner` and `thinking` loop forever, and there is no API or written
   way to pause them, which PLAN.md section 12 (WCAG 2.2.2) and the 1.21
   rules require.

The style presets for Studio and Desk follow the dials. Neutral does not
fully follow its dial (150 to 200ms, ease out): `number-roll` plays 300ms,
`chart-draw` plays 640ms, and four patterns keep a non ease out curve.

## Verdict per pattern

| Pattern | Verdict | Main reason |
| --- | --- | --- |
| `fade-rise` | pass | |
| `menu-scale` | pass | Note: the origin stays as an inline style after the animation |
| `dialog` | pass | Same values as Dialog.css |
| `sheet` | pass | |
| `toast` | pass | Same values as Toast.css |
| `accordion-height` | pass | No height. Note: `scaleY(0)` on the clip squashes the content |
| `tab-indicator` | pass | |
| `list-stagger` | pass | |
| `drag-drop` | pass | |
| `window-grow` | pass | Same values as the old window.ts. Note: literal 0.92 |
| `window-zoom` | pass | Same values |
| `window-minimize` | pass | Same values. Note: literal scales 0.2, 0.55, 0.7 |
| `skeleton-shimmer` | pass | 3 loops, 4.2s. Note: the cap depends on a token a style may change |
| `spinner` | fix needed | Infinite loop, no pause path (blocker 3); native `iterations: Infinity` |
| `number-roll` | pass | Note: rapid value updates; Stat does not use it |
| `chart-draw` | fix needed | The origin is wrong on an SVG group without `transform-box: fill-box` |
| `thinking` | fix needed | Infinite loop, no pause path (blocker 3) |
| `streaming-text` | pass | There is no cursor blink in the catalog |
| Style presets | fix needed | Studio and Desk pass; Neutral breaks its 150 to 200ms dial |
| Web helper (`play`, `settled`, `animateWindow`) | fix needed | `settled()` after cancel hangs (blocker 1); a quick reverse jumps |

## Findings

### Blockers

**B1. `settled()` hangs when it is called after a cancel.**
`packages/motion/src/core.ts:301` to `308`. When an Animation is
cancelled, the browser rejects its current `finished` promise and puts a
new, pending one in its place. `settled(a)` called after `a.cancel()`
awaits the new promise, which never settles while the animation stays
idle. The Playwright run found it still pending after 1000ms. Window.tsx
is safe today only because it calls `settled()` in the same tick as
`animateWindow()`. A component that awaits later, for example after
`settle(el)` has run in a move handler, never unmounts.
Fix: at the top of `settled`, return at once when
`animation.playState === 'idle'`, then await `finished`. Add a browser test
or a fake that swaps the promise on cancel.

**B2. The manifest check lets names that are not patterns pass.**
`packages/motion/src/catalog.test.ts:196` to `199`. `PENDING_RENAME` allows
`press` and `fade`, so `npm run check` is green while
`packages/manifest/src/component/Button.manifest.json:281`,
`IconButton.manifest.json:239`, `WindowControls.manifest.json:119` (`press`)
and `Input.manifest.json:182` (`fade`) name patterns that do not exist.
Order 1.11 says the test fails in that case. Also, the test reads
`manifests.gen.json` (`catalog.test.ts:202`), which the builder says was
stale on the lead branch; a stale file hides new names.
Fix: the lead edits the four manifests (`fade` to `fade-rise`; `press` to
a decision: drop the field or add a `press` id in 1.21), then deletes
`PENDING_RENAME`. Read `packages/manifest/src/component/*.manifest.json`
directly, or run after `npm run gen`. Better still, make `motion` in
`packages/manifest/schema.json:241` an enum of `PATTERN_IDS`.

**B3. No way to pause the loops that run past five seconds.**
`packages/motion/src/patterns/spinner.ts:17`,
`packages/motion/src/patterns/thinking.ts:33`, `packages/motion/src/core.ts`
(no API). Both loop with `iterations: Infinity`. PLAN.md section 12 asks
for a pause control for anything that plays more than five seconds, and
order 1.21 repeats it. A caller can call `.pause()` on the returned
Animation (proved in Chromium), but nothing documents it, nothing ties it
to a pause control, and `thinking` is decoration, not the only signal of
work. The builder's argument (an activity indicator stops when the work
ends) fits WCAG's essential exception only when nothing else on the page
can be used during the wait.
Fix: add `pauseLoops(root)` and `resumeLoops(root)` to `core.ts` that
pause and play every `ds-motion:*` Animation under `root` with infinite
iterations, and document it in each loop file. Give `thinking` a cap like
the shimmer: compute the iterations from the token so it stops before
5000ms and then holds a still frame. For `spinner`, write down the
essential exception and when it applies, and point to `pauseLoops` for the
other cases.

### Notes

**N1. A quick reverse jumps.** `packages/motion/src/core.ts:284` to `286`.
`play()` cancels the running animation of the same id and starts the new
one from its first keyframe. In Chromium, a dialog enter interrupted at
30ms was at opacity 0.22; the exit started at opacity 1. The final state is
right (exit ends hidden, enter ends visible and in place), but a fast
open and close shows a jump to full opacity. Fix: when the running
animation of the same pattern is the opposite phase, call `reverse()` on
it and return it, or read the computed `transform` and `opacity` before
the cancel and use them as the first frame.

**N2. An exit of one pattern can hide a later enter of another.**
`packages/motion/src/core.ts:284` to `286`. Exits use `fill: 'forwards'`
and stay alive. `play()` cancels only its own id, so a `fade-rise` exit
followed by a `dialog` enter on the same element ends at opacity 0
(proved in Chromium). Fix: cancel every `ds-motion:` animation that has
`fill` `forwards` before starting a new one, or call `commitStyles()` and
cancel when an exit finishes.

**N3. `prefix` does not reach the keyframes.**
`packages/motion/src/patterns/values.ts:7` and `11` call `cssToken()`
without a prefix, so keyframes always read `--ds-*`, while durations and
eases follow `opts.prefix`. Fix: build the keyframe values from the prefix
the caller gives, or remove `prefix` from `AnimateOptions`.

**N4. Without the token CSS every animation plays in 0ms.**
`packages/motion/src/core.ts:257` to `263`. `readDuration()` returns 0 for
a missing variable (proved on a page without `tokens.css`). That is safe,
but silent. Fix: fall back to `durationMs` from `tokens.ts` when the
variable is empty, and keep 0 only when the variable says `0ms`.

**N5. Native values ignore the style.** `packages/motion/src/tokens.ts:10`
and every `native` block. Native values come from the base tokens, so
Neutral's native toast enter reads 140, while the native theme
(`packages/tokens/dist/native/neutral.dark.ts`) has `toast-enter: 180` and
`base: 150`. Fix: give `native` token names next to the numbers, and let
the wave 2 Reanimated helper read the numbers from the active theme.

**N6. Native values that are not plain numbers.**
`packages/motion/src/patterns/spinner.ts:24` (`iterations: Infinity`):
`JSON.stringify` writes `null`, and Reanimated's `withRepeat` wants `-1`.
`thinking` has no `iterations` in its native block at all, though it loops.
`easing: 'linear'` in `spinner.ts:22` and `skeleton-shimmer.ts:29` is a
string. `NativeMotion` has
`[key: string]: unknown` (`core.ts:83`), so nothing types the other fields.
Fix: `iterations: -1` for infinite, `easing: [0, 0, 1, 1]` for linear, and
one typed native shape.

**N7. Window keyframes hold literal numbers, not tokens.**
`packages/motion/src/patterns/window-shared.ts:35` (`0.92`),
`window-grow.ts:20` and `30`, `window-minimize.ts:19` and `30` (`0.2`,
`0.55, 0.7`, opacity `0.9`, `0.35`). The values match the old file, as the
order asked. But `window-grow` lists `scale.window-enter` as a token it
reads, and a style that changes that token changes nothing on the web.
Fix: use `scale('scale.window-enter')` in the keyframes (the value stays
0.92), and add tokens for the minimize scales in a later order.

**N8. `chart-draw` on SVG.** `packages/motion/src/patterns/chart-draw.ts:26`.
The pattern scales a series group. On an SVG element `transform-box`
defaults to `view-box`, so the origin `0 50%` is the chart's view box, not
the group. Fix: set `transform-box: fill-box` with the origin in `play()`
for SVG elements, or document that the caller sets it.

**N9. `accordion-height` squashes the content.**
`packages/motion/src/patterns/accordion-height.ts:14`. Scaling the clip
from `scaleY(0)` scales the text inside it, so lines look squashed while
they open. Fix: move the scale to a reveal of the clip and a counter
transform on its child, or use `translateY(-100%)` of the content inside
the clip.

**N10. The shimmer cap depends on a token a style may change.**
`packages/motion/src/patterns/skeleton-shimmer.ts:10`. Three loops of 1.4s
is 4.2s. A style that sets `duration.shimmer` to 2s plays 6s. The test
(`catalog.test.ts:114`) checks the base value only. Fix: compute the
iterations in `play()` as `floor(4999 / duration)` from the live token, at
least 1. Also, `packages/css/src/components/Skeleton.css:60` loops
`infinite` on `ease.default` while the catalog says 3 loops, linear: the
component does not follow the catalog yet.

**N11. Rapid number updates.** `packages/motion/src/patterns/number-roll.ts:15`
to `38`. Each change fades the digit from 0 to 1 over 300ms. A live
counter that updates more than three times a second would flash the
same area that often. Fix: document that callers skip the roll when the
last one started less than one duration ago. Also,
`packages/react/src/components/Stat/Stat.tsx:171` to `174` plays its own
roll (`translateY(40%)`, `ease.reveal`) instead of the catalog's
(`100%`, `ease.emphasized`).

**N12. Preset overrides cover both phases and the reduced form.**
`packages/motion/src/core.ts:151` to `152`. A preset `duration` or
`easing` replaces the exit timing too and the reduced fade too, so Neutral
cannot set an ease out enter without also changing the exit curve. Fix:
let `PatternPreset` take `enter` and `exit` timing apart.

**N13. Neutral preset does not meet its dial.**
`packages/styles/neutral/motion.ts:8`. With Neutral tokens (base 150,
medium 180): `number-roll` 300ms, `chart-draw` 640ms, `menu-scale` exit
100ms, all outside 150 to 200ms. `menu-scale`, `sheet`, `drag-drop` and
`number-roll` use `ease.emphasized`; `accordion-height` and `tab-indicator`
use `ease.standard` (ease in out). Fix: add rows
`'number-roll': { mode: 'full', duration: 'duration.slow' }`,
`'chart-draw': { mode: 'full', duration: 'duration.slow' }`, and
`easing: 'ease.out'` for `accordion-height` and `tab-indicator` (after
N12, for the enter only).

**N14. Studio stagger runs past 220ms.**
`packages/styles/studio/motion.ts:14`. `list-stagger` at `duration.base`
still waits up to 8 steps of 80ms, so the last item ends at 760ms. Fix:
play `list-stagger` in its reduced form in Studio, or cap the steps per
preset.

**N15. Presets other than the window mode are not read at run time.**
`packages/react/src/components/Window/styleMotion.ts` reads only
`preset.window`, and only for Studio and Desk (Neutral falls back to
`fade`, which happens to match). No component passes `preset` to
`animate()`. The per pattern rows have no effect yet. Fix: carry the
preset in the Theme context (order 1.21) and pass it in every call.

**N16. Weak or tautological tests.**
`packages/motion/src/preset.test.ts:23` to `27` checks only the durations
a preset overrides, not the resolved duration of every pattern, so
dropping the `chart-draw` row (640ms) would pass. There is no lower bound
(70ms). `preset.test.ts:29` to `33` tests that Desk rolls numbers, which is
the default whether or not Desk says so. Neutral has no test at all.
`catalog.test.ts:90` to `94` checks only `duration` and `easing` of the
native block. `catalog.test.ts:126` to `181` uses a fake element, so it
checks the arguments passed to `animate`, not what a browser does (cancel,
`finished`, 0ms); B1 and N1 slipped through. No test bounds the flash rate.
Fix: resolve `specFor` for every pattern with each style's tokens and
assert the range; add Neutral; add a Playwright test like the one in "How
this was checked"; add a flash test (opacity swings per second at or
under 3 for every loop, at every style's token values).

**N17. Two window helpers.** `packages/motion/src/window.ts:50` to `55`.
`animateWindow()` cancels every animation on the element and gives its
Animation no id, while `play()` cancels only its own id. A spinner in a
window title bar would be cancelled by a window zoom. Fix: let
`animateWindow` call `play()` with the pattern id.

**N18. The origin is left inline.** `packages/motion/src/core.ts:288` and
`window.ts:55` set `style.transformOrigin` and never restore it. For menus
it overrides the Radix origin variable unless the caller passes it. Fix:
restore the previous inline value when the animation finishes or is
cancelled.

**N19. Manifest names that exist but describe other motion.**
`StatusDot.manifest.json:95` says `thinking`, but StatusDot plays a ring
that grows and fades three times. `ProgressBar.manifest.json:122` says
`spinner` for a bar that slides. `ProgressCircle.manifest.json:116` says
`spinner` (a fair match). `Meter.manifest.json:129` says `number-roll` for
a fill. `NotificationCenter.manifest.json:120` says `list-stagger` but no
stagger plays. Fix: decide in 1.21 whether to add `pulse`, `bar-slide` and
`fill` ids, or change these values; see `docs/plan/wave-1-followups.md`
items 4 and lane 5c 1 and 2.

## Manifest motion names not in the catalog

| Component | Manifest | Value | Suggested |
| --- | --- | --- | --- |
| Button | `packages/manifest/src/component/Button.manifest.json:281` | `press` | a `press` id in 1.21, or remove the field |
| IconButton | `packages/manifest/src/component/IconButton.manifest.json:239` | `press` | same as Button |
| WindowControls | `packages/manifest/src/component/WindowControls.manifest.json:119` | `press` | same as Button |
| Input | `packages/manifest/src/component/Input.manifest.json:182` | `fade` | `fade-rise` |

`pulse` is not named in any manifest today. StatusDot names `thinking` as
the closest id (see N19). The catalog test does not catch the four rows
above because `PENDING_RENAME` allows `press` and `fade` (B2).

## Flash rate (WCAG 2.3.1)

| Loop | What changes | Period from tokens | Rate |
| --- | --- | --- | --- |
| `spinner` | rotation only, no opacity | `duration.spin` 800ms | 1.25 turns a second, no flash |
| `thinking` | each dot: opacity 0.4 to 1 to 0.4, lift 3px | `duration.shimmer` 1400ms | 0.71 a second per dot; three dots in turn, 2.14 a second over the group |
| `skeleton-shimmer` | a highlight moves, transform only | `duration.shimmer` 1400ms, 3 loops | 0.71 a second, no opacity swing |
| `streaming-text` | each new chunk fades in once | `duration.base` 120ms | one fade per chunk, never on the same text twice; no cursor blink exists |
| StatusDot pulse (component CSS, for reference) | ring grows and fades | 1400ms, 3 loops | 0.71 a second |

All under three a second at the token values of every style today. No
guard stops a style from shortening `duration.shimmer` (see N16).

## One convention

1. **One web helper.** `play()` and `animateWindow()` differ in what they
   cancel and whether they set an id. Recommendation: `animateWindow` calls
   `play()`.
2. **Keyframe values.** Most patterns read scales and distances as
   `var(--ds-..., fallback)`; the window patterns use literal numbers.
   Recommendation: every scale and distance through `var()`, with tokens
   for the minimize scales.
3. **Reduced duration.** On the web the reduced fade plays 0ms under the
   OS setting (every duration token is 0ms); the native block says 120ms.
   Recommendation: `reducedDuration` is what a preset `reduced` mode plays,
   and both platforms use 0ms when the person asks for reduced motion.
4. **Loops.** Shimmer stops after 3 loops, StatusDot after 3, spinner and
   thinking never, Skeleton.css never. Recommendation: every loop either
   stops before 5000ms, with the count computed from the live token, or is
   paused through `pauseLoops`.
5. **Export names.** `dialogMotion`, `sheetMotion`, `spinnerMotion`,
   `thinkingMotion`, `toastMotion`, `windowGrowPattern` next to bare
   `fadeRise`, `menuScale`, `chartDraw`
   (`packages/motion/src/catalog.ts:72` to `91`). Recommendation: one suffix
   for all, or use `catalog[id]` only.
6. **Native shape.** Field names vary (`exitDuration`, `liftDuration`,
   `translateY`, `liftY`, `fromScale`, `fromScaleY`, `restScale`), easing is
   an array or `'linear'`, infinity is `Infinity`. Recommendation: one typed
   shape with `enter`, `exit` and `reduced` timings, bezier arrays only, and
   `-1` for infinite.
7. **Source of the values.** Dialog.css, DropdownMenu.css, Toast.css,
   Skeleton.css and Stat.tsx hold their own copies of the motion.
   Recommendation: the catalog is the source, and a test compares each
   component's keyframes and timing tokens with its pattern.
8. **Preset timing.** A preset row changes enter, exit and reduced timing
   together. Recommendation: separate `enter` and `exit` rows.
9. **Manifest `motion`.** A free string in the schema, checked by a test
   with an allow list. Recommendation: an enum of `PATTERN_IDS` in
   `schema.json`, generated.

## How this was checked

| Step | Command or script | Result |
| --- | --- | --- |
| Read | AGENTS.md, `.claude/agents/ds-qa.md`, `docs/contracts/*`, PLAN.md 3.4, 3.6, 3.7, 12, wave-1.md orders 1.11 and 1.21, then `docs/reports/lanes/order-1-11.md` last | done |
| Unit tests | `npx vitest run packages/motion` | 4 files, 155 tests pass |
| Token build | `npx tsx packages/tokens/build.ts` | 6 modes, 21 files |
| Token paths | a tsx script over every `pattern.tokens`, the `tokens.ts` tables and the preset rows, against `dist/css/tokens.css` and `dist/native` `themes` (all six modes) | 34 paths, none missing in CSS or native |
| Native values | the same script printed every `native` block | all numbers or number arrays, except `easing: 'linear'` and `iterations: Infinity` (N6) |
| Window values | a tsx script compared `windowMotionFor` of the old `window.ts` (`git show e861fe6:packages/motion/src/window.ts`) with the new one over 4 patterns, 3 modes, 5 by 5 rects, reduced on and off | 600 cases, 0 differences |
| Window contract | `npm run contract -- --framework react --component Window` | 29 passed, 0 failed |
| Browser run | the motion barrel bundled with esbuild to an IIFE, loaded with `tokens.css` into a page in headless Chromium (`require('playwright')`, `chromium.launch()`), 53 checks | 50 pass, 3 fail (below) |
| Manifests | a Python script over `packages/manifest/src/component/*.manifest.json` and `manifests.gen.json` | 28 values, 4 not in the catalog |
| Full check | `npm run check` | exit 0; vitest 77 files, 828 tests pass |

What the browser run did, with results:

- Played every pattern on every branch with `reduced: false`, finished it
  and read the computed style: every keyframe holds only `transform` and
  `opacity`, enters end at `transform: none` and opacity 1, exits hold the
  last frame, `list-stagger` index 2 has a 160ms delay with `backwards`
  fill, the loops report infinite or 3 iterations. Pass.
- Token reads: `toast-enter` resolves through its alias to 140 in Studio
  and 180 in Neutral; `1.4s` reads as 1400. Pass.
- Quick reverse by a new call (enter, exit at 30ms, enter at 30ms): the
  earlier animations are cancelled and the final state is right. Pass.
  The exit starts at opacity 1 while the enter was at 0.22. Fail (N1).
- `Animation.reverse()` of an exit returns the element to its rest frame.
  Pass.
- Cancel: `settled()` taken before the cancel resolves at once and the
  element is at rest. Pass. `settled()` called after the cancel was still
  pending after 1000ms. Fail (B1).
- A `fade-rise` exit then a `dialog` enter on one element ends at opacity
  0. Fail (N2).
- Emulated `prefers-reduced-motion: reduce`: `dialog` plays opacity only at
  0ms and settles at once; the exit ends hidden; `spinner`, `thinking` and
  `skeleton-shimmer` return null; a forced full spinner at 0ms with
  infinite iterations still finishes; `animateWindow` plays opacity only.
  Pass.
- A spinner paused through the returned Animation stays still. Pass.
- A page without `tokens.css` plays every animation in 0ms (N4).

Scratch files: `/tmp/claude-0/motion-review/` (`pw.cjs`, `pw.log`,
`tokens-check.ts`, `native-check.ts`, `window-diff.ts`, `old-window.ts`,
`contract-window.log`, `check.log`).
