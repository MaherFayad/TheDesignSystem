'use client';
// ResizablePanels: two or more panels with draggable dividers, for editor
// layouts. Hand built on the WAI-ARIA window splitter pattern: each handle is
// a focusable separator whose value is the size of the panel before it, in
// percent. The math lives in @the-system/shared (resize.ts), so Angular and
// React Native share it.
//
// Sources: none for this component (the order says so). Designed from the
// dials table, the Studio shell sidebar widths (shell.sidebar.width.*) and
// the key map of a slider: arrows step, Home and End jump to the ends.
//
// The DOM:
//
//   <div data-ds="resizable-panels" data-orientation>          root, a flex row or column
//     <div data-part="panel" id data-collapsed? inert?>        ResizablePanel
//     <div data-part="handle" role="separator" tabindex="0"
//          aria-valuenow aria-controls data-orientation data-dragging?>   ResizableHandle
//       <span data-part="handle-grip" aria-hidden>
//     <div data-part="panel">
//
// Sizes are percents of the group that add up to 100. A panel's size is its
// flex grow factor on a 0 basis, so the 1px handles come out of the room
// before it is shared. Children are walked in order: the n-th panel gets
// index n, and a handle sits between the panel before it and the next one.
// Panels and handles must be direct children (fragments are fine).
//
// Direction: in a horizontal group the panels follow the reading direction,
// so the first panel is on the right in Arabic. A drag to the right and
// ArrowRight move the handle to the right on screen in both directions,
// which grows the panel before it in LTR and shrinks it in RTL.
//
// Persistence: the component keeps no storage. onLayout reports the sizes
// when a drag ends and after each key, for the app to save; pass them back
// as defaultSizes (or sizes) on the next load.
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  RESIZE_STEP,
  clampSizes,
  collapsePanel,
  collapseTarget,
  expandPanel,
  isCollapsed,
  panelLimits,
  resizeBy,
  resizeToEdge,
  type PanelLimits,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';

/** horizontal: panels side by side with vertical dividers. vertical: panels stacked. */
export type ResizablePanelsOrientation = 'horizontal' | 'vertical';

const handleLabels = {
  en: 'Resize panels',
  ar: 'تغيير حجم الأقسام',
} as const;

interface GroupContextValue {
  orientation: ResizablePanelsOrientation;
  sizes: number[];
  limits: PanelLimits[];
  panelIds: string[];
  lang: string;
  dir: 'ltr' | 'rtl';
  step: number;
  /** Applies new sizes; settled ones also go to onLayout. */
  commit: (next: number[], settled: boolean) => void;
  /** The root element, to measure the group. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** The size each collapsed panel had before it collapsed. */
  restoreSizes: RefObject<number[]>;
  /** The data-part of each panel: panel, or the names a component built on the group gives them. */
  panelParts?: readonly string[];
}

const GroupContext = createContext<GroupContextValue | null>(null);
/** The index of a panel, or of a handle (the panel before it). */
const IndexContext = createContext<number>(-1);

function useGroup(name: string): GroupContextValue {
  const ctx = use(GroupContext);
  if (!ctx) throw new Error(`${name} must be a direct child of ResizablePanels.`);
  return ctx;
}

// ------------------------------------------------------------------ ResizablePanels

export interface ResizablePanelsProps extends Omit<ComponentProps<'div'>, 'dir' | 'onChange'> {
  /** horizontal: panels side by side (default). vertical: panels stacked. */
  orientation?: ResizablePanelsOrientation;
  /** Controlled sizes in percent, one per panel, with onSizesChange. */
  sizes?: number[];
  /** Starting sizes in percent. Default: each panel's defaultSize, the rest shared evenly. */
  defaultSizes?: number[];
  /** Called on every change, while a drag runs too. */
  onSizesChange?: (sizes: number[]) => void;
  /** Called with the settled sizes: when a drag ends and after each key. Save them here to restore the layout. */
  onLayout?: (sizes: number[]) => void;
  /** The arrow key step in percent. Default 5. */
  step?: number;
  /** ResizablePanel and ResizableHandle elements, in order. */
  children?: ReactNode;
}

/** The children in order, with fragments and arrays opened. */
function flatten(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) out.push(...flatten(child.props.children));
    else out.push(child);
  }
  return out;
}

/** Reads the panel props of the children, in order. */
function readPanels(children: ReactNode): ResizablePanelProps[] {
  const out: ResizablePanelProps[] = [];
  for (const child of flatten(children)) {
    if (isValidElement(child) && child.type === ResizablePanel) out.push(child.props as ResizablePanelProps);
  }
  return out;
}

/** Starting sizes: the given ones, else each panel's defaultSize with the rest shared by the panels that gave none. */
function initialSizes(panels: ResizablePanelProps[], defaults: number[] | undefined): number[] {
  if (defaults && defaults.length === panels.length) return defaults;
  const given = panels.reduce((sum, p) => sum + (p.defaultSize ?? 0), 0);
  const open = panels.filter((p) => p.defaultSize === undefined).length;
  const share = open > 0 ? Math.max(0, 100 - given) / open : 0;
  return panels.map((p) => p.defaultSize ?? share);
}

