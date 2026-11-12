'use client';
// SplitView: a list and its detail side by side, stacked on narrow widths,
// as in a mail reader. Built on the ResizablePanels group (PanelGroup): the
// same root, handle and keys, under data-ds="split-view" with the panes as
// parts primary and secondary.
//
// Sources: GoBanana desktop `MailApp.tsx` and `desktop.css` (the mail
// window: a list column and a reading pane) could not be read in this
// session; designed from the order and ResizablePanels.
//
// The DOM:
//
//   <div data-ds="split-view" data-state="split | primary | secondary" data-orientation>
//     <div data-part="primary" hidden?>                    the list
//     <div data-part="handle" role="separator">            split only
//       <span data-part="handle-grip">
//     <div data-part="secondary" tabindex="-1" hidden?>    the detail
//       <button data-ds="button" data-part="back">         stacked only
//       ...secondary content
//
// data-state comes from the root's own inline size: split from
// breakpoint.tablet (48rem) up, stacked below it. Stacked shows one pane:
// primary until the app shows the detail (showSecondary), then secondary
// with the back Button at its start. Both panes stay mounted, so the list
// keeps its scroll position.
//
// Focus: when the detail opens while stacked, focus moves to the secondary
// pane, so a screen reader starts reading it. Back hides it and returns
// focus to the element that had focus when the detail opened (the list
// item, the last element focused inside the list), else to the primary pane.
// The first render, before the width is measured and on the server, is split.
import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { useControllable } from '../Window/useControllable';
import { PanelGroup, ResizableHandle, ResizablePanel } from '../ResizablePanels/ResizablePanels';

/** auto: split from breakpoint.tablet up, stacked below. split and stacked force a layout. */
export type SplitViewLayout = 'auto' | 'split' | 'stacked';
export type SplitViewState = 'split' | 'primary' | 'secondary';

/** breakpoint.tablet, 48rem, in rem. */
const TABLET_REM = 48;
/** Media queries read rem at the initial font size, 16px; the width check does the same. */
const MEDIA_REM_PX = 16;

const splitViewLabels = {
  en: { back: 'Return to list', handle: 'Resize list', primary: 'List', secondary: 'Detail' },
  ar: { back: 'الرجوع للقائمة', handle: 'تغيير حجم القائمة', primary: 'القائمة', secondary: 'التفاصيل' },
} as const;

/** The SplitView state for a layout, a width in px and a root font size. */
export function splitViewState(layout: SplitViewLayout, width: number, rootFontPx: number, showSecondary: boolean): SplitViewState {
  const stacked = layout === 'stacked' || (layout === 'auto' && width > 0 && width < TABLET_REM * rootFontPx);
  if (!stacked) return 'split';
  return showSecondary ? 'secondary' : 'primary';
}

export interface SplitViewProps extends Omit<ComponentProps<'div'>, 'dir'> {
  /** The list, the pane that opens the detail. */
  primary: ReactNode;
  /** The detail of the chosen item, or an empty state when none is chosen. */
  secondary: ReactNode;
  /** Controlled: the detail is the pane shown while stacked. With onShowSecondaryChange. */
  showSecondary?: boolean;
  /** Default false. */
  defaultShowSecondary?: boolean;
  /** Called with true when the app opens the detail through it, and with false by the back Button. */
  onShowSecondaryChange?: (show: boolean) => void;
  /** auto (default): split from breakpoint.tablet (48rem) of the root's own width up, stacked below. */
  layout?: SplitViewLayout;
  /** Starting sizes of the two panes in percent. Default [35, 65]. */
  defaultSizes?: [number, number];
  /** Called with the settled sizes, for the app to save. */
  onLayout?: (sizes: number[]) => void;
  /** Smallest list width in percent. Default 25. */
  primaryMin?: number;
  /** Largest list width in percent. Default 50. */
  primaryMax?: number;
  /** Smallest detail width in percent. Default 35. */
  secondaryMin?: number;
  /** The name of the list pane, a region. Default "List", in Arabic under lang="ar". Name the list: Messages. */
  primaryLabel?: string;
  /** The name of the detail pane, a region. Default "Detail", in Arabic under lang="ar". Name the detail: Message. */
  secondaryLabel?: string;
  /** The name of the handle. Default "Resize list", in Arabic under lang="ar". */
  handleLabel?: string;
  /** The label of the back Button. Default "Return to list", in Arabic under lang="ar". */
  backLabel?: string;
}

