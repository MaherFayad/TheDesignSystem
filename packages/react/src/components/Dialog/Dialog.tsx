'use client';
// Dialog: a modal task that must be finished or dismissed. Built on Radix
// Dialog (focus trap, Escape, scroll lock, aria-modal by hiding the rest of
// the page, focus back to the trigger).
//
// Sources: GoBanana `components/studio/Dialog.tsx` and the `.st-dialog`
// block of `styles/studio-components.css` (sizes sm to 2xl, the header and
// footer bands, the danger tone, focus on the first control, Cancel in a
// confirm), Figma-Killer-2 `ui/components/Dialog` (the backdrop, the close
// button label). GoBanana's `modalStack.ts` is not needed: the Toaster stays
// above and reachable on its own (see Toaster.tsx), and Radix stacks nested
// dialogs.
//
// The DOM, the same in every style except for the optional parts:
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>      the portal Theme, display: contents
//       <div data-ds="dialog" data-size data-tone data-state>   root: the fixed layer
//         <div data-part="backdrop">                Radix Overlay
//         <div data-part="panel" role="dialog">     Radix Content
//           <div data-part="titlebar" data-ds="title-bar">   Desk only (optional part)
//             <div data-part="controls"><WindowControls/></div>   Desk only (optional part)
//             <h2 data-part="title"><span id=title>...</span></h2>
//           <h2 data-part="title">                  Studio: the title in place
//           <button data-part="close">              Studio: the close IconButton
//           <p data-part="description">
//           <div data-part="body">
//           <div data-part="footer">
//
// Why the root is a layer around the backdrop and the panel: the contract
// suite gives a part to the nearest ancestor with data-ds. The portal Theme
// carries data-ds="theme", so a backdrop next to the panel under that Theme
// would belong to the Theme. The root holds both, so every part belongs to
// the dialog. The panel is the Radix Content (role dialog, aria-modal through
// Radix, named by the title): part `panel`. Radix allows Overlay and Content
// as siblings anywhere inside its Root; the portal is our own (the Toaster
// pattern), so the root stays mounted until both have played their exit.
//
// Toasts above the dialog: the Toaster sits on z.toast over z.dialog. The
// outside handlers call isInsideToaster (Toast folder) and keep the dialog
// open when a toast is pressed or focused.
//
// The title in Desk. Desk turns on the optional parts `titlebar` and
// `controls` (style.json `optionalParts.dialog`). The dialog then renders a
// TitleBar at the top of the panel with the traffic lights, only the close
// light working, and the title inside the bar, where a window has it. The
// close IconButton is not rendered: the close light is part `close`.
// DialogContent lifts a DialogTitle that is its direct child (or the `title`
// prop) out of the children and renders it once, at the top: in place in
// Studio, inside the title bar in Desk. Through a context it then renders as
// a span inside the title bar heading, so the Radix title id, and the
// accessible name, stay on the visible text. A DialogTitle nested deeper is
// not lifted and renders where it is.
//
// The themed portal: as in Toaster.tsx, the portal starts with a Theme that
// copies every axis of the Theme the Dialog is rendered in, so the tokens,
// the language and the direction apply inside it, nested themes included.
//
// Motion is CSS only (Dialog.css, pattern "dialog"): data-state open plays
// the enter keyframes, closed plays the exit, and Radix keeps the panel and
// the backdrop mounted until the animation ends. Under reduced motion both
// animations are none, so Radix unmounts at once and nothing waits for an
// animationend.
import {
  Children,
  Fragment,
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
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Dialog as RadixDialog } from 'radix-ui';
import type { Size, Tone } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { useOptionalPart, useTheme } from '../../theme/hooks';
import { IconButton } from '../IconButton';
import { isInsideToaster } from '../Toast/isInsideToaster';
import { TitleBar } from '../TitleBar';
import { WindowControls } from '../WindowControls';
import { useControllable } from '../Window/useControllable';

/**
 * The anatomy contract lets overlays add xl and 2xl to the size words. The
 * shared `Size` type stops at lg, so the two overlay words are added here.
 */
export type DialogSize = Extract<Size, 'sm' | 'md' | 'lg'> | 'xl' | '2xl';
export type DialogTone = Extract<Tone, 'neutral' | 'danger'>;

/** The built in labels, per language. A prop always wins. */
const dialogLabels = {
  en: { close: 'Close dialog', controls: 'Dialog controls', minimize: 'Minimize dialog', zoom: 'Zoom dialog' },
  ar: { close: 'إغلاق النافذة', controls: 'أزرار النافذة', minimize: 'تصغير النافذة', zoom: 'تكبير النافذة' },
} as const;

function labelsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? dialogLabels.ar : dialogLabels.en;
}

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  size: DialogSize;
  tone: DialogTone;
  dismissible: boolean;
  triggerRef: RefObject<HTMLElement | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(name: string): DialogContextValue {
  const ctx = use(DialogContext);
  if (!ctx) throw new Error(`${name} must be used inside a Dialog.`);
  return ctx;
}

/** Where a DialogTitle renders: in place (the panel) or inside the Desk title bar. */
const TitleSlotContext = createContext<'panel' | 'titlebar'>('panel');

/** Sets a ref of any kind. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

// ------------------------------------------------------------------ Dialog

export interface DialogProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for Escape, a backdrop click, the close control and DialogClose. */
  onOpenChange?: (open: boolean) => void;
  /** The width, from the dialog.width tokens: sm 360, md 440, lg 520, xl 640, 2xl 820 px. Default md. */
  size?: DialogSize;
  /**
   * danger: a destructive decision. The title takes the danger color and
   * focus opens on the Cancel action (the DialogClose), never on the
   * destructive one. Default neutral.
   */
  tone?: DialogTone;
  /**
   * false: only the dialog's own actions close it. Escape and a backdrop
   * click do nothing, and the close control is disabled. Use it while an
   * action runs. Default true.
   */
  dismissible?: boolean;
  children?: ReactNode;
}

/** The root: state and the variant axes. Renders no element of its own. */
export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  tone = 'neutral',
  dismissible = true,
  children,
}: DialogProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<DialogContextValue>(
    () => ({ open, setOpen, size, tone, dismissible, triggerRef }),
    [open, setOpen, size, tone, dismissible],
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <DialogContext value={value}>{children}</DialogContext>
    </RadixDialog.Root>
  );
}

// ------------------------------------------------------------------ DialogTrigger

export interface DialogTriggerProps extends Omit<ComponentProps<typeof RadixDialog.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button, that opens the dialog. */
  children: ReactElement;
}

/** Opens the dialog. Renders its child, a Button, as the trigger. Focus returns to it on close. */
export function DialogTrigger({ children, ref, ...rest }: DialogTriggerProps) {
  const ctx = useDialogContext('DialogTrigger');
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      ctx.triggerRef.current = node;
      assignRef(ref, node);
    },
    [ctx.triggerRef, ref],
  );
  return (
    <RadixDialog.Trigger {...rest} ref={setRef} asChild>
      {children}
    </RadixDialog.Trigger>
  );
}

// ------------------------------------------------------------------ DialogClose

export interface DialogCloseProps extends Omit<ComponentProps<typeof RadixDialog.Close>, 'asChild' | 'children'> {
  /** One element, a system Button: the Cancel action. */
  children: ReactElement;
}

/**
 * Closes the dialog. Renders its child, a Button, and marks it
 * `data-dialog-cancel`: in a danger dialog focus opens on it.
 */
export function DialogClose({ children, ...rest }: DialogCloseProps) {
  useDialogContext('DialogClose');
  return (
    <RadixDialog.Close {...rest} data-dialog-cancel="" asChild>
      {children}
    </RadixDialog.Close>
  );
}

// ------------------------------------------------------------------ DialogTitle

export interface DialogTitleProps extends Omit<ComponentProps<'h2'>, 'title'> {
  children?: ReactNode;
}

/**
 * The title: the question being asked. It names the dialog. Put it as a
 * direct child of DialogContent (or use the `title` prop there): it then
 * renders once, at the top, in place in Studio and inside the title bar in
 * Desk.
 */
export function DialogTitle({ children, ...rest }: DialogTitleProps) {
  const slot = use(TitleSlotContext);
  if (slot === 'titlebar') {
    // Inside the title bar heading (TitleBar renders the h2 and its part).
    return (
      <RadixDialog.Title asChild>
        <span {...(rest as ComponentProps<'span'>)} data-dialog-title="">
          {children}
        </span>
      </RadixDialog.Title>
    );
  }
  return (
    <RadixDialog.Title {...rest} data-part="title">
      {children}
    </RadixDialog.Title>
  );
}

// ------------------------------------------------------------------ DialogDescription

export type DialogDescriptionProps = ComponentProps<'p'>;

/** One line under the title that says what happens. It describes the dialog (aria-describedby). */
export function DialogDescription(props: DialogDescriptionProps) {
  return <RadixDialog.Description {...props} data-part="description" />;
}

