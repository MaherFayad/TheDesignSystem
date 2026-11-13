# Order 1.29, styles lane: switch contrast closure (B3, B4)

Fix round 1 of the round 3 interaction review. This lane closed the 12 switch
frames the toggles lane left under 3:1 (B3, B4, WCAG 1.4.11), set the capsule
lens thumb on Liquid and iOS, gave Neutral's ToggleButton a clear on state
(N5), and matched Angular's ToggleGroup label handling to React
(angular-sync-3 section 6 item 2). N3 (Studio radio) was already landed by the
earlier styles lane; it is confirmed here, not re-touched.

Gallery on port 5191. Not committed. Every look stays proposed.

## 1. The 12 failing frames (B3, B4)

Baseline (this lane's recipes reverted, probe on 5191): 12 of 72 Desk and
Neutral dark runs under 3:1, lowest 2.68, as the toggles lane reported. Fixed
in the recipe and platform files with tokens only, no new hooks, no rename.

| Runs | Cause | Fix |
| --- | --- | --- |
| Desk, 6 runs 2.72 to 2.98 (off end held, Android drag, both schemes) | The white `material-glass-edge` rim sat on the thumb's outer edge, meeting the light track; the held ball also cast `elevation-tooltip` over the track | `desk/recipes/Checkbox.css`: the rim moved one ring-width in (inside `--_switch-thumb-ring-width`, so the ball's own color meets the track); held (`:active`), `--_switch-thumb-shadow` drops the tooltip elevation |
| Neutral dark iOS, 4 runs at 2.68 (held, drag) | Under the clear lens on the blue fill only the rim was left; Neutral maps `glass-highlight` to a dark divider (2.7:1 on the fill) | `neutral/recipes/Switch.css`: on the fill (`[data-state='checked']` held) the rim is `currentColor` (the thumb's own white). The held highlight (`--_switch-thumb-highlight-opacity-pressed`) is off on iOS: Neutral has no glass, and the dark highlight over the lens hid the ring |
| Neutral dark Android drags, 2 runs at 2.84 | The white pressed dot on the gray `border-control` track under the 12% state layer | `neutral/recipes/Switch.css`: on Android the off dot's edge hook (`--_switch-thumb-edge`) is `bg-surface`; on the dark track the white dot keeps 3:1, on light it matches the dot |

Off the fill, the iOS rim stays the platform default (it edges the white lens
on the gray track, which the hover lifts to `border-control-hover`).

**Proof.** Probe `switch-contrast.cjs` on 5191, all 4 styles x 2 schemes x 3
platforms x (toggle + drag) = 144 runs, written to
`switch-contrast.final.json`:

```
144 runs, 0 under 3:1. Worst neutral/dark/web drag-from-off 3.23 at 0.25.  exit 0
```

It failed first: the same probe on the reverted recipes gave 12 of 72 under
3:1 (lowest 2.68), and each fix was bisected with the probe's `--css` flag
before it went in the file (Desk: rim-in alone closed all of light but left
dark off-held at 2.92; rim-in plus no held elevation gave 36 of 36, lowest
3.34. Neutral iOS: thumb-color rim plus no held highlight gave 12 of 12,
lowest 3.37). The contrast gate stays green (4 known Desk dark failures, no
new one): `packages/lint/src/gates/contrast.test.ts` passes.

## 2. Capsule lens thumb on Liquid and iOS

`--_switch-thumb-width` is set to `calc(var(--_switch-thumb-size) * 1.5)` on
Liquid (`liquid/recipes/Switch.css`, web rule) and on platform iOS
(`platform/ios.css`). The iOS track was 51 by 31, too short for a 1.5x thumb
to travel or stretch (it nearly filled the track and barely moved), so the
iOS width went from `height * 1.65` to `height * 2` (62 by 31); the comment
and the header line were updated to match. `--_switch-travel-max` in
Switch.css already subtracts the thumb's extra length, so the capsule stays
in the track. Measured travel after: Liquid web 10px, Liquid iOS 15px,
Neutral iOS 22px, Studio/Desk iOS as before.

The full 144-run probe above was taken with the capsule in place: still 0
under 3:1. The capsule reads as a lens with clear travel in every style on
iOS (checked by eye: Liquid, Neutral, Studio square thumb, Desk glass ball).

## 3. N5 Neutral ToggleButton on state; N3 Studio radio

- **N5.** `neutral/recipes/Button.css`: the on state's inner ring
  (`--_toggle-on-ring`) is `--ds-color-primary-border` for the neutral tone.
  The gray `bg-overlay-50` ring read about 2.8:1 against the off fill; the
  brand border reads 3.84 (light) and 3.57 (dark) against the off fill and
  4.7 to 4.8 against the page, measured in the gallery. The flood stays 0
  (that is the release motion, not the on look). ToggleGroup items draw no
  ring (their pill shows the state), so they are untouched.
- **N3.** Already landed by the earlier styles lane: Studio computes
  `--_radio-group-motion: 1`, press-scale 1, dot-from 1, dot-travel 0px,
  fill-ease `steps(2, jump-end)` (read in the gallery). `studio/motion.ts`
  has `'radio-pop': 'full'`. No change made.

## 4. Angular ToggleGroup label dip

React's ToggleGroup keeps the inked label outside the indicator track: it
passes `{ el: pill }` to `followIndicator` and holds the label in its own
`inkLabel` ref, so `followIndicator` never calls `answerLabels` (no
dip and pop). Angular already did the same in `toggle-group.ts` (`followIndicator`
gets `{ el: pill }`, the label in `this.lastLabel`), but the header comment
still said React dipped the label and Angular did not copy it. The DOM and the
call now read as equal to React; the comment was corrected to say so.

Specs added to `toggle-group.spec.ts`:

- In the existing tab-slide test: no item label or icon is animated with a
  transform (the dip is a transform; `playInk` only holds its color). It
  fails when the label is handed to `followIndicator`: I added `label` to the
  `followIndicator` options, ran the spec (1 failed, "expected true to be
  false"), and restored the file (the restore is confirmed: no
  `anchor: root, label` left in `toggle-group.ts`).
- A new DOM-parity test: each item's children are `[pill, label, hit]`,
  `[pill, icon, hit]` (single) and `[label, hit]` (multiple), the same order
  as React's `ToggleGroup.tsx` with `ButtonRoot`.

`npx ng test --include .../toggle-group.spec.ts`: 18 of 18 pass.

## 5. Hooks

No hook added, renamed or removed. Reused: `--_switch-thumb-shadow`,
`--_switch-thumb-edge` (Neutral Android sets it to `bg-surface`),
`--_switch-thumb-highlight-opacity-pressed` (Neutral iOS sets 0),
`--_switch-thumb-width` (Liquid, iOS), `--_toggle-on-ring` (Neutral neutral
tone).

## 6. Proof

- `switch-contrast.final.json`: 144 runs, 0 under 3:1, probe exits 0.
- `npm run contract -- --framework react --component Switch,ToggleButton,RadioGroup`
  (url 5191): Switch 37, ToggleButton 37, RadioGroup 37, 0 failed.
- `npm run contract -- --framework angular --component ToggleGroup`:
  ToggleGroup 37, 0 failed.
- `packages/styles/motion-css.test.ts` and `contrast.test.ts`: 11 pass.
- `npm run check`: exit 1 only on `@the-system/angular`, from
  `packages/angular/src/components/field/field.parity.spec.ts` "a field glides
  what follows it ... (N12)", 1 of 744 tests. That file is the fields lane's,
  not this lane's; none of my files touch Field. Every other step passes
  (tokens, gen, typecheck, eslint, manifests, vitest, native, docs, both
  galleries, both consumers). My Angular toggle-group tests are in the 743
  that pass.

## 7. Files changed

- `packages/styles/desk/recipes/Checkbox.css`: switch rim moved in; held drops the tooltip elevation.
- `packages/styles/neutral/recipes/Switch.css`: iOS on-fill rim in `currentColor`, iOS held highlight off, Android off edge `bg-surface`.
- `packages/styles/neutral/recipes/Button.css`: N5 on-state ring `primary-border`.
- `packages/styles/liquid/recipes/Switch.css`: capsule `--_switch-thumb-width`.
- `packages/css/src/platform/ios.css`: capsule `--_switch-thumb-width`; track widened to `height * 2`; header and comment.
- `packages/angular/src/components/toggle-group/toggle-group.ts`: header comment (DOM equals React).
- `packages/angular/src/components/toggle-group/toggle-group.spec.ts`: no-dip assertion, DOM-parity test.
- `docs/reports/fixes/interactions-3/switch-contrast.final.json`: the 144-run probe.
- `docs/reports/fixes/interactions-3/switch-closure.md`: this report.

## 8. Decisions

- Desk: the rim moved inside the thumb's own ring rather than being dropped,
  so the glass ball keeps a lit edge; the held shadow is dropped only while
  `:active`, so the rested ball keeps its lift.
- Neutral iOS: the held highlight is turned off rather than recolored, since
  Neutral has no glass material and the highlight is a dark overlay that hid
  the ring on the lens. The dark rim is kept off the fill (it edges the white
  lens on the gray track).
- iOS track widened to `height * 2` for every style, not only the capsule
  ones, because `--_switch-thumb-width` is set at the platform layer for all
  iOS styles (the work order: the capsule lens thumb on platform iOS). Studio
  keeps its square thumb, now a wider square; Desk keeps its glass ball.
- N5 uses the brand border ring, not `--_toggle-button-flood: 1`: the soft
  flood fill would still read weak against the off fill, and the ring is the
  on look already in Button.css. ToggleGroup items are left alone.

## 9. Changes needed from the lead

None in other lanes for this work. Note for the record: the `npm run check`
red step is the fields lane's `field.parity.spec.ts` (N12), outside this
lane's files.
