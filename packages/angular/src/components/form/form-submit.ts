// FormSubmit: the submit Button of the nearest Form. The twin of FormSubmit
// in packages/react/src/components/Form/Form.tsx: type submit, tone accent
// and emphasis solid by default, loading while the form submits.
//
//   <button dsFormSubmit>Send request</button>
//
// The host is the button itself, with the Button DOM: this is DsButton with
// three defaults changed and the loading state joined with the form's. The
// template is DsButton's.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';
import type { ButtonEmphasis, ButtonTone } from '../button/button-base';
import { DsFormContext } from './form-context';

@Component({
  selector: 'button[dsFormSubmit]',
  exportAs: 'dsFormSubmit',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (start(); as content) {
      <span data-part="start">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    <span data-part="label"><ng-content /></span>
    @if (end(); as content) {
      <span data-part="end">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    @if (loading()) {
      <span data-part="spinner" aria-hidden="true"></span>
      <span data-part="status" role="status">{{ loadingLabel() }}</span>
    }
    @if (spinnerLeaving()) {
      <span data-part="spinner" aria-hidden="true"></span>
    }
    <span data-part="hit" aria-hidden="true"></span>
  `,
})
export class DsFormSubmit extends DsButton {
  /** Default accent. */
  override readonly tone = input<ButtonTone>('accent');
  protected override readonly defaultEmphasis: ButtonEmphasis = 'solid';
  /** Default solid, set on the control itself, so it wins over a ButtonGroup's emphasis as React's explicit prop does. */
  override readonly emphasis = input<ButtonEmphasis | undefined>('solid');
  /** Shows loading of its own; the form's submitting state shows it too. */
  readonly loadingInput = input(false, { alias: 'loading', transform: booleanAttribute });
  /** Spoken while the form submits. Default "Sending", or Arabic under lang ar. */
  readonly loadingLabelInput = input<string | undefined>(undefined, { alias: 'loadingLabel' });
  /** Takes the place of the base type input, so a type attribute is read and ignored: the type is always submit. */
  readonly typeInput = input<string | undefined>(undefined, { alias: 'type' });

  private readonly form = inject(DsFormContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  // The base reads loading, loadingLabel and type in its host bindings. Here
  // they are derived: the form state joins loading, and type is always submit.
  override readonly loading = computed(() => this.form?.state() === 'submitting' || this.loadingInput()) as unknown as DsButton['loading'];
  override readonly loadingLabel = computed(
    () => this.loadingLabelInput() ?? (this.theme.value().lang === 'ar' ? 'جاري الإرسال' : 'Sending'),
  ) as unknown as DsButton['loadingLabel'];
  override readonly type = computed(() => 'submit' as const) as unknown as DsButton['type'];

  constructor() {
    super();
    consumeHostAttributes(['dsFormSubmit', 'loading', 'loadingLabel', 'type']);
  }
}
