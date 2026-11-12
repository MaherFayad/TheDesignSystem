'use client';
// SkipLink: the first focusable link of a page. Hidden until it takes
// keyboard focus, then drawn at the block start of the page. Enter moves
// focus to the target (`#main` by default), so a keyboard user skips the
// header and navigation (WCAG 2.4.1 Bypass blocks).
//
// Sources: GoBanana `banana-server/app/(site)/site.css` lines 77 to 100 and
// `[locale]/layout.tsx` were not reachable from this session. The look comes
// from the Button soft fill and the Link focus ring.
//
// Decisions:
// - The target is the `href`, a fragment (`#main`). No second prop names it.
// - On activation the link moves focus to the target itself, not only the
//   scroll position. A target that is not focusable gets `tabindex="-1"`
//   first, and only then (a link, a button or an element with its own
//   tabindex keeps what it has).
// - The URL fragment still changes, so the back button, hashchange, :target
//   and a shared link behave as a plain fragment link.
// - A click with a modifier key or a middle click is left to the browser, so
//   open in a new tab still works.
// - Position absolute: placed first in `body` it sits at the top of the page.
//   A consumer that wants it fixed sets that from its own CSS.
import { type AnchorHTMLAttributes, type MouseEvent, type ReactNode, type Ref } from 'react';
import { useTheme } from '../../theme';

/** The default visible text, per language. */
const defaultLabels = { en: 'Skip to main content', ar: 'الانتقال للمحتوى الرئيسي' } as const;

/** No `title`: hints come from Tooltip, never the native title attribute. */
export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> {
  /** The fragment of the element to jump to. Default "#main". */
  href?: string;
  /** The visible text. Default "Skip to main content", in Arabic "الانتقال للمحتوى الرئيسي". */
  children?: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}


/** Moves focus to the element a fragment names. Returns false when there is none. */
export function focusFragment(href: string, doc: Document = document): boolean {
  if (!href.startsWith('#') || href.length < 2) return false;
  let id: string;
  try {
    id = decodeURIComponent(href.slice(1));
  } catch {
    id = href.slice(1);
  }
  const target = doc.getElementById(id);
  if (!target) return false;
  // Try the element as it is first: a link, a field or an element with its own tabindex keeps what it has.
  target.focus();
  if (doc.activeElement === target) return true;
  // Not focusable (a region, an anchor with no href, a disabled control): make it a script focus target.
  target.setAttribute('tabindex', '-1');
  target.focus();
  return doc.activeElement === target;
}

/** A link that is drawn only while it has focus, and moves focus to the main content. */
export function SkipLink({ href = '#main', children, onClick, ref, ...rest }: SkipLinkProps) {
  const { lang } = useTheme();
  return (
    <a
      {...rest}
      ref={ref}
      href={href}
      data-ds="skip-link"
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!focusFragment(href, event.currentTarget.ownerDocument)) return;
        event.preventDefault();
        const view = event.currentTarget.ownerDocument.defaultView;
        // After focus, so hashchange and :target fire; the browser scrolls to the same element.
        if (view && view.location.hash !== href) view.location.hash = href;
      }}
    >
      {children ?? defaultLabels[lang === 'ar' ? 'ar' : 'en']}
    </a>
  );
}
