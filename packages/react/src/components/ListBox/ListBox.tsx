'use client';
// ListBox: the shared option list of the list family. Used alone in a page,
// and inside the popups of Combobox, Autocomplete, MultiSelect, TagField and
// CommandPalette. Hand built (no Radix primitive has a listbox): role
// listbox, options role option, single or multiple selection, groups,
// descriptions, the matched part of each label marked.
//
// Sources: GoBanana `.st-menu` option rows in studio-components.css (rows of
// the list height, the card radius family, the check that carries the
// selected state, the overlay step on the lit row), Figma-Killer-2
// `Select/selectKeyboard.ts` (arrows, Home, End, typeahead) and
// `Select/useSelectValue.ts` (one value or many), Figma-Killer-2
// `ContextMenu/MenuSearchHeader.tsx` (the filter query owned by the header,
// the list only renders what matches).
//
// Two focus models:
//
//   alone (virtualFocus false)   roving tabindex: the highlighted option is
//                                the one tab stop and takes focus; arrows,
//                                Home, End and typeahead move it.
//   in an owner (virtualFocus)   focus stays on the owner (a combobox input).
//                                Options never take focus; the owner points
//                                aria-activedescendant at listBoxOptionId()
//                                and moves the highlight with the shared
//                                helpers in @the-system/shared (listbox.ts).
//
// The DOM:
//
//   <div data-ds="list-box" role="listbox" data-size data-orientation aria-multiselectable?>
//     <div data-part="option" role="option" id aria-selected data-highlighted? data-selected? data-disabled?>
//       <span data-part="indicator">             the check, present on every row so labels line up
//       <span data-part="option-icon">           leading icon or node, decorative
//       <span data-part="option-label">          the label; the match sits in a <mark>
//       <span data-part="option-description">    a second line, read as the description
//     <div data-part="group" role="group" aria-labelledby>
//       <div data-part="group-label" role="presentation">
//       ...options
//     <div data-part="separator" aria-hidden>    between groups, drawn only
//     <div data-part="empty">                    shown when there is no option
//     <span data-part="highlight" aria-hidden>   the one marker that draws the lit row's fill and
//                                                slides from row to row (order 1.23, highlightMarker.tsx)
//
// Filtering is not done here: the owner keeps the query, runs filterItems()
// from @the-system/shared on the items, passes what matches, and passes the
// query so the match is marked. No virtualization in wave 1.
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import {
  createTypeahead,
  edgeEnabledIndex,
  filterItems,
  matchRanges,
  nextEnabledIndex,
  selectAllValues,
  selectValue,
  typeaheadIndex,
  type SelectionMode,
  type Size,
} from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { HighlightMarker, drawCheck, useHighlightMarker, CHECK_DRAW_ID } from './highlightMarker';
import { useMotion } from '../../internal/motion';

/** Row sizes: sm 24px rows, md list.row.height (28px at default density). */
export type ListBoxSize = Extract<Size, 'sm' | 'md'>;
/** vertical: one column, ArrowDown and ArrowUp. horizontal: one row, ArrowRight and ArrowLeft in reading order. */
export type ListBoxOrientation = 'vertical' | 'horizontal';
/** Leading content of an option: a system icon name or a node. */
export type ListBoxSlotContent = IconName | ReactElement;
export type ListBoxSelectionMode = SelectionMode;

/** One option. `value` is unique in the list. */
export interface ListBoxOption {
  value: string;
  /** The visible label, plain text, so the match can be marked and typeahead can read it. */
  label: string;
  /** A second line, read as the option's description. */
  description?: string;
  /** Leading icon or node. Decorative: the label names the option. */
  start?: ListBoxSlotContent;
  /** Stays in the list, announced as unavailable, skipped by the arrow keys, never selected. */
  disabled?: boolean;
  /** More words the option is found by (an airport code, a former name). Not shown. */
  keywords?: readonly string[];
}

/** A titled group of options. */
export interface ListBoxSection {
  /** The visible group title, which also names the group. */
  label: string;
  options: readonly ListBoxOption[];
  /** A stable key for the group. Default: the label. */
  key?: string;
}

export type ListBoxItem = ListBoxOption | ListBoxSection;

export function isListBoxSection(item: ListBoxItem): item is ListBoxSection {
  return 'options' in item;
}

/** The options of a list in visual order, groups opened. */
export function flattenListBoxItems(items: readonly ListBoxItem[]): ListBoxOption[] {
  const out: ListBoxOption[] = [];
  for (const item of items) {
    if (isListBoxSection(item)) out.push(...item.options);
    else out.push(item);
  }
  return out;
}

