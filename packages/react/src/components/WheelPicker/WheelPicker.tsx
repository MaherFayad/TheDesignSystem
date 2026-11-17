'use client';
// WheelPicker (order M9.16, proposed): one to three scrolling columns with
// the chosen row of each in a band across the middle, the wheel used for a
// time of day or any short list of values.
//
// The DOM:
//
//   <div data-ds="wheel-picker" role="group" aria-label data-disabled?>
//     <div data-part="band" aria-hidden="true">                 the selection band, behind the columns
//     <div data-part="column" role="spinbutton" tabindex="0" aria-label aria-valuenow aria-valuetext data-dragging?>
//       <div data-part="option" aria-hidden="true" data-selected? data-centered? data-disabled?><span>41</span></div>
//       ...
//
// Decisions:
// - Each column is a spinbutton (plan M9.16), the one focus stop of the
//   column, named by the column label and read by its value text. The rows
//   are drawn text, hidden from readers: the spinbutton says the value.
// - The column is a scroll container with CSS scroll snap: a finger or a
//   mouse wheel scrolls it as the browser scrolls anything, and the browser
//   snaps a row to the band. No animation library. When the scroll rests
//   (scrollend, or a short quiet time where scrollend is missing, and never
//   while a finger is down) the row in the band is the value.
// - A mouse drag scrolls too (web): the column follows the pointer with snap
//   off, then glides to the row the release speed points at (dragVelocity
//   and DETENT_PROJECTION from @the-system/motion), and snap comes back.
// - The paths that need no drag (WCAG 2.2 2.5.7): a tap or click on any
//   visible row chooses it, and the keys: Up and Down step, PageUp and
//   PageDown step five, Home and End go to the ends, typed digits jump, Left
//   and Right move between columns (mirrored in right to left).
// - A looping column renders its rows several times (wheelLoopCopies) and,
//   once at rest, moves back to the middle copy by an exact number of rows,
//   which looks the same.
// - The curve: on scroll each row near the band gets --_wheel-picker-d, its
//   distance from the band in rows, written straight to its style (no React
//   render per frame). The CSS turns it into a transform of the row's inner
//   span, never of the row itself: a scroll snap area follows its box's
//   transform, so a transformed row would move the snap points and the
//   wheel would rest a row off. The row in the band gets data-centered while
//   it is there. Nothing animates layout.
// - Reduced motion: keys and taps jump instead of gliding, and the CSS
//   drops the curve. A finger still scrolls, and values still change.
// - Haptic ticks: onTick is called each time a new row crosses the band
//   under a finger, a drag or a mouse wheel. It is the hook for the
//   feedback helper of order R3.9, which is not built; until it is, the
//   wheel makes no haptic of its own and onTick is for apps.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { DETENT_PROJECTION, dragVelocity, prefersReducedMotion, readDir, type DragSample } from '@the-system/motion';
import {
  WHEEL_CURVE_MAX,
  WHEEL_PAGE_STEP,
  WHEEL_TYPEAHEAD_MS,
  wheelDistance,
  wheelEdge,
  wheelIndexOf,
  wheelLoopCopies,
  wheelMiddleRow,
  wheelNearestEnabled,
  wheelNearestRow,
  wheelOptionText,
  wheelRowAt,
  wheelStep,
  wheelTypeahead,
  wheelWrap,
  type WheelColumn,
  type WheelValue,
} from '@the-system/shared';

export type { WheelColumn, WheelOption, WheelValue } from '@the-system/shared';

