// MultiSelect: several values from a list, shown as tags or a count in a
// closed trigger. The twin of
// packages/react/src/components/MultiSelect/MultiSelect.tsx, which is built
// on ListBox (multiple) and Radix Popover. Same DOM, so MultiSelect.css
// applies as it is:
//
//   <div data-ds="multi-select" class="" data-size data-shape data-placeholder? data-invalid? data-disabled? data-readonly? data-loading?>   the host
//     <div data-part="trigger" role="combobox" tabindex="0" aria-haspopup="listbox" aria-expanded aria-controls aria-labelledby>
//       <span data-part="value">  <span data-part="tag">...  <span data-part="summary-text">
//       <span data-part="icon">
//     <input type="hidden" name>                     one per value, with name
//   <body>
//     <div data-ds="theme" data-menu-layer>          internal/popper.ts
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="multi-select" data-part="popup" data-size data-state data-side data-align tabindex="-1">
//           <div data-ds="search-field" data-part="search">    the SearchField DOM, inline (see below)
//           <div dsListBox selectionMode="multiple">
//           <div data-part="actions">  <button dsButton data-part="select-all">  <button dsButton data-part="clear">
//
// Behavior as React: Enter, Space and the arrows open; opening moves focus
// to the search field when there is one, else to the list; ArrowDown in the
// search field moves into the list; Tab and Shift+Tab stay in the popup;
// Enter in the list and Escape close and focus goes back to the trigger; a
// press or focus outside closes. Radix Popover is replaced by a CDK
// ComponentPortal placed by internal/popper.ts; the list highlight by
// ListBox (CDK ActiveDescendantKeyManager kept in step). Angular Aria
// Multiselect would replace that once order A3.0 installs @angular/aria.
//
// SearchField has no Angular port yet (lane A2.2): its DOM is rendered here
// inline (root, search icon, the Input box and its input, the clear
// IconButton, the status), and is replaced by the Angular SearchField once
// it exists. Its clear button keeps the SearchField default name "Clear
// search" in every language, as React's MultiSelect passes no clearLabel.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`, `onOpenChange` the `openChange` output of `[(open)]`.
// `empty` takes text or a TemplateRef; `formatCount` is a function input.
// React spreads the rest props on the trigger; here static data-*
// attributes written on the host (data-demo-trigger) move to the trigger,
// and aria-label, aria-labelledby, aria-describedby and id are inputs.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { optionalBoolean } from '../../internal/optional-boolean';
import { PopupLayer } from '../../internal/popper';
import { DsThemeService } from '../../theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsIconButton } from '../icon-button/icon-button';
import {
  DsListBox,
  filterListBoxItems,
  flattenListBoxItems,
  type ListBoxContent,
  type ListBoxItem,
} from '../list-box/list-box';

export type MultiSelectSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type MultiSelectShape = Extract<Shape, 'default' | 'pill'>;
/** tags: the chosen labels as tags, up to maxTags, then "+2". count: "3 selected". */
export type MultiSelectSummary = 'tags' | 'count';

const VIEWPORT_GUTTER = 8;
const TRIGGER_GAP = 4;
/** The search field shows by default when there are more options than this. */
const SEARCH_AFTER = 8;
const TABBABLE = 'input:not([type="hidden"]):not(:disabled), button:not(:disabled), [tabindex="0"]';

/** The default count summary, pluralized for the language (Western digits in Arabic too). */
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

let nextId = 0;

