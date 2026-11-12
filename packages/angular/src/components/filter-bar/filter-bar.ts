// FilterBar: the row above a list. A search box, quick filter chips, more
// filters in a menu, the active filter count, clear all, and an end slot for
// view toggles. The twin of packages/react/src/components/FilterBar/FilterBar.tsx.
//
//   <div dsFilterBar [search]="{ 'aria-label': 'Search files', placeholder: 'Search files' }"
//        [filters]="kinds" [more]="more" [(value)]="on" [resultCount]="count()" [end]="toggles"></div>
//
// One value array holds every filter that is on, from the chips and from the
// menu. The chip strip scrolls sideways inside itself; the root carries
// data-overflow-start and data-overflow-end in reading order, so the fades
// flip in RTL. The result count is announced politely once, 600ms after the
// last filter or search change. Clear all hides when nothing is on, so it
// hands focus to the search box, else the first chip, else more.
//
// Chip has no Angular port in this checkout: the chips are a private stand
// in with the React DOM (stand-in-chip.ts).
//
// Names that differ from React:
// - `search` takes the subset of SearchField props in FilterBarSearch, with
//   React's names (`aria-label`, `defaultValue`, `onValueChange`), because
//   Angular cannot spread props onto a component.
// - `onValueChange` is the `valueChange` output of `[(value)]`; `onClear` is
//   the `clear` output.
// - `end` and a filter's `label` take a string or a TemplateRef.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { VISUALLY_HIDDEN } from '../../internal/visually-hidden';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DROPDOWN_MENU } from '../dropdown-menu/dropdown-menu';
import { DsSearchField } from '../search-field/search-field';
import { StandInChip } from './stand-in-chip';

export type FilterBarSize = Extract<Size, 'sm' | 'md'>;
/** A node prop in Angular: text, or a template. */
export type FilterBarText = string | TemplateRef<unknown>;

export interface FilterBarFilter {
  /** The value added to the value array while the filter is on. */
  value: string;
  /** One to three words: Images, Shared with me. */
  label: FilterBarText;
  /** The plain text of the label, for the menu's type ahead when the label is a template. */
  textValue?: string;
  disabled?: boolean;
}

/** The SearchField props the search box takes, with React's names. */
export interface FilterBarSearch {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  placeholder?: string;
  /** Controlled query. */
  value?: string;
  /** Starting query when value is not set. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  loading?: boolean;
  loadingLabel?: string;
  clearLabel?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
}

export interface FilterBarLabels {
  /** The accessible name of the chip group. */
  filters: string;
  /** The more filters button. */
  more: string;
  /** The more filters button while some of its filters are on. */
  moreOn: (count: number) => string;
  /** The clear all button. */
  clear: string;
  /** The active filter count. */
  active: (count: number) => string;
  /** The result count, read once after a change. */
  results: (count: number) => string;
}

const labelsByLang: Record<'en' | 'ar', FilterBarLabels> = {
  en: {
    filters: 'Filters',
    more: 'More filters',
    moreOn: (n) => `More filters (${n})`,
    clear: 'Clear filters',
    active: (n) => (n === 1 ? '1 filter on' : `${n} filters on`),
    results: (n) => (n === 0 ? 'No results' : n === 1 ? '1 result' : `${n} results`),
  },
  ar: {
    filters: 'الفلاتر',
    more: 'فلاتر إضافية',
    moreOn: (n) => `فلاتر إضافية (${n})`,
    clear: 'مسح الفلاتر',
    active: (n) => (n === 1 ? 'فلتر واحد مفعل' : n === 2 ? 'فلترين مفعلين' : n <= 10 ? `${n} فلاتر مفعلة` : `${n} فلتر مفعل`),
    results: (n) => (n === 0 ? 'ما فيه نتائج' : n === 1 ? 'نتيجة وحدة' : n === 2 ? 'نتيجتين' : n <= 10 ? `${n} نتائج` : `${n} نتيجة`),
  },
};

/** The default labels for a language. */
export function filterBarLabels(lang: string | undefined): FilterBarLabels {
  return lang === 'ar' ? labelsByLang.ar : labelsByLang.en;
}