/** A group of resizable panels with handles between them. */
export function ResizablePanels(props: ResizablePanelsProps) {
  return <PanelGroup {...props} ds="resizable-panels" />;
}

/** Props of the group base that a component built on it (SplitView) adds. */
export interface PanelGroupProps extends ResizablePanelsProps {
  /** The root's data-ds. */
  ds: string;
  /** The data-part of each panel, in order. Default panel. */
  panelParts?: readonly string[];
}

/**
 * The group base: ResizablePanels, and SplitView, which renders the same
 * group under its own data-ds with its own panel part names (anatomy.md,
 * rule 10: a component built on another's base).
 */
export function PanelGroup({
  ds,
  panelParts,
  orientation = 'horizontal',
  sizes: sizesProp,
  defaultSizes,
  onSizesChange,
  onLayout,
  step = RESIZE_STEP,
  children,
  ref,
  ...rest
}: PanelGroupProps) {
  const { dir, lang } = useTheme();
  const panels = readPanels(children);
  // The limits change only when a panel's limit props change, so they are
  // keyed by those values and parsed back.
  const limitsKey = JSON.stringify(panels.map((p) => [p.min, p.max, p.collapsible, p.collapsedSize]));
  const limits = useMemo(
    () =>
      (JSON.parse(limitsKey) as [number | null, number | null, boolean | null, number | null][]).map(([min, max, collapsible, collapsedSize]) =>
        panelLimits({ min: min ?? undefined, max: max ?? undefined, collapsible: collapsible ?? undefined, collapsedSize: collapsedSize ?? undefined }),
      ),
    [limitsKey],
  );
  const [inner, setInner] = useState(() => initialSizes(panels, defaultSizes));
  const raw = sizesProp ?? inner;
  const sizes = useMemo(() => clampSizes(raw, limits), [raw, limits]);
  const restoreSizes = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();
  const panelIds = panels.map((p, i) => p.id ?? `${baseId}-panel-${i}`);

  const commit = useCallback(
    (next: number[], settled: boolean) => {
      if (sizesProp === undefined) setInner(next);
      onSizesChange?.(next);
      if (settled) onLayout?.(next);
    },
    [sizesProp, onSizesChange, onLayout],
  );

  const value: GroupContextValue = {
    orientation,
    sizes,
    limits,
    panelIds,
    lang,
    dir,
    step,
    commit,
    rootRef,
    restoreSizes,
    panelParts,
  };

  let panelIndex = -1;
  const ordered = flatten(children).map((child, i) => {
    if (!isValidElement(child)) return child;
    if (child.type === ResizablePanel) {
      panelIndex += 1;
      return (
        <IndexContext key={child.key ?? i} value={panelIndex}>
          {child}
        </IndexContext>
      );
    }
    if (child.type === ResizableHandle) {
      return (
        <IndexContext key={child.key ?? i} value={panelIndex}>
          {child}
        </IndexContext>
      );
    }
    return child;
  });

  return (
    <div
      {...rest}
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      data-ds={ds}
      data-orientation={orientation}
    >
      <GroupContext value={value}>{ordered}</GroupContext>
    </div>
  );
}

// ------------------------------------------------------------------ ResizablePanel

export interface ResizablePanelProps extends ComponentProps<'div'> {
  /** The starting size in percent, when the group has no defaultSizes. */
  defaultSize?: number;
  /** Smallest open size in percent. Default 0. */
  min?: number;
  /** Largest size in percent. Default 100. */
  max?: number;
  /** The panel collapses when dragged past half its min, and with Enter on a handle next to it. Default false. */
  collapsible?: boolean;
  /** The collapsed size in percent. Default 0, which hides the panel and takes its content out of the tab order. */
  collapsedSize?: number;
  children?: ReactNode;
}

