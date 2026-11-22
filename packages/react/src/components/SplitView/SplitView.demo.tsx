// SplitView demo. The copy follows the page language: with lang=ar every
// case reads Arabic. Subjects, senders and bodies are user content, so their
// text sits in an element with dir="auto": an English message in an Arabic
// app keeps its full stop at its own end.
import { useState, type CSSProperties } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { isArabic } from '../Popover/FloatingLayer';
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
      ? { list: 'الرسائل', detail: 'الرسالة', text: 'نص الرسالة', none: 'ما فيه رسالة مختارة. اختر رسالة من القائمة.', empty: 'ما فيه رسائل.' }
      : { list: 'Messages', detail: 'Message', text: 'Message text', none: 'No message selected. Choose one from the list.', empty: 'No messages yet.' };
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
                  <span dir="auto">{m.subject}</span>
                </Button>
              </li>
            ))}
          </ul>
        )
      }
      secondary={
        // The message scrolls on its own and holds nothing to focus: it is a tab stop with a name, so
        // the keyboard scrolls it too (WCAG 2.1.1, axe scrollable-region-focusable).
        <div style={detailStyle} {...(chosen ? { tabIndex: 0, role: 'region', 'aria-label': t.text } : {})}>
          {chosen ? (
            <>
              <strong style={{ display: 'block' }} dir="auto">
                {chosen.subject}
              </strong>
              <p data-demo="label" dir="auto">
                {chosen.from}
              </p>
              <p dir="auto">{chosen.body}</p>
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

/** The Arabic set gets a fourth message whose sender wrote in English: its text keeps its own direction. */
const arAll: Mail[] = [...ar, { from: 'Lina Saleh', subject: 'Interview notes', body: 'Notes from the five interviews are in the research folder.' }];

const manyAr: Mail[] = Array.from({ length: 12 }, (_, i) => ({
  from: 'الإشعارات',
  subject: `${sample.ar.items[i]}: الملخص الأسبوعي`,
  body: `ملخصك الأسبوعي لمجلد ${sample.ar.items[i]}.`,
}));

const tooManyAr: Mail[] = Array.from({ length: 150 }, (_, i) => ({
  from: 'خادم البناء',
  subject: `البناء ${i + 1} نجح`,
  body: `البناء ${i + 1} نجح في 4 دقائق.`,
}));

const sets = {
  en: { mails: en, many, tooMany, long: { from: sample.en.word, subject: sample.en.long, body: `${sample.en.long} ${sample.en.long}` } },
  ar: { mails: arAll, many: manyAr, tooMany: tooManyAr, long: { from: sample.ar.word, subject: sample.ar.long, body: `${sample.ar.long} ${sample.ar.long}` } },
};

/** SplitView in every content case. */
export default function SplitViewDemo() {
  const lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  const set = sets[lang];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Split, and stacked on narrow widths">
        <MailReader mails={set.mails} lang={lang} startOpen={0} />
        <DemoRow label="Stacked, list">
          <div style={{ inlineSize: '20rem' }}>
            <MailReader mails={set.mails} lang={lang} layout="stacked" />
          </div>
        </DemoRow>
        <DemoRow label="Stacked, detail">
          <div style={{ inlineSize: '20rem' }}>
            <MailReader mails={set.mails} lang={lang} layout="stacked" startOpen={1} />
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
        <MailReader mails={[]} lang={lang} blockSize="10rem" />
      </DemoCase>

      <DemoCase id="one" title="One message">
        <MailReader mails={set.mails.slice(0, 1)} lang={lang} blockSize="10rem" />
      </DemoCase>

      <DemoCase id="many" title="Twelve messages">
        <MailReader mails={set.many} lang={lang} startOpen={3} />
      </DemoCase>

      <DemoCase id="too-many" title="A hundred and fifty messages">
        <MailReader mails={set.tooMany} lang={lang} startOpen={0} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <MailReader mails={[set.long]} lang={lang} startOpen={0} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <MailReader mails={[{ from: sample.ar.word, subject: sample.ar.long, body: `${sample.ar.long} ${sample.ar.long}` }]} lang="ar" startOpen={0} />
      </DemoCase>
    </DemoPage>
  );
}