export interface WheelPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** One to three columns, each { id, label, options, value?, defaultValue?, loop? }. wheelTimeColumns builds a time wheel. */
  columns: readonly WheelColumn[];
  /** The name of the group of columns, never drawn: Alarm time. Required. */
  label: string;
  /** Called with the column id and its new value when a column comes to rest on a new row, or a key or a tap chooses one. */
  onChange?: (columnId: string, value: WheelValue) => void;
  /** Wrap every column from its last row to its first (hours, minutes). A column's own loop wins. Default false. */
  loop?: boolean;
  /** No column changes. Columns stay focusable and say so (aria-disabled). */
  disabled?: boolean;
  /**
   * Called each time a new row crosses the band under a finger, a drag or a
   * mouse wheel. The hook for haptic ticks: the feedback helper of order
   * R3.9 is not built yet.
   */
  onTick?: (columnId: string, value: WheelValue) => void;
  ref?: Ref<HTMLDivElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** A pointer that moves this far is a drag, not a tap. */
const DRAG_SLOP = 4;
/** With no scrollend event, the scroll is at rest after this much quiet, in ms. */
const SETTLE_QUIET_MS = 140;

interface ColumnProps {
  column: WheelColumn;
  loop: boolean;
  disabled: boolean;
  onCommit: (columnId: string, value: WheelValue) => void;
  onTick?: (columnId: string, value: WheelValue) => void;
}

