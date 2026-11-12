'use client';
// ScrollArea: a scroll container with styled scrollbars that keeps native
// scrolling. Built on Radix ScrollArea: the viewport scrolls natively (wheel,
// touch, keys, find in page, scroll into view), Radix hides the native bars
// and draws its own, and it places the vertical bar on the inline end, so it
// sits on the left in RTL. There is no custom wheel handling.
//
// Sources: GoBanana admin `TableScroll` (a scroll box around a wide table)
// could not be read in this session; Figma-Killer-2 `FilterBar.tsx` (edge
// fades that show only on the side that still has content, measured from the
// scroll position on scroll, resize and content change).
//
// The DOM:
//
//   <div data-ds="scroll-area" data-size data-orientation
//        data-overflow-start data-overflow-end>          Radix Root
//     <div data-part="viewport" tabindex? role? aria-label?>   Radix Viewport
//       <div>children</div>                               Radix content box
//     <div data-part="fade-start" aria-hidden>             edge fade
//     <div data-part="fade-end" aria-hidden>
//     <div data-part="scrollbar" data-orientation>         Radix Scrollbar
//       <div data-part="thumb">                            Radix Thumb
//     <div data-part="corner">                             Radix Corner (both bars)
//
// Overflow: `data-overflow-start` is present while content is hidden before
// the start edge of the main axis (above, or before the inline start), and
// `data-overflow-end` while content is hidden after the end edge. The main
// axis is the block axis for `vertical` and `both`, the inline axis for
// `horizontal`. In RTL, scrollLeft runs from 0 toward negative numbers, so the
// inline position is read as its absolute value.
//
// Focus: a viewport with no focusable child gets tabindex 0, role region and
// a name, so a keyboard user can reach it and scroll with the arrow keys
// (WCAG 2.1.1, axe scrollable-region-focusable). With a focusable child the
// viewport stays out of the tab order and the children scroll it into view.
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { ScrollArea as RadixScrollArea } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

export type ScrollAreaSize = Extract<Size, 'sm' | 'md'>;
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';
/** When the scrollbars show: the Radix `type`. */
export type ScrollAreaScrollbars = 'auto' | 'always' | 'scroll' | 'hover';

/** The built in viewport name, per language. A prop always wins. */
const scrollAreaLabels = {
  en: 'Scrollable content',
  ar: 'محتوى قابل للتمرير',
} as const;

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/** True when the element holds a focusable descendant. */
export function hasFocusableChild(el: Element): boolean {
  return el.querySelector(FOCUSABLE) !== null;
}

interface Overflow {
  start: boolean;
  end: boolean;
}

/** Content hidden before the start and after the end of one axis, with 1px of slack for subpixel layouts. */
export function readOverflow(el: HTMLElement, axis: 'block' | 'inline'): Overflow {
  if (axis === 'block') {
    const max = el.scrollHeight - el.clientHeight;
    return { start: el.scrollTop > 1, end: el.scrollTop < max - 1 };
  }
  const max = el.scrollWidth - el.clientWidth;
  // In RTL scrollLeft is 0 at the start and negative toward the end.
  const pos = Math.abs(el.scrollLeft);
  return { start: pos > 1, end: pos < max - 1 };
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

export interface ScrollAreaProps extends Omit<ComponentProps<'div'>, 'dir'> {
  /** Which axes scroll. Default vertical. */
  orientation?: ScrollAreaOrientation;
  /** The scrollbar thickness: sm 4px, md 6px (scrollbar.size), plus the track padding. Default md. */
  size?: ScrollAreaSize;
  /**
   * When the scrollbars show. auto: while content overflows (default).
   * always: always. scroll: while scrolling. hover: while the pointer is over
   * the area or it scrolls.
   */
  scrollbars?: ScrollAreaScrollbars;
  /** Edge fades on the side that still has content. Default true. */
  fades?: boolean;
  /**
   * The accessible name of the viewport when it takes focus (no focusable
   * child). Default "Scrollable content", in Arabic under lang="ar". Name what
   * scrolls: "Release notes".
   */
  label?: string;
  /**
   * Whether the viewport joins the tab order. auto: only when it has no
   * focusable child (default). true and false force it.
   */
  focusable?: boolean | 'auto';
  /** A ref to the viewport, the element that scrolls. */
  viewportRef?: Ref<HTMLDivElement>;
  /** Called on every scroll of the viewport. */
  onScroll?: ComponentProps<'div'>['onScroll'];
  children?: ReactNode;
}

/**
 * A scroll container. Give the root a size from its parent (a flex child, a
 * grid cell, a max block size): the viewport fills it and scrolls.
 */
export function ScrollArea({
  orientation = 'vertical',
  size = 'md',
  scrollbars = 'auto',
  fades = true,
  label,
  focusable = 'auto',
  viewportRef,
  onScroll,
  children,
  ...rest
}: ScrollAreaProps) {
  const { dir, lang } = useTheme();
  const viewport = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false });
  const [childFocusable, setChildFocusable] = useState(false);
  const axis = orientation === 'horizontal' ? 'inline' : 'block';

  const measure = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const next = readOverflow(el, axis);
    setOverflow((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, [axis]);

  const setViewport = useCallback(
    (el: HTMLDivElement | null) => {
      viewport.current = el;
      assignRef(viewportRef, el);
    },
    [viewportRef],
  );

  // Measure on mount, on resize of the viewport or its content, and when the
  // content changes. Scroll is handled by the onScroll prop below.
  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return undefined;
    const check = () => {
      measure();
      setChildFocusable(hasFocusableChild(el));
    };
    check();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(el);
    if (el.firstElementChild) resize?.observe(el.firstElementChild);
    const mutation = typeof MutationObserver === 'undefined' ? null : new MutationObserver(check);
    mutation?.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex', 'disabled', 'href', 'contenteditable'] });
    return () => {
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, [measure]);

  const takesFocus = focusable === 'auto' ? !childFocusable : focusable;
  const name = label ?? (lang === 'ar' || lang.startsWith('ar-') ? scrollAreaLabels.ar : scrollAreaLabels.en);
  const vertical = orientation !== 'horizontal';
  const horizontal = orientation !== 'vertical';

  return (
    <RadixScrollArea.Root
      {...rest}
      type={scrollbars}
      dir={dir}
      data-ds="scroll-area"
      data-size={size}
      data-orientation={orientation}
      data-overflow-start={overflow.start ? '' : undefined}
      data-overflow-end={overflow.end ? '' : undefined}
    >
      <RadixScrollArea.Viewport
        ref={setViewport}
        data-part="viewport"
        tabIndex={takesFocus ? 0 : undefined}
        role={takesFocus ? 'region' : undefined}
        aria-label={takesFocus || label !== undefined ? name : undefined}
        onScroll={(event) => {
          measure();
          onScroll?.(event);
        }}
      >
        {children}
      </RadixScrollArea.Viewport>
      {fades && (
        <>
          <div data-part="fade-start" aria-hidden="true" />
          <div data-part="fade-end" aria-hidden="true" />
        </>
      )}
      {vertical && (
        <RadixScrollArea.Scrollbar data-part="scrollbar" orientation="vertical">
          <RadixScrollArea.Thumb data-part="thumb" />
        </RadixScrollArea.Scrollbar>
      )}
      {horizontal && (
        <RadixScrollArea.Scrollbar data-part="scrollbar" orientation="horizontal">
          <RadixScrollArea.Thumb data-part="thumb" />
        </RadixScrollArea.Scrollbar>
      )}
      {vertical && horizontal && <RadixScrollArea.Corner data-part="corner" />}
    </RadixScrollArea.Root>
  );
}
