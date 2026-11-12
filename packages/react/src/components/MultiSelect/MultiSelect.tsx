'use client';
// MultiSelect: several values from a list, shown as tags or a count in a
// closed trigger. Hand built on ListBox (multiple) and Radix Popover.
//
// No source for this order: designed from the dials table, Select (the
// trigger box) and ListBox (the rows). The trigger is the APG select-only
// combobox (role combobox on a focusable element that is not a text box),
// so the tags inside it are drawn only and never hold a button: a remove
// button inside a combobox would be a control inside a control. Values are
// removed in the list, or all at once with Clear selection.
//
// The DOM:
//
//   <div data-ds="multi-select" data-size data-shape data-placeholder? data-invalid? data-disabled? data-readonly? data-loading?>
//     <div data-part="trigger" role="combobox" tabindex="0" aria-haspopup="listbox" aria-expanded aria-controls aria-labelledby>
//       <span data-part="value">                     the summary: tags, a count, or the placeholder
//         <span data-part="tag">                     one per shown value, up to maxTags, then "+2"
//         <span data-part="summary-text">            visually hidden: the labels as a list, read as the value
//       <span data-part="icon">                      chevrons-up-down, or a spinner while loading
//     <input type="hidden" name>                     one per value, with name
//   <body>
//     <div data-ds="theme" data-menu-layer>          the portal Theme
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="multi-select" data-part="popup" data-size data-state>   Radix Popover Content, its own root
//           <div data-ds="search-field" data-part="search">                    filters the options
//           <div data-ds="list-box" role="listbox" aria-multiselectable>        the options
//           <div data-part="actions">                                           Select all, Clear selection
//             <button data-ds="button" data-part="select-all">
//             <button data-ds="button" data-part="clear">
//
// Focus: opening moves focus into the popup, to the search field when there
// is one, else to the list. ArrowDown in the search field moves into the
// list. Tab and Shift+Tab move between the search field, the list and the
// actions and stay in the popup. Escape and Enter in the list close it and
// focus goes back to the trigger.
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Popover } from 'radix-ui';
import { Icon } from '@the-system/icons/react';
import type { Shape, Size } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { useField, useFieldControl } from '../Field/Field';
import { FieldContext } from '../Field/context';
import { ListBox, filterListBoxItems, flattenListBoxItems, type ListBoxItem } from '../ListBox';
import { SearchField } from '../SearchField';
import { useFlipGroup, useStaggerOnOpen } from '../ListBox/selectionMotion';

/** The tags of the trigger summary. */
const tagsOf = (value: Element) => Array.from(value.querySelectorAll(":scope > [data-part='tag']"));
import { usePopupLayer } from '../Select/popupLayer';
import { Spinner } from '../Spinner';
import { useControllable } from '../../internal/useControllable';

export type MultiSelectSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type MultiSelectShape = Extract<Shape, 'default' | 'pill'>;
/** tags: the chosen labels as tags, up to maxTags, then "+2". count: "3 selected". */
export type MultiSelectSummary = 'tags' | 'count';

/** Space kept between the popup and the viewport edge, in CSS px (Radix measures in px). */
const VIEWPORT_GUTTER = 8;
/** Gap between the trigger and the popup, in CSS px. */
const TRIGGER_GAP = 4;
/** The search field shows by default when there are more options than this. */
const SEARCH_AFTER = 8;

/** The default count summary, pluralized for the language with Intl.PluralRules (Western digits in Arabic too). */
export function defaultSelectedCount(count: number, lang: string): string {
  if (lang.startsWith('ar')) {
    const rule = new Intl.PluralRules('ar').select(count);
    if (rule === 'zero') return 'ما فيه شيء محدد';
    if (rule === 'one') return 'عنصر واحد محدد';
    if (rule === 'two') return 'عنصرين محددين';
    if (rule === 'few') return `${count} عناصر محددة`;
    return `${count} عنصر محدد`;
  }
  if (count === 0) return 'None selected';
  return `${count} selected`;
}

