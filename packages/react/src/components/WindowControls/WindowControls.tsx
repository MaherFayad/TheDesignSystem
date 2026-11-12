'use client';
// WindowControls: the traffic lights of a window title bar. Close, minimize
// and zoom, in that order, at the start of the bar.
//
// Sources: GoBanana `desktop/FrameLights.tsx` (working lights inside a
// WindowLayer) and the `.dwin-light` rules in `desktop/desktop.css`
// (12px lights, 24px targets, centers 24px apart).
//
// Each light is an IconButton (the system button, never a bare <button>):
// the 24 by 24 button is the target, its icon part draws the 12px light and
// the glyph inside it is the light ink. Glyphs show on hover and on keyboard
// focus of the group, so the lights never differ by color alone.
//
// Decisions:
// - A light with no handler is disabled: aria-disabled and data-disabled, an
//   idle light with no glyph, and out of the tab order (tabIndex -1). Three
//   tab stops that do nothing slow a keyboard down; a screen reader still
//   finds them and hears them as dimmed. This is inert decoration of the
//   chrome, an accepted exception to "disabled actions stay focusable".
// - `closeDisabled` is the other kind: an action that cannot run now. The
//   close light keeps its tab stop with aria-disabled, like any Button.
// - The lights do not mirror in right to left layouts. They keep the order
//   close, minimize, zoom from the left, as macOS draws them and as the
//   source does (`.dwin-lights { direction: ltr }`).
import type { HTMLAttributes, MouseEvent, Ref } from 'react';
import { Icon } from '@the-system/icons/react';
import { IconButton } from '../IconButton';

export type WindowControlsState = 'active' | 'inactive';

export interface WindowControlsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Closes the window. Without it the close light is disabled. */
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Shows the close light disabled while keeping it in the tab order: for a
   * window or dialog that cannot be dismissed right now. With onClose given,
   * the light is aria-disabled and data-disabled, stays focusable, blocks
   * activation and draws as an idle dot (its glyph still shows on hover and
   * focus, so it can be identified). Default false.
   */
  closeDisabled?: boolean;
  /** Minimizes the window. Without it the minimize light is disabled. */
  onMinimize?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Zooms the window to fill its layer, or back. Without it the zoom light is disabled. */
  onZoom?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The zoom state, set as aria-pressed on the zoom light. Leave it out when zoom is not a toggle. */
  zoomed?: boolean;
  /** Accessible name of the close light. Default "Close window". */
  closeLabel?: string;
  /** Accessible name of the minimize light. Default "Minimize window". */
  minimizeLabel?: string;
  /** Accessible name of the zoom light. Default "Zoom window". */
  zoomLabel?: string;
  /** Accessible name of the group. Default "Window controls". */
  label?: string;
  /**
   * Whether the window these lights belong to has focus. Inactive lights
   * are idle dots until hover or keyboard focus. Default true.
   */
  active?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** The three traffic lights. 12px lights with 24 by 24 px targets. */
export function WindowControls({
  onClose,
  closeDisabled = false,
  onMinimize,
  onZoom,
  zoomed,
  closeLabel = 'Close window',
  minimizeLabel = 'Minimize window',
  zoomLabel = 'Zoom window',
  label = 'Window controls',
  active = true,
  ...rest
}: WindowControlsProps) {
  const state: WindowControlsState = active ? 'active' : 'inactive';
  return (
    <div {...rest} data-ds="window-controls" data-state={state} role="group" aria-label={label}>
      <Light part="close" label={closeLabel} onClick={onClose} disabled={closeDisabled} />
      <Light part="minimize" label={minimizeLabel} onClick={onMinimize} />
      <Light part="zoom" label={zoomLabel} onClick={onZoom} pressed={onZoom ? zoomed : undefined} />
    </div>
  );
}

interface LightProps {
  part: 'close' | 'minimize' | 'zoom';
  label: string;
  onClick: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  pressed?: boolean;
  /** Disabled but focusable. Only meaningful with onClick. */
  disabled?: boolean;
}

function Light({ part, label, onClick, pressed, disabled: blocked = false }: LightProps) {
  // No handler: inert decoration, out of the tab order. Blocked: an action
  // that cannot run now, focusable with aria-disabled (the action convention).
  const inert = !onClick;
  const disabled = inert || blocked;
  return (
    <IconButton
      data-part={part}
      icon={<Icon name={part} size="sm" />}
      label={label}
      size="xs"
      shape="pill"
      disabled={disabled}
      tabIndex={inert ? -1 : undefined}
      aria-pressed={pressed}
      onClick={onClick}
    />
  );
}
