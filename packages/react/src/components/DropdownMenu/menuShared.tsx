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
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@the-system/icons/react';
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
