// Select: one value from a list in a closed trigger. The twin of
// packages/react/src/components/Select/Select.tsx, which is built on Radix
// Select. Here the behavior is hand built with the Radix Select DOM, read
// from node_modules/@radix-ui/react-select/dist/index.mjs:
//
//   <button data-ds="select" role="combobox" aria-expanded aria-autocomplete="none" dir data-size data-shape
//           data-placeholder? data-invalid? data-disabled? data-readonly? data-loading?>   the host, the Radix Trigger
//     <span data-part="value" style="pointer-events: none;">   the chosen label (a copy of the item text), or the placeholder
//     <span data-part="icon" aria-hidden="true">               chevrons-up-down, or a spinner while loading
//   <span hidden id>                                           the loading words, after the trigger, while loading
//   <select aria-hidden tabindex="-1">                         the Radix bubble select, after the trigger, inside a form only
//   <body>
//     <div data-ds="theme" data-menu-layer>                    internal/popper.ts, only while open
//       <div data-radix-popper-content-wrapper dir>
//         <div data-ds="select" data-part="content" role="listbox" data-state="open" data-side data-align dir tabindex="-1">
//           <style>                                            the Radix viewport scrollbar rule
//           <div data-part="scroll-up">                        while the list can scroll up
//           <div data-part="viewport" role="presentation" data-radix-select-viewport>
//             <div data-part="item" role="option" data-state="checked|unchecked" data-highlighted? data-disabled?>
//               <span aria-hidden>  the row fill that glides from the last lit row (row-glide), no part name
//               <span data-part="indicator">  <span data-part="item-icon">  <span data-part="item-label" id>  <span data-part="item-description">
//             <div data-part="separator">  <div data-part="group" role="group"> <div data-part="label">
//           <div data-part="scroll-down">
//
// Keys and pointer as Radix: on the closed trigger Enter, Space, ArrowDown
// and ArrowUp open, typed letters choose by typeahead; in the list the
// arrows, Home and End move focus (no wrap), letters run typeahead, Enter
// and Space choose, Escape and Tab-free focus trap, a press outside closes,
// and focus goes back to the trigger. Typeahead matching comes from the
// shared listbox.ts (typeaheadIndex, with the Radix pause of 1000ms), which
// also folds Arabic alef forms and diacritics. The list is modal, as Radix:
// the rest of the page is hidden from assistive tech and does not scroll.
// The popup is a CDK ComponentPortal placed by internal/popper.ts. Angular
// Aria Select would replace the hand built keys once order A3.0 installs
// @angular/aria.
//
// Motion, as React: the rows arrive one stagger step after the surface each
// time the list opens (menu-rows); the lit row's fill travels from the row lit
// before (row-glide); a new value rolls up into the trigger, not on first
// paint (picker-value-roll); the chevron turn is CSS (picker-chevron-turn).
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`, `onOpenChange` the `openChange` output of `[(open)]`.
// `empty` takes text or a TemplateRef. aria-label, aria-labelledby and
// aria-describedby are inputs, because the list reads them too.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type EmbeddedViewRef,
  Injector,
  TemplateRef,
  afterNextRender,
  afterRenderEffect,
  type ElementRef,
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
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import { DsSpinner } from '../spinner/spinner';
import { createTypeahead, edgeEnabledIndex, nextEnabledIndex, typeaheadIndex, type Shape, type Size } from '@the-system/shared';
import { hideOthers, lockScroll } from '../../behavior/dialog-behavior';
import { consumeHostAttributes } from '../../internal/host';
import { staggerGroup } from '@the-system/motion';
import { injectMotion } from '../../internal/motion';
import { injectRowGlide, staggerRows } from '../../internal/motion-selection';
import { optionalBoolean } from '../../internal/optional-boolean';
import { PopupLayer } from '../../internal/popper';
import { DsThemeService } from '../../theme';
import { DsFieldContext, fieldControl } from '../field/field-context';
import {
  flattenListBoxItems,
  isIconContent,
  isListBoxSection,
  listBoxOptionId,
  type ListBoxContent,
  type ListBoxItem,
  type ListBoxOption,
  type ListBoxSection,
} from '../list-box/list-box';

export type SelectSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SelectShape = Extract<Shape, 'default' | 'pill'>;
export type SelectItem = ListBoxItem;
export type SelectOption = ListBoxOption;

/** Space kept between the list and the viewport edge, in CSS px. */
const VIEWPORT_GUTTER = 8;
/** Gap between the trigger and the list, in CSS px. */
const TRIGGER_GAP = 4;
/** The Radix typeahead pause. */
const TYPEAHEAD_PAUSE = 1000;
const OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown'];
/** The style Radix puts first in the content, so the viewport draws no scrollbar. */
const VIEWPORT_STYLE =
  '[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}';
const VISUALLY_HIDDEN =
  'position: absolute; border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;';

const words = {
  en: { placeholder: 'Choose an option', empty: 'No options to choose from yet.', loading: 'Loading options' },
  ar: { placeholder: 'اختيار من القائمة', empty: 'ما فيه خيارات للاختيار.', loading: 'جار تحميل الخيارات' },
} as const;

/** One drawn row of the list: a separator, a group with its options, or a loose option. */
type Row =
  | { kind: 'option'; option: ListBoxOption; index: number }
  | { kind: 'group'; section: ListBoxSection; key: string; separator: boolean; options: { option: ListBoxOption; index: number }[] };

let nextId = 0;

@Component({
  selector: 'button[dsSelect]',
  exportAs: 'dsSelect',
  imports: [DsIcon, DsSpinner, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSelect), multi: true }],
  host: {
    type: 'button',
    role: 'combobox',
    'aria-autocomplete': 'none',
    'data-ds': 'select',
    '[attr.aria-controls]': 'isOpen() ? contentId : null',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.dir]': 'dir()',
    '[disabled]': 'isDisabled()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-placeholder]': 'current() === null ? "" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.aria-readonly]': 'isReadOnly() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.id]': 'controlId() ?? null',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.aria-required]': 'isRequired() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? null',
    '(pointerdown)': 'onTriggerPointerDown($event)',
    '(click)': 'onTriggerClick($event)',
    '(keydown)': 'onTriggerKeydown($event)',
    '(blur)': 'onTriggerBlur($event)',
  },
  template: `<span #valueEl data-part="value" style="pointer-events: none;">@if (current() === null) {{{ placeholderText() }}} @else {<span data-part="item-label">{{ selectedLabel() }}</span>}</span><span aria-hidden="true" data-part="icon">@if (loading()) {<span dsSpinner size="sm" decorative></span>} @else {<svg dsIcon name="chevrons-up-down" size="md"></svg>}</span>