/** One spinbutton column of the wheel. */
function WheelPickerColumn({ column, loop, disabled, onCommit, onTick }: ColumnProps) {
  const { options } = column;
  const count = options.length;
  const copies = loop && count > 0 ? wheelLoopCopies(count) : 1;
  const rows = count * copies;

  const controlled = column.value !== undefined;
  const [own, setOwn] = useState<WheelValue | undefined>(() => {
    const at = wheelIndexOf(options, column.defaultValue);
    return options[at >= 0 ? at : Math.max(0, wheelEdge(options, false))]?.value;
  });
  const found = wheelIndexOf(options, controlled ? column.value : own);
  const selected = found >= 0 ? found : Math.max(0, wheelEdge(options, false));
  const option = options[selected];

  const elRef = useRef<HTMLDivElement | null>(null);
  const rowHeight = useRef(0);
  const centered = useRef(-1);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const finger = useRef(false);
  const user = useRef(false);
  const quiet = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef(0);
  const drag = useRef<{ id: number; y: number; top: number; moved: boolean; samples: DragSample[] } | null>(null);
  const swallowClick = useRef(false);
  // The row a glide we started is headed for. Until the scroll rests there, a
  // rest elsewhere (a glide cut short by the next key) glides on instead of
  // choosing the row it passed. A finger, a drag or a mouse wheel clears it.
  const aim = useRef<number | null>(null);
  const typed = useRef({ text: '', at: 0 });
  const [dragging, setDragging] = useState(false);
  const commitRef = useRef(onCommit);
  const tickRef = useRef(onTick);
  useEffect(() => {
    commitRef.current = onCommit;
    tickRef.current = onTick;
  });

  const measure = () => {
    const el = elRef.current;
    const first = el?.querySelector<HTMLElement>(":scope > [data-part='option']");
    if (first && first.offsetHeight > 0) rowHeight.current = first.offsetHeight;
    return rowHeight.current;
  };

  const scrollToRow = useCallback((row: number, glide: boolean) => {
    const el = elRef.current;
    const h = rowHeight.current;
    if (!el || h <= 0) return;
    const top = Math.min(Math.max(row, 0), Math.max(rows - 1, 0)) * h;
    if (Math.abs(el.scrollTop - top) < 0.5) {
      aim.current = null;
      return;
    }
    aim.current = Math.round(top / h);
    const behavior: ScrollBehavior = glide && !prefersReducedMotion() ? 'smooth' : 'instant';
    if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior });
    else el.scrollTop = top;
  }, [rows]);

  /** Writes each nearby row's distance from the band, and marks the row in the band. */
  const paint = useCallback(() => {
    frame.current = 0;
    const el = elRef.current;
    const h = rowHeight.current || measure();
    if (!el) return;
    const items = el.children;
    const top = el.scrollTop;
    const now = h > 0 ? wheelRowAt(top, h, rows) : copies > 1 ? wheelMiddleRow(selectedRef.current, count, copies) : selectedRef.current;
    const reach = Math.ceil(el.clientHeight / Math.max(h, 1) / 2) + WHEEL_CURVE_MAX;
    for (let r = Math.max(0, now - reach); r <= Math.min(rows - 1, now + reach); r += 1) {
      const item = items[r] as HTMLElement | undefined;
      if (item && h > 0) item.style.setProperty('--_wheel-picker-d', wheelDistance(r, top, h).toFixed(3));
    }
    if (now !== centered.current) {
      (items[centered.current] as HTMLElement | undefined)?.removeAttribute('data-centered');
      (items[now] as HTMLElement | undefined)?.setAttribute('data-centered', '');
      const before = centered.current;
      centered.current = now;
      if (before >= 0 && user.current && count > 0) {
        const o = options[wheelWrap(now, count)];
        if (o && !o.disabled) tickRef.current?.(column.id, o.value);
      }
    }
  }, [column.id, copies, count, options, rows]);

  /** At rest: the row in the band becomes the value, a disabled row moves to the nearest enabled one, a loop moves back to its middle copy. */
  const settle = useCallback(() => {
    const el = elRef.current;
    const h = rowHeight.current;
    if (!el || h <= 0 || count === 0 || drag.current || finger.current) return;
    const row = wheelRowAt(el.scrollTop, h, rows);
    if (aim.current !== null) {
      if (row !== aim.current || Math.abs(el.scrollTop - row * h) > 1) {
        scrollToRow(aim.current, true);
        return;
      }
      aim.current = null;
    }
    const index = wheelWrap(row, count);
    const enabled = wheelNearestEnabled(options, index, copies > 1);
    if (enabled < 0) return;
    if (enabled !== index) {
      scrollToRow(copies > 1 ? wheelNearestRow(row, enabled, count, copies) : enabled, true);
      return;
    }
    if (Math.abs(el.scrollTop - row * h) > 1) {
      // Not on a row yet (snap off, or a browser that left it between rows).
      scrollToRow(row, true);
      return;
    }
    user.current = false;
    if (disabled) {
      scrollToRow(copies > 1 ? wheelNearestRow(row, selectedRef.current, count, copies) : selectedRef.current, true);
      return;
    }
    if (index !== selectedRef.current) {
      const value = options[index]!.value;
      if (!controlled) setOwn(value);
      commitRef.current(column.id, value);
    }
    if (copies > 1) {
      const middle = wheelMiddleRow(index, count, copies);
      if (middle !== row) {
        el.scrollTop = middle * h;
        paint();
      }
    }
  }, [column.id, controlled, copies, count, disabled, options, paint, rows, scrollToRow]);

  const settleSoon = useCallback(() => {
    if (quiet.current) clearTimeout(quiet.current);
    quiet.current = setTimeout(() => {
      quiet.current = null;
      settle();
    }, SETTLE_QUIET_MS);
  }, [settle]);

  // Place the chosen row in the band before the first paint, and again when the rows change.
  useLayoutEffect(() => {
    const h = measure();
    const el = elRef.current;
    if (!el || h <= 0) {
      paint();
      return;
    }
    const row = copies > 1 ? wheelMiddleRow(selectedRef.current, count, copies) : selectedRef.current;
    aim.current = null;
    el.scrollTop = row * h;
    centered.current = -1;
    paint();
    // Only when the rows change; a value change glides in the effect below.
  }, [rows, count, copies]);

  // A wheel that mounts hidden (a closed popover) has no row height yet, and a
  // density or platform change gives a new one: place the chosen row again.
  useEffect(() => {
    const el = elRef.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view || typeof view.ResizeObserver !== 'function') return;
    const observer = new view.ResizeObserver(() => {
      const before = rowHeight.current;
      const first = el.querySelector<HTMLElement>(":scope > [data-part='option']");
      const h = first ? first.offsetHeight : 0;
      if (h <= 0 || Math.abs(h - before) < 0.5 || drag.current || finger.current) return;
      rowHeight.current = h;
      aim.current = null;
      el.scrollTop = (copies > 1 ? wheelMiddleRow(selectedRef.current, count, copies) : selectedRef.current) * h;
      paint();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [copies, count, paint]);

  // Marks drawn by paint() are lost when React redraws a row; put them back after every render.
  useLayoutEffect(() => {
    const el = elRef.current;
    const now = el?.children[centered.current];
    if (now && !now.hasAttribute('data-centered')) now.setAttribute('data-centered', '');
  });

  // A value from outside (props, a key, a tap) that is not in the band: glide to it.
  useEffect(() => {
    const el = elRef.current;
    const h = rowHeight.current;
    if (!el || h <= 0 || count === 0 || drag.current || finger.current) return;
    const row = aim.current ?? wheelRowAt(el.scrollTop, h, rows);
    if (wheelWrap(row, count) === selected) return;
    scrollToRow(copies > 1 ? wheelNearestRow(row, selected, count, copies) : selected, true);
  }, [selected, copies, count, rows, scrollToRow]);

  // Scroll, scrollend and finger listeners; passive, so the browser scrolls at once.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(paint);
      settleSoon();
    };
    const onScrollEnd = () => {
      if (quiet.current) clearTimeout(quiet.current);
      quiet.current = null;
      paint();
      settle();
    };
    const onTouchStart = () => {
      finger.current = true;
      user.current = true;
      aim.current = null;
    };
    const onTouchEnd = () => {
      finger.current = false;
      settleSoon();
    };
    const onWheel = () => {
      user.current = true;
      aim.current = null;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
      if (quiet.current) clearTimeout(quiet.current);
      quiet.current = null;
    };
  }, [paint, settle, settleSoon]);

  /** Chooses option `index` at once (a key or a tap) and glides the band to it. */
  const choose = (index: number, row?: number) => {
    if (disabled || index < 0 || index >= count || options[index]?.disabled) return;
    const el = elRef.current;
    const h = rowHeight.current;
    if (el && h > 0) {
      const from = aim.current ?? wheelRowAt(el.scrollTop, h, rows);
      scrollToRow(row ?? (copies > 1 ? wheelNearestRow(from, index, count, copies) : index), true);
    }
    if (index === selectedRef.current) return;
    const value = options[index]!.value;
    if (!controlled) setOwn(value);
    commitRef.current(column.id, value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || count === 0) return;
    const wrap = copies > 1;
    let next: number | null = null;
    if (event.key === 'ArrowUp') next = wheelStep(options, selected, 1, wrap);
    else if (event.key === 'ArrowDown') next = wheelStep(options, selected, -1, wrap);
    else if (event.key === 'PageUp') next = wheelStep(options, selected, WHEEL_PAGE_STEP, wrap);
    else if (event.key === 'PageDown') next = wheelStep(options, selected, -WHEEL_PAGE_STEP, wrap);
    else if (event.key === 'Home') next = wheelEdge(options, false);
    else if (event.key === 'End') next = wheelEdge(options, true);
    else if (event.key.length === 1 && event.key.trim() !== '') {
      const now = Date.now();
      const text = now - typed.current.at < WHEEL_TYPEAHEAD_MS ? typed.current.text + event.key : event.key;
      typed.current = { text, at: now };
      let found = wheelTypeahead(options, text, text.length > 1 ? selected : selected + 1);
      if (found < 0 && text.length > 1) {
        typed.current = { text: event.key, at: now };
        found = wheelTypeahead(options, event.key, selected + 1);
      }
      if (found < 0) return;
      next = found;
    }
    if (next === null) return;
    event.preventDefault();
    choose(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || disabled) return;
    const el = elRef.current;
    if (!el) return;
    drag.current = { id: event.pointerId, y: event.clientY, top: el.scrollTop, moved: false, samples: [{ t: event.timeStamp, y: event.clientY }] };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = elRef.current;
    if (!d || !el || d.id !== event.pointerId) return;
    const dy = event.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) < DRAG_SLOP) return;
      d.moved = true;
      user.current = true;
      aim.current = null;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
    }
    d.samples.push({ t: event.timeStamp, y: event.clientY });
    if (d.samples.length > 32) d.samples.shift();
    el.scrollTop = d.top - dy;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = elRef.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    if (!d.moved || !el) return;
    swallowClick.current = true;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    d.samples.push({ t: event.timeStamp, y: event.clientY });
    const speed = dragVelocity(d.samples);
    const h = rowHeight.current;
    setDragging(false);
    if (h <= 0) return;
    // A pointer moving down pulls the rows down, so the scroll offset goes the other way.
    const aim = el.scrollTop - (prefersReducedMotion() ? 0 : speed * DETENT_PROJECTION);
    scrollToRow(wheelRowAt(aim, h, rows), true);
    settleSoon();
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (swallowClick.current) {
      swallowClick.current = false;
      return;
    }
    const el = elRef.current;
    const target = (event.target as Element).closest?.("[data-part='option']");
    if (!el || !target || target.parentElement !== el) return;
    const row = Array.prototype.indexOf.call(el.children, target) as number;
    if (row < 0) return;
    el.focus({ preventScroll: true });
    choose(wheelWrap(row, count), row);
  };

  const numeric = count > 0 && options.every((o) => typeof o.value === 'number' && Number.isFinite(o.value));
  const valueNow = numeric ? (option?.value as number) : selected + 1;
  const valueMin = numeric ? Math.min(...options.map((o) => o.value as number)) : 1;
  const valueMax = numeric ? Math.max(...options.map((o) => o.value as number)) : count;

  const items: ReactElement[] = [];
  for (let r = 0; r < rows; r += 1) {
    const index = wheelWrap(r, count);
    const o = options[index]!;
    items.push(
      <div
        key={r}
        data-part="option"
        aria-hidden="true"
        data-selected={index === selected ? '' : undefined}
        data-disabled={o.disabled ? '' : undefined}
      >
        <span>{wheelOptionText(o)}</span>
      </div>,
    );
  }

  return (
    <div
      ref={elRef}
      data-part="column"
      role="spinbutton"
      tabIndex={0}
      aria-label={column.label}
      aria-valuenow={count > 0 ? valueNow : undefined}
      aria-valuemin={count > 0 ? valueMin : undefined}
      aria-valuemax={count > 0 ? valueMax : undefined}
      aria-valuetext={option ? wheelOptionText(option) : undefined}
      aria-disabled={disabled || undefined}
      data-dragging={dragging ? '' : undefined}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
    >
      {items}
    </div>
  );
}