/** A list and its detail: side by side on wide screens, one at a time with a back Button on narrow ones. */
export function SplitView({
  primary,
  secondary,
  showSecondary: showProp,
  defaultShowSecondary = false,
  onShowSecondaryChange,
  layout = 'auto',
  defaultSizes = [35, 65],
  onLayout,
  primaryMin = 25,
  primaryMax = 50,
  secondaryMin = 35,
  primaryLabel,
  secondaryLabel,
  handleLabel,
  backLabel,
  ref,
  ...rest
}: SplitViewProps) {
  const { lang } = useTheme();
  const labels = lang === 'ar' || lang.startsWith('ar-') ? splitViewLabels.ar : splitViewLabels.en;
  const [show, setShow] = useControllable(showProp, defaultShowSecondary, onShowSecondaryChange);
  const root = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const secondaryRef = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);

  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const read = () => setWidth(el.getBoundingClientRect().width);
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const state = splitViewState(layout, width, MEDIA_REM_PX, show);
  const stacked = state !== 'split';

  // Focus follows the stacked pane: into the detail when it opens, back to
  // the item that opened it when it closes.
  const prevShow = useRef(show);
  useLayoutEffect(() => {
    const was = prevShow.current;
    prevShow.current = show;
    if (show === was) return;
    if (show) {
      if (stacked) secondaryRef.current?.focus();
    } else if (stacked && secondaryRef.current?.contains(document.activeElement)) {
      const target = opener.current?.isConnected ? opener.current : primaryRef.current;
      target?.focus();
    }
  }, [show, stacked]);

  // When the root narrows into stacked with focus in the pane that hides,
  // focus moves to the pane that stays.
  useLayoutEffect(() => {
    if (!stacked) return;
    const hiddenPane = state === 'secondary' ? primaryRef.current : secondaryRef.current;
    const shown = state === 'secondary' ? secondaryRef.current : primaryRef.current;
    if (hiddenPane?.contains(document.activeElement)) shown?.focus();
  }, [stacked, state]);

  return (
    <PanelGroup
      {...rest}
      ref={setRoot}
      ds="split-view"
      data-state={state}
      panelParts={['primary', 'secondary']}
      defaultSizes={defaultSizes}
      onLayout={onLayout}
    >
      <ResizablePanel
        ref={primaryRef}
        min={primaryMin}
        max={primaryMax}
        tabIndex={-1}
        hidden={state === 'secondary'}
        role="region"
        aria-label={primaryLabel ?? labels.primary}
        onFocus={(event) => {
          // The last focused element in the list is the one that opened the detail.
          if (event.target !== event.currentTarget) opener.current = event.target;
        }}
      >
        {primary}
      </ResizablePanel>
      {!stacked && <ResizableHandle label={handleLabel ?? labels.handle} />}
      <ResizablePanel
        ref={secondaryRef}
        min={secondaryMin}
        tabIndex={-1}
        hidden={state === 'primary'}
        role="region"
        aria-label={secondaryLabel ?? labels.secondary}
      >
        {stacked && (
          <Button data-part="back" emphasis="ghost" size="sm" start="arrow-back" onClick={() => setShow(false)}>
            {backLabel ?? labels.back}
          </Button>
        )}
        {secondary}
      </ResizablePanel>
    </PanelGroup>
  );
}
