'use client';
// FloatingActionButton: the one main action of a screen, floating above the
// content at the inline end and the block end. On the Button base: a solid
// fill, a touch size (44px or more), an elevation, and an extended form with
// a visible label. No source: designed from the dials table and IconButton.
import type { ReactElement } from 'react';
import type { Size } from '@the-system/shared';
import { ButtonLoading, ButtonRoot, renderSlotContent, type ButtonBaseProps, type ButtonSlotContent } from '../Button/ButtonBase';

export type FloatingActionButtonSize = Extract<Size, 'md' | 'lg'>;
/** Where it floats: the viewport (fixed), the nearest positioned container (absolute), or in the flow (static). */
export type FloatingActionButtonPosition = 'fixed' | 'absolute' | 'static';

export interface FloatingActionButtonProps
  extends Omit<ButtonBaseProps, 'children' | 'aria-label' | 'size' | 'emphasis'> {
  /** The icon: a system icon name or a node. Hidden from assistive tech. */
  icon: ButtonSlotContent;
  /** The action, a verb plus a noun ("Create board"). The accessible name, and the visible text when `extended`. Required. */
  label: string;
  /** Shows the label beside the icon. Default false. */
  extended?: boolean;
  /** md 44px, lg 48px: never under the touch target. Default lg. */
  size?: FloatingActionButtonSize;
  /** Default fixed. */
  position?: FloatingActionButtonPosition;
  /** Default accent: the main action. */
  tone?: ButtonBaseProps['tone'];
  /** With asChild, one element (for example a link) with no children of its own. */
  children?: ReactElement;
}

/** A floating solid action, at least 44 by 44 px. Loading and disabled work as on Button. */
export function FloatingActionButton({
  icon,
  label,
  extended = false,
  size = 'lg',
  position = 'fixed',
  tone = 'accent',
  loading = false,
  loadingLabel = 'Loading',
  ...rest
}: FloatingActionButtonProps) {
  return (
    <ButtonRoot
      {...rest}
      ds="floating-action-button"
      iconOnly={!extended}
      size={size}
      tone={tone}
      emphasis="solid"
      defaultEmphasis="solid"
      loading={loading}
      data-extended={extended ? '' : undefined}
      data-position={position}
      aria-label={extended ? undefined : label}
      render={() => (
        <>
          <span data-part="icon">{renderSlotContent(icon)}</span>
          {extended && <span data-part="label">{label}</span>}
          {loading && <ButtonLoading label={loadingLabel} />}
        </>
      )}
    />
  );
}
