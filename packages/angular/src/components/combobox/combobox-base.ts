// The internals Combobox and Autocomplete share, the twin of
// packages/react/src/components/Combobox/ComboboxBase.tsx: a text input with
// role combobox, a popup holding a ListBox with virtualFocus, filtering
// through filterListBoxItems (the shared filter.ts), the result count
// announced once per query, and the themed portal. Not exported from the
// package barrel: Autocomplete imports it from '../combobox/combobox-base'.
//
//   mode 'select' (Combobox)      the value must be an option; the text is a
//                                 filter and goes back to the chosen label on
//                                 blur; the first match is highlighted, so
//                                 Enter picks it; trigger and clear buttons.
//   mode 'free'   (Autocomplete)  the value is the text; options are
//                                 suggestions; nothing is highlighted until an
//                                 arrow key moves, so Enter keeps the typed text.
//
// The DOM (Combobox; Autocomplete has no trigger and no clear):
//
//   <div data-ds="combobox" class="" data-size data-shape data-invalid? data-disabled? data-readonly? data-loading?>   the host
//     <input data-part="control" role="combobox" aria-expanded aria-controls aria-activedescendant aria-autocomplete="list">
//     <button dsIconButton data-part="clear" tabindex="-1">
//     <button dsIconButton data-part="trigger" tabindex="-1">
//     <span data-part="status" role="status">
//   <body>
//     <div data-ds="theme" data-menu-layer>                 internal/popper.ts
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="combobox" data-part="popup" data-size data-state data-side data-align tabindex="-1">
//           <div dsListBox virtualFocus>  or  <div data-part="empty">
//
// React gets the popup from Radix Popover. Here it is a CDK ComponentPortal
// placed by internal/popper.ts with the Radix steps, so the open DOM matches:
// the field root (the Radix Anchor) carries class="" and, while placed,
// data-radix-popper-side and data-radix-popper-align, as React's does. The
// Radix dismiss rules are rebuilt: Escape and a press outside the field and
// the popup close and restore the chosen label. The highlight is kept by
// internal/list-highlight.ts on the CDK ActiveDescendantKeyManager; Angular
// Aria Combobox would replace it once order A3.0 installs @angular/aria.
import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  type OnInit,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { ListHighlight } from '../../internal/list-highlight';
import { optionalBoolean } from '../../internal/optional-boolean';
import { PopupLayer } from '../../internal/popper';
import { injectMotion } from '../../internal/motion';
import { POPUP_LIST_ROWS } from '@the-system/motion';
import { injectPopupResults, openStaggered } from '../../internal/motion-selection';
import { DsThemeService } from '../../theme';
import { DsFieldContext, fieldControl } from '../field/field-context';
import {
  filterListBoxItems,
  flattenListBoxItems,
  listBoxOptionId,
  type ListBoxContent,
  type ListBoxItem,
  type ListBoxOption,
} from '../list-box/list-box';

export type ComboboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ComboboxShape = Extract<Shape, 'default' | 'pill'>;

/** Space kept between the popup and the viewport edge, in CSS px. */
const VIEWPORT_GUTTER = 8;
/** Gap between the field and the popup, in CSS px. */
const FIELD_GAP = 4;
/** The count is announced once typing pauses this long. */
const ANNOUNCE_DELAY = 400;

/** The default result count, pluralized for the language (Western digits in Arabic too). */
export function defaultResultCount(count: number, lang: string): string {
  if (lang.startsWith('ar')) {
    const rule = new Intl.PluralRules('ar').select(count);
    if (count === 0) return 'ما فيه نتائج';
    if (rule === 'one') return 'نتيجة وحدة';
    if (rule === 'two') return 'نتيجتين';
    if (rule === 'few') return `${count} نتائج`;
    return `${count} نتيجة`;
  }
  if (count === 0) return 'No results';
  return new Intl.PluralRules('en').select(count) === 'one' ? '1 result' : `${count} results`;
}

/** The words of the buttons and the popup, per language. */
export const comboboxWords = {
  en: { trigger: 'Show options', clear: 'Clear value', empty: 'No results. Try another word.', loading: 'Loading options' },
  ar: { trigger: 'عرض الخيارات', clear: 'مسح القيمة', empty: 'ما فيه نتائج. جرب كلمة ثانية.', loading: 'جار تحميل الخيارات' },
} as const;

/** The input names every combobox host consumes. */
export const COMBOBOX_BASE_INPUTS = [
  'items', 'size', 'shape', 'open', 'defaultOpen', 'invalid', 'loading', 'empty', 'loadingLabel', 'formatCount',
  'loop', 'disabled', 'readOnly', 'required', 'id', 'placeholder', 'name', 'autofocus', 'aria-label',
  'aria-labelledby', 'aria-describedby',
] as const;

