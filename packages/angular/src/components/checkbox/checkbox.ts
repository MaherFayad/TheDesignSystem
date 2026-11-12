// Checkbox: one on or off choice, with an indeterminate state for a parent of
// mixed children. The twin of packages/react/src/components/Checkbox/Checkbox.tsx.
// The host is the root (`div[dsCheckbox]`); the template renders the parts in
// the React order: the control (the Radix button with role checkbox) with the
// indicator inside, then the label and the description.
//
//   <div dsCheckbox label="Show rulers" [(checked)]="rulers"></div>
//   <div dsCheckbox label="Snap frames to the grid" [formControl]="snap"></div>
//
// React gets the behavior from Radix Checkbox. Here it is hand built with the
// same DOM: Space toggles (a native button click), Enter does nothing, a
// click on the indeterminate box checks it. Inside a form a hidden native
// checkbox carries the value, as the Radix bubble input does.
//
// Names that differ from React: `onCheckedChange` is the `checkedChange`
// output of `[(checked)]`. `aria-label`, `aria-labelledby` and
// `aria-describedby` are inputs, because React spreads them on the control
// and Angular cannot forward host attributes to an element in the template.
// `rootProps`, `className` and `style` have no form: the host is the root.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsNativeButton } from '../../internal/native-button';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsField } from '../field/field';
import { DS_CHECKBOX_GROUP } from './group';

export type CheckboxSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type CheckboxTone = Extract<Tone, 'neutral' | 'accent' | 'danger'>;
export type CheckboxCheckedState = boolean | 'indeterminate';
export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export function checkboxState(checked: CheckboxCheckedState): CheckboxState {
  if (checked === 'indeterminate') return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

let nextId = 0;

@Component({
  selector: 'div[dsCheckbox]',
  exportAs: 'dsCheckbox',
  imports: [DsIcon, DsNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsCheckbox), multi: true }],
  host: {
    'data-ds': 'checkbox',
    '[attr.data-size]': 'iconSize()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-state]': 'state()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
  },
  template: `<button dsNativeButton #control
      type="button"
      role="checkbox"
      [attr.aria-checked]="ariaChecked()"
      [attr.aria-required]="isRequired() ? 'true' : 'false'"
      [attr.data-state]="state()"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [disabled]="isDisabled()"
      [attr.value]="value() ?? 'on'"
      [attr.id]="controlId()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.aria-describedby]="describedBy() ?? null"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-readonly]="isReadOnly() ? 'true' : null"
      data-part="control"
      (click)="onClick($event)"
      (keydown)="onKeydown($event)"
      (blur)="onTouched()"><span data-part="indicator" [attr.data-state]="state()" [attr.data-disabled]="isDisabled() ? '' : null">@if (state() === 'checked') {<svg dsIcon name="check" [size]="iconSize()"></svg>} @else if (state() === 'indeterminate') {<svg dsIcon name="minus" [size]="iconSize()"></svg>}</span></button>@if (isFormControl()) {<input #bubble
      type="checkbox"
      aria-hidden="true"
      tabindex="-1"
      [attr.name]="itemName() ?? null"
      [attr.value]="value() ?? 'on'"
      [checked]="current() === true"
      [indeterminate]="current() === 'indeterminate'"
      [required]="isRequired()"
      [disabled]="isDisabled()"
      [style]="bubbleStyle()" />}@if (label() !== undefined) {<label [attr.for]="controlId()" data-part="label">{{ label() }}</label>}@if (description() !== undefined) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}`,
})
export class DsCheckbox implements ControlValueAccessor {
  /** The box size: sm 12, md 16, lg 24 px. Inside a CheckboxGroup it follows the group. Default md. */
  readonly size = input<CheckboxSize | undefined>(undefined);
  /** The fill of the checked box. Default neutral. */
  readonly tone = input<CheckboxTone>('neutral');
  /** Visible text after the box. Clicking it toggles the box. Without it, pass aria-label. */
  readonly label = input<string | undefined>(undefined);
  /** A hint under the label. Joins aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** Marks the choice invalid. Inside a Field or a CheckboxGroup it follows them. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Keeps the value and focus, but ignores clicks and Space. */
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The checked state. Two way: `[(checked)]`. Left out, the box starts at defaultChecked. */
  readonly checked = model<CheckboxCheckedState | undefined>(undefined);
  readonly defaultChecked = input<CheckboxCheckedState>(false);
  /** The value sent with the form when checked. Inside a CheckboxGroup it keys this box and is required. */
  readonly value = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /** The id of the control. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsField, { optional: true });
  private readonly group = inject(DS_CHECKBOX_GROUP, { optional: true });
  private readonly host = consumeHostAttributes([
    'dsCheckbox', 'size', 'tone', 'label', 'description', 'invalid', 'disabled', 'readOnly', 'required',
    'checked', 'defaultChecked', 'value', 'name', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby',
  ]);
  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');

  protected readonly descriptionId = `ds-checkbox-${++nextId}-description`;
  private readonly ownId = `ds-checkbox-${nextId}`;

  /** The state of a box outside a group: the model, else defaultChecked, moved by clicks and forms. */
  private readonly own = linkedSignal<CheckboxCheckedState>(() => this.checked() ?? this.defaultChecked());
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly isFormControl = signal(false);
  protected readonly bubbleStyle = signal<Record<string, string>>({});

