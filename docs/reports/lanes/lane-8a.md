# Lane 8A: Primitives

Branch `claude/ds-lane-8a`. Built in order: Stack (1.8.1), Grid (1.8.2),
Container (1.8.3), AspectRatio (1.8.10), Separator (1.8.6). All five are
done. For each one, `npm run check` is green, `npm run contract -- --framework react --component <Name>`
is green (20 passed, 1 skipped: the keyboard map, because none of them has
keys), and screenshots are in `docs/reports/shots/wave-1/<slug>/` (studio
dark and light, desk dark and light, desk dark rtl ar; grid also at 320px).

Sources: Figma-Killer-2 was cloned and read (Stack, Separator). GoBanana
could not be attached in this session (the add_repo call was refused), so
`.st-tile-grid`, `landing.css` and `.st-menu-sep` were not read. Grid,
Container and Separator follow the order, the dials table and the token
scale instead, and their file headers say so.

## Stack (wo-1.8.1)

A flex box on the block axis (column) or the inline axis (row). Values go out
as data attributes so the shared CSS works for Angular too.

```ts
interface StackProps extends HTMLAttributes<HTMLElement> {
  direction?: 'block' | 'inline';             // default block; data-orientation vertical | horizontal
  gap?: SpaceStep;                            // default 's'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;                             // default false; data-wrap
  as?: 'div' | 'span' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'form' | 'fieldset' | 'ul' | 'ol';
  asChild?: boolean;                          // radix Slot, wins over as
  ref?: Ref<HTMLElement>;
}
type SpaceStep = 'none' | '4xs' | '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | ... | '12xl';
```

Decisions:

- No reverse directions: a reversed visual order breaks reading and focus
  order (WCAG 1.3.2, 2.4.3).
- `ul` and `ol` lose their bullets and get `role="list"`, so Safari keeps the
  list semantics. With `asChild` the caller sets the role (manifest says so).
- FK2 `height` was left out: a layout escape hatch for the caller's own CSS.
- `SpaceStep` lives in `Stack/space.ts` and Grid and Container import it from
  there (same lane). The lane intro says `2xs` to `12xl`; I added `none`,
  `4xs` and `3xs` because they are steps of the same token scale.

## Grid (wo-1.8.2)

```ts
interface GridProps extends HTMLAttributes<HTMLElement> {
  columns?: 1 | 2 | ... | 12 | 'auto-fit';     // default auto-fit; data-columns
  minItemSize?: 'sm' | 'md' | 'lg';           // default md, auto-fit only; data-min
  gap?: SpaceStep;                            // default 'l'
  rowGap?: SpaceStep;
  keepColumns?: boolean;                      // default false; data-keep-columns
  as?: 'div' | 'section' | 'ul' | 'ol';
  ref?: Ref<HTMLElement>;
}
interface GridItemProps extends HTMLAttributes<HTMLElement> {  // data-part="item"
  span?: 1 | 2 | ... | 12 | 'full';           // default 1; data-span
  rowSpan?: 1 | 2 | 3 | 4;                    // default 1; data-row-span
  as?: 'div' | 'li' | 'article' | 'section';
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- Tracks are `minmax(0, 1fr)`; the auto-fit minimum is `min(<size>, 100%)`,
  so there is no sideways scroll at 320px (checked in the contract suite and
  in the 320px screenshots).
- Fixed counts fall to one column under `breakpoint.phone` (a viewport media
  query with the `/* breakpoint.phone */` comment), and every item fills that
  column so a span never adds a track. `keepColumns` opts out.
- The fallback is a viewport query, not a container query: a Grid in a
  narrow sidebar keeps its columns. The manifest says to use auto-fit there.

## Container (wo-1.8.3)

```ts
interface ContainerProps extends HTMLAttributes<HTMLElement> {
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // default lg; data-width
  gutter?: SpaceStep;                         // default '3xl' (16px on phones, default density); data-gutter
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer';
  ref?: Ref<HTMLElement>;
}
```

Decisions:

- The order names the prop `size`. It is `width` here: `size` is the shared
  control axis (`xs` to `lg`), the contract suite fails a `props.size` with
  `xl` or `full`, and a page width is not a control size.
- The max width includes the gutter (border box), and the box is 100% wide,
  so a phone keeps 16px on each side.

## AspectRatio (wo-1.8.10)

```ts
interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number;                             // default 16 / 9; not a positive finite number falls back to 16 / 9
  fit?: 'cover' | 'contain';                  // default cover; data-fit, for img, video, iframe, picture, canvas
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:

