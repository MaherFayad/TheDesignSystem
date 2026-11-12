'use client';
// Drawer: a full height panel over the page, at the inline end or start, for
// a secondary task (filters, details). Built on Radix Dialog through
// DialogBase (the themed portal, the focus rule and return, toasts above,
// Dialog.css). Modal by default; modal={false} leaves the page usable: no
// backdrop, no focus trap, the page keeps scrolling, and a click on the page
// does not close it (Escape and the close control do).
//
// No source: designed from the dials table (PLAN.md 3.7) and Dialog. The
// widths are the dialog width tokens; under breakpoint.phone it fills the
// width. Side start is the right in Arabic (Dialog.css mirrors the slide).
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>
//       <div data-ds="drawer" data-size data-side data-state>
//         <div data-part="backdrop">                 Radix Overlay, modal only
//         <div data-part="panel" role="dialog">      Radix Content
//           <div data-part="header">
//             <h2 data-part="title">
//             <p data-part="description">
//             <button data-ds="close-button" data-part="close">
//           <div data-part="body">                   scrolls
//           <div data-part="footer">
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  use,
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import type { OverlaySize } from '@the-system/shared';
import { useTheme } from '../../theme/hooks';
import { DialogBody, DialogFooter, type DialogBodyProps, type DialogFooterProps } from '../Dialog';
import { DialogBase, assignRef, type DialogBaseState } from '../Dialog/DialogBase';
import { CloseButton } from '../CloseButton';
import { useControllable } from '../../internal/useControllable';

export type DrawerSize = Extract<OverlaySize, 'sm' | 'md' | 'lg' | 'xl'>;
export type DrawerSide = 'start' | 'end';

const drawerLabels = {
  en: { close: 'Close drawer' },
  ar: { close: 'إغلاق الشريط الجانبي' },
} as const;

/** True for Arabic, the language with its own built in labels. */
export function isArabic(lang: string): boolean {
  return lang === 'ar' || lang.startsWith('ar-');
}

interface DrawerContextValue extends DialogBaseState {
  size: DrawerSize;
  side: DrawerSide;
  modal: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(name: string): DrawerContextValue {
  const ctx = use(DrawerContext);
  if (!ctx) throw new Error(`${name} must be used inside a Drawer.`);
  return ctx;
}

// ------------------------------------------------------------------ Drawer

export interface DrawerProps {
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with false for Escape, a backdrop click, the close control and DrawerClose. */
  onOpenChange?: (open: boolean) => void;
  /** The width, from the dialog.width tokens: sm 360, md 440, lg 520, xl 640 px. Full width on phones. Default md. */
  size?: DrawerSize;
  /** The edge it comes from, in reading order: end is the right in English and the left in Arabic. Default end. */
  side?: DrawerSide;
  /**
   * true: a backdrop covers the page, focus stays inside, the page does not
   * scroll. false: the page stays usable next to the drawer. Default true.
   */
  modal?: boolean;
  /** false: only the drawer's own actions close it; Escape and the backdrop do nothing. Default true. */
  dismissible?: boolean;
  children?: ReactNode;
}

/** The root: state and the variant axes. Renders no element of its own. */
export function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 'md',
  side = 'end',
  modal = true,
  dismissible = true,
  children,
}: DrawerProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<DrawerContextValue>(
    () => ({ open, setOpen, size, side, modal, dismissible, triggerRef }),
    [open, setOpen, size, side, modal, dismissible],
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen} modal={modal}>
      <DrawerContext value={value}>{children}</DrawerContext>
    </RadixDialog.Root>
  );
}

// ------------------------------------------------------------------ trigger and close

export interface DrawerTriggerProps extends Omit<ComponentProps<typeof RadixDialog.Trigger>, 'asChild' | 'children'> {
  /** One element, a system Button, that opens the drawer. */
  children: ReactElement;
}

/** Opens the drawer. Renders its child, a Button. Focus returns to it on close. */
export function DrawerTrigger({ children, ref, ...rest }: DrawerTriggerProps) {
  const ctx = useDrawerContext('DrawerTrigger');
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

export interface DrawerCloseProps extends Omit<ComponentProps<typeof RadixDialog.Close>, 'asChild' | 'children'> {
  /** One element, a system Button: Cancel, or Done in a details drawer. */
  children: ReactElement;
}

/** Closes the drawer. Renders its child, a Button, marked data-dialog-cancel. */
export function DrawerClose({ children, ...rest }: DrawerCloseProps) {
  return (
    <RadixDialog.Close {...rest} data-dialog-cancel="" asChild>
      {children}
    </RadixDialog.Close>
  );
}

// ------------------------------------------------------------------ parts

export type DrawerTitleProps = Omit<ComponentProps<'h2'>, 'title'>;

/** The title. It names the drawer. Put it as a direct child of DrawerContent, or use the title prop. */
export function DrawerTitle(props: DrawerTitleProps) {
  return <RadixDialog.Title {...props} data-part="title" />;
}

export type DrawerDescriptionProps = ComponentProps<'p'>;

/** One line under the title. It describes the drawer. */
export function DrawerDescription(props: DrawerDescriptionProps) {
  return <RadixDialog.Description {...props} data-part="description" />;
}

export type DrawerBodyProps = DialogBodyProps;

/** The content. It scrolls inside; while it scrolls it joins the tab order. */
export function DrawerBody(props: DrawerBodyProps) {
  return <DialogBody {...props} />;
}

export type DrawerFooterProps = DialogFooterProps;

/** The actions at the inline end. Cancel first, the primary action last. */
export function DrawerFooter(props: DrawerFooterProps) {
  return <DialogFooter {...props} />;
}

// ------------------------------------------------------------------ header (shared with Sheet)

/** Flattens fragments, so a title inside a fragment is still a direct child. */
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child],
  );
}

