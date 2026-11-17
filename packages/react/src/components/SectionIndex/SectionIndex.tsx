'use client';
// SectionIndex: a column of section keys beside a long list with sections
// (order M9.2, proposed). A press on a key jumps to its section; a press
// that moves along the column scrubs through the keys.
//
// The DOM:
//
//   <nav data-ds="section-index" aria-label data-collapsed? data-dragging?>
//     <a data-part="item" href="#section-a" tabindex="0" data-active?>A</a>
//     <span data-part="gap" aria-hidden="true">       a dot for keys hidden when the column is short
//     <a data-part="item" href="#section-c" tabindex="-1">C</a>
//
// Decisions:
// - A nav landmark of links, one Tab stop. Up and Down move focus between
//   the keys, Home and End go to the ends, Enter jumps. The jump scrolls the
//   section to the block start and moves focus to its heading (the
//   section-header of a ListSection, or the target itself, with tabindex
//   -1 when it is not focusable), so a reader announces the section. The
//   href is a real fragment link, so the column works before the script
//   runs.
// - Scrubbing is one pointer press and move (WCAG 2.5.7): the root takes
//   pointer capture on pointerdown and every key the pointer crosses jumps
//   at once, without moving focus; focus moves to the last section heading
//   on release. A tap on a key does the same with no movement. The column
//   sets touch-action none, so a finger on it does not scroll the page.
// - Keys never shrink under 24px (2.5.8). With collapse auto, a column too
//   short for every key keeps keys evenly from first to last with a gap dot
//   between them (collapseIndex in @the-system/shared); scrubbing over a dot
//   reaches the keys it hides. With collapse never, every key shows and the
//   caller makes room. The keys that are hidden are not Tab or arrow stops:
//   the sections stay reachable in the list itself.
// - The keys and the sections they jump to come from the caller, or from
//   indexAlphabet, groupByInitial and indexEntries in @the-system/shared,
//   which give A to Z then # in English and the 28 Arabic letters then # in
//   Arabic.
// - The column takes the inline end of its layout from the caller's DOM
//   order, so it sits at the left in Arabic. Keys read top to bottom in
//   both directions.
// - Motion: none. The jump is instant, as on the platforms, and the active
//   key swaps its color at once.
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
  type Ref,
} from 'react';
import { collapseIndex, INDEX_KEY_MIN, slotKey, type IndexSlot } from '@the-system/shared';

/** One key of the column. */
export interface SectionIndexSection {
  /** The key drawn in the column: a letter or #. */
  key: string;
  /** The accessible name when it should differ from the key. Keep the key in it (2.5.3). */
  label?: string;
  /** The id of the section the key jumps to: a ListSection, or a heading. */
  target: string;
}

export type SectionIndexCollapse = 'auto' | 'never';

export interface SectionIndexProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  /** The keys in column order, each with the id it jumps to. Two keys may share a target. */
  sections: readonly SectionIndexSection[];
  /** The name of the nav landmark, never drawn: "Contacts index". Required. */
  label: string;
  /** Called with the key and its target on every jump: a key press, a tap or each key a scrub crosses. */
  onSelect?: (key: string, target: string) => void;
  /** The current key, for a list that tracks the section in view. Without it the last key chosen is current. */
  active?: string;
  /** auto: a short column keeps keys evenly and draws a gap dot for the rest. never: every key always shows. Default auto. */
  collapse?: SectionIndexCollapse;
  ref?: Ref<HTMLElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** Scrolls to a section and, when asked, moves focus to its heading. Returns false when the target is not in the page. */