- Radix AspectRatio renders a wrapper div around the root. That wrapper is
  what a grid or flex parent stretches, and a stretched wrapper loses the
  ratio. The demo wraps each box in a cell with `align-self: start`, and the
  manifest lists the trap under `mistakes`. The shared CSS does not style the
  Radix wrapper (a React detail; Angular will set native `aspect-ratio` on
  the host and has no wrapper).
- The manifest names the native `aspect-ratio` property as the plain
  alternative under `avoidWhen`, `insteadUse` and `mistakes`.

## Separator (wo-1.8.6)

```ts
interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';    // default horizontal; data-orientation
  decorative?: boolean;                       // default true; role none, data-decorative
  label?: ReactNode;                          // renders line, label, line; data-labelled
  ref?: Ref<HTMLDivElement>;
}
```

Decisions:

- Anatomy is `root`, `line`, `label`. The order proposed `root` and `label`;
  a labelled line needs two line elements, and `::before` and `::after` are
  reserved for focus and hover by the convention, so the lines are parts.
- Decorative lines use `color.border.subtle`. A semantic separator
  (`decorative={false}`) carries meaning, so it uses `color.border.control`,
  which meets 3:1 (WCAG 1.4.11).
- The line is a border, not a background, so it stays visible in forced
  colors (CanvasText, GrayText when decorative).
- A semantic labelled separator is named by its label (`aria-labelledby`).
- No spacing prop (FK2 had one): the parent Stack or Grid gap spaces it.

## Lane wide decisions

- No `motion` key in the five manifests: a static layout has nothing to
  animate, and naming a catalog pattern would be false. Each React block
  note says so.
- New data attributes outside the shared axes: `data-gap`, `data-row-gap`,
  `data-align`, `data-justify`, `data-wrap`, `data-columns`, `data-min`,
  `data-keep-columns`, `data-span`, `data-row-span`, `data-width`,
  `data-gutter`, `data-fit`, `data-decorative`, `data-labelled`. They are
  layout values the shared CSS needs (Angular sets the same ones).
- Demo boxes come from `Stack/DemoBox.tsx` (demo only, not exported), used by
  all five demos.

## Token gaps

- No layout widths. Container widths are `breakpoint.phone`,
  `breakpoint.tablet`, `breakpoint.desktop` and `desktop + phone / 2` (xl,
  about 86rem). Grid minimums are `phone / 3` (sm, 10rem), `phone / 2` (md,
  15rem) and `tablet / 2` (lg, 24rem). Both sit behind private properties
  (`--_container-max`, `--_grid-min`), so a token swap is one line each.
- No page gutter token: Container defaults to `space.3xl`, which is 16px on
  phones only in the default density (14px compact, 18px comfortable).

## Review findings

Stack, round 1 (fixed): a mistake example mapped 12px to `gap xl` (it is
`l`); private `--_stack-direction`, `-align`, `-justify`, `-wrap` were not in
the convention's name list (now plain declarations in the attribute
selectors); the asChild list role is documented and tested; demo rows got
labels and a visible stack outline; tests for `gap="none"` and default align.

Stack, left open: `spaceSteps` and `SpaceStep` are exported from the Stack
barrel (see changes needed); English demo sentences show the full stop on the
wrong side in the rtl gallery screenshots (the demo kit renders English copy
in an rtl Theme; a gallery matter).

REVIEW_ROUND_2

## Changes needed from the lead

1. Move `SpaceStep` and `spaceSteps` from
   `packages/react/src/components/Stack/space.ts` to a new
   `packages/shared/src/space.ts` (with a test), re-exported from
   `@the-system/shared`, then import it in Stack, Grid and Container
   (`import type { SpaceStep } from '@the-system/shared'`) and drop line 2 of
   `packages/react/src/components/Stack/index.ts`. Lane 8B (Surface padding)
   needs the same type.
2. Add layout tokens to `packages/tokens/src/base/size.json`:
   `size.container.sm` 30rem, `.md` 48rem, `.lg` 68.75rem, `.xl` 86rem;
   `size.grid.item-min.sm` 10rem, `.md` 15rem, `.lg` 24rem; and
   `space.gutter` (16px at phone width in every density). Then in
   `Container.css` set `--_container-max: var(--ds-size-container-<w>)` and in
   `Grid.css` `--_grid-min: var(--ds-size-grid-item-min-<s>)`.
3. Record in `DECISIONS.md` the layout data attributes listed above, and
   that layout components omit `motion`.
4. Record that Container's width prop is `width`, not the order's `size`.

## What I could not do

- Read GoBanana (not reachable in this session).
- Separate fresh eyes reviews per component: Stack had its own; Grid,
  Container, AspectRatio and Separator shared one review.
