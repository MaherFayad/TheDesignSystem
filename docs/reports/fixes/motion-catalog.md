# Fixes: motion catalog review

Agent: ds-motion. Branch `claude/ds-fix-motion`, from
`claude/relaxed-hypatia-7gseap`. Review: `docs/reports/reviews/motion-catalog.md`.
Owned files: `packages/motion/**` only. No manifest, style pack or
component file was edited.

## Commits

| Commit | What |
| --- | --- |
| `fix-motion: settled() resolves after a cancel` | B1 |
| `fix-motion: loops stop before five seconds or pause through pauseLoops` | B3, N6, N10 |
| `fix-motion: add fade and press patterns; the manifest check reads source manifests with no allow list` | B2 (motion side), new patterns |
| `fix-motion: a quick reverse starts from the live frame; ...` | N1, N2, N8, N17 |
| `fix-motion: presets take enter and exit timing apart ...` | N12 |

## Proof

| Step | Result |
| --- | --- |
| `npm run check` | exit 0, every step pass |
| `npx vitest run packages/motion` | 6 files, 207 tests with the Window tests, all pass |
| `npm run contract -- --framework react --component Window` | 29 passed, 0 failed |
| Chromium run: the motion barrel bundled with esbuild, loaded with `tokens.css` | `settled()` after a cancel settles; a dialog exit at 60ms into a 400ms enter starts at opacity 0.199, the live value (it was 1 before); a `fade-rise` exit then a `dialog` enter ends at opacity 1; `thinking` plays 3 loops; `pauseLoops(document)` pauses the spinner and the dots, `resumeLoops` plays them; a press released at 20ms starts from `scale(0.989)`; an SVG group gets `transform-box: fill-box`; `fade` exit ends at opacity 0 |

Each blocker has a test that failed before its fix (seen failing, then
passing): `play.test.ts` "resolves when it is called after a cancel (B1)",
the four tests under "loops" (B3), and in `catalog.test.ts` the id test that
now expects `fade` and `press` plus the manifest test that reads the source
files (B2).

## Blockers

| Finding | Status | What changed |
| --- | --- | --- |
| B1. `settled()` hangs after a cancel | fixed | `settled()` returns at once when `playState` is `idle`, then awaits `finished` as before. Test: a fake Animation that swaps its `finished` promise on cancel, as the browser does. |
| B2. Manifest names that are not patterns pass the check | fixed in motion; manifests are the lead's | `press` and `fade` are now catalog ids. `PENDING_RENAME` is gone. The test reads every `packages/manifest/src/component/*.manifest.json` directly, not `manifests.gen.json`, so a stale generated file cannot hide a name. Any value that is not a catalog id or `none` fails. Today no manifest names `press` or `fade` (the lead's merge set them to `none`), so the check is green. The schema enum is the lead's (below). |
| B3. `spinner` and `thinking` loop forever with no pause path | fixed | New in `core.ts`: `pauseLoops(root)` and `resumeLoops(root)` pause and play every catalog animation with more than one loop under `root` (a Document or an Element, subtree included), and return the count. `thinking` now stops before 5000ms: `loopLimitMs: 5000` on the spec makes `play()` count the loops from the live `duration.shimmer` (3 at 1.4s, 2 at 2s), then the dots rest at their first frame. `spinner` keeps looping: its file now writes down the essential exception (the spinner is the one sign of work and nothing else on the page can be used) and points to `pauseLoops` for every other case. WCAG 2.2.2. |

## Rows marked fix needed

| Row | Status | What changed |
| --- | --- | --- |
| `spinner` | fixed | B3, and native `iterations: -1` (was `Infinity`, which JSON writes as `null`) with `easing: [0, 0, 1, 1]` (was `'linear'`). |
| `chart-draw` | fixed | `play()` sets `transform-box: fill-box` on any SVG element before it plays, so the origin is the element's own box. This helps every pattern played on SVG, not only `chart-draw`. |
| `thinking` | fixed | B3. Native gets `iterations: 3`. |
| Style presets | partly fixed | Neutral's file is `packages/styles/neutral/motion.ts`, which I do not own. What it needs is in place: a preset row now takes `enter` and `exit` timing apart (N12), and no preset row changes the reduced form any more. The exact Neutral rows are below under "Changes needed from the lead". |
| Web helper | fixed | B1, and N1, N2 and N17 below. |

## Notes

