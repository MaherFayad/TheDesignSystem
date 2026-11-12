// ErrorState demo: the same cases, ids and copy as
// packages/react/src/components/ErrorState/ErrorState.demo.tsx. A retry
// runs for 1.5s and fails again.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsErrorState } from './error-state';

const PANEL = 'border: var(--ds-border-width-default) solid var(--ds-color-bg-overlay-10); border-radius: var(--ds-radius-panel);';
const NARROW = PANEL + ' max-inline-size: 20rem;';
const keys = ['sm', 'md', 'lg', 'ar', 'long', 'longAr', 'error'] as const;
type Key = (typeof keys)[number];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsErrorState, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #openBoards><button dsButton size="md">Open boards</button></ng-template>
    <ng-template #requestAccess><button dsButton tone="accent" emphasis="solid">Request access</button></ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: sm in a card, md for a section, lg for a page">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
        <div style="${PANEL}">
          <div dsErrorState lang="en" size="sm" title="Could not load activity" body="Check your connection, then retry." [headingLevel]="3" [retrying]="retrying().sm" [onRetry]="retry.sm"></div>
        </div>
        <div style="${PANEL}">
          <div
            dsErrorState
            lang="en"
            title="Could not load members"
            body="The server took too long to answer. Your team is safe; nothing was changed."
            code="ERR_TIMEOUT 504"
            [headingLevel]="3"
            [retrying]="retrying().md"
            [onRetry]="retry.md"
          ></div>
        </div>
      </div>
      <div style="${PANEL}">
        <div
          dsErrorState
          lang="en"
          size="lg"
          title="This page did not load"
          body="Something went wrong on our side. Retry, or go back to your boards."
          [actions]="openBoards"
          code="ERR_INTERNAL 500"
          details="Request id 7f3a9c21. Send it to support if this keeps happening."
          [headingLevel]="3"
          [retrying]="retrying().lg"
          [onRetry]="retry.lg"
        ></div>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="${PANEL}">
          <div
            dsErrorState
            lang="ar"
            title="تعذر تحميل الأعضاء"
            body="الخادم تأخر في الرد. بيانات فريقك سليمة وما تغير شيء."
            code="ERR_TIMEOUT 504"
            detailsOpen
            [headingLevel]="3"
            [retrying]="retrying().ar"
            [onRetry]="retry.ar"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One action: no retry, a way out only">
      <div style="${PANEL}">
        <div
          dsErrorState
          lang="en"
          icon="lock"
          title="You cannot open this board"
          body="Ask the owner for access, or open one of your own boards."
          [actions]="requestAccess"
          [headingLevel]="3"
        ></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text wraps and stays centered">
      <div style="${NARROW}">
        <div
          dsErrorState
          lang="en"
          size="sm"
          title="Could not load the comments on Quarterly planning board for the design team"
          body="The connection dropped while the comments were loading. Nothing you wrote is lost. Retry when you are back online, or keep working and the comments load on their own."
          code="ERR_NETWORK_CHANGED"
          [headingLevel]="3"
          [retrying]="retrying().long"
          [onRetry]="retry.long"
        ></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="${NARROW}">
          <div
            dsErrorState
            lang="ar"
            size="sm"
            title="تعذر تحميل التعليقات على لوحة التخطيط الربع سنوي لفريق التصميم"
            body="انقطع الاتصال وقت تحميل التعليقات، وكل اللي كتبته محفوظ. أعد المحاولة لما يرجع الاتصال، أو كمل شغلك والتعليقات بتنزل لحالها."
            code="ERR_NETWORK_CHANGED"
            [headingLevel]="3"
            [retrying]="retrying().longAr"
            [onRetry]="retry.longAr"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: a retry in flight">
      <div style="${PANEL}">
        <div dsErrorState lang="en" retrying [onRetry]="noop" title="Could not load invoices" body="Trying again now." [headingLevel]="3"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: no details, retry only">
      <div style="${PANEL}">
        <div dsErrorState lang="en" title="Could not load files" body="Retry, and if it fails again, reload the page." [headingLevel]="3" [retrying]="retrying().error" [onRetry]="retry.error"></div>
      </div>
    </section>
  `,
})
export default class ErrorStateDemo {
  protected readonly retrying = signal<Partial<Record<Key, boolean>>>({});
  protected readonly noop = () => undefined;
  /** One retry handler per instance, so each ErrorState retries on its own. */
  protected readonly retry = Object.fromEntries(
    keys.map((k) => [
      k,
      () => {
        this.retrying.update((r) => ({ ...r, [k]: true }));
        window.setTimeout(() => this.retrying.update((r) => ({ ...r, [k]: false })), 1500);
      },
    ]),
  ) as Record<Key, () => void>;
}
