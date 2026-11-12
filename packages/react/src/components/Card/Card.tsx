'use client';
// Card: a container for one item, with optional media, a header (title and
// description), a body, a footer and actions.
//
// Sources: Figma-Killer-2 `Card/` (surface, hairline border, panel radius)
// and `Widget/` (title row, a lift of the surface tone on hover). GoBanana
// could not be read in this session; the Studio and Desk looks come from the
// dials table in PLAN.md section 3.7 and the tokens.
//
//   <div data-ds="card" data-emphasis data-size [data-interactive] [data-selected] [data-disabled]>
//     <div data-part="media">                      optional, bleeds to the edges when first
//     <div data-part="header">
//       <h3 data-part="title"><a data-part="link"> the one real link, its target stretched over the card
//       <p data-part="description">
//     <div data-part="body">
//     <div data-part="footer">
//       <div data-part="actions">                  sits above the stretched link, so it stays clickable
//
// A whole card link is one real <a> inside the title. Its ::before covers the
// card, so a click anywhere opens the link, while buttons in `actions` sit
// above that layer and keep their own target. Nothing interactive is ever
// nested inside the link. The card marks itself `data-interactive` when a
// CardLink is inside it.
import {
  createContext,
  isValidElement,
  cloneElement,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { Slot } from 'radix-ui';
import type { Emphasis, Size } from '@the-system/shared';

export type CardSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type CardEmphasis = Extract<Emphasis, 'outline' | 'soft' | 'solid'>;
export type CardHeadingLevel = 2 | 3 | 4 | 5 | 6;

interface CardContextValue {
  disabled: boolean;
  registerLink: () => () => void;
}

const CardContext = createContext<CardContextValue | null>(null);

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * How the card stands off its surface. outline: a hairline border on the
   * surface. soft: a filled tone step, no border. solid: raised, with the
   * style's panel elevation. Default outline.
   */
  emphasis?: CardEmphasis;
  /** Inner padding and the gap between parts: sm, md, lg. Default md. */
  size?: CardSize;
  /**
   * Draws the card as chosen: a 2px ring, not color alone. Say it in words
   * too, with a checkbox in the card or aria-current on its link. Default false.
   */
  selected?: boolean;
  /** Mutes the title, dims the media and removes the href of its CardLink. Text stays readable. Disable the actions yourself. Default false. */
  disabled?: boolean;
  /** Renders the single child element (an li, an article) as the card root. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** The card root. Stamps the axes and the states, and tells its CardLink about them. */
export function Card({
  emphasis = 'outline',
  size = 'md',
  selected = false,
  disabled = false,
  asChild = false,
  children,
  ...rest
}: CardProps) {
  const [links, setLinks] = useState(0);
  // Stable, so a change of disabled does not unregister and register the link again.
  const registerLink = useCallback(() => {
    setLinks((n) => n + 1);
    return () => setLinks((n) => n - 1);
  }, []);
  const context = useMemo<CardContextValue>(() => ({ disabled, registerLink }), [disabled, registerLink]);
  const Root = asChild ? Slot.Root : 'div';
  return (
    <CardContext value={context}>
      <Root
        {...rest}
        data-ds="card"
        data-emphasis={emphasis}
        data-size={size}
        data-interactive={links > 0 ? '' : undefined}
        data-selected={selected ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        {children}
      </Root>
    </CardContext>
  );
}

export interface CardPartProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** An image, a video or a preview. As the first part it bleeds to the card's edges and takes its top corners. */
export function CardMedia(props: CardPartProps) {
  return <div {...props} data-part="media" />;
}

/** Holds the title and the description. */
export function CardHeader(props: CardPartProps) {
  return <div {...props} data-part="header" />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The heading level, so the card fits the outline of its page. Default 3. */
  level?: CardHeadingLevel;
  ref?: Ref<HTMLHeadingElement>;
}

/** The card's name, as a heading. Put a CardLink inside it to make the whole card a link. */
export function CardTitle({ level = 3, ...rest }: CardTitleProps) {
  const Heading = `h${level}` as const;
  return <Heading {...rest} data-part="title" />;
}

export interface CardLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Renders the single child element (a router link) as the link. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * The one real link of a whole card link. Its target is stretched over the
 * card, and its text (the title) is its name. While the card is disabled the
 * href is removed, aria-disabled is set, role stays link and the link stays
 * in the tab order (tabIndex 0), so a person can still reach it and hear why.
 * A click does nothing.
 */
export function CardLink({ asChild = false, children, href, onClick, ...rest }: CardLinkProps) {
  const card = use(CardContext);
  const register = card?.registerLink;
  useLayoutEffect(() => register?.(), [register]);
  const disabled = card?.disabled ?? false;
  const attrs = {
    ...rest,
    'data-part': 'link',
    'aria-disabled': disabled ? true : rest['aria-disabled'],
    role: disabled ? (rest.role ?? 'link') : rest.role,
    tabIndex: disabled ? (rest.tabIndex ?? 0) : rest.tabIndex,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
  };
  if (asChild) {
    if (!isValidElement<{ href?: string }>(children)) {
      throw new Error('CardLink with asChild needs one element as its child.');
    }
    const child = disabled ? cloneElement(children as ReactElement<{ href?: string }>, { href: undefined }) : children;
    return <Slot.Root {...attrs}>{child}</Slot.Root>;
  }
  return (
    <a {...attrs} href={disabled ? undefined : href}>
      {children}
    </a>
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

/** One or two lines under the title, in the muted text color. */
export function CardDescription(props: CardDescriptionProps) {
  return <p {...props} data-part="description" />;
}

/** The main content of the card. */
export function CardBody(props: CardPartProps) {
  return <div {...props} data-part="body" />;
}

/** The bottom row: meta text at the start, actions at the end. */
export function CardFooter(props: CardPartProps) {
  return <div {...props} data-part="footer" />;
}

/** Buttons for the card's item. They sit above the stretched link and keep their own targets. */
export function CardActions(props: CardPartProps) {
  return <div {...props} data-part="actions" />;
}
