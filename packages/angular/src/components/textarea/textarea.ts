// Textarea: multi line text in a bordered box, with an optional character
// count. The box is the root (`div[dsTextarea]`); the native textarea is the
// control part. The twin of packages/react/src/components/Textarea/Textarea.tsx.
//
//   <div dsField label="Board summary"><div dsTextarea [limit]="200" [(value)]="summary"></div></div>
//
// As in React, the value is also the text content of the native textarea.
// Native props are inputs with the React names (see dsInput): placeholder,
// name, autoComplete, maxRows and the rest. It implements
// ControlValueAccessor. Auto height comes from CSS `field-sizing: content`
// between a rows floor and a maxRows cap; where the browser lacks it, the
// height is set from scrollHeight on input. The count is announced politely
// only when it enters the last stretch before the limit and when it goes
// past it.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
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
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { VISUALLY_HIDDEN } from '../../internal/visually-hidden';
import { DsThemeService } from '../../theme/theme';
import { DsFieldContext, fieldControl } from '../field/field-context';

export type TextareaSize = Size;
/** A pill never wraps lines, so default is the only shape. */
export type TextareaShape = Extract<Shape, 'default'>;

type Zone = 'under' | 'near' | 'over';

/** Characters as a person counts them: code points, so an emoji is one. */
function lengthOf(value: string | null | undefined): number {
  return value === undefined || value === null ? 0 : Array.from(value).length;
}

function englishMessage(left: number): string {
  if (left >= 0) return left === 1 ? '1 character left' : `${left} characters left`;
  const over = -left;
  return over === 1 ? '1 character over the limit' : `${over} characters over the limit`;
}

function arabicCount(n: number): string {
  if (n === 1) return 'حرف واحد';
  if (n === 2) return 'حرفين';
  if (n <= 10) return `${n} حروف`;
  return `${n} حرف`;
}

function arabicMessage(left: number): string {
  if (left === 0) return 'ما باقي ولا حرف';
  if (left > 0) return `باقي ${arabicCount(left)}`;
  return `زاد ${arabicCount(-left)} عن الحد`;
}

/** Near the limit: the last tenth, never fewer than the last 10 characters, and never at an empty value. */
function nearAt(limit: number): number {
  return Math.min(limit - 1, Math.max(10, Math.ceil(limit / 10)));
}

