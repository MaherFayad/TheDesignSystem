// ListBox: the shared option list of the list family. The twin of
// packages/react/src/components/ListBox/ListBox.tsx, on the same DOM, so
// ListBox.css applies as it is. Used alone in a page, and inside the popups
// of Combobox, Autocomplete, MultiSelect and TagField.
//
//   <div dsListBox aria-label="Sort by" [items]="sort" [(value)]="sortBy"></div>
//   <div dsListBox aria-label="Folders" selectionMode="multiple" [items]="folders" [formControl]="picked"></div>
//
// The DOM:
//
//   <div data-ds="list-box" role="listbox" data-size data-orientation aria-multiselectable?>   the host
//     <div data-part="option" role="option" id aria-selected data-highlighted? data-selected? data-disabled?>
//       <span aria-hidden>  the row fill that glides from the last lit row (row-glide), no part name
//       <span data-part="indicator">  <span data-part="option-icon">
//       <span data-part="option-label">  (the match in a <mark>)  <span data-part="option-description">
//     <div data-part="separator" aria-hidden>
//     <div data-part="group" role="group" aria-labelledby>
//       <div data-part="group-label" role="presentation">
//     <div data-part="empty">
//
// Two focus models, as in React: alone, a roving tabindex (the highlighted
// option is the one tab stop); with virtualFocus, an owner keeps focus and
// points aria-activedescendant at listBoxOptionId(). The highlight is kept
// by internal/list-highlight.ts (a CDK ActiveDescendantKeyManager kept in
// step; the keys land where the shared listbox.ts helpers say). Angular Aria
// Listbox would replace that once order A3.0 installs @angular/aria.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`, `onHighlightedValueChange` the `highlightedValueChange`
// output of `[(highlightedValue)]`, `onOptionSelect` the `optionSelect`
// output. `empty` and an option's `start` take text (an icon name for
// `start`) or a TemplateRef. `value` is one input for both modes: a string
// or null in single mode, an array in multiple mode. Root attributes
// (aria-label, style) go on the host, which is the root.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  TemplateRef,
  afterRenderEffect,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import {
  createTypeahead,
  filterItems,
  matchRanges,
  selectAllValues,
  selectValue,
  typeaheadIndex,
  type SelectionMode,
  type Size,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { ListHighlight } from '../../internal/list-highlight';
import { injectRowGlide } from '../../internal/motion-selection';
import { optionalBoolean } from '../../internal/optional-boolean';

/** Row sizes: sm 24px rows, md list.row.height (28px at default density). */
export type ListBoxSize = Extract<Size, 'sm' | 'md'>;
export type ListBoxOrientation = 'vertical' | 'horizontal';
/** Leading content of an option: a system icon name or a template. */
export type ListBoxSlotContent = IconName | TemplateRef<unknown>;
export type ListBoxSelectionMode = SelectionMode;
/** Text, or a template, for the empty part. */
export type ListBoxContent = string | TemplateRef<unknown>;
/** single: a value or null. multiple: the values in the order they were chosen. */
export type ListBoxValue = string | null | readonly string[];

/** One option. `value` is unique in the list. */
export interface ListBoxOption {
  value: string;
  /** The visible label, plain text, so the match can be marked and typeahead can read it. */
  label: string;
  /** A second line, read as the option's description. */
  description?: string;
  /** Leading icon or template. Decorative: the label names the option. */
  start?: ListBoxSlotContent;
  /** Stays in the list, announced as unavailable, skipped by the arrow keys, never selected. */
  disabled?: boolean;
  /** More words the option is found by (an airport code, a former name). Not shown. */
  keywords?: readonly string[];
}

/** A titled group of options. */
export interface ListBoxSection {
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

/**
 * The items that match `query`, groups kept, best matches first inside each
 * group (filterItems from @the-system/shared, on the label then the
 * keywords). An empty query returns the items as they are.
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

/** A label cut around its first match, for the <mark>. */
export interface MarkedText {
  before: string;
  match: string;
  after: string;
}

/** The label split at its first match (shared matchRanges), or null without one. */
export function markLabel(text: string, query: string): MarkedText | null {
  const [range] = query ? matchRanges(text, query) : [];
  if (!range) return null;
  return { before: text.slice(0, range.start), match: text.slice(range.start, range.end), after: text.slice(range.end) };
}

/** Narrows slot content to an icon name. */
export function isIconContent(content: ListBoxSlotContent | ListBoxContent | undefined): content is IconName {
  return typeof content === 'string';
}

function toArray(v: ListBoxValue | undefined): readonly string[] | undefined {
  if (v === undefined) return undefined;
  if (v === null) return [];
  return typeof v === 'string' ? [v] : v;
}

let nextId = 0;

@Component({
  selector: 'div[dsListBox]',
  exportAs: 'dsListBox',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsListBox), multi: true }],
  host: {
    'data-ds': 'list-box',
    '[attr.id]': 'listId()',
    '[attr.role]': 'isEmpty() ? "group" : "listbox"',
    '[attr.data-size]': 'size()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.aria-orientation]': '!isEmpty() && orientation() === "horizontal" ? "horizontal" : null',
    '[attr.aria-multiselectable]': '!isEmpty() && multiple() ? "true" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-readonly]': '!isEmpty() && readOnly() ? "true" : null',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusout($event)',
  },
  template: `@if (isEmpty() && empty() !== undefined) {<div data-part="empty">@if (isIconContent(empty())) {{{ empty() }}} @else {<ng-container [ngTemplateOutlet]="$any(empty())" />}</div>}@for (item of shown(); track trackItem(item); let i = $index) {@if (asSection(item); as section) {@if (i > 0) {<div data-part="separator" aria-hidden="true"></div>}<div role="group" data-part="group" [attr.aria-labelledby]="listId() + '-group-' + i"><div data-part="group-label" [id]="listId() + '-group-' + i" role="presentation">{{ section.label }}</div>@for (option of section.options; track option.value) {<ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: option }" />}</div>} @else {<ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: item }" />}}
<ng-template #row let-option>@let optionId = idOf(option.value); @let isSelected = selected().includes(option.value); @let off = isDisabled() || option.disabled === true; @let isHighlighted = highlighted() === option.value; @let marked = mark(option.label);<div [id]="optionId" role="option" data-part="option"
  [attr.aria-selected]="isSelected"
  [attr.aria-disabled]="off ? 'true' : null"
  [attr.aria-labelledby]="optionId + '-label'"
  [attr.aria-describedby]="option.description ? optionId + '-description' : null"
  [attr.tabindex]="virtualFocus() ? null : option.value === tabStop() ? 0 : -1"
  [attr.data-highlighted]="isHighlighted ? '' : null"
  [attr.data-selected]="isSelected ? '' : null"
  [attr.data-disabled]="off ? '' : null"
  (focus)="onOptionFocus(option)"
  (pointermove)="onOptionPointer(option, off, isHighlighted)"
  (mousedown)="onOptionMousedown($event)"
  (click)="choose(option)"><span aria-hidden="true"></span><span data-part="indicator" aria-hidden="true">@if (isSelected) {<svg dsIcon name="check" size="md"></svg>}</span>@if (option.start !== undefined) {<span data-part="option-icon" aria-hidden="true">@if (isIconContent(option.start)) {<svg dsIcon [name]="option.start" size="md"></svg>} @else {<ng-container [ngTemplateOutlet]="option.start" />}</span>}<span data-part="option-label" [id]="optionId + '-label'">@if (marked) {{{ marked.before }}<mark>{{ marked.match }}</mark>{{ marked.after }}} @else {{{ option.label }}}</span>@if (option.description !== undefined) {<span data-part="option-description" [id]="optionId + '-description'">{{ option.description }}</span>}</div></ng-template>`,
})
export class DsListBox implements ControlValueAccessor {
  /** The options, plain or in titled groups. A separator is drawn between groups. */
  readonly items = input<readonly ListBoxItem[]>([]);
  /** Row height and type size. Default md. */
  readonly size = input<ListBoxSize>('md');
  readonly orientation = input<ListBoxOrientation>('vertical');
  /** The highlighted option (the keyboard cursor). Two way: `[(highlightedValue)]`. */
  readonly highlightedValue = input<string | null | undefined>(undefined);
  /** Called when the arrows, typeahead or the pointer move the highlight. */
  readonly highlightedValueChange = output<string | null>();
  /** true: an owner keeps focus and points aria-activedescendant at the highlighted option. */
  readonly virtualFocus = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** The text the owner filtered with. The matched part of each label is marked. */
  readonly query = input('');
  /** ArrowDown on the last option goes to the first. Default false. */
  readonly loop = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** Shown in place of the options when there are none. */
  readonly empty = input<ListBoxContent | undefined>(undefined);
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** single (default) or multiple. */
  readonly selectionMode = input<ListBoxSelectionMode>('single');
  /** The chosen value: a string or null (single), an array (multiple). Two way: `[(value)]`. */
  readonly value = model<ListBoxValue | undefined>(undefined);
  readonly defaultValue = input<ListBoxValue | undefined>(undefined);
  /** single: choosing the chosen option again clears it. Default false. */
  readonly allowEmpty = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  readonly id = input<string | undefined>(undefined);
  /** Runs after an option is chosen by click, Enter or Space, with its value. */
  readonly optionSelect = output<string>();

