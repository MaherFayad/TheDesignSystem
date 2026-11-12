# Consolidation 1

The first consolidation pass over `docs/plan/wave-1-followups.md`, run in the
lead's working tree after nine lanes merged. Every item is a small change of
its own; nothing was committed. Old import paths keep working through thin
re-exports, so lanes still running on their own branches do not break when
they merge.

## What changed, per item

### 1a. `SpaceStep` and `spaceSteps` in shared

- New `packages/shared/src/space.ts` (the 20 steps, `SpaceStep`, and an
  `isSpaceStep` guard) with `space.test.ts`, which also checks every step
  against `packages/tokens/src/base/space.json`.
- Stack, Grid and Container import `SpaceStep` from `@the-system/shared`.
- Surface: `SurfacePadding` is now `Exclude<SpaceStep, '4xs' | '3xs'>`, the
  same 18 values as before.
- `packages/react/src/components/Stack/space.ts` is a re-export, and
  `Stack/index.ts` still exports `spaceSteps` and `SpaceStep`, so
  `@the-system/react` keeps both names.

### 1b. `useControllable`

- Moved to `packages/react/src/internal/useControllable.ts` (`git mv`, so it
  is staged as a rename). Window, Dialog, DropdownMenu and SplitView import
  it from there. `Window/useControllable.ts` is a re-export.

### 1c. Meter level logic

- `packages/shared/src/meter.ts` holds `resolveRange`, `meterLevel`,
  `meterTone`, `meterLevelLabels`, `meterLevelLabelsFor` and the types. Its
  Arabic check is a private function, so shared has no dependency on the
  ProgressBar helper. The pure tests moved to `meter.test.ts` (plus one for
  the level words).
- Meter imports from `@the-system/shared`; `Meter/level.ts` is a re-export.

### 2. Button private properties for Section

- `Button.css` root: `--_button-justify: center` and
  `--_button-label-align: center`; `justify-content: var(--_button-justify)`;
  the wrapped label reads `text-align: var(--_button-label-align, center)`.
- `Section.css` sets `--_button-justify: flex-start` and
  `--_button-label-align: start` on the toggle and drops its
  `justify-content` declaration and its label rule. Checked in the browser:
  the toggle (it carries `data-wrap`) computes `justify-content: flex-start`
  and the label `text-align: start`, as before.
- Not done: Accordion asked for the same two plus `--_button-label-flex`
  (lane 9C). Accordion.css still writes `justify-content: space-between`
  and `text-align: start` directly. It can now set `--_button-justify:
  space-between` and `--_button-label-align: start`; the label flex needs
  the third property.

### 3. ButtonGroup

- `withAxes` and the `cloneElement` fill are gone. The axes reach children
  only through `ButtonGroupContext`, which every component on ButtonBase
  reads (Button, IconButton, ToggleButton, CloseButton, CopyButton,
  FloatingActionButton).
- New test: a Button and an IconButton each wrapped in a `span` take the
  group's size, emphasis and shape, the IconButton's own size wins, and the
  wrapper gets no `size` attribute.
- Watch on merge: a grouped component from a lane still running (a
  SplitButton) gets the axes only if it reads `useButtonGroup()`.

### 4. CloseButton in Alert, Banner and Toast

- Alert and Banner render `<CloseButton data-part="close" label=... size="xs" ... />`.
  The solid emphasis selectors in Alert.css and Banner.css now name
  `[data-ds='close-button'][data-part='close']`. Checked in the browser: the
  close part is 24 by 24 and takes the solid ink.
- Toast: done too. It was a mechanical swap (`IconButton icon="close"` to
  `CloseButton`, inside `RadixToast.Close asChild`), Toast.css names only
  `[data-part='close']`, and there is no Angular Toast yet.
- Dialog: not changed, as ordered (the Angular port mirrors its DOM).
- Window: not changed. Its close sits next to the minimize and zoom
  IconButtons of the Studio title bar, the manifest describes all three as
  IconButtons in five places, and the Angular port will mirror the DOM. Left
  for the Window owner.
- CloseButton and IconButton.css draw the same box, so nothing moves.

### 5. Button spinner part: skipped

Lane 5B's change replaces `<span data-part="spinner" aria-hidden="true" />`
with `<Spinner decorative size="xs" data-part="spinner" />`. Spinner renders
`data-ds="spinner" data-size="xs" data-tone="neutral"` on that element, so
Button's DOM gains three attributes, and the Angular Button
(`packages/angular/src/components/button/button.ts` line 48) would no
longer match. Per the order, not done. To land it, the Angular Button must
change in the same commit (stamp the same three attributes, or render an
Angular Spinner), then the Button.css spinner rule shrinks to position,
inset, margin and `--_spinner-arc: currentColor`, and `@keyframes
ds-button-spin` and its reduced motion rule go.