/** The count in words, for aria-describedby: "39 of 200 characters". */
function countWords(length: number, limit: number | undefined, arabic: boolean): string {
  if (arabic) return limit ? `${length} من ${limit} حرف` : `${length} حرف`;
  return limit ? `${length} of ${limit} characters` : length === 1 ? '1 character' : `${length} characters`;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

let nextId = 0;

const TEXTAREA_ATTRIBUTES = [
  'dsTextarea',
  'size',
  'shape',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'rows',
  'maxRows',
  'autoHeight',
  'limit',
  'showCount',
  'countMessage',
  'value',
  'id',
  'name',
  'placeholder',
  'autoComplete',
  'autofocus',
  'spellCheck',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

@Component({
  selector: 'div[dsTextarea]',
  exportAs: 'dsTextarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsTextarea), multi: true }],
  host: {
    'data-ds': 'textarea',
    '[style.--_textarea-rows]': 'rows()',
    '[style.--_textarea-max-rows]': 'maxRows() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-auto-height]': 'autoHeight() ? "" : null',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
    '[attr.data-over]': 'over() ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `
    <textarea
      #native
      [attr.rows]="rows()"
      [attr.placeholder]="placeholder() ?? null"
      [attr.name]="name() ?? null"
      [attr.autocomplete]="autoComplete() ?? null"
      [attr.spellcheck]="spellCheck() === undefined ? null : String(spellCheck())"
      [attr.data-autofocus]="autofocus() ? '' : null"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.id]="state().id ?? null"
      [attr.aria-describedby]="state().describedBy ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      [value]="value() ?? ''"
      [defaultValue]="value() ?? ''"
      (input)="onInput(native.value)"
      (blur)="onTouched()"
      data-part="control"
    ></textarea>
    @if (countShown()) {
      <span [attr.id]="countId" data-part="count">
        <!-- The digits are drawn; the words are read. -->
        <span aria-hidden="true">{{ countDigits() }}</span><span [attr.style]="visuallyHidden">{{ countText() }}</span>
      </span>
    }
    <!-- The live region: not an anatomy part, so no data-part. -->
    <span [attr.style]="visuallyHidden" aria-live="polite" aria-atomic="true">{{ announcement() }}</span>
  `,
})
export class DsTextarea implements ControlValueAccessor {
  /** Text size and padding, in step with Input. Default md. */
  readonly size = input<TextareaSize>('md');
  /** default only: the field radius. A pill never wraps lines. */
  readonly shape = input<TextareaShape>('default');
  /** Marks the value invalid. Inside a Field it follows the Field. Past the limit it is always invalid. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Lines shown when empty, the floor of the auto height. Default 3. */
  readonly rows = input(3);
  /** Lines the auto height grows to before the text scrolls. No cap by default. */
  readonly maxRows = input<number | undefined>(undefined);
  /** Grows with the text from rows to maxRows. false keeps rows lines with a vertical resize handle. Default true. */
  readonly autoHeight = input(true, { transform: booleanAttribute });
  /** The character limit for the count. Past it the count turns danger and the value is invalid. It never cuts the text. */
  readonly limit = input<number | undefined>(undefined);
  /** Shows the count under the text. Default true when there is a limit. */
  readonly showCount = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The words announced near and past the limit. Default English, or Arabic in an Arabic theme. */
  readonly countMessage = input<((left: number) => string) | undefined>(undefined);
  /** The value. Two way: `[(value)]`. */
  readonly value = model<string | undefined>(undefined);
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly autoComplete = input<string | undefined>(undefined);
  /** Marks the control with data-autofocus, so a Dialog opens with focus on it. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly spellCheck = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  protected readonly field = inject(DsFieldContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly _consumed = consumeHostAttributes(TEXTAREA_ATTRIBUTES);
  private readonly nativeRef = viewChild.required<ElementRef<HTMLTextAreaElement>>('native');
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;
  protected readonly visuallyHidden = VISUALLY_HIDDEN;
  protected readonly String = String;
  protected readonly countId = `ds-textarea-${++nextId}-count`;

  private readonly arabic = computed(() => this.theme.value().lang.startsWith('ar'));
  protected readonly length = computed(() => lengthOf(this.value()));
  private readonly hasLimit = computed(() => {
    const limit = this.limit();
    return limit !== undefined && limit > 0;
  });
  protected readonly over = computed(() => this.hasLimit() && this.length() > (this.limit() ?? 0));
  protected readonly countShown = computed(() => this.showCount() ?? this.hasLimit());
  protected readonly countDigits = computed(() => (this.hasLimit() ? `${this.length()}/${this.limit()}` : String(this.length())));
  protected readonly countText = computed(() => countWords(this.length(), this.hasLimit() ? this.limit() : undefined, this.arabic()));
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [this.ariaDescribedby(), this.countShown() ? this.countId : undefined].filter(Boolean).join(' ') || undefined,
    invalid: this.over() ? true : this.invalid(),
    disabled: this.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly(),
    required: this.required(),
  }));

  private readonly zone = computed<Zone>(() => {
    if (!this.hasLimit()) return 'under';
    const limit = this.limit() ?? 0;
    if (this.over()) return 'over';
    return limit - this.length() <= nearAt(limit) ? 'near' : 'under';
  });
  protected readonly announcement = signal('');
  private lastZone: Zone | null = null;

  constructor() {
    // The live message changes only when the zone changes, so it is read once.
    effect(() => {
      const zone = this.zone();
      if (this.lastZone === null || zone === this.lastZone) {
        this.lastZone = zone;
        return;
      }
      this.lastZone = zone;
      untracked(() => {
        if (zone === 'under' || !this.hasLimit()) {
          this.announcement.set('');
          return;
        }
        const message = this.countMessage() ?? (this.arabic() ? arabicMessage : englishMessage);
        this.announcement.set(message((this.limit() ?? 0) - this.length()));
      });
    });
    // Fallback for browsers without field-sizing: measure, between the CSS floor and cap.
    afterRenderEffect(() => {
      this.value();
      this.rows();
      this.maxRows();
      this.autoHeight();
      untracked(() => this.fit());
    });
    if (this.field) {
      const field = this.field;
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
      inject(DestroyRef).onDestroy(() => {
        if (untracked(this.id) !== undefined) field.setControlId(undefined);
      });
    }
  }

  /** The native textarea. */
  get nativeTextarea(): HTMLTextAreaElement {
    return this.nativeRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeTextarea.focus(options);
  }

  private fit(): void {
    const node = this.nativeTextarea;
    if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('field-sizing', 'content')) return;
    if (!this.autoHeight()) {
      node.style.blockSize = '';
      return;
    }
    node.style.blockSize = 'auto';
    node.style.blockSize = `${node.scrollHeight}px`;
  }

  protected onInput(next: string): void {
    this.value.set(next);
    this.onChange(next);
  }

  writeValue(value: unknown): void {
    this.value.set(value === null || value === undefined ? undefined : String(value));
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

  /** A press on the box outside the text (the count, the padding) focuses the text, as Input does. */
  protected onRootMouseDown(event: MouseEvent): void {
    const node = this.nativeTextarea;
    if (event.defaultPrevented || node.disabled || event.target === node) return;
    event.preventDefault();
    node.focus();
  }
}