/** One panel. A direct child of ResizablePanels. */
export function ResizablePanel({
  defaultSize: _defaultSize,
  min: _min,
  max: _max,
  collapsible: _collapsible,
  collapsedSize: _collapsedSize,
  style,
  children,
  ...rest
}: ResizablePanelProps) {
  const group = useGroup('ResizablePanel');
  const index = use(IndexContext);
  const size = group.sizes[index] ?? 0;
  const limits = group.limits[index];
  const collapsed = limits ? isCollapsed(size, limits) : false;
  const hidden = collapsed && size === 0;
  return (
    <div
      {...rest}
      id={group.panelIds[index]}
      data-part={group.panelParts?.[index] ?? 'panel'}
      data-collapsed={collapsed ? '' : undefined}
      inert={hidden || undefined}
      style={{ ...style, '--_resizable-panels-size': size } as CSSProperties}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ ResizableHandle

export interface ResizableHandleProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * The accessible name of the separator. Name the panel it resizes:
   * "Resize sidebar". Default "Resize panels", in Arabic under lang="ar".
   */
  label?: string;
}

/** The divider between two panels: drag it, or focus it and use the keys. */
export function ResizableHandle({ label, onKeyDown, onPointerDown, ...rest }: ResizableHandleProps) {
  const group = useGroup('ResizableHandle');
  const handle = use(IndexContext);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ start: number; sizes: number[]; px: number } | null>(null);
  const { orientation, sizes, limits, dir, step, commit, restoreSizes } = group;
  const before = limits[handle];
  const after = limits[handle + 1];
  const horizontal = orientation === 'horizontal';
  const name = label ?? (group.lang === 'ar' || group.lang.startsWith('ar-') ? handleLabels.ar : handleLabels.en);

  const toggle = () => {
    const target = collapseTarget(limits, handle);
    if (target < 0) return;
    const l = limits[target] as PanelLimits;
    if (isCollapsed(sizes[target] ?? 0, l)) {
      commit(expandPanel(sizes, limits, target, restoreSizes.current[target], handle), true);
    } else {
      restoreSizes.current[target] = sizes[target] ?? l.min;
      commit(collapsePanel(sizes, limits, target, handle), true);
    }
  };

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !before || !after) return;
    // +1 moves the handle toward the end of the reading order.
    let sign = 0;
    if (horizontal && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      sign = event.key === 'ArrowRight' ? 1 : -1;
      if (dir === 'rtl') sign = -sign;
    } else if (!horizontal && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      sign = event.key === 'ArrowDown' ? 1 : -1;
    }
    let next: number[] | null = null;
    if (sign !== 0) {
      const sb = sizes[handle] ?? 0;
      const sa = sizes[handle + 1] ?? 0;
      // An arrow that opens a collapsed panel opens it at its last size.
      if (sign > 0 && isCollapsed(sb, before)) next = expandPanel(sizes, limits, handle, restoreSizes.current[handle], handle);
      else if (sign < 0 && isCollapsed(sa, after)) next = expandPanel(sizes, limits, handle + 1, restoreSizes.current[handle + 1], handle);
      else next = resizeBy(sizes, limits, handle, sign * step);
    } else if (event.key === 'Home') {
      next = resizeToEdge(sizes, limits, handle, 'min');
    } else if (event.key === 'End') {
      next = resizeToEdge(sizes, limits, handle, 'max');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      toggle();
      return;
    }
    if (next) {
      event.preventDefault();
      commit(next, true);
    }
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    const root = group.rootRef.current;
    if (!root) return;
    // The room the panels share: the sum of their measured sizes.
    const px = Array.from(root.children)
      .filter((el) => el.matches(':not([data-part="handle"])[data-part]') && !el.hasAttribute('hidden'))
      .reduce((sum, el) => sum + (horizontal ? el.getBoundingClientRect().width : el.getBoundingClientRect().height), 0);
    drag.current = { start: horizontal ? event.clientX : event.clientY, sizes: [...sizes], px };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.focus();
    setDragging(true);
    event.preventDefault();
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.px <= 0) return;
    let deltaPx = (horizontal ? event.clientX : event.clientY) - d.start;
    if (horizontal && dir === 'rtl') deltaPx = -deltaPx;
    commit(resizeBy(d.sizes, limits, handle, (deltaPx / d.px) * 100), false);
  };

  const pointerEnd = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (!drag.current) return;
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    // A cancelled drag puts the sizes back; a press with no move reports nothing.
    if (cancelled) {
      commit(d.sizes, false);
      return;
    }
    if (d.sizes.every((v, i) => Math.abs(v - (sizes[i] ?? 0)) < 0.01)) return;
    // A collapse by drag remembers the size the panel had when the drag began.
    for (const i of [handle, handle + 1]) {
      const l = limits[i];
      if (l && isCollapsed(sizes[i] ?? 0, l) && !isCollapsed(d.sizes[i] ?? 0, l)) restoreSizes.current[i] = d.sizes[i] ?? l.min;
    }
    commit(sizes, true);
  };

  // The range is what Home and End reach; a collapsed panel sits below it.
  const now = Math.round(sizes[handle] ?? 0);
  const min = Math.min(now, Math.round(resizeToEdge(sizes, limits, handle, 'min')[handle] ?? 0));
  const max = Math.max(now, Math.round(resizeToEdge(sizes, limits, handle, 'max')[handle] ?? 100));

  return (
    <div
      {...rest}
      role="separator"
      tabIndex={0}
      aria-label={name}
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={now}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-controls={group.panelIds[handle]}
      data-part="handle"
      data-orientation={orientation}
      data-dragging={dragging ? '' : undefined}
      onKeyDown={keyDown}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={(event) => pointerEnd(event, false)}
      onPointerCancel={(event) => pointerEnd(event, true)}
      onDoubleClick={toggle}
    >
      <span data-part="handle-grip" aria-hidden="true" />
    </div>
  );
}