### 6. Manifest schema: `object`

- `packages/manifest/schema.json`: the short prop type enum allows
  `"object"`. (The long form, `{ "type": "..." }`, already took any string,
  which is how Input, Dialog, Toast, Window, Stat and others say `object`.)
- Meter `levelLabels`: `string` to `object`. Theme `css`: `CSSProperties` to
  `object` (the description names CSSProperties). Input `rootProps` was
  already `object`.
- Left: Accordion `value` and `defaultValue` say `string` but take a string
  or a list of strings. Not an object, so not touched here.

### 7. Contract suite

- Valued states: a manifest state written `data-<name>=<a>|<b>` (for
  example `data-level=low|medium|high`) is a valued state. `lib.ts` gains
  `parseValuedState` and `valuedStates`; `booleanStates` skips such entries;
  `scanStates` reads them (new `valued` argument); `stateFindings` fails a
  value that is not listed; the `state-changes` key snapshot includes them.
- Manifests now list `data-level=low|medium|high` (Meter),
  `data-trend=up|down|flat` (Stat) and `data-swipe=start|move|cancel|end`
  (Toast, which listed `data-swipe` as a boolean). Their notes say so.
- `physical` on a key hint: `moveDirection`, `moveDistance` and
  `moveFinding` take it; with it ArrowRight is to the right in rtl too. The
  schema allows it; Window's eight arrow hints set it. Keys are still
  pressed in en ltr, so today it changes no result; it records the intent.
- Unit tests for both in `lib.test.ts` and `page.test.ts`; the README
  documents both.

### 8. Icon stroke width

- `Icon.css` line set: `--_icon-stroke-width: 2` declared on the root (the
  token vocabulary gate requires a declaration) and
  `stroke-width: var(--_icon-stroke-width, 2)`.
- New `packages/styles/neutral/recipes/Icon.css`: `--_icon-stroke-width: 1.5`.
- Checked in Chromium on `/c/icon`: the svg root keeps the attribute
  `stroke-width="2"`, and the computed stroke width is 1.5px in Neutral
  (light and dark) and 2px in Studio and Desk, on the root and on its
  children. CSS wins over the presentation attribute.

### 9. Gallery default style is Neutral

- `apps/gallery-react/src/axes.ts` and `apps/gallery-angular/src/app/axes.ts`
  export `GALLERY_STYLE = 'neutral'`. Both apps use it when no style is
  asked and when the style is unknown (the note names it). The Theme
  fallback `DEFAULT_STYLE` stays `studio`.
- `apps/gallery-react/smoke.mjs`: the no query case expects Neutral, light,
  comfortable (from its style.json); a `?style=studio` case keeps the Studio
  dark checks; the unknown style case expects Neutral; the scheme select
  step picks dark, since Neutral already opens light.
- Contract suite: `defaultStyle()` reads the Theme manifest's `style`
  default, still `studio`, and every suite URL carries `style=` explicitly,
  so the suite is unaffected by the gallery default. The same holds for
  `npm run shots` and `npm run a11y`.

### 10. Motion ids

Every manifest `motion` value is now a catalog id, and `PENDING_RENAME` in
`packages/motion/src/catalog.test.ts` is empty.

| Manifest | Was | Now | Why |
| --- | --- | --- | --- |
| Button, IconButton, WindowControls | `press` | no key | No press pattern; the press is an instant color swap. Notes say what CSS animates. |
| Input | `fade` | no key | Only the focus glow fades; `fade-rise` would also rise. |
| StatusDot | `thinking` | no key | The pulse is a growing ring; `thinking` is three bouncing dots. |
| ProgressBar | `spinner` | no key | The indeterminate form slides; it does not turn. |
| Meter | `number-roll` | no key | A value change eases the fill; no number rolls. |
| NotificationCenter | `list-stagger` | no key | No stagger plays yet. |

Kept as honest: ProgressCircle and FloatingActionButton `spinner` (a turning
arc), Stat `number-roll`, Alert, Banner and ErrorState `fade-rise` (each has
the keyframe), and the rest. Tile, EmptyState, List and Card name a pattern
for how a parent brings them in, and their notes say so; I left those.

For the motion owner (no catalog entries were invented):

- `pulse`: a ring that grows and fades, a fixed number of times (StatusDot).
- A bar slide for indeterminate progress (ProgressBar).
- A fill pattern for value changes on a track (ProgressBar, Meter).
- `press`: scale.press and spring.press (Button, IconButton, WindowControls).
- `hover-lift`: transform only, reduced form none (Card, later Tile).