/** One to three scrolling columns that each rest on a value in a band across the middle. */
export function WheelPicker({ columns, label, onChange, loop = false, disabled = false, onTick, ref, onKeyDown, ...rest }: WheelPickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const changeRef = useRef(onChange);
  useEffect(() => {
    changeRef.current = onChange;
  });
  const commit = useCallback((id: string, value: WheelValue) => changeRef.current?.(id, value), []);

  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  // Left and Right move focus between columns, by what is seen: in right to left the next column is at the left.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    const root = rootRef.current;
    if (!root) return;
    const cols = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-part='column']"));
    const at = cols.indexOf(event.target as HTMLElement);
    if (at < 0) return;
    const forward = (event.key === 'ArrowRight') !== (readDir(root) === 'rtl');
    const next = cols[at + (forward ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus({ preventScroll: true });
  };

  return (
    <div
      {...rest}
      ref={setRoot}
      role="group"
      aria-label={label}
      data-ds="wheel-picker"
      data-disabled={disabled ? '' : undefined}
      onKeyDown={handleKeyDown}
    >
      <div data-part="band" aria-hidden="true" />
      {columns.map((column) => (
        <WheelPickerColumn key={column.id} column={column} loop={column.loop ?? loop} disabled={disabled} onCommit={commit} onTick={onTick} />
      ))}
    </div>
  );
}
