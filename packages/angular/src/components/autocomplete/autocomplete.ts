// Autocomplete: free text with suggestions, where any text is allowed. The
// twin of packages/react/src/components/Autocomplete/Autocomplete.tsx: ARIA
// 1.2 combobox with list autocomplete and no automatic selection, so Enter
// keeps the typed text. Built on the Combobox base
// (../combobox/combobox-base.ts), with no trigger and no clear button.
//
//   <div dsField label="Tag"><div dsAutocomplete [items]="tags" [(value)]="tag"></div></div>
//   <div dsAutocomplete aria-label="Destination" [items]="cities" [formControl]="destination"></div>
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]` (the text), `onOpenChange` the `openChange` output of
// `[(open)]`, `onCommit` the `commit` output. Native input props React
// spreads on the input (`placeholder`, `id`, `name`, `aria-label`,
// `aria-labelledby`, `aria-describedby`) are inputs. The highlight is kept
// on the CDK ActiveDescendantKeyManager (internal/list-highlight.ts);
// Angular Aria Autocomplete would replace it once order A3.0 installs
// @angular/aria.
import { ChangeDetectionStrategy, Component, effect, forwardRef, input, model, output, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { consumeHostAttributes } from '../../internal/host';
import { DsIconButton } from '../icon-button/icon-button';
import { DsListBox } from '../list-box/list-box';
import { COMBOBOX_BASE_INPUTS, COMBOBOX_TEMPLATE, DsComboboxBase, type ComboboxShape, type ComboboxSize } from '../combobox/combobox-base';

export type AutocompleteSize = ComboboxSize;
export type AutocompleteShape = ComboboxShape;

@Component({
  selector: 'div[dsAutocomplete]',
  exportAs: 'dsAutocomplete',
  imports: [DsIconButton, DsListBox, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsAutocomplete), multi: true }],
  host: {
    'data-ds': 'autocomplete',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'isInvalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
  template: COMBOBOX_TEMPLATE,
})
export class DsAutocomplete extends DsComboboxBase implements ControlValueAccessor {
  /** The text. Two way: `[(value)]`. Any text is a valid value. */
  readonly value = model<string | undefined>(undefined);
  readonly defaultValue = input('');
  /** Emits the text when Enter is pressed and no suggestion is highlighted. The form still submits. */
  readonly commit = output<string>();

  readonly ds: 'combobox' | 'autocomplete' = 'autocomplete';
  readonly mode: 'select' | 'free' = 'free';
  private readonly _consumed = consumeHostAttributes(['dsAutocomplete', ...COMBOBOX_BASE_INPUTS, 'value', 'defaultValue']);

  private onChange: (value: string) => void = () => {};

  constructor() {
    super();
    // A value set from outside drives the text.
    effect(() => {
      const v = this.value();
      if (v !== undefined) untracked(() => this.text.set(v));
    });
  }

  protected dsName(): 'autocomplete' {
    return 'autocomplete';
  }

  protected selectValue(): string | null {
    return null;
  }

  protected selectedLabel(): string {
    return '';
  }

  protected onSelect(): void {}

  protected override initText(): void {
    this.text.set(this.value() ?? this.defaultValue());
  }

  protected override onTextChange(text: string): void {
    if (this.value() !== text) this.value.set(text);
    this.onChange(text);
  }

  protected override onCommit(text: string): void {
    this.commit.emit(text);
  }

  writeValue(value: string | null | undefined): void {
    this.text.set(value ?? '');
    if (this.value() !== undefined) this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
}