@Component({
  selector: 'div[dsFilterBar]',
  exportAs: 'dsFilterBar',
  imports: [NgTemplateOutlet, DsButton, DS_DROPDOWN_MENU, DsSearchField, StandInChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'filter-bar',
    '[attr.data-size]': 'size()',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.data-overflow-start]': 'overflow().start ? "" : null',
    '[attr.data-overflow-end]': 'overflow().end ? "" : null',
  },
  template: `
    @if (search(); as s) {
      <div dsSearchField [size]="size()" [value]="query()" (valueChange)="setQuery($event)"
        [aria-label]="s['aria-label']" [aria-labelledby]="s['aria-labelledby']" [placeholder]="s.placeholder" [loading]="!!s.loading"
        [loadingLabel]="s.loadingLabel ?? 'Searching'" [clearLabel]="s.clearLabel ?? 'Clear search'" [name]="s.name" [id]="s.id" [disabled]="s.disabled"></div>
    }
    @if (filters().length > 0) {
      <div #strip role="group" [attr.aria-label]="words().filters" data-part="filters">
        @for (f of filters(); track f.value) {
          <button dsStandInChip [size]="size()" [selected]="current().includes(f.value)" [disabled]="!!f.disabled" (click)="toggle(f.value, !current().includes(f.value))"><ng-container *ngTemplateOutlet="text; context: { $implicit: f.label }" /></button>
        }
      </div>
    }
    @if (more().length > 0) {
      <ng-container dsDropdownMenu [size]="size() === 'sm' ? 'sm' : 'md'">
        <button dsButton dsDropdownMenuTrigger [size]="size()" end="chevron-down" data-part="more">{{ moreOn() > 0 ? words().moreOn(moreOn()) : words().more }}</button>
        <ng-template dsDropdownMenuContent>
          @for (f of more(); track f.value) {
            <div dsDropdownMenuCheckboxItem [checked]="current().includes(f.value)" (checkedChange)="toggle(f.value, $event === true)" [disabled]="!!f.disabled"
              [textValue]="f.textValue" (select)="$event.preventDefault()"><ng-container *ngTemplateOutlet="text; context: { $implicit: f.label }" /></div>
          }
        </ng-template>
      </ng-container>
    }
    @if (countText() !== '') {
      <span data-part="count">{{ countText() }}</span>
    }
    @if (active()) {
      <button dsButton [size]="size()" emphasis="ghost" start="close" (click)="clearAll()" data-part="clear">{{ words().clear }}</button>
    }
    @if (end(); as e) {
      <div data-part="end"><ng-container *ngTemplateOutlet="text; context: { $implicit: e }" /></div>
    }
    <span role="status" aria-live="polite" aria-atomic="true" [attr.style]="visuallyHidden">{{ announcement() }}</span>
    <ng-template #text let-value>@if (isText(value)) {{{ value }}} @else {<ng-container [ngTemplateOutlet]="value" />}</ng-template>
  `,
})
export class DsFilterBar {
  /** Props for the search box. Pass at least aria-label or placeholder. Leave it out for no search. */
  readonly search = input<FilterBarSearch | undefined>(undefined);
  /** The quick filters, shown as chips. */
  readonly filters = input<readonly FilterBarFilter[]>([]);
  /** Filters with many values or rarely used ones, in the more menu. */
  readonly more = input<readonly FilterBarFilter[]>([]);
  /** The values of every filter that is on. Write `[(value)]`. */
  readonly value = model<readonly string[] | undefined>(undefined);
  /** Starting value when value is not set. Default none. */
  readonly defaultValue = input<readonly string[]>([]);
  /** The number of results the filters leave. Shown in the count part and read once after a change. */
  readonly resultCount = input<number | undefined>(undefined);
  /** View toggles or a sort menu, at the end of the row. */
  readonly end = input<FilterBarText | undefined>(undefined);
  /** Control height for the search box, the chips and the buttons. Default md. */
  readonly size = input<FilterBarSize>('md');
  /** Copy. Default from the nearest theme language. */
  readonly labels = input<Partial<FilterBarLabels> | undefined>(undefined);
  /** Emits after clear all cleared the value and the search box. React's onClear. */
  readonly clear = output<void>();

