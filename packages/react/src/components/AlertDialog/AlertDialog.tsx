'use client';
// AlertDialog: a modal question about an action that cannot be undone. Built
// on Radix AlertDialog (role alertdialog, focus trap, Escape cancels, no
// close on an outside click) through DialogBase (the themed portal, the
// focus rule and return, toasts above, Dialog.css).
//
// Sources: GoBanana `components/studio/Dialog.tsx` (the danger tone, Cancel
// first and focused) and the account deletion confirm of batch 4 (the action
// names the consequence). No close part: Cancel is the way out, so the
// person always answers the question.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>          the portal Theme
//       <div data-ds="alert-dialog" data-size data-tone data-state>
//         <div data-part="backdrop">                   Radix Overlay
//         <div data-part="panel" role="alertdialog">   Radix Content
//           <span data-part="icon"><svg data-ds="icon"></span>
//           <h2 data-part="title">
//           <p data-part="description">
//           <div data-part="footer">
//             <button data-ds="button" data-part="cancel" data-dialog-cancel>
//             <button data-ds="button" data-part="action">
//
// Focus opens on Cancel in every tone (the focus rule read as danger), so
// Enter never runs the action by accident.
import { Children, createContext, isValidElement, use, useCallback, useMemo, useRef, type ComponentProps, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { AlertDialog as RadixAlertDialog } from 'radix-ui';
import type { OverlaySize, Tone } from '@the-system/shared';
import { Icon, type IconName } from '../Icon';
import { useControllable } from '../Window/useControllable';
import { DialogBase, assignRef, type DialogBaseState } from '../Dialog/DialogBase';

export type AlertDialogSize = Extract<OverlaySize, 'sm' | 'md'>;
export type AlertDialogTone = Extract<Tone, 'neutral' | 'danger'>;

interface AlertDialogContextValue extends DialogBaseState {
  size: AlertDialogSize;
  tone: AlertDialogTone;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(name: string): AlertDialogContextValue {
  const ctx = use(AlertDialogContext);
  if (!ctx) throw new Error(`${name} must be used inside an AlertDialog.`);
  return ctx;
}

// ------------------------------------------------------------------ AlertDialog

export interface AlertDialogProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for Escape, Cancel and the action. */
  onOpenChange?: (open: boolean) => void;
  /** The width, from the dialog.width tokens: sm 360, md 440 px. Default md. */
  size?: AlertDialogSize;
  /** danger: the action destroys something. The title and the icon take the danger color. Default neutral. */
  tone?: AlertDialogTone;
  /**
   * false: Escape does nothing. Use it while the action runs, with the
   * action Button loading. Default true.
   */
  dismissible?: boolean;
  children?: ReactNode;
}

/** The root: state and the variant axes. Renders no element of its own. */
export function AlertDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  tone = 'neutral',
  dismissible = true,
  children,
}: AlertDialogProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<AlertDialogContextValue>(
    () => ({ open, setOpen, size, tone, dismissible, triggerRef }),
    [open, setOpen, size, tone, dismissible],
  );
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialogContext value={value}>{children}</AlertDialogContext>
    </RadixAlertDialog.Root>
  );
}

// ------------------------------------------------------------------ AlertDialogTrigger

export interface AlertDialogTriggerProps extends Omit<ComponentProps<typeof RadixAlertDialog.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button, that opens the alert dialog. */
  children: ReactElement;
}

/** Opens the alert dialog. Renders its child, a Button. Focus returns to it on close. */
export function AlertDialogTrigger({ children, ref, ...rest }: AlertDialogTriggerProps) {
  const ctx = useAlertDialogContext('AlertDialogTrigger');
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      ctx.triggerRef.current = node;
      assignRef(ref, node);
    },
    [ctx.triggerRef, ref],
  );
  return (
    <RadixAlertDialog.Trigger {...rest} ref={setRef} asChild>
      {children}
    </RadixAlertDialog.Trigger>
  );
}

// ------------------------------------------------------------------ parts

export type AlertDialogTitleProps = ComponentProps<'h2'>;

/** The question, naming the action and its object: Delete the board Spring launch? It names the alert dialog. */
export function AlertDialogTitle(props: AlertDialogTitleProps) {
  return <RadixAlertDialog.Title {...props} data-part="title" />;
}

export type AlertDialogDescriptionProps = ComponentProps<'p'>;

/** What cannot be undone, in one or two sentences. It describes the alert dialog. */
export function AlertDialogDescription(props: AlertDialogDescriptionProps) {
  return <RadixAlertDialog.Description {...props} data-part="description" />;
}

