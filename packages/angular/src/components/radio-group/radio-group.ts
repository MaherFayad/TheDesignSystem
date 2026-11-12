// RadioGroup: one choice among a few visible options. The twin of
// packages/react/src/components/RadioGroup/RadioGroup.tsx.
//
//   <div dsRadioGroup label="Board view" [(value)]="view">
//     <div dsRadioGroupItem value="grid" label="Grid"></div>
//     <div dsRadioGroupItem value="list" label="List"></div>
//   </div>
//
// The host is the root, the element with role radiogroup, as the Radix root
// is in React: the legend, the description, the items part (the items are
// projected into it) and the error. Each item host is the item row; its
// template renders the control (the Radix item, a button with role radio)
// with the indicator, the hidden native radio inside a form, the label and
// the description.
//
// Behavior: React gets it from Radix RadioGroup. Here it is hand built with
// the Radix DOM in behavior/roving-radio.ts: one tab stop, arrows that move
// and select in the reading direction (CDK Directionality from the nearest
// dsTheme), all four arrows (no Radix orientation), Space selects, Enter
// does nothing. The key moves run on the CDK FocusKeyManager. Angular Aria
// has no radio group pattern to replace it with.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. label, description and error take text. `aria-labelledby`
// and `aria-describedby` are inputs on the group, because React merges them
// with its own ids. On the item, `id`, `aria-label`, `aria-labelledby` and
// `aria-describedby` are inputs, because React spreads them on the control.
// `className` and `style` of the item go on the host, the item row, as React
// puts them.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
  type Signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { RovingRadioGroup, bubbleInputStyle, rovingItem, type RovingRadioItem } from '../../behavior/roving-radio';
import { consumeHostAttributes } from '../../internal/host';
import { DsNativeButton } from '../../internal/native-button';
import { optionalBoolean } from '../../internal/optional-boolean';

export type RadioGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RadioGroupTone = Extract<Tone, 'neutral' | 'accent'>;
export type RadioGroupOrientation = 'vertical' | 'horizontal';

/** What a RadioGroup shares with its items through DI. */
interface RadioGroupContext {
  readonly roving: RovingRadioGroup;
  readonly value: Signal<string>;
  readonly disabled: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly name: Signal<string | undefined>;
}

const DS_RADIO_GROUP = new InjectionToken<RadioGroupContext>('DS_RADIO_GROUP');

let nextId = 0;

/**
 * A group of radio options with a legend, a description and an error. The
 * options are dsRadioGroupItem children. One option is checked at a time; a
 * group starts with none checked unless it gets a value.
 */
@Component({
  selector: 'div[dsRadioGroup]',
  exportAs: 'dsRadioGroup',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsRadioGroup), multi: true },
    { provide: DS_RADIO_GROUP, useFactory: () => inject(DsRadioGroup).context },
  ],
  host: {
    role: 'radiogroup',
    'data-ds': 'radio-group',
    '[attr.aria-required]': 'required() ? "true" : "false"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.dir]': 'dir.valueSignal()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[style.outline]': '"none"',
    '(mousedown)': 'roving.onRootMousedown()',
    '(focusin)': 'roving.onRootFocusin($event)',
    '(focusout)': 'onFocusout()',
  },
  template: `@if (hasLabel()) {<div [id]="legendId" data-part="legend">{{ label() }}@if (required()) {<span data-part="required" aria-hidden="true">*</span>}</div>}@if (hasDescription()) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}<div data-part="items"><ng-content /></div>@if (showError()) {<p [id]="errorId" data-part="error"><svg dsIcon name="danger" size="md"></svg><span>{{ error() }}</span></p>}`,
})
export class DsRadioGroup implements ControlValueAccessor {
  /** The visible question, rendered as the legend and used as the group name. Without it, pass aria-labelledby or aria-label. */
  readonly label = input<string | undefined>(undefined);
  /** A hint for the whole group, under the legend. Joins aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** What is wrong and how to fix it. While it shows, the group is invalid. */
  readonly error = input<string | undefined>(undefined);
  /** Marks the group invalid. Left out, the group is invalid while it shows an error. false hides the error. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** The checked value. Two way: `[(value)]`. Left out, the group starts at defaultValue. */
  readonly value = model<string | undefined>(undefined);
  /** The checked value at first render. No default: a group starts with none checked. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Disables every option. Native disabled: the options leave the tab order. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows the required mark, sets aria-required on the group and required on the hidden inputs. */
  readonly required = input(false, { transform: booleanAttribute });
  /** The form field name of the hidden native inputs. */
  readonly name = input<string | undefined>(undefined);
  /** vertical: one option per line. horizontal: options on one line that wraps. Default vertical. */
  readonly orientation = input<RadioGroupOrientation>('vertical');
  readonly size = input<RadioGroupSize>('md');
  readonly tone = input<RadioGroupTone>('neutral');
  /** Arrow keys wrap from the last option to the first. Default true. */
  readonly loop = input(true, { transform: booleanAttribute });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly host = consumeHostAttributes([
    'dsRadioGroup', 'label', 'description', 'error', 'invalid', 'value', 'defaultValue', 'disabled', 'required',
    'name', 'orientation', 'size', 'tone', 'loop', 'aria-labelledby', 'aria-describedby',
  ]);
  protected readonly dir = inject(Directionality);

  private readonly base = `ds-radio-group-${++nextId}`;
  protected readonly legendId = `${this.base}-legend`;
  protected readonly descriptionId = `${this.base}-description`;
  protected readonly errorId = `${this.base}-error`;

