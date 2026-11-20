'use client';
// Private helpers shared by the floating overlays of lane 6B: Popover,
// Tooltip, HoverCard and Tour. Not exported from the package barrel.
//
// ThemedPortal. A floating root renders in a portal on <body>, outside every
// Theme element, where the token selectors would not reach it. As in
// Dialog.tsx and Toaster.tsx, the portal starts with a Theme that copies
// every axis of the Theme the overlay is rendered in, so tokens, language
// and direction apply inside it, and its safe area tokens (LayerTheme, order
// C5). The Theme carries `data-<layer>-layer` and
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
// The fold and the side column (order DU5, docs/plan/reset-duo.md 5.2,
// proposed). useFold reads the fold (packages/shared fold.ts) after mount,
// on resize, on a change of the segment media queries and of the device
// posture; null without the viewport segments API, which is the case in
// Safari unless a person turns its flag on. useFoldCollision gives a
// floating overlay (Popover, DropdownMenu, ContextMenu, Tooltip) its
// collision padding: the safe area at the inline sides (where a drawn
// device frame or a future Safari puts the side column) and, when the fold
// is known, the band and the other segment, so the overlay flips or shifts
// into the segment of its trigger and never straddles the band. With no
// fold and no inline inset it returns the caller's padding untouched, so
// nothing changes on any other device.
//
// FloatingArrow. The arrow is an SVG with two strokes: the fill is the
// surface color and the stroke the border color on the two slanted edges
// only, so it joins the surface without a line across its base. The
// component CSS pulls it over the border by one border width.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { foldPadding, paddingOf, readFold, sameFold, type Fold, type PhysicalPadding } from '@the-system/shared';
import { LayerTheme } from '../../theme/LayerTheme';

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
  const [body, setBody] = useState<HTMLElement | null>(null);
  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);
  if (!body) return null;
  return createPortal(
    <LayerTheme {...{ [`data-${layer}-layer`]: '' }}>{children}</LayerTheme>,
    body,
  );
}

/** The fold of this window, read after mount and kept current; null without a fold, or while inactive. */
export function useFold(active = true): Fold | null {
  const [fold, setFold] = useState<Fold | null>(null);
  useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined;
    const view = window;
    const update = () => {
      const next = readFold(view);
      setFold((prev) => (sameFold(prev, next) ? prev : next));
    };
    update();
    view.addEventListener('resize', update);
    const queries = typeof view.matchMedia === 'function' ? ['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)'].map((q) => view.matchMedia(q)) : [];
    for (const q of queries) q.addEventListener?.('change', update);
    const posture = (view.navigator as Navigator & { devicePosture?: EventTarget }).devicePosture;
    posture?.addEventListener?.('change', update);
    return () => {
      view.removeEventListener('resize', update);
      for (const q of queries) q.removeEventListener?.('change', update);
      posture?.removeEventListener?.('change', update);
    };
  }, [active]);
  return active ? fold : null;
}

/** Collision padding as Radix takes it: one number or per physical side. */
export type CollisionPadding = number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;

/** The safe area at the inline sides, in px per physical side, measured with a hidden probe in the layer's Theme. */
function inlineInsets(node: HTMLElement): { left: number; right: number } {
  const host = node.closest<HTMLElement>("[data-ds='theme']") ?? node;
  const probe = node.ownerDocument.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;inline-size:var(--ds-inset-safe-start,0px);block-size:var(--ds-inset-safe-end,0px)';
  host.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl';
  const start = Math.max(0, box.width || 0);
  const end = Math.max(0, box.height || 0);
  return rtl ? { left: end, right: start } : { left: start, right: end };
}

/** Where the overlay comes from: the centre of the element that controls or is described by it, else of the overlay itself. */
function anchorPoint(node: HTMLElement): { x: number; y: number } {
  const doc = node.ownerDocument;
  const ids = [node.id, node.querySelector<HTMLElement>("[role='tooltip'][id]")?.id].filter((id): id is string => Boolean(id));
  let anchor: Element | null = null;
  for (const id of ids) {
    const esc = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id;
    anchor = doc.querySelector(`[aria-controls~="${esc}"], [aria-describedby~="${esc}"]`);
    if (anchor) break;
  }
  const r = (anchor ?? node).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const samePadding = (a: PhysicalPadding | null, b: PhysicalPadding | null) =>
  a === b || (a !== null && b !== null && a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left);

/**
 * The collision padding of a floating overlay, with the side column and the
 * fold (see the header). Pass the caller's padding; give `ref` to the Radix
 * content. Measured when the content mounts and on resize.
 */
export function useFoldCollision(base: CollisionPadding | undefined): { collisionPadding: CollisionPadding | undefined; ref: (node: HTMLElement | null) => void } {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [padding, setPadding] = useState<PhysicalPadding | null>(null);
  const key = typeof base === 'object' ? JSON.stringify(base) : base;
  const baseRef = useRef(base);
  baseRef.current = base;
  useLayoutEffect(() => {
    if (!node) {
      setPadding(null);
      return undefined;
    }
    const view = node.ownerDocument.defaultView;
    if (!view) return undefined;
    const update = () => {
      const fold = readFold(view);
      const edges = inlineInsets(node);
      const next =
        !fold && edges.left === 0 && edges.right === 0
          ? null
          : foldPadding(fold, anchorPoint(node), { width: view.innerWidth, height: view.innerHeight }, paddingOf(baseRef.current), edges);
      setPadding((prev) => (samePadding(prev, next) ? prev : next));
    };
    update();
    view.addEventListener('resize', update);
    return () => view.removeEventListener('resize', update);
  }, [node, key]);
  return { collisionPadding: padding ?? base, ref: setNode };
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
