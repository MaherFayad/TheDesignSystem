// NumberField: a number in a bordered box, with a decrement and an increment
// IconButton at the two ends, locale formatting, units and bounds. The twin
// of packages/react/src/components/NumberField/NumberField.tsx.
//
//   <div dsNumberField aria-label="Guests" [min]="1" [max]="8" [(value)]="guests"></div>
//   <div dsField label="Seats"><div dsNumberField [min]="1" [max]="50" formControlName="seats"></div></div>
//
// React builds on React Aria. Angular has no number field in the CDK or in
// Angular Aria, so the behavior is hand built here on packages/shared
// (number.ts), with the same rules as React Aria and the React additions:
// - Typing keeps only text that can still become a number. Arabic Indic
//   digits and the Arabic marks become Western ones as they are typed or
//   pasted, so the value never jumps on blur.
// - ArrowUp and ArrowDown step, PageUp and PageDown move ten steps, Home and
//   End go to min and max. Enter and blur commit: the typed text is parsed,
//   kept within the bounds, snapped to the step and formatted.
// - The steppers step on press and repeat while held. They never take
//   focus; a mouse press moves focus to the input.
// - The mouse wheel never changes the value (the manifest's rule).
// - A committed value that changes the text is announced (CDK LiveAnnouncer).
//
// It implements ControlValueAccessor, so ngModel, formControl and
// formControlName work on the host. With `name`, a hidden input after the
// root carries the number for a native form, as in React.
//
// Motion (orders 1.21 and 1.22), as in React: a step from a button or a key
// rolls the value digit by digit (field-step) in a decorative layer over the
// input, an unnamed aria-hidden span after it, empty at rest (digitLayer in
// internal/motion-fields.ts). Typing never rolls and empties the layer at
// once. The box shakes when the value turns invalid (error-shake).
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
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
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { isIconName, type IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import {
  ARABIC_COMMA,
  ARABIC_DECIMAL_MARK,
  ARABIC_GROUP_MARK,
  clamp,
  decimalPlaces,
  formatNumber,
  latinLocale,
  numberSeparators,
  parseNumber,
  roundTo,
  snapToStep,
  toLatinDigits,
  type Shape,
  type Size,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { digitLayer, errorShake } from '../../internal/motion-fields';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsThemeService } from '../../theme/theme';
import { DsFieldContext, fieldControl } from '../field/field-context';
import { DsIconButton } from '../icon-button/icon-button';

export type NumberFieldSize = Size;
export type NumberFieldShape = Extract<Shape, 'default' | 'pill'>;
/** An icon name, a short text such as "kg" or "SAR", or a template. */
export type NumberFieldAdornment = IconName | (string & {}) | TemplateRef<unknown>;

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
/** Arabic marks a person may type, mapped to the field locale as they are typed. */
const ARABIC_MARKS = new RegExp(`[${ARABIC_DECIMAL_MARK}${ARABIC_GROUP_MARK}${ARABIC_COMMA}]`, 'g');
/** Bidi controls and marks a formatted or copied number may carry. */
const BIDI_MARKS = /[؜‎‏‪-‮⁦-⁩]/g;
/** Parts of a formatted number that are the number itself; every other part is a symbol around it. */
const NUMBER_PARTS = new Set(['integer', 'group', 'decimal', 'fraction', 'minusSign', 'plusSign', 'nan', 'infinity']);
/** Press and hold on a stepper: the first repeat, then every next one, in ms (React Aria's timing). */
const REPEAT_FIRST = 400;
const REPEAT_TOUCH_FIRST = 600;
const REPEAT_NEXT = 60;

/** React Aria's words for the steppers and the role description, in English and Arabic. */
const COPY = {
  en: { increase: 'Increase', decrease: 'Decrease', role: 'Number field' },
  ar: { increase: 'زيادة', decrease: 'خفض', role: 'حقل رقمي' },
} as const;

/** Turns Arabic Indic digits and the Arabic marks into Western digits and the marks of the locale, one for one. */
function westernize(text: string, locale: string): string {
  const { decimal, group } = numberSeparators(locale);
  return toLatinDigits(text).replace(ARABIC_MARKS, (mark) => (mark === ARABIC_DECIMAL_MARK ? decimal : group));
}

/** Adds or takes away a step without binary dust: 0.1 + 0.2 is 0.3. */
function addStep(value: number, amount: number): number {
  return roundTo(value + amount, Math.max(decimalPlaces(value), decimalPlaces(amount)));
}

function isAppleTouch(): boolean {
  return typeof navigator !== 'undefined' && /iPhone/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return typeof navigator !== 'undefined' && (/iPhone|iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
}

let nextId = 0;

const NUMBER_FIELD_ATTRIBUTES = [
  'dsNumberField',
  'value',
  'min',
  'max',
  'step',
  'formatOptions',
  'locale',
  'size',
  'shape',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'steppers',
  'incrementLabel',
  'decrementLabel',
  'start',
  'end',
  'id',
  'name',
  'form',
  'placeholder',
  'autofocus',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

type StepperSlot = 'increment' | 'decrement';

@Component({
  selector: 'div[dsNumberField]',
  exportAs: 'dsNumberField',
  imports: [DsIcon, DsIconButton, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsNumberField), multi: true }],
  host: {
    'data-ds': 'number-field',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `
    @if (showSteppers()) {
      <ng-container *ngTemplateOutlet="stepper; context: { $implicit: 'decrement' }" />
    }
    <ng-container *ngTemplateOutlet="adornment; context: { $implicit: start(), part: 'start' }" />
    <input
      #native
      type="text"
      data-part="control"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      [attr.inputmode]="inputMode()"
      [attr.aria-roledescription]="roleDescription()"
      [attr.id]="inputId()"
      [attr.tabindex]="state().disabled ? null : '0'"
      [attr.placeholder]="placeholder() ?? null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="labelledBy() ?? null"
      [attr.aria-describedby]="state().describedBy ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [attr.aria-disabled]="state().disabled ? 'true' : null"
      [attr.aria-readonly]="state().readOnly ? 'true' : null"
      [attr.data-autofocus]="autofocus() ? '' : null"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      [attr.value]="text()"
      (beforeinput)="onBeforeInput($event)"
      (input)="onInput()"
      (paste)="onPaste($event)"
      (keydown)="onKeyDown($event)"
      (blur)="onBlur()"
    />
    <!-- The digit roll layer (field-step): decorative, empty at rest. -->
    <span aria-hidden="true" #layer></span>
    <ng-container *ngTemplateOutlet="adornment; context: { $implicit: end(), part: 'end' }" />
    @if (showSteppers()) {
      <ng-container *ngTemplateOutlet="stepper; context: { $implicit: 'increment' }" />
    }
    <ng-template #stepper let-slot>
      <button
        dsIconButton
        tabindex="-1"
        [attr.data-part]="slot"
        [icon]="slot === 'increment' ? 'plus' : 'minus'"
        [label]="stepperLabel(slot)"
        [size]="size() === 'lg' ? 'md' : 'xs'"
        [shape]="shape() === 'pill' ? 'pill' : 'default'"
        [disabled]="slot === 'increment' ? !canIncrement() : !canDecrement()"
        [attr.id]="slot === 'increment' ? incrementId : decrementId"
        [attr.aria-controls]="inputId()"
        [attr.aria-labelledby]="stepperLabelledBy(slot)"
        (pointerdown)="onStepperDown($event, slot)"
        (pointerup)="onStepperUp($event, slot)"
        (pointercancel)="stopRepeat()"
        (pointerleave)="stopRepeat()"
        (contextmenu)="$event.preventDefault()"
        (click)="onStepperClick($event, slot)"
      ></button>
    </ng-template>
    <ng-template #adornment let-content let-part="part">
      @if (content !== undefined && content !== null && content !== '') {
        @if (isText(content)) {
          <!-- Icons and units are decoration: the label names the field and the format carries the unit. -->
          <span [attr.data-part]="part" aria-hidden="true">
            @if (isIcon(content)) {
              <svg dsIcon [name]="content"></svg>
            } @else {
              {{ content }}
            }
          </span>
        } @else {
          <span [attr.data-part]="part"><ng-container [ngTemplateOutlet]="content" /></span>
        }
      }
    </ng-template>
  `,
})
export class DsNumberField implements ControlValueAccessor {
  /** The value. `null` is an empty field. Two way: `[(value)]`; valueChange fires with each committed change. */
  readonly value = model<number | null | undefined>(undefined);
  /** The lowest value. Home goes to it. */
  readonly min = input<number | undefined>(undefined);
  /** The highest value. End goes to it. */
  readonly max = input<number | undefined>(undefined);
  /** One step of the arrow keys and the step buttons. PageUp and PageDown move ten steps. Default 1. */
  readonly step = input<number | undefined>(undefined);
  /** Intl number format options: decimals, a percent, a currency or a unit. Digits stay Western. */
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** The locale of the format. Default the language of the nearest dsTheme. */
  readonly locale = input<string | undefined>(undefined);
  /** Height from size.control. Default md. */
  readonly size = input<NumberFieldSize>('md');
  /** default takes radius.control from the style. pill is always fully round. */
  readonly shape = input<NumberFieldShape>('default');
  /** Marks the value invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Sets aria-required, never the native attribute. */
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Shows the step buttons. They hide while read only. Default true. */
  readonly steppers = input(true, { transform: booleanAttribute });
  /** The accessible name of the increment button. Default "Increase" and the field name, in the locale. */
  readonly incrementLabel = input<string | undefined>(undefined);
  /** The accessible name of the decrement button. Default "Decrease" and the field name, in the locale. */
  readonly decrementLabel = input<string | undefined>(undefined);
  /** Adornment at the start: an icon name, a short text or a template. */
  readonly start = input<NumberFieldAdornment | undefined>(undefined);
  /** Adornment at the end, such as a unit: an icon name, a short text or a template. */
  readonly end = input<NumberFieldAdornment | undefined>(undefined);
  /** The id of the native input. Inside a Field the label then points at it. */
  readonly id = input<string | undefined>(undefined);
  /** The name of the hidden input that carries the number in a native form. */
  readonly name = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  /** Marks the control with data-autofocus, so a Dialog opens with focus on it. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly host = consumeHostAttributes(NUMBER_FIELD_ATTRIBUTES);
  private readonly controlRef = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly layerRef = viewChild.required<ElementRef<HTMLSpanElement>>('layer');
  private readonly motion = injectMotion();
  private readonly digits = digitLayer(
    () => this.layerRef().nativeElement,
    () => this.nativeInput,
  );
  private readonly formDisabled = signal(false);
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private repeatTimer: ReturnType<typeof setTimeout> | undefined;
  /** A touch press steps on release when it did not repeat, as React Aria does. */
  private touchPress = false;
  private hidden: HTMLInputElement | null = null;

  private readonly base = `ds-number-field-${++nextId}-`;
  protected readonly incrementId = `${this.base}increment`;
  protected readonly decrementId = `${this.base}decrement`;

  /** The Field wiring merged with this field's own values, as React's useFieldControl. */
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: this.ariaDescribedby(),
    invalid: this.invalid(),
    disabled: this.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly(),
    required: this.required(),
  }));

  /** The format locale with Western digits: ar becomes ar-u-nu-latn. */
  protected readonly tag = computed(() => latinLocale(this.locale() ?? this.theme.value().lang));
  private readonly copy = computed(() => (this.tag().toLowerCase().startsWith('ar') ? COPY.ar : COPY.en));
  /** React Aria leaves the role description out on iOS, so VoiceOver reads the required state. */
  protected readonly roleDescription = computed(() => (isIOS() ? null : this.copy().role));
  protected readonly inputId = computed(() => this.state().id ?? `${this.base}control`);
  protected readonly labelledBy = computed(() => this.ariaLabelledby() ?? (this.ariaLabel() === undefined ? this.field?.labelId : undefined));
  protected readonly showSteppers = computed(() => this.steppers() && !this.state().readOnly);

  private readonly resolved = computed(() => new Intl.NumberFormat(this.tag(), this.formatOptions() ?? {}).resolvedOptions());
  private readonly isPercent = computed(() => this.resolved().style === 'percent');
  /** The step of the keys and the buttons: 0.01 for a percent with no step, else 1. */
  private readonly clampStep = computed(() => this.step() ?? (this.isPercent() ? 0.01 : 1));
  /** The symbols around the number in this format (a currency, a percent sign, a unit, spaces), longest first. */
  private readonly literals = computed(() => {
    const format = new Intl.NumberFormat(this.tag(), this.formatOptions() ?? {});
    const found = new Set<string>();
    for (const sample of [-12345.6, 1, 0]) {
      for (const part of format.formatToParts(sample)) if (!NUMBER_PARTS.has(part.type) && part.value.trim() !== '') found.add(part.value.trim());
    }
    return [...found].sort((a, b) => b.length - a.length);
  });

  /** The text in the input. Follows the value; typing writes it until the next commit. */
  protected readonly text = linkedSignal(() => this.format(this.snapped(this.value())));
  /** The number the text reads as, NaN when it reads as none: what the keys and the buttons step from. */
  private readonly parsed = computed(() => this.parse(this.text()));

  protected readonly inputMode = computed(() => {
    // React Aria's choice: numeric, and on phones the keyboard that has the keys this field takes.
    const min = this.min();
    const hasNegative = min === undefined || Number.isNaN(min) || min < 0;
    const hasDecimals = (this.resolved().maximumFractionDigits ?? 0) > 0;
    if (isAppleTouch()) return hasNegative ? 'text' : hasDecimals ? 'decimal' : 'numeric';
    if (isAndroid()) return hasNegative ? 'numeric' : hasDecimals ? 'decimal' : 'numeric';
    return 'numeric';
  });

  protected readonly canIncrement = computed(() => {
    const { disabled, readOnly } = this.state();
    if (disabled || readOnly) return false;
    const value = this.parsed();
    const max = this.max();
    const step = this.clampStep();
    return (
      Number.isNaN(value) ||
      max === undefined ||
      Number.isNaN(max) ||
      snapToStep(value, step, this.min(), max) > value ||
      addStep(value, step) <= max
    );
  });

  protected readonly canDecrement = computed(() => {
    const { disabled, readOnly } = this.state();
    if (disabled || readOnly) return false;
    const value = this.parsed();
    const min = this.min();
    const step = this.clampStep();
    return (
      Number.isNaN(value) ||
      min === undefined ||
      Number.isNaN(min) ||
      snapToStep(value, step, min, this.max()) < value ||
      addStep(value, -step) >= min
    );
  });

  protected readonly isIcon = (content: unknown): content is IconName => typeof content === 'string' && isIconName(content);
  protected readonly isText = (content: unknown): content is string => typeof content === 'string';

  constructor() {
    errorShake(() => this.nativeInput, () => Boolean(this.state().invalid));
    // The native value is written only when it differs, so the caret stays where it is while typing.
    afterRenderEffect(() => {
      const next = this.text();
      const el = this.nativeInput;
      if (el.value !== next) el.value = next;
    });
    // With a name, a hidden input after the root carries the number, as React Aria renders it.
    afterRenderEffect(() => {
      const name = this.name();
      const value = this.value();
      const form = this.form();
      const disabled = this.state().disabled;
      untracked(() => this.syncHidden(name, value, form, disabled));
    });
    // A control with its own id tells the Field, so the label points at it.
    if (this.field) {
      const field = this.field;
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
    }
    inject(DestroyRef).onDestroy(() => {
      this.stopRepeat();
      this.hidden?.remove();
      if (this.field && untracked(this.id) !== undefined) this.field.setControlId(undefined);
    });
  }

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.controlRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  // Formatting and parsing.

  private format(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    return formatNumber(value, this.tag(), this.formatOptions() ?? {});
  }

  /** Reads typed or formatted text: the number without the symbols of the format, a percent as a fraction. */
  private parse(text: string): number {
    const tag = this.tag();
    let rest = westernize(text, tag);
    for (const literal of this.literals()) rest = rest.replaceAll(literal, '');
    const value = parseNumber(rest.replace(/\s+/g, ''), tag);
    if (Number.isNaN(value) || !this.isPercent()) return value;
    return roundTo(value / 100, decimalPlaces(value) + 2);
  }

  /** Whether typed text can still become a number of this field, as React Aria's isValidPartialNumber. */
  private isPartial(text: string): boolean {
    const { decimal, group } = numberSeparators(this.tag());
    let rest = text.replace(BIDI_MARKS, '');
    for (const literal of this.literals()) rest = rest.replaceAll(literal, '');
    rest = rest.replace(/\s+/g, '');
    const min = this.min() ?? -Infinity;
    const max = this.max() ?? Infinity;
    if (/^[-−]/.test(rest) && min < 0) rest = rest.slice(1);
    else if (rest.startsWith('+') && max > 0) rest = rest.slice(1);
    if (rest.includes(decimal) && this.resolved().maximumFractionDigits === 0) return false;
    if (!/\s/.test(group)) rest = rest.replaceAll(group, '');
    rest = rest.replace(/\d/g, '').replace(decimal, '');
    return rest.length === 0;
  }

  /** A value kept within the bounds and, with a step, snapped to it. */
  private snapped(value: number | null | undefined): number | null | undefined {
    if (value === null || value === undefined || Number.isNaN(value)) return value;
    const step = this.step();
    return step === undefined || Number.isNaN(step) ? clamp(value, this.min(), this.max()) : snapToStep(value, step, this.min(), this.max());
  }

  // Committing.

  /** Sets a committed value and shows it formatted. Fires valueChange only when it changes. */
  private setValue(next: number | null): void {
    const current = this.value() ?? null;
    this.show(this.format(next));
    if (Object.is(current, next)) return;
    this.value.set(next);
    this.onChange(next);
  }

  /** Shows a text now, as React does on a commit, so code that reads the input after the event sees it. */
  private show(text: string): void {
    this.text.set(text);
    const el = this.nativeInput;
    if (el.value !== text) el.value = text;
  }

  /** Commits the typed text (or a pasted one): empty, back to the last value, or the parsed value in bounds. */
  private commit(override?: string): void {
    const text = override ?? this.text();
    if (text.trim() === '') {
      this.setValue(null);
      return;
    }
    const parsed = this.parse(text);
    if (Number.isNaN(parsed)) {
      this.show(this.format(this.value()));
      return;
    }
    const next = this.parse(this.format(this.snapped(parsed)));
    this.setValue(Number.isNaN(next) ? null : next);
  }

  /** Commits and announces the new text when it changed, as React Aria does on blur. */
  private commitAndAnnounce(): void {
    const before = this.nativeInput.value;
    this.commit();
    const after = this.text();
    if (after !== before && after !== '') void this.announcer.announce(after, 'assertive');
  }

  /**
   * Sets a stepped value and announces it while the input has focus. A step
   * from a key or a stepper (`direction`) rolls the new text in digit by digit
   * from the text drawn before it (field-step); a held run rolls on from the
   * digits as drawn.
   */
  private stepTo(next: number, direction?: 'up' | 'down'): void {
    const before = this.value() ?? null;
    const from = this.nativeInput.value;
    this.setValue(next);
    const after = this.value() ?? null;
    if (direction && !Object.is(before, after)) {
      this.digits.roll(this.nativeInput, from, this.nativeInput.value, { mode: this.motion.mode('field-step'), direction });
    }
    if (this.isFocused()) void this.announcer.announce(this.text().replace('-', '−'), 'assertive');
  }

  private isFocused(): boolean {
    const el = this.nativeInput;
    return el.ownerDocument.activeElement === el;
  }

  /** The value one step up or down, from the typed text; from empty, the bound (or 0), as React Aria does. */
  private nextStep(direction: 1 | -1): number {
    const min = this.min();
    const max = this.max();
    const step = this.clampStep();
    const prev = this.parsed();
    if (Number.isNaN(prev)) {
      const from = direction > 0 ? min : max;
      return snapToStep(from === undefined || Number.isNaN(from) ? 0 : from, step, min, max);
    }
    const snapped = snapToStep(prev, step, min, max);
    if ((direction > 0 && snapped > prev) || (direction < 0 && snapped < prev)) return snapped;
    return snapToStep(addStep(prev, direction * step), step, min, max);
  }

  protected increment(): void {
    if (this.canIncrement()) this.stepTo(this.nextStep(1), 'up');
  }

  protected decrement(): void {
    if (this.canDecrement()) this.stepTo(this.nextStep(-1), 'down');
  }

  // Events of the input.

  /**
   * Refuses a key before the browser edits the text, as React Aria does, so the
   * selection stays as it was: select all of "320" and type "-5" gives "5".
   */
  protected onBeforeInput(event: InputEvent): void {
    const el = this.nativeInput;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    let next: string;
    switch (event.inputType) {
      case 'deleteContentBackward':
        next = start === end ? value.slice(0, Math.max(0, start - 1)) + value.slice(end) : value.slice(0, start) + value.slice(end);
        break;
      case 'deleteContentForward':
        next = start === end ? value.slice(0, start) + value.slice(end + 1) : value.slice(0, start) + value.slice(end);
        break;
      default:
        if (!event.inputType.startsWith('insert') || event.data === null) return;
        next = value.slice(0, start) + event.data + value.slice(end);
    }
    if (!this.isPartial(westernize(next, this.tag()))) event.preventDefault();
  }

  protected onInput(): void {
    const el = this.nativeInput;
    const raw = el.value;
    const latin = westernize(raw, this.tag());
    if (!this.isPartial(latin)) {
      // Refused: put back the last text and the caret before the refused keys.
      const caret = Math.max(0, (el.selectionStart ?? raw.length) - (raw.length - this.text().length));
      el.value = this.text();
      el.setSelectionRange(caret, caret);
      return;
    }
    if (latin !== raw) {
      // One for one, so the caret stays where it was.
      const caret = el.selectionStart;
      el.value = latin;
      if (caret !== null) el.setSelectionRange(caret, caret);
    }
    this.text.set(latin);
  }

  protected onPaste(event: ClipboardEvent): void {
    const el = this.nativeInput;
    // A paste over the whole text commits at once, so the formatted value shows. A partial paste goes through input.
    if ((el.selectionEnd ?? -1) - (el.selectionStart ?? 0) !== el.value.length) return;
    event.preventDefault();
    this.commit(westernize(event.clipboardData?.getData('text/plain')?.trim() ?? '', this.tag()));
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const { disabled, readOnly } = this.state();
    if (disabled || readOnly || event.defaultPrevented) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.increment();
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.decrement();
        return;
      case 'PageUp':
      case 'PageDown':
        event.preventDefault();
        this.page(event.key === 'PageUp');
        return;
      case 'Home': {
        const min = this.min();
        if (min === undefined) return;
        event.preventDefault();
        this.stepTo(min);
        return;
      }
      case 'End': {
        const max = this.max();
        if (max === undefined) return;
        event.preventDefault();
        this.stepTo(snapToStep(max, this.clampStep(), this.min(), max));
        return;
      }
      case 'Enter':
        this.commitAndAnnounce();
        return;
      default:
    }
  }

  /** PageUp and PageDown: ten steps from the typed text; from empty, the bound, as React does. */
  private page(up: boolean): void {
    const min = this.min();
    const max = this.max();
    const step = this.clampStep();
    const from = this.parsed();
    const next = Number.isNaN(from)
      ? snapToStep((up ? min : max) ?? 0, step, min, max)
      : snapToStep(clamp(from + (up ? 10 : -10) * step, min, max), step, min, max);
    this.stepTo(next, up ? 'up' : 'down');
  }

  protected onBlur(): void {
    this.commitAndAnnounce();
    this.onTouched();
  }

  // The steppers.

  protected stepperLabel(slot: StepperSlot): string {
    const own = slot === 'increment' ? this.incrementLabel() : this.decrementLabel();
    if (own) return own;
    const word = slot === 'increment' ? this.copy().increase : this.copy().decrease;
    return `${word} ${this.ariaLabel() ?? ''}`.trim();
  }

  /** With a visible label and no name of its own, a button reads its own word and then the label: "Increase Guests". */
  protected stepperLabelledBy(slot: StepperSlot): string | null {
    const own = slot === 'increment' ? this.incrementLabel() : this.decrementLabel();
    const labelledBy = this.labelledBy();
    if (own || this.ariaLabel() || !labelledBy) return null;
    return `${slot === 'increment' ? this.incrementId : this.decrementId} ${labelledBy}`;
  }

  private stepBy(slot: StepperSlot): boolean {
    if (slot === 'increment' ? !this.canIncrement() : !this.canDecrement()) return false;
    if (slot === 'increment') this.increment();
    else this.decrement();
    return true;
  }

  private repeat(slot: StepperSlot, delay: number): void {
    this.stopRepeat();
    this.repeatTimer = setTimeout(() => {
      this.touchPress = false;
      if (this.stepBy(slot)) this.repeat(slot, REPEAT_NEXT);
    }, delay);
  }

  stopRepeat(): void {
    if (this.repeatTimer !== undefined) clearTimeout(this.repeatTimer);
    this.repeatTimer = undefined;
  }

  protected onStepperDown(event: PointerEvent, slot: StepperSlot): void {
    if (event.button !== 0) return;
    // The steppers never take focus. A mouse press moves focus to the input.
    event.preventDefault();
    if (this.state().disabled) return;
    const touch = event.pointerType === 'touch';
    if (!touch && !this.isFocused()) this.nativeInput.focus();
    if (touch) {
      this.touchPress = true;
      this.repeat(slot, REPEAT_TOUCH_FIRST);
      return;
    }
    this.stepBy(slot);
    this.repeat(slot, REPEAT_FIRST);
  }

  protected onStepperUp(event: PointerEvent, slot: StepperSlot): void {
    this.stopRepeat();
    if (event.pointerType === 'touch' && this.touchPress) this.stepBy(slot);
    this.touchPress = false;
  }

  /** A click with no pointer press (a screen reader or a script) steps once. */
  protected onStepperClick(event: MouseEvent, slot: StepperSlot): void {
    if (event.detail === 0) this.stepBy(slot);
  }

  // The root.

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

  private syncHidden(name: string | undefined, value: number | null | undefined, form: string | undefined, disabled: boolean): void {
    if (!name) {
      this.hidden?.remove();
      this.hidden = null;
      return;
    }
    const doc = this.host.ownerDocument;
    if (!this.hidden) {
      this.hidden = doc.createElement('input');
      this.hidden.type = 'hidden';
    }
    if (this.hidden.previousSibling !== this.host && this.host.parentNode) this.host.after(this.hidden);
    this.hidden.name = name;
    this.hidden.value = value === null || value === undefined || Number.isNaN(value) ? '' : String(value);
    this.hidden.setAttribute('value', this.hidden.value);
    if (form) this.hidden.setAttribute('form', form);
    else this.hidden.removeAttribute('form');
    this.hidden.disabled = disabled;
  }

  // ControlValueAccessor.

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' ? value : null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