### 11. This report

Written here. No edit to `docs/contracts` or `DECISIONS.md`.

## For the lead

### Text for `docs/contracts/anatomy.md`, rule 1

Replace the "Names:" sentence of the private plumbing bullet with:

```md
   - Private plumbing, `--_<component>-<name>`, is declared on the root in
     the component CSS. Names, in this order of preference:
     - The base list: `height`, `padding-inline`, `padding-block`, `gap`,
       `font-size`, `radius`, `bg`, `fg`, `border-color`, `ring`, `shadow`,
       with the state suffixes `-hover`, `-active`, `-focus`, `-disabled`,
       `-invalid`.
     - A part name in front of a base name, for a part's own look:
       `-<part>-<base name>` (`--_alert-title-fg`, `--_bento-item-bg`,
       `--_menu-item-height`, `--_description-list-term-fg`), or a part name
       alone when the part has one color (`--_alert-icon`, `--_toast-edge`,
       `--_spinner-arc`, `--_spinner-track`, `--_scroll-area-thumb`).
     - A tone group for the colors a tone swaps as a set:
       `-tone-border`, `-tone-edge`, `-tone-text`, `-tone-tint`,
       `-tone-tint-strong`, `-tone-solid`, `-tone-solid-hover`,
       `-tone-on-solid`, `-tone-on-tint`.
     - Layout plumbing: `columns`, `row`, `template`, `span`, `row-span`,
       `row-gap`, `column-gap`, `min`, `max`, `width`, `size`, `padding`,
       `gutter`, `inset`, `justify`, `label-align`, `fraction`, `fill`,
       `track`, and `item-*` for the items of a container.
     - Motion plumbing, read by keyframes or transitions: `duration-in`,
       `duration-out`, `ease-in`, `ease-out`, `enter-scale`, `enter-y`,
       `lift`, `shift`.
     Any other name needs a line in the component CSS header saying what it
     is.
```

Names in the wild today, by kind (from `packages/css/src/components`):

- Tone groups: Alert, Banner, Callout and Button (`-tone-border`, `-edge`,
  `-text`, `-tint`, `-tint-strong`, `-solid`, `-solid-hover`, `-on-solid`,
  `-on-tint`).
- Part names: `-icon`, `-edge`, `-title-fg`, `-title-size` (Alert, Callout,
  Card, Tile, Toast, Dialog), `-header-bg`, `-footer-bg`, `-band-padding-*`
  (Dialog), `-item-*` (Bento, List, Menu, NotificationCenter, Grid),
  `-label-fg`, `-value-fg`, `-delta-fg`, `-hint-fg`, `-value-*` (Stat,
  Meter, ProgressBar), `-term-fg`, `-term-width`, `-pair-gap`
  (DescriptionList), `-face-top`, `-face-bottom`, `-separator-fg` (Kbd),
  `-thumb`, `-track`, `-bar-*`, `-fade-*` (ScrollArea), `-grip-*`, `-line-*`
  (ResizablePanels), `-arc`, `-track` (Spinner, ProgressCircle), `-glyph`,
  `-light`, `-lit`, `-idle`, `-ink` (WindowControls), `-description-*`
  (Section, List).
- Layout: `columns`, `row`, `template`, `span`, `row-span`, `row-gap`,
  `min` (Grid, Bento), `max`, `padding-inline` (Container), `padding`,
  `shadow` (Surface, Card, Tile, Window, Dialog), `width`, `height-max`,
  `gutter` (Dialog), `inset` (FloatingActionButton as `--_fab-inset`,
  Toaster, Menu), `justify`, `label-align` (Button), `fraction`, `fill`
  (Meter, ProgressBar, ProgressCircle), `size`, `width` (Spinner,
  ProgressCircle, StatusDot, Separator `thickness`).
- Motion: `duration-in`, `duration-out`, `ease-in`, `ease-out`,
  `enter-scale`, `enter-y` (Dialog, Menu, Toast), `lift` (Card), `shift`
  (Accordion), `duration`, `ease` (ScrollArea, ResizablePanels).
- Others worth a ruling: `decoration`, `decoration-hover` (Button, Link),
  `thickness` (Link, Separator), `ring-color`, `ring-width` (ScrollArea,
  SplitView, Menu item), `veil`, `select` (Card), `backdrop`, `scrim`,
  `scrim-filter`, `blur` (Dialog, Menu, Window, Toast), `cursor` (Window),
  `stroke-width` (Icon), `fit` (AspectRatio), `wrap` (TitleBar),
  `available-width`, `available-height`, `origin` (Menu, from Radix).