@Component({
  selector: 'div[dsMultiSelect]',
  exportAs: 'dsMultiSelect',
  imports: [DsIcon, DsListBox, DsButton, DsIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsMultiSelect), multi: true }],
  host: {
    'data-ds': 'multi-select',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-placeholder]': 'chosen().length === 0 ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
  template: `<div #trigger data-part="trigger" role="combobox"
  [attr.id]="controlId() ?? null"
  [attr.tabindex]="isDisabled() ? -1 : 0"
  aria-haspopup="listbox"
  [attr.aria-expanded]="popupOpen()"
  [attr.aria-controls]="popupOpen() ? listId : null"
  [attr.aria-label]="ariaLabel() ?? null"
  [attr.aria-labelledby]="labelledBy() ?? null"
  [attr.aria-describedby]="describedBy() ?? null"
  [attr.aria-invalid]="isInvalid() ? 'true' : null"
  [attr.aria-required]="isRequired() ? 'true' : null"
  [attr.aria-disabled]="isDisabled() ? 'true' : null"
  [attr.aria-readonly]="isReadOnly() ? 'true' : null"
  [attr.aria-busy]="loading() ? 'true' : null"
  (keydown)="onTriggerKeydown($event)"
  (click)="onTriggerClick($event)"
  (blur)="onTouched()"><span data-part="value">@if (chosen().length === 0) {{{ placeholderText() }}} @else if (summary() === 'count') {{{ countText() }}} @else {@for (o of shownTags(); track o.value) {<span data-part="tag" aria-hidden="true">{{ o.label }}</span>}@if (more() > 0) {<span data-part="tag" data-more="" aria-hidden="true"><ng-container>+</ng-container>{{ more() }}</span>}<span data-part="summary-text">{{ listText() }}</span>}</span><span data-part="icon" aria-hidden="true">@if (loading()) {<span aria-hidden="true" data-ds="spinner" data-size="sm" data-tone="neutral"></span>} @else {<svg dsIcon name="chevrons-up-down" size="md"></svg>}</span></div>@if (name() !== undefined) {@for (o of chosen(); track o.value) {<input type="hidden" [attr.name]="name()" [value]="o.value" [attr.value]="o.value" [disabled]="isDisabled()" />}}
<ng-template #popup><div data-ds="multi-select" data-part="popup" [attr.id]="popupId" [attr.data-size]="size()" [attr.data-state]="layer.closing() ? 'closed' : 'open'"
  [attr.data-side]="layer.side()" [attr.data-align]="layer.align()"
  style="--radix-popover-content-transform-origin: var(--radix-popper-transform-origin); --radix-popover-content-available-width: var(--radix-popper-available-width); --radix-popover-content-available-height: var(--radix-popper-available-height); --radix-popover-trigger-width: var(--radix-popper-anchor-width); --radix-popover-trigger-height: var(--radix-popper-anchor-height);"
  tabindex="-1">@if (withSearch() && hasOptions()) {<div data-ds="search-field" data-part="search" data-size="sm" data-shape="default" [attr.data-empty]="query() === '' ? '' : null" (mousedown)="onSearchMousedown($event)"><span data-part="icon" aria-hidden="true"><svg dsIcon name="search"></svg></span><div data-ds="input" data-part="control" data-size="sm" data-shape="default"><input #search type="search" data-part="control"
  [attr.placeholder]="searchText()" [attr.aria-label]="searchText()" [attr.aria-controls]="listId"
  [value]="query()" [attr.value]="query()" (input)="query.set($any($event.target).value)" (keydown)="onSearchKeydown($event)" /></div>@if (query() !== '') {<button dsIconButton data-part="clear" icon="close" label="Clear search" size="xs" shape="pill" (click)="clearSearch()"></button>}<span data-part="status" role="status"></span></div>}<div dsListBox #list [id]="listId" selectionMode="multiple"
  [items]="shown()" [size]="listSize()" [query]="query()" [value]="value()"
  (valueChange)="setValue($any($event))"
  [attr.aria-label]="ariaLabel() ?? null" [attr.aria-labelledby]="labelledBy() ?? null"
  [empty]="emptyText()" [attr.aria-busy]="loading() ? 'true' : null"></div>@if (actions() && hasOptions()) {<div data-part="actions"><button dsButton data-part="select-all" size="sm" emphasis="ghost" [disabled]="allChosen()" (click)="selectAll()">{{ selectAllText() }}</button><button dsButton data-part="clear" size="sm" emphasis="ghost" [disabled]="!someChosen()" (click)="clear()">{{ clearText() }}</button></div>}</div></ng-template>`,
})
export class DsMultiSelect implements ControlValueAccessor {
  /** The options, plain or in titled groups, as ListBox takes them. */
  readonly items = input<readonly ListBoxItem[]>([]);
  /** The chosen values in the order they were chosen. Two way: `[(value)]`. */
  readonly value = model<readonly string[]>([]);
  readonly defaultValue = input<readonly string[] | undefined>(undefined);
  /** The popup is open. Two way: `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** How the trigger shows the values. Default tags. */
  readonly summary = input<MultiSelectSummary>('tags');
  /** In tags mode, the most tags shown before "+2". Default 3. */
  readonly maxTags = input(3);
  readonly formatCount = input<((count: number) => string) | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  /** Shows the search field in the popup. Default: when there are more than 8 options. */
  readonly searchable = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly searchLabel = input<string | undefined>(undefined);
  /** Shows Select all and Clear selection under the list. Default true. */
  readonly actions = input(true, { transform: (v: unknown) => optionalBoolean(v) ?? true });
  readonly selectAllLabel = input<string | undefined>(undefined);
  readonly clearLabel = input<string | undefined>(undefined);
  readonly size = input<MultiSelectSize>('md');
  readonly shape = input<MultiSelectShape>('default');
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly loading = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  readonly loadingLabel = input<string | undefined>(undefined);
  readonly empty = input<ListBoxContent | undefined>(undefined);
  /** Submits each value under this name in a form (one hidden input per value). */
  readonly name = input<string | undefined>(undefined);
  /** The id of the trigger. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsField, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = consumeHostAttributes([
    'dsMultiSelect', 'items', 'value', 'defaultValue', 'open', 'defaultOpen', 'summary', 'maxTags', 'formatCount',
    'placeholder', 'searchable', 'searchLabel', 'actions', 'selectAllLabel', 'clearLabel', 'size', 'shape', 'invalid',
    'disabled', 'readOnly', 'required', 'loading', 'loadingLabel', 'empty', 'name', 'id', 'aria-label',
    'aria-labelledby', 'aria-describedby',
  ]);
  /** Static data-* attributes of the host, which React's rest props put on the trigger. */
  private readonly triggerAttrs = Array.from(this.host.attributes)
    .filter((a) => a.name.startsWith('data-') && a.name !== 'data-ds')
    .map((a) => [a.name, a.value] as const);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly popupTemplate = viewChild.required<TemplateRef<unknown>>('popup');