  private readonly host = consumeHostAttributes([
    'dsListBox', 'items', 'size', 'orientation', 'highlightedValue', 'virtualFocus', 'query', 'loop', 'empty',
    'disabled', 'readOnly', 'selectionMode', 'value', 'defaultValue', 'allowEmpty', 'id',
  ]);
  private readonly dir = inject(Directionality);
  private readonly injector = inject(Injector);
  private readonly ownId = `ds-list-box-${++nextId}`;

  protected readonly isIconContent = isIconContent;
  readonly listId = computed(() => this.id() ?? this.ownId);
  protected readonly multiple = computed(() => this.selectionMode() === 'multiple');

  /** The selection as an array in both modes: the model, else defaultValue, moved by clicks and forms. */
  readonly selected = linkedSignal<readonly string[]>(() => toArray(this.value()) ?? toArray(this.defaultValue()) ?? []);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  readonly isDisabled = computed(() => this.disabled() ?? this.formDisabled() ?? false);

  /** A group with no option left is not drawn. */
  readonly shown = computed(() => this.items().filter((item) => !isListBoxSection(item) || item.options.length > 0));
  readonly options = computed(() => flattenListBoxItems(this.shown()));
  readonly isEmpty = computed(() => this.options().length === 0);

  /** The highlight: the model when set, else its own. */
  readonly highlighted = linkedSignal<string | null>(() => this.highlightedValue() ?? null);
  private readonly highlight = new ListHighlight(this.options, this.highlighted, this.injector);

