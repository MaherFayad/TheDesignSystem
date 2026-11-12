# Lane 8B report: Surfaces

Branch `claude/ds-lane-8b`, from `claude/relaxed-hypatia-7gseap` at `adf1833`.
Orders 1.8.5 Surface, 1.8.4 Section, 1.8.11 Bento, built in that order. All three
are done.

| Order | Component | Commits | `npm run check` | Contract (react) |
| --- | --- | --- | --- | --- |
| 1.8.5 | Surface | `wo-1.8.5: Surface`, `wo-1.8.5: Surface review fixes` | green | 20 passed, 1 skipped (keyboard map: no keys) |
| 1.8.4 | Section | `wo-1.8.4: Section`, `wo-1.8.4: Section review fixes` | green | 21 passed, 10 skipped (overlay only checks, see below) |
| 1.8.11 | Bento | `wo-1.8.11: Bento`, `wo-1.8.11: Bento review fixes` | green | 20 passed, 1 skipped (keyboard map: no keys) |

Generated files (barrels, `packages/css/src/index.css`,
`packages/styles/studio/index.css`, `routes.gen.ts`, `manifests.gen.json`) were
refreshed with `npm run gen` and committed as generated. Regenerate them on
merge.

## Sources

GoBanana could not be attached in this session: the request to add the
private repo was refused. Nothing from `.st-section`, `.st-tile-grid`,
`.st-tile`, admin `ui.tsx` or site `landing.css` was read. The components
follow Figma-Killer-2 (`Section/`, `Widget/`), `docs/contracts/token-mapping.md`
for the surface steps, and the dials table in PLAN.md 3.7. Each component file
says so in its header. A pass against GoBanana is worth doing when it is
available, for the Section title sizes and the Bento gap and padding above
all.

## Files touched

- `packages/react/src/components/{Surface,Section,Bento}/**`
- `packages/css/src/components/{Surface,Section,Bento}.css`
- `packages/manifest/src/component/{Surface,Section,Bento}.manifest.json`
- `packages/styles/studio/recipes/Bento.css` (new recipe)
- `docs/reports/shots/wave-1/{surface,section,bento}/`
- `docs/reports/lanes/lane-8b.md` (this file)
- generated: `packages/react/src/index.ts`, `packages/css/src/index.css`,
  `packages/styles/studio/index.css`, `apps/gallery-react/src/routes.gen.ts`,
  `packages/manifest/manifests.gen.json`

## 1.8.5 Surface

A plain background box on one surface step. Not interactive. Every look is a
data attribute the shared CSS reads, so Angular stamps the same attributes.

```tsx
type SurfaceLevel = 'body' | 1 | 2 | 3 | 4 | 5 | '1' | '2' | '3' | '4' | '5';
type SurfaceElevation = 'none' | 'card' | 'panel';
type SurfaceRadius = 'none' | 'xs' | 'sm' | 'field' | 'control' | 'panel' | 'card' | 'window' | 'sheet';
type SurfacePadding = 'none' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | ... | '12xl';
type SurfaceElement = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'figure' | 'li';

interface SurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  level?: SurfaceLevel;          // default 1        -> data-level
  bordered?: boolean;            // default false    -> data-bordered
  elevation?: SurfaceElevation;  // default 'none'   -> data-elevation
  radius?: SurfaceRadius;        // default 'card'   -> data-radius
  padding?: SurfacePadding;      // default 'xl'     -> data-padding
  as?: SurfaceElement;           // default 'div'
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- `as` is not in the order's props list. I added it because a surface is often
  an `aside`, `article` or `li`, and a wrapper div around it would add a level
  for nothing.
- The border is always 1px wide and transparent at rest. A bordered and a
  plain surface have the same box, and in forced colors mode the system draws
  the transparent border, so every surface keeps an edge without its fill or
  shadow. The cost: `padding="none"` still insets the content by 1px.
- No `pill` radius. A block box with round ends clips its text into the curve
  (found in review). A pill is a control or a Badge.
- No `motion` key in the manifest: a surface does not change. Field and
  TitleBar set the precedent.
- A unit test checks that `Surface.css` has a rule for every manifest value of
  level, elevation, radius and padding.
- Liquid: the manifest says content surfaces stay solid, never glass.

## 1.8.4 Section

A titled region, optionally collapsible on Radix Collapsible.

```tsx
type SectionSize = 'sm' | 'md';
type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;                         // required
  level: SectionLevel;                      // required, no default
  description?: ReactNode;
  actions?: ReactNode;                      // outside the toggle
  size?: SectionSize;                       // default 'md'
  collapsible?: boolean;                    // default false
  open?: boolean;
  defaultOpen?: boolean;                    // default true
  onOpenChange?: (open: boolean) => void;
  landmark?: boolean;                       // default false: adds the title id to aria-labelledby
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}
```

DOM:

```text
section[data-ds=section][data-size][data-state when collapsible]
  div[data-part=header]
    h<level>[data-part=title]
      button[data-ds=button][data-part=toggle]   collapsible only, Radix Collapsible.Trigger
    div[data-part=actions]
    p[data-part=description]
  div[data-part=body]                            Collapsible.Content when collapsible