  private readonly autoId = ++nextId;
  protected readonly listId = `ds-multi-select-list-${this.autoId}`;
  protected readonly popupId = `${this.listId}-popup`;

  protected readonly lang = computed<'en' | 'ar'>(() => (this.theme.value().lang.startsWith('ar') ? 'ar' : 'en'));
  protected readonly t = computed(() => words[this.lang()]);
  protected readonly placeholderText = computed(() => this.placeholder() ?? this.t().placeholder);
  protected readonly searchText = computed(() => this.searchLabel() ?? this.t().search);
  protected readonly selectAllText = computed(() => this.selectAllLabel() ?? this.t().selectAll);
  protected readonly clearText = computed(() => this.clearLabel() ?? this.t().clear);

  protected readonly controlId = computed(() => this.id() ?? this.field?.controlId);
  readonly isInvalid = computed(() => this.invalid() ?? this.field?.isInvalid() ?? false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  readonly isDisabled = computed(() => this.disabled() ?? this.formDisabled() ?? this.field?.disabled() ?? false);
  readonly isReadOnly = computed(() => this.readOnly() ?? this.field?.readOnly() ?? false);
  protected readonly isRequired = computed(() => this.required() ?? this.field?.required() ?? false);
  protected readonly describedBy = computed(
    () => [this.field?.describedBy(), this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
  );
  protected readonly labelledBy = computed(() => this.ariaLabelledby() ?? (this.ariaLabel() ? undefined : this.field?.labelId));
  private readonly inert = computed(() => this.isDisabled() || this.isReadOnly());

  private readonly openState = signal(false);
  readonly isOpen = computed(() => this.open() ?? this.openState());
  readonly popupOpen = computed(() => this.isOpen() && !this.inert());
  readonly query = signal('');

  private readonly all = computed(() => flattenListBoxItems(this.items()));
  protected readonly shown = computed(() => filterListBoxItems(this.items(), this.query()));
  private readonly shownOptions = computed(() => flattenListBoxItems(this.shown()));
  protected readonly withSearch = computed(() => this.searchable() ?? this.all().length > SEARCH_AFTER);
  protected readonly hasOptions = computed(() => this.all().length > 0);
  protected readonly listSize = computed(() => (this.size() === 'sm' ? 'sm' : 'md'));
  /** The chosen options in the order they were chosen; a value with no option left is not drawn. */
  readonly chosen = computed(() =>
    this.value()
      .map((v) => this.all().find((o) => o.value === v))
      .filter((o): o is NonNullable<typeof o> => o !== undefined),
  );
  protected readonly countText = computed(() => {
    const n = this.chosen().length;
    const format = this.formatCount();
    return format ? format(n) : defaultSelectedCount(n, this.lang());
  });
  protected readonly listText = computed(() => {
    const labels = this.chosen().map((o) => o.label);
    try {
      return new Intl.ListFormat(this.lang(), { type: 'conjunction' }).format(labels);
    } catch {
      return labels.join(', ');
    }
  });
  protected readonly shownTags = computed(() => this.chosen().slice(0, Math.max(0, this.maxTags())));
  protected readonly more = computed(() => this.chosen().length - this.shownTags().length);
  private readonly enabledShown = computed(() => this.shownOptions().filter((o) => !o.disabled).map((o) => o.value));
  protected readonly allChosen = computed(() => this.enabledShown().every((v) => this.value().includes(v)));
  protected readonly someChosen = computed(() => this.chosen().some((o) => !o.disabled));
  protected readonly emptyText = computed<ListBoxContent>(() =>
    this.loading() ? (this.loadingLabel() ?? this.t().loading) : (this.empty() ?? (this.hasOptions() ? this.t().empty : this.t().none)),
  );

  protected readonly layer = new PopupLayer({
    template: () => this.popupTemplate(),
    anchor: () => this.host,
    side: 'bottom',
    align: 'start',
    sideOffset: TRIGGER_GAP,
    padding: VIEWPORT_GUTTER,
  });

  private interactedOutside = false;
  private undo: (() => void)[] = [];
  private onChange: (value: string[]) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    for (const [name] of this.triggerAttrs) this.host.removeAttribute(name);
    // The field root is the Radix Anchor, which renders class="".
    if (!this.host.hasAttribute('class')) this.host.setAttribute('class', '');
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      for (const fn of this.undo.reverse()) fn();
      this.undo = [];
      this.layer.dispose();
    });

