// ErrorState: what failed, what is safe, and the way out, in place of
// content that did not load. The host element is the root,
// `div[dsErrorState]`, and the template renders the parts in the React
// order: icon, title, body, actions (retry first), details.
//
//   <div dsErrorState title="Could not load members" body="Your team is safe." [onRetry]="reload" code="ERR_TIMEOUT 504"></div>
//
// The twin of packages/react/src/components/ErrorState/ErrorState.tsx.
// `title`, `body`, `actions` and `details` take a string or a template;
// `icon` takes an icon name, a template or false. `onRetry` is a function
// input: the retry Button is rendered only when there is a handler.
import { ChangeDetectionStrategy, Component, HostAttributeToken, booleanAttribute, computed, inject, input, type TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';
import type { MessageContent } from '../alert/alert';

export type ErrorStateSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ErrorStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** Default words, by language. */
export const errorStateLabels = {
  en: { retry: 'Retry loading', retrying: 'Retrying', details: 'Error details', code: 'Error code' },
  ar: { retry: 'إعادة التحميل', retrying: 'جار إعادة المحاولة', details: 'تفاصيل الخطأ', code: 'رمز الخطأ' },
} as const;

/** The direction of a language tag, for an ErrorState whose copy is not in the page language. */
function dirFor(lang: string | undefined): 'ltr' | 'rtl' | null {
  if (lang === undefined) return null;
  return /^(ar|fa|he|ur)(-|$)/i.test(lang) ? 'rtl' : 'ltr';
}

function labelsFor(lang: string | undefined) {
  return lang !== undefined && /^ar(-|$)/i.test(lang) ? errorStateLabels.ar : errorStateLabels.en;
}

@Component({
  selector: 'div[dsErrorState]',
  exportAs: 'dsErrorState',
  imports: [DsButton, DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'error-state',
    '[attr.role]': 'ownRole ?? (live() ? "alert" : "group")',
    '[attr.aria-atomic]': 'ownAtomic ?? (live() ? "false" : null)',
    '[attr.aria-labelledby]': 'ownLabelledBy ?? (live() ? null : titleId)',
    '[attr.lang]': 'lang() ?? null',
    '[attr.dir]': 'ownDir ?? dirFor(lang())',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'retrying() ? "retrying" : "error"',
  },
  template: `
    <ng-template #titleContent>@if (isText(title())) {{{ title() }}} @else {<ng-container [ngTemplateOutlet]="$any(title())" />}</ng-template>
    @let ic = icon();
    @if (ic !== false) {
      <span data-part="icon" aria-hidden="true">
        @if (isText(ic)) {
          <svg dsIcon [name]="$any(ic)" [size]="size() === 'lg' ? 'lg' : 'md'"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="ic" />
        }
      </span>
    }
    @switch (headingLevel()) {
      @case (2) { <h2 [attr.id]="titleId" data-part="title"><ng-container [ngTemplateOutlet]="titleContent" /></h2> }
      @case (3) { <h3 [attr.id]="titleId" data-part="title"><ng-container [ngTemplateOutlet]="titleContent" /></h3> }
      @case (4) { <h4 [attr.id]="titleId" data-part="title"><ng-container [ngTemplateOutlet]="titleContent" /></h4> }
      @case (5) { <h5 [attr.id]="titleId" data-part="title"><ng-container [ngTemplateOutlet]="titleContent" /></h5> }
      @case (6) { <h6 [attr.id]="titleId" data-part="title"><ng-container [ngTemplateOutlet]="titleContent" /></h6> }
    }
    @let b = body();
    @if (b !== undefined && b !== '') {
      <div data-part="body">@if (isText(b)) {{{ b }}} @else {<ng-container [ngTemplateOutlet]="b" />}</div>
    }
    @if (hasActions()) {
      <div data-part="actions">
        @if (onRetry(); as retry) {
          <button
            dsButton
            data-part="retry"
            tone="accent"
            emphasis="solid"
            [size]="size() === 'sm' ? 'sm' : 'md'"
            start="refresh"
            [loading]="retrying()"
            [loadingLabel]="retryingLabel() ?? words().retrying"
            (click)="retry()"
          >{{ retryLabel() ?? words().retry }}</button>
        }
        @if (actions(); as a) {
          @if (isText(a)) {{{ a }}} @else {<ng-container [ngTemplateOutlet]="a" />}
        }
      </div>
    }
    @if (hasDetails()) {
      <details data-part="details" [attr.open]="detailsOpen() ? '' : null">
        <summary data-part="summary">{{ detailsLabel() ?? words().details }}<svg dsIcon name="chevron-down" size="sm"></svg></summary>
        @if (hasCode()) {
          <p data-part="code"><ng-container>{{ words().code }}</ng-container>: <code dir="ltr">{{ code() }}</code></p>
        }
        @if (details(); as d) {
          @if (isText(d)) {{{ d }}} @else {<ng-container [ngTemplateOutlet]="d" />}
        }
      </details>
    }
  `,
})
export class DsErrorState {
  /** What happened, naming the thing: Could not load members. Not the native title attribute. */
  readonly title = input.required<MessageContent>();
  /** What to do next, and what is safe. */
  readonly body = input<MessageContent | undefined>(undefined);
  /** A system icon name, a template, or false for none. Default "alert-circle". */
  readonly icon = input<IconName | TemplateRef<unknown> | false>('alert-circle');
  /** The language of the copy when it differs from the page. Sets lang and dir. The default words follow it, else the theme language. */
  readonly lang = input<string | undefined>(undefined);
  /** Default md: a section. sm sits in a card or a panel, lg fills a page. */
  readonly size = input<ErrorStateSize>('md');
  /** The heading level of the title. Default 2. */
  readonly headingLevel = input<ErrorStateHeadingLevel>(2);
  /** Renders the retry Button first in the actions and is called by it. */
  readonly onRetry = input<(() => void) | undefined>(undefined);
  /** The retry label: a verb plus a noun. Default "Retry loading", Arabic under lang ar. */
  readonly retryLabel = input<string | undefined>(undefined);
  /** A retry is in flight: data-state="retrying" and the retry Button shows loading. Default false. */
  readonly retrying = input(false, { transform: booleanAttribute });
  /** The words the retry Button's hidden status says while retrying. Default "Retrying". */
  readonly retryingLabel = input<string | undefined>(undefined);
  /** More actions after retry, as a template: Buttons with a verb plus a noun. */
  readonly actions = input<MessageContent | undefined>(undefined);
  /** The error code, shown inside the details disclosure: ERR_TIMEOUT 504. */
  readonly code = input<string | undefined>(undefined);
  /** More detail inside the disclosure, after the code. */
  readonly details = input<MessageContent | undefined>(undefined);
  /** The disclosure toggle. Default "Error details". */
  readonly detailsLabel = input<string | undefined>(undefined);
  /** Renders the details open at first. Default false. */
  readonly detailsOpen = input(false, { transform: booleanAttribute });
  /** Role alert, read once, for an error that replaces content after load. Default false: a group named by the title. */
  readonly live = input(false, { transform: booleanAttribute });

  protected readonly ownRole = inject(new HostAttributeToken('role'), { optional: true });
  protected readonly ownAtomic = inject(new HostAttributeToken('aria-atomic'), { optional: true });
  protected readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), { optional: true });
  protected readonly ownDir = inject(new HostAttributeToken('dir'), { optional: true });
  protected readonly titleId = inject(_IdGenerator).getId('ds-error-state-');
  private readonly theme = inject(DsThemeService);
  /** Words follow the input, else the theme. dir and lang are set only from the input. */
  protected readonly words = computed(() => labelsFor(this.lang() ?? this.theme.value().lang));
  protected readonly hasActions = computed(() => this.onRetry() !== undefined || this.actions() !== undefined);
  protected readonly hasCode = computed(() => {
    const c = this.code();
    return c !== undefined && c !== '';
  });
  protected readonly hasDetails = computed(() => this.hasCode() || this.details() !== undefined);
  protected readonly dirFor = dirFor;
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  constructor() {
    consumeHostAttributes([
      'dsErrorState', 'title', 'body', 'icon', 'size', 'headingLevel', 'onRetry', 'retryLabel', 'retrying', 'retryingLabel',
      'actions', 'code', 'details', 'detailsLabel', 'detailsOpen', 'live',
    ]);
  }
}
