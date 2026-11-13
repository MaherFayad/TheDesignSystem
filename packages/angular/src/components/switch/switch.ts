// Switch: an immediate on or off setting. The twin of
// packages/react/src/components/Switch/Switch.tsx. The host is the root
// (`div[dsSwitch]`); the template renders the parts in the React order: the
// control (the Radix button with role switch) holding the track and the
// thumb, then the label with the optional state text, then the description.
// The first child of the track is an aria-hidden span: the on tint that
// crosses in behind the thumb (interaction switch-stretch), styled by
// Switch.css. The thumb holds the thumb-lens part and, with `thumbIcon`, the
// thumb-icon svg. A sideways drag moves the thumb and snaps on release
// (interaction switch-drag, internal/toggles-switch-drag.ts); the root then
// carries `data-dragging` and `--_switch-drag-progress`.
//
//   <div dsSwitch label="Auto save" [(checked)]="autoSave"></div>
//   <div dsSwitch label="Show rulers" [formControl]="rulers"></div>
//
// React gets the behavior from Radix Switch. Here it is hand built with the
// same DOM: Space and Enter toggle (a native button click), read only keeps
// the value and focus. Inside a form a hidden native checkbox carries the
// value, as the Radix bubble input does.
//
// Names that differ from React: `onCheckedChange` is the `checkedChange`
// output of `[(checked)]`. `stateText` takes `{ on, off }` text. `aria-label`,
// `aria-labelledby` and `aria-describedby` are inputs, because React spreads
// them on the control and Angular cannot forward host attributes to an
// element in the template. `rootProps`, `className` and `style` have no
// form: the host is the root.
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
import { DsNativeButton } from '../../internal/native-button';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsOrderedStyle, type OrderedStyle } from '../../internal/ordered-style';
import { DsFieldContext, fieldControl } from '../field/field-context';
import { SwitchDrag } from '../../internal/toggles-switch-drag';

export type SwitchSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type SwitchTone = Extract<Tone, 'accent'>;

export interface SwitchStateText {
  /** Shown while on. */
  on: string;
  /** Shown while off. */
  off: string;
}

let nextId = 0;

@Component({
  selector: 'div[dsSwitch]',
  exportAs: 'dsSwitch',
  imports: [DsNativeButton, DsOrderedStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSwitch), multi: true }],
  host: {
    'data-ds': 'switch',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-state]': 'shownState()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-dragging]': 'drag.dragging() ? "" : null',
  },
  template: `<button dsNativeButton #control
      type="button"
      role="switch"
      [attr.aria-checked]="current() ? 'true' : 'false'"
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
      (pointerdown)="drag.pointerDown($event)"
      (pointermove)="drag.pointerMove($event)"
      (pointerup)="drag.pointerUp($event)"
      (pointercancel)="drag.pointerCancel($event)"
      (lostpointercapture)="drag.lostPointerCapture($event)"
      (keydown)="drag.keyDown($event)"
      (blur)="onTouched()"><span data-part="track"><span aria-hidden="true"></span><span [attr.data-state]="state()" [attr.data-disabled]="isDisabled() ? '' : null" data-part="thumb"><span data-part="thumb-lens" aria-hidden="true"></span>@if (thumbIcon()) {<svg data-part="thumb-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 8.25 7 10.75 11.5 5.5" pathLength="1" /><path d="M5.5 5.5 10.5 10.5M10.5 5.5 5.5 10.5" /></svg>}</span></span></button>@if (isFormControl()) {<input #bubble
      type="checkbox"
      aria-hidden="true"
      [attr.checked]="initialChecked() ? '' : null"
      [required]="isRequired()"
      [disabled]="isDisabled()"
      [attr.name]="name() ?? null"
      [attr.value]="value() ?? 'on'"
      tabindex="-1"
      [checked]="current()"
      [dsOrderedStyle]="bubbleStyle()" />}@if (label() !== undefined) {<label [attr.for]="controlId()" data-part="label">{{ label() }}@if (stateText(); as text) {<span data-part="state-text" aria-hidden="true">{{ current() ? text.on : text.off }}</span>}</label>} @else if (stateText(); as text) {<span data-part="state-text" aria-hidden="true">{{ current() ? text.on : text.off }}</span>}@if (description() !== undefined) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}`,
})
export class DsSwitch implements ControlValueAccessor {
  /** Track of 16, 24 and 32 px high, in a target of 24 px, 24 px and the lg control height. Default md. */
  readonly size = input<SwitchSize>('md');
  /** The fill of the track while on. Only accent. */
  readonly tone = input<SwitchTone>('accent');
  /** Visible text after the switch. Clicking it toggles. Without it, pass aria-label. */
  readonly label = input<string | undefined>(undefined);
  /** A hint under the label. Joins aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** Optional words for the two states, shown after the label. Hidden from assistive tech. */
  readonly stateText = input<SwitchStateText | undefined>(undefined);
  /**
   * Renders an icon in the thumb: a check while on, a cross while off. It is
   * drawn only where a style or a platform shows it (Android); hidden from
   * assistive tech. Default false.
   */
  readonly thumbIcon = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** Inside a Field it follows the Field. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Keeps the value and focus, but ignores clicks, Space and Enter. */
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** On or off. Two way: `[(checked)]`. Left out, the switch starts at defaultChecked. */
  readonly checked = model<boolean | undefined>(undefined);
  readonly defaultChecked = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** The value sent with the form while on. Default "on". */
  readonly value = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
  /** The id of the control. Inside a Field it defaults to the Field's control id. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly field = inject(DsFieldContext, { optional: true });
  private readonly host = consumeHostAttributes([
    'dsSwitch', 'size', 'tone', 'label', 'description', 'stateText', 'thumbIcon', 'invalid', 'disabled', 'readOnly', 'required',
    'checked', 'defaultChecked', 'value', 'name', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby',
  ]);
  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');
  private readonly bubble = viewChild<ElementRef<HTMLInputElement>>('bubble');

  protected readonly descriptionId = `ds-switch-${++nextId}-description`;
  private readonly ownId = `ds-switch-${nextId}`;

  /** The model, else defaultChecked, moved by clicks and forms. */
  private readonly own = linkedSignal<boolean>(() => this.checked() ?? this.defaultChecked());
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  protected readonly isFormControl = signal(false);
  protected readonly initialChecked = signal(false);
  protected readonly bubbleStyle = signal<OrderedStyle>([]);

