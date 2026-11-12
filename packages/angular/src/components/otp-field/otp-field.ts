// OTPField: a one time code shown in separate cells. The twin of
// packages/react/src/components/OTPField/OTPField.tsx.
//
//   <div dsField label="Verification code"><div dsOTPField [groups]="[3, 3]" [(value)]="code" (complete)="verify($event)"></div></div>
//
// One real input holds the whole code and sits on top of the cells with a
// transparent text and caret; the cells are a drawing of its value
// (aria-hidden). One input, not one per cell: SMS autofill
// (autocomplete="one-time-code") and password managers fill one field, a
// paste lands in one field, a screen reader meets one named field, and a
// Field label points at it like any other control.
//
// The field keeps one character selected, so typing replaces the active cell
// and moves on. Backspace clears and moves back. ArrowLeft and ArrowRight
// move one cell, Home and End to the ends. A paste replaces the whole code.
// Spaces, dashes and Arabic Indic digits are read (parseCode). A code runs
// left to right in every language, so the root carries dir="ltr".
//
// React's value, defaultValue and onValueChange are the value model;
// onComplete is the complete output. Native props of the input are inputs
// with the React names. It implements ControlValueAccessor.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { codeInputHints, codeSeparatorIndexes, parseCode, type CodeCharset, type Shape, type Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsFieldContext, fieldControl } from '../field/field-context';

export type OTPFieldSize = Size;
export type OTPFieldShape = Extract<Shape, 'default' | 'pill'>;
export type OTPFieldCharset = CodeCharset;

interface Selection {
  start: number;
  end: number;
}

/** One character selected, so the next key replaces it, or a caret after the last character while the code is not full. */
function cellSelection(pos: number, valueLength: number, length: number): Selection {
  const at = Math.max(0, Math.min(pos, valueLength, length - 1));
  if (at < valueLength) return { start: at, end: at + 1 };
  return { start: at, end: at };
}

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

const ATTRIBUTES = [
  'dsOTPField',
  'length',
  'groups',
  'charset',
  'value',
  'size',
  'shape',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'id',
  'name',
  'autoComplete',
  'inputMode',
  'enterKeyHint',
  'form',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-busy',
];

@Component({
  selector: 'div[dsOTPField]',
  exportAs: 'dsOTPField',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsOTPField), multi: true }],
  host: {
    dir: 'ltr',
    'data-ds': 'otp-field',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
    '[attr.data-complete]': 'code().length === cellCount() ? "" : null',
  },
  template: `
    <input
      #native
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.aria-busy]="ariaBusy() ?? null"
      [attr.name]="name() ?? null"
      [attr.form]="form() ?? null"
      [attr.id]="state().id ?? null"
      [attr.aria-describedby]="state().describedBy ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      type="text"
      data-part="control"
      [value]="code()"
      [attr.value]="code()"
      [attr.autocomplete]="autoComplete()"
      [attr.inputmode]="inputMode() ?? hints().inputMode"
      [attr.pattern]="hints().pattern"
      [attr.autocapitalize]="charset() === 'alphanumeric' ? 'characters' : 'off'"
      autocorrect="off"
      spellcheck="false"
      [attr.enterkeyhint]="enterKeyHint()"
      (input)="onInput($event)"
      (keydown)="onKeyDown($event)"
      (select)="onSelect($event)"
      (keyup)="onSelect($event)"
      (mouseup)="onSelect($event)"
      (focus)="onFocus()"
      (blur)="onBlur()"
      (paste)="onPaste($event)"
      (click)="onClick($event)"
    />
    @for (i of cells(); track i) {
      @if (separators().includes(i)) {
        <span data-part="separator" aria-hidden="true"></span>
      }
      <span
        data-part="cell"
        aria-hidden="true"
        [attr.data-active]="focused() && i >= sel().start && i < activeEnd() ? '' : null"
        [attr.data-filled]="i < code().length ? '' : null"
      >@if (code()[i]; as ch) {<span>{{ ch }}</span>}</span>
    }
  `,
})
export class DsOTPField implements ControlValueAccessor {
  /** Number of cells. Default 6. */
  readonly length = input(6);
  /** Group sizes, for a separator between groups: [3, 3] shows 123 456. Ignored when they do not add up to length. */
  readonly groups = input<number[] | undefined>(undefined);
  /** numeric: digits and the number keypad. alphanumeric: letters and digits, upper cased. Default numeric. */
  readonly charset = input<OTPFieldCharset>('numeric');
  /** The code. Two way: `[(value)]`. */
  readonly value = model<string>('');
  /** Cell height from size.control. Default md. */
  readonly size = input<OTPFieldSize>('md');
  /** default: radius.field from the style. pill: fully round cells. */
  readonly shape = input<OTPFieldShape>('default');
  /** Marks the code invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /** Default one-time-code, so SMS autofill offers the code. */
  readonly autoComplete = input('one-time-code');
  readonly inputMode = input<string | undefined>(undefined);
  readonly enterKeyHint = input('done');
  readonly form = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  readonly ariaBusy = input<string | undefined>(undefined, { alias: 'aria-busy' });

