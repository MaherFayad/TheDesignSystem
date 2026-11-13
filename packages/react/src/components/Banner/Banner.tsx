'use client';
// Banner: a page wide notice at the top of the app (maintenance, a trial
// that ends). Hand built. No source: designed from the dials table in
// PLAN.md section 3.7 and the Alert in this repo.
//
// Anatomy: root [data-ds=banner] with data-tone, data-emphasis and
// data-sticky, and the parts icon, body, actions and close. The root is a
// region (a section) named by `label`. close is a CloseButton carrying
// data-part="close".
//
// Dismiss: the banner never hides itself and stores nothing. The close
// button moves focus to the start of the main content and then calls
// onDismiss; the consumer removes the banner and remembers the choice.
//
// Sticky: the banner sticks to the top of its scroll container and sets
// that container's scroll-padding-block-start to its own height, so a
// focused element or an anchor target is never hidden under it (WCAG
// 2.4.11). The previous value comes back when the banner unmounts or stops
// being sticky.
import { useLayoutEffect, useRef, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import { dismissWithExit } from '@the-system/motion';
import type { IconName } from '@the-system/icons';
import type { Emphasis, Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useMotion } from '../../internal/motion';
import { CloseButton } from '../CloseButton';
import { messageIcons, wordsFor } from '../Alert/messageTones';

export type BannerTone = Tone;
export type BannerEmphasis = Extract<Emphasis, 'soft' | 'solid'>;

/** Default words of the banner chrome, by language. */
export const bannerLabels = {
  en: {
    region: 'Announcement',
    close: 'Dismiss announcement',
    tone: { neutral: 'Notice', accent: 'Notice', info: 'Information', success: 'Success', warning: 'Warning', danger: 'Error' },
  },
  ar: {
    region: 'إعلان',
    close: 'إغلاق الإعلان',
    tone: { neutral: 'إشعار', accent: 'إشعار', info: 'معلومة', success: 'نجاح', warning: 'تنبيه', danger: 'خطأ' },
  },
} as const;

/** Where focus goes when the banner is dismissed: the start of the main content. */
const MAIN_SELECTOR = 'main, [role="main"]';

export interface BannerProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'role'> {
  /** The color, the icon and the tone word. Default neutral. */
  tone?: BannerTone;
  /** soft is a tinted bar, solid a full tone fill. Default soft. */
  emphasis?: BannerEmphasis;
  /** The notice: one or two sentences, links allowed. */
  children: ReactNode;
  /** Up to two Buttons, size sm. */
  actions?: ReactNode;
  /** The name of the region. Default "Announcement", or Arabic under lang ar. */
  label?: string;
  /** A system icon name or a node in place of the tone icon. */
  icon?: IconName | ReactElement;
  /** The word the icon says. Default the tone word in the page language. */
  toneLabel?: string;
  /** Sticks to the top of its scroll container and reserves scroll padding for its height. Default false. */
  sticky?: boolean;
  /**
   * Renders the close button and is called by it, after focus has moved to
   * the start of the main content. The consumer removes the banner and
   * remembers the choice; the banner stores nothing.
   */
  onDismiss?: () => void;
  /** Where focus goes on dismiss: an element or a selector. Default the first main element. */
  returnFocus?: HTMLElement | string;
  /** The accessible name of the close button. Default "Dismiss announcement", or Arabic under lang ar. */
  closeLabel?: string;
  ref?: Ref<HTMLElement>;
}

/** The ancestor a sticky element sticks to: the nearest one whose block overflow is not visible, or the document's scrolling element. */
function scrollContainer(el: HTMLElement): HTMLElement {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow !== 'visible' && overflow !== 'clip' && overflow !== '') return node;
  }
  return (el.ownerDocument.scrollingElement as HTMLElement | null) ?? el.ownerDocument.documentElement;
}

/** Moves focus to the target, making it focusable by script when it is not. */
function focusTarget(doc: Document, target: HTMLElement | string | undefined) {
  let el: HTMLElement | null = null;
  try {
    el = typeof target === 'string' || target === undefined ? doc.querySelector<HTMLElement>(target ?? MAIN_SELECTOR) : target;
  } catch {
    // An invalid selector: focus stays where it is, and onDismiss still runs.
    el = null;
  }
  if (!el) return;
  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus();
}

/** A page wide notice at the top of the app. */
export function Banner({
  tone = 'neutral',
  emphasis = 'soft',
  children,
  actions,
  label,
  icon,
  toneLabel,
  sticky = false,
  onDismiss,
  returnFocus,
  closeLabel,
  lang,
  ref,
  ...rest
}: BannerProps) {
  const theme = useTheme();
  const words = wordsFor(bannerLabels, lang ?? theme.lang);
  // An empty toneLabel falls back to the tone word: the icon always has a name.
  const word = toneLabel || words.tone[tone];
  const own = useRef<HTMLElement | null>(null);
  const motion = useMotion();

  // Layout effect: the padding is in place before the first paint.
  useLayoutEffect(() => {
    const el = own.current;
    if (!sticky || !el) return;
    const container = scrollContainer(el);
    const previous = container.style.scrollPaddingBlockStart;
    const apply = () => {
      container.style.scrollPaddingBlockStart = `${el.getBoundingClientRect().height}px`;
    };
    apply();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(apply);
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      container.style.scrollPaddingBlockStart = previous;
    };
  }, [sticky]);

  const setRef = (node: HTMLElement | null) => {
    own.current = node;
    if (typeof ref === 'function') return ref(node);
    if (ref) ref.current = node;
  };

  return (
    <section
      {...rest}
      ref={setRef}
      lang={lang}
      aria-label={rest['aria-labelledby'] !== undefined ? undefined : (label ?? rest['aria-label'] ?? words.region)}
      data-ds="banner"
      data-tone={tone}
      data-emphasis={emphasis}
      data-sticky={sticky ? '' : undefined}
    >
      {icon === undefined || typeof icon === 'string' ? (
        <span data-part="icon">
          <Icon name={icon ?? messageIcons[tone]} size="md" label={word} />
        </span>
      ) : (
        <span data-part="icon" role="img" aria-label={word}>
          {icon}
        </span>
      )}
      <div data-part="body">{children}</div>
      {actions !== undefined && actions !== null && <div data-part="actions">{actions}</div>}
      {onDismiss && (
        <CloseButton
          data-part="close"
          label={closeLabel ?? words.close}
          size="xs"
          onClick={(event) => {
            focusTarget(event.currentTarget.ownerDocument, returnFocus);
            // alert-dismiss (order 1.22): the banner goes at once; a ghost of it shrinks away while the page slides up.
            dismissWithExit(own.current, motion.mode('alert-dismiss'), onDismiss);
          }}
        />
      )}
    </section>
  );
}
