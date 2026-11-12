'use client';
// TableOfContents: links to the headings of a long page, with the section
// the reader is in marked as they scroll.
//
// Source: GoBanana site `AnchorScroll.tsx` (smooth scroll, focus to the
// target, a jump under reduced motion) was not reachable from this session;
// the behavior follows its description in the work order.
//
// The DOM:
//
//   <nav data-ds="table-of-contents" aria-labelledby data-size data-sticky?>
//     <p data-part="title" id>On this page</p>
//     <ol data-part="list">
//       <li data-part="item" data-level="1" data-active?>
//         <a data-part="link" href="#id" aria-current="location"?>
//         <ol data-part="list"> ... nested items, data-level 2
//     <span data-part="indicator" aria-hidden="true">       the bar beside the active link
//
// Decisions:
// - The title is a p, not a heading, so the list does not add a heading to
//   the page outline. The nav is named by it through aria-labelledby.
// - Links are plain anchors styled here, not system Links: a list of section
//   links in a nav reads as navigation without the underline Link always
//   draws in running text. The active link is marked by weight, the
//   indicator bar and aria-current="location", never color alone.
// - The active section comes from activeHeading in @the-system/shared. An
//   IntersectionObserver on the headings tells the component when to measure
//   again, so nothing runs on every scroll frame.
// - Enter or a click scrolls to the heading (smooth, or a jump under reduced
//   motion), moves focus to it (tabindex -1 only when it is not focusable)
//   and sets the URL fragment without a second jump.
// - The indicator moves with transform only (pattern "tab-indicator"); its
//   length is set at once. Under reduced motion the duration token is 0ms.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { activeHeading, buildTree, type TocHeading, type TocNode, type Size } from '@the-system/shared';
import { useTheme } from '../../theme';

export type TableOfContentsSize = Extract<Size, 'sm' | 'md'>;
export type { TocHeading };

const words = { en: 'On this page', ar: 'محتوى الصفحة' } as const;

/** Sets a ref of any kind. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** No `title` attribute: hints come from Tooltip. The `title` prop is the visible heading text. */
export interface TableOfContentsProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** The headings of the page in document order: { id, label, level }. Levels nest. */
  items: readonly TocHeading[];
  /** The visible title, which also names the nav. Default "On this page", in Arabic "محتوى الصفحة". false hides it; then pass aria-label. */
  title?: ReactNode | false;
  /** Type size: sm is font.size.xs, md font.size.s, one step up in Arabic. Default md. */
  size?: TableOfContentsSize;
  /** The height of a sticky header above the content, in px. A heading counts as reached when its top passes this line plus a fifth of the viewport, at most 64px. Default 0. */
  offset?: number;
  /** Keeps the list in view as the page scrolls (position sticky, scrolls inside when taller than the viewport). Default false. */
  sticky?: boolean;
  /** The active heading id, controlled. Default: tracked from the scroll position. */
  active?: string | null;
  /** Called when the active heading changes, from scrolling or a link. */
  onActiveChange?: (id: string | null) => void;
  ref?: Ref<HTMLElement>;
}

