// Stack: one dimension layout with a token gap. A flex box that runs on the
// block axis (a column) or the inline axis (a row), in logical words only, so
// a row starts on the right in Arabic with no extra prop.
//
// Source: Figma-Killer-2 `src/ui/components/Stack/` (direction, gap, align,
// justify, wrap). Changed here: the gap is a space token step, not a number of
// px; directions are logical (block, inline), not row and column; the values
// travel as data attributes so the shared CSS can style them in every
// framework; FK2 `height` is left out (a layout escape hatch that belongs to
// the caller's own CSS).
import { Slot } from 'radix-ui';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import type { SpaceStep } from './space';

export type StackDirection = 'block' | 'inline';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
/** Elements a Stack may render as. A list (ul, ol) keeps its list semantics. */
export type StackElement =
  | 'div'
  | 'span'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'main'
  | 'form'
  | 'fieldset'
  | 'ul'
  | 'ol';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** block: children run top to bottom (a column). inline: along the line, start to end (a row). Default block. */
  direction?: StackDirection;
  /** Space between children, a `space.*` step. Default s. */
  gap?: SpaceStep;
  /** Cross axis alignment of the children. Default stretch, the flex default. */
  align?: StackAlign;
  /** Main axis distribution of the children. Default start. */
  justify?: StackJustify;
  /** Lets children wrap onto more lines. Default false. */
  wrap?: boolean;
  /** The element to render. Default div. */
  as?: StackElement;
  /** Renders the single child element as the Stack, through Radix Slot. Wins over `as`. */
  asChild?: boolean;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}

/**
 * Lays its children out in one direction with a token gap. Not interactive
 * and no role of its own: pick `as` for semantics (ul for a list, nav for a
 * group of links).
 */
export function Stack({
  direction = 'block',
  gap = 's',
  align,
  justify,
  wrap = false,
  as: Element = 'div',
  asChild = false,
  ref,
  children,
  ...rest
}: StackProps) {
  // Bullets are removed in CSS, and Safari then drops the list role: say it in markup.
  const listRole = !asChild && (Element === 'ul' || Element === 'ol') ? 'list' : undefined;
  const attrs = {
    role: listRole,
    ...rest,
    ref,
    'data-ds': 'stack',
    'data-orientation': direction === 'inline' ? 'horizontal' : 'vertical',
    'data-gap': gap,
    'data-align': align,
    'data-justify': justify,
    'data-wrap': wrap ? '' : undefined,
  };
  if (asChild) return <Slot.Root {...attrs}>{children}</Slot.Root>;
  // A union of intrinsic tags with one ref type: the cast keeps the ref prop
  // typed as HTMLElement for every element in the list.
  const Tag = Element as 'div';
  return <Tag {...(attrs as HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> })}>{children}</Tag>;
}