// ------------------------------------------------------------------ DialogBody

export type DialogBodyProps = ComponentProps<'div'>;

/**
 * The content. It scrolls inside when the dialog reaches its maximum height
 * (dialog.height-max), while the title and the footer stay in view. While it
 * scrolls it joins the tab order, so the keyboard can scroll it.
 */
export function DialogBody({ ref, tabIndex, ...rest }: DialogBodyProps) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [scrolls, setScrolls] = useState(false);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      inner.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return <div {...rest} ref={setRef} tabIndex={tabIndex ?? (scrolls ? 0 : undefined)} data-part="body" />;
}

// ------------------------------------------------------------------ DialogFooter

export type DialogFooterProps = ComponentProps<'div'>;

/** The actions: up to three Buttons at the inline end. Cancel first, the primary action last. */
export function DialogFooter(props: DialogFooterProps) {
  return <div {...props} data-part="footer" />;
}

// ------------------------------------------------------------------ DialogContent

export interface DialogContentProps
  extends Omit<
    ComponentProps<typeof RadixDialog.Content>,
    'title' | 'asChild' | 'forceMount' | 'className' | 'style' | 'children'
  > {
  /** The title, for the common case. The same as a DialogTitle as the first child. */
  title?: ReactNode;
  /** The description, for the common case. The same as a DialogDescription after the title. */
  description?: ReactNode;
  /** Accessible name of the close control. Default "Close dialog" (Arabic under lang ar). */
  closeLabel?: string;
  /** Accessible name of the Desk lights group. Default "Dialog controls". */
  controlsLabel?: string;
  /** DialogTitle, DialogDescription, DialogBody, DialogFooter. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/** Flattens fragments, so a DialogTitle inside a fragment is still a direct child. */
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child],
  );
}

const FIELD = 'input:not([type="hidden"]), select, textarea';
const ACTION = 'button, a[href], [tabindex]:not([tabindex="-1"])';

function usable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.matches(':disabled') || el.closest('[hidden], [inert]')) return false;
  return typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true;
}

function first(scope: Element | null, selector: string, enabledOnly = false): HTMLElement | null {
  if (!scope) return null;
  for (const el of Array.from(scope.querySelectorAll(selector))) {
    if (!usable(el)) continue;
    if (enabledOnly && el.getAttribute('aria-disabled') === 'true') continue;
    return el;
  }
  return null;
}

/**
 * The focus rule (manifest a11y.focus): an element marked data-autofocus;
 * else the first field in the body; else, in a danger dialog, the Cancel
 * action (DialogClose); else the first footer action; else the close
 * control. Null leaves it to Radix (the first tab stop, or the panel).
 */
function initialFocus(panel: HTMLElement, tone: DialogTone): HTMLElement | null {
  const mine = (el: Element | null) => el !== null && el.closest('[data-part="panel"]') === panel;
  const marked = first(panel, '[data-autofocus]');
  if (marked) return marked;
  const body = Array.from(panel.querySelectorAll('[data-part="body"]')).find(mine) ?? null;
  const field = first(body, FIELD);
  if (field) return field;
  if (tone === 'danger') {
    const cancel = first(panel, '[data-dialog-cancel]');
    if (cancel) return cancel;
  }
  const footer = Array.from(panel.querySelectorAll('[data-part="footer"]')).find(mine) ?? null;
  const action = first(footer, ACTION, true) ?? first(footer, ACTION);
  if (action) return action;
  const close = Array.from(panel.querySelectorAll<HTMLElement>('[data-part="close"]')).find(usable);
  return close ?? null;
}

/**
 * The portal, the backdrop and the panel. The root (`data-ds="dialog"`)
 * carries data-size, data-tone and data-state. `ref` and the Radix Content
 * props (aria-*, onOpenAutoFocus, onEscapeKeyDown and the rest) go to the
 * panel, the element with role dialog; className, style and rootProps go to
 * the root.
 */
