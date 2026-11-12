// Input: a native single line text input in a bordered box. The box is the
// root (`div[dsInput]`), the native input is the `control` part. The twin of
// packages/react/src/components/Input/Input.tsx, ported to the minimum the
// Dialog demo needs.
//
// React spreads native props on the inner input. Angular cannot forward
// arbitrary attributes from the host to an element in the template, so the
// native props the demos use are inputs here: type, placeholder, value,
// autofocus (stamps data-autofocus for the Dialog focus rule).
//
//   <div dsField label="Board name"><div dsInput placeholder="Spring launch"></div></div>
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import type { Shape, Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsField } from '../field/field';

export type InputSize = Size;
export type InputShape = Extract<Shape, 'default' | 'pill'>;
export type InputType = 'text' | 'email' | 'url' | 'tel' | 'number' | 'password' | 'search';

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';

@Component({
  selector: 'div[dsInput]',
  exportAs: 'dsInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'input',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '(mousedown)': 'onRootMouseDown($event)',
  },
  template: `<input #control
    [attr.data-autofocus]="autofocus() ? '' : null"
    [attr.placeholder]="placeholder() ?? null"
    [attr.id]="controlId() ?? null"
    [attr.aria-describedby]="field?.describedBy() ?? null"
    [attr.aria-invalid]="isInvalid() ? 'true' : null"
    [attr.aria-required]="isRequired() ? 'true' : null"
    [disabled]="isDisabled()"
    [readOnly]="isReadOnly()"
    [value]="value() ?? ''"
    [attr.value]="value() ?? null"
    (input)="value.set(control.value)"
    data-part="control"
    [attr.type]="type()" />`,
})
export class DsInput {
  readonly size = input<InputSize>('md');
  readonly shape = input<InputShape>('default');
  readonly type = input<InputType>('text');
  readonly placeholder = input<string | undefined>(undefined);
  /** The value. Two way: `[(value)]`. Left out, the input starts empty and carries no value attribute. */
  readonly value = model<string | undefined>(undefined);
  readonly id = input<string | undefined>(undefined);
  readonly invalid = input<boolean | undefined>(undefined);
  readonly disabled = input<boolean | undefined>(undefined);
  readonly readOnly = input<boolean | undefined>(undefined);
  readonly required = input<boolean | undefined>(undefined);
  /** Marks the control with data-autofocus, so a Dialog opens with focus on it. */
  readonly autofocus = input(false, { transform: booleanAttribute });

  protected readonly field = inject(DsField, { optional: true });
  private readonly _consumed = consumeHostAttributes(['dsInput', 'size', 'shape', 'type', 'placeholder', 'value', 'id', 'invalid', 'disabled', 'readOnly', 'required', 'autofocus']);
  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  protected readonly controlId = computed(() => this.id() ?? this.field?.controlId);
  protected readonly isInvalid = computed(() => this.invalid() ?? this.field?.isInvalid() ?? false);
  protected readonly isDisabled = computed(() => this.disabled() ?? this.field?.disabled() ?? false);
  protected readonly isReadOnly = computed(() => this.readOnly() ?? this.field?.readOnly() ?? false);
  protected readonly isRequired = computed(() => this.required() ?? this.field?.required() ?? false);

  /** The native input. */
  get nativeInput(): HTMLInputElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeInput.focus();
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