/**
 * Builds the header band of a Drawer or a Sheet: the title and the
 * description lifted out of the children (or from props), then the
 * CloseButton. Returns the header and the remaining children.
 */
export function splitHeader(options: {
  children: ReactNode;
  title: ReactNode;
  description: ReactNode;
  Title: (props: { children?: ReactNode }) => ReactNode;
  Description: (props: { children?: ReactNode }) => ReactNode;
  closeLabel: string;
  closeDisabled: boolean;
}): { header: ReactNode; others: ReactNode[] } {
  const { Title, Description } = options;
  let titleNode: ReactNode = options.title !== undefined && options.title !== null ? <Title>{options.title}</Title> : null;
  let descriptionNode: ReactNode =
    options.description !== undefined && options.description !== null ? <Description>{options.description}</Description> : null;
  const others: ReactNode[] = [];
  for (const child of flatten(options.children)) {
    if (!titleNode && isValidElement(child) && child.type === Title) titleNode = child;
    else if (!descriptionNode && isValidElement(child) && child.type === Description) descriptionNode = child;
    else others.push(child);
  }
  const header = (
    <div data-part="header">
      {titleNode}
      {descriptionNode}
      <RadixDialog.Close asChild>
        <CloseButton data-part="close" label={options.closeLabel} size="sm" disabled={options.closeDisabled} />
      </RadixDialog.Close>
    </div>
  );
  return { header, others };
}

// ------------------------------------------------------------------ DrawerContent

export interface DrawerContentProps
  extends Omit<
    ComponentProps<typeof RadixDialog.Content>,
    'title' | 'asChild' | 'forceMount' | 'className' | 'style' | 'children'
  > {
  /** The title, for the common case. The same as a DrawerTitle child. */
  title?: ReactNode;
  /** The description, for the common case. The same as a DrawerDescription child. */
  description?: ReactNode;
  /** Accessible name of the close control. Default "Close drawer" (Arabic under lang ar). */
  closeLabel?: string;
  /** DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/**
 * The portal, the backdrop (modal only) and the panel. The root
 * (`data-ds="drawer"`) carries data-size, data-side and data-state. `ref`
 * and the Radix Content props go to the panel; className, style and
 * rootProps go to the root.
 */
export function DrawerContent({
  title,
  description,
  closeLabel,
  children,
  className,
  style,
  rootProps,
  ref,
  onInteractOutside,
  onFocusOutside,
  ...rest
}: DrawerContentProps) {
  const ctx = useDrawerContext('DrawerContent');
  const theme = useTheme();
  const words = isArabic(theme.lang) ? drawerLabels.ar : drawerLabels.en;
  const { header, others } = splitHeader({
    children,
    title,
    description,
    Title: DrawerTitle,
    Description: DrawerDescription,
    closeLabel: closeLabel ?? words.close,
    closeDisabled: !ctx.dismissible,
  });
  const { onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onPointerDownOutside, onKeyDown, ...panelProps } = rest;
  return (
    <DialogBase
      state={ctx}
      kind="drawer"
      devName="Drawer"
      rootAttributes={{ 'data-size': ctx.size, 'data-side': ctx.side }}
      Backdrop={RadixDialog.Overlay}
      Panel={RadixDialog.Content}
      panelProps={panelProps}
      panelRef={ref}
      className={className}
      style={style}
      rootProps={rootProps}
      onOpenAutoFocus={onOpenAutoFocus}
      // Non modal: when the person is working on the page, focus stays where it is on close.
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        const active = document.activeElement;
        if (!ctx.modal && active && active !== document.body && active.isConnected) event.preventDefault();
      }}
      // Non modal: an Escape in a page field belongs to that field, not to the drawer.
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event);
        const panel = event.target instanceof Node ? (event.target as Element).closest?.('[data-ds="drawer"]') : null;
        if (!ctx.modal && !panel) event.preventDefault();
      }}
      onPointerDownOutside={onPointerDownOutside}
      onKeyDown={onKeyDown}
      // Non modal: working on the page next to the drawer never closes it.
      onInteractOutside={(event) => {
        onInteractOutside?.(event);
        if (!ctx.modal) event.preventDefault();
      }}
      onFocusOutside={(event) => {
        onFocusOutside?.(event);
        if (!ctx.modal) event.preventDefault();
      }}
    >
      {header}
      {others}
    </DialogBase>
  );
}