function prefersReducedMotion(view: Window | null): boolean {
  return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Scrolls to the heading, moves focus to it and sets the fragment. Returns false when it is missing. */
function jumpTo(id: string, doc: Document): boolean {
  const target = doc.getElementById(id);
  if (!target) return false;
  const view = doc.defaultView;
  target.scrollIntoView?.({ behavior: prefersReducedMotion(view) ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
  if (doc.activeElement !== target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  if (view && view.location.hash !== `#${id}`) view.history.pushState(null, '', `#${id}`);
  return true;
}

/** The list of a page's sections, marking the one in view. */
export function TableOfContents({
  items,
  title,
  size = 'md',
  offset = 0,
  sticky = false,
  active: activeProp,
  onActiveChange,
  ref,
  ...rest
}: TableOfContentsProps) {
  const { lang } = useTheme();
  const titleId = useId();
  const tree = useMemo(() => buildTree(items), [items]);
  const [tracked, setTracked] = useState<string | null>(items[0]?.id ?? null);
  const controlled = activeProp !== undefined;
  const active = controlled ? activeProp : tracked;
  const rootRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const changeRef = useRef(onActiveChange);
  useEffect(() => {
    changeRef.current = onActiveChange;
  });

  const lastRef = useRef<string | null>(tracked);
  const setActive = useCallback((id: string | null) => {
    if (lastRef.current === id) return;
    lastRef.current = id;
    setTracked(id);
    changeRef.current?.(id);
  }, []);

  const ids = useMemo(() => items.map((i) => i.id).join(' '), [items]);

  // Track the section in view. The observer only says "measure again"; activeHeading decides.
  useEffect(() => {
    const doc = rootRef.current?.ownerDocument;
    const view = doc?.defaultView;
    if (!doc || !view || typeof view.IntersectionObserver !== 'function') return;
    const headings = ids
      .split(' ')
      .map((id) => (id ? doc.getElementById(id) : null))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const scroller = doc.scrollingElement;
      const atEnd = scroller ? scroller.scrollTop > 0 && scroller.scrollTop + view.innerHeight >= scroller.scrollHeight - 2 : false;
      const rects = headings.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      // The reading line: the offset plus a fifth of the viewport (at most 64px), so a heading just scrolled to counts as reached.
      setActive(activeHeading(rects, offset + Math.min(64, Math.round(view.innerHeight / 5)), atEnd));
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(measure);
    };
    const observer = new view.IntersectionObserver(schedule, {
      rootMargin: `${-offset}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    for (const el of headings) observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame) view.cancelAnimationFrame(frame);
    };
  }, [ids, offset, setActive]);

  // Place the indicator beside the active link: transform moves it, block-size is set at once.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const bar = indicatorRef.current;
    if (!root || !bar) return;
    const link = active
      ? (Array.from(root.querySelectorAll<HTMLElement>("[data-part='link']")).find((a) => a.getAttribute('href') === `#${active}`) ?? null)
      : null;
    if (!link) {
      bar.style.setProperty('--_toc-indicator-size', '0px');
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    bar.style.setProperty('--_toc-indicator-offset', `${box.top - rootBox.top + root.scrollTop}px`);
    bar.style.setProperty('--_toc-indicator-size', `${box.height}px`);
  }, [active, tree]);

  const onLinkClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!jumpTo(id, event.currentTarget.ownerDocument)) return;
    event.preventDefault();
    setActive(id);
  };

  const renderList = (nodes: readonly TocNode[]): ReactNode => (
    <ol data-part="list">
      {nodes.map((node) => {
        const isActive = node.id === active;
        return (
          <li key={node.id} data-part="item" data-level={node.level} data-active={isActive ? '' : undefined}>
            <a
              data-part="link"
              href={`#${node.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={onLinkClick(node.id)}
            >
              {/* dir auto on the text only: the row keeps the page direction for its indent. */}
              <span dir="auto">{node.label}</span>
            </a>
            {node.children.length > 0 && renderList(node.children)}
          </li>
        );
      })}
    </ol>
  );

  const titleText = title === undefined ? words[lang === 'ar' ? 'ar' : 'en'] : title;

  return (
    <nav
      {...rest}
      ref={(node: HTMLElement | null) => {
        rootRef.current = node;
        assignRef(ref, node);
      }}
      data-ds="table-of-contents"
      data-size={size}
      data-sticky={sticky ? '' : undefined}
      aria-labelledby={titleText === false ? rest['aria-labelledby'] : titleId}
    >
      {titleText !== false && (
        <p data-part="title" id={titleId}>
          {titleText}
        </p>
      )}
      {tree.length > 0 && renderList(tree)}
      <span data-part="indicator" aria-hidden="true" ref={indicatorRef} />
    </nav>
  );
}