  /** The one tab stop when alone: the highlight, else the first selected option, else the first enabled one. */
  protected readonly tabStop = computed(() => {
    const options = this.options();
    const h = this.highlighted();
    if (h !== null && options.some((o) => o.value === h)) return h;
    const sel = options.find((o) => this.selected().includes(o.value) && !o.disabled);
    if (sel) return sel.value;
    return this.highlight.edgeValue('first') ?? options[0]?.value ?? null;
  });

  private fromKeyboard = false;
  private fromPointer = false;
  private readonly typeahead = createTypeahead();

  private onChange: (value: ListBoxValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    inject(DestroyRef).onDestroy(() => this.highlight.destroy());
    // row-glide: the fill of the highlighted row travels from the row lit before.
    injectRowGlide("[data-part='option']")(this.host);
    // Keep the highlighted option in view when the keys move it (the list scrolls inside).
    afterRenderEffect(() => {
      const h = this.highlighted();
      untracked(() => {
        const scroll = this.virtualFocus() ? !this.fromPointer : this.fromKeyboard;
        this.fromKeyboard = false;
        this.fromPointer = false;
        if (!scroll || h === null) return;
        const el = this.host.querySelector<HTMLElement>(`#${CSS.escape(listBoxOptionId(this.listId(), h))}`);
        el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      });
    });
  }

