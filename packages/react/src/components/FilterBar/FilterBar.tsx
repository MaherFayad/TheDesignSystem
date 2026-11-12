'use client';
// FilterBar: the row above a list. A search box, quick filter chips, more
// filters in a menu, the active filter count, clear all, and an end slot for
// view toggles.
//
// Sources: Figma-Killer-2 `FilterBar/` (a search row over a chip strip that
// scrolls sideways with edge fades only where content is clipped, aria
// pressed chips in a role group, a trailing slot). GoBanana
// `GalleryFilter.tsx` could not be read in the lane 4A session.
//
// Decisions:
// - The order names ToggleGroup, MultiSelect and Select. None of them exists
//   in this checkout, so the filters part is a role group of pressable Chips
//   (aria-pressed), and more is a DropdownMenu of checkbox items that stays
//   open while the person picks. Each chip is its own tab stop, as in the
//   Figma-Killer-2 source. Swap in ToggleGroup and MultiSelect when they land:
//   the anatomy stays the same.
// - One value array holds every filter that is on, from the chips and from
//   the menu, so the app reads one list.
// - The chip strip scrolls sideways inside itself and never scrolls the page
//   (WCAG 1.4.10 at 320px). The root carries data-overflow-start and
//   data-overflow-end, read in logical terms, so the fades flip in RTL.
// - The result count is announced politely once: when resultCount changes
//   after a filter or search change, 600ms after the last such change, so
//   typing does not read every count and a slow count is not read stale.
//   A change that leaves the count the same is not announced.
// - Clear all hides when nothing is on, so focus moves to the search box (or
//   the first chip) when it is used.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { VisuallyHidden } from 'radix-ui';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { useControllable } from '../../internal/useControllable';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../DropdownMenu';
import { SearchField, type SearchFieldProps } from '../SearchField';

export type FilterBarSize = Extract<Size, 'sm' | 'md'>;

