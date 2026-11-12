# Interaction round 2: navigation and shared indicators (order 1.22, family e)

Agent: ds-component, family agent (e), claude-opus-5-5 at medium effort.
Branch `claude/ds-order-1-22`. Every interaction here is **proposed**.

## The shared pill

One helper, `packages/react/src/internal/indicator.ts` (tests in
`indicator.test.ts`), plays every indicator of the family:

- `followIndicator(track, key, layer, opts)`: after the commit that made an
  item current, it slides the pill layer from the box the last current item's
  pill was drawn in (kept relative to an anchor, with its scroll, so a page or
  list scroll never breaks it) to its own box. A second change mid travel
  starts from where the pill is drawn (the progress of the running slide).
- `slideFrames`: three keyframes, center origin, transform only: the old box,
  a stretched box halfway (longer along the travel by up to `scale.stretch`,
  less for a hop shorter than the pill), then rest. Played on
  `ease.spring-snappy` over `duration.spring-snappy`, read live on the
  element, so each style keeps its feel.
- The layer is decorative: an existing part (Tabs and SegmentedControl
  `indicator`), a pseudo element of the item (the WAAPI `pseudoElement`
  option: Navbar, Sidebar, Rail, Stepper, Breadcrumbs), or an empty
  `aria-hidden` span inside an existing part (ToggleGroup, Pagination). Hit
  areas never move; boxes are measured, so RTL needs nothing.
