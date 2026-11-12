// TagField: type and add free tags, with optional suggestions. The twin of
// packages/react/src/components/TagField/TagField.tsx, on the same DOM, so
// TagField.css applies as it is:
//
//   <div data-ds="tag-field" class="" data-size data-shape data-invalid? data-disabled? data-readonly?>   the host
//     <div data-part="tags" role="group" aria-labelledby aria-disabled?>
//       <span data-part="tag">
//         <span data-part="tag-label">
//         <button data-ds="close-button" data-part="tag-remove" tabindex="-1" aria-label="Remove tag design">
//     <input data-part="control" role="combobox"? aria-expanded? aria-controls? aria-activedescendant?>
//     <input type="hidden" name>                                         one per tag, with name
//     <span data-part="status" role="status">
//   <body>
//     <div data-ds="theme" data-menu-layer>                              internal/popper.ts
//       <div data-radix-popper-content-wrapper>
//         <div data-ds="tag-field" data-part="popup" data-size data-state>
//           <div dsListBox virtualFocus>
//
// Splitting, trimming and the duplicate rule (case, accents, Arabic
// diacritics and alef forms) come from the shared tags.ts; the suggestions
// are filtered with the shared filter.ts. Keys as React: Enter, the comma
// and the Arabic comma add the typed text; Backspace on an empty control
// focuses the last remove button, Backspace or Delete there removes it; the
// arrow toward the start moves into the tags. The suggestion popup is a CDK
// ComponentPortal placed by internal/popper.ts, the highlight kept by
// internal/list-highlight.ts (CDK ActiveDescendantKeyManager); Angular Aria
// would replace that once order A3.0 installs @angular/aria.
//
// CloseButton has no Angular port yet (lane A1.1): the remove button renders
// its DOM here on a native button (`dsNativeButton`), with aria-disabled and
// data-disabled when the field is disabled, and is replaced by the Angular
// CloseButton once it exists.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. `removeLabel` and `formatRemoved` are function inputs.
// Native input props React spreads on the input (`placeholder`, `id`,
// `aria-label`, `aria-labelledby`, `aria-describedby`) are inputs.
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
import { addTags, hasTag, hasTagSeparator, splitTags, type Shape, type Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { ListHighlight } from '../../internal/list-highlight';
import { DsNativeButton } from '../../internal/native-button';
import { optionalBoolean } from '../../internal/optional-boolean';
import { PopupLayer } from '../../internal/popper';
import { DsThemeService } from '../../theme';
import { DsFieldContext, fieldControl } from '../field/field-context';
import {
  DsListBox,
  filterListBoxItems,
  flattenListBoxItems,
  isListBoxSection,
  listBoxOptionId,
  type ListBoxItem,
  type ListBoxOption,
} from '../list-box/list-box';

export type TagFieldSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type TagFieldShape = Extract<Shape, 'default' | 'pill'>;

const VIEWPORT_GUTTER = 8;
const FIELD_GAP = 4;

const words = {
  en: {
    remove: (tag: string) => `Remove tag ${tag}`,
    added: (tags: string[]) => (tags.length === 1 ? `Added tag ${tags[0]}` : `Added ${tags.length} tags`),
    removed: (tag: string) => `Removed tag ${tag}`,
    duplicate: (tag: string) => `${tag} is already added`,
    full: (max: number) => `You can add up to ${max} ${max === 1 ? 'tag' : 'tags'}`,
  },
  ar: {
    remove: (tag: string) => `حذف الوسم ${tag}`,
    added: (tags: string[]) => (tags.length === 1 ? `أضفنا الوسم ${tags[0]}` : `أضفنا الوسوم: ${tags.length}`),
    removed: (tag: string) => `حذفنا الوسم ${tag}`,
    duplicate: (tag: string) => `الوسم ${tag} مضاف من قبل`,
    full: (max: number) => `الحد الأعلى للوسوم: ${max}`,
  },
} as const;

let nextId = 0;

@Component({
  selector: 'div[dsTagField]',
  exportAs: 'dsTagField',
  imports: [DsIcon, DsListBox, DsNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsTagField), multi: true }],
  host: {
    'data-ds': 'tag-field',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '(mousedown)': 'onRootMousedown($event)',
  },
  template: `@if (tags().length > 0) {<div data-part="tags" role="group" [attr.aria-labelledby]="labelledBy() ?? null" [attr.aria-label]="ariaLabel() ?? null" [attr.aria-disabled]="isDisabled() ? 'true' : null">@for (tag of tags(); track $index + '-' + tag; let i = $index) {<span data-part="tag"><span data-part="tag-label">{{ tag }}</span>@if (!isReadOnly()) {<button dsNativeButton type="button" data-ds="close-button" data-emphasis="ghost" data-part="tag-remove" data-shape="default" data-size="xs" data-tone="neutral" tabindex="-1"
  [attr.aria-label]="removeText(tag)"
  [attr.aria-disabled]="isDisabled() ? 'true' : null"
  [attr.data-disabled]="isDisabled() ? '' : null"
  (click)="onRemoveClick(i)" (keydown)="onRemoveKeydown($event, i)"><span data-part="icon"><svg dsIcon name="close" size="md"></svg></span></button>}</span>}</div>}<input #control
  type="text"
  data-part="control"
  autocomplete="off"
  enterkeyhint="enter"
  [attr.id]="controlId() ?? null"
  [attr.placeholder]="placeholder() ?? null"
  [attr.aria-label]="ariaLabel() ?? null"
  [attr.aria-labelledby]="ariaLabelledby() ?? null"
  [attr.aria-describedby]="describedBy() ?? null"
  [attr.aria-invalid]="isInvalid() ? 'true' : null"
  [attr.aria-required]="isRequired() ? 'true' : null"
  [attr.role]="hasSuggestions() ? 'combobox' : null"
  [attr.aria-expanded]="hasSuggestions() ? popupOpen() : null"
  [attr.aria-controls]="popupOpen() ? listId : null"
  [attr.aria-activedescendant]="activeId() ?? null"
  [attr.aria-autocomplete]="hasSuggestions() ? 'list' : null"
  [disabled]="isDisabled()"
  [readOnly]="isReadOnly()"
  [value]="text()"
  [attr.value]="text()"
  (input)="onInputChange($any($event.target).value)"
  (keydown)="onInputKeydown($event)"
  (paste)="onInputPaste($event)"
  (blur)="onInputBlur($event)" />@if (name() !== undefined) {@for (tag of tags(); track $index + '-' + tag) {<input type="hidden" [attr.name]="name()" [value]="tag" [attr.value]="tag" [disabled]="isDisabled()" />}}<span data-part="status" role="status">{{ status() }}</span>
<ng-template #popup><div data-ds="tag-field" data-part="popup" [attr.id]="popupId" [attr.data-size]="size()" [attr.data-state]="layer.closing() ? 'closed' : 'open'"
  [attr.data-side]="layer.side()" [attr.data-align]="layer.align()"
  style="--radix-popover-content-transform-origin: var(--radix-popper-transform-origin); --radix-popover-content-available-width: var(--radix-popper-available-width); --radix-popover-content-available-height: var(--radix-popper-available-height); --radix-popover-trigger-width: var(--radix-popper-anchor-width); --radix-popover-trigger-height: var(--radix-popper-anchor-height);"
  tabindex="-1" (mousedown)="$event.preventDefault()"><div dsListBox [id]="listId"
  [attr.aria-labelledby]="labelledBy() ?? null" [attr.aria-label]="ariaLabel() ?? null"
  [items]="shown()" [size]="size() === 'sm' ? 'sm' : 'md'" virtualFocus [query]="text()"
  [highlightedValue]="highlighted()" (highlightedValueChange)="highlight.set($event)"
  [value]="null" (optionSelect)="onOptionSelect($event)"></div></div></ng-template>`,
})
export class DsTagField implements ControlValueAccessor {
  /** The tags. Two way: `[(value)]`. */
  readonly value = model<readonly string[]>([]);
  readonly defaultValue = input<readonly string[] | undefined>(undefined);
  /** Suggested tags, plain or in groups. Choosing one adds its label. Tags already added are not suggested. */
  readonly suggestions = input<readonly ListBoxItem[] | undefined>(undefined);
  /** The most tags. Text past it is not added and the status says so. */
  readonly max = input<number | undefined>(undefined);
  readonly size = input<TagFieldSize>('md');
  readonly shape = input<TagFieldShape>('default');
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The name of each remove button. Default "Remove tag <tag>" (Arabic under lang ar). */
  readonly removeLabel = input<((tag: string) => string) | undefined>(undefined);
  /** The words read once after a removal. Default "Removed tag <tag>". */
  readonly formatRemoved = input<((tag: string) => string) | undefined>(undefined);
  /** Submits each tag under this name in a form (one hidden input per tag). */
  readonly name = input<string | undefined>(undefined);
  readonly id = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = consumeHostAttributes([
    'dsTagField', 'value', 'defaultValue', 'suggestions', 'max', 'size', 'shape', 'invalid', 'disabled', 'readOnly',
    'required', 'removeLabel', 'formatRemoved', 'name', 'id', 'placeholder', 'aria-label', 'aria-labelledby',
    'aria-describedby',
  ]);
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  private readonly popupTemplate = viewChild.required<TemplateRef<unknown>>('popup');

