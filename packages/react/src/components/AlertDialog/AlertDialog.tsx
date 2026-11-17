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
//           <fieldset data-ds="fieldset" data-part="body" data-variant="inset">   order M9.6, optional
//             <legend data-part="legend"><span data-visually-hidden>
//             <div data-part="body"><Field><Input variant="plain"></div>
//           <div data-part="footer">
//             <button data-ds="button" data-part="cancel" data-dialog-cancel>
//             <button data-ds="button" data-part="action" data-primary>
//
// Focus opens on Cancel in every tone (the focus rule read as danger), so
// Enter never runs the action by accident. With a body of fields (order
// M9.6, proposed) focus opens on the first field instead: the focus rule
// takes the first field of the body part before the tone is read.
//
// Order M9.6 (proposed): the body part (AlertDialogBody) holds one or two
// fields as rows of an inset Fieldset. It is the Fieldset root, carrying
// the alert's body part. Its legend names the group for a screen reader and
// is visually hidden: the title above is the visible heading. The default
// action (AlertDialogAction primary) carries data-primary and is a solid
// Button, tone accent, or danger in a danger alert. Return in a body field
// runs it. With requiresValue it is aria-disabled while the first field of
// the body is empty, and Return does nothing then.
//
// Optional parts (order 1.29, Dialog's pattern): a style that lists
// `titlebar` under `optionalParts["alert-dialog"]` in its style.json gets a
// TitleBar at the top of the panel, with the title inside it (lifted from a
// direct AlertDialogTitle child or the title prop, still the accessible
// name). With `controls` as well the bar holds WindowControls: the close
// light cancels (as Escape and Cancel do), the other two are inert.
//
//           <div data-part="titlebar" data-ds="title-bar">        optional part
//             <div data-part="controls"><WindowControls/></div>   optional part
//             <h2 data-part="title"><span data-dialog-title>...</span></h2>
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AlertDialog as RadixAlertDialog } from 'radix-ui';
import { DIALOG_FIELD_SELECTOR, type OverlaySize, type Tone } from '@the-system/shared';
import { Icon, type IconName } from '../Icon';
import { Fieldset, type FieldsetProps } from '../Fieldset';
import { useOptionalPart, useTheme } from '../../theme/hooks';
import { TitleBar } from '../TitleBar';
import { WindowControls } from '../WindowControls';
import { useControllable } from '../../internal/useControllable';
import { DialogBase, assignRef, type DialogBaseState } from '../Dialog/DialogBase';

export type AlertDialogSize = Extract<OverlaySize, 'sm' | 'md'>;
export type AlertDialogTone = Extract<Tone, 'neutral' | 'danger'>;

interface AlertDialogContextValue extends DialogBaseState {
  size: AlertDialogSize;
  tone: AlertDialogTone;
  /** Whether the first field of the body holds a value; null with no field in the body. */
  filled: boolean | null;
  setFilled: (filled: boolean | null) => void;
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
  const [filled, setFilled] = useState<boolean | null>(null);
  const value = useMemo<AlertDialogContextValue>(
    () => ({ open, setOpen, size, tone, dismissible, triggerRef, filled, setFilled }),
    [open, setOpen, size, tone, dismissible, filled],
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

/** Where a title renders: in place, or inside the optional title bar's heading. */
const AlertTitleSlot = createContext<'panel' | 'titlebar'>('panel');

const alertLabels = {
  en: { controls: 'Alert controls', close: 'Cancel', minimize: 'Minimize alert', zoom: 'Zoom alert' },
  ar: { controls: 'أزرار التنبيه', close: 'إلغاء', minimize: 'تصغير التنبيه', zoom: 'تكبير التنبيه' },
} as const;

/** The question, naming the action and its object: Delete the board Spring launch? It names the alert dialog. */
export function AlertDialogTitle({ children, ...props }: AlertDialogTitleProps) {
  if (use(AlertTitleSlot) === 'titlebar') {
    // Inside the title bar heading (TitleBar renders the h2 and its part).
    return (
      <RadixAlertDialog.Title asChild>
        <span {...(props as ComponentProps<'span'>)} data-dialog-title="">
          {children}
        </span>
      </RadixAlertDialog.Title>
    );
  }
  return (
    <RadixAlertDialog.Title {...props} data-part="title">
      {children}
    </RadixAlertDialog.Title>
  );
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
  /**
   * The default action (order M9.6, proposed). Stamps data-primary, makes
   * the Button solid, tone accent (danger in a danger alert) unless the
   * Button sets its own, and Return in a body field runs it. One per alert.
   * Default false.
   */
  primary?: boolean;
  /**
   * The action needs a value: it is aria-disabled while the first field of
   * the body is empty, so neither a press nor Return runs it. No effect
   * without a body. Default false.
   */
  requiresValue?: boolean;
}

/** The action that cannot be undone, or with primary, the default answer. */
export function AlertDialogAction({ children, primary = false, requiresValue = false, ...rest }: AlertDialogActionProps) {
  const ctx = useAlertDialogContext('AlertDialogAction');
  const own = children.props as { emphasis?: unknown; tone?: unknown; disabled?: boolean };
  const blocked = requiresValue && ctx.filled === false;
  // The Button's own emphasis and tone win; the default action only fills in what it leaves out.
  const child =
    primary || blocked
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          ...(primary
            ? { emphasis: own.emphasis ?? 'solid', tone: own.tone ?? (ctx.tone === 'danger' ? 'danger' : 'accent') }
            : null),
          ...(blocked ? { disabled: true } : null),
        })
      : children;
  return (
    <RadixAlertDialog.Action {...rest} data-part="action" data-primary={primary ? '' : undefined} asChild>
      {child}
    </RadixAlertDialog.Action>
  );
}

