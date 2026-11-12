// Stages of the Angular /interactions page for the feedback family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/feedback.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// A stage whose components are not all in the Angular port shows the ones
// that are: state-illustration shows the ErrorState (EmptyState is not
// ported), status-pulse shows the StatusDot (Avatar is not ported). The ids
// of components not in the port (accordion, stat, avatar, badge, card, kbd,
// resizable panels, split view) have no stage. A remount by key in React is
// an `@for` over one key here.
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import {
  DsAlert,
  DsBanner,
  DsButton,
  DsCallout,
  DsErrorState,
  DsMeter,
  DsNotificationCenter,
  DsProgressBar,
  DsProgressCircle,
  DsSkeleton,
  DsSpinner,
  DsStatusDot,
  type NotificationItem,
} from '@the-system/angular';
import { toast } from '@the-system/shared';

const column = 'display: grid; gap: var(--ds-space-s); inline-size: 100%;';
const row = 'display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-s);';
const noop = (): void => undefined;
/** The stage host draws no box, so the parts lay out in the stage as React's fragments do. */
const host = { style: 'display: contents' };

@Component({
  selector: 'ds-stage-alert-entrance',
  imports: [DsAlert, DsBanner, DsButton, DsCallout],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <ng-template #retry><button dsButton size="sm">Try again</button></ng-template>
    <div style="${column}">
      <div style="${row}">
        <button dsButton size="sm" data-interaction-trigger="" (click)="show()">Show the messages</button>
      </div>
      @if (shown()) {
        @for (k of [n()]; track k) {
          <div style="${column}">
            <div dsAlert tone="warning" title="Could not sync 3 files" [actions]="retry">Your local copies are safe.</div>
            <section dsBanner tone="info">The workspace moves to the new plan on Monday.</section>
            <div dsCallout tone="success" title="تم الحفظ" lang="ar" dir="rtl">التغييرات محفوظة في المسودة.</div>
          </div>
        }
      }
    </div>
  `,
})
class AlertStage {
  protected readonly shown = signal(false);
  protected readonly n = signal(0);
  protected show(): void {
    this.shown.set(true);
    this.n.update((v) => v + 1);
  }
}

@Component({
  selector: 'ds-stage-alert-dismiss',
  imports: [DsAlert, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <button dsButton size="sm" data-interaction-trigger="" (click)="dismissFirst($event)">Dismiss the first</button>
      <div style="${column} position: relative;">
        @for (id of items(); track id) {
          @if (id === 'a') {
            <div dsAlert tone="danger" title="Payment failed" [onClose]="close.a">Update the card on file.</div>
          } @else {
            <div dsAlert tone="info" title="New version ready" [onClose]="close.b"></div>
          }
        }
        <p style="margin: 0;">The page below closes the gap.</p>
      </div>
    </div>
  `,
})
class DismissStage {
  protected readonly items = signal(['a', 'b']);
  protected readonly close = {
    a: () => this.items.update((v) => v.filter((x) => x !== 'a')),
    b: () => this.items.update((v) => v.filter((x) => x !== 'b')),
  };
  /** Press the first alert's own close button, so the dismiss plays as a person would see it. */
  protected dismissFirst(event: MouseEvent): void {
    const parent = (event.currentTarget as HTMLElement).parentElement;
    const button = parent?.querySelector<HTMLElement>('[data-ds="alert"]:not([inert]) [data-part="close"]');
    if (button) button.click();
    else this.items.set(['a', 'b']);
  }
}

