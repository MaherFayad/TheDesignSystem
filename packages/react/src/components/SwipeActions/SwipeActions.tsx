'use client';
// SwipeActions (order M9.7, proposed): actions hidden at either side of one
// row, revealed by a horizontal swipe, with a menu of the same actions as the
// path that needs no drag (WCAG 2.2 2.5.7).
//
// Two forms, one behavior:
// - In a List, pass it to ListItem as `swipe`. The row's own parts (start,
//   title, description, end, actions) are the content: they belong to the
//   List root, so they stay direct children of the row and move by the
//   List's own property. SwipeActions renders its root inside the row as the
//   List part `swipe`, holding the action groups and the menu.
// - Anywhere else, wrap the content: the root holds a `content` part.
//
// DOM (the List form):
//
//   <li data-part="item">  ...row parts, moved by --_list-shift...
//     <div data-ds="swipe-actions" data-part="swipe" data-state data-dragging data-armed data-settling>
//       <div data-part="actions" data-side="start" data-tone role="group" inert>  Buttons, part action
//       <div data-part="actions" data-side="end" data-tone role="group" inert>
//       IconButton, part menu, opening a DropdownMenu of every action
//
// The gesture: a touch or pen press that moves SWIPE_SLOP px more across
// than down becomes a swipe and takes pointer capture; a steeper move is
// left to the page scroll. A mouse drags only with `pointer`. The content
// follows the finger (the offset is written as an inline property, no React
// render per move); on release it springs open, closed, or past the full
// swipe threshold runs the first action of that side (logic in
// @the-system/shared swipe.ts). One row is open at a time; a press outside
// the row, a tap on the open row's content, Escape, or choosing an action
// closes it. The click that ends a swipe is swallowed, so a row link does not
// follow.
//
// The menu: an IconButton named by `menuLabel`, always in the accessibility
// tree, drawn when the pointer is a mouse or focus is in the row, and opened
// by Shift+F10 or the context menu key anywhere in the row. It lists every
// action of both sides. Action groups are inert while closed, so a reader and
// Tab meet only the menu.
//
// While the row is shifted (dragging, open, or settling back), transforms
// apply; once it is closed and settled no transform is left, so the row
// link's hit area covers the row again. The settle is awaited through the
// Web Animations API `finished` promise of the CSS transitions, never through
// transitionend; with a 0ms duration (reduced motion) there is none to wait on.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type PointerEvent,
  type PointerEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import type { IconName } from '@the-system/icons/react';
import {
  SWIPE_MAX_ACTIONS,
  SWIPE_SWALLOW_CLICK_MS,
  defaultSwipeFull,
  isSwipeMenuKey,
  swipeArmed,
  swipeAxis,
  swipeDrawnOffset,
  swipeRelease,
  swipeRestOffset,
  swipeVelocity,
  toInline,
  toPhysical,
  type SwipeFull,
  type SwipeSample,
  type SwipeSide,
  type SwipeSizes,
  type SwipeState,
  type Tone,
} from '@the-system/shared';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../DropdownMenu';

export type SwipeActionTone = Extract<Tone, 'neutral' | 'accent' | 'warning' | 'danger'>;
export type SwipeActionsFull = SwipeFull;
export type SwipeActionsState = SwipeState;

export interface SwipeAction {
  /** Visible text under the icon and the name in the menu. English: a verb. Arabic: a noun form. */
  label: string;
  /** A system icon name, drawn above the label. */
  icon?: IconName;
  /** The fill: neutral (gray), accent, warning or danger. Default neutral. */
  tone?: SwipeActionTone;
  /** Runs on a press of the action, its menu item, or a full swipe when it is first on its side. */
  onSelect: () => void;
  /** The app can undo this action (an Undo in a toast). A first end action that is danger runs by a full swipe only when this is true. */
  undoable?: boolean;
}