// ------------------------------------------------------------------ AlertDialogBody

export interface AlertDialogBodyProps extends Omit<FieldsetProps, 'legend' | 'variant' | 'description' | 'error' | 'size'> {
  /**
   * The name of the group of fields (Folder details), read with the first
   * field. Required. Visually hidden: the alert's title is the visible
   * heading.
   */
  legend: ReactNode;
  /** One or two Fields, each with an Input variant plain: the rows of the inset group. */
  children?: ReactNode;
}

/** A body is a field only when it is an input that takes text (not a button or a check). */
function isTextField(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'range', 'color', 'hidden'].includes(el.type);
}

/**
 * The body of an alert with fields (order M9.6, proposed): an inset
 * Fieldset whose root is the alert's body part. Focus opens on its first
 * field. Return in a field runs the primary action, unless it is
 * aria-disabled.
 */
export function AlertDialogBody({ legend, children, onKeyDown, onInput, ref, ...rest }: AlertDialogBodyProps) {
  const ctx = useAlertDialogContext('AlertDialogBody');
  const { setFilled } = ctx;
  const node = useRef<HTMLFieldSetElement | null>(null);
  const setRef = useCallback(
    (el: HTMLFieldSetElement | null) => {
      node.current = el;
      assignRef(ref, el);
    },
    [ref],
  );
  const read = useCallback(() => {
    const field = node.current?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(DIALOG_FIELD_SELECTOR);
    setFilled(field ? field.value.trim() !== '' : null);
  }, [setFilled]);
  // A controlled value, a reset or the clear button can change it with no input event: read it after every render.
  useLayoutEffect(read);
  useEffect(() => () => setFilled(null), [setFilled]);
  return (
    <Fieldset
      {...rest}
      ref={setRef}
      data-part="body"
      variant="inset"
      legend={<span data-visually-hidden="">{legend}</span>}
      onInput={(event) => {
        onInput?.(event);
        read();
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLFieldSetElement>) => {
        onKeyDown?.(event);
        if (event.key !== 'Enter' || event.defaultPrevented) return;
        // The key that ends an IME composition is not a command; a modifier asks for something else.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
        if (!isTextField(event.target)) return;
        const panel = event.currentTarget.closest('[data-part="panel"]');
        const primary = panel?.querySelector<HTMLElement>('[data-part="action"][data-primary]');
        if (!primary) return;
        event.preventDefault();
        if (primary.getAttribute('aria-disabled') === 'true') return;
        primary.click();
      }}
    >
      {children}
    </Fieldset>
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
  /** AlertDialogTitle, AlertDialogDescription, AlertDialogBody (order M9.6), AlertDialogFooter. */
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
  const theme = useTheme();
  const titlebarOn = useOptionalPart('alert-dialog', 'titlebar');
  const controlsOn = useOptionalPart('alert-dialog', 'controls');
  // A title child wins over the title prop, and a description child over the description prop: one of each.
  const childTypes = Children.toArray(children).map((child) => (isValidElement(child) ? child.type : null));
  const hasTitle = childTypes.includes(AlertDialogTitle);
  // With the title bar on, the first direct title child (or the title prop) moves into the bar.
  let barTitle: ReactNode = null;
  let restChildren: ReactNode = children;
  if (titlebarOn) {
    const kept: ReactNode[] = [];
    for (const child of Children.toArray(children)) {
      if (!barTitle && isValidElement(child) && child.type === AlertDialogTitle) barTitle = child;
      else kept.push(child);
    }
    if (!barTitle && title !== undefined && title !== null) barTitle = <AlertDialogTitle>{title}</AlertDialogTitle>;
    restChildren = kept;
  }
  const words = theme.lang === 'ar' || theme.lang.startsWith('ar-') ? alertLabels.ar : alertLabels.en;
  const titlebar = titlebarOn ? (
    <TitleBar
      data-part="titlebar"
      as={barTitle ? 'h2' : 'div'}
      title={<AlertTitleSlot value="titlebar">{barTitle}</AlertTitleSlot>}
      controls={
        controlsOn ? (
          <WindowControls
            label={words.controls}
            closeLabel={words.close}
            minimizeLabel={words.minimize}
            zoomLabel={words.zoom}
            onClose={() => ctx.setOpen(false)}
            closeDisabled={!ctx.dismissible}
          />
        ) : undefined
      }
    />
  ) : null;
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
      {titlebar}
      {iconNode}
      {!titlebarOn && !hasTitle && title !== undefined && title !== null ? <AlertDialogTitle>{title}</AlertDialogTitle> : null}
      {!hasDescription && description !== undefined && description !== null ? (
        <AlertDialogDescription>{description}</AlertDialogDescription>
      ) : null}
      {restChildren}
    </DialogBase>
  );
}
