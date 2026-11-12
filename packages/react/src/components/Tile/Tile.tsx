'use client';
// Tile: the borderless card of Studio. Tiles sit in a TileGrid that is split
// by a 1px gap, so the parent surface shows between them as the separation
// (Studio dial 4). In Desk a recipe turns the grid into separate cards with
// the style's spacing and hairline (Desk dial 4).
//
// Sources: Figma-Killer-2 `Widget.module.css` (borderless tile on the darker
// parent, the 1px grid gap, the surface tone lifts on hover). GoBanana
// `.st-tile-grid` could not be read in this session; values come from the
// dials table in PLAN.md section 3.7 and the tokens.
//
//   <div data-ds="tile-grid">                     the 1px gap grid (its own root, styled in TileGrid.css)
//     <div data-ds="tile" data-size [data-interactive] [data-selected]>
//       <div data-part="media">                   optional, bleeds to the edges
//       <h3 data-part="title"><a data-part="link"> the one real link, its target stretched over the tile
//       <p data-part="meta">                       one muted line: a date, a count, an owner
//       <div data-part="actions">                  sits above the stretched link
import {
  createContext,
  isValidElement,
  use,
  useLayoutEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type Ref,
} from 'react';
import { Slot } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { usePointerGlow } from '../Card/pointerGlow';

export type TileSize = Extract<Size, 'sm' | 'md'>;
export type TileHeadingLevel = 2 | 3 | 4 | 5 | 6;

interface TileContextValue {
  registerLink: () => () => void;
}

const TileContext = createContext<TileContextValue | null>(null);

export interface TileGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Renders the single child element (a ul of tiles) as the grid. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The grid that holds tiles. Columns fill the line from a minimum width
 * (two space.12xl steps, 4 or 5 columns on a laptop); the 1px gap shows the
 * parent surface.
 */
export function TileGrid({ asChild = false, ...rest }: TileGridProps) {
  const Root = asChild ? Slot.Root : 'div';
  return <Root {...rest} data-ds="tile-grid" />;
}

export interface TileProps extends HTMLAttributes<HTMLDivElement> {
  /** Inner padding and type size: sm or md. Default md. */
  size?: TileSize;
  /** Draws a 2px ring inside the tile (not color alone). Say it in words too, with aria-current on the link. Default false. */
  selected?: boolean;
  /** Renders the single child element (an li in a ul grid) as the tile. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** One tile. Marks itself `data-interactive` when a TileLink is inside it. */
export function Tile({ size = 'md', selected = false, asChild = false, children, ...rest }: TileProps) {
  const [links, setLinks] = useState(0);
  const context = useMemo<TileContextValue>(
    () => ({
      registerLink: () => {
        setLinks((n) => n + 1);
        return () => setLinks((n) => n - 1);
      },
    }),
    [],
  );
  const Root = asChild ? Slot.Root : 'div';
  const interactive = links > 0;
  const { glow, onPointerMove } = usePointerGlow<HTMLDivElement>('tile', 'card-lift', rest.onPointerMove);
  return (
    <TileContext value={context}>
      <Root
        {...rest}
        onPointerMove={interactive ? onPointerMove : rest.onPointerMove}
        data-ds="tile"
        data-size={size}
        data-interactive={links > 0 ? '' : undefined}
        data-selected={selected ? '' : undefined}
      >
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {/* card-lift: the decorative highlight that follows the pointer (pointerGlow.ts). Not with asChild: the child owns its children. */}
            {interactive && <span aria-hidden="true" ref={glow} />}
          </>
        )}
      </Root>
    </TileContext>
  );
}

export interface TilePartProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** A thumbnail or a preview. It bleeds to the tile's edges. */
export function TileMedia(props: TilePartProps) {
  return <div {...props} data-part="media" />;
}

export interface TileTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The heading level, so the tile fits the outline of its page. Default 3. */
  level?: TileHeadingLevel;
  ref?: Ref<HTMLHeadingElement>;
}

/** The tile's name, as a heading. Wraps to two lines, then ends in an ellipsis; the link keeps the full name. */
export function TileTitle({ level = 3, ...rest }: TileTitleProps) {
  const Heading = `h${level}` as const;
  return <Heading {...rest} data-part="title" />;
}

export interface TileLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Renders the single child element (a router link) as the link. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

/** The one real link of the tile. Its target is stretched over the tile and the title text is its name. */
export function TileLink({ asChild = false, children, ...rest }: TileLinkProps) {
  const register = use(TileContext)?.registerLink;
  useLayoutEffect(() => register?.(), [register]);
  if (asChild) {
    if (!isValidElement(children)) throw new Error('TileLink with asChild needs one element as its child.');
    return (
      <Slot.Root {...rest} data-part="link">
        {children}
      </Slot.Root>
    );
  }
  return (
    <a {...rest} data-part="link">
      {children}
    </a>
  );
}

export interface TileMetaProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

/** One muted line under the title: a date, a count, an owner. */
export function TileMeta(props: TileMetaProps) {
  return <p {...props} data-part="meta" />;
}

/** One or two icon buttons at the end of the title row. They sit above the stretched link. */
export function TileActions(props: TilePartProps) {
  return <div {...props} data-part="actions" />;
}