/** The template both hosts render. */
export const COMBOBOX_TEMPLATE = `<input #control
  type="text"
  role="combobox"
  data-part="control"
  autocomplete="off"
  autocorrect="off"
  spellcheck="false"
  [attr.id]="controlId() ?? null"
  [attr.name]="mode === 'free' ? (name() ?? null) : null"
  [attr.placeholder]="placeholder() ?? null"
  [attr.aria-label]="ariaLabel() ?? null"
  [attr.aria-labelledby]="ariaLabelledby() ?? null"
  [attr.aria-describedby]="describedBy() ?? null"
  [attr.aria-invalid]="isInvalid() ? 'true' : null"
  [attr.aria-required]="isRequired() ? 'true' : null"
  [attr.aria-expanded]="popupOpen()"
  [attr.aria-controls]="controls() ?? null"
  [attr.aria-activedescendant]="activeId() ?? null"
  aria-autocomplete="list"
  [attr.aria-busy]="loading() ? 'true' : null"
  [disabled]="isDisabled()"
  [readOnly]="isReadOnly()"
  [value]="text()"
  [attr.value]="text()"
  (input)="onInputChange($any($event.target).value)"
  (keydown)="onInputKeydown($event)"
  (blur)="onInputBlur($event)"
  (click)="onInputClick($event)" />@if (mode === 'select' && name() !== undefined) {<input type="hidden" [attr.name]="name()" [value]="selectValue() ?? ''" [attr.value]="selectValue() ?? ''" [disabled]="isDisabled()" />}@if (showClear()) {<button dsIconButton data-part="clear" icon="close" [label]="clearText()" size="xs" tabindex="-1"
  (mousedown)="$event.preventDefault()" (click)="onClear()"></button>}@if (mode === 'select') {<button dsIconButton data-part="trigger" icon="chevron-down" [label]="triggerText()" size="xs" tabindex="-1"
  [loading]="loading()" [loadingLabel]="loadingText()" [disabled]="inert()"
  [attr.aria-expanded]="popupOpen()" [attr.aria-controls]="controls() ?? null"
  (mousedown)="$event.preventDefault()" (click)="onTrigger()"></button>}<span data-part="status" role="status">{{ status() }}</span>
<ng-template #popup><div [attr.data-ds]="ds" data-part="popup" [attr.id]="popupId" [attr.data-size]="size()" [attr.data-state]="layer.closing() ? 'closed' : 'open'"
  [attr.data-side]="layer.side()" [attr.data-align]="layer.align()"
  style="--radix-popover-content-transform-origin: var(--radix-popper-transform-origin); --radix-popover-content-available-width: var(--radix-popper-available-width); --radix-popover-content-available-height: var(--radix-popper-available-height); --radix-popover-trigger-width: var(--radix-popper-anchor-width); --radix-popover-trigger-height: var(--radix-popper-anchor-height);"
  tabindex="-1" (mousedown)="$event.preventDefault()">@if (hasOptions()) {<div dsListBox [id]="listId"
  [attr.aria-label]="ariaLabel() ?? null"
  [attr.aria-labelledby]="listLabelledBy() ?? null"
  [items]="shown()" [size]="listSize()" virtualFocus [query]="query()"
  [highlightedValue]="highlighted()" (highlightedValueChange)="highlight.set($event)"
  [value]="mode === 'select' ? selectValue() : null"
  (optionSelect)="onOptionSelect($event)"></div>}@if (!hasOptions() && (loading() || emptyContent() !== null)) {<div data-part="empty">@if (loading()) {{{ loadingText() }}} @else if (isText(emptyContent())) {{{ emptyContent() }}} @else {<ng-container [ngTemplateOutlet]="$any(emptyContent())" />}</div>}</div></ng-template>`;

let nextId = 0;

