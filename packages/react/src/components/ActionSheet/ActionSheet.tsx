'use client';
// ActionSheet: a short list of actions on one object, opened from the
// control that names the object (a more button, a row's menu button). It is
// not a question (that is AlertDialog) and not a menu of commands that stay
// on screen (that is DropdownMenu): the person picks one action or cancels.
//
// Order M9.10 (proposed). Built on DialogBase (the themed portal, the focus
// return, toasts above, the refused nudge) with one of two Radix
// primitives, chosen when it opens by its placement:
//
// - anchored: Radix Popover, modal. Popper places the card next to its
//   trigger and keeps it on screen (flip, shift, collision padding, the
//   available height). The default on ios, where the card sits over the
//   corner of the control that opened it, and on web and macos when there is
//   room beside the trigger.
// - bottom: Radix Dialog. A sheet of text rows at the bottom edge. The
//   default on android.
// - center: Radix Dialog. A card in the middle, like an alert. The default
//   on web and macos when there is no room beside the trigger, and the
//   fallback when an anchored sheet has no trigger.
//
// Each primitive gives the focus trap, Escape, an outside press that cancels,
// the page hidden from assistive tech and the scroll lock. The root carries
// data-placement, so the CSS draws each form; the placement never changes
// while the sheet is open.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>                 the portal Theme
//       <div data-ds="action-sheet" data-state data-placement>
//         <div data-part="backdrop">                          transparent when anchored
//         <div data-radix-popper-content-wrapper>             anchored only (Radix)
//           <div data-part="panel" role="dialog | alertdialog">
//             <h2 data-part="title">
//             <p data-part="description">
//             <div data-part="actions">
//               <button data-ds="button" data-part="action" data-tone>
//               <button data-ds="button" data-part="cancel" data-dialog-cancel>
//
// Cancel is always the last item of the actions part: one list, no separate
// group, drawn quieter than the actions. With no ActionSheetCancel child the
// content adds one with the built in word (Cancel, إلغاء).
//
// Focus (manifest a11y.focus): role alertdialog and focus on Cancel when an
// action is tone danger, so Enter never runs it by accident; else role
// dialog and focus on the first action that is not disabled. Up and Down
// move between the items and wrap, Home and End go to the ends, Tab moves
// through them inside the sheet, Escape cancels. Focus returns to the
// trigger.
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as RadixDialog, Popover as RadixPopover } from 'radix-ui';
import type { Tone } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { Button, type ButtonProps } from '../Button';
import { DialogBase, assignRef, type DialogBaseState, type DialogKind } from '../Dialog/DialogBase';
import { isArabic } from '../Popover/FloatingLayer';

/** Where the sheet sits. */
export type ActionSheetPlacement = 'anchored' | 'bottom' | 'center';
/** auto picks the placement from the platform and the room beside the trigger. */
export type ActionSheetPlacementChoice = 'auto' | ActionSheetPlacement;
/** The tone of one action: danger for one that deletes or removes. */
export type ActionSheetActionTone = Extract<Tone, 'neutral' | 'danger'>;

/**
 * The room an anchored sheet needs on web and macos, in CSS px: the viewport
 * at least this wide, and at least this much height above or below the
 * trigger. Less than that, it opens in the center.
 */
export const ACTION_SHEET_ROOM = { inline: 360, block: 280 } as const;
/** The gap between the trigger and an anchored card on web and macos, and the space it keeps from the viewport edges. */
const GAP = 8;
const COLLISION_PADDING = 16;

/** Where an anchored card goes, worked out when the sheet opens. */
interface Resolved {
  placement: ActionSheetPlacement;
  /** The gap from the trigger. Negative on ios: the card covers the control it grew from. */
  offset: number;
  align: 'start' | 'end';
}

const centered: Resolved = { placement: 'center', offset: GAP, align: 'end' };

/**
 * The placement for a choice, a platform and a trigger. Pure apart from the
 * trigger's box and its window's size, read once when the sheet opens.
 */
