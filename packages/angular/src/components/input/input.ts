// Input: a native single line text input in a bordered box that holds start
// and end adornments. The box is the root (`div[dsInput]`); the native input
// is the control part. The twin of
// packages/react/src/components/Input/Input.tsx.
//
//   <div dsField label="Board name"><div dsInput placeholder="Spring launch"></div></div>
//   <div dsInput start="$" end="USD" type="number" aria-label="Price" [(value)]="price"></div>
//   <div dsInput formControlName="name"></div>
//
// React spreads native props on the inner input. Angular cannot forward
// arbitrary attributes from the host to an element in the template, so the
// native props are inputs with the React names: type, placeholder, value,
// name, autoComplete, inputMode, maxLength, minLength, pattern, enterKeyHint,
// autoCapitalize, autoCorrect, spellCheck, aria-label, aria-labelledby,
// aria-describedby and id. autofocus stamps data-autofocus for the Dialog
// focus rule. Events bubble from the native input to the host, so
// `(keydown)` and `(input)` on the host work; `nativeInput` is the element.
//
// It implements ControlValueAccessor, so ngModel, formControl and
// formControlName work on the host.
//
// Motion: the box shakes when the field turns invalid (error-shake), as in
// React. As the control part of another field it leaves the shake to that
// field's box.
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
  model,
  signal,
  untracked,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { isIconName, type IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import type { ShakeBox } from '@the-system/motion';
import { errorShake } from '../../internal/motion-fields';
import { DsFieldContext, fieldControl } from '../field/field-context';
import { DsInputGroupContext } from '../input-group/input-group-context';

export type InputSize = Size;
export type InputShape = Extract<Shape, 'default' | 'pill'>;
/** The box: outlined (a border) or filled (a tint). Unset, the active style and platform choose. */
export type InputVariant = 'outlined' | 'filled';
/** Text types only. A checkbox, a date or a file is its own component. */
export type InputType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'password' | 'search';
/** An icon name, a short text such as "px" or "$", or a template. */
export type InputAdornment = IconName | (string & {}) | TemplateRef<unknown>;

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

/** The box that shakes: the root, unless it is the control part of another field, which shakes its own box. */
const ownBox: ShakeBox = (input) => {
  const root = input.parentElement;
  return root?.hasAttribute('data-part') ? null : root;
};

/** A boolean input that stays undefined when not written, so a Field or a group can fill it. */
export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

const INPUT_ATTRIBUTES = [
  'dsInput',
  'size',
  'shape',
  'variant',
  'type',
  'placeholder',
  'value',
  'id',
  'name',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'autofocus',
  'start',
  'end',
  'autoComplete',
  'inputMode',
  'maxLength',
  'minLength',
  'pattern',
  'enterKeyHint',
  'autoCapitalize',
  'autoCorrect',
  'spellCheck',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
];

@Component({
  selector: 'div[dsInput]',
  exportAs: 'dsInput',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsInput), multi: true }],
  host: {
    'data-ds': 'input',
    '[attr.data-part]': 'group ? "control" : ownPart',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-variant]': 'variant() ?? null',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `
    <ng-container *ngTemplateOutlet="adornment; context: { $implicit: start(), part: 'start' }" />
    <input
      #native
      [attr.data-autofocus]="autofocus() ? '' : null"
      [attr.placeholder]="placeholder() ?? null"
      [attr.name]="name() ?? null"
      [attr.autocomplete]="autoComplete() ?? null"
      [attr.inputmode]="inputMode() ?? null"
      [attr.maxlength]="maxLength() ?? null"
      [attr.minlength]="minLength() ?? null"
      [attr.pattern]="pattern() ?? null"
      [attr.enterkeyhint]="enterKeyHint() ?? null"
      [attr.autocapitalize]="autoCapitalize() ?? null"
      [attr.autocorrect]="autoCorrect() ?? null"
      [attr.spellcheck]="spellCheck() === undefined ? null : String(spellCheck())"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.id]="state().id ?? null"
      [attr.aria-describedby]="state().describedBy ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      [attr.value]="value() ?? null"
      (input)="onInput(native.value)"
      (blur)="onTouched()"
      [attr.type]="type()"
      data-part="control"
    />
    <ng-container *ngTemplateOutlet="adornment; context: { $implicit: end(), part: 'end' }" />
    <ng-template #adornment let-content let-part="part">
      @if (content !== undefined && content !== null && content !== '') {
        @if (isText(content)) {
          <!-- Icons and short texts are decoration: the label names the field. -->
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
export class DsInput implements ControlValueAccessor {
  /** Height from size.control. Default md. Inside an InputGroup it follows the group. */
  readonly size = input<InputSize | undefined>(undefined);
  /** default: radius.control of the style. pill: always fully round. Inside an InputGroup it follows the group. */
  readonly shape = input<InputShape | undefined>(undefined);
  /**
   * outlined: a border all round. filled: a tinted box. Stamped as
   * data-variant only when set, so a platform (Android draws filled fields)
   * can follow it. Default unset.
   */
  readonly variant = input<InputVariant | undefined>(undefined);
  /** Text types only. Default text. */
  readonly type = input<InputType>('text');
  readonly placeholder = input<string | undefined>(undefined);
  /** The value. Two way: `[(value)]`. Left out, the input starts empty and carries no value attribute. */
  readonly value = model<string | undefined>(undefined);
  /** The id of the native input. Inside a Field the label then points at it. */
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /** Marks the value invalid. Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Sets aria-required, not the native attribute, so the browser shows no bubble of its own. */
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Marks the control with data-autofocus, so a Dialog opens with focus on it. */
  readonly autofocus = input(false, { transform: booleanAttribute });
  /** Adornment at the start: an icon name, a short text or a template. */
  readonly start = input<InputAdornment | undefined>(undefined);
  /** Adornment at the end: an icon name, a short text or a template. */
  readonly end = input<InputAdornment | undefined>(undefined);
  readonly autoComplete = input<string | undefined>(undefined);
  readonly inputMode = input<string | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
  readonly minLength = input<number | undefined>(undefined);
  readonly pattern = input<string | undefined>(undefined);
  readonly enterKeyHint = input<string | undefined>(undefined);
  readonly autoCapitalize = input<string | undefined>(undefined);
  readonly autoCorrect = input<string | undefined>(undefined);
  readonly spellCheck = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  protected readonly field = inject(DsFieldContext, { optional: true });
  private readonly host = consumeHostAttributes(INPUT_ATTRIBUTES);
  /** A part name written on the host (data-part="control" inside SearchField), kept as written. */
  protected readonly ownPart = this.host.getAttribute?.('data-part') ?? null;

  /** The InputGroup this input is the control of, if any. */
  protected readonly group = inject(DsInputGroupContext, { optional: true });
  private readonly controlRef = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected readonly resolvedSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly resolvedShape = computed(() => this.shape() ?? this.group?.shape() ?? 'default');
  /** The Field wiring merged with this input's own values, as React's useFieldControl. */
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [...(this.group?.addonIds() ?? []), this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
    invalid: this.invalid() ?? this.group?.invalid(),
    disabled: this.disabled() ?? this.group?.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly() ?? this.group?.readOnly(),
    required: this.required(),
  }));

  protected readonly String = String;
  protected readonly isIcon = (content: unknown): content is IconName => typeof content === 'string' && isIconName(content);
  protected readonly isText = (content: unknown): content is string => typeof content === 'string';

  constructor() {
    // error-shake: the box shakes once when the field turns invalid, or when the browser refuses a submit.
    errorShake(() => this.controlRef().nativeElement, () => Boolean(this.state().invalid), ownBox);
    // The native value is written only when it differs, as React does: a half typed number ("1e", "-")
    // reads as "" in the browser and must not be wiped by writing "" back.
    afterRenderEffect(() => {
      const next = this.value() ?? '';
      const el = this.nativeInput;
      if (el.value !== next) el.value = next;
    });
    // A control with its own id tells the Field, so the label points at it.
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

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.controlRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
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

  protected onRootMouseDown(event: MouseEvent): void {
    const el = this.nativeInput;
    if (event.defaultPrevented || el.disabled) return;
    const target = event.target as Element;
    if (target === el) return;
    // Only an interactive element inside the box keeps the press. An
    // ancestor with a tabindex (a dialog's content) does not count.
    const root = event.currentTarget as Element;
    const match = target.closest(INTERACTIVE);
    if (match && match !== root && root.contains(match)) return;
    // Keep focus where it lands: on the input, not on the box.
    event.preventDefault();
    el.focus();
  }
}
