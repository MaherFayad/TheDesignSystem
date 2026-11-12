// CheckboxGroup: several Checkbox items under one question, with one value
// array. The twin of packages/react/src/components/CheckboxGroup/CheckboxGroup.tsx.
// The host is the root (`fieldset[dsCheckboxGroup]`); the template renders the
// parts in the React order: the legend, the description, the items (an
// optional select all item, then the projected items) and the error.
//
//   <fieldset dsCheckboxGroup legend="Channels" [(value)]="channels">
//     <div dsCheckbox value="email" label="Email"></div>
//     <div dsCheckbox value="push" label="Push notifications"></div>
//   </fieldset>
//
// The items are DsCheckbox with a `value`. They read their checked state,
// size, name, disabled, invalid and read only from the group through the
// DS_CHECKBOX_GROUP token. The group is the ControlValueAccessor for the
// string array, so `[formControl]` and `[(ngModel)]` go on the fieldset.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. `legend`, `description`, `error` and `selectAll` take text.
// `aria-describedby` is an input, because the group joins it with its own
// ids. Other native attributes (`id`, `aria-label`) stay on the host as
// written.
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, linkedSignal, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { optionalBoolean } from '../../internal/optional-boolean';
import { DsCheckbox, type CheckboxCheckedState, type CheckboxSize } from '../checkbox/checkbox';
import { DS_CHECKBOX_GROUP, type CheckboxGroupContext } from '../checkbox/group';

export type CheckboxGroupSize = CheckboxSize;
export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

function hasText(text: string | null | undefined): boolean {
  return text !== undefined && text !== null;
}

/** The most steps of the select all cascade: the last box starts within three delay.stagger. */
const CASCADE_MAX_STEPS = 3;

let nextId = 0;

@Component({
  selector: 'fieldset[dsCheckboxGroup]',
  exportAs: 'dsCheckboxGroup',
  imports: [DsIcon, DsCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsCheckboxGroup), multi: true },
    { provide: DS_CHECKBOX_GROUP, useFactory: () => inject(DsCheckboxGroup).context },
  ],
  host: {
    'data-ds': 'checkbox-group',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    '[attr.data-size]': 'size()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '(focusout)': 'onTouched()',
  },
  template: `<legend data-part="legend">{{ legend() }}</legend>@if (showDescription()) {<p [id]="descriptionId" data-part="description">{{ description() }}</p>}<div data-part="items">@if (selectAll() !== undefined) {<div dsCheckbox
      data-part="select-all"
      [label]="selectAll()"
      [size]="size()"
      [checked]="allState()"
      (checkedChange)="onSelectAll()"
      [disabled]="isDisabled()"
      [invalid]="isInvalid()"
      [readOnly]="readOnly()"></div>}<ng-content /></div>@if (showError()) {<p [id]="errorId" data-part="error"><svg dsIcon name="danger" size="md"></svg><span>{{ error() }}</span></p>}`,
})
export class DsCheckboxGroup implements ControlValueAccessor {
  /** The question, in a legend. Required: it names the group. */
  readonly legend = input.required<string>();
  /** A hint under the legend. Joins the group's aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** What is wrong and how to fix it. While it shows, the group and its items are invalid. */
  readonly error = input<string | null | undefined>(undefined);
  /** The values of the checked items. Two way: `[(value)]`. Left out, the group starts at defaultValue. */
  readonly value = model<readonly string[] | undefined>(undefined);
  readonly defaultValue = input<readonly string[]>([]);
  /** Size of every item. Default md. */
  readonly size = input<CheckboxGroupSize>('md');
  /** vertical: one item per line. horizontal: items wrap on a line. Default vertical. */
  readonly orientation = input<CheckboxGroupOrientation>('vertical');
  /** The form name every item submits under. */
  readonly name = input<string | undefined>(undefined);
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /** Marks the group invalid. Left out, the group is invalid while it shows an error. `false` hides the error. */
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input(false, { transform: (v: unknown) => optionalBoolean(v) ?? false });
  /** The label of an optional first item that checks or clears every item. Indeterminate when some are checked. */
  readonly selectAll = input<string | undefined>(undefined);
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly host: HTMLElement;

