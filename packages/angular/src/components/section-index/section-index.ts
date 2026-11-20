// SectionIndex: a column of section keys beside a long list with sections.
// The twin of packages/react/src/components/SectionIndex/SectionIndex.tsx,
// on the same DOM, so SectionIndex.css applies as is.
//
//   <nav dsSectionIndex label="Contacts index" [sections]="sections" (select)="jumped($event)"></nav>
//
// The DOM:
//
//   <nav data-ds="section-index" aria-label data-collapsed? data-dragging?>
//     <a data-part="item" href="#section-a" tabindex="0" data-active?>A</a>
//     <span data-part="gap" aria-hidden="true">       a dot for keys hidden when the column is short
//     <a data-part="item" href="#section-c" tabindex="-1">C</a>
//
// Names that differ from React, by frameworks.md: `select` is React's
// onSelect, with the key and its target in one object.
//
// Behavior as React: a nav of fragment links with one Tab stop; Up, Down,
// Home and End move focus between the keys shown; Enter jumps, scrolls the
// section to the block start and moves focus to its heading. A press and
// move scrubs (pointer capture), jumping at each key it crosses without
// moving focus; focus moves to the last section heading on release. Keys
// never shrink under 24px: with collapse auto a short column keeps keys
// evenly with gap dots between them (collapseIndex in @the-system/shared),
// measured after layout, never during render. The caller's own keydown and
// pointerdown on the nav run first, as React's onKeyDown and onPointerDown.
// No motion.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { collapseIndex, INDEX_KEY_MIN, slotKey, type IndexSlot } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

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

/** What `select` emits: the key and the id it jumps to. */
export interface SectionIndexSelect {
  key: string;
  target: string;
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
@Component({
  selector: 'nav[dsSectionIndex]',
  exportAs: 'dsSectionIndex',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'section-index',
    '[attr.aria-label]': 'label()',
    '[attr.data-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-dragging]': 'dragging() ? "" : null',
  },
  template: `
    @for (slot of slots(); track slotId(slot)) {
      @if (slot.type === 'gap') {
        <span data-part="gap" aria-hidden="true"></span>
      } @else {
        @let section = sections()[slot.index]!;
        <a
          data-part="item"
          [attr.href]="'#' + section.target"
          [attr.tabindex]="slot.index === stopIndex() ? 0 : -1"
          [attr.aria-label]="section.label ?? null"
          [attr.aria-current]="section.key === active() ? 'location' : null"
          [attr.data-active]="section.key === active() ? '' : null"
          (click)="onItemClick($event, slot.index)"
          (focus)="focusKey.set(section.key)"
          >{{ section.key }}</a
        >
      }
    }
  `,
})
export class DsSectionIndex {
  /** The keys in column order, each with the id it jumps to. Two keys may share a target. */
  readonly sections = input.required<readonly SectionIndexSection[]>();
  /** The name of the nav landmark, never drawn: "Contacts index". Required. */
  readonly label = input.required<string>();
  /** The current key, for a list that tracks the section in view. Without it the last key chosen is current. */
  readonly activeKey = input<string | undefined>(undefined, { alias: 'active' });
  /** auto: a short column keeps keys evenly and draws a gap dot for the rest. never: every key always shows. Default auto. */
  readonly collapse = input<SectionIndexCollapse>('auto');
  /** Emits the key and its target on every jump: a key press, a tap or each key a scrub crosses. React's onSelect. */
  readonly select = output<SectionIndexSelect>();

  private readonly host = consumeHostAttributes(['dsSectionIndex', 'sections', 'label', 'active', 'collapse']);

  private readonly chosen = signal<string | null>(null);
  protected readonly focusKey = signal<string | null>(null);
  protected readonly dragging = signal(false);
  /** The column height and the least key height, measured; 0 before layout keeps every key. */
  private readonly room = signal({ height: 0, min: INDEX_KEY_MIN }, { equal: (a, b) => Math.abs(a.height - b.height) < 0.5 && Math.abs(a.min - b.min) < 0.5 });
  /** The key index the scrub is on. */
  private last: number | null = null;

  protected readonly active = computed(() => this.activeKey() ?? this.chosen());
  protected readonly slots = computed<IndexSlot[]>(() => {
    const count = this.sections().length;
    if (this.collapse() === 'never') return all(count);
    const room = this.room();
    return collapseIndex(count, room.height, room.min);
  });
  protected readonly collapsed = computed(() => this.slots().length < this.sections().length);
  private readonly shown = computed(() =>
    this.slots()
      .filter((s): s is { type: 'key'; index: number } => s.type === 'key')
      .map((s) => s.index),
  );
  /** The one Tab stop: the key focus was on, else the current key, else the first, among the keys shown. */
  protected readonly stopIndex = computed(() => {
    const sections = this.sections();
    const shown = this.shown();
    for (const key of [this.focusKey(), this.active()]) {
      const i = shown.find((n) => sections[n]?.key === key);
      if (i !== undefined) return i;
    }
    return shown[0];
  });

