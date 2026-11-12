# Fixes: reviews of batch 8 and batch 9

Branch `claude/ds-fix-8-9`, cut from `claude/relaxed-hypatia-7gseap` at
`c6488c1`. One commit per component (`fix-8: <Component>`,
`fix-9: <Component>`). After each: `npm run check` green and
`npm run contract -- --framework react --component <Name>` green.

## Blockers

| Review | Component | Blocker | Status |
| --- | --- | --- | --- |
| 8 | AspectRatio | className, style and ref land on the inner Radix box, so a consumer width breaks the ratio; the DOM differs from Angular | fixed |
| 8 | Surface | `motion` null with no reason | fixed |
| 8 | Bento | `motion` null with no reason | fixed |
| 8 | ScrollArea | demo wider than 320px (contract red in en and ar) | fixed |
| 8 | ScrollArea | thumb under 3:1 on every surface | fixed in the component with an existing token; token request below |
| 9 | Stat | `NaN` and `Infinity` drawn and read aloud | fixed |
| 9 | Tile | no Neutral recipe, tiles read as one slab | fixed |

### AspectRatio (fixed)

Dropped the Radix wrapper. The root is one `div` with the native
`aspect-ratio: var(--_aspect-ratio-ratio)`; the component sets that private
property inline from `ratio` (the CSS declares the 16 / 9 default on the
root). className, style and ref now go to the ratio box itself: with
`style={{ inlineSize: 240 }}` a 16:9 box measures 240 by 135 and its image
240 by 135 in Chromium. `asChild` goes through Radix Slot and the ratio
moves to the child. `align-self: start` moved from the wrapper selector to
the root. The `svg` child has its own rule without `object-fit`.

This departs from the order ("Behavior: Radix AspectRatio"), as the review
recommended. The manifest `behavior` now reads "native aspect-ratio on one
div". Test: `AspectRatio.test.tsx` checks there is no wrapper, and that a
consumer width, className, ref and the ratio sit on the same element.

### Surface and Bento (fixed)

`frameworks.react.note` says why no motion pattern applies. Each test file
now fails if `motion` is null and the note does not say "no motion".

### ScrollArea demo (fixed)

The demo `box()` helper takes a max inline size, not a fixed one. Test:
renders the demo and fails if any ScrollArea root has a fixed `rem` or `px`
inline size. Contract: 29 passed, 0 failed.

### ScrollArea thumb (fixed in the component, token still wrong)

The thumb now reads `color.text.muted`, and `color.text.default` on hover.
Measured against the body and surface 1 to 5, thumb composited on each fill
(WCAG 1.4.11 needs 3:1):

| Mode | token | body | s1 | s2 | s3 | s4 | s5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Studio dark | scrollbar.thumb (before) | 2.73 | 2.66 | 2.49 | 2.30 | 1.84 | 1.50 |
| Studio dark | color.text.muted (now) | 8.19 | 6.72 | 5.75 | 5.00 | 3.46 | 2.48 |
| Studio light | scrollbar.thumb | 2.32 | 2.54 | 2.49 | 2.40 | 2.31 | 2.19 |
| Studio light | color.text.muted | 6.09 | 7.56 | 7.05 | 6.55 | 5.97 | 5.32 |
| Desk dark | scrollbar.thumb | 2.73 | 2.66 | 2.49 | 2.30 | 1.84 | 1.50 |
| Desk dark | color.text.muted | 8.33 | 6.83 | 5.84 | 5.08 | 3.51 | 2.52 |
| Desk light | scrollbar.thumb | 2.23 | 2.46 | 2.41 | 2.33 | 2.25 | 2.12 |
| Desk light | color.text.muted | 5.76 | 7.45 | 6.96 | 6.48 | 5.97 | 5.27 |
| Neutral dark | scrollbar.thumb | 2.74 | 2.72 | 2.64 | 2.55 | 2.37 | 2.11 |
| Neutral dark | color.text.muted | 8.58 | 7.93 | 7.46 | 6.87 | 5.94 | 4.90 |
| Neutral light | scrollbar.thumb | 2.45 | 2.54 | 2.50 | 2.42 | 2.32 | 2.21 |
| Neutral light | color.text.muted | 7.00 | 7.63 | 7.24 | 6.75 | 6.15 | 5.44 |

The muted text color passes on body and surface 1 to 4 everywhere. It still
fails on surface 5 in Studio dark (2.48) and Desk dark (2.52); the manifest
says so and tells agents to keep a ScrollArea off surface 5 there. Test:
`ScrollArea.test.tsx` reads the token the CSS uses and the built token
file, and fails under 3:1 on body and surface 1 to 4 in any of the six
modes. The thumb is now solid, not 58% translucent, so it reads a little
heavier than the Studio source.

### Stat (fixed)

A value that is `undefined`, `null`, `NaN` or infinite draws `emptyLabel`
("No data", "لا توجد بيانات" under an Arabic Theme) and sets `data-empty`.
The empty label is muted, at the meta size, on the value's line height so
nothing shifts when a number arrives. The roll does not play for it. New
prop `emptyLabel`, new state `data-empty` in the manifest; the demo `empty`
case now uses the real behavior. Tests: every non finite and missing value,
the Arabic label, the override.

### Tile (fixed)

