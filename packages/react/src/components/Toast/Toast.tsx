'use client';
// Toast: the look of one notice and its parts. `Toaster` (Toaster.tsx)
// renders one per item of the shared store, inside Radix Toast. `Toast` on
// its own is the same markup without behavior, for a notice placed by hand
// (a specimen in docs, a notice inside a panel).
//
// Sources: GoBanana `components/studio/Toast.tsx` and the `.st-toast` block
// of studio-components.css, Figma-Killer-2 `ui/components/Toast/`.
//
// Anatomy: root [data-ds=toast] with data-tone (and data-state inside a
// Toaster), and the parts icon, title (holding count), description, action
// and close. action is a Button and close a CloseButton, each carrying the
// toast's data-part next to its own data-ds. The parts are Radix Toast
// parts, so inside a Toaster the close and action buttons close the toast.
// Outside a Toaster they are plain elements.
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { Toast as RadixToast } from 'radix-ui';
import type { ToastAction, ToastTone } from '@the-system/shared';
import type { IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import { Button } from '../Button';
import { CloseButton } from '../CloseButton';

export type { ToastAction, ToastTone } from '@the-system/shared';

/** The icon of each tone. */
export const toastIcons: Readonly<Record<ToastTone, IconName>> = {
  neutral: 'bell',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** Default words of the toast chrome, by language. */
export const toastLabels = {
  en: { region: 'Notifications', toast: 'Notification', close: 'Close notification' },
  ar: { region: 'التنبيهات', toast: 'تنبيه', close: 'إغلاق التنبيه' },
} as const;

/** The words for a language tag: Arabic for any `ar` tag, English otherwise. */
export function toastLabelsFor(lang: string | undefined): (typeof toastLabels)[keyof typeof toastLabels] {
  return lang !== undefined && /^ar(-|$)/i.test(lang) ? toastLabels.ar : toastLabels.en;
}

/** The direction of a language tag, for a toast whose copy is not in the page language. */
export function toastDirFor(lang: string | undefined): 'ltr' | 'rtl' | undefined {
  if (lang === undefined) return undefined;
  return /^(ar|fa|he|ur)(-|$)/i.test(lang) ? 'rtl' : 'ltr';
}

export interface ToastPartsProps {
  tone: ToastTone;
  title?: ReactNode;
  description?: ReactNode;
  /** Shown as a count after the title when above 1. */
  count?: number;
  action?: ToastAction;
  /** The accessible name of the close button. */
  closeLabel: string;
  /** Called by the close button. Inside a Toaster, Radix closes the toast as well. */
  onClose?: () => void;
  /** Renders the close button. Default true. */
  closable?: boolean;
}

/** The parts of a toast, shared by `Toast` and `Toaster`. Not exported from the package. */
export function ToastParts({ tone, title, description, count = 1, action, closeLabel, onClose, closable = true }: ToastPartsProps) {
  return (
    <>
      <span data-part="icon">
        <Icon name={toastIcons[tone]} size="md" />
      </span>
      {title !== undefined && title !== '' && (
        <RadixToast.Title data-part="title">
          {title}
          {count > 1 && (
            // The repeat is visible, and the repeat is announced again, so the count itself stays silent.
            <span data-part="count" aria-hidden="true">
              ×{count}
            </span>
          )}
        </RadixToast.Title>
      )}
      {description !== undefined && description !== '' && (
        <RadixToast.Description data-part="description">{description}</RadixToast.Description>
      )}
      {action && (
        <RadixToast.Action asChild altText={action.altText ?? action.label}>
          <Button data-part="action" size="sm" emphasis="soft" onClick={() => action.onAction()}>
            {action.label}
          </Button>
        </RadixToast.Action>
      )}
      {closable && (
        <RadixToast.Close asChild>
          <CloseButton data-part="close" label={closeLabel} size="xs" onClick={onClose} />
        </RadixToast.Close>
      )}
    </>
  );
}

/** No `title` attribute: the title prop is the toast's heading, and hints come from Tooltip. */
export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Default neutral. */
  tone?: ToastTone;
  /** One line: what happened, naming the thing. */
  title?: ReactNode;
  /** More detail, up to three lines. */
  description?: ReactNode;
  /** A repeat count, shown after the title when above 1. */
  count?: number;
  /** One optional button: a verb plus a noun. */
  action?: ToastAction;
  /** Renders the close button and is called by it. Without it there is no close button. */
  onClose?: () => void;
  /** The accessible name of the close button. Default "Close notification", or Arabic under lang ar. */
  closeLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * One notice, drawn as a toast, with no timer, queue or live region, and no
 * data-state (it does not open or close by itself). Use `toast()` with a
 * mounted `Toaster` for real notifications; this is for a notice placed by
 * hand.
 */
export function Toast({ tone = 'neutral', title, description, count, action, onClose, closeLabel, lang, ...rest }: ToastProps) {
  return (
    <div {...rest} lang={lang} dir={rest.dir ?? toastDirFor(lang)} data-ds="toast" data-tone={tone}>
      <ToastParts
        tone={tone}
        title={title}
        description={description}
        count={count}
        action={action}
        closeLabel={closeLabel ?? toastLabelsFor(lang).close}
        onClose={onClose}
        closable={onClose !== undefined}
      />
    </div>
  );
}
