// NotificationCenter: the list of what happened while you were away, grouped
// by day or by a group the consumer names. The host element is the root,
// `section[dsNotificationCenter]`, and the template renders the parts in
// the React order: header (title, count, mark-all), then empty or the
// groups with their items.
//
//   <section dsNotificationCenter [items]="items" [onMarkAllRead]="markAll" [now]="now"></section>
//
// The twin of packages/react/src/components/NotificationCenter/NotificationCenter.tsx.
// Node props (`title`, `emptyTitle`, `emptyBody`, an item's `title` and
// `body`) take a string or a template. `onMarkAllRead` is a function input:
// the mark-all Button renders only with a handler while any item is unread.
//
// Motion (order 1.22, notification-change), as React plays it
// (helpers in @the-system/motion): new entries pop in, removed ones shrink
// away as a ghost, the rest slide to their place (FLIP), and the number in
// the unread count rolls digit by digit while the count pops. The entries
// are measured in an effect, which runs before this view's template is
// refreshed, and the moves play after the render, before the paint.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostAttributeToken,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
  Injector,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _IdGenerator } from '@angular/cdk/a11y';
import { DsIcon } from '@the-system/icons/angular';
import type { IconName } from '@the-system/icons';
import type { Size, Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { DigitRoller, FlipList, popMark } from '@the-system/motion';
import { DsThemeService } from '../../theme/theme';
import { DsButton } from '../button/button';
import { dayGroup, formatRelativeTime, notificationLanguage, toDate, type DayGroup } from './time';

/** What moves when the list changes: the group labels and the entries, never a ghost on its way out. */
const movers = (root: HTMLElement): Element[] => [
  ...root.querySelectorAll('[data-part="group-label"]:not([inert] *), li[data-entry]:not([inert])'),
];

export type NotificationCenterSize = Extract<Size, 'sm' | 'md'>;
export type NotificationTone = Tone;
export type NotificationCenterHeadingLevel = 2 | 3 | 4 | 5;
/** A node in Angular: text, or a template. */
export type NotificationContent = string | TemplateRef<unknown>;

export interface NotificationAction {
  /** A verb plus a noun: Open board, Accept invite. */
  label: string;
  onAction: () => void;
}

export interface NotificationItem {
  id: string;
  /** One line: what happened, naming the thing and who. */
  title: NotificationContent;
  body?: NotificationContent;
  /** When it happened: a Date, a timestamp or an ISO string. */
  time: Date | number | string;
  /** Default false. */
  unread?: boolean;
  /** Picks the icon and its color. Default neutral. */
  tone?: NotificationTone;
  /** A system icon name in place of the tone's icon. */
  icon?: IconName;
  /** Up to two actions. */
  actions?: NotificationAction[];
  /** A group label. Without it, items are grouped by day: Today, Yesterday, Earlier. */
  group?: string;
}

/** The icon of each tone. */
export const notificationIcons: Readonly<Record<NotificationTone, IconName>> = {
  neutral: 'bell',
  accent: 'star',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** Default words, by language. */
export const notificationCenterLabels = {
  en: {
    title: 'Notifications',
    unread: 'Unread',
    count: (n: number) => `${n} unread`,
    markAll: 'Mark all as read',
    groups: { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' } as Record<DayGroup, string>,
    emptyTitle: 'No notifications',
    emptyBody: 'Mentions, invites and comments on your boards show up here.',
  },
  ar: {
    title: 'التنبيهات',
    unread: 'غير مقروء',
    count: (n: number) => `${n} غير مقروءة`,
    markAll: 'تحديد الكل كمقروء',
    groups: { today: 'اليوم', yesterday: 'أمس', earlier: 'سابقا' } as Record<DayGroup, string>,
    emptyTitle: 'لا توجد تنبيهات',
    emptyBody: 'الإشارات والدعوات والتعليقات على لوحاتك بتظهر هنا.',
  },
};

interface ViewItem {
  item: NotificationItem;
  titleId: string;
  tone: NotificationTone;
  icon: IconName;
  iso: string;
  relative: string;
  hasBody: boolean;
  actions: NotificationAction[];
}

interface ViewGroup {
  key: string;
  label: string;
  labelId: string;
  items: ViewItem[];
}

@Component({
  selector: 'section[dsNotificationCenter]',
  exportAs: 'dsNotificationCenter',
  imports: [DsButton, DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'notification-center',
    '[attr.aria-labelledby]': 'ownLabelledBy ?? titleId',
    '[attr.lang]': 'lang() ?? null',
    '[attr.dir]': 'ownDir ?? (lang() === undefined ? null : language() === "ar" ? "rtl" : "ltr")',
    '[attr.data-size]': 'size()',
    '[attr.data-empty]': 'empty() ? "" : null',
  },
  template: `
    <ng-template #content let-c>@if (isText(c)) {{{ c }}} @else {<ng-container [ngTemplateOutlet]="c" />}</ng-template>
    <ng-template #heading let-level="level" let-id="id" let-part="part" let-c="c" let-focusable="focusable">
      @switch (level) {
        @case (2) { <h2 [attr.data-part]="part" [attr.id]="id" [attr.tabindex]="focusable ? -1 : null"><ng-container *ngTemplateOutlet="content; context: { $implicit: c }" /></h2> }
        @case (3) { <h3 [attr.data-part]="part" [attr.id]="id" [attr.tabindex]="focusable ? -1 : null"><ng-container *ngTemplateOutlet="content; context: { $implicit: c }" /></h3> }
        @case (4) { <h4 [attr.data-part]="part" [attr.id]="id" [attr.tabindex]="focusable ? -1 : null"><ng-container *ngTemplateOutlet="content; context: { $implicit: c }" /></h4> }
        @case (5) { <h5 [attr.data-part]="part" [attr.id]="id" [attr.tabindex]="focusable ? -1 : null"><ng-container *ngTemplateOutlet="content; context: { $implicit: c }" /></h5> }
        @case (6) { <h6 [attr.data-part]="part" [attr.id]="id" [attr.tabindex]="focusable ? -1 : null"><ng-container *ngTemplateOutlet="content; context: { $implicit: c }" /></h6> }
      }
    </ng-template>

    <div data-part="header" #header>
      <ng-container *ngTemplateOutlet="heading; context: { level: headingLevel(), id: titleId, part: 'title', c: title() ?? words().title, focusable: true }" />
      @if (unread() > 0) {
        @let countText = words().count(unread());
        @let num = '' + unread();
        @let at = countText.indexOf(num);
        <span data-part="count">
          <span data-visually-hidden="">{{ countText }}</span>
          @if (at < 0) {
            <span aria-hidden="true">{{ countText }}</span>
          } @else {
            <span aria-hidden="true">{{ countText.slice(0, at) }}<span #digits>{{ num }}</span>{{ countText.slice(at + num.length) }}</span>
          }
        </span>
      }
      @if (onMarkAllRead() !== undefined && unread() > 0) {
        <button dsButton data-part="mark-all" size="sm" emphasis="ghost" start="check-double" (click)="markAll()">{{ markAllLabel() ?? words().markAll }}</button>
      }
    </div>
    @if (empty()) {
      <div data-part="empty">
        <svg dsIcon name="bell-off" size="lg"></svg>
        <p data-empty-title=""><ng-container *ngTemplateOutlet="content; context: { $implicit: emptyTitle() ?? words().emptyTitle }" /></p>
        <p data-empty-body=""><ng-container *ngTemplateOutlet="content; context: { $implicit: emptyBody() ?? words().emptyBody }" /></p>
      </div>
    } @else {
      @for (g of groups(); track g.key) {
        <div data-part="group" role="group" [attr.aria-labelledby]="g.labelId">
          <ng-container *ngTemplateOutlet="heading; context: { level: headingLevel() + 1, id: g.labelId, part: 'group-label', c: g.label, focusable: false }" />
          <ul data-list="">
            @for (v of g.items; track v.item.id) {
              <li data-entry="">
                <article data-part="item" [attr.data-tone]="v.tone" [attr.data-unread]="v.item.unread ? '' : null" [attr.aria-labelledby]="v.titleId" tabindex="0">
                  <span data-part="item-icon" aria-hidden="true"><svg dsIcon [name]="v.icon" size="md"></svg></span>
                  <p data-part="item-title" [attr.id]="v.titleId">@if (v.item.unread) {<span data-part="unread"><span data-unread-word=""><ng-container>{{ words().unread }}</ng-container>: </span></span>}<ng-container *ngTemplateOutlet="content; context: { $implicit: v.item.title }" /></p>
                  @if (v.hasBody) {
                    <p data-part="item-body"><ng-container *ngTemplateOutlet="content; context: { $implicit: v.item.body }" /></p>
                  }
                  <time data-part="item-time" [attr.datetime]="v.iso">{{ v.relative }}</time>
                  @if (v.actions.length > 0) {
                    <div data-part="item-actions">
                      @for (a of v.actions; track a.label) {
                        <button dsButton size="sm" emphasis="soft" (click)="a.onAction()">{{ a.label }}</button>
                      }
                    </div>
                  }
                </article>
              </li>
            }
          </ul>
        </div>
      }
    }
  `,
})
export class DsNotificationCenter {
  readonly items = input.required<NotificationItem[]>();
  /** The panel heading. Default "Notifications", Arabic under lang ar. Not the native title attribute. */
  readonly title = input<NotificationContent | undefined>(undefined);
  /** The heading level of the title; group labels take the next level. Default 2. */
  readonly headingLevel = input<NotificationCenterHeadingLevel>(2);
  /** Renders the mark all read Button while any item is unread, and is called by it. */
  readonly onMarkAllRead = input<(() => void) | undefined>(undefined);
  /** The mark all read label. Default "Mark all as read". */
  readonly markAllLabel = input<string | undefined>(undefined);
  /** Default md. sm is for a narrow popover. */
  readonly size = input<NotificationCenterSize>('md');
  /** The empty state title. Default "No notifications". */
  readonly emptyTitle = input<NotificationContent | undefined>(undefined);
  /** The empty state body: what shows up here. */
  readonly emptyBody = input<NotificationContent | undefined>(undefined);
  /** The clock for relative times and day groups. Default the time of render. */
  readonly now = input<Date | undefined>(undefined);
  /** The language of the copy when it differs from the page. Sets lang and dir. */
  readonly lang = input<string | undefined>(undefined);

  protected readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), { optional: true });
  protected readonly ownDir = inject(new HostAttributeToken('dir'), { optional: true });
  private readonly ids = inject(_IdGenerator);
  protected readonly titleId = this.ids.getId('ds-notification-center-');
  /** One id per item id, kept for the life of the panel, like a React useId per item. */
  private readonly itemIds = new Map<string, string>();
  private readonly theme = inject(DsThemeService);
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');
  private readonly digits = viewChild<ElementRef<HTMLElement>>('digits');
  private readonly motion = injectMotion();

  /** Words and times follow the input, else the theme. lang and dir are set only from the input. */
  protected readonly language = computed(() => notificationLanguage(this.lang() ?? this.theme.value().lang));
  protected readonly words = computed(() => notificationCenterLabels[this.language()]);
  protected readonly unread = computed(() => this.items().filter((i) => i.unread).length);
  protected readonly empty = computed(() => this.items().length === 0);
  protected readonly groups = computed<ViewGroup[]>(() => {
    const now = this.now() ?? new Date();
    const lang = this.language();
    const labels = this.words().groups;
    const groups: ViewGroup[] = [];
    const byKey = new Map<string, ViewGroup>();
    for (const item of this.items()) {
      const time = toDate(item.time);
      const label = item.group ?? labels[dayGroup(time, now)];
      let group = byKey.get(label);
      if (!group) {
        group = { key: label, label, labelId: `${this.titleId}-g${groups.length}`, items: [] };
        byKey.set(label, group);
        groups.push(group);
      }
      const tone = item.tone ?? 'neutral';
      group.items.push({
        item,
        titleId: this.itemId(item.id),
        tone,
        icon: item.icon ?? notificationIcons[tone],
        iso: time.toISOString(),
        relative: formatRelativeTime(time, now, lang),
        hasBody: item.body !== undefined && item.body !== '',
        actions: item.actions?.slice(0, 2) ?? [],
      });
    }
    return groups;
  });
  protected readonly isText = (v: unknown): v is string => typeof v === 'string';

  /** The groups and entries by key: a change means entries moved, came or went. */
  private readonly signature = computed(() =>
    this.groups()
      .map((g) => `${g.key}:${g.items.map((v) => v.item.id).join(',')}`)
      .join('|'),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const injector = inject(Injector);
    // notification-change: measure while the old entries are still drawn, play after the render.
    const flip = new FlipList();
    let committed: string | undefined;
    effect(() => {
      const signature = this.signature();
      if (committed === undefined || committed === signature) {
        committed = signature;
        return;
      }
      committed = signature;
      untracked(() => {
        flip.measure(movers(host));
        afterNextRender({ write: () => flip.play(host, movers, this.motion.mode('notification-change')) }, { injector });
      });
    });
    // Only the number rolls: the words stay whole, so Arabic letters keep their joins.
    const roller = new DigitRoller();
    afterRenderEffect(() => {
      const unread = this.unread();
      const mode = this.motion.mode('notification-change');
      roller.update(this.digits()?.nativeElement, unread > 0 ? String(unread) : undefined, mode, unread, (_d, el) =>
        popMark(el.closest('[data-part="count"]'), mode),
      );
    });
    consumeHostAttributes(['dsNotificationCenter', 'items', 'title', 'headingLevel', 'onMarkAllRead', 'markAllLabel', 'size', 'emptyTitle', 'emptyBody', 'now']);
  }

  private itemId(id: string): string {
    let v = this.itemIds.get(id);
    if (v === undefined) {
      v = this.ids.getId('ds-notification-');
      this.itemIds.set(id, v);
    }
    return v;
  }

  protected markAll(): void {
    // The button removes itself once nothing is unread. Move focus to the
    // panel title first, so it never falls to the page body.
    this.header().nativeElement.querySelector<HTMLElement>('[data-part="title"]')?.focus();
    this.onMarkAllRead()?.();
  }
}