  /** The checked value: the model, else defaultValue, moved by picks and forms. '' is none. */
  private readonly current = linkedSignal<string>(() => this.value() ?? this.defaultValue() ?? '');
  private readonly formDisabled = signal(false);

  protected readonly hasLabel = computed(() => this.label() !== undefined);
  protected readonly hasDescription = computed(() => this.description() !== undefined);
  protected readonly showError = computed(() => this.error() !== undefined && this.invalid() !== false);
  readonly isInvalid = computed(() => this.invalid() ?? this.showError());
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly labelledBy = computed(() => this.ariaLabelledby() ?? (this.hasLabel() ? this.legendId : null));
  protected readonly describedBy = computed(
    () =>
      [this.hasDescription() ? this.descriptionId : undefined, this.showError() ? this.errorId : undefined, this.ariaDescribedby()]
        .filter(Boolean)
        .join(' ') || null,
  );

  protected readonly roving = new RovingRadioGroup({
    host: this.host,
    value: this.current,
    select: (next) => this.select(next),
    orientation: signal(undefined),
    loop: this.loop,
    dir: this.dir,
  });

  readonly context: RadioGroupContext = {
    roving: this.roving,
    value: this.current,
    disabled: this.isDisabled,
    invalid: this.isInvalid,
    required: this.required,
    name: this.name,
  };

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const form = this.host.closest('form');
      if (!form) return;
      const initial = untracked(this.current);
      const reset = () => this.current.set(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  private select(next: string): void {
    this.current.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  protected onFocusout(): void {
    this.roving.onRootFocusout();
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.current.set(value ?? '');
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

/**
 * One option: a row with the round control, the label and an optional
 * description. The label is a `<label>` bound to the control, so a click on
 * the text selects.
 */
@Component({
  selector: 'div[dsRadioGroupItem]',
  exportAs: 'dsRadioGroupItem',
  imports: [DsNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-part': 'item',
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-invalid]': 'group.invalid() ? "" : null',
  },
  template: `<button dsNativeButton #control
      type="button"
      role="radio"
      [attr.aria-checked]="checked() ? 'true' : 'false'"
      [attr.data-state]="state()"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [disabled]="isDisabled()"
      [attr.value]="value()"
      [attr.tabindex]="tabIndex()"
      [attr.id]="controlId()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.aria-describedby]="describedBy()"
      data-part="control"
      data-radix-collection-item=""
      (mousedown)="group.roving.onItemMousedown(item, $event)"
      (focus)="group.roving.onItemFocus(item)"
      (keydown)="group.roving.onItemKeydown(item, $event)"
      (click)="group.roving.onItemClick(item)"><span data-part="indicator" [attr.data-state]="state()" [attr.data-disabled]="isDisabled() ? '' : null"></span></button>@if (isFormControl()) {<input
      type="radio"
      aria-hidden="true"
      tabindex="-1"
      [attr.checked]="initialChecked ? '' : null"
      [checked]="checked()"
      [required]="group.required()"
      [disabled]="isDisabled()"
      [attr.name]="group.name() ?? null"
      [attr.value]="value()"
      [style]="bubbleStyle()" />}<label [attr.for]="controlId()" data-part="label">{{ label() }}</label>@if (description() !== undefined) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}`,
})
export class DsRadioGroupItem {
  /** The value this option sets. */
  readonly value = input.required<string>();
  /** The visible name of the option. */
  readonly label = input.required<string>();
  /** A line of help under the label. Joins the option's aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** Disables this option only. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The id of the control. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  protected readonly group = inject(DS_RADIO_GROUP);
  private readonly _host = consumeHostAttributes([
    'dsRadioGroupItem', 'value', 'label', 'description', 'disabled', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby',
  ]);
  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');

  private readonly base = `ds-radio-group-item-${++nextId}`;
  private readonly ownId = `${this.base}-control`;
  protected readonly descriptionId = `${this.base}-description`;

  readonly checked = computed(() => this.group.value() === this.value());
  protected readonly state = computed(() => (this.checked() ? 'checked' : 'unchecked'));
  readonly isDisabled = computed(() => this.disabled() || this.group.disabled());
  protected readonly controlId = computed(() => this.id() ?? this.ownId);
  protected readonly describedBy = computed(
    () => [this.description() !== undefined ? this.descriptionId : undefined, this.ariaDescribedby()].filter(Boolean).join(' ') || null,
  );
  protected readonly isFormControl = signal(false);
  protected readonly bubbleStyle = signal<Record<string, string>>({});
  /** Radix renders the hidden radio with defaultChecked: the state when it first rendered. */
  protected initialChecked = false;

  protected readonly item: RovingRadioItem = rovingItem({
    value: () => this.value(),
    element: () => this.control().nativeElement,
    disabled: () => this.isDisabled(),
  });
  protected readonly tabIndex = computed(() => this.group.roving.itemTabIndex(this.item));

  constructor() {
    inject(DestroyRef).onDestroy(this.group.roving.register(this.item));
    afterNextRender(() => {
      const button = this.control().nativeElement;
      if (!button.closest('form')) return;
      this.initialChecked = untracked(this.checked);
      this.bubbleStyle.set(bubbleInputStyle(button));
      this.isFormControl.set(true);
    });
  }

  /** The control, the element with role radio. */
  get nativeControl(): HTMLButtonElement {
    return this.control().nativeElement;
  }

  focus(): void {
    this.nativeControl.focus();
  }
}
