# Order 1.29, lane styles and platforms

Fix round 1 after the round 3 interaction review. Style recipes of Studio,
Desk, Neutral and Liquid, the platform files (hooks only), the window motion
preset, and the registry text. Gallery on port 5187. Not committed (the lead
snapshots the tree). Every look stays proposed.

## Hooks set

| Hook | Where (file, selector) | Value | Replaces |
| --- | --- | --- | --- |
| `optionalParts['alert-dialog']`, `sheet` (`controls`, `titlebar`), `popover` (`titlebar`) | `packages/styles/desk/style.json` | on | the faked AlertDialog band, the Popover's yellow top edge |
| `--_title-bar-bg`, `--_title-bar-border-color` | `desk/recipes/Dialog.css`, `:is(dialog, alert-dialog, sheet) > panel > titlebar` | primary tint, glass hairline | (the Dialog rule, now the whole family) |
| `--_title-bar-bg`, `--_title-bar-border-color` | `desk/recipes/Popover.css`, `[data-ds='popover'] > titlebar` | primary tint, glass hairline; the bar bleeds to the edges (negative margins of `--_popover-padding`) and its title gets `padding-block: space.s` | the inset yellow edge in `--_popover-shadow` |
| `--_dialog-scrim-saturate` | `desk/recipes/Dialog.css`, the family | `var(--ds-blur-window-saturation)`; `1` in reduced transparency, more contrast (both forms), forced colors and no backdrop filter | the saturation the 1.28 B9 fix had dropped |
| `--_dialog-scrim` | `desk/recipes/Dialog.css`, reduced transparency | `var(--ds-color-bg-scrim-80)` | Desk kept 0.28 (review B9, second point) |
| `--_command-palette-scrim-filter` | `desk/recipes/CommandPalette.css`, `prefers-contrast: more`, `[data-contrast='more']`, `forced-colors: active` | `none` | the blur and saturation left in those modes |
| `--_toast-columns`, `--_toast-edge-width` | `desk/recipes/Toast.css`, `[data-ds='toast']` | `control-xs minmax(0,1fr) auto`; `border.width.strong * 1.5` | direct `grid-template-columns`, `border-inline-start-width` and `-color`, the tone edge as an inset shadow, its RTL twin, the forced colors border rules |
| `--_toast-columns`, `--_toast-areas` | `studio/recipes/Toast.css`, `[data-ds='toast']` | the one line strip | direct `grid-template-columns`, `-areas`, `-rows` |
| `--_switch-radius`, `--_switch-thumb-radius` | `studio/recipes/Switch.css`, `[data-ds='switch']` | `radius.xs`, `0` | three part rules (`border-radius` on the control, ring, track, fill, thumb; `clip-path: none` on the fill) |
| `--_radio-group-radius`, `--_radio-group-dot-radius`, `--_radio-card-indicator-radius` | `studio/recipes/Checkbox.css` | `radius.xs`, `0`, `radius.xs` | two part rules |
| `--_dialog-enter-scale` | `packages/css/src/platform/android.css`, `[data-platform='android'] [data-ds='sheet']` | `var(--ds-scale-window-enter)` (0.92) | the Sheet slid only |
| `--_field-lift` | `studio/recipes/Field.css` (new), `[data-ds='field']`, with both reduced forms at 0px | `space.fixed-4xs` (2px) | Studio's label did not rise (fields report) |
| `radio-pop: 'full'` | `studio/motion.ts`, regenerated `studio/recipes/Motion.css` | the radio plays in full | N3: the `pop: reduced` row had set `--_radio-group-motion: 0` |

Not set, by decision:

- `--_skeleton-swap`, `--_progress-circle-ease-full`: no style asks for
  another value; the defaults (`wipe`, `ease.out`) suit all four.
- Sheet detents on ios: the overlays lane made detents an app prop (the
  handle turns into a button); a platform file cannot turn behavior on.
- Platform toast rules stay direct properties. `ios.css` and `android.css`
  sit in `ds.platform`, which the recipe layer beats: if they moved to
  `--_toast-columns` and friends, a style's hook would win over the platform.
  As direct properties they win over the component rule that reads the
  hooks, so with the recipes on hooks the android snackbar now holds for
  Studio and Desk too (it did not for Studio before). Checked: Studio and
  Desk on android compute the snackbar areas and a 0px edge.

## Workarounds deleted

- Desk AlertDialog title band: the two gradient background layers on the
  panel, the icon margins placing it in the band, the title padding after
  it, and the forced colors reset. The icon keeps its glass tile.
- Desk Popover: the yellow inset edge on top.
- Desk Toast: the tone edge as an inset shadow (and its `:dir(rtl)` twin),
  the direct start border width and color, the forced colors border rules
  (the base already draws the edge in CanvasText).
