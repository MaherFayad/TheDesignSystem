# Order 1.29, lane: toggles and selection

Fix round 1 of the round 3 interaction review
(`docs/reports/reviews/interactions-3.md`). The first agent of this lane was
stopped by a container restart. Its edits were snapshotted by the lead in
`8aeb19b`. This agent finished the lane on top of that. "Before" means
`8aeb19b~1` (`e417cbb`), the tree before the lane started.

## Blockers

### B3 and B4: switch thumb contrast on every frame

The fixes:

- Turning on, the thumb takes its on color at once and the fill is opaque
  from frame 0 (`--_switch-color-ease: step-start`).
- Turning off, the fill stays opaque and retracts behind the thumb. The fill
  and the thumb's on color step off together at the middle of the travel
  (`steps(2, jump-none)`).
- During a drag, the fill and the thumb color step at progress 0.5. The fill
  stays opaque and only its clip follows. While a drag runs, the root's
  `data-state` shows the side the thumb is on (`dragOnSide` in
  `packages/motion/src/helpers/switch-drag.ts`). The control keeps
  `aria-checked`.
- A 2px ring inside the thumb's edge in the thumb's own color
  (`--_switch-thumb-ring-width`) keeps a clear lens readable while held.
- Android: the fill fell about 1px short of the dot, because the track
  border there is 2dp. A new hook, `--_switch-fill-reach`, fixes it.
- Android: the off dot keeps a 1dp inner edge in the track border color, 1dp
  at any dot scale. Without it, a light handle on a light track had no edge.
- iOS: a held lens no longer casts the drop shadow. The shadow darkened the
  fill around the thumb in dark schemes. It comes back on release.

The probe is `switch-contrast.cjs`. For each style, scheme and platform
(4 x 2 x 3) it does two things:

- It toggles on and off, from a plain click and from a tap whose `:active`
  lingers. It pauses every animation and seeks every 10ms.
- It holds a drag at progress 0 to 1 in 0.05 steps.

Each frame's value is the median, over 48 directions, of the best contrast
between the thumb's edge and what is around it. The probe exits 1 under 3:1.

I changed the probe's held mode in this round. It now models a real tap: a
touch pointerdown, the forced `:active`, then a pointerup and the click. The
before JSON was taken by the first agent with the old held mode. On the
before CSS the pointer events change nothing, because no flag existed then.

| Run | Runs under 3:1 | Lowest | Lowest on a toggle | Lowest on a drag |
| --- | --- | --- | --- | --- |
| `switch-contrast.before.json` (`e417cbb` CSS) | 72 of 144 | 1.00 (Studio light Android, off, held, 60ms) | 1.00 | 1.51 |
| `switch-contrast.after.json` | 14 of 144 | 2.13 (Liquid light web, drag held at 1) | 2.68 | 2.13 |

**The probe does not pass yet.** All 14 remaining runs come from a style's
static colors or edges, in recipe files this lane does not own. None of them
comes from the crossing the review measured: no frame drops under 2.1. Each
needs a value from the styles lane:

| Runs | Cause | Value for the styles lane |
| --- | --- | --- |
| Neutral dark iOS, 4 runs at 2.68 (held, drag on side) | Neutral's on thumb (`--_switch-on-fill: primary-text`) is dark navy on the blue fill. Under the iOS clear lens only the 2px navy ring is left, about 2.7:1 against the fill | Neutral dark: an on thumb of `--ds-color-text-on-primary`, or a fill that keeps 3:1 against `primary-text` |
| Neutral dark Android drags, 2 runs at 2.92 | The white pressed dot sits on Neutral's off track, which is `--ds-color-border-control`, under Android's 12% state layer | Neutral: an off track one step darker than `border-control` in dark, or an off thumb that is not white on Android |
| Liquid light web drags at progress 1, 2 runs at 2.13 | The held lens grows by `scale.pop` past the track's end, so its white ring meets the light page | Liquid: `--_switch-thumb-size-pressed: 1` while dragging, or keep the 1px control edge (`0 0 0 1px border-control`) on the held lens on both sides |
| Liquid light Android off, 2.81 at the end of the travel | The white off dot with a 1px ring, mid travel | Liquid light: `--_switch-thumb-off` set for `[data-platform='web']` only, so Android's outline-colored handle applies |
| Desk, 5 runs at 2.92 to 2.98 (off end, held) | Desk's white glass-edge rim sits above the thumb's edge and its tooltip shadow darkens the light track. The rest value is about 3.0 to 3.5 | Desk recipe (`styles/desk/recipes/Checkbox.css`): drop `var(--ds-elevation-tooltip)` from `--_switch-thumb-shadow` while held, or move the glass-edge rim 1px in |