<ng-template #content><div data-ds="select" data-part="content" role="listbox" [attr.id]="contentId" data-state="open" [attr.dir]="dir()"
  [attr.data-side]="layer.side()" [attr.data-align]="layer.align()" [attr.data-size]="listSize()"
  [attr.aria-labelledby]="listLabelledBy() ?? null" [attr.aria-label]="ariaLabel() ?? null"
  style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; --radix-select-content-transform-origin: var(--radix-popper-transform-origin); --radix-select-content-available-width: var(--radix-popper-available-width); --radix-select-content-available-height: var(--radix-popper-available-height); --radix-select-trigger-width: var(--radix-popper-anchor-width); --radix-select-trigger-height: var(--radix-popper-anchor-height); pointer-events: auto;"
  tabindex="-1" (keydown)="onContentKeydown($event)">@if (canScrollUp()) {<div aria-hidden="true" data-part="scroll-up" style="flex-shrink: 0;" (pointerdown)="startAutoScroll(-1)" (pointermove)="startAutoScroll(-1); onItemLeave()" (pointerleave)="stopAutoScroll()"><svg dsIcon name="chevron-up" size="md"></svg></div>}<div #viewport data-part="viewport" data-radix-select-viewport="" role="presentation" style="position: relative; flex: 1 1 0%; overflow: hidden auto;" (scroll)="updateScrollButtons()">@for (row of rows(); track row.kind === 'option' ? row.option.value : row.key) {@if (row.kind === 'option') {<ng-container [ngTemplateOutlet]="item" [ngTemplateOutletContext]="{ $implicit: row.option, index: row.index }" />} @else {@if (row.separator) {<div aria-hidden="true" data-part="separator"></div>}<div role="group" data-part="group" [attr.aria-labelledby]="baseId + '-group-' + row.key"><div data-part="label" [attr.id]="baseId + '-group-' + row.key">{{ row.section.label }}</div>@for (entry of row.options; track entry.option.value) {<ng-container [ngTemplateOutlet]="item" [ngTemplateOutletContext]="{ $implicit: entry.option, index: entry.index }" />}</div>}}</div>@if (canScrollDown()) {<div aria-hidden="true" data-part="scroll-down" style="flex-shrink: 0;" (pointerdown)="startAutoScroll(1)" (pointermove)="startAutoScroll(1); onItemLeave()" (pointerleave)="stopAutoScroll()"><svg dsIcon name="chevron-down" size="md"></svg></div>}</div></ng-template>
