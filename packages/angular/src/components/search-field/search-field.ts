// SearchField: a search box with a clear button, an optional end slot and a
// loading state, built on Input. The twin of
// packages/react/src/components/SearchField/SearchField.tsx.
//
//   <div dsSearchField aria-label="Search boards" placeholder="Search boards" [(value)]="query" (submit)="run($event)"></div>
//
// The root is the bordered box. The nested dsInput is the control part: it
// keeps the native input and the Field wiring, and SearchField.css clears
// its own box through its private --_input-* properties. The clear part is
// an IconButton.
//
// Escape clears the query; a second Escape on the empty box passes, so a
// dialog or a menu around it can close. Enter emits submit. React's
// onValueChange, onSubmit and onClear are the valueChange (of the value
// model), submit and clear outputs. defaultValue is value. end takes a
// TemplateRef. Native props of the inner input are inputs, as on dsInput.
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldContext } from '../field/field-context';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInputGroupContext } from '../input-group/input-group-context';
import { DsInput } from '../input/input';

export type SearchFieldSize = Size;
export type SearchFieldShape = Extract<Shape, 'default' | 'pill'>;

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

const ATTRIBUTES = [
  'dsSearchField',
  'size',
  'shape',
  'value',
  'clearLabel',
  'loading',
  'loadingLabel',
  'end',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'id',
  'name',
  'placeholder',
  'autoComplete',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

@Component({
  selector: 'div[dsSearchField]',
  exportAs: 'dsSearchField',
  imports: [DsIcon, DsIconButton, DsInput, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSearchField), multi: true }],
  // The inner Input is this field's control, never the control of a group around it.
  viewProviders: [{ provide: DsInputGroupContext, useValue: null }],
  host: {
    'data-ds': 'search-field',
    '[attr.data-part]': 'group ? "control" : null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-empty]': 'empty() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `
    <span data-part="icon" aria-hidden="true"><svg dsIcon name="search"></svg></span>
    <div
      dsInput
      data-part="control"
      type="search"
      [size]="resolvedSize()"
      [shape]="resolvedShape()"
      [value]="query()"
      [invalid]="ownInvalid()"
      [disabled]="ownDisabled()"
      [readOnly]="ownReadOnly()"
      [required]="required()"
      [id]="id()"
      [name]="name()"
      [placeholder]="placeholder()"
      [autoComplete]="autoComplete()"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="ariaLabelledby()"
      [aria-describedby]="describedBy()"
      (valueChange)="change($event ?? '')"
      (keydown)="onKeyDown($event)"
      (focusout)="onTouched()"
    ></div>
    @if (!empty() && !isDisabled() && !isReadOnly()) {
      <button dsIconButton data-part="clear" icon="close" [label]="clearLabel()" [size]="clearSize()" shape="pill" (click)="clearQuery()"></button>
    }
    @if (loading() || end()) {
      <span data-part="end">
        <!-- The spinner goes before the end content, never in its place, so a focused end button keeps focus. -->
        @if (loading()) {
          <span data-part="spinner" aria-hidden="true"></span>
        }
        @if (end(); as content) {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    <span data-part="status" role="status">{{ loading() ? loadingLabel() : '' }}</span>
  `,
})
export class DsSearchField implements ControlValueAccessor {
  /** Height from size.control. Default md. */
  readonly size = input<SearchFieldSize | undefined>(undefined);
  /** default takes radius.control from the style. pill is always fully round. */
  readonly shape = input<SearchFieldShape | undefined>(undefined);
  /** The query. Two way: `[(value)]`. Default empty. */
  readonly value = model<string>('');
  /** The accessible name of the clear button. Default "Clear search". Arabic: "مسح البحث". */
  readonly clearLabel = input('Clear search');
  /** Results are on their way: a spinner at the start of the end slot and a polite status. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** What the status says while loading. Default "Searching". Arabic: "جاري البحث". */
  readonly loadingLabel = input('Searching');
  /** Content at the end of the box, after the clear button: a filter IconButton, a keyboard hint. */
  readonly end = input<TemplateRef<unknown> | undefined>(undefined);
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly autoComplete = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Enter was pressed, with the query. A form around the field still submits as usual. */
  readonly submit = output<string>();
  /** The query was cleared, by the clear button or by Escape. */
  readonly clear = output<void>();

  private readonly field = inject(DsFieldContext, { optional: true });
  protected readonly group = inject(DsInputGroupContext, { optional: true, skipSelf: true });
  private readonly host = consumeHostAttributes(ATTRIBUTES);
  private readonly inputRef = viewChild.required(DsInput);
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected readonly query = computed(() => this.value() ?? '');
  protected readonly empty = computed(() => this.query() === '');
  protected readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly resolvedShape = computed(() => this.shape() ?? this.group?.shape() ?? 'default');
  protected readonly ownInvalid = computed(() => this.invalid() ?? this.group?.invalid());
  protected readonly ownDisabled = computed(() => this.disabled() ?? this.group?.disabled() ?? (this.formDisabled() || undefined));
  protected readonly ownReadOnly = computed(() => this.readOnly() ?? this.group?.readOnly());
  protected readonly isInvalid = computed(() => this.ownInvalid() ?? this.field?.invalid() ?? false);
  protected readonly isDisabled = computed(() => this.ownDisabled() ?? this.field?.disabled() ?? false);
  protected readonly isReadOnly = computed(() => this.ownReadOnly() ?? this.field?.readOnly() ?? false);
  protected readonly describedBy = computed(
    () => [...(this.group?.addonIds() ?? []), this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
  );
  protected readonly clearSize = computed(() => (this.resolvedSize() === 'lg' ? 'sm' : 'xs'));

  constructor() {
    // The first Escape clears. Overlays listen for Escape on the document; a
    // window capture listener comes first, clears and marks the key handled.
    // An Escape on the empty box passes, so the layer closes.
    if (typeof window !== 'undefined') {
      const listener = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.target !== this.nativeInput) return;
        if (event.isComposing || event.keyCode === 229 || this.empty() || this.isReadOnly() || event.defaultPrevented) return;
        event.preventDefault();
        event.stopPropagation();
        this.clearQuery();
      };
      window.addEventListener('keydown', listener, { capture: true });
      inject(DestroyRef).onDestroy(() => window.removeEventListener('keydown', listener, { capture: true }));
    }
  }

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.inputRef().nativeInput;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  protected change(next: string): void {
    this.value.set(next);
    this.onChange(next);
  }

  /** Clears the query, emits clear and returns focus to the input. */
  clearQuery(): void {
    this.change('');
    this.clear.emit();
    this.nativeInput.focus();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    // A key that ends an IME composition (keyCode 229 in Safari) is not a command.
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') this.submit.emit(this.query());
  }

  writeValue(value: unknown): void {
    this.value.set(value === null || value === undefined ? '' : String(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  protected onRootMouseDown(event: MouseEvent): void {
    const el = this.nativeInput;
    if (event.defaultPrevented || el.disabled) return;
    const target = event.target as Element;
    if (target === el) return;
    const root = event.currentTarget as Element;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    event.preventDefault();
    el.focus();
  }
}
