'use client';
// CloseButton: the one close control for dialogs, toasts, banners, chips and
// drawers. An IconButton preset on the Button base: the `close` icon, the
// neutral ghost look, and a default name that follows the language of the
// nearest Theme. Dialog, Toast and Window draw their own close parts today
// and can adopt this component later.
import type { ReactElement } from 'react';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps } from '../Button/ButtonBase';

/** The default names by language. Arabic: a noun form. */
export const closeButtonLabels = { en: 'Close', ar: 'إغلاق' } as const;

export interface CloseButtonProps
  extends Omit<ButtonBaseProps, 'children' | 'aria-label' | 'tone' | 'emphasis' | 'loading' | 'loadingLabel'> {
  /**
   * The accessible name, set as `aria-label`. Default "Close", or "إغلاق"
   * under an Arabic Theme. Name what closes when there is more than one
   * close control on a screen ("Close panel").
   */
  label?: string;
  /** With asChild, one element (for example a link) with no children of its own. */
  children?: ReactElement;
}

/** A square ghost button with the close icon. At least 24 by 24 px at every size. */
export function CloseButton({ label, ...rest }: CloseButtonProps) {
  const { lang } = useTheme();
  const name = label ?? (lang.startsWith('ar') ? closeButtonLabels.ar : closeButtonLabels.en);
  return (
    <ButtonRoot
      {...rest}
      ds="close-button"
      iconOnly
      tone="neutral"
      emphasis="ghost"
      defaultEmphasis="ghost"
      aria-label={name}
      render={() => <span data-part="icon">{renderSlotContent('close')}</span>}
    />
  );
}