- `answerLabels`: the label the pill leaves dips to `scale.anticipate` and
  back; the label it reaches pops from `scale.anticipate` past rest on the
  bouncy spring. Both are added (`composite: 'add'`) to any transform the
  label already has (Button's part scale).
- `useHoverFollow`: a hover pill that slides from the item the pointer left
  when it enters the next within `duration.slow`. CSS fades it in and out.
- Also `popIn`, `windUp` (an arrow that draws back, then goes),
  `stretchAlong` (a stretch added to a CSS transition), `rollText` (a label
  that rolls with an aria-hidden copy of the old text) and `useActivated`.
- Mode comes from `useMotion().mode(id)`, which folds in the person's setting
  and `data-motion="reduce"`. Anything but `full` plays no travel.

## Interactions

Spring times per style (Neutral, Desk, Studio): soft 220/340/100 ms, snappy
180/300/80 ms, bouncy 220/440/120 ms. Studio's springs are steps.

| Id | Components | Trigger | Beats | Reduced | Files |
| --- | --- | --- | --- | --- | --- |
| `tab-slide` (round 1 row, reworked) | Tabs, SegmentedControl, ToggleGroup (single) | another tab, segment or item | the pill slides on the snappy spring (Neutral 180 ms, Desk 300 ms with about 10% overshoot, Studio 80 ms in two steps), stretched halfway by up to scale.stretch (1.15, 1.3, 1.08); the label it leaves dips (soft spring), the label it reaches pops (bouncy: 220, 440, 120 ms) | the indicator jumps | Tabs.tsx, Tabs.css, SegmentedControl.tsx and .css, ToggleGroup.tsx and .css |
| `nav-current-slide` | Navbar, Sidebar, Rail | another link becomes current | the bar (item ::before) slides along the bar or column with the stretch; Sidebar labels and Rail icons dip and pop; two current items never slide between each other | the bar jumps | Navbar.tsx, Sidebar.tsx, Rail.tsx |
| `nav-hover-follow` | Breadcrumbs, Navbar, Sidebar, Rail | the pointer moves to the next item | the hover pill fades in (duration.fast) and slides from the neighbour on the snappy spring with the stretch; the Breadcrumbs separator leans by distance.nudge (2, 3, 1 px) toward the next step on the snappy spring | the pill fades in place, nothing leans | Breadcrumbs.tsx and .css, Navbar.tsx, Sidebar.tsx, Rail.tsx |
| `pagination-roll` | Pagination | a page, previous, next, first or last | the arrow icon draws back by distance.nudge, then forward by distance.shift (4, 6, 2 px) and home over the bouncy time; every page slot whose number changed rolls digit by digit (rollDigits, up for later pages), delay.stagger apart (24, 45, 0 ms); the current fill slides when its slot moves and the number it reaches pops | new numbers fade in | Pagination.tsx and .css |
| `sidebar-collapse` | Sidebar, Rail | the Sidebar toggle, the Rail's hideLabels | the width changes at once; on expand the labels, counts and group titles come in from the inline start two stagger steps after it, one step apart, on the soft spring (staggerGroup); on collapse the icons pop; the Rail icons travel to their new places (flipPlay) and its labels rise in after them | labels fade in, nothing travels | Sidebar.tsx, Rail.tsx |
| `stepper-travel` | Stepper | next, back or a reachable step | a ring (indicator ::after, opacity 0 at rest) travels from the old current step to the new one with the stretch and fades as it lands; the new indicator pops; the connector fill now runs on the soft spring | nothing moves | Stepper.tsx and .css |
| `toc-travel` | TableOfContents | another section | the bar's CSS transition runs on the snappy spring; a WAAPI stretch is added from its trailing edge (scale.stretch at 40%, ease.standard), so it leans with the direction | the bar jumps | TableOfContents.tsx and .css |
| `tab-bar-pop` | TabBar | a destination becomes current | the icon and its pill pop from scale.anticipate on the bouncy spring; the label rises by distance.nudge a stagger step later (CSS keyframes that start with data-active, so a new page that mounts the bar pops too) | nothing moves | TabBar.css |
| `dock-lift` | Dock | hover or focus a tile; a tile becomes current | the tile lifts toward the pointer (base distance.lift and scale.lift, Desk's recipe magnifies) on the bouncy spring; the next tiles follow at a half and the ones after at a quarter; a tile that becomes current pops (animation-composition add) | no lift, no pop | Dock.css |
| `toolbar-press` | Toolbar | press an item; a toggle item turns on | on top of Button's press the item dips its parts to scale.anticipate (Button's `--_button-part-press`), released on Button's bouncy spring; an on toggle pops its icon | no scale | Toolbar.css |
| `language-roll` | LanguageSwitch | the language changes in place | the trigger name rolls a full line on the snappy spring (the old name in an aria-hidden copy); in the pair the names dip and pop | the new name fades in | LanguageSwitch.tsx and .css |
| `skip-link-slide` | SkipLink | Tab to the link | drawn at once with its ring; slides down from distance.enter (6, 12, 4 px) on the bouncy spring | appears in place | SkipLink.css |

Registry: `packages/motion/src/interactions/navigation.ts` (12 rows, all
`round: 2`, beats, styles and reduced forms; `off` for the CSS rows). Stages:
`apps/gallery-react/src/interactions/navigation.tsx`, one per row, each with
a play control marked `data-interaction-trigger`.

No DOM contract changed: no new `data-part` or `data-*` attribute. The new
elements are empty `aria-hidden="true"` spans inside existing parts
(ToggleGroup item, Pagination page, the Pagination number host in the label)
and the short lived aria-hidden copy of a rolling language name.

## Fixes from the round 1 review

| Finding | Status | What |
| --- | --- | --- |
| B2 (my files) | fixed | Every `@media (prefers-reduced-motion: reduce)` rule of Breadcrumbs, Dock, Navbar, Rail, SegmentedControl, Sidebar, SkipLink, Stepper, TabBar, TableOfContents and Toolbar has a copy under `:root[data-motion='reduce']`. A test walks every reduced rule of these files (Breadcrumbs.test.tsx). The WAAPI motion reads `useMotion().mode`, which already honours both. Not mine: the Desk Dock recipe keeps its magnify under the media query only (see Changes needed from the lead). |
| B4 | fixed | SegmentedControl and ToggleGroup labels use `overflow-wrap: break-word`. That alone still split "hours" at 320px, because the items could shrink to 0: SegmentedControl items now take `min-inline-size: min-content` and, under breakpoint.phone, `space.2xs` inline padding. Checked at 320px in Neutral light, LTR and Arabic RTL: "24 hours", "7 days", "30 days", "90 days", "1 year" stay whole. Tests in SegmentedControl and ToggleGroup. |
| N21 | fixed | Attached ToggleGroup items have no block padding; one line keeps the 28px of a spaced xs item. Measured in Neutral Arabic RTL: attached xs 28px, spaced xs 28px. Test in ToggleGroup. |

## Rejected ideas

- Sliding the fill of a Sidebar, Rail or Navbar item: the fill is the
  item's own background (a color on the hit area). The bar slides; the fill
  swaps at once.
- A pointer follow lean of Dock tiles from pointermove: it would write a
  custom property on every move; the lift and the neighbours already react.
- A pill that follows keyboard focus in Breadcrumbs: the focus ring must show
  at once and must not move.
- A digit roll of the Pagination summary ("21 to 40 of 312"): it is the text
  read by screen readers; a roll needs an aria-hidden copy and a visually
  hidden value, more DOM for little gain.
- A label roll for the LanguageSwitch pair: the names are in two scripts;
  splitting Arabic into columns breaks its joined forms, so the pair dips
  and pops instead and the trigger rolls whole lines.

## Needs a rule change

- The labels a tab pill leaves and reaches should cross fade their color and
  weight (the clips do). Color may not animate. Built: a scale dip and pop.
  A duplicated decorative label at the new weight cross faded with opacity
  would work inside a part, but doubles every label in the DOM.
- The Sidebar collapse should fade its labels **before** the panel narrows
  (clip 26). The width may not animate and the state may not wait, so the
  labels are hidden at once on collapse; they come back after the panel on
  expand. Needs either a width transition or an exit that holds the old
  layout for a beat.
- Sidebar, Rail and Navbar pills: a true sliding fill needs the item fill to
  be drawn by a layer (as SegmentedControl's thumb and the ToggleGroup span
  are). A contract note would let the item drop its own fill for a span.
- The Breadcrumbs link truncates with `overflow: hidden` while not hovered,
  so the hover pill is clipped during its fade out. A `clip-path` on the
  label instead of overflow on the link would free the pill.

## Work for Angular and native

Angular shares the CSS. Without the React code each degrades to the round 1
look: the ToggleGroup and Pagination items draw their own fill when the span
is missing, the pseudo element bars sit still, the Stepper ring stays at
opacity 0. CSS only interactions work in Angular as they are: tab-bar-pop,
dock-lift, toolbar-press, skip-link-slide, the Breadcrumbs separator lean and
pill fade, the TOC spring, the Stepper connector spring. Angular needs a port
of `internal/indicator.ts` (no React in it but the three hooks) for:
tab-slide (Tabs, SegmentedControl, ToggleGroup with the span), the current
and hover slides (Navbar, Sidebar, Rail, Breadcrumbs), pagination-roll (the
span, the aria-hidden number host, rollDigits), sidebar-collapse,
stepper-travel, toc-travel's stretch and language-roll. Native (wave 2): the
same beats with Reanimated springs from the spring tokens.

## Token requests

None. Every value comes from the round 2 tokens.

## Preset rows needed from the lead

None required. Notes for the lead: the presets already decide some of these
through their patterns. Studio plays `number-roll` and `pop` reduced, so in
Studio the Pagination numbers fade, and tab-bar-pop and dock-lift are turned
off by their `off` recipes. Neutral plays `list-stagger` reduced, which is why
sidebar-collapse uses `fade-rise`. If Studio should keep the stepped tab bar
pop, add `studio: { 'tab-bar-pop': 'full', 'dock-lift': 'full' }`.

## Changes needed from the lead

- Done by the lead in `fc23d92`. `packages/styles/desk/recipes/Dock.css` (review B2): the reduced block
  was under the media query only. After the `@media (prefers-reduced-motion:
  reduce) { ... }` block add:

  ```css
  :root[data-motion='reduce'] [data-style='desk'] [data-ds='dock'] {
    --_dock-scale: 1;
    --_dock-neighbor-scale: 1;
    --_dock-lift: 0px;
  }
  ```

## Proof

Finished by the lead after the agent handed back (the gallery was down for a
while because another family's registry file did not parse).

- Contract suite, react, all 15 components: green. Tabs to TableOfContents
  in one run (458 passed, 0 failed before the run hit its time limit inside
  Toolbar), then Toolbar, LanguageSwitch and SkipLink again: 29, 44 and 29
  passed, 0 failed.
- Vitest on the 15 component folders, `packages/react/src/internal/indicator`,
  the lint gates and `packages/motion`: 42 files, 623 tests passed.
- Typecheck and eslint clean on the files of this family.
- Recordings: the long page recordings are replaced by the lead's short per
  interaction clips in the stage only mode (`/interactions?focus=<id>`,
  `docs/reports/shots/interactions-2/record.cjs`): one clip per family and
  style, and a contact sheet per interaction in `sheets/`. The Breadcrumbs
  hover pill now sits under the label on `::before`, not over the text.