New `packages/styles/neutral/recipes/Tile.css`, the shape of Desk's: the
grid opens to `space.m` and stops clipping, each tile is a card on
`radius.panel`, `color.bg.surface`, hover `color.bg.surface-2`, edge
`color.border.default`. Screenshots in `docs/reports/shots/wave-1/tile/`
(`neutral-light.png`, `neutral-dark.png`). Test: fails if Desk or Neutral
lacks a Tile recipe that sets a space gap and a border color.

## Notes fixed

- Bento: `as="ul"` sets `role="list"` (test added); the forced colors edge is
  a transparent border at rest that forced colors paints, not an outline;
  an `empty` demo case; insteadUse no longer sends tiles to ResizablePanels.
- Surface: styles text says `elevation="card"` draws nothing in Studio and
  Desk.
- AspectRatio: the `[data-radix-aspect-ratio-wrapper]` selector is gone; the
  `svg` child is out of the `object-fit` rule.
- ScrollArea: manifest notes for the 2.5.8 equivalent exception and always
  passing `label`; mistakes for hidden bars with fades off and unlabelled
  areas.
- ResizablePanels: no `outline: none` at rest; avoidWhen points phone
  widths at SplitView.
- SplitView: the `onShowSecondaryChange` doc says the back Button calls it
  with false.
- Container: avoidWhen names a Container inside another.
- Separator: the 3:1 claim for `color.border.control` is limited to body and
  surface 1 to 3, in the code comment and the manifest.
- Stat: dev warning when `delta` is a node and `trend` is missing (test
  added).
- Kbd: an empty string renders nothing (test added).
- Card: insteadUse names Surface and DescriptionList; avoidWhen names a
  target; the disabled demo meta no longer names an action the card lacks.
- Tile: TileGrid drops its radius under forced colors (test added).
- Accordion: forced colors draw no Button pill per trigger (border to
  `Canvas`, a system color that forced colors keeps; the Highlight focus
  outline stays); the role text says `aria-controls` is set while open; the
  unbuilt Collapsible line is gone.
- List: a mistakes entry for long titles; JSON in the Arabic demo goes
  through Bidi.
- EmptyState: the demo shows "press C" with Kbd.

## Notes left open, and why

- Cross component conventions (shared `SpaceStep`, `orientation` naming,
  container queries for Grid, Bento and DescriptionList, span vocabulary,
  `LayoutElement`, `useBuiltinLabel`, motion from the catalog for Stat and
  Accordion, `headingLevel` naming, ErrorState body, visually hidden helper):
  each touches files outside this order or needs a lead decision.
- Separator decorative line on `color.border.subtle` (1.01 on surface 3 in
  light schemes): a visible change to every decorative separator; needs the
  lead or a token change.
- Grid dev warning for a span over the column count, Grid `align` and
  `justify`: Grid is not in this fix order's blocker list and the API change
  wants a decision.
- ResizablePanels Escape to cancel a drag, px minimums, the collapsed rail
  title; SplitView root font size and first render: behavior changes beyond
  a few lines.
- Stat icon position next to a neighbour's label: a layout change to the
  label row that should be designed, not patched.
- Card selected ring and the `color.selected.ring` token: token gap.
- Card hover writes `transform` directly instead of a private property:
  left for a pass over Card's motion with the catalog.
- TileGrid manifest: a second root needs a manifest shape decision.
- Section and Accordion a11y gate timeouts: the fix is in `scripts/a11y.ts`.

## Token requests

1. `scrollbar.thumb` and `scrollbar.thumb-hover`: at least 3:1 against body
   and surface 1 to 5 in every style and scheme (today 1.50 to 2.74, table
   above). An opaque value at or above `color.text.muted` works for body to
   surface 4; surface 5 in Studio and Desk dark (`#605f5f`) needs a lighter
   thumb (muted measures 2.48 and 2.52 there; `color.text.default` level is
   needed). When fixed, set `--_scroll-area-thumb` back to
   `var(--ds-scrollbar-thumb)` in `ScrollArea.css`; the test will hold it.
2. `color.border.control` on surface 4 and 5: 2.85 and 2.41 in Studio and
   Desk dark, 2.89 and 2.39 in Neutral dark, 2.92 and 2.58 in Neutral
   light. Reaches the semantic Separator and the resize handle line.
3. Already asked by the lanes and the review: `z.raised`, `size.bento.row`,
   `size.grid.item-min.*`, `size.container.*`, `color.selected.ring`.

## Changes needed from the lead

1. `DECISIONS.md`: "AspectRatio renders one div with the native
   aspect-ratio property, not Radix AspectRatio, so className, style and ref
   reach the ratio box and React and Angular render the same DOM." The
   order 1.8.x for AspectRatio named Radix; this overrides it.
2. `apps/gallery-react/src/gallery.css:66`: exclude `[data-part='link']`
   from the `[data-gallery='root'] a:not([data-ds])` rule. In Neutral it
   colors linked Card and Tile titles blue (visible in
   `docs/reports/shots/wave-1/tile/neutral-light.png`).
3. `scripts/a11y.ts`: skip the "open" pass when a demo has no
   `[data-demo-trigger]`, as `contract.spec.ts` does, so Section and
   Accordion stop timing out.
4. The token requests above.
5. Regenerated files in this branch (`manifests.gen.json`,
   `packages/styles/neutral/index.css` for the new Tile recipe) come from
   `npm run gen`; regenerate on merge.

## Screenshots retaken

`docs/reports/shots/wave-1/<slug>/` for aspect-ratio, bento, scroll-area,
stat, tile, card, list and empty-state: studio dark and light, desk dark and
light, desk dark RTL Arabic, plus neutral light and dark.