- Studio Toast: the direct grid properties.
- Studio Switch: three part rules; Studio radio: two part rules.

## Notes fixed

| Note | Change | Proof |
| --- | --- | --- |
| N3 Studio radio motion | `studio/motion.ts` `'radio-pop': 'full'`; Motion.css regenerated (the radio-pop block is gone). Studio's scale.anticipate, scale.pop and dot travel are 1, 1 and 0, so it is a flat cut on its stepped eases | `packages/styles/motion-css.test.ts` (generated file in date) |
| N6 Liquid off thumb, light | the off thumb's control edge ring is `border.width.strong` (2px) instead of 1px, rest and held. White on the light track stays about 1.3:1 by design; the edge pair `border.control` on `bg.surface-4` is already a gate pair | switch probe, below |
| N18 Desk roll and press | `desk/recipes/Button.css`: while a button is `:active`, and while its form is `data-state='submitted'`, the label has no transform transition. The rolled label looks like the rested one (the copy takes its place), so only mid roll frames were seen; now none play under a press or the celebrate pop | `probe-submit-label.mjs` on 5187: 8 of 8 pass, Desk "arrive" travel 0 (the fields lane's run: 27.2px, fail). `styles-platforms.submit-label.json` |
| N20 Neutral timer line | none needed: 1.28 moved the line to the icon colour. Measured on 5187 in Neutral, web: info 7.9, success 5.48, warning 5.02, neutral tone 7.63 (light); 5.28, 7.47, 6.69, 7.58 (dark) | inline measure (card fill under the line) |
| N21 Liquid bottom toast | the travel was removed in 1.28 (the toast comes from its own edge); the stale header comment now says so | read |
| N24 Desk toaster | `gap: 0` and the negative margins were already gone (the review's lines 115 to 123 are the close control's `margin-block: 0`). Measured 5 to 6px between expanded cards; the Desk `--_toaster-gap: space.xs` override is removed so the list takes the base `space.s` (7px here) and each glass card stands apart | `shots/toast-expand.desk.*.png` |
| N39 Liquid SegmentedControl lens | no change: the review says it passes (the lens sits on a solid track) | |
| N42 registry text | 107 beats in `packages/motion/src/interactions/*.ts` now quote the tokens: Neutral snappy 158 (was 180), bouncy and soft 200 (was 220), morph 180 (was 200), celebrate 200; Desk bouncy 380 (was 440); Studio snappy 70 (was 80); Studio distances 0px (was 1, 2, 4px); Neutral distance.enter 4px (was 6px); slider pull from `distance.enter * 3` (Neutral 12px, Desk 36px, Studio 0px); Neutral popover unfold 0.98 by 0.93; the check draw fractions of Neutral morph (45, 72, 108ms) | `npx vitest run packages/motion` green |
| N43 android dot | none needed: `android.css` already sets `--_switch-thumb-size-rest: calc(16 / 28)` | read |
| Desk md Input on ios and android | `desk/recipes/Density.css` is scoped to `[data-platform='web']` (every rule: buttons, inputs, selects, comboboxes, rows), so the platform touch heights win | Desk md Input: web 35.5px, ios 44px, android 56px |
| Studio field label | `studio/recipes/Field.css` lifts by 2px | computed `translateY(-2px)` on focus; 0 under the media query and `data-motion='reduce'` |

## Window motion (hook-wiring, changes needed item 2)

- `packages/motion/src/window.ts`: `animateWindow` takes `preset` (a
  `PatternPreset`, the style's row for the pattern). In the full form its
  `enter` (grow, zoom, minimize) or `exit` (close) timing, else its
  `duration` and `easing`, replace the pattern's tokens; the reduced form and
  the `fade` mode keep their own timing.
- `packages/react/src/components/Window/styleMotion.ts`: rows for Neutral and
  Liquid (both fell back to `fade`; Liquid was missing too), and
  `windowMotionPreset(presetId, pattern)` gives the row to pass (close is the
  exit of `window-grow`).
- Tests: `window.test.ts` "plays the timing of the style preset row in the
  full form only" and `Window/styleMotion.test.ts` (2). All three fail on the
  HEAD sources (checked by restoring them) and pass now.

## Contrast

- `packages/lint/src/gates/contrast.test.ts`: pass, no new known failure.
- `switch-contrast.cjs` on 5187, Studio and Liquid, light and dark, web, ios
  and android (`styles-platforms.switch-contrast.json`): 69 of 72 runs pass.
  The three under 3:1 were already failing without this lane's changes and
  belong to the toggles lane's B3/B4 work:
  - Liquid light web, drag from off and from on, at progress 1 (the held
    clear lens at the end of the track): 2.13, the same with or without
    this lane's changes.
  - Liquid light android, toggle off by click: 2.81 with N6, 2.0 with the
    old 1px ring (measured by putting it back), so N6 raises it.

## Contract

`npm run contract -- --framework react --url http://127.0.0.1:5187
--component AlertDialog,Sheet,Popover,Dialog,CommandPalette,Toast,Button,Input,Switch,RadioGroup,RadioCard,Field`:
545 passed, 0 failed before my 25 minute timeout stopped it in Toast;
Toast alone: 57 passed, 0 failed.

## npm run check

Exit 1, no red step in this lane's files: eslint
(`packages/angular/src/components/select/select.motion.spec.ts:87`, unused
`items`), vitest (only the `no-tailwind` and `no-native-title` gates, both
5s timeouts under load), `gallery-angular` build (`TS2339: Property
'shownState' does not exist on type 'DsSwitch'`, toggles lane). Tokens
build, gen (adds `recipes/Field.css` to `studio/index.css`), typecheck,
manifests and the other workspaces pass.

## Decisions

- N18 is fixed in the look, not by delaying the roll: a delay would still
  run the roll during the celebrate pop.
- The Popover title bar bleeds to the popover's edges in the Desk recipe
  (negative margins of the popover padding, the top corners inherit the
  radius), since Popover.css places it inside the padding.
- Studio keeps 0px distances; only its field label lifts, by a fixed 2px
  token, so the lift is the same at every density.
- Liquid's capsule thumb (`--_switch-thumb-width`) is held back: at 1.3
  times the thumb size it lowers the toggles lane's failing lens frame from
  2.13 to 1.28:1. It goes in once that frame passes.

## What is left

- Liquid capsule thumb and the ios `--_switch-thumb-width`: held until the
  toggles lane's held lens frame passes (the capsule lowers it). The ios
  switch already stretches 1.3 while held. No toggles report has landed yet,
  and the lead has not messaged that the lane is done.
- `Window.tsx` must pass the preset (see "Changes needed from the lead").
- The short `styles:` summaries of the registry rows still quote some old
  numbers (for example `fields.ts` "a 4px slide in 220ms", "a 9px pull",
  `content.ts` "a 4px stepped slide", `navigation.ts` "a 1px lean"). They are
  not beats, so they were left.

## Changes needed from the lead

- `packages/react/src/components/Window/Window.tsx`: pass the style's timing
  at the five `animateWindow` calls, for example
  `animateWindow(el, 'grow', { mode, preset: windowMotionPreset(theme.styleData.motionPreset, 'grow'), from, to })`
  (and `'close'`, `'zoom'`, `'minimize'`, `'grow'` for the restore). Until
  then Studio windows still use `ease.window`.
- `packages/css/src/components/Popover.css`: give the title bar title
  `padding-block: var(--ds-space-s)` as Dialog.css does; the Desk recipe sets
  it for now.

## Contract text for the lead

- `docs/contracts/style-pack.md`, optional parts: Desk turns on
  `alert-dialog`, `sheet` (`controls`, `titlebar`) and `popover`
  (`titlebar`).
- `docs/contracts/style-pack.md`: a platform keeps its own layout as direct
  properties when a style sets the same layout through a hook (the recipe
  layer beats the platform layer, a direct platform property beats the
  component rule that reads the hook).
- `docs/reports/interactions-3.md` "Hooks for styles and platforms":
  `animateWindow` option `preset`; `windowMotionPreset` in React.

## Files changed

- `packages/styles/desk/style.json`; `desk/recipes/Dialog.css`,
  `Popover.css`, `CommandPalette.css`, `Toast.css`, `Density.css`,
  `Button.css`.
- `packages/styles/studio/recipes/Toast.css`, `Switch.css`, `Checkbox.css`,
  `Field.css` (new; `npm run gen` adds it to `studio/index.css`),
  `studio/motion.ts`, `studio/recipes/Motion.css` (generated by
  `packages/styles/motion-css.ts`).
- `packages/styles/liquid/recipes/Toast.css` (comment), `Switch.css` (N6).
- `packages/css/src/platform/android.css` (Sheet enter scale).
- `packages/motion/src/window.ts`, `window.test.ts`;
  `packages/motion/src/interactions/*.ts` (beat text only).
- `packages/react/src/components/Window/styleMotion.ts`,
  `styleMotion.test.ts` (new).
- `docs/reports/fixes/interactions-3/styles-platforms.md`,
  `styles-platforms.submit-label.json`, `styles-platforms.shots.cjs`,
  `shots/*.png`.