```

Decisions:

- `level` is required with no default, so the heading level is never
  guessed.
- The toggle is the system Button (ghost, square, `wrap`) inside the heading:
  the disclosure pattern. The heading keeps its place in the outline and the
  button's name is the title. `wrap` lets a long title wrap and also turns
  off the Desk roll label, which reads badly on a section title.
- The chevron is `chevron-forward` closed and `chevron-down` open (an icon
  swap, not a rotation), so it mirrors correctly in RTL with no special case.
  Section keeps its own open state, controlled or not, to pick the icon.
- A collapsible section with no children is not a disclosure: it draws the
  header alone, with no toggle and no `data-state` (Figma-Killer-2's rule). A
  child component that renders null still counts as a body; the prop doc and
  manifest say to pass no children instead.
- `defaultOpen` is true. A page section that starts hidden is the rarer case.
- `landmark` is opt in. A `section` with a name is a region landmark, and a
  page of named sections floods the landmark list.
- A section that follows another is set off by a hairline drawn on the
  section itself, with the gap above and below it.
- Motion `accordion-height`, open only: the body fades in and slides from
  `space.xs` above (transform and opacity). Closing is instant. With no
  animation on the closed state, Radix Presence unmounts at once, so nothing
  waits on `animationend`. Under reduced motion the keyframes are opacity
  only. When 1.11 lands, this should move to the catalog helper; the catalog
  text says "a clip", and this animates the body itself.
- Radix keeps a closed body as an empty `hidden` element, so `aria-controls`
  always resolves.
- Radix also stamps `data-state` on the toggle Button. It is the Section's
  state on its toggle part; the Button manifest does not list it.
- Contract hints: `Enter` and `Space` on `[data-part='toggle']` in the
  variants case, `expect: state-changes`. The 10 skipped checks are the
  "open" target size and axe passes the suite runs only for overlays with a
  trigger. Section lists `open` and `closed` but has no trigger, so they skip.

## 1.8.11 Bento

```tsx
type BentoColumns = 2 | 3 | 4;
type BentoSpan = '1x1' | '2x1' | '1x2' | '2x2';

interface BentoProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  columns?: BentoColumns;               // default 4 -> data-columns
  as?: 'div' | 'ul' | 'section';        // default 'div'
  ref?: Ref<HTMLElement>;
}
interface BentoItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  span?: BentoSpan;                     // default '1x1' -> data-span, data-part="item"
  as?: 'div' | 'li' | 'article';        // default 'div'
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- `columns` is not in the order. A 4 column grid is too dense for a three
  tile landing section, so 2, 3 and 4 are offered.
- `grid-auto-flow: row` with no `dense`: reading order equals visual order. A
  wide tile that does not fit leaves a hole. The manifest `mistakes` and the
  demos ask for spans that fill each row.
- At most 2 columns under `breakpoint.tablet`, 1 under `breakpoint.phone`.
  On phones every span resets to one cell (column and row), so a large tile
  is not a tall empty box. The media rules match a root with or without
  `data-columns`.
- The breakpoints are viewport media queries, not container queries: the grid
  template sits on the root, and a root cannot query its own size. The
  manifest `avoidWhen` names a narrow pane on a wide screen.
