// Pagination: moves between pages of a list. The twin of
// packages/react/src/components/Pagination/Pagination.tsx and
// PaginationDots.tsx, on the same DOM, so Pagination.css applies as is.
//
//   <nav dsPagination [(page)]="page" [itemCount]="312" [pageSize]="20"></nav>
//   <nav dsPagination variant="dots" [pageCount]="5" [(page)]="slide"></nav>
//
// The numbered DOM:
//
//   <nav data-ds="pagination" aria-label="Pagination" data-size data-shape>
//     <span data-part="summary">21 to 40 of 312</span>          with itemCount
//     <button data-ds="icon-button" data-part="first">          chevrons-back, mirrored in RTL
//     <button data-ds="icon-button" data-part="previous">       chevron-back
//     <button data-ds="button" data-part="page" aria-current="page" data-active>
//     <span data-part="ellipsis" aria-hidden="true">
//     <button data-ds="icon-button" data-part="next">           chevron-forward
//     <button data-ds="icon-button" data-part="last">           chevrons-forward
//
// The dots DOM:
//
//   <nav data-ds="pagination" data-variant="dots" aria-label="Pages" data-compact?>
//     <span data-part="track">
//       <button data-ds="button" data-part="dot" aria-label="Page 1 of 5" tabindex="-1">
//
// Names that differ from React, by frameworks.md: `page` is a model, so
// `[(page)]` is React's page with onPageChange and `pageChange` is
// onPageChange. `getHref` and `formatSummary` are function inputs. With
// getHref the controls are `a` elements, as React's asChild links.
//
// Behavior as React: page numbers from pageRange in @the-system/shared,
// keyed by number so focus stays on the pressed control when the window
// shifts; inert ends stay focusable (aria-disabled); Western digits in both
// languages. Motion (interaction pagination-roll): the pill slides from the
// page it leaves, a slot that shows another number rolls its digits, a
// pressed arrow winds up. Dots: one tab stop, arrows select at once with no
// wrap (mirrored in right to left), Home and End; compact past the width,
// measured after layout, never during render.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  createTrack,
  followIndicator,
  inlineSign,
  readDuration,
  readEasing,
  rollDigits,
  toLocal,
  windUp,
} from '@the-system/motion';
import {
  clampPage,
  isEllipsis,
  itemRange,
  pageCount as countPages,
  pageRange,
  type PageRangeItem,
  type Shape,
  type Size,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DsThemeService } from '../../theme/theme';
import { DsIconButton } from '../icon-button/icon-button';
import { DsPaginationDot, DsPaginationPage } from './pagination-controls';

export type PaginationSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type PaginationShape = Extract<Shape, 'default' | 'pill' | 'square'>;
/** numbers: page numbers with the ends and ellipses. dots: one dot per page, nothing else. */
export type PaginationVariant = 'numbers' | 'dots';

type EndPart = 'first' | 'previous' | 'next' | 'last';

const digits = new Intl.NumberFormat('en-US');
const n = (value: number) => digits.format(value);

/** The built in words. Arabic: Gulf MSA noun forms, Western digits. */
export const paginationWords = {
  en: {
    label: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    page: (p: number) => `Page ${n(p)}`,
    summary: (s: number, e: number, t: number) => `${n(s)} to ${n(e)} of ${n(t)}`,
    empty: 'No items',
    dots: 'Pages',
    dot: (p: number, t: number) => `Page ${n(p)} of ${n(t)}`,
  },
  ar: {
    label: 'التنقل بين الصفحات',
    first: 'الصفحة الأولى',
    previous: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    last: 'الصفحة الأخيرة',
    page: (p: number) => `صفحة ${n(p)}`,
    summary: (s: number, e: number, t: number) => `${n(s)} إلى ${n(e)} من ${n(t)}`,
    empty: 'لا توجد عناصر',
    dots: 'الصفحات',
    dot: (p: number, t: number) => `صفحة ${n(p)} من ${n(t)}`,
  },
} as const;