function jump(doc: Document, target: string, focus: boolean): boolean {
  const el = doc.getElementById(target);
  if (!el) return false;
  const heading = el.matches("[data-part='section-header']") ? el : (el.querySelector<HTMLElement>(":scope > [data-part='section-header']") ?? el);
  heading.scrollIntoView?.({ block: 'start', inline: 'nearest' });
  if (focus) {
    if (heading.tabIndex < 0 && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  return true;
}

const all = (count: number): IndexSlot[] => Array.from({ length: count }, (_, index) => ({ type: 'key', index }));

/** A column of section keys that jumps to and scrubs through the sections of a list. */
export function SectionIndex({ sections, label, onSelect, active: activeProp, collapse = 'auto', ref, onKeyDown, onPointerDown, ...rest }: SectionIndexProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const active = activeProp ?? chosen;
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // The column height and the least key height, measured; 0 before layout keeps every key.
  const [room, setRoom] = useState({ height: 0, min: INDEX_KEY_MIN });
  const lastRef = useRef<number | null>(null);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  });

  const slots = collapse === 'never' ? all(sections.length) : collapseIndex(sections.length, room.height, room.min);
  const collapsed = slots.length < sections.length;
  const shown = slots.filter((s): s is { type: 'key'; index: number } => s.type === 'key').map((s) => s.index);
  // The one Tab stop: the key focus was on, else the current key, else the first, among the keys shown.
  const stopIndex = (() => {
    for (const key of [focusKey, active]) {
      const i = shown.find((n) => sections[n]?.key === key);
      if (i !== undefined) return i;
    }
    return shown[0];
  })();

  // Measure the room the column has, and the height of one key, whenever it resizes.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!root || !view || collapse === 'never') return;
    const measure = () => {
      const style = view.getComputedStyle(root);
      const pad = (Number.parseFloat(style.paddingBlockStart) || 0) + (Number.parseFloat(style.paddingBlockEnd) || 0);
      const item = root.querySelector<HTMLElement>(":scope > [data-part='item']");
      const min = Math.max(INDEX_KEY_MIN, item ? item.getBoundingClientRect().height : 0);
      const height = Math.max(0, root.clientHeight - pad);
      setRoom((r) => (Math.abs(r.height - height) < 0.5 && Math.abs(r.min - min) < 0.5 ? r : { height, min }));
    };
    measure();
    if (typeof view.ResizeObserver !== 'function') return;
    const observer = new view.ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [collapse, sections.length]);

  const select = useCallback(
    (index: number, focus: boolean) => {
      const section = sections[index];
      const root = rootRef.current;
      if (!section || !root) return;
      setChosen(section.key);
      jump(root.ownerDocument, section.target, focus);
      selectRef.current?.(section.key, section.target);
    },
    [sections],
  );

  /** The key index under a pointer at clientY: the slot it is over, clamped to the ends of the column. */
  const indexAt = (clientY: number): number | null => {
    const els = slotRefs.current.slice(0, slots.length);
    if (els.length === 0) return null;
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const slot = slots[i];
      if (!el || !slot) continue;
      const box = el.getBoundingClientRect();
      const first = i === 0 && clientY < box.top;
      const last = i === els.length - 1 && clientY >= box.bottom;
      if (first || last || (clientY >= box.top && clientY < box.bottom)) {
        return slotKey(slot, box.height > 0 ? (clientY - box.top) / box.height : 0);
      }
    }
    return null;
  };

  const scrubTo = (clientY: number) => {
    const index = indexAt(clientY);
    if (index === null || index === lastRef.current) return;
    lastRef.current = index;
    select(index, false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    // No focus move and no text selection on press; the release puts focus on the section.
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    lastRef.current = null;
    setDragging(true);
    scrubTo(event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    scrubTo(event.clientY);
  };

  const endDrag = (focus: boolean) => (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragging(false);
    const index = lastRef.current;
    const section = index === null ? undefined : sections[index];
    if (focus && section && rootRef.current) jump(rootRef.current.ownerDocument, section.target, true);
  };

  // A pointer click was handled on pointerdown. A click with no pointer (Enter, or a reader's activation) jumps here.
  const handleClick = (index: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (event.detail === 0) select(index, true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || shown.length === 0) return;
    const at = shown.indexOf(stopIndex ?? shown[0]!);
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = shown[Math.min(shown.length - 1, at + 1)];
    else if (event.key === 'ArrowUp') next = shown[Math.max(0, at - 1)];
    else if (event.key === 'Home') next = shown[0];
    else if (event.key === 'End') next = shown[shown.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    const key = sections[next]?.key ?? null;
    setFocusKey(key);
    const slot = slots.findIndex((s) => s.type === 'key' && s.index === next);
    slotRefs.current[slot]?.focus();
  };

  const setRoot = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  slotRefs.current.length = slots.length;

  return (
    <nav
      {...rest}
      ref={setRoot}
      aria-label={label}
      data-ds="section-index"
      data-collapsed={collapsed ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag(true)}
      onPointerCancel={endDrag(false)}
    >
      {slots.map((slot, i) => {
        if (slot.type === 'gap') {
          return (
            <span
              key={`gap-${slot.indexes[0]}`}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              data-part="gap"
              aria-hidden="true"
            />
          );
        }
        const section = sections[slot.index]!;
        const isActive = section.key === active;
        return (
          <a
            key={section.key}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            data-part="item"
            href={`#${section.target}`}
            tabIndex={slot.index === stopIndex ? 0 : -1}
            aria-label={section.label}
            aria-current={isActive ? 'location' : undefined}
            data-active={isActive ? '' : undefined}
            onClick={handleClick(slot.index)}
            onFocus={() => setFocusKey(section.key)}
          >
            {section.key}
          </a>
        );
      })}
    </nav>
  );
}