- Studio recipe (`packages/styles/studio/recipes/Bento.css`): tiles 1px apart
  on `color.bg.body`, surface 2 tiles, square inner corners, the grid on the
  card radius with `overflow: clip`. The parent fill is the body, so a hole
  reads as the page. In Studio light the 1px line is about 1.2:1 against the
  tiles. That is the Studio separation dial on non-interactive tiles, so
  WCAG 1.4.11 does not apply, but it is faint.
- Base (Desk, and Neutral until it has its own look): free tiles on
  `color.bg.surface`, the card radius, `space.l` gap.
- Forced colors: each tile draws an inset outline, so the Studio clip does
  not cut it.
- No `motion` key, as for Surface.

## Token gaps

- The batch header says layout components use only `space`, `size` and
  `breakpoint` tokens. Surface, Section and Bento also need color, radius,
  elevation, border, font and (Section) duration tokens. This is by nature for
  a surface; record it so the header does not read as a rule these break.
- No component tokens exist for `section.*` or `bento.*` (gap, padding, row
  height, title size). The private properties default to semantic tokens. If
  styles start to differ, add `bento.gap`, `bento.item.padding` and
  `section.title.size` to the token build so the Studio Bento recipe can
  shrink to tokens.
- The private property names go past the list in anatomy.md convention 1:
  Surface `padding` and `shadow`; Section `header-height`,
  `description-size`, `description-fg`; Bento `columns`, `row`, `item-bg`,
  `item-fg`, `item-radius`, `item-padding`. The list may want a line that
  allows layout names.
- In Studio light and Desk light, surface 3 and surface 4 are close in value,
  and surface 4 is close to the gallery page. That comes from the tokens; the
  nested demo still reads, but only just.

## Review findings

One fresh eyes review per component (ds-qa, claude-opus-5-5 at medium).

Fixed:

- Surface, blocker: `SurfaceProps` kept the native `title` attribute. Now
  `Omit<..., 'title'>` on all three components.
- Surface: string levels `'1'` to `'5'` are accepted, so code built from the
  manifest type checks. `a11y.role` reworded (it read as `role="none"`). A note
  and a mistake on muted text over levels 4 and 5, which the contrast gate does
  not check. `pill` radius removed. The elevation demo row has room for its
  shadows. A CSS-to-manifest test. Arabic copy "سطح بإطار".
- Section: the header comment now names all four direct declarations on the
  toggle. `landmark` merges with a passed `aria-labelledby`. The description
  indent counts the Button border. `insteadUse` no longer names a Collapsible
  that does not exist. Demo copy: no meta copy, no period after a fragment.
  The long text case sits in a narrow panel, so the wrap path shows (shot
  `desk-dark-long-text-focus.png`, with the focus ring).
- Bento, blockers: the media rules missed a root without `data-columns`. In
  Studio a hole next to square tile corners broke the outline, and the demos
  showed rows with holes. Now every demo row fills and `mistakes` says why.
- Bento: spans reset to one cell on phones. The forced colors outline is
  inset. `columns={2}` is in a demo. The native role is "none, or list when the
  tiles are a list". There is a mistake for `ul` with `div` items.

Left open (notes):

- Section: the negative start offset puts the toggle's hover fill and focus
  ring past the section's start edge. A clipping parent with no inline
  padding would cut the ring (WCAG 2.4.7). Check it inside ScrollArea when
  1.8.7 lands.
- Section: the chevron centers on a wrapped title's whole block, not on its
  first line.
- Section: the open only reveal moves to the 1.11 catalog helper later.
- Bento: in the RTL shots, English demo sentences put their full stop on the
  wrong side. The same holds for every demo in the gallery under `dir=rtl`;
  only the Arabic cases are meant to be read in RTL.
- Bento: a ul root does not make its items li by itself. `as="li"` is the
  caller's job, and the manifest says so. A context default is possible later.

## Screenshots

`docs/reports/shots/wave-1/<slug>/` for surface, section and bento: studio
dark and light, desk dark and light, desk dark RTL Arabic, studio dark
compact, desk dark comfortable. Bento also has `studio-dark-phone.png` at
375px (one column). Section also has `desk-dark-long-text-focus.png`. All were
read and checked.

## Changes needed from the lead

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

## What I could not do

- Read GoBanana (see Sources).
- Angular and native: planned in the manifests, not built (not in this lane).
- Neutral: not built yet. All three use tokens, and the base Bento look is
  meant for Neutral too, so they should apply when it lands.
