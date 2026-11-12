# Interaction round 2: overlays and menus (order 1.22, family d)

Agent: ds-component, family (d), claude-opus-5-5 at medium. Every interaction
here is **proposed** and waits for the owner.

Components: Dialog (DialogBase), AlertDialog, Sheet, Drawer, Popover,
HoverCard, Tooltip, DropdownMenu, ContextMenu, Menubar, CommandPalette,
Lightbox, Tour, Window, TitleBar, WindowControls.

Registry: `packages/motion/src/interactions/overlays.ts` (16 rows, all
`round: 2`). Stages: `apps/gallery-react/src/interactions/overlays.tsx`.

Spring overshoot per style comes from the tokens: Neutral bouncy 6%, snappy
1.5%, soft none; Desk bouncy 25%, snappy 10%, soft 2%; Studio steps. Stagger
step: Neutral 24ms, Desk 45ms, Studio 0ms (Studio parts land together).

## 1. Interactions

Every exit below is faster than its entrance and never staggers. Focus moves
into every overlay at once: a staggered part that holds focus is there at
once (`:not(:focus-within)`), and in menus only the inside of a row moves,
never the row with its fill and its focus ring.

| Id | Components | Trigger | Beats and timings (Neutral, Desk, Studio) | Reduced | Files |
| --- | --- | --- | --- | --- | --- |
| `menu-origin` (reworked) | DropdownMenu, ContextMenu, Menubar | open a menu | Surface travels distance.shift (4, 6, 2px) out of the trigger side and grows from scale.menu-enter on the snappy spring (180ms 1.5%, 300ms 10%, 80ms two steps). The inside of each row, the labels and the separators rise distance.shift on the soft spring (220, 340, 100ms), one stagger step apart after the surface, capped at six. Exit duration.quick on ease.exit, all at once | fade, then none | DropdownMenu.css |
| `menu-row-slide` (new) | DropdownMenu, ContextMenu, Menubar | pointer or arrows across rows; arrows or the pointer across Menubar titles | The lit fill (the row's `::after`) starts over the old row, as drawn, and slides to the new row on the snappy spring. A hop over a separator still slides. Menubar: the open fill slides title to title | fill there at once | DropdownMenu.css, Menubar.css, menuShared.tsx, Menubar.tsx |
| `menu-submenu-nudge` (new) | same | light a sub-trigger | Chevron leans distance.nudge toward the submenu on the bouncy spring (220ms 6%, 440ms 25%), mirrored in RTL; back over duration.quick. Studio: off (its `pop` preset is reduced) | still | DropdownMenu.css |
| `popover-spring` (new, takes Popover from round 1 `menu-origin`) | Popover, HoverCard | open | Travels distance.shift and grows from scale.enter (0.97, 0.9, 1) on the bouncy spring (220ms 6%, 440ms 25%, 120ms three steps). Title, body, footer (HoverCard: each piece of the preview) rise one step apart on the soft spring. Exit quick (HoverCard fast) | fade | Popover.css, HoverCard.css |
| `tooltip-rise` (reworked) | Tooltip | delayed open | Travels distance.shift and grows from scale.enter on the snappy spring; the shortcut follows one step later. Exit quick, back toward the trigger | fade | Tooltip.css |
| `tooltip-follow` (new) | Tooltip | move to the next control inside the skip delay | The next tooltip opens at once (instant-open), starts where the last one was drawn and slides to its place (flipPlay, snappy); the last one is hidden at once | there at once | Tooltip.tsx |
| `dialog-spring` (reworked) | Dialog, AlertDialog | open | Panel rises distance.enter (6, 12, 4px) and grows from scale.dialog-enter on the soft spring, full opacity at a third of the rise. Title 1 step, description 2, body 3, footer 4. AlertDialog icon pops from scale.morph on the bouncy spring with the title. Exit duration.quick | fade | Dialog.css |
| `sheet-spring` (reworked) | Sheet, Drawer | open, drag release | Slide from the edge on the soft spring (220ms, 340ms with 2%, 100ms), no fade; parts staggered as in a dialog; a released sheet settles on the same spring. Exit duration.quick | fade in place | Dialog.css |
| `command-palette-open` (new) | CommandPalette | open | Panel rises and grows on the snappy spring, full opacity at a third; the key hints one step later. Exit quick | fade | CommandPalette.css |
| `command-palette-results` (new) | CommandPalette | open, type | On open the rows rise one step apart after the panel (staggerGroup, at most 8 rows, 6 steps). On a new list the rows that stay slide to their new place (flipPlay, snappy) and the new ones rise in order. The lit row and the first row are never delayed. Typing never waits. Neutral and Studio play it reduced (their `list-stagger` preset) | fade | CommandPalette.tsx |
| `command-palette-row-slide` (new) | CommandPalette | arrows, pointer | The lit fill (`::after`) slides from row to row on the snappy spring | at once | CommandPalette.css, .tsx |
| `lightbox-zoom` (new) | Lightbox | press a thumbnail, close | Image grows out of the thumbnail (flipPlay with scale, soft spring), once loaded when it was not cached. Toolbar 1 step, arrows 2, caption 3. Close: the image shrinks back into the thumbnail over duration.base on ease.exit while the panel holds half of that, then fades | fade | Lightbox.tsx, Lightbox.css |
| `tour-spotlight` (new) | Tour | start, Next, Back | Open: the ring closes in from scale.pop (snappy), the panel lands on the bouncy spring, its parts staggered. Step: the ring moves and resizes to the new target (flipPlay with scale, snappy); the panel follows one stagger step later on the soft spring; the new title, body and footer rise in order | jump, text fades | Tour.tsx, Tour.css |
| `window-settle` (new) | Window | open, zoom, minimize, restore, close | Desk only (window mode grow). Land (open, zoom, restore): at 55% of the window pattern the window swells to scale.lift (1.03) and settles over duration.spring-bouncy (440ms) on ease.out. Gather (close, minimize): it swells to scale.lift over duration.quick while the shrink starts. Composite `add`, on top of the catalog pattern | none | windowSettle.ts, Window.tsx |
| `window-lights` (new) | WindowControls, TitleBar | hover or focus the lights, press one | Colors fade in over duration.fast; each glyph pops from scale.morph on the bouncy spring, close, minimize, zoom one step apart. Leaving: together over duration.fast. Press: the 12px dot dips to scale.anticipate inside its unmoving 24px target. Studio: off (its `pop` preset is reduced) | at once | WindowControls.css |

TitleBar needs no CSS of its own: it renders WindowControls.

### Readable early (lead rule, added during the round)

A staggered part never holds text below its contrast for more than a
moment. Every CSS stagger of this family follows the two rules of the
foundation: the delay is capped, `min(calc(delay.stagger * n),
duration.base)` (120ms in every style at its base value), and each part
keyframe (`ds-menu-row-in`, `ds-popover-part-in`, `ds-hover-card-part-in`,
`ds-tooltip-part-in`, `ds-dialog-part-in`, `ds-dialog-icon-in`,
`ds-command-palette-part-in`, `ds-lightbox-part-in`, `ds-tour-part-in`)
reaches opacity 1 at 30% of its run, the transform carrying the rest. In
Desk, the slowest case, a menu row is fully opaque within 120 + 102ms. The
JS staggers (CommandPalette results, Tour parts) go through `staggerGroup`,
which now applies the same budget. The step counts in the table above are
the order; the delay of a late step is capped. My check recordings were made just
before this change.

## 2. Review findings (order 1.21 review, "Notes, interactions")

- **B2, fixed for my files.** Every reduced motion block in Dialog.css,
  Popover.css, HoverCard.css, Tooltip.css, DropdownMenu.css,
  CommandPalette.css, Lightbox.css, Tour.css and WindowControls.css now has a
  flat twin under `:root[data-motion='reduce']`. Menubar.css has no motion of
  its own. Tests read each file.
- **N2, fixed.** DropdownMenu.css sets `--_menu-origin` in right to left
  layouts for side top or bottom with align start or end (start: `100%`,
  end: `0%`), so a menu grows from the corner at its trigger. Covers
  ContextMenu and Menubar menus, which are the same roots. Test in
  DropdownMenu.test.tsx.
- **N4, partly.** Focus still returns only after the exit, because Radix
  Presence unmounts the content on `animationend` (lead item 6 of round 1).
  What I changed: every exit is now duration.quick (100ms) or less, where it
  was 120 to 220ms (Dialog, AlertDialog, Sheet, Drawer, CommandPalette). The
  Desk Dialog recipe still sets `--_dialog-duration-out: duration.window-close`
  (220ms); see section 7. Menubar already sends focus back at once on
  Escape.
- **N5, fixed for the panels I own.** The panel keyframes of Dialog,
  AlertDialog, CommandPalette and Lightbox reach full opacity at a third of
  the entrance (Neutral 73ms, Desk dialog 100ms of its window grow); Sheet
  and Drawer do not fade at all. A part that holds focus never waits for its
  stagger step.
- **N10, kept.** Tooltip delays stay 500 and 300ms; token request in
  section 5.
- **N13, checked.** No interaction of this family scales a trigger or a
  target: the menu surface scales, never its trigger; the Window lights dip
  only the 12px dot inside the 24px button (test in WindowControls.test.tsx).

## 3. Rejected ideas

- A decorative highlight element inside each menu that slides between rows:
  it would be a new element in the role menu; the row `::after` (the hover
  veil of anatomy.md) moved with a WAAPI pseudo element animation does the
  same with no new node.
- Re-staggering every row on each keystroke in CommandPalette: rows that
  stay jittered while typing fast. Only new rows rise; rows that stay slide.
- Staggering the dialog title band from far: the band has a fill, so a long
  rise showed a gap at the panel top; the parts rise distance.shift only.
- A stagger on exits: the person asked the overlay to go.
- Animating the Desk title bar of a dialog with its parts: it is window
  chrome and comes with the panel.

## 4. Needs a rule change

- **Menus that grow from the trigger (clip 9).** The trigger growing into the
  panel needs `clip-path` or a size transition. Built instead: scale from the
  trigger corner plus a short travel from the trigger side.
- **Lightbox zoom with a cropped thumbnail.** A thumbnail cut with
  `object-fit: cover` and the full image have different aspect ratios, so a
  transform zoom stretches the image for a moment. The faithful form needs a
  `clip-path` (or `object-view-box`) transition. Built: the scale FLIP.
- **Tour spotlight ring.** A ring that resizes by scale also scales its
  border width during the move. The faithful form needs a size transition
  (inset or width and height). Built: the scale FLIP on the snappy spring.
- **Dialog backdrop blur that grows** with the entrance needs `filter` or
  `backdrop-filter` to animate. Built: the backdrop fades.

## 5. Token requests

| Name | Value per style | Why |
| --- | --- | --- |
| `delay.tooltip-open` | 500ms in all styles | Review N10: the Tooltip open delay is a raw number in Tooltip.tsx |
| `delay.tooltip-skip` | 300ms in all styles | Review N10: the skip delay, and the window `tooltip-follow` reads |

## 6. Preset rows needed from the lead

None required. Two follow from existing pattern presets and are on purpose:
`menu-submenu-nudge` and `window-lights` use pattern `pop`, which Studio plays
reduced, so Studio has no chevron nudge and no glyph pop;
`command-palette-results` uses `list-stagger`, which Neutral and Studio play
reduced (a fade). If the owner wants them in those styles, add
`interactions: { 'menu-submenu-nudge': 'full', 'window-lights': 'full' }` to
`packages/styles/studio/motion.ts` and `'command-palette-results': 'full'` to
`packages/styles/neutral/motion.ts`.

## 7. Changes needed from the lead

1. `packages/styles/desk/recipes/Dialog.css` sets the centered members to the
   window grow (`--_dialog-ease-in: var(--ds-ease-window)`,
   `--_dialog-duration-in: duration.window-open`,
   `--_dialog-duration-out: duration.window-close`). So in Desk the dialog
   does not take the soft spring, and its exit (220ms) is the slowest exit of
   the family (review N4). Proposed:
   - before: `--_dialog-duration-out: var(--ds-duration-window-close);`
   - after: `--_dialog-duration-out: var(--ds-duration-quick);`
   and, if the owner prefers the spring to the window grow in Desk, delete the
   `--_dialog-ease-in` and `--_dialog-duration-in` lines. The same holds for
   `packages/styles/desk/recipes/CommandPalette.css`
   (`--_command-palette-duration-out: var(--ds-duration-window-close);` to
   `var(--ds-duration-quick)`).
2. Review N4 itself (focus back only after the exit) needs the focus return
   moved out of Radix Presence, in `DialogBase.tsx` and the menus, for every
   framework; not done here (Angular parity).

## 8. Work for Angular and native

Angular shares the CSS, so every CSS row plays there as is: `menu-origin`
(with the RTL origin), `menu-submenu-nudge`, `popover-spring`,
`tooltip-rise`, `dialog-spring`, `sheet-spring`, `command-palette-open`, the
Lightbox and Tour part staggers, `window-lights`. The menu, Menubar and
CommandPalette fills moved to `::after`; with no script they show on the new
row at once (the round 1 look). Needs Angular code:

- `menu-row-slide` and `command-palette-row-slide`: on focus or active
  descendant change, the `::after` slide (menuShared.tsx `slideHighlight`).
- `tooltip-follow`: Tooltip.tsx `followLast`.
- `command-palette-results`: the stagger on open and the FLIP on a new list.
- `lightbox-zoom`: the FLIP from the trigger's image and back.
- `tour-spotlight`: the ring FLIP and the panel follow.
- `window-settle`: windowSettle.ts on top of the window patterns.

Native: all rows need Reanimated; the timings in the registry are the spec.

## 9. Proof

- Unit tests: `npx vitest run` over the 16 component folders and
  `packages/motion`: 26 files, 546 tests, green. New tests: row slide
  (keyframes, pseudo element, no play when reduced), RTL origin (N2), reduced
  twins (B2) in every CSS file, dialog and palette opacity at a third (N5),
  exits faster (N4), window settle (composite add, land delay, nothing in a
  fading style), tooltip follow (instant open, old one hidden), palette
  stagger (lit row never delayed, typing filters at once), lightbox zoom
  (FLIP from the thumbnail and back), tour step (parts staggered, focus on
  the panel), the lights press (target never scales, N13).
- `npm run contract -- --framework react --component <the 16>`, run in
  four groups after the z-index and readable early changes: 652 checks, all
  green (Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tour,
  Lightbox, DropdownMenu, ContextMenu, Menubar, CommandPalette 44 each;
  Tooltip, Window, TitleBar, WindowControls 29 each). Two earlier full runs
  were cut by their time limit on the busy machine; one of them failed
  "AlertDialog: target size open, neutral" while another family's registry
  file did not parse and the gallery returned status 500; it passes now.
- `npm run check` (20:55, before the readable early change, which only
  touched CSS and two tests, rerun green): tokens, gen, typecheck, eslint, manifests,
  Angular, native, docs, both galleries and both consumers pass. vitest
  fails only in files of other lanes: Select.motion.test.tsx (family c),
  the lint gates button-primitive (an Angular spec file), no-native-title
  and no-tailwind (timeouts on the busy machine), and two CLI tests. Every
  test of the 16 components, `packages/motion` and the `ds/no-raw-value`
  gate pass.
- Recordings: by the lead, as short per interaction clips in the stage
  only mode of `/interactions`. Each stage in
  `apps/gallery-react/src/interactions/overlays.tsx` marks the control that
  plays it with `data-interaction-trigger`. My own long page recordings (one
  per style) were used only to check the work, then deleted, as the lead
  asked; no `.webm` is committed.
- What the frames showed and what was fixed:
  - Menubar titles drew a gray box at rest: the fill moved to `::after` and
    the button element fell back to the browser's button background. Fixed
    with `background-color: transparent` on the trigger.
  - The first build drew the fill on `z-index: -1`, which the
    `ds/no-raw-value` gate refuses. The rows now stack three layers on the
    z tokens: the fill (`::after`) on z.canvas, the content of the row and
    the keyboard ring (`::before`, the focus layer of anatomy.md) on
    z.raised. Menu rows and Menubar titles draw their ring on `::before` now
    (same `--_menu-item-ring` and `--_menubar-trigger-ring` values), so it
    sits over the fill; checked in Desk dark (the yellow fill) and Neutral
    light. The bar part and the CommandPalette list are their own stacking
    context (`isolation: isolate`).
  - `tooltip-follow` never played: the new tooltip mounts one or two frames
    after the provider opens it, past the 300ms window. The window is now
    twice the skip delay (instant-open already proves the skip delay).
  - The Tour panel did not follow: Radix placed it after more than 8 frames;
    the wait is now up to 30 frames.
  - The CommandPalette stagger delayed the first row, which takes the
    highlight a moment later: the first row and the lit row are never
    delayed.
  - A probe of `Element.animate` in the browser confirmed each WAAPI row
    plays: `menu-row-slide` on `::after` (rows and Menubar titles),
    `command-palette-results` (stagger on open, flip on typing),
    `command-palette-row-slide`, `tooltip-follow` (flip), `lightbox-zoom`
    (flip in, flip-exit out), `tour-spotlight` (ring flip, panel flip, parts
    stagger), `window-settle` (Desk open and zoom; none in Neutral).
  - Slow motion stills (CDP playback at a tenth) in Desk dark showed the
    menu rows cascading after the surface, the popover landing with its
    parts arriving, the ring moving between targets with the panel trailing
    and its text arriving after, and the window glyphs popping.
