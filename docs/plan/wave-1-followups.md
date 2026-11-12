# Wave 1 follow ups from the lanes
Collected from `docs/reports/lanes/*.md`, section "Changes needed from the lead",
and from the Neutral and DropdownMenu reports. A consolidation order works
through this list after each round of merges. Tick an item when it lands.

## From lane-5a

1. **CloseButton (order 1.1.9).** The `close` part of Alert and Banner is an
   IconButton (`icon="close" size="xs" emphasis` default ghost, with
   `data-part="close"`) because CloseButton does not exist on this branch.
   When it lands, in `packages/react/src/components/Alert/Alert.tsx` and
   `Banner/Banner.tsx` replace
   `<IconButton data-part="close" icon="close" label={...} size="xs" onClick={...} />`
   with `<CloseButton data-part="close" label={...} size="xs" onClick={...} />`.
   The CSS selectors use `[data-part='close']` and, for solid fills,
   `[data-ds='icon-button'][data-part='close']`; the second must become
   `[data-ds='close-button'][data-part='close']` (Alert.css and Banner.css,
   the solid emphasis blocks).
2. **DECISIONS.md**: record that private properties may carry a
   `-tone-*` group and part names (`-icon`, `-edge`, `-title-fg`) beyond
   the rule 1 list, as Toast, Alert, Callout and Banner do.
3. **Motion catalog (1.11)**: Alert and Banner name `fade-rise`. Their CSS
   keyframes (`ds-alert-in`, `ds-banner-in`) can move to the catalog
   helper once it exists.
4. **Tokens**: the gaps above.

## From lane-5b

1. Button renders Spinner as its `spinner` part: the exact change is under
   Spinner above.
2. Contract suite, `packages/contract-tests/src/lib.ts` line 58: valued state
   attributes are only `data-state` and `data-orientation`, so Meter cannot
   list `data-level` in `states` (it would be checked as a boolean). Change
   to `const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-level']);`
   or let a manifest state say `data-level=low|medium|high`. Then add
   `"data-level"` to `Meter.manifest.json` `states`.
3. Move `packages/react/src/components/Meter/level.ts` to
   `packages/shared/src/meter.ts` (with its tests) so Angular uses the same
   rule, and replace `packages/react/src/components/ProgressBar/format.ts`
   with `number.ts` once order 1.2.5 lands. Add both to STATE.md so they are
   not lost.
4. Motion catalog (1.11): a bar pattern for the indeterminate slide and a
   fill pattern for value changes; today ProgressBar and ProgressCircle say
   `spinner` and Meter says `number-roll`.
5. Manifest schema, `packages/manifest/schema.json` prop `type` enum (lines
   128 to 134): add `object`, so Meter `levelLabels` can say what it is.
6. Decide whether rule 12 (md is 32 px) covers non controls: Spinner md is
   24 px and ProgressCircle md 44 px. Log it in DECISIONS.md.

## From lane-5c

1. Motion ids. Order 1.11 has no pulse pattern. StatusDot names
   `"motion": "thinking"` as the closest id. Either add a `pulse` pattern to
   the 1.11 list (and change `packages/manifest/src/component/StatusDot.manifest.json`
   `"motion"` to `"pulse"`), or confirm `thinking`.
2. NotificationCenter names `"motion": "list-stagger"` for when new items
   are inserted, but no stagger plays yet: the panel renders a static list.
   When 1.11 lands, either wire `list-stagger` on inserted items or change
   the manifest's `"motion"`.
3. Regenerate on merge (`npm run gen`): the barrels, `packages/css/src/index.css`,
   `routes.gen.ts` and `manifests.gen.json` on this branch were generated
   per commit and are correct as of the last commit.

## From lane-8a

1. Move `SpaceStep` and `spaceSteps` from
   `packages/react/src/components/Stack/space.ts` to a new
   `packages/shared/src/space.ts` (with a test), re-exported from
   `@the-system/shared`, then import it in Stack, Grid and Container
   (`import type { SpaceStep } from '@the-system/shared'`) and drop line 2 of
   `packages/react/src/components/Stack/index.ts`. Lane 8B (Surface padding)
   needs the same type.
2. Add layout tokens to `packages/tokens/src/base/size.json`:
   `size.container.sm` 30rem, `.md` 48rem, `.lg` 68.75rem, `.xl` 84rem;
   `size.grid.item-min.sm` 10rem, `.md` 15rem, `.lg` 24rem; and
   `space.gutter` (16px at phone width in every density). Then in
   `Container.css` set `--_container-max: var(--ds-size-container-<w>)` and in
   `Grid.css` `--_grid-min: var(--ds-size-grid-item-min-<s>)`.
3. Record in `DECISIONS.md` the layout data attributes listed above, that
   layout components omit `motion`, and extend the private property names in
   `docs/contracts/anatomy.md` rule 1 with the layout plumbing names above.
4. Record that Container's width prop is `width`, not the order's `size`.

## From lane-8b

1. `packages/css/src/components/Button.css`: add private properties so a
   parent can restyle a Button without direct declarations. In the root rule
   (`:is([data-ds='button'], [data-ds='icon-button'])`, around line 31):

   ```css
   --_button-justify: center;
   ...
   justify-content: var(--_button-justify);   /* replaces justify-content: center */
   ```

   In `[data-ds='button'][data-wrap] > [data-part='label']` (around line 112):
   `text-align: var(--_button-label-align, center);` in place of
   `text-align: center;`. Then Section.css can set `--_button-justify:
   flex-start` and `--_button-label-align: start` and drop its two direct
   declarations. The start offset and the chevron color stay as they are.
2. `docs/plan/wave-1-batch-8.md`, batch header: say that surface components
   also read color, radius, elevation and border tokens (see Token gaps).
