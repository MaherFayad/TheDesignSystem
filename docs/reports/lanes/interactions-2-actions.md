# Interaction round 2, family (a): actions and toggles

Order 1.22, family agent (a), claude-opus-5-5 at medium. Every interaction
here is **proposed** and waits for the owner.

Components: Button (with ButtonBase), ButtonGroup, CloseButton, CopyButton,
FloatingActionButton, IconButton, SplitButton, ToggleButton, Link, Switch.

Spring overshoot per style, read from the built tokens: Neutral bouncy 6%,
snappy 1.5%, soft none; Desk bouncy 25%, snappy 10%, soft 2%; Studio bouncy
three steps, snappy two steps, soft a plain curve.

## 1. Interactions

Every row is in `packages/motion/src/interactions/buttons.ts` with
`round: 2`, beats, styles and its reduced form, and has a live stage in
`apps/gallery-react/src/interactions/actions.tsx`.

| Id | Components | Trigger | Beats and timings (Neutral, Desk, Studio) | Reduced | Files |
| --- | --- | --- | --- | --- | --- |
| `button-press` (reworked) | Button, IconButton, ToggleButton, CopyButton, CloseButton, FloatingActionButton | Pointer down, Space or Enter held, then release | Dip to scale.press over duration.instant on ease.out (70ms in all three); release springs back on ease.spring-bouncy over duration.spring-bouncy (220ms passing rest by 6%, 440ms by 25%, 120ms in three steps). CloseButton and FAB now press too | No scale | Button.css, ButtonBase.tsx |
| `segment-press` (new) | ButtonGroup (attached), SplitButton | Press on one segment or half | The box never scales, so no seam opens and the neighbor stays still; the parts dip to scale.anticipate (0.95, 0.9, 0.97) and spring back on the snappy spring (180, 300, 80ms) | No dip | ButtonGroup.css, SplitButton.css, Button.css |
| `button-loading` (new, primitive `buttonMorph`) | Button, IconButton, FloatingActionButton, SplitButton action | `loading` on and off | Button dips to scale.anticipate and springs back (snappy); label rolls up and out by distance.shift over duration.quick; one stagger step later (24, 45, 0ms) the spinner grows in from scale.morph on the bouncy spring. Back: the spinner shrinks away, the label rolls in from above on the soft spring. Width held | Cross fade over duration.base | ButtonBase.tsx, Button.css |
| `copy-swap` (reworked, primitive `buttonMorph`) | CopyButton | Copy succeeds or fails; result ends after delay.feedback | Copy icon rolls up and out (duration.quick); one stagger step later the check turns in from minus 45 degrees and scale.morph on the bouncy spring; the button swells to scale.pop (1.05, 1.14, 1) over duration.celebrate (220, 480, 120ms). Failure: the warning pops in and the button shakes once by distance.nudge. Back to idle: the copy icon rolls in from above on the soft spring | Cross fade | CopyButton.tsx, Button.css |
| `button-nudge` (new) | Button | Hover or keyboard focus on a button with an end icon | End part moves distance.nudge (2, 3, 1px) toward the inline end on the snappy spring, flips in RTL; springs back on leave | Still | Button.css |
| `close-turn` (new) | CloseButton | Hover or keyboard focus | Glyph turns a quarter turn on the snappy spring (180, 300, 80ms), passes the mark by the overshoot and lands square (a cross is the same after a quarter turn) | No turn | CloseButton.css, Button.css |
| `split-chevron` (new, replaces the round 1 quick turn) | SplitButton | Menu opens or closes; hover on the closed trigger | Hover: chevron drops distance.nudge toward the menu. Open: half a turn on the snappy spring, passing and settling; close turns it back | Points up at once, no drop | SplitButton.css, Button.css |
| `fab-morph` (new) | FloatingActionButton | aria-expanded on a FAB with a plus; the extended label appears | Plus turns an eighth of a turn into a close mark on the snappy spring; the extended label slides from distance.shift behind the icon and fades in (`@starting-style`) | At once | FloatingActionButton.css |
| `toggle-pop` (new) | ToggleButton | Turned on or off | On: each part (icon, start, label, end) pops to scale.pop over duration.celebrate, one stagger step apart. Off: parts sink from scale.anticipate and settle on the soft spring. Only parts move, so attached groups keep their seams. Studio: none (its pop pattern is reduced, scale.pop is 1) | No pop | ToggleButton.tsx |
| `switch-stretch` (reworked) | Switch | Press, then release to toggle | Held: thumb stretches to scale.stretch (1.15, 1.3, 1.08) toward its travel and the track dips to scale.press. Release: thumb travels on the bouncy spring (220, 440, 120ms), passing its end; stretch and track spring back. Secondary: an on tint layer crosses in, fading and growing from scale.morph at the inline start on the soft spring, and back out when turned off | Jump, no stretch, no dip, tint at once | Switch.css, Switch.tsx |
| `link-underline` (new) | Link | Hover or keyboard focus on a standalone link; hover on an external link | A strong line draws over the thin rest underline from the inline start over duration.morph (200, 320, 100ms) on ease.out, origin flips in RTL; it retreats toward the inline end over duration.quick on ease.exit. External icon nudges up and toward where it leads on the snappy spring | Line at once, icon still | Link.css |