  protected readonly listId = `ds-tag-field-list-${++nextId}`;
  protected readonly popupId = `${this.listId}-popup`;

  private readonly lang = computed<'en' | 'ar'>(() => (this.theme.value().lang.startsWith('ar') ? 'ar' : 'en'));
  private readonly t = computed(() => words[this.lang()]);

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
  protected readonly labelledBy = computed(() => this.ariaLabelledby() ?? (this.ariaLabel() ? undefined : this.field?.labelId));
  private readonly inert = computed(() => this.isDisabled() || this.isReadOnly());

  readonly tags = computed(() => this.value());
  readonly text = signal('');
  private readonly open = signal(false);
  readonly highlighted = signal<string | null>(null);
  readonly status = signal('');

  /** Suggestions: the ones not added yet that match the text. */
  private readonly unused = computed<ListBoxItem[]>(() => {
    const suggestions = this.suggestions();
    if (!suggestions) return [];
    const tags = this.tags();
    const keep = (o: ListBoxOption) => !hasTag(tags, o.label);
    return suggestions
      .map((item) => (isListBoxSection(item) ? { ...item, options: item.options.filter(keep) } : item))
      .filter((item) => (isListBoxSection(item) ? item.options.length > 0 : keep(item)));
  });
  protected readonly shown = computed(() => filterListBoxItems(this.unused(), this.text()));
  private readonly options = computed(() => flattenListBoxItems(this.shown()));
  protected readonly hasSuggestions = computed(() => this.suggestions() !== undefined);
  readonly popupOpen = computed(() => this.hasSuggestions() && this.open() && !this.inert() && this.options().length > 0);
  private readonly highlightVisible = computed(() => {
    const h = this.highlighted();
    return h !== null && this.options().some((o) => o.value === h);
  });
  protected readonly activeId = computed(() => {
    const h = this.highlighted();
    return this.popupOpen() && this.highlightVisible() && h !== null ? listBoxOptionId(this.listId, h) : undefined;
  });
  protected readonly highlight = new ListHighlight(this.options, this.highlighted, this.injector);

