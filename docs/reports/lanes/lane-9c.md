# Lane 9C: Containers

Branch `claude/ds-lane-9c`. Orders 1.9.9 to 1.9.12 from
`docs/plan/wave-1-batch-9.md`, built in order. All four are done.

| Order | Component | Commit | `npm run check` | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.9.9 | Card | `3b49a2e` | green | 21 passed |
| 1.9.10 | Tile | `5618779` | green | 21 passed |
| 1.9.11 | Accordion | `5f688c9` | green | 21 passed, 10 skipped (overlay only checks, see below) |
| 1.9.12 | EmptyState | `4551825` | green | 21 passed |

Each component had one fresh eyes review by a subagent (claude-opus-5-5,
medium). Screenshots for studio dark, studio light, desk dark, desk light
and desk dark RTL Arabic are in `docs/reports/shots/wave-1/<slug>/`.

## Source gap

GoBanana could not be read in this session (attaching the private repo was
refused). Figma-Killer-2 was read (`Card/`, `Widget/`, `EmptyState/`,
`Section/`). Values that the orders send to GoBanana (`.st-tile-grid`,
`.st-tile`, `.st-section-toggle`, `.st-empty`, admin `Empty`, MailApp rows)
come from the dials table in PLAN.md section 3.7, the tokens and the nearest
FK2 file. Each component's header comment says so. A pass against GoBanana
is worth doing when it is reachable.

## Card (1.9.9)

A container for one item: media, header (title, description), body, footer,
actions. A whole card link is one real link in the title with a target
stretched over the card by the link's `::before`; actions sit above it.

```tsx
<Card emphasis?: 'outline' | 'soft' | 'solid' = 'outline'
      size?: 'sm' | 'md' | 'lg' = 'md'
      selected?: boolean = false
      disabled?: boolean = false
      asChild?: boolean = false
      ref?, ...div props>
  <CardMedia />                                   // bleeds to the edges when first
  <CardHeader>
    <CardTitle level?: 2 | 3 | 4 | 5 | 6 = 3>
      <CardLink href asChild?: boolean = false /> // optional, makes the whole card a link
    </CardTitle>
    <CardDescription />
  </CardHeader>
  <CardBody />
  <CardFooter><CardActions /></CardFooter>
</Card>
```

Decisions:

- Anatomy adds a `link` part (CardLink) to the order's list: the stretched
  link needs a named element. `data-interactive` is stamped when a CardLink
  registers (a layout effect), so server HTML gets it at hydration.
- Disabled keeps text at 4.5:1: axe flagged opacity dimmed text, and a card
  is not a control, so the inactive control exception does not apply. The
  title mutes, the media dims, the link loses its href and keeps
  `tabIndex 0`, `aria-disabled` and role link (convention 5); a click does
  nothing. This departs from "draw disabled with opacity.disabled"; see the
  changes below.
- Selected is a 2px inset ring plus the border in `color.focus.ring` (shape,
  not color alone); focus is the outer `focus.shadow.ring` on `::before`.
- Hover lift: `translateY(-space.4xs)` (transform only) and an `::after`
  veil (opacity). Motion is named `fade-rise`: the catalog has no hover lift
  pattern.

Review fixes: a `--_card-bg` / `--_card-bg-hover` cycle (blocker), the
disabled link leaving the tab order (blocker), the manifest claiming Studio
is flat while `elevation.menu` draws a shadow (blocker), selectors scoped
with `>` so a nested card's link does not ring the outer card, a stable link
registration, forced colors selection as an outline (no layout shift),
sentence case demo titles, a note that interactive content goes only in
CardActions. Left open: a separate "selected" color token (note 9), the
English demo copy in RTL reads with mirrored punctuation (the gallery shows
English under `dir=rtl`; same for every component).

## Tile (1.9.10)

The borderless card of Studio, laid out in a TileGrid split by a 1px gap
that shows the parent surface. Desk turns it into separate rounded cards.