Tests that fail before and pass after:

- `Switch.drag.test.tsx`, "Switch thumb contrast on every frame": the
  timing, ring, drag-step and hook rules.
- `Switch.drag.test.tsx`, "B4 ... the root shows the side the thumb is on".
- `switch-drag.test.ts`, `dragOnSide`.

The first agent wrote these, and they fail on `e417cbb`.

### B5: unchecked to mixed draws no part of a check

From an empty box the mark carries `data-enter`, takes the new glyph's angles
at once and only draws (`Checkbox.tsx`, `Checkbox.css`).

Test: `Checkbox.motion.test.tsx`. I ran it against `8aeb19b~1` Checkbox.tsx
and Checkbox.css: 2 of 7 fail ("marks a draw from unchecked ..." and "the
turn of the strokes reads --_checkbox-morph-now ..."). With the fix, 7 of 7
pass.

### Lint gate: `Switch.css` transitions on `translate`

`ds/animate-transform-opacity-only` allows `transform`, not the `translate`
property. The travel is back in the thumb's single `transform`. The motion is
unchanged:

- The press times `transform` only while `:active` holds and the root is not
  `data-released`.
- The framework sets `data-released` on pointerup or pointercancel and clears
  it on the next pointerdown or keydown.

So on touch, where `:active` lingers 150 to 250ms after a tap, the travel
keeps the state's spring (N1). Space still presses on the press timing.

I did not hide `translate` behind a `var()` property name. That would pass the
gate but break its rule.

Tests that fail before and pass after (run against the snapshot without this
change: 3 of 42 fail):

- `Switch.drag.test.tsx`, "N1: the travel is in the transform ...": no
  `translate:` and no `translate` transition anywhere.
- `Switch.drag.test.tsx`, "N1 (order 1.29): the root is data-released ...":
  pointer, click, key and cancel.
- `switch-drag.test.ts`, `markReleased`.

The gate suite (`packages/lint/src/gates/animate-transform-opacity-only`)
passes.

## Ten weakest and notes

| Item | State |
| --- | --- |
| #1 `switch-stretch`, N1 | Fixed (B3 and the release flag above) |
| #2 `switch-drag` | Fixed (B4) |
| #6 `check-mixed` | Fixed (B5) |
| #9 `menu-origin`, `menu-rows` (N25) | Fixed by the first agent. Menu rows no longer fade on their own: they fade with the surface, and only the rise is staggered (`DropdownMenu.css` `ds-menu-row-in`, `selection.ts`). No empty card, and the last row reads when the surface does (about 120ms in Desk). Test: `selection-motion.test.ts` |
| N2 | Fixed. The option or card a change leaves drops its fill or badge at once (`RadioGroup.css`, `RadioCard.css`) |
| N3 | Value for the styles lane: Studio takes radio-pop's `off` row, which sets `--_radio-group-motion: 0`. Studio should drop radio-pop from its off list and set `--_radio-group-press-scale: 1`, `--_radio-group-dot-from: 1`, `--_radio-group-dot-travel: 0px` and `--_radio-group-motion: 1`. Its spring tokens are already `steps(2, jump-end)`, so the fill cuts in steps as `toggles.ts` promises and matches Studio RadioCard |
| N5 | Not fixed here. The weak on state comes from the Neutral and Liquid Button recipes: Neutral sets `--_toggle-button-flood: 0`, so on is only a 2px inner ring. Value for the styles lane: Neutral `--_toggle-button-flood: 1` with its soft fill, or a ring in `--ds-color-primary-border` |
| N8 | Fixed. Under forced colors the chosen RadioCard badge is Highlight with its check in HighlightText |
| N9 | Fixed. An uncheck fades the fill as it closes, so it ends on no centre dot |
| N10 | Test added: a lost pointer capture mid drag ends the drag where it is, with no `data-dragging` and no inline progress left |
| N27 | Fixed. The Select chevron flips on its block axis (`scaleY` of the cosine), never sideways |
| N43 | Done. Android sets `--_switch-thumb-size-rest: calc(16 / 28)` (16dp dot, 24dp on, 28dp held) |
| N46 | Fixed. The Select placeholder reads `--_select-placeholder-fg` (`text-muted`), which keeps 4.5:1 on each field fill |
| ToggleGroup label dip (angular-sync-3 section 6 item 2) | Fixed. The ink label is kept outside the indicator track, so `followIndicator` no longer dips it |
| `hit` part | ToggleButton and ToggleGroup manifests list `hit` in `anatomy`. Child shape tests: ToggleButton children are `['state-layer','start','label','hit']`; ToggleGroup items are `['null','icon','hit']` |

## Hooks (defaults keep today's look)

| Hook | Element | Default | Who sets it |
| --- | --- | --- | --- |
| `--_switch-radius` | switch root: control, ring, track, fill | `radius.pill` | styles (Studio square) |
| `--_switch-thumb-radius` | thumb | `radius.pill` | styles |
| `--_switch-thumb-width` | thumb inline size, read by the travel, the stretch and the cut | `--_switch-thumb-size` | styles (capsule lens) |
| `--_switch-thumb-ring-width` | ring inside the thumb's edge, in the thumb color | `border-width.strong` | styles (0 to drop) |
| `--_switch-fill-reach` (new this round) | how far the fill clip reaches past the thumb | `--_switch-inset` | platforms (Android: strong plus default) |
| `--_switch-color-ease`, `--_switch-bg-ease` | working, not for styles | | Switch.css |
| `--_radio-group-radius`, `--_radio-group-dot-radius` | radio circle with its ring and veil; the dot | `radius.pill` | styles |
| `--_radio-card-indicator-radius` | RadioCard badge | `radius.pill` | styles |
| `--_select-placeholder-fg` | Select placeholder | `text-muted` | styles |

No hook or part was renamed or removed.

## DOM changes for the Angular parity lane

- **Switch root `data-released`.** Set on pointerup and pointercancel of the
  control, cleared on pointerdown and keydown. Call `markReleased(control,
  on)` from `@the-system/motion`. Without it Angular keeps the old timing:
  the travel rides the press while `:active` lingers. Nothing breaks.
- **Switch root `data-state` while dragging.** It shows the side the thumb is
  on, from `dragOnSide(run)`. The control keeps `aria-checked`.
- **Checkbox mark `data-enter`.** Set when the mark draws from an empty box
  (React `Checkbox.tsx`).
- **ToggleGroup.** The ink label is held outside the indicator track.
- **ToggleButton and ToggleGroup items.** The last child is
  `<span data-part="hit" aria-hidden="true">`, from the actions lane's
  ButtonBase.

## Files changed this session

- `packages/css/src/components/Switch.css`: travel into `transform`, the
  release flag in the pressed selectors, `--_switch-fill-reach`.
- `packages/css/src/platform/android.css`: fill reach and the off dot edge.
- `packages/css/src/platform/ios.css`: no shadow under the held lens.
- `packages/motion/src/helpers/switch-drag.ts` and its test:
  `RELEASED_ATTR`, `markReleased`.
- `packages/react/src/components/Switch/drag.ts` and
  `Switch.drag.test.tsx`: the flag, `onKeyDown`, the N1 tests.
- `docs/reports/fixes/interactions-3/switch-contrast.cjs`: the tap in held
  mode.
- `switch-contrast.after.json`: rerun.

The first agent's files are listed in `8aeb19b`.

## Decisions

- To satisfy the lint gate, I kept one `transform` and a framework flag. The
  alternative was moving the paint to a `::before`. That would change the
  thumb's structure, and Desk's rotating lens would stop scaling with the
  press.
- Android's off dot edge uses `outline` with a negative offset, divided by
  the dot scale. Recipes do not set `outline`, so a platform rule can add it
  without beating the recipe layer.
- I did not touch style recipes, `Button.css` or the lint package. Their
  values are in the tables above.

## Proof

- The lane's unit tests, motion, the motion gate and styles: 44 files, 645
  tests, all pass.
- `npx tsc --noEmit -p tsconfig.json`: clean.
- The React contract suite for Switch, Checkbox, CheckboxGroup, RadioGroup,
  RadioCard, ToggleButton, ToggleGroup, Select, DropdownMenu and ListBox: see
  the summary returned to the lead.
- `npm run check`: see the summary returned to the lead.
- Lint gates: two gates (`no-tailwind`, `no-native-title`) timed out at 5s
  under machine load. They report no findings.

## Changes needed from the lead

- Styles lane: the values in the B3 and B4 table, plus N3 and N5. The probe
  passes only once those land.
- Angular parity lane: `data-released` through `markReleased`.
