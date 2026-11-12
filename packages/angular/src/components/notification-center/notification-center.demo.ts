// NotificationCenter demo: the same cases, ids and copy as
// packages/react/src/components/NotificationCenter/NotificationCenter.demo.tsx.
// Each live panel keeps its own items: mark all read and the item actions
// mark items read.
import { ChangeDetectionStrategy, Component, computed, signal, type Signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsNotificationCenter, type NotificationItem } from './notification-center';

const now = new Date(2026, 10, 12, 15, 0, 0);
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

const english: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Sara mentioned you in Launch plan',
    body: 'Can you check the hero copy before Thursday?',
    time: ago(4),
    unread: true,
    tone: 'accent',
    icon: 'user',
    actions: [{ label: 'Open comment', onAction: () => undefined }],
  },
  {
    id: 'n2',
    title: 'Omar invited you to Brand refresh',
    time: ago(52),
    unread: true,
    tone: 'info',
    icon: 'mail',
    actions: [
      { label: 'Accept invite', onAction: () => undefined },
      { label: 'Decline invite', onAction: () => undefined },
    ],
  },
  {
    id: 'n3',
    title: 'Export of Q3 report finished',
    body: 'report-q3.pdf is in your downloads.',
    time: ago(180),
    tone: 'success',
  },
  {
    id: 'n4',
    title: 'Storage almost full',
    body: 'You have 200 MB left on this plan.',
    time: ago(60 * 20),
    tone: 'warning',
  },
  {
    id: 'n5',
    title: 'Could not sync Moodboard',
    body: 'The file is still on this device.',
    time: ago(60 * 24 * 3),
    tone: 'danger',
  },
];

const arabic: NotificationItem[] = [
  {
    id: 'a1',
    title: 'سارة أشارت لك في خطة الإطلاق',
    body: 'ممكن تراجع نص الواجهة قبل الخميس؟',
    time: ago(4),
    unread: true,
    tone: 'accent',
    icon: 'user',
    actions: [{ label: 'فتح التعليق', onAction: () => undefined }],
  },
  {
    id: 'a2',
    title: 'تصدير تقرير الربع الثالث جاهز',
    time: ago(180),
    tone: 'success',
  },
  {
    id: 'a3',
    title: 'تعذر مزامنة لوحة الإلهام',
    body: 'الملف محفوظ على هذا الجهاز.',
    time: ago(60 * 24 * 3),
    tone: 'danger',
  },
];

const many: NotificationItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `m${i}`,
  title: `Lina commented on Frame ${i + 1}`,
  time: ago(i * 95 + 2),
  unread: i < 5,
  icon: 'edit',
}));

const PANEL = 'border: var(--ds-border-width-default) solid var(--ds-color-bg-overlay-10); border-radius: var(--ds-radius-panel); overflow: hidden;';

/** A panel whose mark all read and per item actions change its own state. */
class Live {
  private readonly state;
  readonly items: Signal<NotificationItem[]>;
  readonly markAll = () => this.state.update((all) => all.map((x) => ({ ...x, unread: false })));

  constructor(initial: NotificationItem[]) {
    this.state = signal(initial);
    this.items = computed(() =>
      this.state().map((i) => ({
        ...i,
        actions: i.actions?.map((a) => ({
          ...a,
          onAction: () => this.state.update((all) => all.map((x) => (x.id === i.id ? { ...x, unread: false } : x))),
        })),
      })),
    );
  }
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsNotificationCenter, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: md and sm, unread and read, every tone, grouped by day">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));">
        <div style="max-inline-size: 24rem; ${PANEL}">
          <section dsNotificationCenter lang="en" [now]="now" [items]="en.items()" [onMarkAllRead]="en.markAll"></section>
        </div>
        <div style="max-inline-size: 20rem; ${PANEL}">
          <section dsNotificationCenter lang="en" size="sm" [now]="now" [items]="sm.items()" [onMarkAllRead]="sm.markAll"></section>
        </div>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: 24rem; ${PANEL}">
          <section dsNotificationCenter lang="ar" [now]="now" [items]="ar.items()" [onMarkAllRead]="ar.markAll"></section>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div style="max-inline-size: 24rem; ${PANEL}">
        <section dsNotificationCenter lang="en" [items]="[]" [now]="now" [onMarkAllRead]="noop"></section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One read notification, so no count and no mark all">
      <div style="max-inline-size: 24rem; ${PANEL}">
        <section dsNotificationCenter lang="en" [items]="one" [now]="now" [onMarkAllRead]="noop"></section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: named groups from the consumer">
      <div style="max-inline-size: 24rem; ${PANEL}">
        <section dsNotificationCenter lang="en" [now]="now" [items]="named.items()" [onMarkAllRead]="named.markAll"></section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: the consumer's popover scrolls the panel">
      <div style="max-inline-size: 24rem; ${PANEL}">
        <div style="max-block-size: 24rem; overflow-y: auto;">
          <section dsNotificationCenter lang="en" [now]="now" [items]="lots.items()" [onMarkAllRead]="lots.markAll"></section>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text wraps in full">
      <div style="max-inline-size: 20rem; ${PANEL}">
        <section dsNotificationCenter lang="en" [now]="now" [items]="longEn"></section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: 20rem; ${PANEL}">
          <section dsNotificationCenter lang="ar" [now]="now" [items]="longAr"></section>
        </div>
      </div>
    </section>
  `,
})
export default class NotificationCenterDemo {
  protected readonly now = now;
  protected readonly noop = () => undefined;
  protected readonly en = new Live(english);
  protected readonly sm = new Live(english);
  protected readonly ar = new Live(arabic);
  protected readonly named = new Live([
    { ...(english[0] as NotificationItem), group: 'Mentions' },
    { ...(english[1] as NotificationItem), group: 'Invites' },
    { ...(english[2] as NotificationItem), group: 'System' },
    { ...(english[3] as NotificationItem), group: 'System' },
  ]);
  protected readonly lots = new Live(many);
  protected readonly one = [english[2] as NotificationItem];
  protected readonly longEn: NotificationItem[] = [
    {
      id: 'l1',
      title: 'Sara Alqahtani, Omar Alharbi and 4 others commented on Quarterly planning board for the design team',
      body: 'The newest comment says the second section needs a shorter title and a picture that shows the product in use, not the box.',
      time: ago(12),
      unread: true,
      icon: 'edit',
    },
  ];
  protected readonly longAr: NotificationItem[] = [
    {
      id: 'la1',
      title: 'سارة القحطاني وعمر الحربي و4 غيرهم علقوا على لوحة التخطيط الربع سنوي لفريق التصميم',
      body: 'آخر تعليق يقول إن القسم الثاني يحتاج عنوان أقصر وصورة توضح المنتج وهو مستخدم، مو بس العلبة.',
      time: ago(12),
      unread: true,
      icon: 'edit',
    },
  ];
}