export interface FilterBarFilter {
  /** The value added to the value array while the filter is on. */
  value: string;
  /** One to three words: Images, Shared with me. */
  label: ReactNode;
  /** The plain text of the label, for the menu's type ahead when the label is not a string. */
  textValue?: string;
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

export interface FilterBarProps extends Omit<ComponentProps<'div'>, 'title' | 'defaultValue' | 'onChange'> {
  /** Props for the search box. Pass at least aria-label or placeholder copy. Leave it out for no search. */
  search?: Omit<SearchFieldProps, 'size'>;
  /** The quick filters, shown as chips. */
  filters?: readonly FilterBarFilter[];
  /** Filters with many values or rarely used ones, in the more menu. */
  more?: readonly FilterBarFilter[];
  /** Controlled: the values of every filter that is on. */
  value?: readonly string[];
  /** Uncontrolled starting value. Default none. */
  defaultValue?: readonly string[];
  /** Called with the new list of values. */
  onValueChange?: (value: string[]) => void;
  /** Called by clear all, after the value and the search box are cleared. */
  onClear?: () => void;
  /** The number of results the filters leave. Shown in the count part and read once after a change. */
  resultCount?: number;
  /** View toggles or a sort menu, at the end of the row. */
  end?: ReactNode;
  /** Control height for the search box, the chips and the buttons. Default md. */
  size?: FilterBarSize;
  /** Copy. Default from the nearest Theme language. */
  labels?: Partial<FilterBarLabels>;
}

/** The search, filters and clear all row above a list. */
export function FilterBar({
  search,
  filters = [],
  more = [],
  value: valueProp,
  defaultValue = [],
  onValueChange,
  onClear,
  resultCount,
  end,
  size = 'md',
  labels: labelsProp,
  ...rest
}: FilterBarProps) {
  const { lang } = useTheme();
  const labels = { ...filterBarLabels(lang), ...labelsProp };
  const [value, setValue] = useControllable<readonly string[]>(valueProp, defaultValue, onValueChange as ((v: readonly string[]) => void) | undefined);
  const [query, setQuery] = useControllable<string>(search?.value, search?.defaultValue ?? '', search?.onValueChange);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });
  const [announcement, setAnnouncement] = useState('');

  const toggle = (v: string, on: boolean) => {
    const without = value.filter((x) => x !== v);
    setValue(on ? [...without, v] : without);
  };

  const activeCount = value.length + (query.trim() !== '' ? 1 : 0);
  const active = activeCount > 0;
  const moreOn = more.filter((f) => value.includes(f.value)).length;

  const clearAll = () => {
    if (value.length > 0) setValue([]);
    if (query !== '') setQuery('');
    onClear?.();
    // Clear all hides: hand focus to the search box, else the first chip.
    const root = rootRef.current;
    const target =
      root?.querySelector<HTMLElement>(':scope > [data-part="search"] input') ??
      root?.querySelector<HTMLElement>(':scope > [data-part="filters"] button:not([aria-disabled="true"])') ??
      root?.querySelector<HTMLElement>(':scope > [data-part="more"]');
    target?.focus();
  };

  // Edge fades: which ends of the chip strip are clipped, in reading order.
  const measure = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrolled = Math.abs(el.scrollLeft);
    const next = { start: scrolled > 1, end: max - scrolled > 1 };
    setOverflow((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
    // A selected chip grows by its check, so the selection is a dependency too.
  }, [measure, filters.length, value.length]);

  // The result count, read once when it changes after a filter or search change.
  const changeKey = `${value.join('\u0000')}\u0001${query}`;
  const lastChange = useRef(changeKey);
  const pending = useRef(false);
  useEffect(() => {
    if (lastChange.current === changeKey) return;
    lastChange.current = changeKey;
    pending.current = true;
  }, [changeKey]);
  const lastCount = useRef(resultCount);
  const resultsLabel = labels.results;
  useEffect(() => {
    if (lastCount.current === resultCount) return undefined;
    lastCount.current = resultCount;
    if (!pending.current || resultCount === undefined) return undefined;
    const text = resultsLabel(resultCount);
    const timer = setTimeout(() => {
      pending.current = false;
      setAnnouncement((prev) => text + (prev.endsWith('\u00a0') ? '' : '\u00a0'));
    }, 600);
    return () => clearTimeout(timer);
  }, [resultCount, resultsLabel]);

  const countText = [active ? labels.active(activeCount) : undefined, resultCount !== undefined ? labels.results(resultCount) : undefined]
    .filter(Boolean)
    .join(lang === 'ar' ? '، ' : ', ');

  return (
    <div
      {...rest}
      ref={rootRef}
      data-ds="filter-bar"
      data-size={size}
      data-active={active ? '' : undefined}
      data-overflow-start={overflow.start ? '' : undefined}
      data-overflow-end={overflow.end ? '' : undefined}
    >
      {search && (
        <SearchField
          {...search}
          size={size}
          value={query}
          onValueChange={setQuery}
          rootProps={{ ...search.rootProps, 'data-part': 'search' } as SearchFieldProps['rootProps']}
        />
      )}
      {filters.length > 0 && (
        <div ref={stripRef} role="group" aria-label={labels.filters} data-part="filters">
          {filters.map((f) => (
            <Chip
              key={f.value}
              size={size}
              selected={value.includes(f.value)}
              disabled={f.disabled}
              onClick={() => toggle(f.value, !value.includes(f.value))}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      )}
      {more.length > 0 && (
        <DropdownMenu size={size === 'sm' ? 'sm' : 'md'}>
          <DropdownMenuTrigger>
            <Button size={size} end="chevron-down" data-part="more">
              {moreOn > 0 ? labels.moreOn(moreOn) : labels.more}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {more.map((f) => (
              <DropdownMenuCheckboxItem
                key={f.value}
                checked={value.includes(f.value)}
                disabled={f.disabled}
                textValue={f.textValue}
                onCheckedChange={(on) => toggle(f.value, on === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {f.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {countText !== '' && <span data-part="count">{countText}</span>}
      {active && (
        <Button size={size} emphasis="ghost" start="close" onClick={clearAll} data-part="clear">
          {labels.clear}
        </Button>
      )}
      {end !== undefined && end !== null && end !== false && <div data-part="end">{end}</div>}
      <VisuallyHidden.Root role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden.Root>
    </div>
  );
}