- One name does not follow `--_<component>-`: `--_fab-inset` on
  `floating-action-button`. Either allow a short alias or rename it to
  `--_floating-action-button-inset`.

### Layout data attributes in use

Read from `packages/react/src/components`, beyond the anatomy table and
`data-full-width`:

- Stack: `data-gap`, `data-align`, `data-justify`, `data-wrap` (boolean),
  and `data-orientation` for its `direction`.
- Grid: `data-columns`, `data-min`, `data-gap`, `data-row-gap`,
  `data-keep-columns` (boolean); its `item` part: `data-span`,
  `data-row-span`.
- Bento: `data-columns`, `data-span`.
- Container: `data-width`, `data-gutter`.
- Surface: `data-level`, `data-padding`, `data-radius`, `data-elevation`,
  `data-bordered` (boolean).
- AspectRatio: `data-fit`. Separator: `data-decorative`, `data-labelled`.
- Other component attributes outside the table, for the same DECISIONS.md
  entry: `data-attached` (ButtonGroup), `data-sticky` (Banner),
  `data-position` (FloatingActionButton, Toast), `data-extended`
  (FloatingActionButton), `data-variant` (Accordion, List, Skeleton),
  `data-interactive` (Card, Tile), `data-linked` (List), `data-standalone`
  (Link), `data-pulse`, `data-hide-label` (StatusDot), `data-trend` (Stat),
  `data-level` (Meter), `data-overflow-start`, `data-overflow-end`
  (ScrollArea), `data-collapsed` (ResizablePanels), `data-kind`,
  `data-movable`, `data-layered`, `data-zoomed`, `data-minimized` (Window),
  `data-unread`, `data-list`, `data-entry` (NotificationCenter).
- Layout components carry no `motion` key; each manifest's react note says
  so (lane 8A).

### Decision needed: does rule 12 (md is 32px) cover non controls?

Rule 12 reads as if every component's md is 32px. Sizes in use at md,
default density:

| Component | md | Token |
| --- | --- | --- |
| Button and its family, Input | 32px | `size.control.md` |
| Kbd | 24px | `size.icon.lg` (inline text, lane 9B asks for an exception) |
| Spinner | 24px | `size.icon.lg` |
| ProgressCircle | 44px | `size.control.lg` (40, 44, 48 by density) |
| StatusDot | 8px dot | `space.fixed.m` |
| ProgressBar, Meter | 8px track | `space.fixed.m` |
| Icon | 16px | `size.icon.md` |
| FloatingActionButton | 44px at least | `max(size.control.lg, size.touch.ios)` |

Suggested wording: "Rule 12 is for controls (an element a person presses
or types in). Every other component's md is the middle of its own scale,
named in its manifest, and its sizes come from tokens."

### Decision needed: Container `width`

Order 1.8 names Container's prop `size`. Lane 8A shipped `width`
(`sm`, `md`, `lg`, `xl`, `full`, default `lg`): `size` is the shared control
axis (`xs` to `lg`), the contract suite fails `props.size` with `xl` or
`full`, and a page width is not a control size. Recommend recording
`width` in DECISIONS.md and adding it to the anatomy table as a layout
attribute (`data-width`).

### The contract suite's default style

The suite runs its single runs (anatomy, variants, states, keyboard) in the
Theme manifest's default style, which stays `studio`. Recommendation: keep
Studio as the single run base while Neutral is `proposed`, and add Neutral
to the single runs once the owner approves it. DOM checks do not change
with style, but Neutral opens at comfortable density with 36 to 40px
controls, so target size and reflow are worth running there.

### Token requests, grouped for the token owner

Layout (lane 8A):

- `size.container.sm` 30rem, `.md` 48rem, `.lg` 68.75rem, `.xl` 84rem.
- `size.grid.item-min.sm` 10rem, `.md` 15rem, `.lg` 24rem.
- `space.gutter`: 16px at phone width in every density.
- Then `Container.css` sets `--_container-max: var(--ds-size-container-<w>)`
  and `Grid.css` `--_grid-min: var(--ds-size-grid-item-min-<s>)`.
- `size.measure` for long text lines (EmptyState, ErrorState; lanes 5C, 9C).
- A tile grid column minimum (TileGrid uses `2 * space.12xl`).

Menus (DropdownMenu report):

- `menu.width.max` (today twice `menu.width.min`).
- `scale.menu-enter` (today `scale.press`, the same 0.97).

Motion and timing:

- `delay.feedback`: how long CopyButton shows copied or failed (today
  `delay.peek-hide`).