  /** Once each time the code becomes complete, with the full code. */
  readonly complete = output<string>();

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly _consumed = consumeHostAttributes(ATTRIBUTES);
  private readonly nativeRef = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected readonly cellCount = computed(() => Math.max(1, Math.floor(this.length())));
  private readonly options = computed(() => ({ length: this.cellCount(), charset: this.charset() }));
  /** The parsed code: what the cells and the input show. */
  protected readonly code = computed(() => parseCode(this.value() ?? '', this.options()).value);
  protected readonly cells = computed(() => Array.from({ length: this.cellCount() }, (_, i) => i));
  protected readonly separators = computed(() => codeSeparatorIndexes(this.cellCount(), this.groups()));
  protected readonly hints = computed(() => codeInputHints(this.charset()));
  protected readonly focused = signal(false);
  protected readonly sel = signal<Selection>({ start: 0, end: 0 });
  protected readonly activeEnd = computed(() => Math.max(this.sel().end, this.sel().start + 1));
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: this.ariaDescribedby(),
    invalid: this.invalid(),
    disabled: this.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly(),
    required: this.required(),
  }));

  private lastSel: Selection = { start: 0, end: 0 };
  private pending: number | null = null;

  constructor() {
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

  /** The native input that holds the code. */
  get nativeInput(): HTMLInputElement {
    return this.nativeRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  /** Puts the selection on the cell at pos and draws it. */
  private place(pos: number, valueLength: number): void {
    const el = this.nativeInput;
    const next = cellSelection(pos, valueLength, this.cellCount());
    this.lastSel = next;
    this.sel.set(next);
    if (el.ownerDocument.activeElement !== el) return;
    if (el.selectionStart !== next.start || el.selectionEnd !== next.end) el.setSelectionRange(next.start, next.end);
  }

  private commit(next: string, caret: number): void {
    // A caret asked for by the key that caused the change (Backspace) wins.
    const pos = this.pending ?? caret;
    this.pending = null;
    const current = this.code();
    if (next !== current) {
      this.value.set(next);
      this.onChange(next);
      // A full code that is new: typed to the end, pasted, filled, or one character of a full code fixed.
      if (next.length === this.cellCount()) this.complete.emit(next);
    }
    // The input shows the parsed code at once, also when a key was refused and the value stayed the same.
    const el = this.nativeInput;
    if (el.value !== this.code()) el.value = this.code();
    this.place(pos, this.code().length);
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = el.value;
    const parsed = parseCode(raw, this.options());
    const current = this.code();
    // One key the code cannot hold is refused: the cell keeps its character and stays active.
    if (parsed.rejected && raw.length <= current.length + 1) {
      this.pending = null;
      this.commit(current, this.lastSel.start);
      return;
    }
    // The native caret sits after what was typed, pasted or filled.
    const caret = Math.min(el.selectionStart ?? parsed.value.length, parsed.value.length);
    this.commit(parsed.value, caret);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    // Shift with an arrow keeps its native meaning: it extends the selection.
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const at = this.lastSel.start;
    const length = this.code().length;
    // The cells always run left to right, so ArrowLeft is the previous cell in every language.
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.place(at - 1, length);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.place(at + 1, length);
        return;
      case 'Home':
        event.preventDefault();
        this.place(0, length);
        return;
      case 'End':
        event.preventDefault();
        this.place(length, length);
        return;
      case 'Backspace': {
        if (this.state().readOnly) return;
        const { start, end } = this.lastSel;
        // A selected character is cleared and the cell before it becomes active.
        if (end > start && start > 0) this.pending = start - 1;
        // The native delete runs and fires the input event, so forms hear it.
        return;
      }
      default:
    }
  }

  protected onSelect(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (this.pending !== null) return;
    if (el.ownerDocument.activeElement !== el) return;
    const length = this.code().length;
    const start = el.selectionStart ?? length;
    const end = el.selectionEnd ?? start;
    // A selection the person drags over several cells stays as it is.
    if (end - start > 1) {
      this.lastSel = { start, end };
      this.sel.set({ start, end });
      return;
    }
    if (start === this.lastSel.start && end === this.lastSel.end) return;
    this.place(start, length);
  }

  protected onFocus(): void {
    this.focused.set(true);
    // Tab lands on the first empty cell, or the last cell of a full code.
    const length = this.code().length;
    this.place(length, length);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  protected onPaste(event: ClipboardEvent): void {
    if (event.defaultPrevented) return;
    // A paste replaces the whole code: select all, then let the native paste run.
    const el = event.target as HTMLInputElement;
    el.setSelectionRange(0, el.value.length);
  }

  /** A click picks the cell under the pointer: the text is transparent, so the native caret means nothing. */
  protected onClick(event: MouseEvent): void {
    const root = (event.currentTarget as HTMLElement).parentElement;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-part="cell"]'));
    let index = cells.findIndex((cell) => {
      const r = cell.getBoundingClientRect();
      return r.width > 0 && event.clientX <= r.right;
    });
    if (index < 0) index = cells.length - 1;
    this.place(index, this.code().length);
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
}