export type AlertDialogFooterProps = ComponentProps<'div'>;

/** Cancel first, the action last, at the inline end. */
export function AlertDialogFooter(props: AlertDialogFooterProps) {
  return <div {...props} data-part="footer" />;
}

export interface AlertDialogCancelProps extends Omit<ComponentProps<typeof RadixAlertDialog.Cancel>, 'asChild' | 'children'> {
  /** One element, a system Button: the safe answer (Keep board). Focus opens on it. */
  children: ReactElement;
}

/** The safe answer. Closes the alert dialog and takes focus when it opens. */
export function AlertDialogCancel({ children, ...rest }: AlertDialogCancelProps) {
  useAlertDialogContext('AlertDialogCancel');
  return (
    <RadixAlertDialog.Cancel {...rest} data-part="cancel" data-dialog-cancel="" asChild>
      {children}
    </RadixAlertDialog.Cancel>
  );
}

export interface AlertDialogActionProps extends Omit<ComponentProps<typeof RadixAlertDialog.Action>, 'asChild' | 'children'> {
  /**
   * One element, a system Button that names the consequence (Delete board).
   * It closes the alert dialog on click; call event.preventDefault() in
   * onClick to keep it open while the action runs, then close it from code.
   */
  children: ReactElement;
}

/** The action that cannot be undone. */
export function AlertDialogAction({ children, ...rest }: AlertDialogActionProps) {
  useAlertDialogContext('AlertDialogAction');
  return (
    <RadixAlertDialog.Action {...rest} data-part="action" asChild>
      {children}
    </RadixAlertDialog.Action>
  );
}

// ------------------------------------------------------------------ AlertDialogContent

/** The default icon per tone. */
const toneIcon: Record<AlertDialogTone, IconName> = { neutral: 'info', danger: 'warning' };

export interface AlertDialogContentProps
  extends Omit<
    ComponentProps<typeof RadixAlertDialog.Content>,
    'title' | 'asChild' | 'forceMount' | 'className' | 'style' | 'children'
  > {
  /** The title, for the common case. The same as an AlertDialogTitle child. */
  title?: ReactNode;
  /** The description, for the common case. The same as an AlertDialogDescription child. */
  description?: ReactNode;
  /**
   * The icon above the title: a system icon name or a node. Default info,
   * warning for tone danger. false shows none. It is decoration: hidden from
   * assistive tech.
   */
  icon?: IconName | ReactElement | false;
  /** AlertDialogTitle, AlertDialogDescription, AlertDialogFooter. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/**
 * The portal, the backdrop and the panel (role alertdialog). The root
 * (`data-ds="alert-dialog"`) carries data-size, data-tone and data-state.
 * `ref` and the Radix Content props go to the panel; className, style and
 * rootProps go to the root.
 */
export function AlertDialogContent({
  title,
  description,
  icon,
  children,
  className,
  style,
  rootProps,
  ref,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onKeyDown,
  onFocusOutside,
  ...rest
}: AlertDialogContentProps) {
  const ctx = useAlertDialogContext('AlertDialogContent');
  // A title child wins over the title prop, and a description child over the description prop: one of each.
  const childTypes = Children.toArray(children).map((child) => (isValidElement(child) ? child.type : null));
  const hasTitle = childTypes.includes(AlertDialogTitle);
  const hasDescription = childTypes.includes(AlertDialogDescription);
  const iconValue = icon === undefined ? toneIcon[ctx.tone] : icon;
  const iconNode =
    iconValue === false ? null : (
      <span data-part="icon" aria-hidden="true">
        {isValidElement(iconValue) ? iconValue : <Icon name={iconValue as IconName} size="lg" />}
      </span>
    );
  return (
    <DialogBase
      state={ctx}
      kind="alert-dialog"
      devName="AlertDialog"
      rootAttributes={{ 'data-size': ctx.size, 'data-tone': ctx.tone }}
      focusTone="danger"
      Backdrop={RadixAlertDialog.Overlay}
      Panel={RadixAlertDialog.Content}
      panelProps={rest}
      panelRef={ref}
      className={className}
      style={style}
      rootProps={rootProps}
      onOpenAutoFocus={onOpenAutoFocus}
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={onEscapeKeyDown}
      onKeyDown={onKeyDown}
      onFocusOutside={onFocusOutside}
    >
      {iconNode}
      {!hasTitle && title !== undefined && title !== null ? <AlertDialogTitle>{title}</AlertDialogTitle> : null}
      {!hasDescription && description !== undefined && description !== null ? (
        <AlertDialogDescription>{description}</AlertDialogDescription>
      ) : null}
      {children}
    </DialogBase>
  );
}