export function resolveActionSheetPlacement(
  choice: ActionSheetPlacementChoice,
  platform: string,
  trigger: HTMLElement | null,
  dir: string = 'ltr',
): Resolved {
  const view = trigger?.isConnected ? trigger.ownerDocument.defaultView : null;
  const anchorable = view !== null && trigger !== null;
  if (choice === 'bottom' || (choice === 'auto' && platform === 'android')) return { ...centered, placement: 'bottom' };
  if (choice === 'center' || !anchorable) return centered;
  const rect = trigger.getBoundingClientRect();
  const width = view.innerWidth;
  const height = view.innerHeight;
  if (choice === 'auto' && platform !== 'ios') {
    const room = Math.max(rect.top, height - rect.bottom) - COLLISION_PADDING;
    if (width < ACTION_SHEET_ROOM.inline || room < ACTION_SHEET_ROOM.block) return centered;
  }
  // The card lines up with the trigger's outer edge: the edge of the half of the screen it sits in.
  const rightHalf = rect.left + rect.width / 2 > width / 2;
  const align = rightHalf !== (dir === 'rtl') ? 'end' : 'start';
  const offset = platform === 'ios' ? -Math.round(rect.height) : GAP;
  return { placement: 'anchored', offset, align };
}

interface ActionSheetContextValue extends DialogBaseState {
  placement: ActionSheetPlacement;
  offset: number;
  align: 'start' | 'end';
  panelId: string;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

function useActionSheetContext(name: string): ActionSheetContextValue {
  const ctx = use(ActionSheetContext);
  if (!ctx) throw new Error(`${name} must be used inside an ActionSheet.`);
  return ctx;
}

// ------------------------------------------------------------------ ActionSheet

export interface ActionSheetProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for an action, Cancel, Escape and a press outside. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Where the sheet sits. auto (default): anchored to the trigger on ios, a
   * bottom sheet on android, anchored on web and macos when there is room
   * beside the trigger, else in the center. Stamped as data-placement,
   * resolved when it opens.
   */
  placement?: ActionSheetPlacementChoice;
  /** false: Escape and a press outside do nothing, while an action runs. Default true. */
  dismissible?: boolean;
  children?: ReactNode;
}

/** The root: state and placement. Renders no element of its own. */
export function ActionSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement: choice = 'auto',
  dismissible = true,
  children,
}: ActionSheetProps) {
  const theme = useTheme();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelId = useId();
  // The placement is read once, when the sheet opens, and held while it is open.
  const [held, setHeld] = useState<{ open: boolean; resolved: Resolved }>(() => ({
    open,
    resolved: open ? resolveActionSheetPlacement(choice, theme.platform, null, theme.dir) : centered,
  }));
  let resolved = held.resolved;
  if (held.open !== open) {
    resolved = open ? resolveActionSheetPlacement(choice, theme.platform, triggerRef.current, theme.dir) : held.resolved;
    setHeld({ open, resolved });
  }
  const anchored = resolved.placement === 'anchored';
  const value = useMemo<ActionSheetContextValue>(
    () => ({ open, setOpen, dismissible, triggerRef, panelId, ...resolved }),
    [open, setOpen, dismissible, panelId, resolved],
  );
  const onPrimitiveChange = useCallback((next: boolean) => setOpen(next), [setOpen]);
  return (
    <RadixPopover.Root open={open && anchored} onOpenChange={onPrimitiveChange} modal>
      <RadixDialog.Root open={open && !anchored} onOpenChange={onPrimitiveChange}>
        <ActionSheetContext value={value}>{children}</ActionSheetContext>
      </RadixDialog.Root>
    </RadixPopover.Root>
  );
}

// ------------------------------------------------------------------ ActionSheetTrigger

export interface ActionSheetTriggerProps {
  /** One element, a system Button or IconButton that names the object (More options for Spring launch). */
  children: ReactElement;
  ref?: ComponentProps<'button'>['ref'];
}

/**
 * Opens the sheet. Renders its child, with aria-haspopup dialog,
 * aria-expanded and aria-controls. An anchored sheet is placed next to it,
 * and focus returns to it on close.
 */
export function ActionSheetTrigger({ children, ref }: ActionSheetTriggerProps) {
  const ctx = useActionSheetContext('ActionSheetTrigger');
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      ctx.triggerRef.current = node;
      assignRef(ref, node as HTMLButtonElement | null);
    },
    [ctx.triggerRef, ref],
  );
  return (
    <RadixPopover.Anchor
      asChild
      ref={setRef}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.panelId : undefined}
      data-state={ctx.open ? 'open' : 'closed'}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        // The child's own onClick runs first; it may keep the sheet shut.
        if (event.defaultPrevented) return;
        ctx.setOpen(!ctx.open);
      }}
    >
      {children}
    </RadixPopover.Anchor>
  );
}

// ------------------------------------------------------------------ actions

