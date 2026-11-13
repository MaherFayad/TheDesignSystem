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
//   and sets the URL fragment with history.pushState, so there is no second
//   jump (and no hashchange event). While that scroll plays, the sections
//   passed on the way are not marked; scrollend lifts the hold.
// - A heading counts as reached at the reading line: offset plus a fifth of
//   the viewport, at most 64px. The observer watches that line; scrollend
//   also measures, which marks the last section at the bottom of the page.
// - The indicator moves with transform only; its length is set at once.
//   Interaction "toc-travel" (order 1.22, proposed): the CSS transition runs
//   on the snappy spring, and the bar stretches along its travel with its
//   trailing edge still (stretchAlong, react/src/internal/indicator.ts), so
//   it travels with the direction of the change. Under reduced motion the
//   duration tokens are 0ms and nothing stretches.
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
import { readDuration, readEasing, type PatternMode } from '@the-system/motion';
import { scaleOf } from '../../internal/indicator';

/**
 * Round 3 (review N18): the bar travels with the Web Animations API, from
 * where it was drawn to its new place, on the snappy spring, and at 45% of
 * the run it is longer by scale.stretch over the mean of both sizes. Top
 * origin, translate and scaleY only. The CSS no longer transitions it, so
 * the travel and the stretch are one animation and the bar never jumps.
 */
function travelBar(bar: HTMLElement, fromTop: number, fromSize: number, toTop: number, toSize: number, mode: PatternMode): Animation | null {
  if (mode !== 'full' || typeof bar.animate !== 'function' || toSize <= 0) return null;
  for (const a of bar.getAnimations?.() ?? []) if (String(a.id) === 'ds-motion:toc-travel') a.cancel();
  const s = scaleOf(bar, 'stretch');
  const mid = (fromTop + toTop) / 2;
  const midSize = ((fromSize + toSize) / 2) * s;
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return bar.animate(
    [
      { transform: `translateY(${r(fromTop)}px) scaleY(${r(fromSize / toSize)})` },
      { transform: `translateY(${r(mid - (midSize - (fromSize + toSize) / 2) / 2)}px) scaleY(${r(midSize / toSize)})`, offset: 0.45 },
      { transform: `translateY(${r(toTop)}px)` },
    ],
    { id: 'ds-motion:toc-travel', duration: readDuration(bar, 'duration.spring-snappy'), easing: readEasing(bar, 'ease.spring-snappy') },
  );
}
import { useMotion } from '../../internal/motion';

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