const PAGE = ':scope > [data-part="page"]';
const HOST = ':scope > [data-part="label"] span[aria-hidden="true"]';
const DOT = ':scope > [data-part="dot"]';

/** A length in px from a computed style, 0 when it is not a length. */
const px = (value: string) => {
  const v = parseFloat(value);
  return Number.isFinite(v) ? v : 0;
};

const rtlOf = (el: Element) => el.closest('[dir]')?.getAttribute('dir') === 'rtl';

/** Page controls with first, previous, numbers, next and last and an optional summary; or, with variant dots, one dot per page. */
@Component({
  selector: 'nav[dsPagination]',
  exportAs: 'dsPagination',
  imports: [NgTemplateOutlet, DsIconButton, DsPaginationPage, DsPaginationDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'pagination',
    '[attr.data-variant]': 'dots() ? "dots" : null',
    '[attr.data-compact]': 'dots() && compact() ? "" : null',
    '[attr.data-size]': 'dots() ? null : size()',
    '[attr.data-shape]': 'dots() ? null : shape()',
    '[attr.aria-label]': 'label() ?? (dots() ? words().dots : words().label)',
  },
  template: `
    @if (dots()) {
      <span #dotTrack data-part="track" (keydown)="onDotsKey($event)" (click)="onTrackClick($event)">
        @for (p of dotPages(); track p) {
          <button
            dsPaginationDot
            data-part="dot"
            emphasis="ghost"
            size="xs"
            shape="pill"
            [attr.data-active]="p === current() ? '' : null"
            [attr.aria-current]="p === current() ? 'page' : null"
            [attr.aria-label]="words().dot(p, total())"
            [attr.tabindex]="p === current() ? 0 : -1"
            [disabled]="disabled()"
            (click)="onDotClick($event, p)"
          ></button>
        }
      </span>
    } @else {
      @if (summary(); as text) {
        <span data-part="summary">{{ text }}</span>
      }
      @if (showEnds()) {
        <ng-container [ngTemplateOutlet]="end" [ngTemplateOutletContext]="{ $implicit: 'first', icon: 'chevrons-back', to: 1 }" />
      }
      <ng-container [ngTemplateOutlet]="end" [ngTemplateOutletContext]="{ $implicit: 'previous', icon: 'chevron-back', to: previousPage() }" />
      @for (item of range(); track item) {
        @if (isEllipsis(item)) {
          <span data-part="ellipsis" aria-hidden="true">…</span>
        } @else {
          @if (item === total() && total() - current() > 1) {
            <span data-part="ellipsis" data-compact="" aria-hidden="true">…</span>
          }
          @if (getHref(); as href) {
            <a
              dsPaginationPage
              data-part="page"
              [href]="href(item)"
              [text]="text(item)"
              [active]="item === current()"
              [attr.data-active]="item === current() ? '' : null"
              [attr.aria-current]="item === current() ? 'page' : null"
              [attr.aria-label]="words().page(item)"
              [size]="size()"
              [shape]="shape()"
              [emphasis]="item === current() ? 'soft' : 'ghost'"
              [disabled]="disabled()"
              [attr.tabindex]="disabled() ? 0 : null"
              (click)="go($event, item)"
            ></a>
          } @else {
            <button
              dsPaginationPage
              data-part="page"
              [text]="text(item)"
              [active]="item === current()"
              [attr.data-active]="item === current() ? '' : null"
              [attr.aria-current]="item === current() ? 'page' : null"
              [attr.aria-label]="words().page(item)"
              [size]="size()"
              [shape]="shape()"
              [emphasis]="item === current() ? 'soft' : 'ghost'"
              [disabled]="disabled()"
              (click)="go($event, item)"
            ></button>
          }
        }
      }
      <ng-container [ngTemplateOutlet]="end" [ngTemplateOutletContext]="{ $implicit: 'next', icon: 'chevron-forward', to: nextPage() }" />
      @if (showEnds()) {
        <ng-container [ngTemplateOutlet]="end" [ngTemplateOutletContext]="{ $implicit: 'last', icon: 'chevrons-forward', to: total() }" />
      }
    }

    <ng-template #end let-part let-icon="icon" let-to="to">
      @if (getHref(); as href) {
        <a
          dsIconButton
          [attr.data-part]="part"
          [href]="href(to)"
          [icon]="icon"
          [label]="endLabel(part)"
          [size]="size()"
          [shape]="shape()"
          [disabled]="disabled() || to === current()"
          [attr.tabindex]="disabled() || to === current() ? 0 : null"
          (click)="onEnd($event, part, to)"
        ></a>
      } @else {
        <button
          dsIconButton
          [attr.data-part]="part"
          [icon]="icon"
          [label]="endLabel(part)"
          [size]="size()"
          [shape]="shape()"
          [disabled]="disabled() || to === current()"
          (click)="onEnd($event, part, to)"
        ></button>
      }
    </ng-template>
  `,
})
export class DsPagination {
  /**
   * numbers (default): first, previous, page numbers, next and last.
   * dots: one dot per page and nothing else, for a short flat set of pages.
   * Stamps data-variant="dots". The dots ignore itemCount, pageSize,
   * siblings, boundaries, showEnds, getHref, size, shape and formatSummary.
   */
  readonly variant = input<PaginationVariant>('numbers');
  /** The current page, from 1. Two way: `[(page)]`; pageChange is React's onPageChange. Left out, it starts at defaultPage. */
  readonly page = model<number | undefined>(undefined);
  /** The first page shown when uncontrolled. Default 1. */
  readonly defaultPage = input(1);
  /** The number of pages. Default: worked out from itemCount and pageSize, else 1. */
  readonly pageCount = input<number | undefined>(undefined);
  /** The number of items in the list. Turns on the summary ("21 to 40 of 312"). */
  readonly itemCount = input<number | undefined>(undefined);
  /** Items per page, for the summary and the page count. Default 20. */
  readonly pageSize = input(20);
  /** Pages shown on each side of the current page. Default 1. */
  readonly siblings = input(1);
  /** Pages always shown at each end. Default 1. */
  readonly boundaries = input(1);
  /** Shows the first and last page buttons. Default true. */
  readonly showEnds = input(true, { transform: booleanAttribute });
  /** Turns every control into a link to this URL. Default none: buttons. */
  readonly getHref = input<((page: number) => string) | undefined>(undefined);
  /** Control height, as Button: sm 28, md 32, lg 44. Default md. */
  readonly size = input<PaginationSize>('md');
  /** Corner shape of every control, as Button. Default default. */
  readonly shape = input<PaginationShape>('default');
  /** Every control is inert, for example while the list loads. Default false. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The accessible name of the nav. Default "Pagination" ("Pages" for dots); Arabic under lang ar. */
  readonly label = input<string | undefined>(undefined);
  /** Replaces the summary text. Gets the first item, the last item and the total (0, 0 and 0 for an empty list). */
  readonly formatSummary = input<((start: number, end: number, total: number) => string) | undefined>(undefined);

