'use client';
// Button: the one action control of the system, and the only place that
// renders a bare <button> (with IconButton, which shares ButtonBase).
//
// Sources: GoBanana `.st-btn` in banana-server/styles/studio-components.css,
// `RollButton.tsx` (the Desk roll label), Figma-Killer-2 Button.
//
// The old variants map to the shared axes like this:
//
// | Source                                  | tone    | emphasis |
// | --------------------------------------- | ------- | -------- |
// | .st-btn secondary (the default)         | neutral | soft     |
// | .st-btn ghost                           | neutral | ghost    |
// | .st-btn primary (yellow in Desk)        | accent  | solid    |
// | .st-btn destructive                     | danger  | soft     |
// | .st-btn ghost, data-tone danger         | danger  | ghost    |
// | FK2 secondary, data-tone danger         | danger  | soft     |
// | FK2 primary (neutral fill in Studio)    | accent  | solid    |
// | data-shape pill                         | shape pill            |
// | data-icon-only                          | IconButton            |
// | data-loading (overlay spinner)          | loading               |
// | FK2 fullWidth                           | fullWidth             |
//
// Not carried over: data-shape flush (no shared shape word for it), the
// inline loading form (a visible busy label is the caller's copy), FK2
// align, menuItem, navItem and numeric (they belong to Menu and Nav), and
// aria-pressed styling (a toggle is its own component).
import type { ReactNode } from 'react';
import {
  ButtonLoading,
  ButtonRoot,
  renderSlotContent,
  type ButtonBaseProps,
  type ButtonSlotContent,
} from './ButtonBase';

export interface ButtonProps extends ButtonBaseProps {
  /** The label. English: a verb plus a noun. Arabic: a noun form. */
  children?: ReactNode;
  /** Default soft: the source's standard button (`.st-btn` secondary) in every style. */
  emphasis?: ButtonBaseProps['emphasis'];
  /** Leading content before the label (start side, so it sits on the right in Arabic): an icon name or a node. */
  start?: ButtonSlotContent;
  /** Trailing content after the label: an icon name or a node. */
  end?: ButtonSlotContent;
  /** Fills the width of its container. Default false. */
  fullWidth?: boolean;
  /**
   * Lets a long label wrap onto more lines; the button grows in height.
   * Default false: the label stays on one line and ends in an ellipsis when
   * the button is squeezed, and the button shrinks with its row.
   */
  wrap?: boolean;
}

/**
 * An action button. The primary action is `tone="accent" emphasis="solid"`:
 * yellow with dark text in Desk, the neutral fill in Studio, both from the
 * color.primary tokens. The label always sits in `data-part="label"`, so a
 * style recipe can draw it (the Desk roll).
 */
export function Button({
  start,
  end,
  fullWidth = false,
  wrap = false,
  loading = false,
  loadingLabel = 'Loading',
  ...rest
}: ButtonProps) {
  return (
    <ButtonRoot
      {...rest}
      ds="button"
      defaultEmphasis="soft"
      loading={loading}
      data-full-width={fullWidth ? '' : undefined}
      data-wrap={wrap ? '' : undefined}
      render={(content) => (
        <>
          {start !== undefined && <span data-part="start">{renderSlotContent(start)}</span>}
          <span data-part="label">{content}</span>
          {end !== undefined && <span data-part="end">{renderSlotContent(end)}</span>}
          {loading && <ButtonLoading label={loadingLabel} />}
        </>
      )}
    />
  );
}