export interface SwipeActionsOptions {
  /** Actions at the inline start (the left in English, the right in Arabic), revealed by a swipe toward the inline end. At most three; the first sits at the edge. */
  start?: SwipeAction[];
  /** Actions at the inline end (the right in English, the left in Arabic), revealed by a swipe toward the inline start. At most three; the first sits at the edge. */
  end?: SwipeAction[];
  /**
   * The side whose first action a long swipe runs, or none. Default: end when
   * the first end action is not danger or is undoable, else none.
   */
  fullSwipe?: SwipeActionsFull;
  /** The name of the menu button and of each action group: Actions for Sara Alqahtani. Required. */
  menuLabel: string;
  /** Lets a mouse drag the row too. Touch and pen always can. Default false. */
  pointer?: boolean;
}

export interface SwipeActionsProps extends SwipeActionsOptions, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The content that moves. Leave it out when passing SwipeActions to ListItem as `swipe`: the row is the content. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** The one row that is open on the page. Opening another closes it. */
let openRow: { close: () => void } | null = null;

interface Run {
  id: number;
  x0: number;
  y0: number;
  from: number;
  fromState: SwipeState;
  offset: number;
  moved: boolean;
  dir: 'ltr' | 'rtl';
  sizes: SwipeSizes;
  samples: SwipeSample[];
}

type HostHandlers<T extends HTMLElement> = {
  onPointerDown?: PointerEventHandler<T>;
  onPointerMove?: PointerEventHandler<T>;
  onPointerUp?: PointerEventHandler<T>;
  onPointerCancel?: PointerEventHandler<T>;
  onLostPointerCapture?: PointerEventHandler<T>;
  onPointerLeave?: PointerEventHandler<T>;
  onClickCapture?: MouseEventHandler<T>;
  onKeyDown?: KeyboardEventHandler<T>;
};

/** The width the buttons of an action group take on screen. */
function groupWidth(panel: HTMLElement | null): number {
  if (!panel) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const child of Array.from(panel.children)) {
    const r = child.getBoundingClientRect();
    min = Math.min(min, r.left);
    max = Math.max(max, r.right);
  }
  return max > min ? max - min : 0;
}

function assign<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** The private property SwipeActions.css reads for the move, in screen px. */
const SHIFT = '--_swipe-actions-x';

export interface SwipeController<T extends HTMLElement> {
  /** Wraps the host's own handlers (the row or the root) with the swipe's. */
  handlers: (own: HostHandlers<T>) => Required<HostHandlers<T>>;
  /** Ref for the host: the element whose content moves. */
  hostRef: (el: T | null) => void;
  /** Ref for the SwipeActions root (the same element as the host in the standalone form). */
  rootRef: (el: HTMLDivElement | null) => void;
  /** The root's state attributes. */
  attrs: Record<string, string | undefined>;
  /** The action groups and the menu, as children of the root. */
  parts: ReactNode;
  /** True when the options are absent: the hook does nothing. */
  off: boolean;
}

/**
 * The swipe behavior. `hostVar` is a second inline property to write the
 * move into on the host (the List row's own, for its parts). Exported for
 * ListItem; not part of the package API.
 */