<ng-template #item let-option let-index="index">@let checked = current() === option.value; @let focused = focusedIndex() === index; @let off = option.disabled === true;<div role="option" data-part="item" data-radix-collection-item=""
  [attr.data-index]="null"
  [attr.aria-labelledby]="baseId + '-text-' + index"
  [attr.aria-describedby]="option.description ? idOf(option.value) + '-description' : null"
  [attr.data-highlighted]="focused ? '' : null"
  [attr.aria-selected]="checked && focused"
  [attr.data-state]="checked ? 'checked' : 'unchecked'"
  [attr.aria-disabled]="off ? 'true' : null"
  [attr.data-disabled]="off ? '' : null"
  [attr.tabindex]="off ? null : -1"
  (focus)="focusedIndex.set(index)" (blur)="focusedIndex.set(-1)"
  (pointerdown)="itemPointerType = $event.pointerType"
  (pointermove)="onItemPointerMove($event, off)"
  (pointerleave)="onItemPointerLeave($event)"
  (pointerup)="onItemPointerUp(option, off)"
  (click)="onItemClick(option, off)"
  (keydown)="onItemKeydown($event, option, off)"><span aria-hidden="true"></span><span data-part="indicator" aria-hidden="true">@if (checked) {<svg dsIcon name="check" size="md"></svg>}</span>@if (option.start !== undefined) {<span data-part="item-icon" aria-hidden="true">@if (isIconContent(option.start)) {<svg dsIcon [name]="option.start" size="md"></svg>} @else {<ng-container [ngTemplateOutlet]="option.start" />}</span>}<span data-part="item-label" [attr.id]="baseId + '-text-' + index">{{ option.label }}</span>@if (option.description !== undefined) {<span data-part="item-description" [attr.id]="idOf(option.value) + '-description'">{{ option.description }}</span>}</div></ng-template>`,
})
export class DsSelect implements ControlValueAccessor {
  /** The options, plain or in titled groups, as ListBox takes them. */
  readonly items = input<readonly SelectItem[]>([]);
  /** The chosen option value. Two way: `[(value)]`. null: none, the placeholder shows. */
  readonly value = model<string | null | undefined>(undefined);
  readonly defaultValue = input<string | null>(null);
  /** The list is open. Two way: `[(open)]`. */
  readonly open = model<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** Shown when nothing is chosen. Default "Choose an option" (Arabic under lang ar). */
  readonly placeholder = input<string | undefined>(undefined);
  /** Trigger height and the row size of the list. Default md. */
  readonly size = input<SelectSize>('md');
  readonly shape = input<SelectShape>('default');
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Native disabled: out of the tab order. Inside a Field it follows the Field. */
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The value can be read and focused but not changed: the list does not open. */
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Options are on their way: a spinner, aria-busy, the trigger described by loadingLabel, the list does not open. */
  readonly loading = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  readonly loadingLabel = input<string | undefined>(undefined);
  /** Shown in the list when there is no option. */
  readonly empty = input<ListBoxContent | undefined>(undefined);
  /** Submits the value under this name in a form (a hidden native select, as Radix renders). */
  readonly name = input<string | undefined>(undefined);
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = consumeHostAttributes([
    'dsSelect', 'items', 'value', 'defaultValue', 'open', 'defaultOpen', 'placeholder', 'size', 'shape', 'invalid',
    'disabled', 'readOnly', 'required', 'loading', 'loadingLabel', 'empty', 'name', 'id', 'aria-label',
    'aria-labelledby', 'aria-describedby',
  ]) as HTMLButtonElement;
  private readonly contentTemplate = viewChild.required<TemplateRef<unknown>>('content');
  private readonly valueEl = viewChild.required<ElementRef<HTMLSpanElement>>('valueEl');
  private readonly motion = injectMotion();
  /** row-glide: the lit row's fill travels from the row lit before. */
  private readonly glide = injectRowGlide("[data-part='item']");

  protected readonly baseId = `ds-select-${++nextId}`;
  readonly contentId = `${this.baseId}-content`;
  private readonly loadingId = `${this.baseId}-loading`;
  protected readonly isIconContent = isIconContent;

  protected readonly lang = computed<'en' | 'ar'>(() => (this.theme.value().lang.startsWith('ar') ? 'ar' : 'en'));
  protected readonly dir = computed(() => this.theme.value().dir);
  protected readonly placeholderText = computed(() => this.placeholder() ?? words[this.lang()].placeholder);
  protected readonly loadingText = computed(() => this.loadingLabel() ?? words[this.lang()].loading);
  protected readonly emptyContent = computed<ListBoxContent>(() => this.empty() ?? words[this.lang()].empty);

  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /** The Field wiring merged with the control's own values, as React's useFieldControl. It lands on the trigger. */
  private readonly fieldState = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [this.ariaDescribedby(), this.hasNote() ? this.loadingId : undefined].filter(Boolean).join(' ') || undefined,
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
  /** No option to choose: the list does not open (an empty listbox is not valid), as React. */
  protected readonly isEmpty = computed(() => flattenListBoxItems(this.items()).length === 0);
  /** While loading or empty, a hidden note after the trigger describes it. */
  private readonly hasNote = computed(() => this.loading() || this.isEmpty());
  private readonly inert = computed(() => this.isReadOnly() || this.loading() || this.isEmpty());
  protected readonly listLabelledBy = computed(
    () => this.ariaLabelledby() ?? (this.ariaLabel() ? undefined : this.field?.labelId),
  );

  private readonly ownValue = signal<string | null>(null);
  /** The chosen value: the model when set, else its own. */
  readonly current = computed(() => {
    const v = this.value();
    return v !== undefined ? v : this.ownValue();
  });
  private readonly openState = signal(false);
  /** Open as the person sees it: never while read only or loading. */
  readonly isOpen = computed(() => (this.open() ?? this.openState()) && !this.inert() && !this.isDisabled());

  readonly options = computed(() => flattenListBoxItems(this.items()));
  protected readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.current())?.label ?? '');
  protected readonly listSize = computed(() => (this.size() === 'sm' ? 'sm' : 'md'));
  /** The drawn rows, with each option's index in the flat list and a separator only between drawn groups. */
  protected readonly rows = computed<Row[]>(() => {
    const out: Row[] = [];
    let index = 0;
    let drawn = 0;
    for (const item of this.items()) {
      if (!isListBoxSection(item)) {
        drawn += 1;
        out.push({ kind: 'option', option: item, index: index++ });
        continue;
      }
      if (item.options.length === 0) continue;
      const separator = drawn > 0;
      drawn += 1;
      out.push({
        kind: 'group',
        section: item,
        key: item.key ?? item.label,
        separator,
        options: item.options.map((option) => ({ option, index: index++ })),
      });
    }
    return out;
  });

  /** The index of the focused item (Radix highlights the focused item), or -1. */
  protected readonly focusedIndex = signal(-1);
  protected readonly canScrollUp = signal(false);
  protected readonly canScrollDown = signal(false);
  private readonly viewport = signal<HTMLElement | null>(null);

  protected readonly layer = new PopupLayer({
    template: () => this.contentTemplate(),
    anchor: () => this.host,
    side: 'bottom',
    align: 'start',
    sideOffset: TRIGGER_GAP,
    padding: VIEWPORT_GUTTER,
    wrapperDir: () => this.dir(),
  });

  private readonly typeahead = createTypeahead(TYPEAHEAD_PAUSE);
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  private triggerPointerType = 'touch';
  protected itemPointerType = 'touch';
  private pointerDownAt: { x: number; y: number } | null = null;
  private autoScroll: ReturnType<typeof setInterval> | null = null;
  private undo: (() => void)[] = [];
  private loadingEl: HTMLElement | null = null;
  private nativeSelect: HTMLSelectElement | null = null;

  private onChange: (value: string | null) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
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
      this.unmount(false);
      this.loadingEl?.remove();
      this.nativeSelect?.remove();
      this.stopAutoScroll();
    });

    // The list follows the open state. Radix Select has no exit presence: it leaves at once.
    effect(() => {
      const open = this.isOpen();
      untracked(() => (open ? this.mount() : this.unmount(true)));
    });

    // picker-value-roll: a new value rolls up into the trigger. Not on first paint.
    let lastValue: string | null | undefined;
    let painted = false;
    afterRenderEffect(() => {
      const value = this.current();
      const el = this.valueEl().nativeElement;
      untracked(() => {
        const first = !painted;
        painted = true;
        if (first || lastValue === value) {
          lastValue = value;
          return;
        }
        lastValue = value;
        staggerGroup([el], { from: 'block', spring: 'snappy', mode: this.motion.mode('picker-value-roll') });
      });
    });

    // The anchor carries the placed side and alignment, as the Radix PopperAnchor does.
    effect(() => {
      const side = this.layer.side();
      const align = this.layer.align();
      if (side === null) this.host.removeAttribute('data-radix-popper-side');
      else this.host.setAttribute('data-radix-popper-side', side);
      if (align === null) this.host.removeAttribute('data-radix-popper-align');
      else this.host.setAttribute('data-radix-popper-align', align);
    });

    // While loading or with no option, the words that describe the trigger, in a hidden span after it.
    let noteView: EmbeddedViewRef<unknown> | null = null;
    effect(() => {
      const show = this.hasNote();
      const content: ListBoxContent = this.loading() ? this.loadingText() : this.emptyContent();
      untracked(() => {
        noteView?.destroy();
        noteView = null;
        if (!show) {
          this.loadingEl?.remove();
          this.loadingEl = null;
          return;
        }
        if (!this.loadingEl) {
          this.loadingEl = this.doc.createElement('span');
          this.loadingEl.id = this.loadingId;
          this.loadingEl.hidden = true;
          this.host.after(this.loadingEl);
        }
        if (typeof content === 'string') this.loadingEl.textContent = content;
        else {
          this.loadingEl.textContent = '';
          noteView = content.createEmbeddedView(undefined);
          noteView.detectChanges();
          this.loadingEl.append(...(noteView.rootNodes as Node[]));
        }
      });
    });
    inject(DestroyRef).onDestroy(() => noteView?.destroy());

    // Inside a form, the Radix bubble select carries the value.
    afterNextRender(() => {
      if (!this.host.closest('form')) return;
      const select = this.doc.createElement('select');
      select.setAttribute('aria-hidden', 'true');
      select.tabIndex = -1;
      select.setAttribute('style', VISUALLY_HIDDEN);
      select.addEventListener('change', () => this.choose(select.value === '' ? null : select.value, false));
      (this.loadingEl ?? this.host).after(select);
      this.nativeSelect = select;
      const form = this.host.closest('form');
      const initial = untracked(this.current);
      const reset = () => this.setValue(initial);
      form?.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form?.removeEventListener('reset', reset));
      effect(
        () => {
          const value = this.current();
          const options = this.options();
          const name = this.name();
          const required = this.isRequired();
          const disabled = this.isDisabled();
          untracked(() => {
            if (name !== undefined) select.name = name;
            else select.removeAttribute('name');
            select.required = required;
            select.disabled = disabled;
            select.replaceChildren();
            if (value === null) select.append(new Option('', ''));
            for (const o of options) {
              const opt = new Option(o.label, o.value);
              opt.disabled = o.disabled === true;
              select.append(opt);
            }
            select.value = value ?? '';
          });
        },
        { injector: this.injector },
      );
    });
  }

  /** The trigger, the root. */
  get nativeElement(): HTMLButtonElement {
    return this.host;
  }

  focus(): void {
    this.host.focus();
  }

  protected idOf(value: string): string {
    return listBoxOptionId(this.baseId, value);
  }

  private setOpen(next: boolean): void {
    if (next && (this.inert() || this.isDisabled())) return;
    this.openState.set(next);
    this.open.set(next);
  }

  private setValue(next: string | null): void {
    this.ownValue.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  /** Chooses a value (or none) and, from the list, closes. */
  private choose(value: string | null, close = true): void {
    if (value !== this.current()) this.setValue(value);
    if (close) this.setOpen(false);
  }

  // ---------------------------------------------------------------- trigger

  protected onTriggerPointerDown(event: PointerEvent): void {
    // Read only and loading: the pointer does not open the list.
    if (this.inert()) {
      event.preventDefault();
      return;
    }
    this.triggerPointerType = event.pointerType;
    const target = event.target as Element;
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    if (event.button === 0 && !event.ctrlKey && event.pointerType === 'mouse') {
      this.openFrom({ x: Math.round(event.pageX), y: Math.round(event.pageY) });
      event.preventDefault();
    }
  }

  protected onTriggerClick(event: MouseEvent): void {
    this.host.focus();
    if (this.triggerPointerType !== 'mouse' && !this.inert()) this.openFrom({ x: Math.round(event.pageX), y: Math.round(event.pageY) });
  }

  private openFrom(at: { x: number; y: number } | null): void {
    if (!this.isDisabled()) {
      this.setOpen(true);
      this.resetTypeahead();
    }
    this.pointerDownAt = at;
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    const opens = [...OPEN_KEYS, 'Home', 'End'].includes(event.key);
    const types = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    // Read only and loading: no key opens the list or changes the value by typeahead.
    if (this.inert()) {
      if (opens || types) event.preventDefault();
      return;
    }
    const typingAhead = this.typeaheadRunning;
    if (types) {
      // Typeahead on the closed trigger chooses the next match (shared typeaheadIndex).
      const options = this.options();
      const enabled = options.filter((o) => !o.disabled);
      const from = enabled.findIndex((o) => o.value === this.current());
      const i = typeaheadIndex(
        enabled.map((o) => o.label),
        this.pushTypeahead(event.key),
        from,
        () => false,
      );
      const next = enabled[i];
      if (next && next.value !== this.current()) this.setValue(next.value);
    }
    if (typingAhead && event.key === ' ') return;
    if (OPEN_KEYS.includes(event.key)) {
      this.openFrom(null);
      event.preventDefault();
    }
  }

  // ---------------------------------------------------------------- typeahead

  private typeaheadRunning = false;

  private pushTypeahead(key: string): string {
    const buffer = this.typeahead.push(key);
    this.typeaheadRunning = true;
    clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => this.resetTypeahead(), TYPEAHEAD_PAUSE);
    return buffer;
  }

  private resetTypeahead(): void {
    this.typeahead.reset();
    this.typeaheadRunning = false;
    clearTimeout(this.typeaheadTimer);
  }

  // ---------------------------------------------------------------- the list

  private get content(): HTMLElement | null {
    return this.layer.content;
  }

  private itemElements(): HTMLElement[] {
    return Array.from(this.content?.querySelectorAll<HTMLElement>('[data-part="item"]') ?? []);
  }

  private mount(): void {
    if (this.layer.mounted()) return;
    this.layer.open();
    const content = this.content;
    if (!content) return;
    const style = this.doc.createElement('style');
    style.textContent = VIEWPORT_STYLE;
    const viewport = content.querySelector<HTMLElement>('[data-part="viewport"]');
    // Radix renders the style next to the viewport, after the scroll up button.
    content.insertBefore(style, viewport);
    this.viewport.set(viewport);
    // menu-rows: the rows arrive one stagger step after the surface. row-glide: the lit row's fill travels.
    this.glide(content);
    staggerRows(content, "[data-part='viewport'] [data-part='item']", this.motion.mode('menu-rows'));
    const body = this.doc.body;
    const pointerEvents = body.style.pointerEvents;
    body.style.pointerEvents = 'none';
    const close = () => this.setOpen(false);
    const win = this.doc.defaultView;
    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (this.layer.contains(target) || this.host.contains(target))) return;
      this.setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this.isOpen()) return;
      event.preventDefault();
      this.setOpen(false);
    };
    this.doc.addEventListener('pointerdown', onPointerDownOutside, true);
    this.doc.addEventListener('keydown', onEscape, true);
    win?.addEventListener('blur', close);
    win?.addEventListener('resize', close);
    this.undo = [
      () => this.doc.removeEventListener('pointerdown', onPointerDownOutside, true),
      () => this.doc.removeEventListener('keydown', onEscape, true),
      () => win?.removeEventListener('blur', close),
      () => win?.removeEventListener('resize', close),
      () => (body.style.pointerEvents = pointerEvents),
      lockScroll(this.doc),
      hideOthers(this.layer.content?.closest('[data-menu-layer]') ?? content),
    ];
    this.watchTriggerPointerUp(content);
    afterNextRender(
      () => {
        this.updateScrollButtons();
        // Focus the chosen item, else the first enabled one, else the list (Radix focusSelectedItem).
        const items = this.itemElements();
        const options = this.options();
        let i = options.findIndex((o) => o.value === this.current());
        if (i === -1) i = edgeEnabledIndex(options.length, 'first', (n) => options[n]?.disabled ?? false);
        this.focusCandidate(items[i] ?? content);
      },
      { injector: this.injector },
    );
  }

  /** After a pointer opened the list: a release near the press is not a choice, one outside closes. */
  private watchTriggerPointerUp(content: HTMLElement): void {
    if (this.pointerDownAt === null) return;
    const start = this.pointerDownAt;
    let delta = { x: 0, y: 0 };
    const move = (event: PointerEvent) => {
      delta = { x: Math.abs(Math.round(event.pageX) - start.x), y: Math.abs(Math.round(event.pageY) - start.y) };
    };
    const up = (event: PointerEvent) => {
      if (delta.x <= 10 && delta.y <= 10) {
        event.preventDefault();
        this.ignoreNextPointerUp = true;
      } else if (!event.composedPath().includes(content)) this.setOpen(false);
      this.doc.removeEventListener('pointermove', move);
      this.pointerDownAt = null;
    };
    this.doc.addEventListener('pointermove', move);
    this.doc.addEventListener('pointerup', up, { capture: true, once: true });
    this.undo.push(() => {
      this.doc.removeEventListener('pointermove', move);
      this.doc.removeEventListener('pointerup', up, { capture: true });
    });
  }

  private ignoreNextPointerUp = false;

  private unmount(returnFocus: boolean): void {
    if (!this.layer.mounted()) return;
    for (const fn of this.undo.reverse()) fn();
    this.undo = [];
    this.stopAutoScroll();
    this.focusedIndex.set(-1);
    this.viewport.set(null);
    this.glide(null);
    this.layer.dispose();
    this.resetTypeahead();
    if (returnFocus) this.host.focus({ preventScroll: true });
    // Focus left the trigger and the list together: the control is touched now.
    else this.onTouched();
  }

  /** Touched when focus leaves the trigger, but not when it moves into the open list. */
  protected onTriggerBlur(event: FocusEvent): void {
    const to = event.relatedTarget as Node | null;
    if (this.isOpen() || (to && this.layer.contains(to))) return;
    this.onTouched();
  }

  private focusCandidate(el: HTMLElement | undefined): void {
    if (!el) return;
    const items = this.itemElements();
    const viewport = this.viewport();
    el.scrollIntoView?.({ block: 'nearest' });
    if (viewport && el === items[0]) viewport.scrollTop = 0;
    if (viewport && el === items[items.length - 1]) viewport.scrollTop = viewport.scrollHeight;
    el.focus({ preventScroll: true });
    this.updateScrollButtons();
  }

  protected updateScrollButtons(): void {
    const viewport = this.viewport();
    if (!viewport) {
      this.canScrollUp.set(false);
      this.canScrollDown.set(false);
      return;
    }
    const max = viewport.scrollHeight - viewport.clientHeight;
    this.canScrollUp.set(viewport.scrollTop > 0);
    this.canScrollDown.set(Math.ceil(viewport.scrollTop) < max);
  }

  protected startAutoScroll(direction: 1 | -1): void {
    if (this.autoScroll !== null) return;
    this.autoScroll = setInterval(() => {
      const viewport = this.viewport();
      const first = this.itemElements()[0];
      if (viewport && first) viewport.scrollTop += direction * first.offsetHeight;
    }, 50);
  }

  protected stopAutoScroll(): void {
    if (this.autoScroll !== null) clearInterval(this.autoScroll);
    this.autoScroll = null;
  }

  protected onItemLeave(): void {
    this.content?.focus();
  }

  protected onContentKeydown(event: KeyboardEvent): void {
    const modifier = event.ctrlKey || event.altKey || event.metaKey;
    if (event.key === 'Tab') event.preventDefault();
    const options = this.options();
    const items = this.itemElements();
    const isDisabled = (n: number) => options[n]?.disabled ?? false;
    const current = items.indexOf(this.doc.activeElement as HTMLElement);
    if (!modifier && event.key.length === 1) {
      const i = typeaheadIndex(
        options.map((o) => o.label),
        this.pushTypeahead(event.key),
        current,
        isDisabled,
      );
      if (i !== -1 && i !== current) setTimeout(() => items[i]?.focus());
    }
    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      let next = -1;
      if (event.key === 'Home') next = edgeEnabledIndex(options.length, 'first', isDisabled);
      else if (event.key === 'End') next = edgeEnabledIndex(options.length, 'last', isDisabled);
      else {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        next = nextEnabledIndex(options.length, current, step, isDisabled, false);
        if (next === current) next = -1;
      }
      if (next !== -1) setTimeout(() => this.focusCandidate(items[next]));
      event.preventDefault();
    }
  }

  protected onItemPointerMove(event: PointerEvent, off: boolean): void {
    this.itemPointerType = event.pointerType;
    if (off) this.onItemLeave();
    else if (event.pointerType === 'mouse') (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  }

  protected onItemPointerLeave(event: PointerEvent): void {
    if (event.currentTarget === this.doc.activeElement) this.onItemLeave();
  }

  protected onItemPointerUp(option: ListBoxOption, off: boolean): void {
    if (this.ignoreNextPointerUp) {
      this.ignoreNextPointerUp = false;
      return;
    }
    if (!off && this.itemPointerType === 'mouse') this.choose(option.value);
  }

  protected onItemClick(option: ListBoxOption, off: boolean): void {
    if (!off && this.itemPointerType !== 'mouse') this.choose(option.value);
  }

  protected onItemKeydown(event: KeyboardEvent, option: ListBoxOption, off: boolean): void {
    if (off || event.target !== event.currentTarget) return;
    if (this.typeaheadRunning && event.key === ' ') return;
    if (event.key === 'Enter' || event.key === ' ') this.choose(option.value);
    if (event.key === ' ') event.preventDefault();
  }

  // ---------------------------------------------------------------- forms

  writeValue(value: string | null | undefined): void {
    this.ownValue.set(value ?? null);
    if (this.value() !== undefined) this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }

  ngOnInit(): void {
    this.ownValue.set(this.defaultValue());
    this.openState.set(this.defaultOpen());
  }
}
