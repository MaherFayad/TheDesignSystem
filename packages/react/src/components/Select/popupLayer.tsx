'use client';
// The themed portal layer the pickers of lane 3D share (Select, MultiSelect,
// TagField). A portal lands in <body>, outside every Theme element, so the
// popup is wrapped in a Theme that copies every axis of the Theme it is
// rendered in, marked data-menu-layer (DropdownMenu.css draws that layer as
// display contents). Not exported from the package barrel.
//
// The same logic as the layer inside ComboboxBase, which does not export it.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';

/** Wraps children in a Theme with the axes of the current one, for content that is portaled out of it. */
export function useThemedLayer() {
  const theme = useTheme();
  return (children: ReactNode) => (
    <Theme
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={theme.dir}
      lang={theme.lang}
      data-menu-layer=""
    >
      {children}
    </Theme>
  );
}

/**
 * Portals its child into <body> inside the themed layer while `open`, and
 * keeps it there until the content has played its exit and unmounted: pass
 * `onContent` as the ref of the content (Radix Presence calls it with null
 * once the exit animation is done, at once under reduced motion).
 */
export function usePopupLayer(open: boolean) {
  const wrap = useThemedLayer();
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => setBody(document.body), []);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const openRef = useRef(open);
  openRef.current = open;
  const onContent = useCallback((node: HTMLElement | null) => {
    if (!node && !openRef.current) setMounted(false);
  }, []);
  const render = (children: ReactNode) => (body && mounted ? createPortal(wrap(children), body) : null);
  return { render, onContent };
}