  readonly current = computed(() => this.own());
  readonly state = computed(() => (this.current() ? 'checked' : 'unchecked'));
  /** The Field wiring merged with the switch's own values, as React's useFieldControl. */
  private readonly fieldState = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: [this.description() !== undefined ? this.descriptionId : undefined, this.ariaDescribedby()].filter(Boolean).join(' ') || undefined,
    invalid: this.invalid(),
    disabled: this.disabled() ?? this.formDisabled(),
    readOnly: this.readOnly(),
    required: this.required(),
  }));
  protected readonly controlId = computed(() => this.fieldState().id ?? this.ownId);
  readonly isInvalid = computed(() => this.fieldState().invalid);
  readonly isDisabled = computed(() => this.fieldState().disabled);
  readonly isReadOnly = computed(() => this.fieldState().readOnly);
  protected readonly isRequired = computed(() => this.fieldState().required);
  protected readonly describedBy = computed(() => this.fieldState().describedBy);

  private onChange: (value: boolean) => void = () => {};
  protected onTouched: () => void = () => {};

  /** switch-drag (order 1.23): the thumb follows a drag and snaps on release. A tap still toggles through the click. */
  protected readonly drag = new SwitchDrag({
    checked: () => this.current(),
    disabled: () => Boolean(this.isDisabled()) || Boolean(this.isReadOnly()),
    onToggle: (next) => this.commit(next),
  });
  /** While a drag runs the root shows the side the thumb is on (order 1.29, B4); the control keeps aria-checked. */
  protected readonly shownState = computed(() => (this.drag.dragging() ? (this.drag.onSide() ? 'checked' : 'unchecked') : this.state()));

  constructor() {
    // A control with its own id tells the Field, so the Field label points at it, as React's useFieldControl.
    const field = this.field;
    if (field) {
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
      inject(DestroyRef).onDestroy(() => {
        if (untracked(this.id) !== undefined) field.setControlId(undefined);
      });
    }
    const destroyRef = inject(DestroyRef);
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
      // The Radix bubble input: the size of the control, pulled back over it, invisible.
      this.bubbleStyle.set([
        ['width', `${button.offsetWidth}px`],
        ['height', `${button.offsetHeight}px`],
        ['position', 'absolute'],
        ['pointer-events', 'none'],
        ['opacity', '0'],
        ['margin', '0px'],
        ['transform', 'translateX(-100%)'],
      ]);
      const initial = this.own();
      this.initialChecked.set(initial);
      this.isFormControl.set(true);
      const reset = () => this.own.set(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  /** The control, the element with role switch. */
  get nativeControl(): HTMLButtonElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }

  protected onClick(event: MouseEvent): void {
    // Space and Enter on a button are clicks too. A drag already decided the
    // state on release, so the click that ends it toggles nothing.
    if (this.isReadOnly() || this.drag.consumeClick()) {
      event.preventDefault();
      return;
    }
    this.commit(!this.current());
  }

  /** A change from the person: the state, the model and the form, once. */
  private commit(next: boolean): void {
    if (this.isReadOnly()) return;
    this.own.set(next);
    this.checked.set(next);
    this.onChange(next);
  }

  writeValue(value: boolean | null | undefined): void {
    this.own.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled || undefined);
  }
}