  private readonly theme = inject(DsThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly visuallyHidden = VISUALLY_HIDDEN;
  protected readonly words = computed<FilterBarLabels>(() => ({ ...filterBarLabels(this.theme.value().lang), ...this.labels() }));
  private readonly ownValue = signal<readonly string[] | undefined>(undefined);
  private readonly ownQuery = signal<string | undefined>(undefined);
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');
  private readonly searchHost = viewChild(DsSearchField, { read: ElementRef });

  protected readonly current = computed<readonly string[]>(() => this.value() ?? this.ownValue() ?? this.defaultValue());
  protected readonly query = computed(() => this.search()?.value ?? this.ownQuery() ?? this.search()?.defaultValue ?? '');
  private readonly activeCount = computed(() => this.current().length + (this.query().trim() !== '' ? 1 : 0));
  protected readonly active = computed(() => this.activeCount() > 0);
  protected readonly moreOn = computed(() => this.more().filter((f) => this.current().includes(f.value)).length);
  protected readonly countText = computed(() => {
    const words = this.words();
    const count = this.resultCount();
    return [this.active() ? words.active(this.activeCount()) : undefined, count !== undefined ? words.results(count) : undefined]
      .filter(Boolean)
      .join(this.theme.value().lang === 'ar' ? '، ' : ', ');
  });
  protected readonly overflow = signal({ start: false, end: false });
  protected readonly announcement = signal('');
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    consumeHostAttributes(['dsFilterBar', 'search', 'filters', 'more', 'value', 'defaultValue', 'resultCount', 'end', 'size', 'labels']);

    // dsSearchField binds its data-part to "control" inside an InputGroup and
    // to null elsewhere, which drops a static data-part. Its binding stays
    // null here, so the part stamped after render stays. See the lane report.
    afterRenderEffect(() => {
      const el = this.searchHost()?.nativeElement as HTMLElement | undefined;
      if (el && el.getAttribute('data-part') !== 'search') el.setAttribute('data-part', 'search');
    });

    // Edge fades: which ends of the chip strip are clipped, in reading order.
    const measure = () => {
      const el = this.strip()?.nativeElement;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      const scrolled = Math.abs(el.scrollLeft);
      const next = { start: scrolled > 1, end: max - scrolled > 1 };
      const prev = this.overflow();
      if (prev.start !== next.start || prev.end !== next.end) this.overflow.set(next);
    };
    let watched: HTMLElement | undefined;
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    afterRenderEffect(() => {
      const el = this.strip()?.nativeElement;
      // A selected chip grows by its check, so the selection is a dependency too.
      this.current();
      this.filters();
      untracked(() => {
        if (el !== watched) {
          watched?.removeEventListener('scroll', measure);
          if (watched) observer?.unobserve(watched);
          watched = el;
          if (el) {
            el.addEventListener('scroll', measure, { passive: true });
            observer?.observe(el);
          }
        }
        measure();
      });
    });
    inject(DestroyRef).onDestroy(() => {
      watched?.removeEventListener('scroll', measure);
      observer?.disconnect();
    });

    // The result count, read once when it changes after a filter or search change.
    let lastChange: string | undefined;
    let pending = false;
    effect(() => {
      const key = `${this.current().join('\u0000')}\u0001${this.query()}`;
      if (lastChange !== undefined && lastChange !== key) pending = true;
      lastChange = key;
    });
    let lastCount: number | undefined | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect((onCleanup) => {
      const count = this.resultCount();
      const results = this.words().results;
      if (lastCount === null || lastCount === count) {
        lastCount = count;
        return;
      }
      lastCount = count;
      if (!pending || count === undefined) return;
      const text = results(count);
      timer = setTimeout(() => {
        pending = false;
        this.announcement.update((prev) => text + (prev.endsWith(' ') ? '' : ' '));
      }, 600);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected toggle(v: string, on: boolean): void {
    const without = this.current().filter((x) => x !== v);
    this.setValue(on ? [...without, v] : without);
  }

  private setValue(next: string[]): void {
    this.ownValue.set(next);
    this.value.set(next);
  }

  protected setQuery(next: string): void {
    if (next === this.query()) return;
    this.ownQuery.set(next);
    this.search()?.onValueChange?.(next);
  }

  protected clearAll(): void {
    if (this.current().length > 0) this.setValue([]);
    if (this.query() !== '') this.setQuery('');
    this.clear.emit();
    // Clear all hides: hand focus to the search box, else the first chip, else more.
    const target =
      this.host.querySelector<HTMLElement>(':scope > [data-part="search"] input') ??
      this.host.querySelector<HTMLElement>(':scope > [data-part="filters"] button:not([aria-disabled="true"])') ??
      this.host.querySelector<HTMLElement>(':scope > [data-part="more"]');
    target?.focus();
  }
}