  private readonly theme = inject(DsThemeService);
  private readonly host = consumeHostAttributes([
    'dsPagination', 'variant', 'page', 'defaultPage', 'pageCount', 'itemCount', 'pageSize', 'siblings', 'boundaries',
    'showEnds', 'getHref', 'size', 'shape', 'disabled', 'label', 'formatSummary',
  ]);
  private readonly motion = injectMotion();
  private readonly track = createTrack();
  private readonly trackEl = viewChild<ElementRef<HTMLSpanElement>>('dotTrack');

  protected readonly isEllipsis = isEllipsis;
  protected readonly text = n;
  protected readonly dots = computed(() => this.variant() === 'dots');
  protected readonly words = computed(() => paginationWords[this.theme.value().lang === 'ar' ? 'ar' : 'en']);

  /** A page size that is not a finite number never reaches the count or the summary. */
  private readonly perPage = computed(() => {
    const size = this.pageSize();
    return Number.isFinite(size) && size >= 1 ? Math.floor(size) : 20;
  });
  private readonly items = computed(() => {
    const count = this.itemCount();
    return count !== undefined && Number.isFinite(count) ? count : undefined;
  });
  /** Never under one page: a count of 0 or NaN still shows page 1 with inert ends. */
  readonly total = computed(() => {
    const items = this.dots() ? undefined : this.items();
    const raw = this.pageCount() ?? (items !== undefined ? countPages(items, this.perPage()) : 1);
    return Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1;
  });
  private readonly own = linkedSignal<number>(() => this.page() ?? this.defaultPage());
  /** The page shown, clamped into 1 to the page count. */
  readonly current = computed(() => clampPage(this.own(), this.total()));
  protected readonly range = computed<PageRangeItem[]>(() => pageRange(this.current(), this.total(), this.siblings(), this.boundaries()));
  protected readonly previousPage = computed(() => Math.max(1, this.current() - 1));
  protected readonly nextPage = computed(() => Math.min(this.total(), this.current() + 1));
  protected readonly dotPages = computed(() => Array.from({ length: this.total() }, (_, i) => i + 1));
  /** No summary for an item count that is not a finite number: it would print as NaN. */
  protected readonly summary = computed(() => {
    const items = this.items();
    if (items === undefined) return undefined;
    const r = itemRange(this.current(), this.perPage(), items);
    const format = this.formatSummary();
    if (r.total === 0 && !format) return this.words().empty;
    return (format ?? this.words().summary)(r.start, r.end, r.total);
  });
  /** The dots do not fit at full size: measured after layout, never during render. */
  protected readonly compact = signal(false);