export interface ActionSheetActionProps extends Omit<ButtonProps, 'emphasis' | 'tone' | 'size' | 'fullWidth' | 'wrap' | 'shape'> {
  /** danger: the action deletes or removes. The sheet becomes an alertdialog and focus opens on Cancel. Default neutral. */
  tone?: ActionSheetActionTone;
  /** The label: a verb plus a noun (Duplicate board). Arabic: a noun form (نسخ اللوحة). */
  children?: ReactNode;
}

/** The look of the items for a placement: rows of text at the bottom, capsules elsewhere. */
function itemEmphasis(placement: ActionSheetPlacement): ButtonProps['emphasis'] {
  return placement === 'bottom' ? 'ghost' : 'soft';
}

/** One action. A press runs onClick, then closes the sheet unless onClick called event.preventDefault(). */
export function ActionSheetAction({ tone = 'neutral', onClick, children, ...rest }: ActionSheetActionProps) {
  const ctx = useActionSheetContext('ActionSheetAction');
  return (
    <Button
      {...rest}
      data-part="action"
      tone={tone}
      emphasis={itemEmphasis(ctx.placement)}
      size="lg"
      fullWidth
      wrap
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.setOpen(false);
      }}
    >
      {children}
    </Button>
  );
}

const cancelWords = { en: 'Cancel', ar: 'إلغاء' } as const;

export interface ActionSheetCancelProps extends Omit<ButtonProps, 'emphasis' | 'tone' | 'size' | 'fullWidth' | 'wrap' | 'shape' | 'start' | 'end'> {
  /** The label. Default Cancel, إلغاء in Arabic. */
  children?: ReactNode;
}

/** Closes the sheet and runs nothing. Always the last item. */
export function ActionSheetCancel({ onClick, children, ...rest }: ActionSheetCancelProps) {
  const ctx = useActionSheetContext('ActionSheetCancel');
  const theme = useTheme();
  return (
    <Button
      {...rest}
      data-part="cancel"
      data-dialog-cancel=""
      emphasis="ghost"
      size="lg"
      fullWidth
      wrap
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.setOpen(false);
      }}
    >
      {children ?? (isArabic(theme.lang) ? cancelWords.ar : cancelWords.en)}
    </Button>
  );
}

// ------------------------------------------------------------------ ActionSheetContent

/** Flattens fragments, so actions passed in a fragment still count. */
function flatten(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) out.push(...flatten(child.props.children));
    else out.push(child);
  }
  return out;
}

const ITEM_SELECTOR = ':is([data-part="action"], [data-part="cancel"])';

/** The items of a panel in order, the disabled ones included (they stay focusable). */
function items(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(`[data-part="actions"] > ${ITEM_SELECTOR}`));
}

/**
 * The anchored backdrop: Radix Popover has no overlay, so this one stays
 * mounted while open and until its exit has played (at once when it has no
 * animation, as under reduced motion). It is transparent in the base CSS,
 * takes the press outside the card, and marks the page behind as covered.
 */
function AnchoredBackdrop({ ref, ...props }: ComponentProps<'div'>) {
  const ctx = useActionSheetContext('ActionSheetContent');
  const node = useRef<HTMLDivElement | null>(null);
  const [present, setPresent] = useState(ctx.open);
  if (ctx.open && !present) setPresent(true);
  useLayoutEffect(() => {
    const el = node.current;
    if (ctx.open || !present) return;
    const animation = el && typeof getComputedStyle === 'function' ? getComputedStyle(el).animationName : '';
    if (!el || !animation || animation === 'none') {
      setPresent(false);
      return;
    }
    const done = () => setPresent(false);
    el.addEventListener('animationend', done, { once: true });
    el.addEventListener('animationcancel', done, { once: true });
    return () => {
      el.removeEventListener('animationend', done);
      el.removeEventListener('animationcancel', done);
    };
  }, [ctx.open, present]);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el;
      assignRef(ref, el);
    },
    [ref],
  );
  if (!present) return null;
  return <div {...props} ref={setRef} data-state={ctx.open ? 'open' : 'closed'} />;
}

/** The anchored panel: Radix Popover Content, placed by Popper. */
function AnchoredPanel(props: ComponentProps<typeof RadixPopover.Content>) {
  return <RadixPopover.Content side="bottom" collisionPadding={COLLISION_PADDING} avoidCollisions {...props} />;
}