  protected slotId(slot: IndexSlot): string {
    return slot.type === 'gap' ? `gap-${slot.indexes[0]}` : `key-${this.sections()[slot.index]?.key ?? slot.index}`;
  }

  constructor() {
    const el = this.host;
    const destroy = inject(DestroyRef);
    // The caller's own keydown and pointerdown on the nav run first: these listen from after the first render.
    const onKey = (event: KeyboardEvent) => this.onKeyDown(event);
    const onDown = (event: PointerEvent) => this.onPointerDown(event);
    const onMove = (event: PointerEvent) => this.onPointerMove(event);
    const onUp = (event: PointerEvent) => this.endDrag(event, true);
    const onCancel = (event: PointerEvent) => this.endDrag(event, false);
    afterNextRender(() => {
      el.addEventListener('keydown', onKey);
      el.addEventListener('pointerdown', onDown);
    });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    destroy.onDestroy(() => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    });
    this.measureRoom();
  }

  /** Measures the room the column has, and the height of one key, whenever it resizes. */
  private measureRoom(): void {
    const el = this.host;
    const measure = () => {
      const view = el.ownerDocument.defaultView;
      if (!view || untracked(() => this.collapse()) === 'never') return;
      const style = view.getComputedStyle(el);
      const pad = (Number.parseFloat(style.paddingBlockStart) || 0) + (Number.parseFloat(style.paddingBlockEnd) || 0);
      const item = el.querySelector<HTMLElement>(":scope > [data-part='item']");
      const min = Math.max(INDEX_KEY_MIN, item ? item.getBoundingClientRect().height : 0);
      const height = Math.max(0, el.clientHeight - pad);
      this.room.set({ height, min });
    };
    afterRenderEffect({
      read: () => {
        // Measured again when the collapse rule or the number of keys changes.
        void [this.collapse(), this.sections().length];
        untracked(measure);
      },
    });
    let observer: ResizeObserver | undefined;
    afterNextRender(() => {
      const view = el.ownerDocument.defaultView;
      if (!view || typeof view.ResizeObserver !== 'function') return;
      observer = new view.ResizeObserver(() => measure());
      observer.observe(el);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  private choose(index: number, focus: boolean): void {
    const section = this.sections()[index];
    if (!section) return;
    this.chosen.set(section.key);
    jump(this.host.ownerDocument, section.target, focus);
    this.select.emit({ key: section.key, target: section.target });
  }

  /** The key index under a pointer at clientY: the slot it is over, clamped to the ends of the column. */
  private indexAt(clientY: number): number | null {
    const slots = this.slots();
    const els = Array.from(this.host.children).slice(0, slots.length);
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
  }

  private scrubTo(clientY: number): void {
    const index = this.indexAt(clientY);
    if (index === null || index === this.last) return;
    this.last = index;
    this.choose(index, false);
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.defaultPrevented || event.button !== 0) return;
    // No focus move and no text selection on press; the release puts focus on the section.
    event.preventDefault();
    this.host.setPointerCapture?.(event.pointerId);
    this.last = null;
    this.dragging.set(true);
    this.scrubTo(event.clientY);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.scrubTo(event.clientY);
  }

  private endDrag(event: PointerEvent, focus: boolean): void {
    if (!this.dragging()) return;
    this.host.releasePointerCapture?.(event.pointerId);
    this.dragging.set(false);
    const index = this.last;
    const section = index === null ? undefined : this.sections()[index];
    if (focus && section) jump(this.host.ownerDocument, section.target, true);
  }

  /** A pointer click was handled on pointerdown. A click with no pointer (Enter, or a reader's activation) jumps here. */
  protected onItemClick(event: MouseEvent, index: number): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (event.detail === 0) this.choose(index, true);
  }

  private onKeyDown(event: KeyboardEvent): void {
    const shown = this.shown();
    if (event.defaultPrevented || shown.length === 0) return;
    const at = shown.indexOf(this.stopIndex() ?? shown[0]!);
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = shown[Math.min(shown.length - 1, at + 1)];
    else if (event.key === 'ArrowUp') next = shown[Math.max(0, at - 1)];
    else if (event.key === 'Home') next = shown[0];
    else if (event.key === 'End') next = shown[shown.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    this.focusKey.set(this.sections()[next]?.key ?? null);
    const slot = this.slots().findIndex((s) => s.type === 'key' && s.index === next);
    (this.host.children[slot] as HTMLElement | undefined)?.focus();
  }
}