```tsx
<TileGrid asChild?: boolean = false ref?, ...div props>
  <Tile size?: 'sm' | 'md' = 'md'
        selected?: boolean = false
        asChild?: boolean = false
        ref?, ...div props>
    <TileMedia />
    <TileTitle level?: 2 | 3 | 4 | 5 | 6 = 3>
      <TileLink href asChild?: boolean = false />
    </TileTitle>
    <TileMeta />
    <TileActions />
  </Tile>
</TileGrid>
```

Decisions:

- TileGrid is a second root, `data-ds="tile-grid"`, in its own
  `packages/css/src/components/TileGrid.css` (rule 10: one file per
  `data-ds`). It has no manifest of its own; Tile's manifest documents it.
  It is exported from the Tile folder.
- The grid clips its tiles to `radius.panel`, so the selected ring (single,
  2px) and the focus ring (double: ring, gap, ring) are drawn inset on
  `::before`, above the media. A focused tile never looks like a selected
  one (WCAG 2.4.7).
- The title clamps at two lines; the link keeps the full name.
- Desk recipe `packages/styles/desk/recipes/Tile.css` opens the gap to
  `space.m`, rounds each tile and adds the hairline (dial 4). Properties
  only.
- Hover swaps the surface tone at once (source behavior); no `::after` veil.
- Interactive styling also matches `:has(> title > link)`, so it works
  before hydration.

Review fixes: identical focus and selected rings (blocker), the grid in
Tile.css (blocker, now TileGrid.css), forced colors wording, an
`aria-current` test. Left open: Neutral needs a Tile recipe like Desk's once
order 1.10 lands, so it reads as a card with Neutral's separation.

## Accordion (1.9.11)

Radix Accordion. The trigger is the system Button through Radix
`Trigger asChild`, inside a heading.

```tsx
<Accordion type?: 'single' | 'multiple' = 'single'
           collapsible?: boolean = true          // single only
           value? defaultValue? onValueChange?   // string, or string[] with multiple
           size?: 'sm' | 'md' = 'md'
           variant?: 'plain' | 'divided' | 'card' = 'divided'
           headingLevel?: 2 | 3 | 4 | 5 | 6 = 3
           disabled?: boolean
           ref?>
  <AccordionItem value: string disabled?: boolean = false>
    <AccordionTrigger>Title</AccordionTrigger>
    <AccordionContent />
  </AccordionItem>
</Accordion>
```

Decisions:

- The order's `icon` part is dropped: the chevron lives in the Button's
  `end` part, because a part inside the Button belongs to the Button by the
  ownership rule. Recorded in the manifest notes.