3. `docs/contracts/anatomy.md`, convention 1: allow layout names for private
   properties (`columns`, `row`, `padding`, `shadow`, `item-*`), or tell me
   the names to use and I will rename.
4. Wave 1 shared types: Surface defines `SurfacePadding` (the space steps
   `2xs` to `12xl` plus `none`) locally. Lane 8A (Stack, Grid) needs the same
   list for `gap`. A shared `SpaceStep` type in `packages/shared/src/axes.ts`
   (or `space.ts`) would serve both. Not added here, because no order in this
   lane names that file.
5. GoBanana access for a later pass on these three (see Sources).

## From lane-8c

- Run `npm run gen` on merge (the barrels, `packages/css/src/index.css`,
  `routes.gen.ts` and `manifests.gen.json` were regenerated and committed on
  this branch, but the lead's merge with other lanes needs a fresh run).
- `packages/shared/src/index.ts` gains `export * from './resize';` through
  gen.
- Route the token questions above to ds-tokens.
- Move `packages/react/src/components/Window/useControllable.ts` to a shared
  place (for example `packages/react/src/internal/useControllable.ts`) and
  update its importers: Window, Dialog and now SplitView
  (`SplitView.tsx`, the line `import { useControllable } from '../Window/useControllable';`).
  It is a private helper of another component today; Dialog already
  imports it the same way.

## From lane-9b

1. **Contract suite, valued state attributes.**
   `packages/contract-tests/src/lib.ts:58`:

   ```ts
   // before
   const VALUED_STATES = new Set(['data-state', 'data-orientation']);
   // after
   const VALUED_STATES = new Set(['data-state', 'data-orientation', 'data-trend', 'data-variant', 'data-side']);
   ```

   Or better, a manifest way to declare valued states. After that, add
   `data-trend` to `Stat.manifest.json` `states`. Toast's `data-swipe` has
   the same problem and passes today only because no swipe happens during
   the scan.

2. **DECISIONS.md:** Kbd's md is 24px, an exception to anatomy rule 12
   (inline text, not a control). Also, `--_kbd-face-top`,
   `--_kbd-face-bottom`, `--_kbd-shadow`, `--_stat-value-*`,
   `--_list-item-bg-*` and `--_description-list-pair-gap` extend the
   private names of rule 1.

3. **After 1.2.5 merges:** replace
   `packages/react/src/components/Stat/formatStatNumber.ts` with
   `formatNumber` from `packages/shared/src/number.ts`. Keep
   `breakableValue` in Stat.

4. **After 1.11 merges:** check that `number-roll` and `list-stagger` are in
   the catalog. Then move Stat's roll keyframes into the pattern, and call
   its `animate()` helper in `useRollOnChange`.

5. **Tooltip and DropdownMenu** (1.6.6, 1.6.8): render the shortcut part as
   given in the Kbd section above.

6. **Icons:** decide whether `trend-up` and `trend-down` go on the mirror
   list in `packages/icons/src/names.ts`. Today they do not mirror.

## From lane-9c

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

## From order-1-11

1. The four manifest edits above (one line each, `"motion": ...`). Then
   delete the matching rows of `PENDING_RENAME` in
   `packages/motion/src/catalog.test.ts`; the test tells you when.
2. Decide on `press`: either accept `none` for press feedback (CSS only, no
   catalog entry) or let 1.21 add a 19th id `press` (scale.press,
   spring.press). The 18 ids were fixed by the order, so I did not add it.
3. Window.tsx: no change needed. `animateWindow`, `settle` and `settled` are
   exported from the barrel as before, and `styleMotion.ts` still finds
   `WindowMotionMode` and `preset.window`. Optional later: read
   `patternPreset(style, 'window-grow')` instead of the `window` mode once
   the Theme carries presets.
4. Toast.css line 158 and 165 use a raw `scale(0.98)`. The catalog reads
   `scale.dialog-enter` (0.98). Suggested change in Toast.css:
   `scale(0.98)` to `scale(var(--ds-scale-dialog-enter))` in both
   keyframes. Same value, now a token.
5. `packages/manifest/manifests.gen.json` on the lead branch is stale
   against the source manifests (`npm run gen` rewrites it). I left it as
   it was; regenerate on merge.

## From the Neutral report (order 1.10)

1. A style cannot set its own control sizes without breaking density: density
   rules are weaker than style rules. Let a style token carry
   `$extensions["ds.density"]` and have `build.ts` write those values under
   `[data-style='<id>'][data-density='<d>']` after the style rules.
2. `Icon.css`: `stroke-width: var(--_icon-stroke-width, 2);` in the line set
   rule, or a base number token `icon.stroke.width`, so Neutral can draw at
   1.5.
3. Gallery default style is Neutral: `apps/gallery-react/src/App.tsx` line 26
   and `axes.ts` (`GALLERY_STYLE`), and the same in
   `apps/gallery-angular/src/app/app.ts`. The Theme fallback stays `studio`.
4. `Input.css` sets the field fill to `transparent` with no token behind it,
   and the title bar line has no token: two recipes exist only for that.

## From the DropdownMenu report

1. Tokens: `menu.width.max`, `scale.menu-enter`.
2. The `useMenuLayer` helper could be shared (lane 6C decides).
3. The contract suite cannot open a menu before pressing Home, End, the
   submenu arrows or typeahead.

## From the ButtonGroup report

1. Remove the `cloneElement` fill in `ButtonGroup.tsx` once Button reads the
   group context (lane 1A).

## From the contract suite and Window reports

1. `packages/contract-tests/src/lib.ts`, `moveDirection`: a `physical` flag
   on a key hint, so a positioned object moves the same way in RTL.
