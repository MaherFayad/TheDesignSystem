// Combobox: pick one value from a long list by typing to filter. The twin
// of packages/react/src/components/Combobox/Combobox.tsx: ARIA 1.2 combobox
// with list autocomplete, focus stays in the input, the popup holds a
// ListBox with virtualFocus, aria-activedescendant points at the highlighted
// option. Behavior and the DOM in combobox-base.ts (shared with
// Autocomplete).
//
//   <div dsField label="City"><div dsCombobox [items]="cities" [(value)]="city" placeholder="Search cities"></div></div>
//   <div dsCombobox aria-label="City" [items]="cities" [formControl]="city"></div>
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`, `onOpenChange` the `openChange` output of `[(open)]`,
// `onInputValueChange` the `inputValueChange` output of `[(inputValue)]`.
// Native input props React spreads on the input (`placeholder`, `id`,
// `name`, `aria-label`, `aria-labelledby`, `aria-describedby`) are inputs.
// `empty` takes text or a TemplateRef. `className`, `style` and `rootProps`
// have no form: the host is the root.
import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, input, model, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { consumeHostAttributes } from '../../internal/host';
import { DsIconButton } from '../icon-button/icon-button';
import { DsListBox, flattenListBoxItems, type ListBoxOption } from '../list-box/list-box';
import { COMBOBOX_BASE_INPUTS, COMBOBOX_TEMPLATE, DsComboboxBase } from './combobox-base';

export { defaultResultCount, type ComboboxShape, type ComboboxSize } from './combobox-base';

@Component({
  selector: 'div[dsCombobox]',
  exportAs: 'dsCombobox',
  imports: [DsIconButton, DsListBox, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsCombobox), multi: true }],
  host: {
    'data-ds': 'combobox',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
  template: COMBOBOX_TEMPLATE,
})
export class DsCombobox extends DsComboboxBase implements ControlValueAccessor {
  /** The chosen option value. Two way: `[(value)]`. null: none. */
  readonly value = model<string | null | undefined>(undefined);
  readonly defaultValue = input<string | null>(null);
  /** The text in the field. Two way: `[(inputValue)]`. */
  readonly inputValue = model<string | undefined>(undefined);
  readonly defaultInputValue = input<string | undefined>(undefined);
  /** The name of the opener button. Default "Show options". */
  readonly triggerLabel = input<string | undefined>(undefined);
  /** The name of the clear button. Default "Clear value". */
  readonly clearLabel = input<string | undefined>(undefined);

  readonly ds: 'combobox' | 'autocomplete' = 'combobox';
  readonly mode: 'select' | 'free' = 'select';
  private readonly _consumed = consumeHostAttributes([
    'dsCombobox', ...COMBOBOX_BASE_INPUTS, 'value', 'defaultValue', 'inputValue', 'defaultInputValue', 'triggerLabel', 'clearLabel',
  ]);

  private readonly ownValue = signal<string | null>(null);
  private started = false;
  readonly current = computed(() => {
    const v = this.value();
    return v !== undefined ? v : this.ownValue();
  });
  private readonly label = computed(() => {
    const v = this.current();
    return v === null ? '' : (flattenListBoxItems(this.items()).find((o) => o.value === v)?.label ?? '');
  });

  private onChange: (value: string | null) => void = () => {};

  constructor() {
    super();
    // A controlled inputValue drives the text.
    effect(() => {
      const v = this.inputValue();
      if (v !== undefined) untracked(() => this.text.set(v));
    });
  }

  protected dsName(): 'combobox' {
    return 'combobox';
  }

  protected selectValue(): string | null {
    return this.current();
  }

  protected selectedLabel(): string {
    return this.label();
  }

  protected override triggerLabelText(): string | undefined {
    return this.triggerLabel();
  }

  protected override clearLabelText(): string | undefined {
    return this.clearLabel();
  }

  override ngOnInit(): void {
    if (!this.started) this.ownValue.set(this.defaultValue());
    this.started = true;
    super.ngOnInit();
    const initial = this.inputValue() ?? this.defaultInputValue();
    if (initial !== undefined) this.text.set(initial);
  }

  protected override onTextChange(text: string): void {
    if (this.inputValue() !== text) this.inputValue.set(text);
  }

  protected onSelect(option: ListBoxOption | null): void {
    const next = option ? option.value : null;
    this.ownValue.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  writeValue(value: string | null | undefined): void {
    this.started = true;
    this.ownValue.set(value ?? null);
    if (this.value() !== undefined) this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
}
