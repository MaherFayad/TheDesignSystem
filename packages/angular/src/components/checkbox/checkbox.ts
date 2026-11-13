// Checkbox: one on or off choice, with an indeterminate state for a parent of
// mixed children. The twin of packages/react/src/components/Checkbox/Checkbox.tsx.
// The host is the root (`div[dsCheckbox]`); the template renders the parts in
// the React order: the control (the Radix button with role checkbox) with the
// indicator inside, then the label and the description. The indicator holds
// an aria-hidden fill span that grows from the centre and the `mark` svg: two
// strokes that meet at a joint, which Checkbox.css draws as the check or the
// dash (`data-glyph`) and morphs between them (interactions check-draw and
// check-mixed, order 1.23).
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
  afterRenderEffect,
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
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsOrderedStyle, type OrderedStyle } from '../../internal/ordered-style';
import { DsNativeButton } from '../../internal/native-button';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsFieldContext, fieldControl } from '../field/field-context';
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
  imports: [DsNativeButton, DsOrderedStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsCheckbox), multi: true }],
  host: {
    'data-ds': 'checkbox',
    '[attr.data-size]': 'boxSize()',
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
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.id]="controlId()"
      [attr.aria-describedby]="describedBy() ?? null"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-readonly]="isReadOnly() ? 'true' : null"
      data-part="control"
      (click)="onClick($event)"
      (keydown)="onKeydown($event)"
      (blur)="onTouched()"><span data-part="indicator" [attr.data-state]="state()" [attr.data-disabled]="isDisabled() ? '' : null" style="pointer-events: none;"><span aria-hidden="true"></span><svg data-part="mark" [attr.data-glyph]="glyph()" [attr.data-enter]="enter() ? '' : null" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M-4.25 0H0" pathLength="1" /><path d="M0 0H8.85" pathLength="1" /></svg></span></button>@if (isFormControl()) {<input #bubble
      type="checkbox"
      aria-hidden="true"
      tabindex="-1"
      [attr.name]="itemName() ?? null"
      [attr.value]="value() ?? 'on'"
      [checked]="current() === true"
      [indeterminate]="current() === 'indeterminate'"
      [required]="isRequired()"
      [disabled]="isDisabled()"
      [dsOrderedStyle]="bubbleStyle()" />}@if (label() !== undefined) {<label [attr.for]="controlId()" data-part="label">{{ label() }}</label>}@if (description() !== undefined) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}`,
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
  readonly defaultChecked = input<CheckboxCheckedState, unknown>(false, {
    transform: (v: unknown) => (v === 'indeterminate' ? 'indeterminate' : (optionalBoolean(v) ?? false)),
  });
  /** The value sent with the form when checked. Inside a CheckboxGroup it keys this box and is required. */
  readonly value = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /** The id of the control. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly group = inject(DS_CHECKBOX_GROUP, { optional: true });
  private readonly host = consumeHostAttributes([
    'dsCheckbox', 'size', 'tone', 'label', 'description', 'invalid', 'disabled', 'readOnly', 'required',
    'checked', 'defaultChecked', 'value', 'name', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby',
  ]);
  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');
  private readonly bubble = viewChild<ElementRef<HTMLInputElement>>('bubble');

  protected readonly descriptionId = `ds-checkbox-${++nextId}-description`;
  private readonly ownId = `ds-checkbox-${nextId}`;

  /** The state of a box outside a group: the model, else defaultChecked, moved by clicks and forms. */
  private readonly own = linkedSignal<CheckboxCheckedState>(() => this.checked() ?? this.defaultChecked());
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly isFormControl = signal(false);
  protected readonly bubbleStyle = signal<OrderedStyle>([]);

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
  protected readonly boxSize = computed<CheckboxSize>(() => this.size() ?? this.group?.size() ?? 'md');
  // The select all box has no value, so it takes no group name and posts nothing, as React.
  protected readonly itemName = computed(() => this.name() ?? (this.inGroup() ? this.group?.name() : undefined));
  // The glyph stays in the box while unchecked, hidden, so the next check can
  // draw it in (interaction check-draw) and an uncheck can fade it out. It
  // keeps the last glyph shown, a check before any, as React.
  protected readonly glyph = linkedSignal<CheckboxState, 'check' | 'minus'>({
    source: this.state,
    computation: (state, previous) => (state === 'checked' ? 'check' : state === 'indeterminate' ? 'minus' : (previous?.value ?? 'check')),
  });
  /**
   * B5 (order 1.29), as React: the state before the last change. A mark drawn
   * from an empty box carries data-enter, so it takes its glyph's angles at
   * once and only draws: from unchecked to mixed no part of the last check shows.
   */
  private readonly from = linkedSignal<CheckboxState, CheckboxState>({
    source: this.state,
    computation: (state, previous) => (previous === undefined ? state : previous.source),
  });
  // from() is read first and on every render, so it sees each state, the unchecked ones too.
  protected readonly enter = computed(() => {
    const from = this.from();
    return this.state() !== 'unchecked' && from === 'unchecked';
  });
  /** The Field wiring merged with the box's own values and its group, as React's useFieldControl. */
  private readonly fieldState = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [this.description() !== undefined ? this.descriptionId : undefined, this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
    invalid: this.invalid() ?? this.group?.invalid(),
    disabled: this.disabled() ?? this.formDisabled() ?? this.group?.disabled(),
    readOnly: this.readOnly() ?? this.group?.readOnly(),
    required: this.required(),
  }));
  protected readonly controlId = computed(() => this.fieldState().id ?? this.ownId);
  readonly isInvalid = computed(() => this.fieldState().invalid);
  readonly isDisabled = computed(() => this.fieldState().disabled);
  readonly isReadOnly = computed(() => this.fieldState().readOnly);
  protected readonly isRequired = computed(() => this.fieldState().required);
  protected readonly describedBy = computed(() => this.fieldState().describedBy);

  private onChange: (value: CheckboxCheckedState) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    effect((onCleanup) => {
      const v = this.value();
      if (!this.group || v === undefined) return;
      onCleanup(this.group.register(v));
    });
    const destroyRef = inject(DestroyRef);
    // A box with its own id tells the Field, so the Field label points at it.
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
    // Radix dispatches a click on the hidden input after the state changes,
    // so a form's change handling (dsForm, a native listener) sees the toggle.
    // The first render is the starting state, not a change.
    let seen: { el?: HTMLInputElement; value?: unknown } = {};
    afterRenderEffect(() => {
      const el = this.bubble()?.nativeElement;
      const value = this.current();
      if (!el) return;
      if (seen.el === el && seen.value !== value) el.dispatchEvent(new Event('click', { bubbles: true }));
      seen = { el, value };
    });
    afterNextRender(() => {
      const button = this.control().nativeElement;
      const form = button.closest('form');
      if (!form) return;
      // The order Radix writes, so the style attribute equals React's.
      this.bubbleStyle.set([
        ['position', 'absolute'],
        ['pointer-events', 'none'],
        ['opacity', '0'],
        ['margin', '0px'],
        ['transform', 'translateX(-100%)'],
        ['width', `${button.offsetWidth}px`],
        ['height', `${button.offsetHeight}px`],
      ]);
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