## 2. Fixes from the round 1 review

| Finding | Status | What changed |
| --- | --- | --- |
| B1 (Switch) | Fixed | The ring layer (`::before`) has no transition: the ring shows at once. Test in Switch.test.tsx. |
| B2 (my files) | Fixed | Every reduced block in Button.css, Switch.css, Link.css, SplitButton.css and ButtonGroup.css is repeated under `:root[data-motion='reduce']`. Tests in Button, Switch and Link tests. The Desk roll label (`packages/styles/desk/recipes/Button.css`) is the lead's. |
| B3 | Fixed | The stage renders `<ToggleButton icon="grid" label="Grid view" />` and text toggles with children. ToggleButton warns in development when `label` comes without `icon`. Test in ToggleButton.test.tsx. |
| N6 (Switch) | Fixed | New `--_switch-motion` multiplier on every Switch transition; the off row sets it to 0, with stretch and dip at 1. The same switch exists as `--_button-motion` and `--_link-motion` for my other off rows. Test in Switch.test.tsx. |
| N10 (Switch) | Fixed | `--_switch-stretch: var(--ds-scale-stretch)`. Test in Switch.test.tsx. |
| N14 | Fixed | The root of every Button base control rests at `transform: scale(1)`, so a press scale of 1 equals the rest value and starts no transition. Test in Button.test.tsx. |

## 3. Decisions

- The press now covers CloseButton and FloatingActionButton (`PRESS_DS` and the CSS).
- Attached segments dip their parts instead of scaling the box: a scaled segment opens a gap at each seam.
- The loading spinner that leaves stays for its exit as an aria-hidden `data-part="spinner"` span, at opacity 0 at rest (Button.css), removed when its exit settles. Only with the Web Animations API and a style that plays the morph.
- The CopyButton label does not move: it is the accessible name. The swell of the button is the secondary beat.
- The close glyph turns a full quarter, not a few degrees: a cross lands the same, so a quick pass never leaves it crooked.
- The FAB turn applies only to a plus glyph (`[data-icon='plus']`), read from aria-expanded, so it works with any disclosure trigger and in Angular with no code.
- The link draw is only on standalone links. A standalone link now draws its rest underline as a `::before` layer (same thickness and color as before) so the hover line lies exactly on it; forced colors bring the text decoration back.
- Desk's roll label recipe keeps the label transform in Desk, so the label part does not dip there; the icons do.

## 4. Rejected ideas

- A pulse of the Switch track on each toggle by keyframes: a keyframe tied to `data-state` also plays on first paint for every switch. The track dips on press instead.
- Animating the Switch thumb color: a color transition is not allowed; the tint layer carries the change.
- A rolling CopyButton label ("Copied"): it changes the accessible name and the width (as in round 1).

## 5. Needs a rule change