/** The DOM id of an option, for aria-activedescendant. Stable for a value, safe for any characters. */
export function listBoxOptionId(listId: string, value: string): string {
  let safe = '';
  for (const ch of value) safe += /[A-Za-z0-9-]/.test(ch) ? ch : `_${(ch.codePointAt(0) ?? 0).toString(16)}`;
  return `${listId}-option-${safe}`;
}

/** The label with the matched range wrapped in <mark>. */
function MarkedLabel({ text, query }: { text: string; query: string }) {
  const [range] = query ? matchRanges(text, query) : [];
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range.start)}
      <mark>{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}

interface CommonProps
  extends Omit<ComponentProps<'div'>, 'title' | 'children' | 'defaultValue' | 'onChange' | 'dir'> {
  /** The options, plain or in titled groups. A separator is drawn between groups. */
  items: readonly ListBoxItem[];
  /** Row height and type size. Default md. */
  size?: ListBoxSize;
  /** Default vertical. */
  orientation?: ListBoxOrientation;
  /**
   * The highlighted option (the keyboard cursor), controlled with
   * onHighlightedValueChange. An owner that keeps focus sets it.
   */
  highlightedValue?: string | null;
  /** Called when the arrows, typeahead or the pointer move the highlight. */
  onHighlightedValueChange?: (value: string | null) => void;
  /**
   * true: focus stays on an owner (a combobox input) that points
   * aria-activedescendant at the highlighted option. Options take no focus,
   * the list handles no keys, and the pointer moves the highlight. Default
   * false: the list is one tab stop and the arrow keys move focus.
   */
  virtualFocus?: boolean;
  /** The text the owner filtered with. The matched part of each label is marked. */
  query?: string;
  /** ArrowDown on the last option goes to the first. Default false. */
  loop?: boolean;
  /** Shown in place of the options when there are none: say what to do next. */
  empty?: ReactNode;
  /** No option can be chosen. The list stays readable and focusable, with aria-disabled. */
  disabled?: boolean;
  /** The selection can be read and moved through but not changed. */
  readOnly?: boolean;
  /** Runs after an option is chosen by click, Enter or Space, with its value. */
  onOptionSelect?: (value: string) => void;
}

export interface ListBoxSingleProps extends CommonProps {
  /** single: one value or none. Default single. */
  selectionMode?: 'single';
  /** The chosen value, controlled with onValueChange. null: none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Choosing the chosen option again clears it. Default false. */
  allowEmpty?: boolean;
}

export interface ListBoxMultipleProps extends CommonProps {
  /** multiple: any number of values; Space toggles an option. */
  selectionMode: 'multiple';
  /** The chosen values in the order they were chosen, controlled with onValueChange. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  allowEmpty?: never;
}

export type ListBoxProps = ListBoxSingleProps | ListBoxMultipleProps;

const EMPTY: readonly string[] = [];

/**
 * A list of options to choose one or many from. Props spread onto the root,
 * which needs a name: aria-label or aria-labelledby (a FieldLabel id).
 */
export function ListBox(props: ListBoxProps) {
  const {
    items,
    size = 'md',
    orientation = 'vertical',
    highlightedValue: highlightedProp,
    onHighlightedValueChange,
    virtualFocus = false,
    query = '',
    loop = false,
    empty,
    disabled = false,
    readOnly = false,
    onOptionSelect,
    selectionMode = 'single',
    value: valueProp,
    defaultValue,
    onValueChange,
    allowEmpty = false,
    id: idProp,
    onKeyDown,
    ...rest
  } = props;
  const multiple = selectionMode === 'multiple';
  const { dir } = useTheme();
  const autoId = useId();
  const id = idProp ?? `ds-list-box-${autoId.replace(/:/g, '')}`;

  // The selection is kept as an array in both modes.
  const toArray = (v: string | null | readonly string[] | undefined): readonly string[] | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return EMPTY;
    return typeof v === 'string' ? [v] : v;
  };
  const onArrayChange = useCallback(
    (next: readonly string[]) => {
      if (!onValueChange) return;
      if (multiple) (onValueChange as (v: string[]) => void)([...next]);
      else (onValueChange as (v: string | null) => void)(next[0] ?? null);
    },
    [onValueChange, multiple],
  );
  const [selected, setSelected] = useControllable<readonly string[]>(
    toArray(valueProp),
    toArray(defaultValue) ?? EMPTY,
    onArrayChange,
  );

  // A group with no option left (after a filter) is not drawn.
  const shown = useMemo(() => items.filter((item) => !isListBoxSection(item) || item.options.length > 0), [items]);
  const options = useMemo(() => flattenListBoxItems(shown), [shown]);
  // A disabled list can still be read and moved through; only the options marked disabled are skipped.
  const isDisabled = useCallback((i: number) => options[i]?.disabled ?? false, [options]);
  const [highlighted, setHighlightedState] = useControllable<string | null>(
    highlightedProp,
    null,
    onHighlightedValueChange,
  );
  const highlightIndex = highlighted === null ? -1 : options.findIndex((o) => o.value === highlighted);