- Accordion.css restyles the trigger through `--_button-*` and sets two
  declarations Button has no property for: `justify-content` on the trigger
  (also the accordion's part) and `flex` plus `text-align` on the Button's
  `label`. See the change list.
- `accordion-height`: the content fades in and slides down `space.xs`
  (transform and opacity) on open; close is instant, so Radix unmounts
  without waiting on an animation event. The chevron turns 180 degrees.
  During the 140ms the faded content may pass under the header (accepted,
  review note 3).
- Disabled items keep their trigger focusable (`aria-disabled` from Button).
  Arrow keys still leave a disabled trigger: Radix binds them on the root, so
  they bubble past Button's inert key guard. A test proves it; the review's
  blocker on this did not hold.
- The contract skips 10 overlay only checks because `states` lists `open`
  and `closed`. Accordion is inline; its open sections are in the demo, so
  axe covers open content.
- `contract.keys` hints for Enter, Space, ArrowDown, ArrowUp, Home, End.

Review fixes: private names aligned with rule 1 (`height`, `border-color`,
`bg`, `radius`; `shift` is the one extra), manifest types for `value`,
`defaultValue` and `headingLevel`, `data-orientation` listed, the dropped
`icon` part recorded, a comment on `translateY` being right in both
directions.

## EmptyState (1.9.12)

```tsx
<EmptyState size?: 'sm' | 'md' | 'lg' = 'md'
            icon?: IconName | ReactElement
            title: ReactNode                       // required, a heading
            headingLevel?: 2 | 3 | 4 | 5 | 6 = 3
            actions?: ReactNode                    // one or two Buttons
            live?: boolean = false                 // adds role status
            ref?, ...div props>
  Body: what to do next, naming the mechanism.
</EmptyState>
```

Decisions:

- A prop based API; parts `icon`, `title`, `body`, `actions`, shared with
  ErrorState (1.5.11, not built yet), which adds details and states.
- No role by default; `live` adds `role="status"` for a search or filter
  with no results. The doc says to mount it inside an existing live region
  for a sure announcement.
- Block padding grows with size (`space.xl`, `6xl`, `11xl`); inline padding
  stays at `space.l` or `xl`, so a narrow column keeps its width (found in
  the screenshots: lg in a 16rem column truncated its buttons).
- No motion and no surface of its own. Motion names `fade-rise` for the
  parent's entrance.

Review fixes: `insteadUse` pointed at an unplanned `Text` (blocker,
removed), announce wording, the ErrorState claim, empty wrappers for `null`
or `false`, `--_empty-state-padding-block` naming, a next step in the long
text demo. Left open: family stays `containers` (the lane's family; the
reviewer suggested `feedback` next to ErrorState, the lead can decide).

## Token gaps

- No hover lift distance: Card uses `space.4xs` for `translateY`.
- No text measure token: EmptyState caps lines at `5 * space.12xl` (about
  540px). A `size.measure` token would replace it.
- No tile grid column minimum: TileGrid uses `2 * space.12xl`.
- No "selected" ring color: Card and Tile use `color.focus.ring` and tell
  selected from focus by shape and position.
- No motion pattern for a hover lift: Card names `fade-rise`.

## Changes needed from the lead

1. `packages/css/src/components/Button.css`, root rule: add two private
   properties so a parent can align the content without declarations.
   Before: `justify-content: center;` After:
   `--_button-justify: center;` in the property block and
   `justify-content: var(--_button-justify);`. In the
   `[data-ds='button'][data-wrap] > [data-part='label']` rule, before
   `text-align: center;`, after `text-align: var(--_button-label-align, center);`
   with `--_button-label-align: center;` declared on the root, and add
   `flex: var(--_button-label-flex, 0 1 auto);` to the label rule. Then
   Accordion.css drops its two declarations and sets
   `--_button-justify: space-between; --_button-label-align: start; --_button-label-flex: 1 1 auto;`.
2. `DECISIONS.md`, Components: record that a disabled container (Card) keeps
   text at 4.5:1 and dims only its media, because the contrast exception for
   inactive controls does not cover a container. Convention 5 of
   `docs/contracts/anatomy.md` speaks of actions and text entry only.
3. `packages/motion` (order 1.11): consider a `hover-lift` pattern (transform
   only, reduced form none) for Card, and later Tile and RadioCard.
4. Tokens (ds-tokens): `size.measure` for long text lines, and optionally
   `color.selected.ring`.
5. `docs/contracts/anatomy.md`: a sentence that a family may own a second
   root (TileGrid) in its own CSS file without its own manifest, or a rule
   that it needs one. Today TileGrid has no manifest and no gallery route.
6. Neutral (order 1.10): a `packages/styles/neutral/recipes/Tile.css` like
   Desk's, so tiles read as cards with Neutral's borders.

## What I could not do

- Read GoBanana (see Source gap).
- Angular and React Native ports: planned in each manifest, not in this lane.
- Neutral screenshots: the Neutral style is not in this checkout.

## Files touched

- `packages/react/src/components/{Card,Tile,Accordion,EmptyState}/**`
- `packages/css/src/components/{Card,Tile,TileGrid,Accordion,EmptyState}.css`
- `packages/manifest/src/component/{Card,Tile,Accordion,EmptyState}.manifest.json`
- `packages/styles/desk/recipes/Tile.css`
- `docs/reports/shots/wave-1/{card,tile,accordion,empty-state}/*.png`
- `docs/reports/lanes/lane-9c.md`
- Generated by `npm run gen`: `packages/react/src/index.ts`,
  `packages/css/src/index.css`, `packages/styles/desk/index.css`,
  `packages/manifest/manifests.gen.json`, `apps/gallery-react/src/routes.gen.ts`