  constructor() {
    this.host = consumeHostAttributes([
      'dsCheckboxGroup', 'legend', 'description', 'error', 'value', 'defaultValue', 'size', 'orientation', 'name',
      'disabled', 'invalid', 'readOnly', 'selectAll', 'aria-describedby',
    ]);
  }

  protected readonly descriptionId = `ds-checkbox-group-${++nextId}-description`;
  protected readonly errorId = `ds-checkbox-group-${nextId}-error`;

  /** The checked values: the model, else defaultValue, moved by items and forms. */
  private readonly own = linkedSignal<readonly string[]>(() => this.value() ?? this.defaultValue());
  private readonly registered = signal<readonly string[]>([]);
  private readonly formDisabled = signal(false);

  readonly current = computed(() => this.own());
  protected readonly showError = computed(() => {
    const e = this.error();
    return e !== undefined && e !== null && this.invalid() !== false;
  });
  readonly isInvalid = computed(() => this.invalid() ?? this.showError());
  readonly isDisabled = computed(() => (this.disabled() ?? false) || this.formDisabled());
  protected readonly showDescription = computed(() => hasText(this.description()));
  protected readonly describedBy = computed(
    () =>
      [this.showDescription() ? this.descriptionId : undefined, this.showError() ? this.errorId : undefined, this.ariaDescribedby()]
        .filter(Boolean)
        .join(' ') || undefined,
  );

  /** The select all state: checked when every item is, indeterminate when some are. */
  protected readonly allState = computed<CheckboxCheckedState>(() => {
    const value = this.own();
    const registered = this.registered();
    const count = registered.filter((v) => value.includes(v)).length;
    if (count === 0) return false;
    return count === registered.length ? true : 'indeterminate';
  });

  /** What the items read through DS_CHECKBOX_GROUP. */
  readonly context: CheckboxGroupContext = {
    value: this.current,
    toggle: (itemValue, on) => this.toggle(itemValue, on),
    register: (itemValue) => this.register(itemValue),
    size: this.size,
    name: this.name,
    disabled: this.isDisabled,
    invalid: this.isInvalid,
    readOnly: this.readOnly,
  };

  private onChange: (value: string[]) => void = () => {};
  protected onTouched: () => void = () => {};

  private commit(next: string[]): void {
    this.own.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  // check-draw stagger (capped at three steps, as list-stagger, so every mark shows within about 200ms):
  // select all draws the boxes one delay.stagger apart (capped); one box alone draws at once. As React.
  private setSteps(run: boolean): void {
    const items = this.host.querySelector?.(":scope > [data-part='items']");
    const boxes = items?.querySelectorAll<HTMLElement>("[data-ds='checkbox']:not([data-part='select-all'])") ?? [];
    boxes.forEach((box, i) => {
      if (run) box.style.setProperty('--_checkbox-step', String(Math.min(i + 1, CASCADE_MAX_STEPS)));
      else box.style.removeProperty('--_checkbox-step');
    });
  }

  toggle(itemValue: string, on: boolean): void {
    this.setSteps(false);
    const without = this.own().filter((v) => v !== itemValue);
    this.commit(on ? [...without, itemValue] : without);
  }

  register(itemValue: string): () => void {
    this.registered.update((list) => (list.includes(itemValue) ? list : [...list, itemValue]));
    return () => this.registered.update((list) => list.filter((v) => v !== itemValue));
  }

  protected onSelectAll(): void {
    this.setSteps(true);
    const value = this.own();
    const registered = this.registered();
    if (this.allState() === true) this.commit(value.filter((v) => !registered.includes(v)));
    else this.commit([...value, ...registered.filter((v) => !value.includes(v))]);
  }

  writeValue(value: readonly string[] | null | undefined): void {
    this.own.set(value ?? []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