/** The id a URL fragment names. A malformed escape such as `#50%` is read as written, never thrown. */
export function fragmentId(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Scrolls to the heading, moves focus to it and sets the fragment. Returns false when it is missing.
 * With an offset, a heading that has no scroll margin of its own gets one inline, so it never lands under a sticky header.
 */
function jumpTo(id: string, doc: Document, offset = 0): boolean {
  const target = doc.getElementById(id);
  if (!target) return false;
  const view = doc.defaultView;
  if (offset > 0 && !target.style.scrollMarginBlockStart) {
    const own = view?.getComputedStyle?.(target).scrollMarginBlockStart ?? '';
    if (!own || parseFloat(own) === 0) target.style.scrollMarginBlockStart = `${offset}px`;
  }
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
  const empty = tree.length === 0;
  const [tracked, setTracked] = useState<string | null>(items[0]?.id ?? null);
  const controlled = activeProp !== undefined;
  const active = controlled ? activeProp : tracked;
  const rootRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const motion = useMotion();
  const changeRef = useRef(onActiveChange);
  useEffect(() => {
    changeRef.current = onActiveChange;
  });
  // Set while a link's scroll plays: the sections passed on the way are not marked.
  const lockRef = useRef<string | null>(null);
  // Bumped when the list resizes, so the indicator is measured again.
  const [layoutTick, setLayoutTick] = useState(0);

  const lastRef = useRef<string | null>(tracked);
  const setActive = useCallback((id: string | null) => {
    if (lastRef.current === id) return;
    lastRef.current = id;
    setTracked(id);
    changeRef.current?.(id);
  }, []);

  const ids = useMemo(() => items.map((i) => i.id).join(' '), [items]);

  // New headings: start from the fragment of the URL when it names one, else the first.
  // A fragment that names a heading holds the mark until the reader scrolls, so the first measure does not
  // overwrite it (a section near the page end can never reach the reading line). scrollend lifts the hold.
  useEffect(() => {
    const view = rootRef.current?.ownerDocument.defaultView;
    const list = ids ? ids.split(' ') : [];
    const fromHash = view ? fragmentId(view.location.hash) : '';
    const named = fromHash !== '' && list.includes(fromHash);
    if (named) lockRef.current = fromHash;
    setActive(named ? fromHash : (list[0] ?? null));
  }, [ids, setActive]);

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
    // The reading line: the offset plus a fifth of the viewport (at most 64px), so a heading just scrolled to counts as reached.
    const line = offset + Math.min(64, Math.round(view.innerHeight / 5));
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (lockRef.current !== null) return;
      const scroller = doc.scrollingElement;
      const atEnd = scroller ? scroller.scrollTop > 0 && scroller.scrollTop + view.innerHeight >= scroller.scrollHeight - 2 : false;
      const rects = headings.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      setActive(activeHeading(rects, line, atEnd));
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(measure);
    };
    // A heading crossing the reading line fires the observer.
    const observer = new view.IntersectionObserver(schedule, {
      rootMargin: `${-line}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    for (const el of headings) observer.observe(el);
    // The end of a scroll: lifts the lock of a link jump, and catches the page bottom, where no heading crosses the line.
    const onScrollEnd = () => {
      lockRef.current = null;
      schedule();
    };
    view.addEventListener('scrollend', onScrollEnd);
    return () => {
      observer.disconnect();
      view.removeEventListener('scrollend', onScrollEnd);
      if (frame) view.cancelAnimationFrame(frame);
    };
  }, [ids, offset, setActive]);

  // Measure again when the list resizes (wrapping, fonts loading).
  useEffect(() => {
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!root || !view || typeof view.ResizeObserver !== 'function') return;
    const observer = new view.ResizeObserver(() => setLayoutTick((n) => n + 1));
    observer.observe(root);
    return () => observer.disconnect();
  }, [empty]);

  // Place the indicator beside the active link: transform moves it, block-size is set at once.
  // In the sticky form, the active link is also kept in view inside the list, without scrolling the page.
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
    const shown = Number.parseFloat(bar.style.getPropertyValue('--_toc-indicator-size')) > 0;
    // Round 3 (review N18): where the bar is drawn now, a running travel included, so a second change starts there.
    const drawn = bar.getBoundingClientRect();
    const fromTop = drawn.top - rootBox.top + root.scrollTop;
    const fromSize = drawn.height;
    const offset = box.top - rootBox.top + root.scrollTop;
    bar.style.setProperty('--_toc-indicator-offset', `${offset}px`);
    bar.style.setProperty('--_toc-indicator-size', `${box.height}px`);
    // toc-travel: the bar travels from where it is to the active link and stretches on the way.
    if (shown && fromSize > 0 && Math.abs(offset - fromTop) >= 1) travelBar(bar, fromTop, fromSize, offset, box.height, motion.mode('toc-travel'));
    if (sticky && root.scrollHeight > root.clientHeight) {
      if (box.top < rootBox.top) root.scrollTop -= rootBox.top - box.top;
      else if (box.bottom > rootBox.bottom) root.scrollTop += box.bottom - rootBox.bottom;
    }
  }, [active, tree, sticky, layoutTick, motion]);

  const onLinkClick = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const doc = event.currentTarget.ownerDocument;
    // Hold the mark on the chosen section while the scroll plays; scrollend lifts it.
    lockRef.current = id;
    if (!jumpTo(id, doc, offset)) {
      lockRef.current = null;
      return;
    }
    event.preventDefault();
    setActive(id);
    // A page that cannot scroll there fires no scrollend: lift the lock after the longest smooth scroll.
    doc.defaultView?.setTimeout(() => {
      if (lockRef.current === id) lockRef.current = null;
    }, 1000);
  };

  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

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

  // No headings: nothing to navigate, so no landmark that holds only its title.
  if (empty) return null;

  return (
    <nav
      {...rest}
      ref={setRootRef}
      data-ds="table-of-contents"
      data-size={size}
      data-sticky={sticky ? '' : undefined}
      style={sticky && offset ? { ...rest.style, ['--_toc-sticky-offset' as string]: `calc(${offset}px + var(--ds-space-l))` } : rest.style}
      aria-labelledby={titleText === false ? rest['aria-labelledby'] : titleId}
    >
      {titleText !== false && (
        <p data-part="title" id={titleId}>
          {titleText}
        </p>
      )}
      {renderList(tree)}
      <span data-part="indicator" aria-hidden="true" ref={indicatorRef} />
    </nav>
  );
}