  // The one tab stop when alone: the highlight, else the first selected option, else the first enabled one.
  const tabStop = useMemo(() => {
    if (highlightIndex !== -1) return options[highlightIndex]?.value ?? null;
    const sel = options.find((o) => selected.includes(o.value) && !o.disabled);
    if (sel) return sel.value;
    const first = edgeEnabledIndex(options.length, 'first', (i) => options[i]?.disabled ?? false);
    return first === -1 ? (options[0]?.value ?? null) : (options[first]?.value ?? null);
  }, [highlightIndex, options, selected]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  // highlight-marker: one marker draws the lit row's fill and slides from row to row.
  // Alone, the list lights a row on focus only, so the marker also follows the pointer.
  const markerRef = useHighlightMarker({
    rows: "[data-part='option']",
    hover: !virtualFocus,
    colors: virtualFocus ? undefined : MARKER_COLORS,
  });
  // check-draw-pick: the check of an option chosen now draws itself. Not on first paint.
  const motion = useMotion();
  const selectedBefore = useRef<readonly string[] | null>(null);
  useLayoutEffect(() => {
    const before = selectedBefore.current;
    selectedBefore.current = selected;
    if (!before || !rootRef.current) return;
    const mode = motion.mode(CHECK_DRAW_ID);
    for (const v of selected) {
      if (before.includes(v)) continue;
      const row = rootRef.current.querySelector(`#${CSS.escape(listBoxOptionId(id, v))} > [data-part='indicator']`);
      drawCheck(row, mode);
    }
  }, [selected, id, motion]);
  const fromKeyboard = useRef(false);
  const fromPointer = useRef(false);
  const typeahead = useMemo(() => createTypeahead(), []);

  const highlight = (index: number, focus: boolean) => {
    const option = options[index];
    if (!option) return;
    fromKeyboard.current = true;
    setHighlightedState(option.value);
    if (focus && !virtualFocus) {
      rootRef.current?.querySelector<HTMLElement>(`#${CSS.escape(listBoxOptionId(id, option.value))}`)?.focus();
    }
  };

  // Keep the highlighted option in view when the keys move it (the list scrolls inside).
  // With virtualFocus the owner moves the highlight, so every change scrolls except one made by the pointer.
  useEffect(() => {
    const scroll = virtualFocus ? !fromPointer.current : fromKeyboard.current;
    fromKeyboard.current = false;
    fromPointer.current = false;
    if (!scroll || highlighted === null) return;
    const el = rootRef.current?.querySelector<HTMLElement>(`#${CSS.escape(listBoxOptionId(id, highlighted))}`);
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [highlighted, id, virtualFocus]);

  const choose = (option: ListBoxOption) => {
    if (disabled || readOnly || option.disabled) return;
    setSelected(selectValue(selectionMode, selected, option.value, allowEmpty));
    onOptionSelect?.(option.value);
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || virtualFocus) return;
    const current = highlightIndex !== -1 ? highlightIndex : options.findIndex((o) => o.value === tabStop);
    const rtl = dir === 'rtl';
    const forward = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const key = event.key;
    if (key === forward || key === back) {
      event.preventDefault();
      const next = nextEnabledIndex(options.length, current, key === forward ? 1 : -1, isDisabled, loop);
      if (next !== -1) highlight(next, true);
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const next = edgeEnabledIndex(options.length, key === 'Home' ? 'first' : 'last', isDisabled);
      if (next !== -1) highlight(next, true);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      const option = options[current];
      if (!option) return;
      event.preventDefault();
      choose(option);
      return;
    }
    if (multiple && (event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a') {
      event.preventDefault();
      if (disabled || readOnly) return;
      setSelected(
        selectAllValues(
          selected,
          options.map((o) => o.value),
          (v) => options.find((o) => o.value === v)?.disabled ?? false,
        ),
      );
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && key !== ' ') {
      const next = typeaheadIndex(
        options.map((o) => o.label),
        typeahead.push(key),
        current,
        isDisabled,
      );
      if (next !== -1) highlight(next, true);
    }
  };

  const renderOption = (option: ListBoxOption) => {
    const optionId = listBoxOptionId(id, option.value);
    const isSelected = selected.includes(option.value);
    const isHighlighted = highlighted === option.value;
    const off = disabled || option.disabled === true;
    return (
      <div
        key={option.value}
        id={optionId}
        role="option"
        data-part="option"
        aria-selected={isSelected}
        aria-disabled={off || undefined}
        aria-labelledby={`${optionId}-label`}
        aria-describedby={option.description ? `${optionId}-description` : undefined}
        tabIndex={virtualFocus ? undefined : option.value === tabStop ? 0 : -1}
        data-highlighted={isHighlighted ? '' : undefined}
        data-selected={isSelected ? '' : undefined}
        data-disabled={off ? '' : undefined}
        onFocus={virtualFocus ? undefined : () => setHighlightedState(option.value)}
        onPointerMove={
          virtualFocus && !off && !isHighlighted
            ? () => {
                fromPointer.current = true;
                setHighlightedState(option.value);
              }
            : undefined
        }
        // An owner keeps focus: a press on an option must not move it.
        onMouseDown={virtualFocus ? (event) => event.preventDefault() : undefined}
        onClick={() => choose(option)}
      >
        <span data-part="indicator" aria-hidden="true">
          {isSelected && <Icon name="check" size="md" />}
        </span>
        {option.start !== undefined && (
          <span data-part="option-icon" aria-hidden="true">
            {typeof option.start === 'string' ? <Icon name={option.start} size="md" /> : option.start}
          </span>
        )}
        <span data-part="option-label" id={`${optionId}-label`}>
          <MarkedLabel text={option.label} query={query} />
        </span>
        {option.description !== undefined && (
          <span data-part="option-description" id={`${optionId}-description`}>
            {option.description}
          </span>
        )}
      </div>
    );
  };

  const isEmpty = options.length === 0;

  // Stable, so the marker keeps watching across renders.
  const forwardRef = rest.ref;
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      markerRef(node);
      if (typeof forwardRef === 'function') forwardRef(node);
      else if (forwardRef) forwardRef.current = node;
    },
    [forwardRef, markerRef],
  );

