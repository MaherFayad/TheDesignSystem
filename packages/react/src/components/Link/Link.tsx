'use client';
// Link: navigation to another page or place, in running text or standing
// alone. A native <a>, or with asChild the child element (a router link)
// through Radix Slot.
//
// Sources: GoBanana `.st-alert a` in banana-server/styles/studio-components.css
// (color inherits, always underlined), `SiteNav.tsx` (plain anchors and
// router links side by side).
//
// Decisions:
// - The underline is always drawn, at rest and on hover, so a link in a
//   sentence never relies on color alone (WCAG 1.4.1). Hover thickens it.
// - A link in a sentence keeps the line height of the text: the inline
//   target exception of WCAG 2.5.8 covers it. `standalone` makes a link that
//   sits on its own line a 24px target.
// - Disabled drops the href (nothing can open it), keeps role link and stays
//   in the tab order with aria-disabled, so a Tooltip can say why. The same
//   rule as Button.
import {
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Slot } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Size, Tone } from '@the-system/shared';
import { useTheme } from '../../theme';

export type LinkTone = Extract<Tone, 'neutral' | 'accent'>;
export type LinkSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** What the hidden text after an external link says, per language. */
const externalLabels = { en: 'opens in a new tab', ar: 'يفتح في تبويب جديد' } as const;

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  /** The link text. Name the place: "Read the pricing guide", never "Click here". */
  children?: ReactNode;
  /** neutral reads as text-link, accent takes the primary color on a surface. Default neutral. */
  tone?: LinkTone;
  /**
   * Font size from the font.size tokens: xs, sm (s), md (m), lg (l). Default
   * none: the link inherits the size of the text around it.
   */
  size?: LinkSize;
  /**
   * Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and
   * shows the external icon in the `end` part, with a visually hidden
   * "opens in a new tab". Default false.
   */
  external?: boolean;
  /** The hidden words after an external link. Default "opens in a new tab", in Arabic "يفتح في تبويب جديد". */
  externalLabel?: string;
  /**
   * A link on its own line, not in a sentence: it becomes at least 24px tall
   * (WCAG 2.5.8). Default false. Sets data-standalone.
   */
  standalone?: boolean;
  /**
   * The link cannot be followed: no href, aria-disabled and data-disabled,
   * still focusable so a Tooltip can say why. Default false.
   */
  disabled?: boolean;
  /** Renders the single child element (a router link) as the link. Default false. */
  asChild?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * A text link, always underlined. In running text it inherits the font size
 * and line height of the sentence; `standalone` makes it a 24px target.
 */
export function Link({
  tone = 'neutral',
  size,
  external = false,
  externalLabel,
  standalone = false,
  disabled = false,
  asChild = false,
  href,
  target,
  rel,
  children,
  onClick,
  onAuxClick,
  onKeyDown,
  ref,
  ...rest
}: LinkProps) {
  const { lang } = useTheme();
  const ar = lang.toLowerCase().startsWith('ar');
  // A comma before the hidden words, so they read as a pause after the link text: "Open the docs, opens in a new tab".
  const hidden = `${ar ? '،' : ','} ${externalLabel ?? externalLabels[ar ? 'ar' : 'en']}`;

  const attrs = {
    ...rest,
    ref,
    href: disabled ? undefined : href,
    target: external && !disabled ? (target ?? '_blank') : target,
    rel: external && !disabled ? (rel ?? 'noopener noreferrer') : rel,
    // Without href an <a> has no role and no tab stop: give both back.
    role: disabled ? (rest.role ?? 'link') : rest.role,
    tabIndex: disabled ? (rest.tabIndex ?? 0) : rest.tabIndex,
    'data-ds': 'link',
    'data-tone': tone,
    'data-size': size,
    'data-standalone': standalone ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'aria-disabled': disabled ? true : rest['aria-disabled'],
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onAuxClick?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (!disabled) onKeyDown?.(event);
    },
  };

  const render = (content: ReactNode) => (
    <>
      <span data-part="label">{content}</span>
      {external && (
        <span data-part="end">
          <Icon name="external" size="sm" />
          <span>{hidden}</span>
        </span>
      )}
    </>
  );

  if (asChild) {
    if (!isValidElement<{ href?: string }>(children)) {
      throw new Error('Link with asChild needs one element as its child.');
    }
    const child = disabled && children.props.href !== undefined ? cloneElement(children, { href: undefined }) : children;
    return (
      <Slot.Root {...attrs}>
        <Slot.Slottable child={child}>{(content: ReactNode) => render(content)}</Slot.Slottable>
      </Slot.Root>
    );
  }

  return <a {...attrs}>{render(children)}</a>;
}
