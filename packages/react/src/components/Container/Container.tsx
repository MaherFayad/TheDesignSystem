// Container: the centered max width wrapper with the page gutter. It caps the
// inline size of its content, centers it with logical margins, and keeps a
// gutter on both inline sides, 16px on phones in the default density.
//
// Source: GoBanana site `landing.css` page widths could not be read in this
// session; the widths follow the breakpoint tokens (sm phone, md tablet, lg
// desktop) until the token build has a size.container scale.
//
// The width prop is called `width`, not `size`: `size` is the shared control
// axis (xs to lg) and its words may not mean a page width.
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import type { SpaceStep } from '@the-system/shared';

export type ContainerWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ContainerElement = 'div' | 'main' | 'section' | 'article' | 'header' | 'footer';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** The max inline size: sm 30rem, md 48rem, lg 68.75rem, xl about 84rem, full no cap. Default lg. */
  width?: ContainerWidth;
  /** The space on both inline sides, a `space.*` step. Default 3xl: 16px on phones in the default density. */
  gutter?: SpaceStep;
  /** The element to render. Default div. Use main only once per page. */
  as?: ContainerElement;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

/** Centers its content at a max width with a gutter on both sides. */
export function Container({ width = 'lg', gutter = '3xl', as: Element = 'div', ref, children, ...rest }: ContainerProps) {
  const attrs = { ...rest, ref, 'data-ds': 'container', 'data-width': width, 'data-gutter': gutter };
  const Tag = Element as 'div';
  return <Tag {...(attrs as HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> })}>{children}</Tag>;
}
