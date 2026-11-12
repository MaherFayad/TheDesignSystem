'use client';
// Chip: a compact token you can press (a filter, an attribute) or remove
// (a picked value).
//
// Two forms, never both on one chip, so a chip is never a button inside a
// button:
// - pressable: the root is the button, built on ButtonBase. With
//   `selected`, it is a toggle (aria-pressed) that shows a check.
// - removable: the root is a span with the label and a remove IconButton.
//   Delete and Backspace on the remove button remove the chip too.
// A chip that does neither is a Badge.
//
// Sources: Figma-Killer-2 TagPill (the tinted pill, a Button for the main
// action and a ghost icon button for remove, "Remove <label>" as its name).
// GoBanana `.st-chip` and admin `Chip` could not be read in the lane
// session (no access to the repo). CloseButton (1.1.9) does not exist yet:
// the remove part is an IconButton with the close icon until it does.
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { Icon, type IconName } from '@the-system/icons/react';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import { ButtonRoot } from '../Button/ButtonBase';
import { IconButton } from '../IconButton';

export type ChipSize = Extract<Size, 'xs' | 'sm' | 'md'>;
export type ChipTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
export type ChipEmphasis = Extract<Emphasis, 'soft' | 'outline'>;
export type ChipShape = Extract<Shape, 'pill'>;

interface ChipCommonProps {
  /** The visible label: a filter or a value, one to three words. */
  children: ReactNode;
  /** xs 24, sm 28, md 32 px, from size.control. Default md. */
  size?: ChipSize;
  /** The color family. Default neutral. */
  tone?: ChipTone;
  /** soft (a tint) or outline (a border). Default soft. */
  emphasis?: ChipEmphasis;
  /** Always a pill. Default pill. */
  shape?: ChipShape;
  /** Leading content in the icon part: a system icon name or a node. A selected chip shows a check here in its place. */
  start?: IconName | ReactElement;
  /** Blocks pressing and removing. The chip stays focusable (aria-disabled). Default false. */
  disabled?: boolean;
}

export interface ChipPressableProps
  extends ChipCommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'children' | 'disabled' | 'type'> {
  /** A toggle when set: aria-pressed, data-selected and a check. Leave undefined for a plain action. */
  selected?: boolean;
  onRemove?: undefined;
  removeLabel?: undefined;
  ref?: Ref<HTMLButtonElement>;
}

export interface ChipRemovableProps
  extends ChipCommonProps,
    Omit<HTMLAttributes<HTMLSpanElement>, 'title' | 'children' | 'onClick'> {
  /** Makes the chip removable: the remove button, Delete or Backspace on it, calls this. Move focus after removing. */
  onRemove: (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => void;
  /** The name of the remove button. Default "Remove <label>" when the label is text. Pass it when the label is not plain text, and in Arabic. */
  removeLabel?: string;
  selected?: undefined;
  onClick?: undefined;
  ref?: Ref<HTMLSpanElement>;
}

export type ChipProps = ChipPressableProps | ChipRemovableProps;

function renderIcon(icon: IconName | ReactElement, size: ChipSize): ReactNode {
  return typeof icon === 'string' ? <Icon name={icon} size={size === 'xs' ? 'sm' : 'md'} /> : icon;
}

/**
 * A pill you press (a filter, with `selected` it toggles) or remove (with
 * `onRemove`). Two targets of at least 24px when removable: the chip and its
 * remove button.
 */
export function Chip(props: ChipProps) {
  if (props.onRemove !== undefined) return <RemovableChip {...props} />;
  return <PressableChip {...props} />;
}

function PressableChip({
  children,
  size = 'md',
  tone = 'neutral',
  emphasis = 'soft',
  shape = 'pill',
  start,
  disabled = false,
  selected,
  onRemove: _onRemove,
  removeLabel: _removeLabel,
  ref,
  ...rest
}: ChipPressableProps) {
  // Selected always shows the check, in place of start, so selected never rests on the fill color alone.
  const lead = selected ? 'check' : start;
  return (
    <ButtonRoot
      {...rest}
      ref={ref}
      ds="chip"
      defaultEmphasis="soft"
      size={size}
      tone={tone}
      emphasis={emphasis}
      shape={shape}
      disabled={disabled}
      aria-pressed={selected}
      data-selected={selected ? '' : undefined}
      render={(content) => (
        <>
          {lead !== undefined && (
            <span data-part="icon" aria-hidden="true">
              {renderIcon(lead, size)}
            </span>
          )}
          <span data-part="label">{content}</span>
        </>
      )}
    >
      {children}
    </ButtonRoot>
  );
}

function RemovableChip({
  children,
  size = 'md',
  tone = 'neutral',
  emphasis = 'soft',
  shape = 'pill',
  start,
  disabled = false,
  onRemove,
  removeLabel,
  selected: _selected,
  onClick: _onClick,
  ref,
  ...rest
}: ChipRemovableProps) {
  const name = removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove');
  return (
    <span
      {...rest}
      ref={ref}
      data-ds="chip"
      data-size={size}
      data-tone={tone}
      data-emphasis={emphasis}
      data-shape={shape}
      data-disabled={disabled ? '' : undefined}
      data-removable=""
    >
      {start !== undefined && (
        <span data-part="icon" aria-hidden="true">
          {renderIcon(start, size)}
        </span>
      )}
      <span data-part="label">{children}</span>
      <IconButton
        data-part="remove"
        icon="close"
        label={name}
        size="xs"
        shape="pill"
        disabled={disabled}
        onClick={(event) => onRemove(event)}
        onKeyDown={(event) => {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            onRemove(event);
          }
        }}
      />
    </span>
  );
}
