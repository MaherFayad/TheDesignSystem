// CloseButton: the one close control for dialogs, toasts, banners, chips and
// drawers. An IconButton preset on the Button base: the close icon, the
// neutral ghost look, and a default name that follows the language of the
// nearest dsTheme.
//
//   <button dsCloseButton (click)="close()"></button>
//   <button dsCloseButton label="Close panel" size="sm"></button>
//
// The twin of packages/react/src/components/CloseButton/CloseButton.tsx.
// `asChild` has no Angular form: `a[dsCloseButton]` is the link form.
//
// Order S1: emphasis solid is the raised close, a filled disc with a lift
// that reads over a picture or a video. A ButtonGroup never changes it.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsButtonBase, type ButtonEmphasis } from '../button/button-base';

/** ghost: the quiet glyph (default). solid: the raised close, a filled disc that reads over media. */
export type CloseButtonEmphasis = 'ghost' | 'solid';

/** The default names by language. Arabic: a noun form. */
export const closeButtonLabels = { en: 'Close', ar: 'إغلاق' } as const;

@Component({
  selector: 'button[dsCloseButton], a[dsCloseButton]',
  exportAs: 'dsCloseButton',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'close-button',
    '[attr.aria-label]': 'name()',
  },
  template: `<span data-part="icon"><svg dsIcon name="close" size="md"></svg></span><span data-part="hit" aria-hidden="true"></span>`,
})
export class DsCloseButton extends DsButtonBase {
  /**
   * The accessible name, set as aria-label. Default "Close", or "إغلاق"
   * under an Arabic dsTheme. Name what closes when a screen has more than
   * one close control ("Close panel").
   */
  readonly label = input<string | undefined>(undefined);

  /**
   * ghost (default): the quiet glyph on a dialog, a toast or a chip. solid:
   * the raised close, a filled disc with a lift, for a close over a picture
   * or a video. A ButtonGroup never changes it.
   */
  readonly emphasisInput = input<CloseButtonEmphasis>('ghost', { alias: 'emphasis' });
  readonly emphasis = computed<ButtonEmphasis | undefined>(() => (this.emphasisInput() === 'solid' ? 'solid' : 'ghost'));
  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';
  private readonly theme = inject(DsThemeService);
  protected readonly name = computed(
    () => this.label() ?? (this.theme.value().lang.startsWith('ar') ? closeButtonLabels.ar : closeButtonLabels.en),
  );

  constructor() {
    super();
    consumeHostAttributes(['dsCloseButton', 'label']);
  }

  protected override isIconOnly(): boolean {
    return true;
  }
}