| Note | Status | Why |
| --- | --- | --- |
| N1. A quick reverse jumps | fixed | `play()` looks for catalog animations it replaces (its own id, its group, or a held exit). When one is still running or paused, it reads the live `transform` and `opacity` of the element before the cancel and uses them as the first keyframe. Proved in Chromium. Also covers a quick release of `press`. The duration stays the full token value; scaling it to the distance left is a later refinement. |
| N2. A held exit of one pattern hides a later enter of another | fixed | `play()` also cancels any catalog animation whose fill is `forwards` or `both`. Loops and staggered enters (fill `none` or `backwards`) keep playing. |
| N3. `prefix` does not reach the keyframes | not fixed | It changes the signature of every pattern `spec` and its tests. No component passes a prefix today. Left for the wave 2 pass. |
| N4. Without token CSS every animation plays in 0ms | not fixed | A silent 0ms is safe, and a fallback would mean telling an empty variable from a real `0ms`, which reduced motion sets. Left as is, by choice. |
| N5. Native values ignore the style | not fixed | Needs the wave 2 Reanimated helper that reads the active native theme. |
| N6. Native values that are not plain numbers | fixed | `NativeMotion.easing` is a bezier array only; `iterations` is typed, `-1` means until stopped. The catalog test now fails on any native number that is not finite. The other free fields (`liftY`, `fromScale` and so on) are still untyped; one shape is a wave 2 change. |
| N7. Window keyframes hold literal numbers | not fixed | The window values must stay byte equal to the old `window.ts` (600 case diff in the review). Moving to `var()` changes those strings and the minimize scales need new tokens, which I do not own. |
| N8. `chart-draw` on SVG | fixed | See the table above. |
| N9. `accordion-height` squashes the content | not fixed | The fix is a counter transform on the child, which needs a second element and so a change in the Accordion markup. That is component work for order 1.21. |
| N10. Shimmer cap depends on a token | fixed in motion | Same `loopLimitMs` as `thinking`: 3 loops at 1.4s, 2 at 2s. `Skeleton.css` still loops `infinite`; that file is not mine (below). |
| N11. Rapid number updates | not fixed | Stat plays its own roll; the rule belongs in Stat. Below. |
| N12. Preset rows cover both phases and the reduced form | fixed | `PatternPreset` has `enter` and `exit` timing rows that win over `duration` and `easing`; the reduced form keeps its own timing. Test in `preset.test.ts`. |
| N13. Neutral breaks its dial | not fixed here | Not my file. Rows below. |
| N14. Studio stagger past 220ms | not fixed here | Not my file. Row below. |
| N15. Presets not read at run time | not fixed | Needs the preset in the Theme context (order 1.21). |
| N16. Weak tests | partly fixed | Added: a browser like fake for cancel (`play.test.ts`), the loop cap at a changed token, the native finite number check, the per phase preset test. Not added: a resolved duration range per style (it would fail on Neutral until the lead edits its file) and a Playwright test in `npm run check` (the check has no browser step for packages). |
| N17. Two window helpers | fixed | `animateWindow` now calls `play()` with the pattern name as the Animation id (`ds-motion:window-grow` and so on) and the group `window-`: it replaces window motion only, so a spinner in a title bar keeps turning. Window contract: 29 of 29. |
| N18. The origin is left inline | not fixed | Restoring the origin when an exit ends would move the held last frame. A safe version needs to know which animation set the origin; left for wave 2. |
| N19. Manifest names that describe other motion | not fixed | Manifests are the lead's. `pulse`, `bar-slide` and `fill` were not asked for in this order. |

## The two new patterns

**`fade`** (`packages/motion/src/patterns/fade.ts`). Opacity 0 to 1 on enter,
backward on exit with the last frame held. `duration.base` on `ease.default`
in both phases, the timing the controls already use in their CSS, so a later
test can compare component CSS with the catalog without a mismatch. The
reduced form is the same fade: it holds no motion, and on the web every
duration is 0ms under reduced motion, so the change is instant there.
Native: 120ms, `ease.default`, reduced 120ms.

**`press`** (`packages/motion/src/patterns/press.ts`). `enter` on press down:
`none` to `scale(var(--ds-scale-press, 0.97))` from the center, held with
fill `forwards`. `exit` on release: back to `none`. `duration.instant` (70ms,
"Keycap press") on `ease.out`. A release during the press starts from the
scale it reached (N1). Reduced: no motion, the pressed color carries the
state. Native: 70ms, `ease.out`, `pressedScale: 0.97`,
`spring: spring.press` (stiffness 520, damping 32, mass 1) for a Reanimated
spring, reduced 0. `duration.instant` is added to `tokens.ts` and checked
against the base tokens like the others.

Exports: `catalog.fade`, `catalog.press`, and `fadeMotion`, `pressMotion`.
`PATTERN_IDS` now has 20 ids.

## Changes needed from the lead

