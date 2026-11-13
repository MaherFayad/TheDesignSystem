'use client';
// Skeleton: a placeholder shape while content loads.
//
// Sources: Figma-Killer-2 `ui/components/Skeleton/` (the shimmer bar, its
// surface-3 and surface-4 colors and the 1.4s cadence). GoBanana was not
// reachable from the lane session.
//
// Anatomy: root [data-ds=skeleton] with data-variant (text, circle, rect)
// and, for text, data-size. No parts. The form is a variant prop, not
// data-shape, whose words are fixed for controls.
//
// A skeleton is always aria-hidden: it carries no content. The container
// that is loading carries aria-busy="true" and, where the wait is worth
// saying, a status message; this component does not announce.
//
// Motion (order 1.22, interaction skeleton-swap, proposed): when the
// consumer swaps the skeleton for its content, the skeleton leaves the DOM at
// once (nothing waits), and just before the next paint a ghost of it is put
// back where it was drawn and fades out over duration.morph on top of the
// content that took its place: a cross fade from the placeholder to the
// content, inside the existing contract (helpers/exit-ghost.ts in
// @the-system/motion). The fuller
// form, a `loading` prop with the content as children that fades in under
// the leaving shape, is proposed to the owner in the round 2 report.
//
// Round 3 (order 1.23, proposed): shimmer to content. The ghost no longer
// only fades: it is wiped away with clip-path from the inline start toward
// the inline end, the way the shimmer band runs, over duration.morph on
// ease.reveal, so the content shows in reading order where the placeholder
// was. Reduced motion swaps at once, with no ghost (review B1).
import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type Ref } from 'react';
import { ghostOf, placeOf, styleTurnsOff, wipeAway } from '@the-system/motion';
import type { Size } from '@the-system/shared';
import { useMotion } from '../../internal/motion';

export type SkeletonVariant = 'text' | 'circle' | 'rect';
export type SkeletonSize = Extract<Size, 'sm' | 'md' | 'lg'>;

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children'> {
  /** The form of the placeholder. Default text. */
  variant?: SkeletonVariant;
  /** For text: the type size of the line it stands for. Default md. Ignored for circle and rect. */
  size?: SkeletonSize;
  /** Inline size: a CSS length or a number of px. Default: the full line for text and rect, 32px for circle. */
  width?: string | number;
  /** Block size for rect: a CSS length or a number of px. A circle takes its width. Ignored for text. */
  height?: string | number;
  ref?: Ref<HTMLSpanElement>;
}

function toLength(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/** One placeholder shape. Always hidden from assistive tech; the loading container carries aria-busy. */
export function Skeleton({ variant = 'text', size = 'md', width, height, style, ref, ...rest }: SkeletonProps) {
  const own = useRef<HTMLSpanElement | null>(null);
  const motion = useMotion();
  const mode = motion.mode('skeleton-swap');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  // On unmount the node is still in the document: record where it is, and
  // after the commit, if it is really gone (not a StrictMode rerun), fade its ghost.
  useLayoutEffect(() => {
    const el = own.current;
    return () => {
      // Round 3 (review B1): only the full mode draws a ghost; reduced motion swaps at once.
      // The skeleton-swap off row (--_skeleton-swap: none) swaps at once too (review N31).
      if (!el || !el.isConnected || modeRef.current !== 'full' || styleTurnsOff(el, '--_skeleton-swap') || typeof requestAnimationFrame !== 'function') return;
      const place = placeOf(el);
      requestAnimationFrame(() => {
        if (!el.isConnected) wipeAway(ghostOf(place), modeRef.current);
      });
    };
  }, []);
  const vars: Record<string, string> = {};
  const w = toLength(width);
  const h = toLength(height);
  if (w !== undefined) vars['--_skeleton-width'] = w;
  if (h !== undefined && variant === 'rect') vars['--_skeleton-height'] = h;
  return (
    <span
      {...rest}
      ref={(node) => {
        own.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      aria-hidden="true"
      data-ds="skeleton"
      data-variant={variant}
      data-size={variant === 'text' ? size : undefined}
      style={{ ...(vars as CSSProperties), ...style }}
    />
  );
}
