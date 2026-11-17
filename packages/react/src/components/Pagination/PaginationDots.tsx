'use client';
// The dots form of Pagination (order M9.9, docs/plan/reset-ios-families.md,
// proposed): one dot per page and nothing else, for a short flat set of
// pages such as the screens of an onboarding or the slides of a carousel.
// Rendered by Pagination when variant is dots; not exported on its own.
//
// The DOM:
//
//   <nav data-ds="pagination" data-variant="dots" aria-label="Pages" data-compact?>
//     <span data-part="track">                                   the platter a platform may draw
//       <button data-ds="button" data-part="dot" aria-label="Page 1 of 5" tabindex="-1">
//         <span aria-hidden="true">                              the drawn dot
//       <button data-ds="button" data-part="dot" aria-label="Page 2 of 5" aria-current="page" data-active tabindex="0">
//
// Decisions:
// - One tab stop: the current dot (roving tab index). Left and Right move
//   focus and select at once (selection follows focus), mirrored in right to
//   left; Home and End go to the first and last page. No wrap: the pages are
//   a line with two ends. Enter and Space on a dot select it as well.
// - Each dot is a system Button named "Page 3 of 5" ("صفحة 3 من 5"), with
//   aria-current page on the current one. Its box is the 24 by 24 target
//   (size.target-min, WCAG 2.5.8); the dot drawn inside is smaller.
// - When the dots do not fit at full size in the width they have, the root
//   takes data-compact: the dots shrink in look and stop taking the pointer,
//   and the track becomes one control at least 44 tall, where a press on its
//   leading half goes back one page and on its trailing half forward one
//   page (2.5.8 by size, 2.5.7 with no drag). The keys stay the same. The
//   fit is worked out after layout from the dots' own flex basis and the
//   root's width, never during render, so the server render (never compact)
//   matches the first client render.
// - Motion: the current dot widens by clip-path and swaps its color on
//   CSS transitions in Pagination.css (pattern press keeps the pointer
//   press); reduced motion swaps at once.
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { clampPage } from '@the-system/shared';
import { useTheme } from '../../theme';
import { ButtonRoot } from '../Button/ButtonBase';
import { useControllable } from '../../internal/useControllable';
import type { PaginationProps } from './Pagination';

const digits = new Intl.NumberFormat('en-US');
const n = (value: number) => digits.format(value);

const words = {
  en: { label: 'Pages', dot: (p: number, t: number) => `Page ${n(p)} of ${n(t)}` },
  ar: { label: 'الصفحات', dot: (p: number, t: number) => `صفحة ${n(p)} من ${n(t)}` },
} as const;

const DOT = ':scope > [data-part="dot"]';

/** A length in px from a computed style, 0 when it is not a length. */
const px = (value: string) => {
  const v = parseFloat(value);
  return Number.isFinite(v) ? v : 0;
};

export function PaginationDots({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageCount,
  disabled = false,
  label,
  ref,
  // The numbered form's props: the dots have no use for them.
  itemCount: _itemCount,
  pageSize: _pageSize,
  siblings: _siblings,
  boundaries: _boundaries,
  showEnds: _showEnds,
  getHref: _getHref,
  size: _size,
  shape: _shape,
  formatSummary: _formatSummary,
  ...rest
}: Omit<PaginationProps, 'variant'>) {
  const { lang } = useTheme();
  const t = words[lang === 'ar' ? 'ar' : 'en'];
  const raw = pageCount ?? 1;
  const total = Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
  const [rawPage, setPage] = useControllable(pageProp, defaultPage, onPageChange);
  const page = clampPage(rawPage, total);
  const [compact, setCompact] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLSpanElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Do the dots fit at full size? Read after layout, and again on resize.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || typeof getComputedStyle !== 'function') return;
    const measure = () => {
      const dot = track.querySelector<HTMLElement>(DOT);
      if (!dot) return;
      const basis = parseFloat(getComputedStyle(dot).flexBasis);
      const room = root.clientWidth;
      if (!Number.isFinite(basis) || !(room > 0)) return;
      const ts = getComputedStyle(track);
      const frame = px(ts.paddingInlineStart) + px(ts.paddingInlineEnd) + px(ts.borderInlineStartWidth) + px(ts.borderInlineEndWidth);
      const natural = total * basis + (total - 1) * px(ts.columnGap) + frame;
      setCompact(natural > room + 0.5);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [total]);

  const rtlOf = (el: Element) => el.closest('[dir]')?.getAttribute('dir') === 'rtl';

  const select = (to: number) => {
    if (!disabled && to !== page) setPage(to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
    const dots = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(DOT));
    const from = dots.indexOf(event.target as HTMLElement);
    if (from < 0) return;
    const forward = rtlOf(event.currentTarget) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    let to: number | null = null;
    if (event.key === forward) to = from + 1;
    else if (event.key === back) to = from - 1;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = dots.length - 1;
    if (to === null) return;
    event.preventDefault();
    to = Math.min(dots.length - 1, Math.max(0, to));
    dots[to]!.focus();
    select(to + 1);
  };

  // Compact: the track is one control for the pointer. A pointer press
  // anywhere on it (a dot's platform hit layer included) counts by the half
  // it lands on; a key press on a dot also clicks, with detail 0, and stays
  // the dot's own.
  const onTrackClick = (event: MouseEvent<HTMLSpanElement>) => {
    if (!compact || disabled || event.detail === 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    const onLeft = event.clientX < box.left + box.width / 2;
    const backward = rtlOf(event.currentTarget) ? !onLeft : onLeft;
    const to = backward ? page - 1 : page + 1;
    if (to >= 1 && to <= total) select(to);
  };

  return (
    <nav
      {...rest}
      ref={setRootRef}
      data-ds="pagination"
      data-variant="dots"
      data-compact={compact ? '' : undefined}
      aria-label={label ?? t.label}
    >
      <span data-part="track" ref={trackRef} onKeyDown={onKeyDown} onClick={onTrackClick}>
        {Array.from({ length: total }, (_, i) => {
          const p = i + 1;
          const active = p === page;
          return (
            <ButtonRoot
              key={p}
              ds="button"
              defaultEmphasis="ghost"
              emphasis="ghost"
              size="xs"
              shape="pill"
              data-part="dot"
              data-active={active ? '' : undefined}
              aria-current={active ? 'page' : undefined}
              aria-label={t.dot(p, total)}
              tabIndex={active ? 0 : -1}
              disabled={disabled}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                if (compact && event.detail > 0) return;
                select(p);
              }}
              render={() => <span aria-hidden="true" />}
            />
          );
        })}
      </span>
    </nav>
  );
}