export interface ActionSheetContentProps
  extends Omit<ComponentProps<'div'>, 'title' | 'children' | 'className' | 'style' | 'role'> {
  /** A short title that names the object (Spring launch). Optional: the trigger often names it already. */
  title?: ReactNode;
  /** One sentence about what the actions do, when a title is not enough. */
  description?: ReactNode;
  /**
   * The accessible name when there is no title: Actions for Spring launch.
   * Read by a screen reader, not shown. A title wins.
   */
  label?: string;
  /** ActionSheetAction children, at most about six; an ActionSheetCancel goes last (one is added when none is given). */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/**
 * The portal, the backdrop and the panel. The root (data-ds action-sheet)
 * carries data-state and data-placement. ref and the other props go to the
 * panel; className, style and rootProps go to the root.
 */
export function ActionSheetContent({
  title,
  description,
  label,
  children,
  className,
  style,
  rootProps,
  ref,
  onKeyDown,
  ...rest
}: ActionSheetContentProps) {
  const ctx = useActionSheetContext('ActionSheetContent');
  const anchored = ctx.placement === 'anchored';
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const list = flatten(children);
  const isCancel = (child: ReactNode) => isValidElement(child) && child.type === ActionSheetCancel;
  const actions = list.filter((child) => !isCancel(child));
  const cancel = list.find(isCancel) ?? <ActionSheetCancel key="cancel" />;
  const danger = actions.some(
    (child) => isValidElement<{ tone?: string }>(child) && child.type === ActionSheetAction && child.props.tone === 'danger',
  );

  const hasTitle = title !== undefined && title !== null && title !== false;
  const hasDescription = description !== undefined && description !== null && description !== false;
  const titleText = hasTitle ? title : label;

  // Dialog form: Radix Title and Description name and describe the panel. Anchored form: our own ids.
  const titleNode =
    titleText === undefined ? null : anchored ? (
      <h2 id={titleId} data-part="title" data-visually-hidden={hasTitle ? undefined : ''}>
        {titleText}
      </h2>
    ) : (
      <RadixDialog.Title data-part="title" data-visually-hidden={hasTitle ? undefined : ''}>
        {titleText}
      </RadixDialog.Title>
    );
  const descriptionNode = !hasDescription ? null : anchored ? (
    <p id={descriptionId} data-part="description">
      {description}
    </p>
  ) : (
    <RadixDialog.Description data-part="description">{description}</RadixDialog.Description>
  );

  const panelProps: Record<string, unknown> = {
    ...rest,
    id: ctx.panelId,
    role: danger ? 'alertdialog' : 'dialog',
  };
  if (anchored) {
    panelProps.side = 'bottom';
    panelProps.align = ctx.align;
    panelProps.sideOffset = ctx.offset;
    if (titleText !== undefined) panelProps['aria-labelledby'] = titleId;
    if (hasDescription) panelProps['aria-describedby'] = descriptionId;
  } else if (!hasDescription) {
    // No description: say so, so Radix neither points at a missing element nor warns.
    panelProps['aria-describedby'] = undefined;
  }

  return (
    <DialogBase
      state={ctx}
      // The dialog family's roots; action-sheet joins them (a line for the lead: add it to DialogKind).
      kind={'action-sheet' as string as DialogKind}
      devName="ActionSheet"
      rootAttributes={{ 'data-placement': ctx.placement }}
      Backdrop={anchored ? AnchoredBackdrop : RadixDialog.Overlay}
      Panel={anchored ? AnchoredPanel : RadixDialog.Content}
      panelProps={panelProps}
      panelRef={setPanelRef}
      className={className}
      style={style}
      rootProps={rootProps}
      onOpenAutoFocus={(event: Event) => {
        // Cancel when an action is destructive, else the first action that can run.
        const panel = panelRef.current;
        if (!panel) return;
        const all = items(panel);
        const cancelEl = all.find((el) => el.getAttribute('data-part') === 'cancel') ?? null;
        const hasDanger = all.some((el) => el.getAttribute('data-tone') === 'danger');
        const firstAction = all.find((el) => el.getAttribute('data-part') === 'action' && el.getAttribute('aria-disabled') !== 'true');
        const target = hasDanger ? (cancelEl ?? firstAction) : (firstAction ?? cancelEl);
        if (!target) return;
        event.preventDefault();
        target.focus({ preventScroll: true });
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const panel = panelRef.current;
        if (!panel || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const all = items(panel);
        if (all.length === 0) return;
        const at = all.indexOf(event.target as HTMLElement);
        let next: number;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = all.length - 1;
        else if (at < 0) next = event.key === 'ArrowDown' ? 0 : all.length - 1;
        else next = (at + (event.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length;
        event.preventDefault();
        all[next]?.focus();
      }}
    >
      {titleNode}
      {descriptionNode}
      <div data-part="actions">
        {actions}
        {cancel}
      </div>
    </DialogBase>
  );
}
