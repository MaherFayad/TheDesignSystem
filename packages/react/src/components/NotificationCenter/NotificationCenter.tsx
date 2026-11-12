'use client';
// NotificationCenter: the panel of notifications. A grouped list with
// unread marks, a mark all read action, per item actions and an empty
// state. A consumer puts it in a Popover or a Sheet; it draws no overlay.
//
// Sources: GoBanana `NotificationStack.tsx` and desktop.css were not
// reachable from the lane session. Designed from the dials table in
// PLAN.md section 3.7, Toast (tones, icons) and ErrorState (empty part).
//
// Anatomy: root [data-ds=notification-center] with data-size and
// data-empty, and the parts header, title, count, mark-all (a Button root),
// group, group-label, item (an article with data-unread), item-icon,
// item-title, item-body, item-time (a time element), item-actions, unread
// (the dot with a hidden word) and empty.
//
// It is not a feed (no role feed): a list per group with a heading, each
// item an article in a list item. Items are tab stops so a keyboard user
// can reach and read each one; Tab then reaches the item's actions. No
// roving focus. The panel never announces: a new item is announced once by
// the consumer through toast().
import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import type { Size, Tone } from '@the-system/shared';
import type { IconName } from '@the-system/icons';
import { Icon } from '@the-system/icons/react';
import { Button } from '../Button';
import { dayGroup, formatRelativeTime, notificationLanguage, toDate, type DayGroup } from './time';

export type NotificationCenterSize = Extract<Size, 'sm' | 'md'>;
export type NotificationTone = Tone;

export interface NotificationAction {
  /** A verb plus a noun: Open board, Accept invite. */
  label: string;
  onAction: () => void;
}

export interface NotificationItem {
  id: string;
  /** One line: what happened, naming the thing and who. */
  title: ReactNode;
  body?: ReactNode;
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
    groups: {
      today: 'Today',
      yesterday: 'Yesterday',
      earlier: 'Earlier',
    } as Record<DayGroup, string>,
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

/** No `title` attribute: the title prop is the heading, and hints come from Tooltip. */
export interface NotificationCenterProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  items: NotificationItem[];
  /** The panel heading. Default "Notifications", Arabic under lang ar. */
  title?: ReactNode;
  /** The heading level of the title; group labels take the next level. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5;
  /** Renders the mark all read Button while any item is unread, and is called by it. */
  onMarkAllRead?: () => void;
  /** The mark all read label. Default "Mark all as read". */
  markAllLabel?: string;
  /** Default md. sm is for a narrow popover. */
  size?: NotificationCenterSize;
  /** The empty state title. Default "No notifications". */
  emptyTitle?: ReactNode;
  /** The empty state body: what shows up here. */
  emptyBody?: ReactNode;
  /** The clock for relative times and day groups. Default the time of render; pass it when rendering on the server, so server and client agree. */
  now?: Date;
  ref?: Ref<HTMLElement>;
}

interface Group {
  key: string;
  label: string;
  items: NotificationItem[];
}

function groupItems(items: NotificationItem[], now: Date, labels: Record<DayGroup, string>): Group[] {
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const item of items) {
    const label = item.group ?? labels[dayGroup(toDate(item.time), now)];
    let group = byKey.get(label);
    if (!group) {
      group = { key: label, label, items: [] };
      byKey.set(label, group);
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function Item({ item, now, lang, unreadWord }: { item: NotificationItem; now: Date; lang: 'en' | 'ar'; unreadWord: string }) {
  const titleId = useId();
  const time = toDate(item.time);
  const tone = item.tone ?? 'neutral';
  const actions = item.actions?.slice(0, 2) ?? [];
  return (
    <li data-entry="">
      <article data-part="item" data-tone={tone} data-unread={item.unread ? '' : undefined} aria-labelledby={titleId} tabIndex={0}>
        <span data-part="item-icon" aria-hidden="true">
          <Icon name={item.icon ?? notificationIcons[tone]} size="md" />
        </span>
        <p data-part="item-title" id={titleId}>
          {item.unread && (
            <span data-part="unread">
              <span data-unread-word="">{unreadWord}: </span>
            </span>
          )}
          {item.title}
        </p>
        {item.body !== undefined && item.body !== '' && <p data-part="item-body">{item.body}</p>}
        <time data-part="item-time" dateTime={time.toISOString()}>
          {formatRelativeTime(time, now, lang)}
        </time>
        {actions.length > 0 && (
          <div data-part="item-actions">
            {actions.map((a) => (
              <Button key={a.label} size="sm" emphasis="soft" onClick={a.onAction}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </article>
    </li>
  );
}

export function NotificationCenter({
  items,
  title,
  headingLevel = 2,
  onMarkAllRead,
  markAllLabel,
  size = 'md',
  emptyTitle,
  emptyBody,
  now: nowProp,
  lang,
  ...rest
}: NotificationCenterProps) {
  const titleId = useId();
  const language = notificationLanguage(lang);
  const words = notificationCenterLabels[language];
  const now = nowProp ?? new Date();
  const unread = items.filter((i) => i.unread).length;
  const empty = items.length === 0;
  const Heading = `h${headingLevel}` as const;
  const GroupHeading = `h${headingLevel + 1}` as 'h3' | 'h4' | 'h5' | 'h6';
  const groups = groupItems(items, now, words.groups);
  return (
    <section
      aria-labelledby={titleId}
      {...rest}
      lang={lang}
      dir={rest.dir ?? (lang === undefined ? undefined : language === 'ar' ? 'rtl' : 'ltr')}
      data-ds="notification-center"
      data-size={size}
      data-empty={empty ? '' : undefined}
    >
      <div data-part="header">
        <Heading data-part="title" id={titleId}>
          {title ?? words.title}
        </Heading>
        {unread > 0 && <span data-part="count">{words.count(unread)}</span>}
        {onMarkAllRead !== undefined && unread > 0 && (
          <Button data-part="mark-all" size="sm" emphasis="ghost" start="check-double" onClick={onMarkAllRead}>
            {markAllLabel ?? words.markAll}
          </Button>
        )}
      </div>
      {empty ? (
        <div data-part="empty">
          <Icon name="bell-off" size="lg" />
          <p data-empty-title="">{emptyTitle ?? words.emptyTitle}</p>
          <p data-empty-body="">{emptyBody ?? words.emptyBody}</p>
        </div>
      ) : (
        groups.map((g, index) => {
          const labelId = `${titleId}-g${index}`;
          return (
            <div data-part="group" key={g.key} role="group" aria-labelledby={labelId}>
              <GroupHeading data-part="group-label" id={labelId}>
                {g.label}
              </GroupHeading>
              <ul data-list="">
                {g.items.map((item) => (
                  <Item key={item.id} item={item} now={now} lang={language} unreadWord={words.unread} />
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