- Link underline in running text: drawing the line in a wrapped link needs `background-size` or `text-decoration-thickness` to animate. Built: the round 1 instant thickening in text, the draw on standalone links.
- Button loading as a width morph into a pill (clip 27): needs width or `clip-path`. Built: width held, parts roll.
- Switch thumb that changes color while it travels: needs a color transition. Built: the tint layer crossing.

## 6. Work for Angular and native

- CSS only, works in Angular with no code: button-press (Angular button-base already plays Enter), segment-press, button-nudge, close-turn, split-chevron, fab-morph, link-underline.
- Angular `button-base.ts`: the loading morph. On `loading` change, call `buttonMorph({ root, label, spinner }, from, to)`; when loading ends keep an aria-hidden `span[data-part="spinner"]` for the exit and remove it after `settled()`.
- Angular `copy-button.ts`: play `buttonMorph` instead of the two swap patterns, with the leaving span as the old state's part and the new glyph as the new one (see CopyButton.tsx). The leaving span now rests at opacity 0 in Button.css.
- Angular `toggle-button.ts`: on a pressed change from the person, play the pop (on) or sink (off) on the parts, one stagger step apart (`toggleLandSpec` in ToggleButton.tsx).
- Angular `switch.ts`: add `<span aria-hidden="true"></span>` as the first child of the track. Without it the track fills at once (round 1 look).
- Native: map the springs to `spring.*`; the press, the thumb travel and the pop take the same beats.

## 7. Token requests

None. Everything uses the tokens of the foundation.

## 8. Preset rows needed from the lead

None required. Studio's tokens already cut the motion to steps; `toggle-pop` follows Studio's `pop: reduced` row and plays nothing there.

## 9. Changes needed from the lead

- `packages/styles/desk/recipes/Button.css` (B2): repeat the reduced block under `:root[data-motion='reduce']`.
- `apps/gallery-react/src/interactions.css` already zeroes the duration tokens under `data-motion`; nothing more for this family.

## 10. Proof

- `npx vitest run` on the ten component folders and `packages/motion/src/interactions.test.ts`: green.
- `npx tsc --noEmit -p tsconfig.json`: green.
- `npm run contract -- --framework react --component Button,ButtonGroup,CloseButton,CopyButton,FloatingActionButton,IconButton,SplitButton,ToggleButton,Link,Switch`: 305 passed.
- `npm run contract` again for Link, Switch and Button after the last CSS change: green (one Switch run failed "Tab: no enabled root holds a tab stop" while the machine was loaded; a rerun of Switch alone passed 29 of 29).
- `npm run check` (once, with five other agents and video encodes on the machine): tokens, gen, typecheck and manifests green. Failures, none in this family's files: eslint `finishAll` unused in `packages/react/src/components/NumberField/NumberField.motion.test.tsx`; `ds/no-raw-value` on `z-index: -1` in Breadcrumbs.css, CommandPalette.css, DropdownMenu.css and Menubar.css; and about twenty vitest cases in other components (Dialog, Select, PhoneField, TagField, Tour and others) and in the lint gates that hit the 5s test timeout under load. The ten family folders and the registry test pass on their own (133 tests).
- Recordings: `docs/reports/shots/interactions-2/actions.neutral.webm` (light, 5.6 MB), `actions.studio.webm` (dark, 6.7 MB), `actions.desk.webm` (dark, 7.2 MB), VP9 at 24 fps capped at 450k. The Studio and Desk runs are longer in time because the machine was slow; the script waits the same per interaction.
- Frames: a probe script paused every running animation (`document.getAnimations()`) and stepped `currentTime` through each interaction in Desk dark. Seen: the stretched thumb travelling with the tint crossing in from the start; the check turning in with the button swollen; the button dipping then the spinner growing in; the plus turned into a close mark; the chevron mid flip and up; the close glyph mid turn; the end arrow nudged in both directions; the toggle content popped; the attached segment held with its neighbors still.
- Fixed from the frames: the standalone link drew its hover line a pixel under the text underline (two lines). The rest underline is now a layer at the same place, so the lines meet.