  return (
    <div
      {...rest}
      ref={setRootRef}
      id={id}
      // A listbox must own options: with none, the root is a named group that holds the empty text.
      role={isEmpty ? 'group' : 'listbox'}
      data-ds="list-box"
      data-size={size}
      data-orientation={orientation}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      aria-orientation={!isEmpty && orientation === 'horizontal' ? 'horizontal' : undefined}
      aria-multiselectable={(!isEmpty && multiple) || undefined}
      aria-disabled={disabled || undefined}
      aria-readonly={(!isEmpty && readOnly) || undefined}
      onKeyDown={onRootKeyDown}
      onBlur={(event) => {
        rest.onBlur?.(event);
        // Alone: leaving the list clears the highlight, so no second lit row stays and Tab comes back to the selected option.
        if (virtualFocus || highlightedProp !== undefined) return;
        const next = event.relatedTarget as Node | null;
        if (!next || !event.currentTarget.contains(next)) setHighlightedState(null);
      }}
    >
      {isEmpty && empty !== undefined && <div data-part="empty">{empty}</div>}
      {shown.map((item, i) => {
        if (!isListBoxSection(item)) return renderOption(item);
        const key = item.key ?? item.label;
        const labelId = `${id}-group-${i}`;
        return (
          <Fragment key={`group-${key}`}>
            {i > 0 && <div data-part="separator" aria-hidden="true" />}
            <div role="group" data-part="group" aria-labelledby={labelId}>
              <div data-part="group-label" id={labelId} role="presentation">
                {item.label}
              </div>
              {item.options.map(renderOption)}
            </div>
          </Fragment>
        );
      })}
      {!isEmpty && <HighlightMarker />}
    </div>
  );
}

/** The marker's colors when the list holds focus itself: the lit fill, and the hover veil. */
const MARKER_COLORS = { lit: 'var(--_list-box-highlight-bg)', hover: 'var(--_list-box-option-bg-hover)' };

/**
 * The items that match `query`, groups kept, best matches first inside each
 * group (filterItems from @the-system/shared, on the label then the
 * keywords). An empty query returns the items as they are. Owners pass the
 * result as `items` and the query as `query`.
 */
export function filterListBoxItems(items: readonly ListBoxItem[], query: string): ListBoxItem[] {
  if (!query.trim()) return items.slice();
  const text = (o: ListBoxOption) => [o.label, ...(o.keywords ?? [])];
  const out: ListBoxItem[] = [];
  let loose: ListBoxOption[] = [];
  const flush = () => {
    if (loose.length) out.push(...filterItems(loose, query, text));
    loose = [];
  };
  for (const item of items) {
    if (!isListBoxSection(item)) {
      loose.push(item);
      continue;
    }
    flush();
    const options = filterItems(item.options, query, text);
    if (options.length) out.push({ ...item, options });
  }
  flush();
  return out;
}