1. **Manifests that should name the new patterns.** Set `motion` and drop
   the "no catalog pattern" sentence from the motion note.

   | Manifest | Value | Why |
   | --- | --- | --- |
   | `Button.manifest.json` | `press` | Its note asks for a press pattern (`scale.press`, `spring.press`). |
   | `IconButton.manifest.json` | `press` | Same as Button. |
   | `WindowControls.manifest.json` | `press` | Its note asks for one. |
   | `Pagination.manifest.json` | `press` | Its only motion is the Button press. |
   | `Input.manifest.json` | `fade` | The focus glow fades; its note says `fade-rise` would also rise. |
   | `Textarea.manifest.json` | `fade` | Its note says "named fade like Input". |
   | `PasswordField.manifest.json` | `fade` | Focus glow, as Input. |
   | `PhoneField.manifest.json` | `fade` | Focus glow, as Input. |
   | `OTPField.manifest.json` | `fade` | Focus glow, as Input. |
   | `InlineEdit.manifest.json` | `fade` | The edit icon and the focus glow fade. |
   | `Checkbox.manifest.json` | `fade` | The mark and the focus glow fade. |
   | `CheckboxGroup.manifest.json` | `fade` | Its Checkbox items. |
   | `RadioGroup.manifest.json` | `fade` | The dot and the focus glow fade. |
   | `RadioCard.manifest.json` | `fade` | Same as RadioGroup. |
   | `Rating.manifest.json` | `fade` | The star fill and the focus glow fade. |
   | `Slider.manifest.json` | `fade` | The focus glow fades. |
   | `RangeSlider.manifest.json` | `fade` | Same as Slider. |
   | `Switch.manifest.json` | `fade` | The focus glow fades. The thumb slide (a transform transition in Switch.css) has no catalog id; leave it in the note. |

   After the edit, run `npm run gen` and `npm run check`: the catalog test
   fails on any name that is not an id.

2. **Make `motion` an enum** in `packages/manifest/schema.json:242`:
   `"enum": ["none", ...PATTERN_IDS]`, ideally generated from
   `packages/motion/src/core.ts` by `npm run gen`. This closes B2 at the
   schema level too.

3. **Neutral preset** (`packages/styles/neutral/motion.ts`), to meet its 150
   to 200ms ease out dial (N13):

   ```ts
   const motion: StyleMotionPreset = {
     id: 'fade',
     window: 'fade',
     patterns: {
       'number-roll': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
       'chart-draw': { mode: 'full', duration: 'duration.slow', easing: 'ease.out' },
       'menu-scale': { mode: 'full', enter: { easing: 'ease.out' }, exit: { duration: 'duration.base' } },
       sheet: { mode: 'full', enter: { easing: 'ease.out' } },
       'drag-drop': { mode: 'full', easing: 'ease.out' },
       'accordion-height': { mode: 'full', enter: { easing: 'ease.out' } },
       'tab-indicator': { mode: 'full', easing: 'ease.out' },
     },
   };
   ```

   Then add Neutral to `packages/motion/src/preset.test.ts` with a test that
   resolves every pattern's duration in Neutral's tokens and asserts 150 to
   200ms. I did not add that test because it fails until this file changes.

4. **Studio stagger** (`packages/styles/studio/motion.ts`, N14): change the
   `list-stagger` row to `{ mode: 'reduced' }`, so the last item does not
   end at 760ms.

5. **Skeleton.css** (`packages/css/src/components/Skeleton.css:60`): it loops
   `infinite` on `ease.default`; the catalog plays 3 loops, linear (N10).
   The Skeleton owner should play the catalog pattern or match it.

6. **Stat** (`packages/react/src/components/Stat/Stat.tsx:171`): play
   `catalog['number-roll']`, and skip the roll when the last one started
   less than one duration ago (N11).

7. **Components with a loop next to usable content** (any spinner that is
   not the one sign of work on a blocked page, and the thinking dots) should
   wire a pause control to `pauseLoops(root)` and `resumeLoops(root)` in
   order 1.21. Window.tsx needs no change: it already awaits `settled()`,
   which is now safe at any time.

## Decisions

- `fade` uses `ease.default` in both phases, to match the controls' CSS,
  not `ease.out` and `ease.exit` like `fade-rise`.
- `press` holds its pressed frame (`fill: forwards`) so a long press stays
  down; the release replaces it from the live frame.
- `play()` now replaces held exits of other patterns and leaves loops and
  staggered enters alone. `animateWindow` no longer cancels every animation
  on the element, only window motion and held exits.
- A preset timing row no longer changes the reduced form. No style relied on
  that: Studio's reduced rows carry no timing.
