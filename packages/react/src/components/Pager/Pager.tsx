'use client';
// Pager (order C5, item 8, proposed): a short line of full width pages a
// person swipes between, such as the screens of an onboarding. The pages
// sit side by side in a scroll container with scroll snap, so the swipe,
// its speed and its rubber band are the browser's own, with no animation
// library; the dots of Pagination are wired to it.
//
// The DOM:
//
//   <div data-ds="pager">
//     <div data-part="viewport" role="region" aria-label tabindex="0">     scroll snap container, the keyboard stop
//       <div data-part="page" role="group" aria-roledescription="page" aria-label="1 of 3" data-active>
//       <div data-part="page" role="group" aria-roledescription="page" aria-label="2 of 3" inert>
//     <nav data-ds="pagination" data-part="dots" data-variant="dots">       Pagination with variant dots
//
// Decisions:
// - Each page is a group whose role description is the word page in the
//   Pager's language (Arabic: صفحة) and whose name is its place, 2 of 3
//   (Arabic: 2 من 3), so a reader says "2 of 3, page" (WCAG 1.3.1, 4.1.2).
// - Only the current page is in the accessibility tree and the tab order:
//   the others are inert, so Tab never lands on a page that is out of view
//   (2.4.7, 2.4.11), as the carousel pattern hides the slides not shown.
// - The viewport is one Tab stop, named by `label`. On it, Left and Right go
//   to the previous and next page, mirrored in right to left; Page Up and
//   Page Down go back and forward; Home and End go to the first and last
//   page. Keys from a control inside a page stay with that control. The dots
//   are a second path with their own keys (2.5.7: every swipe has a path
//   with no drag). When the page changes while focus is in the page that
//   leaves (a swipe), focus moves to the viewport, never to the body.
// - Right to left: the row of pages follows the reading direction, so the
//   first page is at the right and a swipe to the right goes back, as the
//   person reads. The scroll position is read as a distance from the start,
//   whatever sign the browser gives it.
// - The page changes when the scroll settles (scrollend, or a short pause
//   where the event is missing), never in the middle of a swipe. A change
//   from the dots, the keys or the `page` prop scrolls to the page: smoothly,
//   or at once under reduced motion (the media query, or data-motion="reduce"
//   on the page), and at once on the first render.
// - No live region by default (anatomy rule 13): `live` makes the viewport
//   polite, for a pager that changes on its own.
// - Never measured during render: the server render and the first client
//   render show page `page` with no scroll position, and the scroll is set
//   in a layout effect.
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { prefersReducedMotion } from '@the-system/motion';
import { useTheme } from '../../theme';
import { useControllable } from '../../internal/useControllable';
import { Pagination } from '../Pagination';

const digits = new Intl.NumberFormat('en-US');
const n = (value: number) => digits.format(value);

/** Built in words, in the Pager's language (anatomy rule 14). */
export const pagerLabels = {
  en: { page: 'page', of: (p: number, t: number) => `${n(p)} of ${n(t)}`, dots: 'Pages' },
  ar: { page: 'صفحة', of: (p: number, t: number) => `${n(p)} من ${n(t)}`, dots: 'الصفحات' },
} as const;

const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

/** The pause after the last scroll event that counts as settled where scrollend is missing, in ms. */
const SETTLE_MS = 120;

interface PageContextValue {
  index: number;
  count: number;
  active: boolean;
  words: (typeof pagerLabels)['en'] | (typeof pagerLabels)['ar'];
}

const PageContext = createContext<PageContextValue | null>(null);

