// Surface: a plain background box on one surface step, with an optional
// border and elevation. Not interactive: a box you click is a Card.
//
// Sources: the surface steps of GoBanana `studio-tokens.css` (`--st-bg-body`,
// `--st-bg-surface` to `--st-bg-surface-5`, through
// docs/contracts/token-mapping.md) and the tile of Figma-Killer-2 `Widget/`:
// an achromatic card on `surface-2`, no border, the card radius. GoBanana
// itself could not be read in the lane session that built this file, so the
// looks follow the token mapping and the FK2 tile.
//
// Every look is a data attribute the shared CSS reads (Surface.css), so the
// Angular port stamps the same attributes. No inline style.
import type { HTMLAttributes, Ref } from 'react';

/** The surface step: `body` is the page, 1 to 5 step up from it. Numbers or the same digits as strings. */
export type SurfaceLevel = 'body' | 1 | 2 | 3 | 4 | 5 | '1' | '2' | '3' | '4' | '5';
/** Shadow from the elevation tokens. */
export type SurfaceElevation = 'none' | 'card' | 'panel';
/** A radius token name, or none. */
export type SurfaceRadius = 'none' | 'xs' | 'sm' | 'field' | 'control' | 'panel' | 'card' | 'window' | 'sheet';
/** A space token step, or none. */
export type SurfacePadding =
  | 'none'
  | '2xs'
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl'
  | '10xl'
  | '11xl'
  | '12xl';
/** The element. Pick the one that says what the box is; div says nothing. */
export type SurfaceElement = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'figure' | 'li';

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface SurfaceProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The surface step. Default 1 (`color.bg.surface`). */
  level?: SurfaceLevel;
  /** A 1px border in `color.border.default`. Default false. */
  bordered?: boolean;
  /** Shadow. Default none. Studio is flat, so keep none there unless the box floats. */
  elevation?: SurfaceElevation;
  /** Corner radius, a radius token name. Default card. */
  radius?: SurfaceRadius;
  /** Inner space on every side, a space token step. Default xl. */
  padding?: SurfacePadding;
  /** The element. Default div. */
  as?: SurfaceElement;
  ref?: Ref<HTMLElement>;
}

/** A background box on a surface step. */
export function Surface({
  level = 1,
  bordered = false,
  elevation = 'none',
  radius = 'card',
  padding = 'xl',
  as = 'div',
  ref,
  ...rest
}: SurfaceProps) {
  // Every element in SurfaceElement takes the same props; narrow to one for the checker.
  const Element = as as 'div';
  return (
    <Element
      {...rest}
      ref={ref as Ref<HTMLDivElement>}
      data-ds="surface"
      data-level={String(level)}
      data-elevation={elevation}
      data-radius={radius}
      data-padding={padding}
      data-bordered={bordered ? '' : undefined}
    />
  );
}
