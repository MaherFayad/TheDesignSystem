// Toast: the look of one notice and its parts. The twin of
// packages/react/src/components/Toast/Toast.tsx, on the same DOM, so
// Toast.css applies as is. `DsToaster` (toaster.ts) renders one per item of
// the shared store; `div[dsToast]` on its own is the same markup without
// behavior, for a notice placed by hand.
//
//   <div dsToast tone="warning" title="Storage almost full" description="You have 200 MB left on this plan."></div>
//   <div dsToast tone="danger" title="Could not publish page" [onClose]="hide"></div>
//
// Anatomy: root [data-ds=toast] with data-tone (and data-state inside a
// toaster), and the parts icon, title (holding count), description, action
// and close. action is a Button and close a CloseButton, each carrying the
// toast's data-part next to its own data-ds, and the Radix announce exclude
// attributes, as React renders them.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import type { ToastAction, ToastTone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsButton } from '../button/button';
import { DsToastClose } from './toast-close';

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

/** What the parts template reads. */
export interface ToastPartsData {
  tone: ToastTone;
  title?: string;
  description?: string;
  count: number;
  action?: ToastAction;
  closeLabel: string;
  closable: boolean;
}

/**
 * The parts of a toast, shared by `div[dsToast]` and the toaster item. The
 * component reads `parts()` and implements `runAction()` and `close()`.
 * No whitespace between the title text and the count: the badge never wraps
 * onto a line alone (Toast.css).
 */
export const TOAST_PARTS_TEMPLATE = `
  @let p = parts();
  <span data-part="icon"><svg dsIcon [name]="icons[p.tone]" size="md"></svg></span>
  @if (p.title !== undefined && p.title !== '') {
    <div data-part="title">{{ p.title }}@if (p.count > 1) {<span data-part="count" aria-hidden="true">×<ng-container>{{ p.count }}</ng-container></span>}</div>
  }
  @if (p.description !== undefined && p.description !== '') {
    <div data-part="description">{{ p.description }}</div>
  }
  @if (p.action; as action) {
    <button dsButton data-part="action" size="sm" emphasis="soft" data-radix-toast-announce-exclude=""
      [attr.data-radix-toast-announce-alt]="action.altText ?? action.label" (click)="runAction(action)">{{ action.label }}</button>
  }
  @if (p.closable) {
    <button dsToastClose data-part="close" [label]="p.closeLabel" size="xs" data-radix-toast-announce-exclude="" (click)="close()"></button>
  }
`;

export const TOAST_PARTS_IMPORTS = [DsIcon, DsButton, DsToastClose] as const;

/**
 * One notice, drawn as a toast, with no timer, queue or live region, and no
 * data-state (it does not open or close by itself). Use `toast()` with a
 * mounted `DsToaster` for real notifications; this is for a notice placed by
 * hand.
 */
@Component({
  selector: 'div[dsToast]',
  exportAs: 'dsToast',
  imports: [TOAST_PARTS_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'toast',
    '[attr.data-tone]': 'tone()',
    '[attr.lang]': 'lang() ?? null',
    '[attr.dir]': '(dir() ?? toastDirFor(lang())) ?? null',
  },
  template: TOAST_PARTS_TEMPLATE,
})
export class DsToast {
  /** Default neutral. */
  readonly tone = input<ToastTone>('neutral');
  /** One line: what happened, naming the thing. No native title attribute: this is the toast's heading. */
  readonly title = input<string | undefined>(undefined);
  /** More detail, up to three lines. */
  readonly description = input<string | undefined>(undefined);
  /** A repeat count, shown after the title when above 1. */
  readonly count = input<number | undefined>(undefined);
  /** One optional button: a verb plus a noun. */
  readonly action = input<ToastAction | undefined>(undefined);
  /** Renders the close button and is called by it. Without it there is no close button. A function input, as React's onClose. */
  readonly onClose = input<(() => void) | undefined>(undefined);
  /** The accessible name of the close button. Default "Close notification", or Arabic under lang ar. */
  readonly closeLabel = input<string | undefined>(undefined);
  /** The language of the copy, when it differs from the page. Sets lang and dir on the root. */
  readonly lang = input<string | undefined>(undefined);
  /** The direction, when it should differ from the one lang gives. */
  readonly dir = input<'ltr' | 'rtl' | undefined>(undefined);

  protected readonly icons = toastIcons;
  protected readonly toastDirFor = toastDirFor;

  protected readonly parts = computed<ToastPartsData>(() => ({
    tone: this.tone(),
    title: this.title(),
    description: this.description(),
    count: this.count() ?? 1,
    action: this.action(),
    closeLabel: this.closeLabel() ?? toastLabelsFor(this.lang()).close,
    closable: this.onClose() !== undefined,
  }));

  constructor() {
    consumeHostAttributes(['dsToast', 'tone', 'title', 'description', 'count', 'action', 'onClose', 'closeLabel', 'lang', 'dir']);
  }

  protected runAction(action: ToastAction): void {
    action.onAction();
  }

  protected close(): void {
    this.onClose()?.();
  }
}