  protected readonly layer = new PopupLayer({
    template: () => this.popupTemplate(),
    anchor: () => this.host,
    side: 'bottom',
    align: 'start',
    sideOffset: FIELD_GAP,
    padding: VIEWPORT_GUTTER,
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // The field root is the Radix Anchor, which renders class="".
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

    effect(() => {
      const open = this.popupOpen();
      untracked(() => (open ? this.layer.open() : this.layer.close()));
    });

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
    };
    this.doc.addEventListener('pointerdown', onPointerDown);
    destroyRef.onDestroy(() => this.doc.removeEventListener('pointerdown', onPointerDown));
  }

  ngOnInit(): void {
    const initial = this.defaultValue();
    if (initial !== undefined && this.value().length === 0) this.value.set([...initial]);
  }

  /** The native input. */
  get nativeControl(): HTMLInputElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }

  protected removeText(tag: string): string {
    const label = this.removeLabel();
    return label ? label(tag) : this.t().remove(tag);
  }

  private removeButtons(): HTMLButtonElement[] {
    return Array.from(this.host.querySelectorAll<HTMLButtonElement>('[data-part="tag-remove"]'));
  }

  private setTags(next: readonly string[]): void {
    this.value.set([...next]);
    this.onChange([...next]);
  }

  /** The status empties first, so the same words after a second removal are read again. */
  private say(text: string): void {
    this.status.set('');
    const frame = globalThis.requestAnimationFrame ?? ((fn: () => void) => setTimeout(fn, 16));
    frame(() => this.status.set(text));
  }

  /** Adds the parts and says what happened once. Returns the parts not added past max, so they stay in the control. */
  private add(incoming: string[]): string[] {
    if (this.inert() || incoming.length === 0) return [];
    const max = this.max();
    const result = addTags(this.tags(), incoming, max);
    if (result.added.length) this.setTags(result.tags);
    if (result.overflow.length && max !== undefined) this.say(this.t().full(max));
    else if (result.duplicates.length) this.say(this.t().duplicate(result.duplicates[0] ?? ''));
    else if (result.added.length) this.say(this.t().added(result.added));
    return result.overflow;
  }

  private remove(index: number): void {
    if (this.inert()) return;
    const tags = this.tags();
    const tag = tags[index];
    if (tag === undefined) return;
    this.setTags(tags.filter((_, i) => i !== index));
    const format = this.formatRemoved();
    this.say(format ? format(tag) : this.t().removed(tag));
  }

  private removeAt(index: number): void {
    // The next tag takes the index; at the end, the one before; with none left, the control.
    const left = this.tags().length - 1;
    const target = left === 0 ? 'control' : index < left ? index : index - 1;
    const before = this.tags();
    this.remove(index);
    // A controlled parent may refuse the removal: then focus stays.
    if (this.tags() === before) return;
    afterNextRender(
      () => {
        if (target === 'control') this.nativeControl.focus();
        else (this.removeButtons()[target] ?? this.nativeControl).focus();
      },
      { injector: this.injector },
    );
  }

  private close(): void {
    this.open.set(false);
    this.highlight.set(null);
  }

  private choose(option: ListBoxOption): void {
    if (option.disabled) return;
    this.add([option.label]);
    this.text.set('');
    this.close();
  }

  private commitText(): boolean {
    const parts = splitTags(this.text());
    if (parts.length === 0) return false;
    // Text past max stays in the control, so nothing typed is lost.
    this.text.set(this.add(parts).join(', '));
    this.close();
    return true;
  }

  protected onOptionSelect(value: string): void {
    const option = this.options().find((o) => o.value === value);
    if (option) this.choose(option);
  }

  private get rtl(): boolean {
    return this.theme.value().dir === 'rtl';
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    const key = event.key;
    const input = event.currentTarget as HTMLInputElement;
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const popupOpen = this.popupOpen();
    const tags = this.tags();
    const backKey = this.rtl ? 'ArrowRight' : 'ArrowLeft';
    if (popupOpen && (key === 'ArrowDown' || key === 'ArrowUp')) {
      event.preventDefault();
      const next = this.highlight.next(this.highlight.index(), key === 'ArrowDown' ? 1 : -1, true);
      if (next !== -1) this.highlight.setIndex(next);
      return;
    }
    if (!popupOpen && key === 'ArrowDown' && this.hasSuggestions() && !this.inert()) {
      event.preventDefault();
      this.open.set(true);
      return;
    }
    if (key === 'Enter') {
      const option = popupOpen ? this.options().find((o) => o.value === this.highlighted()) : undefined;
      if (option) {
        event.preventDefault();
        this.choose(option);
        return;
      }
      // Enter with text adds it and does not submit the form; on an empty control it does what the form does.
      if (this.text().trim() && !this.inert()) {
        event.preventDefault();
        this.commitText();
      }
      return;
    }
    if (key === 'Escape' && popupOpen) {
      event.preventDefault();
      this.close();
      return;
    }
    if (key === 'Backspace' && this.text() === '' && tags.length > 0 && !this.inert()) {
      event.preventDefault();
      this.removeButtons()[tags.length - 1]?.focus();
      return;
    }
    if (key === backKey && atStart && tags.length > 0) {
      event.preventDefault();
      this.removeButtons()[tags.length - 1]?.focus();
    }
  }

  protected onRemoveKeydown(event: KeyboardEvent, index: number): void {
    const key = event.key;
    const backKey = this.rtl ? 'ArrowRight' : 'ArrowLeft';
    const forwardKey = this.rtl ? 'ArrowLeft' : 'ArrowRight';
    const buttons = this.removeButtons();
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      if (!this.inert()) this.removeAt(index);
      return;
    }
    if (key === backKey) {
      event.preventDefault();
      buttons[Math.max(0, index - 1)]?.focus();
      return;
    }
    if (key === forwardKey) {
      event.preventDefault();
      if (index >= this.tags().length - 1) this.nativeControl.focus();
      else buttons[index + 1]?.focus();
      return;
    }
    if (key === 'Home' || key === 'End') {
      event.preventDefault();
      if (key === 'Home') buttons[0]?.focus();
      else this.nativeControl.focus();
    }
  }

  protected onRemoveClick(index: number): void {
    if (!this.inert()) this.removeAt(index);
  }

  protected onInputChange(next: string): void {
    if (this.inert()) return;
    if (hasTagSeparator(next)) {
      // Every part before the last separator becomes a tag; the rest stays in the control.
      const lastSep = Math.max(next.lastIndexOf(','), next.lastIndexOf('،'), next.lastIndexOf('\n'));
      this.add(splitTags(next.slice(0, lastSep)));
      this.text.set(next.slice(lastSep + 1).trimStart());
      // The input keeps what the person typed until the value binding writes it back.
      this.nativeControl.value = this.text();
      this.close();
      return;
    }
    this.text.set(next);
    this.highlight.set(null);
    if (this.hasSuggestions()) this.open.set(next.trim() !== '');
  }

  protected onInputPaste(event: ClipboardEvent): void {
    if (event.defaultPrevented || this.inert()) return;
    const pasted = event.clipboardData?.getData('text') ?? '';
    // A single line inputs as typed text; text with separators or lines becomes tags at once.
    if (!hasTagSeparator(pasted)) return;
    event.preventDefault();
    const input = event.currentTarget as HTMLInputElement;
    const text = this.text();
    const start = input.selectionStart ?? text.length;
    const end = input.selectionEnd ?? text.length;
    this.text.set(this.add(splitTags(text.slice(0, start) + pasted + text.slice(end))).join(', '));
  }

  protected onInputBlur(event: FocusEvent): void {
    this.onTouched();
    const next = event.relatedTarget as Node | null;
    if (next && (this.host.contains(next) || this.layer.contains(next))) return;
    this.close();
  }

  protected onRootMousedown(event: MouseEvent): void {
    // A press on the box, not on the input or a remove button, focuses the input.
    if (event.defaultPrevented || event.target !== this.host) return;
    event.preventDefault();
    this.nativeControl.focus();
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