@Directive()
export abstract class DsComboboxBase implements OnInit {
  /** The options, plain or in titled groups. They are filtered by the text. */
  readonly items = input<readonly ListBoxItem[]>([]);
  /** Field height and the row size of the list. Default md. */
  readonly size = input<ComboboxSize>('md');
  /** default: the style's control radius. pill: fully round. */
  readonly shape = input<ComboboxShape>('default');
  /** The popup is open. Two way: `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** Marks the value invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Options are on their way: the trigger shows a spinner, the popup says so, data-loading is set. */
  readonly loading = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** Shown in the popup when nothing matches. null shows nothing. */
  readonly empty = input<ListBoxContent | null | undefined>(undefined);
  /** The words the popup and the status say while loading. Default "Loading options". */
  readonly loadingLabel = input<string | undefined>(undefined);
  /** The words read for the result count after each query. */
  readonly formatCount = input<((count: number) => string) | undefined>(undefined);
  /** ArrowDown on the last option goes to the first. Default true. */
  readonly loop = input(true, { transform: (v: unknown) => optionalBoolean(v) ?? true });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The id of the input. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  /** Submits the value under this name: a hidden input in select mode, the input itself in free mode. */
  readonly name = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  abstract readonly ds: 'combobox' | 'autocomplete';
  abstract readonly mode: 'select' | 'free';
  /** select mode: the chosen option value. */
  protected abstract selectValue(): string | null;
  /** select mode: the label of the chosen value. */
  protected abstract selectedLabel(): string;
  /** Chooses an option (click, Enter) or clears (null). */
  protected abstract onSelect(option: ListBoxOption | null): void;
  /** free mode: Enter with nothing highlighted, with the typed text. */
  protected onCommit(_text: string): void {}
  protected triggerLabelText(): string | undefined {
    return undefined;
  }
  protected clearLabelText(): string | undefined {
    return undefined;
  }
  /** The text was typed or set: Autocomplete writes it to its value. */
  protected onTextChange(_text: string): void {}

