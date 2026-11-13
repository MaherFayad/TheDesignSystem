'use client';
// Chip: a compact token you can press (a filter, an attribute) or remove
// (a picked value).
//
// Two forms, never both on one chip, so a chip is never a button inside a
// button:
// - pressable: the root is the button, built on ButtonBase. With
//   `selected`, it is a toggle (aria-pressed) that shows a check.
// - removable: the root is a span with the label and a remove CloseButton.
//   Delete and Backspace on the remove button remove the chip too.
// A chip that does neither is a Badge.
//
// Sources: Figma-Killer-2 TagPill (the tinted pill, a Button for the main
// action and a ghost icon button for remove, "Remove <label>" as its name).
// GoBanana `.st-chip` and admin `Chip` could not be read in the lane
// session (no access to the repo). The remove part is a CloseButton root
// carrying data-part="remove".
import { useLayoutEffect, useRef } from 'react';
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
import { useTheme } from '../../theme/hooks';
import { ButtonRoot } from '../Button/ButtonBase';
import { CloseButton } from '../CloseButton';
import { ANIMATION_ID_PREFIX, drawCheck, drawnScale, iconMorph, readDuration, readEasing, setPressPoint } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

/** The words of the default remove name by language. Arabic: a noun form. */
const chipRemoveLabels = { en: 'Remove', ar: 'إزالة' } as const;

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
  /** The name of the remove button. Default "Remove <label>", or "إزالة <label>" under an Arabic Theme, when the label is text. Pass it when the label is not plain text, and to name what is removed. */
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
  // chip-check-pop (order 1.23): selecting draws the check (it pops in past its size and back) while the
  // label slides over to make room; clearing turns the start glyph back in. Not on first paint.
  const motion = useMotion();
  const iconRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelAt = useRef<number | null>(null);
  const lastSelected = useRef(selected);
  useLayoutEffect(() => {
    const label = labelRef.current;
    const was = labelAt.current;
    // The label's offset from the chip's inline start, so a move of the whole chip is not read as a slide.
    const root = label?.parentElement;
    let now: number | null = null;
    if (label && root) {
      const l = label.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      const k = drawnScale(root);
      now = (getComputedStyle(root).direction === 'rtl' ? l.right - r.right : l.left - r.left) / k;
    }
    labelAt.current = now;
    if (lastSelected.current === selected) return;
    lastSelected.current = selected;
    const mode = motion.mode('chip-check-pop');
    if (selected) drawCheck(iconRef.current, mode);
    else iconMorph({ to: iconRef.current?.firstElementChild, turn: 45, mode });
    // The label moves when the check takes or gives back its room: it slides there instead of jumping.
    if (label && was !== null && now !== null && Math.abs(was - now) > 0.5 && mode === 'full' && typeof label.animate === 'function') {
      const duration = readDuration(label, 'duration.spring-snappy');
      if (duration > 0)
        label.animate([{ transform: `translateX(${Math.round((was - now) * 100) / 100}px)` }, { transform: 'none' }], {
          id: `${ANIMATION_ID_PREFIX}chip-check-pop`,
          duration,
          easing: readEasing(label, 'ease.spring-snappy'),
        });
    }
  }, [selected, motion]);
  return (
    <ButtonRoot
      {...rest}
      ref={ref}
      // Platform hook: where the press landed, for a ripple from the touch point.
      onPointerDown={(event) => {
        setPressPoint(event.currentTarget, 'chip', event.clientX, event.clientY);
        rest.onPointerDown?.(event);
      }}
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
            <span data-part="icon" aria-hidden="true" ref={iconRef}>
              {renderIcon(lead, size)}
            </span>
          )}
          <span data-part="label" ref={labelRef}>
            {content}
          </span>
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
  const { lang } = useTheme();
  const word = lang.startsWith('ar') ? chipRemoveLabels.ar : chipRemoveLabels.en;
  const name = removeLabel ?? (typeof children === 'string' ? `${word} ${children}` : word);
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
      <CloseButton
        data-part="remove"
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
