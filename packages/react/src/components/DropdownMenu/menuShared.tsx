'use client';
// The pieces DropdownMenu, ContextMenu and Menubar share: the themed portal
// layer, the logical side words, the inside of every item and two small
// helpers. Private to the components: not exported from the package.
//
// Each menu builds its own items on its own Radix primitive (a Radix item
// needs the context of its own menu), and they all render the same parts
// through ItemContent, so DropdownMenu.css styles every one of them.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@the-system/icons/react';
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type PatternMode } from '@the-system/motion';
import { useMotion } from '../../internal/motion';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { renderSlotContent, type ButtonSlotContent } from '../Button/ButtonBase';

/** Space kept between a menu and the viewport edge, in CSS px. Radix measures in px, so this is a number. */
export const VIEWPORT_GUTTER = 8;
/** Gap between a trigger and its menu, in CSS px. */
export const TRIGGER_GAP = 4;

/** The menu item roles, for focus moves. */
export const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** Where a menu opens, in logical words: block-end is below the trigger, inline-end is after it in reading order. */
export type MenuSide = 'block-start' | 'block-end' | 'inline-start' | 'inline-end';

/** Sets a ref of any kind. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/** Plain text of simple children, for typeahead. A node gives undefined: Radix then reads the text content. */
export function textOf(children: ReactNode): string | undefined {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  return undefined;
}

/** Logical side to the physical side Radix takes. */
export function physicalSide(side: MenuSide, dir: 'ltr' | 'rtl'): 'top' | 'bottom' | 'left' | 'right' {
  if (side === 'block-start') return 'top';
  if (side === 'block-end') return 'bottom';
  const end = dir === 'rtl' ? 'left' : 'right';
  const start = dir === 'rtl' ? 'right' : 'left';
  return side === 'inline-end' ? end : start;
}

/** The id of the row highlight slide (interaction "menu-row-slide"). */
export const ROW_SLIDE_ID = 'menu-row-slide';

/** The rows a highlight slides between: menu items and the Menubar titles. */
const ROW_SELECTOR = `${ITEM_SELECTOR}, [data-part='trigger']`;

/** The row an event target is, or null. */
function rowOf(target: EventTarget | null): Element | null {
  return target instanceof Element && target.matches(ROW_SELECTOR) ? target : null;
}

/** The transform of an element's ::after as drawn now, a running slide included: x, y and the scale. */
function drawnAfter(el: Element): { x: number; y: number; sx: number; sy: number } {
  const id = { x: 0, y: 0, sx: 1, sy: 1 };
  if (typeof getComputedStyle !== 'function' || typeof DOMMatrixReadOnly === 'undefined') return id;
  const t = getComputedStyle(el, '::after').transform;
  if (!t || t === 'none') return id;
  try {
    const m = new DOMMatrixReadOnly(t);
    return { x: m.e, y: m.f, sx: m.a, sy: m.d };
  } catch {
    return id;
  }
}

/**
 * Interaction "menu-row-slide": the lit fill of a row is its ::after (the
 * hover veil, DropdownMenu.css). When the highlight moves from one row to
 * the next, the new row's fill starts over the old one (where it is drawn,
 * so a slide still in flight hands over from where it is) and travels to its
 * own row on the snappy spring. The highlight state itself changes at once:
 * only the decorative fill moves, never the row, its text or its focus ring.
 * Reduced and none: no slide, the fill is there at once. Returns the
 * Animation, or null.
 */
export function slideHighlight(from: Element | null | undefined, to: Element, mode: PatternMode): Animation | null {
  if (mode !== 'full' || !from || from === to || !from.isConnected || typeof to.animate !== 'function') return null;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (b.width < 1 || b.height < 1) return null;
  const drawn = drawnAfter(from);
  const dx = a.left + drawn.x - b.left;
  const dy = a.top + drawn.y - b.top;
  const sx = (a.width * drawn.sx) / b.width;
  const sy = (a.height * drawn.sy) / b.height;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return null;
  const duration = readDuration(to, 'duration.spring-snappy');
  if (duration <= 0) return null;
  const id = `${ANIMATION_ID_PREFIX}${ROW_SLIDE_ID}`;
  for (const anim of to.getAnimations?.({ subtree: true } as GetAnimationsOptions) ?? []) if (String(anim.id) === id) anim.cancel();
  const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  return to.animate([{ transform: `translate(${r(dx)}px, ${r(dy)}px) scale(${r(sx, 4)}, ${r(sy, 4)})` }, { transform: 'none' }], {
    id,
    duration,
    easing: readEasing(to, 'ease.spring-snappy'),
    pseudoElement: '::after',
  });
}