    afterNextRender(() => {
      const trigger = this.trigger().nativeElement;
      for (const [name, value] of this.triggerAttrs) trigger.setAttribute(name, value);
      // The Field label points at the trigger with for, which a div cannot take: a press on the label focuses it.
      const label = this.field ? this.doc.getElementById(this.field.labelId) : null;
      if (label) {
        const focus = () => trigger.focus();
        label.addEventListener('click', focus);
        destroyRef.onDestroy(() => label.removeEventListener('click', focus));
      }
    });

    effect(() => {
      const open = this.popupOpen();
      untracked(() => (open ? this.mount() : this.unmount(true)));
    });

    effect(() => {
      const side = this.layer.side();
      const align = this.layer.align();
      if (side === null) this.host.removeAttribute('data-radix-popper-side');
      else this.host.setAttribute('data-radix-popper-side', side);
      if (align === null) this.host.removeAttribute('data-radix-popper-align');
      else this.host.setAttribute('data-radix-popper-align', align);
    });
  }

  ngOnInit(): void {
    const initial = this.defaultValue();
    if (initial !== undefined && this.value().length === 0) this.value.set([...initial]);
    this.openState.set(this.defaultOpen());
  }

  /** The trigger, the element with role combobox. */
  get nativeControl(): HTMLElement {
    return this.trigger().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }

  protected setValue(next: readonly string[]): void {
    this.value.set([...next]);
    this.onChange([...next]);
  }

  private setOpenState(next: boolean): void {
    if (next && this.inert()) return;
    if (next) {
      this.interactedOutside = false;
      this.query.set('');
    }
    this.openState.set(next);
    this.open.set(next);
  }

  protected selectAll(): void {
    if (this.inert()) return;
    const next = [...this.value()];
    for (const v of this.enabledShown()) if (!next.includes(v)) next.push(v);
    this.setValue(next);
  }

  protected clear(): void {
    if (this.inert()) return;
    // Disabled options stay as they are: they cannot be changed from the list either.
    this.setValue(this.value().filter((v) => this.all().find((o) => o.value === v)?.disabled));
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this.setOpenState(true);
    }
  }

  protected onTriggerClick(event: MouseEvent): void {
    if (event.defaultPrevented || this.inert()) return;
    this.setOpenState(!this.popupOpen());
  }

  // ---------------------------------------------------------------- the popup

  private mount(): void {
    this.layer.open();
    const content = this.layer.content;
    if (!content) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || this.layer.contains(target)) return;
      // A press on the trigger toggles the popup itself.
      if (this.host.contains(target)) return;
      this.interactedOutside = true;
      this.setOpenState(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target || this.layer.contains(target) || this.host.contains(target)) return;
      this.interactedOutside = true;
      this.setOpenState(false);
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        this.setOpenState(false);
      }
    };
    // Capture on the popup: Tab and Enter in the list are handled before the ListBox sees them.
    const onPopupKeydown = (event: KeyboardEvent) => this.onPopupKeydown(event, content);
    this.doc.addEventListener('pointerdown', onPointerDown, true);
    this.doc.addEventListener('focusin', onFocusIn);
    this.doc.addEventListener('keydown', onKeydown);
    content.addEventListener('keydown', onPopupKeydown, true);
    this.undo = [
      () => this.doc.removeEventListener('pointerdown', onPointerDown, true),
      () => this.doc.removeEventListener('focusin', onFocusIn),
      () => this.doc.removeEventListener('keydown', onKeydown),
      () => content.removeEventListener('keydown', onPopupKeydown, true),
    ];
    afterNextRender(
      () => {
        // Opening moves focus to the first tab stop: the search field, else the list.
        const first = content.querySelector<HTMLElement>(TABBABLE);
        (first ?? content).focus();
      },
      { injector: this.injector },
    );
  }

  private unmount(returnFocus: boolean): void {
    if (!this.layer.mounted()) return;
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    this.layer.close();
    if (returnFocus && !this.interactedOutside) this.nativeControl.focus();
  }

  private onPopupKeydown(event: KeyboardEvent, content: HTMLElement): void {
    if (event.defaultPrevented) return;
    const list = content.querySelector('[data-ds="list-box"]');
    if (event.key === 'Enter' && list?.contains(event.target as Node)) {
      // Enter in the list closes; Space toggles (ListBox).
      event.preventDefault();
      this.setOpenState(false);
      return;
    }
    if (event.key !== 'Tab') return;
    // Tab and Shift+Tab move between the search field, the list and the actions, and stay in the popup.
    const stops = Array.from(content.querySelectorAll<HTMLElement>(TABBABLE));
    if (stops.length === 0) return;
    const active = this.doc.activeElement;
    const at = stops.findIndex((el) => el === active || el.contains(active));
    event.preventDefault();
    const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === -1 || at === stops.length - 1 ? 0 : at + 1;
    stops[next]?.focus();
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.layer.content?.querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus();
    }
    // Enter in the search field does not submit a form around the MultiSelect.
    if (event.key === 'Enter') event.preventDefault();
    // The first Escape clears the search (SearchField); an Escape on the empty box closes the popup.
    if (event.key === 'Escape' && this.query() !== '') {
      event.preventDefault();
      this.clearSearch();
    }
  }

  protected onSearchMousedown(event: MouseEvent): void {
    const target = event.target as Element;
    if (target.closest('input, button')) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).querySelector('input')?.focus();
  }

  protected clearSearch(): void {
    this.query.set('');
    this.layer.content?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }

  // ---------------------------------------------------------------- forms

  writeValue(value: readonly string[] | null | undefined): void {
    this.value.set(value ? [...value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }
}