@Component({
  selector: 'ds-stage-state-illustration',
  imports: [DsButton, DsErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <button dsButton size="sm" data-interaction-trigger="" (click)="n.set(n() + 1)">Show the empty and error states</button>
      @for (k of [n()]; track k) {
        <div style="${column} grid-template-columns: 1fr 1fr;">
          <div dsErrorState size="sm" title="Could not load the board" [onRetry]="retry"></div>
        </div>
      }
    </div>
  `,
})
class StateStage {
  protected readonly n = signal(0);
  protected readonly retry = noop;
}

@Component({
  selector: 'ds-stage-error-state-details',
  imports: [DsErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `<div dsErrorState size="sm" title="Could not load the board" code="ERR 504" [onRetry]="retry"></div>`,
})
class ErrorDetailsStage {
  protected readonly retry = noop;
}

@Component({
  selector: 'ds-stage-skeleton-swap',
  imports: [DsButton, DsSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="inline-size: 14rem; position: relative;">
      @if (loading()) {
        <span dsSkeleton size="lg" width="60%"></span>
        <span dsSkeleton></span>
        <span dsSkeleton width="80%"></span>
      } @else {
        <p style="margin: 0; font-weight: 600;">Brand review</p>
        <p style="margin: 0;">Moved to Thursday at 10:00 in room 4.</p>
      }
    </div>
    <button dsButton size="sm" data-interaction-trigger="" (click)="loading.set(!loading())">
      {{ loading() ? 'Load the content' : 'Show the placeholder' }}
    </button>
  `,
})
class SkeletonStage {
  protected readonly loading = signal(true);
}

@Component({
  selector: 'ds-stage-toast-enter',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>`,
})
class ToastEnterStage {
  protected show(): void {
    toast({ lang: 'en', tone: 'info', title: 'New version ready', description: 'Reload the page to get it.' });
  }
}

/** Each press shows a toast with its own title, so the stack grows instead of updating one toast. */
@Component({
  selector: 'ds-stage-toast-stack',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>`,
})
class ToastStackStage {
  private n = 1;
  protected show(): void {
    toast({ lang: 'en', tone: 'success', title: `Draft ${this.n} saved`, description: 'Saved a moment ago.' });
    this.n += 1;
  }
}

@Component({
  selector: 'ds-stage-toast-swipe',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>`,
})
class ToastSwipeStage {
  protected show(): void {
    toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' });
  }
}

const now = new Date();
const base: NotificationItem[] = [
  { id: 'n1', title: 'Omar commented on Brand review', time: now, unread: true },
  { id: 'n2', title: 'Lina invited you to Launch plan', time: now, unread: false, tone: 'info' },
];

@Component({
  selector: 'ds-stage-notification-change',
  imports: [DsButton, DsNotificationCenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <div style="${row}">
        <button dsButton size="sm" data-interaction-trigger="" (click)="add()">Add a notification</button>
        <button dsButton size="sm" emphasis="soft" (click)="items.set(items().slice(1))">Remove the newest</button>
      </div>
      <section dsNotificationCenter size="sm" [items]="items()" [now]="now" [onMarkAllRead]="markAll"></section>
    </div>
  `,
})
class NotificationStage {
  protected readonly items = signal(base);
  protected readonly now = now;
  private n = 3;
  protected readonly markAll = (): void => this.items.update((v) => v.map((x) => ({ ...x, unread: false })));
  protected add(): void {
    const n = this.n;
    this.items.update((v) => [{ id: `n${n}`, title: `Build ${n} passed`, time: new Date(), unread: true, tone: 'success' }, ...v]);
    this.n += 1;
  }
}

@Component({
  selector: 'ds-stage-progress',
  imports: [DsButton, DsProgressBar, DsProgressCircle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <div dsProgressBar label="Uploading files" [value]="v()"></div>
      <div style="${row}">
        <div dsProgressCircle label="Upload" [value]="v()" size="lg"></div>
        <button dsButton size="sm" data-interaction-trigger="" (click)="advance()">Advance the upload</button>
      </div>
    </div>
  `,
})
class ProgressStage {
  protected readonly v = signal(20);
  protected advance(): void {
    this.v.update((x) => (x >= 100 ? 20 : Math.min(100, x + 40)));
  }
}

@Component({
  selector: 'ds-stage-meter-fill',
  imports: [DsButton, DsMeter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <button dsButton size="sm" data-interaction-trigger="" (click)="n.set(n() + 1)">Show the meters</button>
      @for (k of [n()]; track k) {
        <div style="${column}">
          <div dsMeter label="Storage used" [value]="72" [high]="80"></div>
          <div dsMeter label="Seats" [value]="34"></div>
        </div>
      }
    </div>
  `,
})
class MeterStage {
  protected readonly n = signal(0);
}

@Component({
  selector: 'ds-stage-status-pulse',
  imports: [DsButton, DsStatusDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${row}">
      @for (k of [i()]; track k) {
        <span dsStatusDot label="Syncing" tone="info" pulse></span>
      }
      <button dsButton size="sm" data-interaction-trigger="" (click)="i.set(i() + 1)">Change the status</button>
    </div>
  `,
})
class StatusPulseStage {
  protected readonly i = signal(1);
}

@Component({
  selector: 'ds-stage-spinner-loop',
  imports: [DsButton, DsSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${row}">
      @for (k of [n()]; track k) {
        <span dsSpinner label="Loading files" tone="accent"></span>
      }
      <button dsButton size="sm" data-interaction-trigger="" (click)="n.set(n() + 1)">Show the spinner again</button>
    </div>
  `,
})
class SpinnerStage {
  protected readonly n = signal(0);
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'alert-entrance': AlertStage,
  'alert-dismiss': DismissStage,
  'state-illustration': StateStage,
  'error-state-details': ErrorDetailsStage,
  'skeleton-swap': SkeletonStage,
  'toast-enter': ToastEnterStage,
  'toast-stack': ToastStackStage,
  'toast-swipe': ToastSwipeStage,
  'notification-change': NotificationStage,
  'progress-spring': ProgressStage,
  'progress-celebrate': ProgressStage,
  'meter-fill': MeterStage,
  'status-pulse': StatusPulseStage,
  'spinner-loop': SpinnerStage,
};
