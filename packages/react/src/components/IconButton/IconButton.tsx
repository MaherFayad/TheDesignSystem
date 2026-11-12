'use client';
// IconButton: a Button with an icon and no visible label. Built on the same
// internals as Button (ButtonBase), so the axes, the inert states and asChild
// behave the same. Source: GoBanana `.st-btn[data-icon-only]`.
import type { ReactElement } from 'react';
import { ButtonRoot, ButtonSpinner, renderButtonIcon, type ButtonBaseProps, type ButtonIcon } from '../Button/ButtonBase';

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children' | 'aria-label'> {
  /** The icon: a system icon name or an icon element. It is hidden from assistive tech. */
  icon: ButtonIcon;
  /**
   * The accessible name, set as `aria-label`. Required. English: a verb plus
   * a noun ("Close dialog"). Show it on hover with a Tooltip, never with
   * the native title attribute.
   */
  label: string;
  /** Default ghost: icon buttons sit in toolbars and headers. */
  emphasis?: ButtonBaseProps['emphasis'];
  /** default takes the style's control radius, pill is a circle, square has small corners. */
  shape?: ButtonBaseProps['shape'];
  /** With asChild, one element (for example a link) with no children of its own. */
  children?: ReactElement;
}

/** A square icon only button, at least 24 by 24 px at every size. */
export function IconButton({ icon, label, loading = false, ...rest }: IconButtonProps) {
  return (
    <ButtonRoot
      {...rest}
      ds="icon-button"
      defaultEmphasis="ghost"
      loading={loading}
      aria-label={label}
      render={() => (
        <>
          <span data-part="icon">{renderButtonIcon(icon)}</span>
          {loading && <ButtonSpinner />}
        </>
      )}
    />
  );
}
