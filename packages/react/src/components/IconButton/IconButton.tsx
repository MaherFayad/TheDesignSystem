'use client';
// IconButton: a Button with an icon and no visible label. Built on the same
// internals as Button (ButtonBase), so the axes, the inert states and asChild
// behave the same. Source: GoBanana `.st-btn[data-icon-only]`.
import type { ReactElement } from 'react';
import {
  ButtonLoading,
  ButtonRoot,
  renderSlotContent,
  type ButtonBaseProps,
  type ButtonEmphasis,
  type ButtonSlotContent,
} from '../Button/ButtonBase';

/** No link emphasis: an icon only link reads as neither a link nor a button. */
export type IconButtonEmphasis = Exclude<ButtonEmphasis, 'link'>;

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children' | 'aria-label' | 'emphasis'> {
  /** The icon: a system icon name or a node. It is hidden from assistive tech. */
  icon: ButtonSlotContent;
  /**
   * The accessible name, set as `aria-label`. Required. English: a verb plus
   * a noun ("Close panel"). Never the native title attribute; the Tooltip
   * pairing arrives with Tooltip in wave 1.
   */
  label: string;
  /** Default ghost: icon buttons sit in toolbars and headers. */
  emphasis?: IconButtonEmphasis;
  /** With asChild, one element (for example a link) with no children of its own. */
  children?: ReactElement;
}

/** A square icon only button, at least 24 by 24 px at every size. */
export function IconButton({ icon, label, loading = false, loadingLabel = 'Loading', ...rest }: IconButtonProps) {
  return (
    <ButtonRoot
      {...rest}
      ds="icon-button"
      defaultEmphasis="ghost"
      loading={loading}
      aria-label={label}
      render={() => (
        <>
          <span data-part="icon">{renderSlotContent(icon)}</span>
          {loading && <ButtonLoading label={loadingLabel} />}
        </>
      )}
    />
  );
}