const words = {
  en: {
    placeholder: 'Choose options',
    search: 'Search options',
    selectAll: 'Select all',
    clear: 'Clear selection',
    empty: 'No results. Try another word.',
    none: 'No options to choose from yet.',
    loading: 'Loading options',
  },
  ar: {
    placeholder: 'اختيار من القائمة',
    search: 'البحث في الخيارات',
    selectAll: 'تحديد الكل',
    clear: 'مسح التحديد',
    empty: 'ما فيه نتائج. جرب كلمة ثانية.',
    none: 'ما فيه خيارات للاختيار.',
    loading: 'جار تحميل الخيارات',
  },
} as const;

const EMPTY: readonly string[] = [];
const TABBABLE = 'input:not([type="hidden"]):not(:disabled), button:not(:disabled), [tabindex="0"]';

export interface MultiSelectProps
  extends Omit<
    ComponentProps<'div'>,
    'title' | 'children' | 'defaultValue' | 'onChange' | 'role' | 'dir' | 'ref' | 'className' | 'style'
  > {
  /** The options, plain or in titled groups, as ListBox takes them. */
  items: readonly ListBoxItem[];
  /** The chosen values in the order they were chosen, controlled with onValueChange. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /** The popup is open, controlled with onOpenChange. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** How the trigger shows the values. Default tags. */
  summary?: MultiSelectSummary;
  /** In tags mode, the most tags shown before "+2". Default 3. */
  maxTags?: number;
  /** The count words. Default "3 selected", pluralized with Intl.PluralRules in Arabic. */
  formatCount?: (count: number) => string;
  /** Shown when nothing is chosen. Default "Choose options". */
  placeholder?: string;
  /** Shows the search field in the popup. Default: when there are more than 8 options. */
  searchable?: boolean;
  /** The name and placeholder of the search field. Default "Search options". */
  searchLabel?: string;
  /** Shows Select all and Clear selection under the list. Default true. */
  actions?: boolean;
  selectAllLabel?: string;
  clearLabel?: string;
  /** Trigger height and the row size of the list: sm uses sm rows. Default md. */
  size?: MultiSelectSize;
  /** default: the style's control radius. pill: fully round. */
  shape?: MultiSelectShape;
  /** Marks the value invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Out of the tab order with aria-disabled. Inside a Field it follows the Field. */
  disabled?: boolean;
  /** The values can be read and focused but not changed: the popup does not open. */
  readOnly?: boolean;
  /** Read as required (aria-required). Inside a Field it follows the Field. */
  required?: boolean;
  /** Options are on their way: the icon is a spinner and the popup says so. */
  loading?: boolean;
  loadingLabel?: string;
  /** Shown in the popup when there is no option, or no match for the search. */
  empty?: ReactNode;
  /** Submits each value under this name in a form (one hidden input per value). */
  name?: string;
  /** Class name of the root, the bordered box. */
  className?: string;
  /** Inline style of the root, the bordered box. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the trigger, the focusable element with role combobox. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A closed trigger that opens a list with checks and keeps any number of
 * values. Space toggles an option, Enter closes, Ctrl+A selects all. Props
 * spread onto the trigger; className, style and rootProps go to the root.
 */
export function MultiSelect({
  items,
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  summary = 'tags',
  maxTags = 3,
  formatCount,
  placeholder,
  searchable,
  searchLabel,
  actions = true,
  selectAllLabel,
  clearLabel,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  loading = false,
  loadingLabel,
  empty,
  name,
  className,
  style,
  rootProps,
  id,
  'aria-describedby': describedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onKeyDown,
  onClick,
  ref,
  ...rest
}: MultiSelectProps) {
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });
  const field = useField();
  const lang: 'en' | 'ar' = useTheme().lang.startsWith('ar') ? 'ar' : 'en';
  const t = words[lang];
  const inert = Boolean(control.disabled || control.readOnly);

  const onArrayChange = useCallback((next: readonly string[]) => onValueChange?.([...next]), [onValueChange]);
  const [value, setValue] = useControllable<readonly string[]>(valueProp, defaultValue, onArrayChange);
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [query, setQuery] = useState('');
  const popupOpen = open && !inert;

  const autoId = useId().replace(/:/g, '');
  const listId = `ds-multi-select-list-${autoId}`;
  const popupId = `${listId}-popup`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const interactedOutside = useRef(false);

  // The Field label points at the trigger with for, which a div cannot take: a press on the label focuses the trigger.
  const labelId = field?.labelId;
  useEffect(() => {
    const label = labelId ? document.getElementById(labelId) : null;
    if (!label) return undefined;
    const focus = () => triggerRef.current?.focus();
    label.addEventListener('click', focus);
    return () => label.removeEventListener('click', focus);
  }, [labelId]);

  const all = useMemo(() => flattenListBoxItems(items), [items]);
  const shown = useMemo(() => filterListBoxItems(items, query), [items, query]);
  const shownOptions = useMemo(() => flattenListBoxItems(shown), [shown]);
  const withSearch = searchable ?? all.length > SEARCH_AFTER;

  // The chosen options in the order they were chosen; a value with no option left is not drawn.
  const chosen = useMemo(
    () => value.map((v) => all.find((o) => o.value === v)).filter((o): o is NonNullable<typeof o> => o !== undefined),
    [value, all],
  );
  const countText = formatCount ? formatCount(chosen.length) : defaultSelectedCount(chosen.length, lang);
  const listText = useMemo(() => {
    const labels = chosen.map((o) => o.label);
    try {
      return new Intl.ListFormat(lang, { type: 'conjunction' }).format(labels);
    } catch {
      return labels.join(', ');
    }
  }, [chosen, lang]);
  const shownTags = chosen.slice(0, Math.max(0, maxTags));
  const more = chosen.length - shownTags.length;

  const setOpenState = (next: boolean) => {
    if (next && inert) return;
    if (next) {
      interactedOutside.current = false;
      setQuery('');
    }
    setOpen(next);
  };

  const enabledShown = shownOptions.filter((o) => !o.disabled).map((o) => o.value);
  const selectAll = () => {
    if (inert) return;
    const next = [...value];
    for (const v of enabledShown) if (!next.includes(v)) next.push(v);
    setValue(next);
  };
  const clear = () => {
    if (inert) return;
    // Disabled options stay as they are: they cannot be changed from the list either.
    setValue(value.filter((v) => all.find((o) => o.value === v)?.disabled));
  };

  const focusList = () => {
    listRef.current?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      setOpenState(true);
    }
  };

  const onPopupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    // Tab and Shift+Tab move between the search field, the list and the actions, and stay in the popup.
    const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(TABBABLE));
    if (stops.length === 0) return;
    const at = stops.findIndex((el) => el === document.activeElement || el.contains(document.activeElement));
    event.preventDefault();
    const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === -1 || at === stops.length - 1 ? 0 : at + 1;
    stops[next]?.focus();
  };

  const setTriggerRef = (node: HTMLDivElement | null) => {
    triggerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const layer = usePopupLayer(popupOpen);
  // menu-rows: the options arrive one stagger step after the popup surface, each time it opens.
  const popupRef = useStaggerOnOpen("[data-ds='list-box'] [data-part='option']", layer.onContent);
  // collection-flip: the tags in the trigger move, pop in and shrink out as the selection changes.
  const valueRef = useRef<HTMLSpanElement>(null);
  useFlipGroup(valueRef, { items: tagsOf });
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
  const listSize = size === 'sm' ? 'sm' : 'md';
  const hasOptions = all.length > 0;

  const popup = (
    <Popover.Content
      ref={popupRef}
      side="bottom"
      align="start"
      sideOffset={TRIGGER_GAP}
      collisionPadding={VIEWPORT_GUTTER}
      // A popup of options with its own search and actions, not a dialog: no role of its own.
      role={undefined}
      id={popupId}
      data-ds="multi-select"
      data-part="popup"
      data-size={size}
      onKeyDown={onPopupKeyDown}
      onInteractOutside={(event) => {
        // A press on the trigger toggles the popup itself.
        if (rootRef.current?.contains(event.target as Node)) event.preventDefault();
        else interactedOutside.current = true;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (!interactedOutside.current) triggerRef.current?.focus();
      }}
    >
      {/* The popup is portaled out of the Field: its search field must not take the Field's id, label or error. */}
      <FieldContext value={null}>
        {withSearch && hasOptions && (
          <SearchField
            size="sm"
            value={query}
            onValueChange={setQuery}
            placeholder={searchLabel ?? t.search}
            aria-label={searchLabel ?? t.search}
            aria-controls={listId}
            rootProps={{ 'data-part': 'search' } as ComponentProps<'div'>}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusList();
              }
              // Enter in the search field does not submit a form around the MultiSelect.
              if (event.key === 'Enter') event.preventDefault();
            }}
          />
        )}
        <ListBox
          ref={listRef}
          id={listId}
          selectionMode="multiple"
          items={shown}
          size={listSize}
          query={query}
          value={value}
          onValueChange={(next) => setValue(next)}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          empty={loading ? (loadingLabel ?? t.loading) : (empty ?? (hasOptions ? t.empty : t.none))}
          aria-busy={loading || undefined}
          onKeyDown={(event) => {
            // Enter closes; Space toggles (ListBox).
            if (event.key === 'Enter') {
              event.preventDefault();
              setOpenState(false);
            }
          }}
        />
        {actions && hasOptions && (
          <div data-part="actions">
            <Button
              data-part="select-all"
              size="sm"
              emphasis="ghost"
              disabled={enabledShown.every((v) => value.includes(v))}
              onClick={selectAll}
            >
              {selectAllLabel ?? t.selectAll}
            </Button>
            <Button
              data-part="clear"
              size="sm"
              emphasis="ghost"
              disabled={!chosen.some((o) => !o.disabled)}
              onClick={clear}
            >
              {clearLabel ?? t.clear}
            </Button>
          </div>
        )}
      </FieldContext>
    </Popover.Content>
  );

  return (
    <Popover.Root open={popupOpen} onOpenChange={setOpenState} modal={false}>
      <Popover.Anchor asChild>
        <div
          {...rootProps}
          ref={rootRef}
          className={className}
          style={style}
          data-ds="multi-select"
          data-size={size}
          data-shape={shape}
          data-placeholder={chosen.length === 0 ? '' : undefined}
          data-invalid={control['aria-invalid'] ? '' : undefined}
          data-disabled={control.disabled ? '' : undefined}
          data-readonly={control.readOnly ? '' : undefined}
          data-loading={loading ? '' : undefined}
        >
          <div
            {...rest}
            ref={setTriggerRef}
            id={control.id}
            data-part="trigger"
            role="combobox"
            tabIndex={control.disabled ? -1 : 0}
            aria-haspopup="listbox"
            aria-expanded={popupOpen}
            aria-controls={popupOpen ? listId : undefined}
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-describedby={control['aria-describedby']}
            aria-invalid={control['aria-invalid']}
            aria-required={control['aria-required']}
            aria-disabled={control.disabled || undefined}
            aria-readonly={control.readOnly || undefined}
            aria-busy={loading || undefined}
            onKeyDown={onTriggerKeyDown}
            onClick={(event) => {
              onClick?.(event);
              if (event.defaultPrevented || inert) return;
              setOpenState(!popupOpen);
            }}
          >
            <span data-part="value" ref={valueRef}>
              {chosen.length === 0 && (placeholder ?? t.placeholder)}
              {chosen.length > 0 && summary === 'count' && countText}
              {chosen.length > 0 && summary === 'tags' && (
                <>
                  {shownTags.map((o) => (
                    <span key={o.value} data-part="tag" aria-hidden="true">
                      {o.label}
                    </span>
                  ))}
                  {more > 0 && (
                    <span data-part="tag" data-more="" aria-hidden="true">
                      +{more}
                    </span>
                  )}
                  <span data-part="summary-text">{listText}</span>
                </>
              )}
            </span>
            <span data-part="icon" aria-hidden="true">
              {loading ? <Spinner size="sm" decorative /> : <Icon name="chevrons-up-down" size="md" />}
            </span>
          </div>
          {name !== undefined &&
            chosen.map((o) => <input key={o.value} type="hidden" name={name} value={o.value} disabled={control.disabled} />)}
        </div>
      </Popover.Anchor>
      {layer.render(popup)}
    </Popover.Root>
  );
}