export function DialogContent({
  title,
  description,
  closeLabel,
  controlsLabel,
  children,
  className,
  style,
  rootProps,
  ref,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  onFocusOutside,
  ...rest
}: DialogContentProps) {
  const ctx = useDialogContext('DialogContent');
  const theme = useTheme();
  const words = labelsFor(theme.lang);
  const titlebarOn = useOptionalPart('dialog', 'titlebar');
  const controlsOn = useOptionalPart('dialog', 'controls');
  const [body, setBody] = useState<HTMLElement | null>(null);

  // The portal needs the document, so it renders after the first commit (safe on the server).
  useEffect(() => setBody(document.body), []);

  // The root stays mounted while open, and until the panel and the backdrop have played their exit.
  const [mounted, setMounted] = useState(ctx.open);
  if (ctx.open && !mounted) setMounted(true);
  const openRef = useRef(ctx.open);
  openRef.current = ctx.open;
  const alive = useRef({ panel: false, backdrop: false });
  const settle = useCallback(() => {
    if (!openRef.current && !alive.current.panel && !alive.current.backdrop) setMounted(false);
  }, []);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      alive.current.panel = node !== null;
      if (node && !returnTo.current) {
        // Where focus goes back when there is no DialogTrigger (a controlled dialog).
        const active = document.activeElement;
        returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
      }
      assignRef(ref, node);
      if (!node) settle();
    },
    [ref, settle],
  );
  const setBackdropRef = useCallback(
    (node: HTMLDivElement | null) => {
      alive.current.backdrop = node !== null;
      if (!node) settle();
    },
    [settle],
  );

  if (!body || !mounted) return null;

  // Lift a DialogTitle that is a direct child, so it renders once at the top.
  let titleNode: ReactNode = title !== undefined && title !== null ? <DialogTitle>{title}</DialogTitle> : null;
  const others: ReactNode[] = [];
  for (const child of flatten(children)) {
    if (!titleNode && isValidElement(child) && child.type === DialogTitle) titleNode = child;
    else others.push(child);
  }
  const descriptionNode =
    description !== undefined && description !== null ? <DialogDescription>{description}</DialogDescription> : null;

  const close = () => ctx.setOpen(false);
  const closeName = closeLabel ?? words.close;
  const closeButton = (
    <RadixDialog.Close asChild>
      <IconButton data-part="close" icon="close" label={closeName} size="sm" disabled={!ctx.dismissible} />
    </RadixDialog.Close>
  );

  const header = titlebarOn ? (
    <TitleBar
      data-part="titlebar"
      as="h2"
      title={<TitleSlotContext value="titlebar">{titleNode}</TitleSlotContext>}
      controls={
        controlsOn ? (
          <WindowControls
            label={controlsLabel ?? words.controls}
            closeLabel={closeName}
            minimizeLabel={words.minimize}
            zoomLabel={words.zoom}
            onClose={ctx.dismissible ? close : undefined}
          />
        ) : undefined
      }
      actions={controlsOn ? undefined : closeButton}
    />
  ) : (
    <>
      {titleNode}
      {closeButton}
    </>
  );

  return createPortal(
    <Theme
      style={theme.style}
      scheme={theme.scheme}
      density={theme.density}
      contrast={theme.contrast}
      platform={theme.platform}
      glass={theme.glass}
      dir={theme.dir}
      lang={theme.lang}
      data-dialog-layer=""
    >
      <div
        {...rootProps}
        className={className}
        style={style}
        data-ds="dialog"
        data-size={ctx.size}
        data-tone={ctx.tone}
        data-state={ctx.open ? 'open' : 'closed'}
      >
        <RadixDialog.Overlay ref={setBackdropRef} data-part="backdrop" />
        <RadixDialog.Content
          {...rest}
          ref={setPanelRef}
          data-part="panel"
          onOpenAutoFocus={(event) => {
            onOpenAutoFocus?.(event);
            if (event.defaultPrevented || !panelRef.current) return;
            const target = initialFocus(panelRef.current, ctx.tone);
            if (!target) return;
            event.preventDefault();
            target.focus();
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            // Back to the trigger, else to what had focus before the dialog opened.
            event.preventDefault();
            const trigger = ctx.triggerRef.current;
            const target = trigger?.isConnected ? trigger : returnTo.current;
            returnTo.current = null;
            if (target?.isConnected) target.focus();
          }}
          onEscapeKeyDown={(event) => {
            onEscapeKeyDown?.(event);
            if (!ctx.dismissible) event.preventDefault();
          }}
          // Working with a toast above the dialog never closes it, and focus may move into the toasts.
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            if (!ctx.dismissible || isInsideToaster(event.target)) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            if (!ctx.dismissible || isInsideToaster(event.target)) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            onFocusOutside?.(event);
            if (isInsideToaster(event.target)) event.preventDefault();
          }}
        >
          {header}
          {descriptionNode}
          {others}
        </RadixDialog.Content>
      </div>
    </Theme>,
    body,
  );
}