  protected readonly field = inject(DsFieldContext, { optional: true });
  protected readonly host = consumeHostAttributes([]);
  private readonly theme = inject(DsThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly popupTemplate = viewChild.required<TemplateRef<unknown>>('popup');

  protected readonly listId = `ds-${this.dsName()}-list-${++nextId}`;
  /** The data-ds value, for the ids, before the subclass fields exist. */
  protected abstract dsName(): 'combobox' | 'autocomplete';
  protected get popupId(): string {
    return `${this.listId}-popup`;
  }

  protected readonly lang = computed<'en' | 'ar'>(() => (this.theme.value().lang.startsWith('ar') ? 'ar' : 'en'));
  protected readonly t = computed(() => comboboxWords[this.lang()]);
  protected readonly loadingText = computed(() => this.loadingLabel() ?? this.t().loading);
  protected readonly triggerText = computed(() => this.triggerLabelText() ?? this.t().trigger);
  protected readonly clearText = computed(() => this.clearLabelText() ?? this.t().clear);

  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /** The Field wiring merged with the control's own values, as React's useFieldControl. It lands on the input. */
  private readonly fieldState = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: this.ariaDescribedby(),
    invalid: this.invalid(),
    disabled: this.disabled() ?? this.formDisabled(),
    readOnly: this.readOnly(),
    required: this.required(),
  }));
  protected readonly controlId = computed(() => this.fieldState().id);
  readonly isInvalid = computed(() => this.fieldState().invalid);
  readonly isDisabled = computed(() => this.fieldState().disabled);
  readonly isReadOnly = computed(() => this.fieldState().readOnly);
  protected readonly isRequired = computed(() => this.fieldState().required);
  protected readonly describedBy = computed(() => this.fieldState().describedBy);
  readonly inert = computed(() => this.isDisabled() || this.isReadOnly());

  /** The open state: the model, else defaultOpen. */
  private readonly openState = signal(false);
  readonly isOpen = computed(() => this.open() ?? this.openState());
  /** The text in the field. */
  readonly text = signal('');
  /** select mode: the list is filtered only after the person types. */
  private readonly typed = signal(false);
  readonly highlighted = signal<string | null>(null);

  readonly query = computed(() => (this.mode === 'free' || this.typed() ? this.text() : ''));
  readonly shown = computed(() => filterListBoxItems(this.items(), this.query()));
  readonly options = computed(() => flattenListBoxItems(this.shown()));
  readonly hasOptions = computed(() => this.options().length > 0);
  protected readonly highlight = new ListHighlight(this.options, this.highlighted, this.injector);
  protected readonly emptyContent = computed<ListBoxContent | null>(() => {
    const empty = this.empty();
    if (this.mode === 'select') return empty === null ? null : (empty ?? this.t().empty);
    return empty ?? null;
  });
  readonly popupOpen = computed(
    () => this.isOpen() && !this.inert() && (this.hasOptions() || this.loading() || this.emptyContent() !== null),
  );
  private readonly highlightVisible = computed(() => {
    const h = this.highlighted();
    return h !== null && this.options().some((o) => o.value === h && !o.disabled);
  });
  protected readonly activeId = computed(() => {
    const h = this.highlighted();
    return this.isOpen() && h !== null && this.highlightVisible() ? listBoxOptionId(this.listId, h) : undefined;
  });
  protected readonly listSize = computed(() => (this.size() === 'sm' ? 'sm' : 'md'));
  protected readonly showClear = computed(
    () => this.mode === 'select' && !this.inert() && (this.selectValue() !== null || this.text() !== ''),
  );
  protected readonly controls = computed(() => (this.popupOpen() ? (this.hasOptions() ? this.listId : this.popupId) : undefined));
  protected readonly listLabelledBy = computed(
    () => this.ariaLabelledby() ?? (this.ariaLabel() ? undefined : this.field?.labelId),
  );
  readonly status = signal('');

  protected readonly motion = injectMotion();
  protected readonly layer = new PopupLayer({
    template: () => this.popupTemplate(),
    anchor: () => this.host,
    side: 'bottom',
    align: 'start',
    sideOffset: FIELD_GAP,
    padding: VIEWPORT_GUTTER,
  });

  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  private lastLabel = '';
  protected onTouched: () => void = () => {};

  constructor() {
    // The field root is the Radix Anchor, which renders class="" (Slot merges an empty className).
    if (!this.host.hasAttribute('class')) this.host.setAttribute('class', '');
    const destroyRef = inject(DestroyRef);
    // A control with its own id tells the Field, so the Field label points at it, as React's useFieldControl.
    const field = this.field;
    if (field) {
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
      destroyRef.onDestroy(() => {
        if (untracked(this.id) !== undefined) field.setControlId(undefined);
      });
    }
    destroyRef.onDestroy(() => {
      this.layer.dispose();
      this.highlight.destroy();
    });

    // Keep the selected label in the field when the value changes from outside and nobody is typing.
    effect(() => {
      const label = this.selectedLabel();
      untracked(() => {
        if (this.mode !== 'select' || this.lastLabel === label) return;
        this.lastLabel = label;
        if (!this.typed()) this.setText(label);
      });
    });

    // The highlight stays on a visible option; select mode lands on the first match while typing.
    effect(() => {
      const open = this.isOpen();
      const h = this.highlighted();
      const visible = this.highlightVisible();
      untracked(() => {
        if (!open) return;
        if (h !== null && !visible) this.highlight.set(this.mode === 'select' && this.typed() ? this.highlight.edgeValue('first') : null);
      });
    });

    // The result count, once per query, after typing pauses.
    effect((onCleanup) => {
      const open = this.popupOpen();
      this.query();
      const count = this.options().length;
      const loading = this.loading();
      const loadingText = this.loadingText();
      const lang = this.lang();
      untracked(() => this.status.set(''));
      if (!open) return;
      const timer = setTimeout(() => {
        if (loading) this.status.set(loadingText);
        else {
          const format = untracked(this.formatCount);
          this.status.set(format ? format(count) : defaultResultCount(count, lang));
        }
      }, ANNOUNCE_DELAY);
      onCleanup(() => clearTimeout(timer));
    });

    // The popup layer follows the shown state; the exit plays before it leaves.
    effect(() => {
      const shown = this.popupOpen();
      // menu-rows: the options arrive one stagger step after the popup surface, each time it opens.
      untracked(() => (shown ? openStaggered(this.layer, POPUP_LIST_ROWS, () => this.motion.mode('menu-rows')) : this.layer.close()));
    });
    // combobox-results: on a new query the rows that stay slide and new rows rise. The exit copy is the layer's (B6).
    injectPopupResults(this.layer);

    // The anchor carries the placed side and alignment, as the Radix PopperAnchor does.
    effect(() => {
      const side = this.layer.side();
      const align = this.layer.align();
      if (side === null) this.host.removeAttribute('data-radix-popper-side');
      else this.host.setAttribute('data-radix-popper-side', side);
      if (align === null) this.host.removeAttribute('data-radix-popper-align');
      else this.host.setAttribute('data-radix-popper-align', align);
    });

    // A press outside the field and the popup closes, as the Radix DismissableLayer does.
    const onPointerDown = (event: PointerEvent) => {
      if (!this.popupOpen()) return;
      const target = event.target as Node | null;
      if (target && (this.host.contains(target) || this.layer.contains(target))) return;
      this.close();
      this.restore();
    };
    this.doc.addEventListener('pointerdown', onPointerDown);
    destroyRef.onDestroy(() => this.doc.removeEventListener('pointerdown', onPointerDown));

    this.host.addEventListener('mousedown', (event) => {
      // A press on the box, not on the input or a button, focuses the input.
      if (event.defaultPrevented || event.target !== this.host) return;
      event.preventDefault();
      this.nativeControl.focus();
    });
  }

  ngOnInit(): void {
    this.openState.set(this.defaultOpen());
    this.initText();
  }

  /** The text before anything is typed. */
  protected initText(): void {
    if (this.mode === 'select') {
      this.lastLabel = this.selectedLabel();
      this.text.set(this.selectedLabel());
    }
  }

  /** The native input. */
  get nativeControl(): HTMLInputElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }

  protected setText(next: string): void {
    this.text.set(next);
    this.onTextChange(next);
  }

  private setOpen(next: boolean): void {
    this.openState.set(next);
    this.open.set(next);
  }

  private openList(which: 'selected' | 'first' | 'last' | 'none'): void {
    if (this.inert()) return;
    this.setOpen(true);
    if (which === 'none') return;
    const value = this.selectValue();
    if (which === 'selected' && value !== null && this.options().some((o) => o.value === value)) {
      this.highlight.set(value);
      return;
    }
    const i = this.highlight.edge(which === 'last' ? 'last' : 'first');
    this.highlight.setIndex(i);
  }

  protected close(): void {
    this.setOpen(false);
    this.highlight.set(null);
  }

  /** select mode: the field goes back to the chosen label. */
  protected restore(): void {
    if (this.mode !== 'select') return;
    this.typed.set(false);
    this.setText(this.selectedLabel());
  }

  protected choose(option: ListBoxOption): void {
    if (option.disabled || this.inert()) return;
    this.onSelect(option);
    this.typed.set(false);
    this.setText(option.label);
    if (this.mode === 'select') this.lastLabel = option.label;
    this.close();
  }

  private move(step: 1 | -1): void {
    const next = this.highlight.next(this.highlight.index(), step, this.loop());
    if (next !== -1) this.highlight.setIndex(next);
  }

  protected onOptionSelect(value: string): void {
    const option = this.options().find((o) => o.value === value);
    if (option) this.choose(option);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    // keyCode 229: Safari confirms an IME composition with an Enter that says isComposing false.
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    const key = event.key;
    const popupOpen = this.popupOpen();
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!popupOpen) {
        if (event.altKey && key === 'ArrowUp') return;
        if (event.altKey) this.openList('none');
        else this.openList(key === 'ArrowDown' ? (this.mode === 'select' ? 'selected' : 'first') : 'last');
        return;
      }
      if (event.altKey && key === 'ArrowUp') {
        const option = this.options().find((o) => o.value === this.highlighted());
        if (option) this.choose(option);
        else this.close();
        return;
      }
      this.move(key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (key === 'Enter') {
      if (!this.isOpen()) {
        if (this.mode === 'free') this.onCommit(this.text());
        return;
      }
      const option = this.options().find((o) => o.value === this.highlighted());
      if (option) {
        event.preventDefault();
        this.choose(option);
        return;
      }
      if (this.mode === 'free') this.onCommit(this.text());
      this.close();
      return;
    }
    if (key === 'Escape') {
      if (popupOpen) {
        event.preventDefault();
        this.close();
        this.restore();
        return;
      }
      if (this.isOpen()) this.close();
      if (this.text() !== '' || (this.mode === 'select' && this.selectValue() !== null)) {
        event.preventDefault();
        if (this.inert()) return;
        this.setText('');
        this.typed.set(false);
        if (this.mode === 'select') this.onSelect(null);
      }
    }
  }

  protected onInputChange(next: string): void {
    if (this.inert()) return;
    this.setText(next);
    this.typed.set(true);
    if (!this.isOpen()) this.setOpen(true);
    // select mode: the first match is highlighted once the list has filtered, so Enter picks it.
    this.highlight.set(null);
    if (this.mode === 'select') this.highlight.set(this.highlight.edgeValue('first'));
  }

  protected onInputBlur(event: FocusEvent): void {
    this.onTouched();
    const next = event.relatedTarget as Node | null;
    // Focus that stays in the field (its buttons) or in the popup is not a blur of the combobox.
    if (next && (this.host.contains(next) || this.layer.contains(next))) return;
    if (this.isOpen()) this.close();
    if (this.mode === 'select') {
      if (this.typed() && this.text().trim() === '') this.onSelect(null);
      else this.restore();
    }
  }

  protected onInputClick(event: MouseEvent): void {
    if (!event.defaultPrevented && !this.isOpen() && this.mode === 'select') this.openList('selected');
  }

  protected onClear(): void {
    this.setText('');
    this.typed.set(false);
    this.onSelect(null);
    this.nativeControl.focus();
  }

  protected onTrigger(): void {
    if (this.isOpen()) {
      this.close();
      this.restore();
    } else {
      this.typed.set(false);
      this.openList('selected');
    }
    this.nativeControl.focus();
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
