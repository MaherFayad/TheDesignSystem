'use client';
// Private helpers shared by the floating overlays of lane 6B: Popover,
// Tooltip, HoverCard and Tour. Not exported from the package barrel.
//
// ThemedPortal. A floating root renders in a portal on <body>, outside every
// Theme element, where the token selectors would not reach it. As in
// Dialog.tsx and Toaster.tsx, the portal starts with a Theme that copies
// every axis of the Theme the overlay is rendered in, so tokens, language
// and direction apply inside it. The Theme carries `data-<layer>-layer` and
// the component CSS makes it `display: contents`.
//
// useLayerPresence. The portal stays mounted while the overlay is open, and
// until its Radix content has played its exit and left the DOM. Radix keeps a
// closed content mounted until its exit animation ends (Presence). Under
// reduced motion the component CSS sets the animation to none, so Radix
// removes it at once; nothing here waits for an animationend.
//
// Sides. The public `side` prop is logical: `top`, `bottom`, `start` (the
// inline start: left in English, right in Arabic) and `end`. Radix takes a
// physical side. `align` start and end need no mapping: floating-ui reads the
// direction of the content (the portal Theme carries `dir`) and mirrors the
// alignment of a top or bottom placement in right to left layouts.
//
// FloatingArrow. The arrow is an SVG with two strokes: the fill is the
// surface color and the stroke the border color on the two slanted edges
// only, so it joins the surface without a line across its base. The
// component CSS pulls it over the border by one border width.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';

/** The logical side a floating overlay prefers. Start and end follow the reading direction. */
export type FloatingSide = 'top' | 'bottom' | 'start' | 'end';
/** Where the overlay lines up along the side of its trigger. Start and end follow the reading direction. */
export type FloatingAlign = 'start' | 'center' | 'end';
/** The physical side Radix takes. */
export type PhysicalSide = 'top' | 'right' | 'bottom' | 'left';

/** Maps a logical side to the physical side for a direction. */
export function physicalSide(side: FloatingSide, dir: 'ltr' | 'rtl' | (string & {})): PhysicalSide {
  const rtl = dir === 'rtl';
  if (side === 'start') return rtl ? 'right' : 'left';
  if (side === 'end') return rtl ? 'left' : 'right';
  return side;
}

/**
 * Keeps the portal mounted while `open`, and after close until the content
 * node has left the DOM. Pass the returned ref to the Radix content.
 */
export function useLayerPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const openRef = useRef(open);
  openRef.current = open;
  const alive = useRef(false);

  const contentRef = useCallback((node: HTMLElement | null) => {
    alive.current = node !== null;
    if (!node && !openRef.current) setMounted(false);
  }, []);

  // Closed before the content ever mounted (or already gone): drop the portal.
  useEffect(() => {
    if (!open && !alive.current) setMounted(false);
  }, [open]);

  return [mounted, contentRef] as const;
}

export interface ThemedPortalProps {
  /** The layer name: the Theme gets `data-<layer>-layer`. */
  layer: 'popover' | 'tooltip' | 'hover-card' | 'tour';
  children?: ReactNode;
}

/** A portal on <body> that starts with a Theme copying every axis of the current Theme. */
export function ThemedPortal({ layer, children }: ThemedPortalProps) {
  const theme = useTheme();
  const [body, setBody] = useState<HTMLElement | null>(null);
  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);
  if (!body) return null;
  return createPortal(
    <Theme
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={theme.dir}
      lang={theme.lang}
      {...{ [`data-${layer}-layer`]: '' }}
    >
      {children}
    </Theme>,
    body,
  );
}

/** The arrow drawing. Wrap it in the Radix Arrow of the component with asChild. */
export function ArrowShape(props: { 'data-part'?: string }) {
  return (
    <svg data-part="arrow" viewBox="0 0 12 6" preserveAspectRatio="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M0 0 L6 6 L12 0" />
    </svg>
  );
}

/** True for a language tag that is Arabic. */
export function isArabic(lang: string): boolean {
  return lang === 'ar' || lang.startsWith('ar-');
}