  protected trackItem(item: ListBoxItem): string {
    return isListBoxSection(item) ? `group-${item.key ?? item.label}` : item.value;
  }

  protected asSection(item: ListBoxItem): ListBoxSection | null {
    return isListBoxSection(item) ? item : null;
  }

  protected idOf(value: string): string {
    return listBoxOptionId(this.listId(), value);
  }

  protected mark(label: string): MarkedText | null {
    return markLabel(label, this.query());
  }

  private setHighlighted(value: string | null): void {
    this.highlight.set(value);
    this.highlightedValueChange.emit(value);
  }

  private highlightAt(index: number, focus: boolean): void {
    const option = this.options()[index];
    if (!option) return;
    this.fromKeyboard = true;
    this.highlight.setIndex(index);
    this.highlightedValueChange.emit(option.value);
    if (focus && !this.virtualFocus()) {
      this.host.querySelector<HTMLElement>(`#${CSS.escape(this.idOf(option.value))}`)?.focus();
    }
  }

  private setSelected(next: readonly string[]): void {
    this.selected.set(next);
    const out: ListBoxValue = this.multiple() ? [...next] : (next[0] ?? null);
    this.value.set(out);
    this.onChange(out);
  }

  choose(option: ListBoxOption): void {
    if (this.isDisabled() || this.readOnly() || option.disabled) return;
    this.setSelected(selectValue(this.selectionMode(), this.selected(), option.value, this.allowEmpty()));
    this.optionSelect.emit(option.value);
  }

  protected onOptionFocus(option: ListBoxOption): void {
    if (!this.virtualFocus()) this.setHighlighted(option.value);
  }

  protected onOptionPointer(option: ListBoxOption, off: boolean, isHighlighted: boolean): void {
    if (!this.virtualFocus() || off || isHighlighted) return;
    this.fromPointer = true;
    this.setHighlighted(option.value);
  }

  protected onOptionMousedown(event: MouseEvent): void {
    // An owner keeps focus: a press on an option must not move it.
    if (this.virtualFocus()) event.preventDefault();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.virtualFocus()) return;
    const options = this.options();
    const hi = this.highlight.index();
    const current = hi !== -1 ? hi : options.findIndex((o) => o.value === this.tabStop());
    const rtl = this.dir.valueSignal() === 'rtl';
    const vertical = this.orientation() === 'vertical';
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const key = event.key;
    if (key === forward || key === back) {
      event.preventDefault();
      const next = this.highlight.next(current, key === forward ? 1 : -1, this.loop());
      if (next !== -1) this.highlightAt(next, true);
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const next = this.highlight.edge(key === 'Home' ? 'first' : 'last');
      if (next !== -1) this.highlightAt(next, true);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      const option = options[current];
      if (!option) return;
      event.preventDefault();
      this.choose(option);
      return;
    }
    if (this.multiple() && (event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a') {
      event.preventDefault();
      if (this.isDisabled() || this.readOnly()) return;
      this.setSelected(
        selectAllValues(
          this.selected(),
          options.map((o) => o.value),
          (v) => options.find((o) => o.value === v)?.disabled ?? false,
        ),
      );
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && key !== ' ') {
      const next = typeaheadIndex(
        options.map((o) => o.label),
        this.typeahead.push(key),
        current,
        (i) => options[i]?.disabled ?? false,
      );
      if (next !== -1) this.highlightAt(next, true);
    }
  }

  protected onFocusout(event: FocusEvent): void {
    // Alone: leaving the list clears the highlight, so Tab comes back to the selected option.
    if (this.virtualFocus() || this.highlightedValue() !== undefined) return;
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) {
      this.setHighlighted(null);
      this.onTouched();
    }
  }

  /** The root element. */
  get nativeElement(): HTMLElement {
    return this.host;
  }

  writeValue(value: ListBoxValue | null | undefined): void {
    this.selected.set(toArray(value ?? null) ?? []);
  }

  registerOnChange(fn: (value: ListBoxValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }
}