  /** In a group a box with a value is keyed by it; a box with no value (select all) is driven by its own inputs. */
  private readonly inGroup = computed(() => this.group !== null && this.value() !== undefined);

  readonly current = computed<CheckboxCheckedState>(() => {
    const group = this.group;
    const v = this.value();
    if (group && v !== undefined) return group.value().includes(v);
    return this.own();
  });
  readonly state = computed(() => checkboxState(this.current()));
  protected readonly ariaChecked = computed(() => {
    const c = this.current();
    return c === 'indeterminate' ? 'mixed' : String(c);
  });
  protected readonly iconSize = computed<CheckboxSize>(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly itemName = computed(() => this.name() ?? this.group?.name());
  protected readonly controlId = computed(() => this.id() ?? this.field?.controlId() ?? this.ownId);
  readonly isInvalid = computed(() => this.invalid() ?? this.group?.invalid() ?? this.field?.invalid() ?? false);
  readonly isDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.group?.disabled() ?? this.field?.disabled() ?? false,
  );
  readonly isReadOnly = computed(() => this.readOnly() ?? this.group?.readOnly() ?? this.field?.readOnly() ?? false);
  protected readonly isRequired = computed(() => this.required() ?? this.field?.required() ?? false);
  protected readonly describedBy = computed(() => {
    const own = [this.description() !== undefined ? this.descriptionId : undefined, this.ariaDescribedby()].filter(Boolean).join(' ');
    return [this.field?.describedBy(), own].filter(Boolean).join(' ') || undefined;
  });

  private onChange: (value: CheckboxCheckedState) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect((onCleanup) => {
      const v = this.value();
      if (!this.group || v === undefined) return;
      onCleanup(this.group.register(v));
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const button = this.control().nativeElement;
      const form = button.closest('form');
      if (!form) return;
      this.bubbleStyle.set({
        position: 'absolute',
        'pointer-events': 'none',
        opacity: '0',
        margin: '0px',
        width: `${button.offsetWidth}px`,
        height: `${button.offsetHeight}px`,
        transform: 'translateX(-100%)',
      });
      this.isFormControl.set(true);
      const initial = this.own();
      const reset = () => this.own.set(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  /** The control, the element with role checkbox. */
  get nativeControl(): HTMLButtonElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    // A native checkbox does not toggle on Enter, and neither does Radix.
    if (event.key === 'Enter') event.preventDefault();
  }

  protected onClick(event: MouseEvent): void {
    // Space on a button is a click too.
    if (this.isReadOnly()) {
      event.preventDefault();
      return;
    }
    const current = this.current();
    const next: CheckboxCheckedState = current === 'indeterminate' ? true : !current;
    if (this.inGroup()) {
      this.group?.toggle(this.value() as string, next === true);
    } else {
      this.own.set(next);
    }
    this.checked.set(next);
    this.onChange(next);
  }

  writeValue(value: CheckboxCheckedState | null | undefined): void {
    this.own.set(value ?? false);
  }

  registerOnChange(fn: (value: CheckboxCheckedState) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }
}
