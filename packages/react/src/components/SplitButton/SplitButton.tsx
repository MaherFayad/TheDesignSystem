'use client';
// SplitButton: a main action fused to a menu trigger of related actions.
//
// Sources: Figma-Killer-2 `SplitButton/` (two halves of one variant and size
// joined at a seam: inner corners square, a 1px divider; the menu aligned to
// the end of the control; the trigger names the menu), GoBanana `.st-menu`
// through DropdownMenu.
//
// Built from the system: the action is a Button, the trigger is an
// IconButton wrapped in DropdownMenuTrigger, and the menu is a
// DropdownMenuContent. The seam is the attached ButtonGroup look, drawn by
// SplitButton.css through Button's private corner properties.
//
// The DOM:
//
//   <div data-ds="split-button" data-size data-tone data-emphasis data-shape data-disabled?>
//     <button data-ds="button" data-part="action" data-loading?>       the main action
//     <button data-ds="icon-button" data-part="trigger" aria-haspopup="menu"
//             aria-expanded data-state="open|closed" aria-label="More publish options">
//   <body>
//     <div data-ds="theme" data-menu-layer>                              the DropdownMenu layer
//       <div data-ds="dropdown-menu" data-part="menu" role="menu">       the menu, its own root
//
// Keys: Tab reaches the action, then the trigger. Enter and Space run the
// action. On the trigger, Enter, Space and ArrowDown open the menu with focus
// on the first item, ArrowUp with focus on the last (DropdownMenuTrigger),
// and Escape in the menu closes it and returns focus to the trigger.
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import type { Emphasis, Shape, Size, Tone } from '@the-system/shared';
import { Button } from '../Button';
import type { ButtonSlotContent } from '../Button/ButtonBase';
import { useButtonGroup } from '../ButtonGroup/ButtonGroupContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, type DropdownMenuSize } from '../DropdownMenu';
import { IconButton } from '../IconButton';

export type SplitButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type SplitButtonTone = Extract<Tone, 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
/** No link: a link has no fill to split. */
export type SplitButtonEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type SplitButtonShape = Extract<Shape, 'default' | 'pill' | 'square'>;

export interface SplitButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onClick' | 'children' | 'role'> {
  /** The visible text of the main action. English: a verb plus a noun ("Publish page"). Arabic: a noun form. */
  label: ReactNode;
  /**
   * The accessible name of the menu trigger, set as its `aria-label`. It names
   * the menu, never only "More": "More publish options". Required.
   */
  menuLabel: string;
  /** Runs the main action: click, Enter and Space on the action half. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The menu: DropdownMenuItems, the related actions. One to seven. */
  children: ReactNode;
  /** Leading content of the action: a system icon name or a node. */
  start?: ButtonSlotContent;
  /** Both halves. Default md. The menu rows are sm for xs and sm, md for md and lg. */
  size?: SplitButtonSize;
  /** Both halves. Default neutral. accent with solid is the primary action. */
  tone?: SplitButtonTone;
  /** Both halves. Default soft, as Button. */
  emphasis?: SplitButtonEmphasis;
  /** Both halves; only the outer corners take it. Default default. */
  shape?: SplitButtonShape;
  /** The action is in flight: the action shows the spinner and blocks; the menu stays usable. Sets data-loading on the action. */
  loading?: boolean;
  /** The words the hidden status says while loading. Default "Loading". Arabic: "جار التحميل". */
  loadingLabel?: string;
  /** Blocks both halves. They stay focusable with aria-disabled. Sets data-disabled on the root and both halves. */
  disabled?: boolean;
  /** Controlled open state of the menu, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
  /** The action button, for focus. */
  actionRef?: Ref<HTMLButtonElement>;
}

/** Menu rows follow the control: small controls get small rows. */
function menuSizeFor(size: SplitButtonSize): DropdownMenuSize {
  return size === 'xs' || size === 'sm' ? 'sm' : 'md';
}

/**
 * A main action with a menu of related actions behind a chevron trigger.
 * Both halves share size, tone, emphasis and shape and read as one control;
 * the menu opens under it, aligned to its inline end.
 */
export function SplitButton({
  label,
  menuLabel,
  onClick,
  children,
  start,
  size,
  tone = 'neutral',
  emphasis,
  shape,
  loading = false,
  loadingLabel,
  disabled = false,
  open,
  defaultOpen,
  onOpenChange,
  actionRef,
  ...rest
}: SplitButtonProps) {
  // Inside a ButtonGroup the group axes fill what is unset, as on a Button.
  const group = useButtonGroup();
  const s: SplitButtonSize = size ?? group?.size ?? 'md';
  const em: SplitButtonEmphasis = emphasis ?? group?.emphasis ?? 'soft';
  const sh: SplitButtonShape = shape ?? group?.shape ?? 'default';
  const axes = { size: s, tone, emphasis: em, shape: sh, disabled };

  return (
    <div
      {...rest}
      data-ds="split-button"
      data-size={s}
      data-tone={tone}
      data-emphasis={em}
      data-shape={sh}
      data-disabled={disabled ? '' : undefined}
    >
      <Button
        {...axes}
        ref={actionRef}
        data-part="action"
        start={start}
        loading={loading}
        loadingLabel={loadingLabel}
        onClick={onClick}
      >
        {label}
      </Button>
      <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} size={menuSizeFor(s)}>
        <DropdownMenuTrigger>
          <IconButton {...axes} data-part="trigger" icon="chevron-down" label={menuLabel} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-part="menu">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