export function useSwipeController<T extends HTMLElement>(opts: SwipeActionsOptions | null, hostVar?: string): SwipeController<T> {
  const start = (opts?.start ?? []).slice(0, SWIPE_MAX_ACTIONS);
  const end = (opts?.end ?? []).slice(0, SWIPE_MAX_ACTIONS);
  const full: SwipeFull = opts?.fullSwipe ?? defaultSwipeFull(end);
  const pointer = opts?.pointer ?? false;
  const off = opts === null;

  const [state, setState] = useState<SwipeState>('closed');
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const [settling, setSettling] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const host = useRef<T | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const startPanel = useRef<HTMLDivElement | null>(null);
  const endPanel = useRef<HTMLDivElement | null>(null);
  const menuButton = useRef<HTMLButtonElement | null>(null);
  const run = useRef<Run | null>(null);
  const swallowUntil = useRef(0);
  const stateRef = useRef<SwipeState>('closed');
  stateRef.current = state;

  const write = useCallback(
    (offset: number, dir: 'ltr' | 'rtl') => {
      const x = `${toPhysical(offset, dir)}px`;
      root.current?.style.setProperty(SHIFT, x);
      if (hostVar && host.current && host.current !== (root.current as unknown)) host.current.style.setProperty(hostVar, x);
    },
    [hostVar],
  );

  const measure = (): SwipeSizes => ({
    start: start.length > 0 ? groupWidth(startPanel.current) : 0,
    end: end.length > 0 ? groupWidth(endPanel.current) : 0,
    row: host.current?.getBoundingClientRect().width ?? 0,
  });

  const directionOf = (): 'ltr' | 'rtl' => (host.current && getComputedStyle(host.current).direction === 'rtl' ? 'rtl' : 'ltr');

  /** Springs back to closed. Focus inside an action group moves to the menu button first, as the group turns inert. */
  const close = useCallback(() => {
    const r = root.current;
    if (r && r.contains(r.ownerDocument.activeElement) && !menuButton.current?.contains(r.ownerDocument.activeElement)) {
      menuButton.current?.focus();
    }
    run.current = null;
    setDragging(false);
    setArmed(false);
    const shifted = Number.parseFloat(r?.style.getPropertyValue(SHIFT) || '0') !== 0;
    if (stateRef.current !== 'closed' || shifted) setSettling((n) => n + 1);
    setState('closed');
    write(0, 'ltr');
  }, [write]);

  const closeRef = useRef(close);
  closeRef.current = close;
  const self = useRef({ close: () => closeRef.current() });

  // One row open at a time.
  useEffect(() => {
    if (state === 'closed') {
      if (openRow === self.current) openRow = null;
      return;
    }
    if (openRow && openRow !== self.current) openRow.close();
    openRow = self.current;
  }, [state]);

  useEffect(
    () => () => {
      if (openRow === self.current) openRow = null;
    },
    [],
  );

  // A press outside the open row closes it.
  useEffect(() => {
    if (state === 'closed') return;
    const doc = host.current?.ownerDocument;
    if (!doc) return;
    const onDown = (event: Event) => {
      const target = event.target as Node | null;
      if (target && host.current?.contains(target)) return;
      closeRef.current();
    };
    doc.addEventListener('pointerdown', onDown, true);
    return () => doc.removeEventListener('pointerdown', onDown, true);
  }, [state]);

  // Settling: keep the shift attribute until the transform transitions end (WAAPI finished), or at once when none run.
  useLayoutEffect(() => {
    if (settling === 0) return;
    const el = host.current;
    const done = () => setSettling(0);
    if (!el || typeof el.getAnimations !== 'function') {
      done();
      return;
    }
    const moving = el
      .getAnimations({ subtree: true })
      .filter((a) => (a as Animation & { transitionProperty?: string }).transitionProperty === 'transform');
    if (moving.length === 0) {
      done();
      return;
    }
    let live = true;
    void Promise.allSettled(moving.map((a) => a.finished)).then(() => {
      if (live && !run.current) done();
    });
    return () => {
      live = false;
    };
  }, [settling]);

  const inGroupOrMenu = (target: EventTarget | null): boolean => {
    const el = target instanceof Element ? target : null;
    const part = el?.closest("[data-part='actions'], [data-part='menu']");
    return Boolean(part && root.current?.contains(part));
  };

  const finish = (r: Run, timeStamp: number) => {
    r.samples.push({ t: timeStamp, offset: r.offset });
    const result = swipeRelease(r.offset, swipeVelocity(r.samples), r.sizes, full);
    run.current = null;
    swallowUntil.current = performance.now() + SWIPE_SWALLOW_CLICK_MS;
    setDragging(false);
    setArmed(false);
    if (result.run) {
      const action = (result.run === 'start' ? start : end)[0];
      close();
      action?.onSelect();
      return;
    }
    if (result.state === 'closed') {
      close();
      return;
    }
    setState(result.state);
    write(swipeRestOffset(result.state, r.sizes), r.dir);
  };

  const cancel = (r: Run) => {
    run.current = null;
    setDragging(false);
    setArmed(false);
    if (r.fromState === 'closed') close();
    else write(r.from, r.dir);
  };

  const handlers = (own: HostHandlers<T>): Required<HostHandlers<T>> => ({
    onPointerDown: (e: PointerEvent<T>) => {
      own.onPointerDown?.(e);
      if (off || e.defaultPrevented || e.button !== 0 || !e.isPrimary) return;
      if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) return;
      if (inGroupOrMenu(e.target)) return;
      const draggable = e.pointerType !== 'mouse' || pointer;
      if (!draggable && stateRef.current === 'closed') return;
      const sizes = measure();
      const dir = directionOf();
      const from = swipeRestOffset(stateRef.current, sizes);
      run.current = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        from,
        fromState: stateRef.current,
        offset: from,
        moved: false,
        dir,
        sizes,
        samples: [{ t: e.timeStamp, offset: from }],
      };
    },
    onPointerMove: (e: PointerEvent<T>) => {
      own.onPointerMove?.(e);
      const r = run.current;
      if (!r || e.pointerId !== r.id) return;
      if (e.pointerType === 'mouse' && !pointer) return;
      const dx = e.clientX - r.x0;
      if (!r.moved) {
        const axis = swipeAxis(dx, e.clientY - r.y0);
        if (axis === 'pending') return;
        if (axis === 'vertical') {
          run.current = null;
          return;
        }
        r.moved = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        if (openRow && openRow !== self.current) openRow.close();
        setSettling(0);
        setDragging(true);
      }
      const drawn = swipeDrawnOffset(r.from + toInline(dx, r.dir), r.sizes, full);
      r.offset = drawn;
      r.samples.push({ t: e.timeStamp, offset: drawn });
      if (r.samples.length > 24) r.samples.splice(0, r.samples.length - 24);
      write(drawn, r.dir);
      const now = swipeArmed(drawn, r.sizes, full);
      setArmed((was) => (was === now ? was : now));
    },
    onPointerUp: (e: PointerEvent<T>) => {
      own.onPointerUp?.(e);
      const r = run.current;
      if (!r || e.pointerId !== r.id) return;
      if (r.moved) {
        finish(r, e.timeStamp);
        return;
      }
      run.current = null;
      // A tap on the content of an open row closes it, and its click does nothing else.
      if (r.fromState !== 'closed') {
        swallowUntil.current = performance.now() + SWIPE_SWALLOW_CLICK_MS;
        close();
      }
    },
    onPointerCancel: (e: PointerEvent<T>) => {
      own.onPointerCancel?.(e);
      const r = run.current;
      if (!r || e.pointerId !== r.id) return;
      if (r.moved) cancel(r);
      else run.current = null;
    },
    onLostPointerCapture: (e: PointerEvent<T>) => {
      own.onLostPointerCapture?.(e);
      const r = run.current;
      // Touch captures to the pressed child at first; taking capture on the host makes that child lose it, and
      // that event bubbles here. Only the host's own loss ends the swipe.
      if (r && e.pointerId === r.id && r.moved && e.target === e.currentTarget) cancel(r);
    },
    onPointerLeave: (e: PointerEvent<T>) => {
      own.onPointerLeave?.(e);
    },
    onClickCapture: (e: MouseEvent<T>) => {
      own.onClickCapture?.(e);
      if (off || inGroupOrMenu(e.target)) return;
      if (swallowUntil.current > performance.now()) {
        swallowUntil.current = 0;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      swallowUntil.current = 0;
      // A pointer click on the content of an open row closes it (a key press on a link still follows it).
      if (stateRef.current !== 'closed' && e.detail > 0) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    },
    onKeyDown: (e: KeyboardEvent<T>) => {
      own.onKeyDown?.(e);
      if (off || e.defaultPrevented) return;
      if (isSwipeMenuKey(e.key, e.shiftKey)) {
        e.preventDefault();
        setMenuOpen(true);
        return;
      }
      if (e.key === 'Escape' && stateRef.current !== 'closed') {
        e.preventDefault();
        close();
      }
    },
  });

  const choose = (action: SwipeAction) => {
    close();
    action.onSelect();
  };

  const group = (side: SwipeSide, actions: SwipeAction[], ref: typeof startPanel) => {
    if (actions.length === 0) return null;
    // The first action sits at the outer edge: the start group reads in order, the end group in reverse.
    const drawn = side === 'start' ? actions : [...actions].reverse();
    const open = state === (side === 'start' ? 'open-start' : 'open-end');
    return (
      <div
        ref={ref}
        data-part="actions"
        data-side={side}
        data-tone={actions[0]?.tone ?? 'neutral'}
        role="group"
        aria-label={opts?.menuLabel}
        inert={!open}
      >
        {drawn.map((action) => (
          <Button
            key={action.label}
            data-part="action"
            tone={action.tone ?? 'neutral'}
            emphasis="solid"
            start={action.icon}
            onClick={() => choose(action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  const parts = off ? null : (
    <>
      {group('start', start, startPanel)}
      {group('end', end, endPanel)}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        {/* An unnamed span places and moves the menu button, so the button keeps its own press transform. */}
        <span>
          <DropdownMenuTrigger>
            <IconButton ref={menuButton} data-part="menu" icon="more" label={opts?.menuLabel ?? ''} />
          </DropdownMenuTrigger>
        </span>
        <DropdownMenuContent align="end">
          {start.map((action) => (
            <DropdownMenuItem key={`start-${action.label}`} start={action.icon} tone={action.tone === 'danger' ? 'danger' : 'neutral'} onSelect={() => choose(action)}>
              {action.label}
            </DropdownMenuItem>
          ))}
          {start.length > 0 && end.length > 0 && <DropdownMenuSeparator />}
          {end.map((action) => (
            <DropdownMenuItem key={`end-${action.label}`} start={action.icon} tone={action.tone === 'danger' ? 'danger' : 'neutral'} onSelect={() => choose(action)}>
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const hostRef = useCallback((el: T | null) => {
    host.current = el;
  }, []);
  const rootRef = useCallback((el: HTMLDivElement | null) => {
    root.current = el;
  }, []);

  return {
    handlers,
    hostRef,
    rootRef,
    off,
    parts,
    attrs: {
      'data-state': state,
      'data-dragging': dragging ? '' : undefined,
      'data-armed': armed ? '' : undefined,
      'data-settling': settling > 0 && !dragging ? '' : undefined,
    },
  };
}

/**
 * Actions at either side of one piece of content, revealed by a horizontal
 * swipe, and a menu of the same actions. In a List pass it to ListItem as
 * `swipe` with no children.
 */
export function SwipeActions({ start, end, fullSwipe, menuLabel, pointer, children, ref, ...rest }: SwipeActionsProps) {
  const swipe = useSwipeController<HTMLDivElement>({ start, end, fullSwipe, menuLabel, pointer });
  const { hostRef, rootRef } = swipe;
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      hostRef(el);
      rootRef(el);
      assign(ref, el);
    },
    [hostRef, rootRef, ref],
  );
  return (
    <div
      {...rest}
      {...swipe.handlers({
        onPointerDown: rest.onPointerDown,
        onPointerMove: rest.onPointerMove,
        onPointerUp: rest.onPointerUp,
        onPointerCancel: rest.onPointerCancel,
        onLostPointerCapture: rest.onLostPointerCapture,
        onPointerLeave: rest.onPointerLeave,
        onClickCapture: rest.onClickCapture,
        onKeyDown: rest.onKeyDown,
      })}
      ref={setRef}
      data-ds="swipe-actions"
      {...swipe.attrs}
    >
      <div data-part="content">{children}</div>
      {swipe.parts}
    </div>
  );
}
