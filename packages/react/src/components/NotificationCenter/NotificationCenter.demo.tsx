'use client';
// NotificationCenter demo. A fixed clock keeps the relative times and the
// day groups the same in every screenshot. The panel sits in a bordered box
// standing in for the Popover or Sheet a consumer puts it in.
import { useState, type ReactNode } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme';
import { NotificationCenter, type NotificationItem } from './index';

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

function Panel({ children, width = '24rem' }: { children: ReactNode; width?: string }) {
  return (
    <div
      style={{
        maxInlineSize: width,
        border: 'var(--ds-border-width-default) solid var(--ds-color-bg-overlay-10)',
        borderRadius: 'var(--ds-radius-panel)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/** A panel whose mark all read and per item actions change its own state. */
function Live({ initial, lang = 'en', size }: { initial: NotificationItem[]; lang?: 'en' | 'ar'; size?: 'sm' | 'md' }) {
  const [items, setItems] = useState(initial);
  const withRead = items.map((i) => ({
    ...i,
    actions: i.actions?.map((a) => ({
      ...a,
      onAction: () => setItems((all) => all.map((x) => (x.id === i.id ? { ...x, unread: false } : x))),
    })),
  }));
  return (
    <NotificationCenter lang={lang} size={size} now={now} items={withRead} onMarkAllRead={() => setItems((all) => all.map((x) => ({ ...x, unread: false })))} />
  );
}

const many: NotificationItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `m${i}`,
  title: `Lina commented on Frame ${i + 1}`,
  time: ago(i * 95 + 2),
  unread: i < 5,
  icon: 'edit',
}));

export default function NotificationCenterDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: md and sm, unread and read, every tone, grouped by day">
        <DemoGrid min="20rem">
          <Panel>
            <Live initial={english} />
          </Panel>
          <Panel width="20rem">
            <Live initial={english} size="sm" />
          </Panel>
        </DemoGrid>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <Panel>
            <Live initial={arabic} lang="ar" />
          </Panel>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Panel>
          <NotificationCenter lang="en" items={[]} now={now} onMarkAllRead={() => undefined} />
        </Panel>
      </DemoCase>

      <DemoCase id="one" title="One read notification, so no count and no mark all">
        <Panel>
          <NotificationCenter lang="en" items={[english[2] as NotificationItem]} now={now} onMarkAllRead={() => undefined} />
        </Panel>
      </DemoCase>

      <DemoCase id="many" title="Many: named groups from the consumer">
        <Panel>
          <Live
            initial={[
              { ...(english[0] as NotificationItem), group: 'Mentions' },
              { ...(english[1] as NotificationItem), group: 'Invites' },
              { ...(english[2] as NotificationItem), group: 'System' },
              { ...(english[3] as NotificationItem), group: 'System' },
            ]}
          />
        </Panel>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the consumer's popover scrolls the panel">
        <Panel>
          <div style={{ maxBlockSize: '24rem', overflowY: 'auto' }}>
            <Live initial={many} />
          </div>
        </Panel>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps in full">
        <Panel width="20rem">
          <NotificationCenter
            lang="en"
            now={now}
            items={[
              {
                id: 'l1',
                title: 'Sara Alqahtani, Omar Alharbi and 4 others commented on Quarterly planning board for the design team',
                body: 'The newest comment says the second section needs a shorter title and a picture that shows the product in use, not the box.',
                time: ago(12),
                unread: true,
                icon: 'edit',
              },
            ]}
          />
        </Panel>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Panel width="20rem">
          <NotificationCenter
            lang="ar"
            now={now}
            items={[
              {
                id: 'la1',
                title: 'سارة القحطاني وعمر الحربي و4 غيرهم علقوا على لوحة التخطيط الربع سنوي لفريق التصميم',
                body: 'آخر تعليق يقول إن القسم الثاني يحتاج عنوان أقصر وصورة توضح المنتج وهو مستخدم، مو بس العلبة.',
                time: ago(12),
                unread: true,
                icon: 'edit',
              },
            ]}
          />
        </Panel>
      </DemoCase>
    </DemoPage>
  );
}