- `duration.pulse` (StatusDot uses `duration.shimmer`).
- `ease.linear` for loops (Skeleton uses `ease.default`).
- A hover lift distance (Card uses `space.4xs`).
- Toast keyframes use a raw `scale(0.98)`; `scale.dialog-enter` already
  holds it (order 1.11 item 4, a Toast.css change, not a token).

Sizes:

- FAB sizes: `fab.height.md` 44 and `fab.height.lg` 48 (today
  `max(size.control.lg, size.touch.ios)` and `size.touch.android`).
- `size.icon.xl` (36) and `progress.ring.size.{xs..lg}`,
  `progress.ring.width.*` (Spinner lg and ProgressCircle lg are calcs).
- `progress.track.height.{sm,md,lg}` (bars borrow `space.fixed.*`).
- `kbd.height.xs|sm|md` (Kbd uses icon sizes and a calc).
- `list.row.height` per size, or `list.row.inset` (List uses a calc).
- `scrollbar.size.sm` (ScrollArea sm is a calc).
- `icon.stroke.width`, a base number (Neutral sets 1.5 through a recipe
  today, item 8 above).

Color:

- `color.state.veil-hover`, `color.state.veil-active`: an ink veil on a
  solid tone fill (Alert, Banner use `color-mix`).
- `color.neutral.solid` and `color.neutral.on-solid`, and
  `text.on-inverse` for `bg.inverse`.
- `color.selected.ring` (Card and Tile reuse the focus ring).
- `progress.track.bg` (the overlay-10 track is faint on Studio dark).
- A skeleton fill token (Stat uses `color.bg.overlay-10`).
- `scrollbar.thumb` contrast: about 2.3:1 on Studio light and 2.7:1 on
  Studio dark, under 3:1.
- `opacity.muted` for a stopped loop (today `opacity.disabled`).
- Input field fill and the title bar line have no token (Neutral report);
  two Neutral recipes exist only for that.

Component tokens:

- `stat.value.font-size.*` (Stat uses `font.size.2xl`, `4xl`, `6xl`).
- `bento.gap`, `bento.item.padding`, `section.title.size` if styles start
  to differ.

Layers:

- `z.raised` (1): content above a hover veil, or a handle above its
  siblings (NotificationCenter, ResizablePanels).

Build (Neutral report): let a style token carry `$extensions["ds.density"]`
so a style can set its own control sizes per density.

### Other follow ups seen on the way

- Accordion can adopt `--_button-justify` and `--_button-label-align` now,
  and needs `--_button-label-flex` (lane 9C) for the rest.
- Button spinner as Spinner needs the Angular Button in the same commit
  (item 5).
- Window's close can become a CloseButton when the Window owner takes it
  with the Angular port in mind.
- The rows of `wave-1-followups.md` done here: lane-5a 1, lane-5b 2, 3
  (the move), 5; lane-8a 1; lane-8b 1, 4; lane-8c useControllable;
  lane-9b 1; lane-9c 1 (justify and label align only); order-1-11 1; the
  Neutral report 2, 3; ButtonGroup 1; contract suite and Window 1.

## Proofs

Run on the tree as it was before the lead merged lanes 4B, 6A to 6C and 7A
to 7C (47 ready components in React, 3 in Angular).

- `npm run check`: pass (863 tests, every package check green).
- `npm run contract -- --framework react`: 1381 passed, 6 failed, 53
  skipped. The 6 are "no sideways scroll at 320px" for Meter,
  NotificationCenter and ScrollArea (en ltr and ar rtl). None of their demos
  changed here; the Meter demo uses `DemoGrid min="20rem"`, which is the
  whole 320px viewport before the stage padding. For the owners of lanes 5B,
  5C and 8C.
- `npm run contract -- --framework angular`: 102 passed, 1 skipped, 0
  failed (Button, Dialog, IconButton).
- `npm run shots -- --compare react angular` for Button, IconButton and
  Dialog: 60 pairs, 48 pass. Button and IconButton: 36 pairs, 0 differing
  pixels. Dialog: the 12 rtl pairs fail (0.6 to 3.9 percent). Cause, not
  from this pass: commit e179b2b put the React Dialog demo cases in
  `lang="en"` content Themes (`DemoCase lang="en"`), so in an Arabic page
  the English rows read left to right in React; the Angular Dialog demo has
  no such wrapper and its rows read right to left. The old React shot
  equals today's Angular shot pixel for pixel. Fix: give the Angular demo
  the same `lang="en"` content Themes, or drop them from the React demo.
- The shot matrix under `docs/reports/shots/matrix/` was put back to its
  committed state after the compare, since a filtered run refreshes only
  three components.