/**
 * Focus handlers for a layer that holds menus (or a Menubar row): when the
 * highlight (Radix moves focus with it, for the pointer and the arrow keys)
 * goes from one row to another of the same menu, the fill slides. A short
 * hop over a separator or the menu padding, where focus rests on the menu
 * for a moment, still slides: the last row is kept for two settle times of
 * the snappy spring.
 */
export function useRowSlide() {
  const motion = useMotion();
  const last = useRef<{ row: Element; at: number } | null>(null);
  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const to = rowOf(event.target);
      if (!to) return;
      const group = to.closest('[role="menu"], [role="menubar"]');
      let from = rowOf(event.relatedTarget);
      if (!from) {
        const l = last.current;
        const recent = l && performance.now() - l.at < 2 * readDuration(to, 'duration.spring-snappy');
        from = recent ? l.row : null;
      }
      if (from && from.closest('[role="menu"], [role="menubar"]') === group) slideHighlight(from, to, motion.mode(ROW_SLIDE_ID));
      last.current = { row: to, at: performance.now() };
    },
    [motion],
  );
  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const row = rowOf(event.target);
    if (row) last.current = { row, at: performance.now() };
  }, []);
  return { onFocus, onBlur };
}

/**
 * Portals its child into <body> inside a Theme that copies every axis of the
 * Theme it is rendered in. Mounted while `open`, and until the content inside
 * reports through `onContent(null)` that it left (after its exit motion).
 *
 * `kind` is the value of data-menu-layer: empty for a DropdownMenu, a name
 * for a menu whose Radix primitive measures under other property names
 * (DropdownMenu.css maps them for that layer).
 */
export function useMenuLayer(open: boolean, kind = '') {
  const theme = useTheme();
  const [body, setBody] = useState<HTMLElement | null>(null);
  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);

  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const openRef = useRef(open);
  openRef.current = open;
  const onContent = useCallback((node: HTMLElement | null) => {
    if (!node && !openRef.current) setMounted(false);
  }, []);

  // Interaction "menu-row-slide", for every menu in the layer (the root menu and its submenus).
  const slide = useRowSlide();

  const render = (children: ReactNode) =>
    body && mounted
      ? createPortal(
          <Theme
            style={theme.style}
            scheme={theme.scheme}
            density={theme.density}
            contrast={theme.contrast}
            platform={theme.platform}
            glass={theme.glass}
            dir={theme.dir}
            lang={theme.lang}
            data-menu-layer={kind}
            onFocus={slide.onFocus}
            onBlur={slide.onBlur}
          >
            {children}
          </Theme>,
          body,
        )
      : null;
  return { render, onContent, dir: theme.dir };
}

export interface ItemContentProps {
  start?: ButtonSlotContent;
  end?: ButtonSlotContent;
  shortcut?: string;
  indicator?: ReactNode;
  children?: ReactNode;
}

/** The inside of every item kind: indicator, start, text, shortcut, end. */
export function ItemContent({ start, end, shortcut, indicator, children }: ItemContentProps) {
  return (
    <>
      {indicator}
      {start !== undefined && (
        <span data-part="start" aria-hidden="true">
          {renderSlotContent(start)}
        </span>
      )}
      <span data-part="text">{children}</span>
      {shortcut !== undefined && (
        // Key names are Latin: kept left to right inside Arabic.
        <span data-part="shortcut" dir="ltr">
          {shortcut}
        </span>
      )}
      {end !== undefined && (
        <span data-part="end" aria-hidden="true">
          {renderSlotContent(end)}
        </span>
      )}
    </>
  );
}

/** The glyph inside the indicator of a checkbox item: a check, or a minus for indeterminate. */
export function IndicatorGlyph({ checked }: { checked?: boolean | 'indeterminate' }) {
  return <Icon name={checked === 'indeterminate' ? 'minus' : 'check'} size="md" />;
}
