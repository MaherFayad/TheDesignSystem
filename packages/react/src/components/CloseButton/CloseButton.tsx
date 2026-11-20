'use client';
// CloseButton: the one close control for dialogs, toasts, banners, chips and
// drawers. An IconButton preset on the Button base: the `close` icon, the
// neutral ghost look, and a default name that follows the language of the
// nearest Theme. Dialog, Toast and Window draw their own close parts today
// and can adopt this component later.
//
// Order S1 (proposed): emphasis solid is the raised close, a filled disc
// with a lift that reads over a picture or a video (an onboarding card, a
// media viewer). The order asked for the word raised; the emphasis axis has
// shared words only (anatomy.md), so the filled form takes solid.
import type { ReactElement } from 'react';
import type { Emphasis } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { ButtonRoot, renderSlotContent, type ButtonBaseProps } from '../Button/ButtonBase';

/** ghost: the quiet glyph (default). solid: the raised close, a filled disc that reads over media. */
export type CloseButtonEmphasis = Extract<Emphasis, 'ghost' | 'solid'>;

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
  /**
   * ghost (default): the quiet glyph on a dialog, a toast or a chip. solid:
   * the raised close, a filled disc with a lift, for a close over a picture
   * or a video. A ButtonGroup never changes it.
   */
  emphasis?: CloseButtonEmphasis;
  /** With asChild, one element (for example a link) with no children of its own. */
  children?: ReactElement;
}

/** A square ghost button with the close icon, or a raised disc (solid). At least 24 by 24 px at every size. */
export function CloseButton({ label, emphasis = 'ghost', ...rest }: CloseButtonProps) {
  const { lang } = useTheme();
  const name = label ?? (lang.startsWith('ar') ? closeButtonLabels.ar : closeButtonLabels.en);
  return (
    <ButtonRoot
      {...rest}
      ds="close-button"
      iconOnly
      tone="neutral"
      emphasis={emphasis === 'solid' ? 'solid' : 'ghost'}
      defaultEmphasis="ghost"
      aria-label={name}
      render={() => <span data-part="icon">{renderSlotContent('close')}</span>}
    />
  );
}