  constructor() {
    this.followPill();
    this.measureDots();
  }

  private setPage(to: number): void {
    this.own.set(to);
    this.page.set(to);
  }

  /** A press on a page: links with a modifier or another button are left to the browser. */
  protected go(event: MouseEvent, to: number): void {
    const href = this.getHref();
    if (href && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (!href) event.preventDefault();
    if (to !== this.current()) this.setPage(to);
  }

  protected endLabel(part: EndPart): string {
    return this.words()[part];
  }

  /** A press on an end: the page changes at once and the arrow winds up. */
  protected onEnd(event: MouseEvent, part: EndPart, to: number): void {
    const was = this.current();
    this.go(event, to);
    if (this.disabled() || to === was) return;
    const button = event.currentTarget as HTMLElement;
    const forward = part === 'next' || part === 'last';
    const sign = inlineSign(button);
    windUp(button.querySelector('[data-part="icon"]'), (forward ? sign : -sign) as 1 | -1, this.motion.mode('pagination-roll'));
  }

  // ---------------------------------------------------------------- numbers motion

  /** After each render that moved the page: roll the numbers whose slot changed, slide the pill. As React's layout effect. */
  private followPill(): void {
    let slots: { page: number; texts: string[] } | null = null;
    afterRenderEffect({
      write: () => {
        const page = this.current();
        const range = this.range();
        if (this.dots()) {
          slots = null;
          return;
        }
        untracked(() => {
          const root = this.host;
          const mode = this.motion.mode('pagination-roll');
          const pages = Array.from(root.querySelectorAll<HTMLElement>(PAGE));
          // The text of each slot comes from the data, never from the DOM, which holds a roll's columns while it plays.
          const texts = range.filter((item) => !isEllipsis(item)).map((item) => n(item as number));
          const before = slots;
          if (before && before.page !== page && before.texts.length === texts.length) {
            const direction = page > before.page ? 'up' : 'down';
            texts.forEach((text, i) => {
              const host = pages[i]?.querySelector<HTMLElement>(HOST);
              const from = before.texts[i];
              if (host && from !== undefined && from !== text) rollDigits(host, from, text, { mode, direction });
            });
          }
          slots = { page, texts };
          const current = pages.find((el) => el.hasAttribute('data-active'));
          const pill = current?.querySelector(':scope > span[aria-hidden="true"]:not([data-part])');
          if (!current || !pill) return;
          // When the list wraps and the new page sits on another line, the pill fades in at its new place.
          const to = toLocal(pill.getBoundingClientRect(), root);
          const track = this.track;
          const last = track.key !== null && track.key !== String(page) ? track.rect : null;
          const otherLine = last !== null && Math.abs(last.y + last.height / 2 - (to.y + to.height / 2)) > to.height / 2;
          followIndicator(track, String(page), { el: pill }, {
            mode,
            anchor: root,
            label: current.querySelector(':scope > [data-part="label"]'),
            axis: 'x',
            slide: !otherLine,
          });
          if (otherLine && mode === 'full' && typeof pill.animate === 'function') {
            pill.animate([{ opacity: 0 }, { opacity: 1 }], {
              id: 'ds-motion:pagination-fade',
              duration: readDuration(pill, 'duration.base'),
              easing: readEasing(pill, 'ease.out'),
            });
          }
        });
      },
    });
  }

  // ---------------------------------------------------------------- dots

  /** Do the dots fit at full size? Read after layout, and again on resize. */
  private measureDots(): void {
    const measure = () => {
      const track = this.trackEl()?.nativeElement;
      if (!track || typeof getComputedStyle !== 'function') {
        if (!track) this.compact.set(false);
        return;
      }
      const dot = track.querySelector<HTMLElement>(DOT);
      if (!dot) return;
      const basis = parseFloat(getComputedStyle(dot).flexBasis);
      const room = this.host.clientWidth;
      if (!Number.isFinite(basis) || !(room > 0)) return;
      const ts = getComputedStyle(track);
      const frame = px(ts.paddingInlineStart) + px(ts.paddingInlineEnd) + px(ts.borderInlineStartWidth) + px(ts.borderInlineEndWidth);
      const total = untracked(() => this.total());
      const natural = total * basis + (total - 1) * px(ts.columnGap) + frame;
      this.compact.set(natural > room + 0.5);
    };
    afterRenderEffect({
      read: () => {
        this.total();
        this.trackEl();
        untracked(measure);
      },
    });
    let observer: ResizeObserver | undefined;
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      observer = new ResizeObserver(() => measure());
      observer.observe(this.host);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  private select(to: number): void {
    if (!this.disabled() && to !== this.current()) this.setPage(to);
  }

  /** One tab stop: the arrows move and select at once, with no wrap; Home and End go to the ends. */
  protected onDotsKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
    const track = event.currentTarget as HTMLElement;
    const dots = Array.from(track.querySelectorAll<HTMLElement>(DOT));
    const from = dots.indexOf(event.target as HTMLElement);
    if (from < 0) return;
    const forward = rtlOf(track) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    let to: number | null = null;
    if (event.key === forward) to = from + 1;
    else if (event.key === back) to = from - 1;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = dots.length - 1;
    if (to === null) return;
    event.preventDefault();
    to = Math.min(dots.length - 1, Math.max(0, to));
    dots[to]!.focus();
    this.select(to + 1);
  }

  /** Compact: a pointer press on the track counts by the half it lands on. A key press keeps the dot's own. */
  protected onTrackClick(event: MouseEvent): void {
    if (!this.compact() || this.disabled() || event.detail === 0) return;
    const track = event.currentTarget as HTMLElement;
    const box = track.getBoundingClientRect();
    const onLeft = event.clientX < box.left + box.width / 2;
    const backward = rtlOf(track) ? !onLeft : onLeft;
    const page = this.current();
    const to = backward ? page - 1 : page + 1;
    if (to >= 1 && to <= this.total()) this.select(to);
  }

  protected onDotClick(event: MouseEvent, p: number): void {
    if (this.compact() && event.detail > 0) return;
    this.select(p);
  }
}
