'use client';
// WindowLayer: a positioned layer that hosts windows. It owns one window
// manager from packages/shared (frames, z order, the active window), so the
// windows inside it stack, take focus and move inside its box.
//
// Source: GoBanana `components/window/WindowLayer.tsx` (the `.wl` layer).
// The layer sizes to its parent: give it a block size, or let a page layout
// stretch it. It paints nothing of its own; the Desk recipe adds the grain.
import { createContext, use, useCallback, useMemo, useRef, useState, type HTMLAttributes, type ReactNode, type Ref, type RefObject } from 'react';
import { createWindowManager, type WindowManager } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

const isArabic = (lang: string) => lang === 'ar' || lang.startsWith('ar-');

interface WindowLayerContextValue {
  manager: WindowManager;
  layer: RefObject<HTMLDivElement | null>;
}

export const WindowLayerContext = createContext<WindowLayerContextValue | null>(null);

/** The nearest WindowLayer, or null for a window that stands on its own. */
export function useWindowLayerContext(): WindowLayerContextValue | null {
  return use(WindowLayerContext);
}

/**
 * The window manager of the nearest WindowLayer, or null outside one. Use it
 * to restore a minimized window from a dock, or to read the z order.
 */
export function useWindowLayer(): WindowManager | null {
  return use(WindowLayerContext)?.manager ?? null;
}

export interface WindowLayerProps extends HTMLAttributes<HTMLDivElement> {
  /** A manager made with createWindowManager, to drive the layer from outside. Default: one of its own. */
  manager?: WindowManager;
  /**
   * The name of the layer, a region. Default "Windows", in Arabic "النوافذ". The layer takes
   * focus (tabIndex -1) when the last window in it closes or minimizes and
   * nothing else can.
   */
  label?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** A positioned layer for windows. Windows inside it are placed by kind, stacked and moved inside its box. */
export function WindowLayer({ manager: given, label: labelProp, children, ref, ...rest }: WindowLayerProps) {
  const label = labelProp ?? (isArabic(useTheme().lang) ? 'النوافذ' : 'Windows');
  const [own] = useState(() => createWindowManager());
  const manager = given ?? own;
  const layer = useRef<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ manager, layer }), [manager]);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      layer.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );
  return (
    <div role="region" aria-label={label} tabIndex={-1} {...rest} ref={setRef} data-ds="window-layer">
      <WindowLayerContext value={value}>{children}</WindowLayerContext>
    </div>
  );
}
