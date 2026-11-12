import { useState, type CSSProperties } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { SplitView, type SplitViewLayout } from './index';

interface Mail {
  from: string;
  subject: string;
  body: string;
}

const en: Mail[] = [
  { from: 'Sara Ahmed', subject: 'Review the spring launch board', body: 'The hero directions are ready. Leave your comments on the board by Thursday.' },
  { from: 'Omar Khalid', subject: 'Invoice for October', body: 'The invoice is attached. Payment is due in 30 days.' },
  { from: 'Design team', subject: 'New icons in the library', body: 'Twelve new icons are in the shared library. Update the library in your file to use them.' },
  { from: 'Lina Saleh', subject: 'Interview notes', body: 'Notes from the five interviews are in the research folder.' },
];

const ar: Mail[] = [
  { from: 'سارة أحمد', subject: 'مراجعة لوحة إطلاق الربيع', body: 'اتجاهات الواجهة جاهزة. اكتب ملاحظاتك على اللوحة قبل الخميس.' },
  { from: 'عمر خالد', subject: 'فاتورة أكتوبر', body: 'الفاتورة مرفقة، والدفع خلال 30 يوم.' },
  { from: 'فريق التصميم', subject: 'أيقونات جديدة في المكتبة', body: 'فيه 12 أيقونة جديدة في المكتبة المشتركة. حدث المكتبة في ملفك عشان تستخدمها.' },
];

const frame = (blockSize = '16rem'): CSSProperties => ({
  blockSize,
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  borderRadius: 'var(--ds-radius-card)',
});

const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 'var(--ds-space-s)', overflow: 'auto', flex: '1 1 auto' };
const detailStyle: CSSProperties = { padding: 'var(--ds-space-l)', overflow: 'auto', flex: '1 1 auto' };

interface MailReaderProps {
  mails: readonly Mail[];
  layout?: SplitViewLayout;
  lang?: 'en' | 'ar';
  startOpen?: number;
  blockSize?: string;
}

/** A mail reader: the list opens a message in the detail pane. */
function MailReader({ mails, layout = 'auto', lang = 'en', startOpen, blockSize }: MailReaderProps) {
  const [open, setOpen] = useState<number | null>(startOpen ?? null);
  const [show, setShow] = useState(startOpen !== undefined);
  const chosen = open === null ? undefined : mails[open];
  const t =
    lang === 'ar'
      ? { list: 'الرسائل', detail: 'الرسالة', none: 'ما فيه رسالة مختارة. اختر رسالة من القائمة.', empty: 'ما فيه رسائل.' }
      : { list: 'Messages', detail: 'Message', none: 'No message selected. Choose one from the list.', empty: 'No messages yet.' };
  return (
    <SplitView
      layout={layout}
      style={frame(blockSize)}
      primaryLabel={t.list}
      secondaryLabel={t.detail}
      showSecondary={show}
      onShowSecondaryChange={setShow}
      primary={
        mails.length === 0 ? (
          <p style={detailStyle}>{t.empty}</p>
        ) : (
          <ul style={listStyle}>
            {mails.map((m, i) => (
              <li key={`${m.subject}-${i}`}>
                <Button
                  emphasis={open === i ? 'soft' : 'ghost'}
                  fullWidth
                  aria-current={open === i ? 'true' : undefined}
                  onClick={() => {
                    setOpen(i);
                    setShow(true);
                  }}
                >
                  {m.subject}
                </Button>
              </li>
            ))}
          </ul>
        )
      }
      secondary={
        <div style={detailStyle}>
          {chosen ? (
            <>
              <strong style={{ display: 'block' }}>{chosen.subject}</strong>
              <p data-demo="label">{chosen.from}</p>
              <p>{chosen.body}</p>
            </>
          ) : (
            <p>{t.none}</p>
          )}
        </div>
      }
    />
  );
}

const many: Mail[] = Array.from({ length: 12 }, (_, i) => ({
  from: 'Notifications',
  subject: `${sample.en.items[i]}: weekly summary`,
  body: `Your weekly summary for ${sample.en.items[i]?.toLowerCase()}.`,
}));

const tooMany: Mail[] = Array.from({ length: 150 }, (_, i) => ({
  from: 'Build server',
  subject: `Build ${i + 1} passed`,
  body: `Build ${i + 1} passed in 4 minutes.`,
}));

/** SplitView in every content case. */
export default function SplitViewDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Split, and stacked on narrow widths">
        <MailReader mails={en} startOpen={0} />
        <DemoRow label="Stacked, list">
          <div style={{ inlineSize: '20rem' }}>
            <MailReader mails={en} layout="stacked" />
          </div>
        </DemoRow>
        <DemoRow label="Stacked, detail">
          <div style={{ inlineSize: '20rem' }}>
            <MailReader mails={en} layout="stacked" startOpen={1} />
          </div>
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="العربية">
            <div style={{ inlineSize: '100%' }}>
              <MailReader mails={ar} lang="ar" startOpen={0} />
            </div>
          </DemoRow>
          <DemoRow label="مكدس">
            <div style={{ inlineSize: '20rem' }}>
              <MailReader mails={ar} lang="ar" layout="stacked" startOpen={2} />
            </div>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No messages">
        <MailReader mails={[]} blockSize="10rem" />
      </DemoCase>

      <DemoCase id="one" title="One message">
        <MailReader mails={en.slice(0, 1)} blockSize="10rem" />
      </DemoCase>

      <DemoCase id="many" title="Twelve messages">
        <MailReader mails={many} startOpen={3} />
      </DemoCase>

      <DemoCase id="too-many" title="A hundred and fifty messages">
        <MailReader mails={tooMany} startOpen={0} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <MailReader mails={[{ from: sample.en.word, subject: sample.en.long, body: `${sample.en.long} ${sample.en.long}` }]} startOpen={0} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <MailReader mails={[{ from: sample.ar.word, subject: sample.ar.long, body: `${sample.ar.long} ${sample.ar.long}` }]} lang="ar" startOpen={0} />
      </DemoCase>
    </DemoPage>
  );
}