export interface PagerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'defaultValue' | 'onChange'> {
  /** The name of the pages as a whole, the viewport's accessible name: Introduction (Arabic: المقدمة). Required. */
  label: string;
  /** The current page, from 1, controlled with onPageChange. */
  page?: number;
  /** The page it opens at, from 1. Default 1. */
  defaultPage?: number;
  /** Called with the page, from 1, after a swipe settles, a key, a press on a dot. */
  onPageChange?: (page: number) => void;
  /** Draws the dots of Pagination under the pages. Default true. */
  dots?: boolean;
  /** The name of the dots: what the pages are (Introduction pages). Default Pages (Arabic: الصفحات). */
  dotsLabel?: string;
  /** Makes the viewport a polite live region, for pages that change on their own. Default false. */
  live?: boolean;
  /** PagerPage elements, one per page. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** The distance scrolled from the inline start, whatever the sign the browser gives in right to left. */
const scrolled = (el: HTMLElement) => Math.abs(el.scrollLeft);

/** The page, from 1, the viewport rests on; null where there is no layout (a test DOM). */
function restingPage(el: HTMLElement, count: number): number | null {
  const width = el.clientWidth;
  if (!width) return null;
  return Math.min(count, Math.max(1, Math.round(scrolled(el) / width) + 1));
}

/** Scrolls the viewport so that page `page` (from 1) fills it. */
function scrollToPage(el: HTMLElement, page: number, smooth: boolean): void {
  const target = el.querySelectorAll<HTMLElement>(':scope > [data-part="page"]')[page - 1];
  if (!target || !el.clientWidth) return;
  const delta = target.getBoundingClientRect().left - el.getBoundingClientRect().left;
  if (Math.abs(delta) < 1) return;
  const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? 'smooth' : 'instant';
  if (typeof el.scrollBy === 'function') el.scrollBy({ left: delta, behavior });
  else el.scrollLeft += delta;
}

/** Pages a person swipes between, with scroll snap, keys and the dots of Pagination. */
export function Pager({
  label,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  dots = true,
  dotsLabel,
  live = false,
  children,
  ref,
  ...rest
}: PagerProps) {
  const { lang, dir } = useTheme();
  const words = isArabic(rest.lang ?? lang) ? pagerLabels.ar : pagerLabels.en;
  const pages = Children.toArray(children).filter(isValidElement);
  const count = Math.max(1, pages.length);
  const [rawPage, setPage] = useControllable(pageProp, defaultPage, onPageChange);
  const current = Math.min(count, Math.max(1, Math.round(Number.isFinite(rawPage) ? rawPage : 1)));
  const viewport = useRef<HTMLDivElement | null>(null);
  /** The page the viewport rests on, so a settle on the page shown sets nothing. */
  const resting = useRef<number | null>(null);
  const first = useRef(true);
  const rtl = (rest.dir ?? dir) === 'rtl';

  // A change from outside the scroll (the prop, a dot, a key): scroll there. At once on the first render.
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    if (resting.current !== current) scrollToPage(el, current, !first.current);
    resting.current = current;
    first.current = false;
    // Focus in a page that just turned inert would fall to the body: keep it on the viewport.
    const active = el.ownerDocument.activeElement;
    const page = active instanceof Element ? active.closest('[data-part="page"]') : null;
    if (page && el.contains(page) && !page.hasAttribute('data-active')) el.focus({ preventScroll: true });
  }, [current]);

  // A swipe: the page changes when the scroll settles.
  const settle = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const at = restingPage(el, count);
    if (at === null || at === resting.current) return;
    resting.current = at;
    setPage(at);
  }, [count, setPage]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return undefined;
    const view = el.ownerDocument.defaultView;
    const hasScrollEnd = view !== null && 'onscrollend' in view;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (hasScrollEnd) return;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(settle, SETTLE_MS);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    if (hasScrollEnd) el.addEventListener('scrollend', settle);
    // A turn of the device changes the page width: keep the current page in view.
    const onResize = () => {
      if (resting.current !== null) scrollToPage(el, resting.current, false);
    };
    view?.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', settle);
      view?.removeEventListener('resize', onResize);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [settle]);

  const go = (to: number) => setPage(Math.min(count, Math.max(1, to)));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    // Only on the viewport itself: a key from a control inside a page stays with it, and a page
    // change never leaves focus in a page that turns inert.
    if (event.target !== viewport.current) return;
    const next: Record<string, number> = {
      ArrowRight: rtl ? current - 1 : current + 1,
      ArrowLeft: rtl ? current + 1 : current - 1,
      PageDown: current + 1,
      PageUp: current - 1,
      Home: 1,
      End: count,
    };
    const to = next[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  };

  return (
    <div {...rest} ref={ref} data-ds="pager" onKeyDown={onKeyDown}>
      <div
        ref={viewport}
        data-part="viewport"
        role="region"
        aria-label={label}
        tabIndex={0}
        aria-live={live ? 'polite' : undefined}
        aria-atomic={live ? 'false' : undefined}
      >
        {pages.map((child, i) => (
          <PageContext key={child.key ?? i} value={{ index: i + 1, count, active: i + 1 === current, words }}>
            {child}
          </PageContext>
        ))}
      </div>
      {dots && count > 1 && (
        <Pagination data-part="dots" variant="dots" pageCount={count} page={current} onPageChange={go} label={dotsLabel ?? words.dots} />
      )}
    </div>
  );
}

export interface PagerPageProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** One page of a Pager. Put it as a direct child of Pager. */
export function PagerPage({ children, ref, ...rest }: PagerPageProps) {
  const ctx = use(PageContext);
  if (!ctx) throw new Error('PagerPage must be used inside a Pager.');
  return (
    <div
      {...rest}
      ref={ref}
      data-part="page"
      role="group"
      aria-roledescription={ctx.words.page}
      aria-label={ctx.words.of(ctx.index, ctx.count)}
      data-active={ctx.active ? '' : undefined}
      inert={!ctx.active}
    >
      {children}
    </div>
  );
}
