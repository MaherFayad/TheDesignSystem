// SwipeActions demo. Cases: variants (an inset mail list with actions on
// both sides, a divided list with end actions only, and SwipeActions around
// content outside a List), one (one row), many (an inbox where delete
// removes the row and archive runs on a full swipe toward the start side),
// too-many (four actions given on a side: three are kept), long-text,
// long-arabic (the inbox in Arabic: end actions at the left), disabled (a
// disabled row draws no swipe). No empty, loading, error or readonly: an
// empty list draws no rows to swipe, and the actions have no value.
//
// Names and subjects are made up. The copy follows the page language: with
// lang=ar every case reads Arabic. Names and subjects are user content, so
// their text sits in a span with dir="auto".
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { List, ListItem, type ListVariant } from '../List';
import { Button } from '../Button';
import { isArabic } from '../Popover/FloatingLayer';
import { SwipeActions, type SwipeAction } from './index';

interface Mail {
  id: string;
  from: string;
  subject: string;
  time: string;
}

const inboxEn: Mail[] = [
  { id: 'm1', from: 'Sara Alqahtani', subject: 'Brand review moved to Thursday', time: '09:24' },
  { id: 'm2', from: 'Omar Alharbi', subject: 'Invoice 2041 is ready to download', time: '08:10' },
  { id: 'm3', from: 'Design team', subject: 'New comments on the onboarding board', time: 'Mon' },
  { id: 'm4', from: 'Lama Alotaibi', subject: 'Photos from the site visit', time: 'Sun' },
];

const inboxAr: Mail[] = [
  { id: 'a1', from: 'سارة القحطاني', subject: 'تأجيل مراجعة الهوية ليوم الخميس', time: '09:24' },
  { id: 'a2', from: 'عمر الحربي', subject: 'الفاتورة 2041 جاهزة للتنزيل', time: '08:10' },
  { id: 'a3', from: 'فريق التصميم', subject: 'تعليقات جديدة على لوحة التعريف بالتطبيق', time: 'الاثنين' },
];

const words = {
  en: {
    del: 'Delete',
    mute: 'Mute',
    pin: 'Pin',
    archive: 'Archive',
    read: 'Mark read',
    menu: (from: string) => `Actions for ${from}`,
    itemMenu: (name: string) => `Actions for ${name}`,
    done: (verb: string, from: string) => `${verb}: ${from}`,
    reset: 'Reset inbox',
    inbox: 'Inbox',
    send: 'Send',
    share: 'Share',
    muteAll: 'Mute notifications',
    inset: 'Inbox, inset',
    divided: 'Inbox, divided',
    draftMenu: 'Actions for the draft of the launch note',
    draft: 'Launch note',
    draftMeta: 'Draft, edited 2 minutes ago',
    extra: { id: 'm5', from: 'Yousef Alzahrani', subject: 'Contract for the March shoot', time: '12 Mar' },
    saved: 'Saved items',
    guide: 'Field guide to desert plants',
    guideMeta: 'Saved from the reading list',
    longRows: 'Long rows',
    longTitle: 'Quarterly brand guidelines review with the regional marketing teams and the agency',
    longDescription: 'Your changes are saved to your account. Open the board on any other device to see the same version.',
    longMenu: 'Actions for the quarterly brand guidelines review',
    boards: 'Boards',
    brand: 'Brand board',
    open: 'Open',
    finance: 'Finance board',
    noAccess: 'You need access from an admin',
  },
  ar: {
    del: 'حذف',
    mute: 'كتم',
    pin: 'تثبيت',
    archive: 'أرشفة',
    read: 'تعليم كمقروءة',
    menu: (from: string) => `خيارات رسالة ${from}`,
    itemMenu: (name: string) => `خيارات ${name}`,
    done: (verb: string, from: string) => `${verb}: ${from}`,
    reset: 'استرجاع الوارد',
    inbox: 'الوارد',
    send: 'إرسال',
    share: 'مشاركة',
    muteAll: 'كتم الإشعارات',
    inset: 'الوارد، داخل إطار',
    divided: 'الوارد، بفواصل',
    draftMenu: 'خيارات مسودة ملاحظة الإطلاق',
    draft: 'ملاحظة الإطلاق',
    draftMeta: 'مسودة، تعدلت قبل دقيقتين',
    extra: { id: 'a5', from: 'يوسف الزهراني', subject: 'عقد تصوير شهر مارس', time: '12 مارس' },
    saved: 'العناصر المحفوظة',
    guide: 'دليل نباتات الصحراء',
    guideMeta: 'محفوظ من قائمة القراءة',
    longRows: 'صفوف طويلة',
    longTitle: 'مراجعة دليل الهوية للربع الرابع مع فرق التسويق في المناطق والوكالة',
    longDescription: 'تعديلاتك محفوظة في حسابك. افتح اللوحة من أي جهاز ثاني وبتلقى نفس النسخة.',
    longMenu: 'خيارات مراجعة دليل الهوية',
    boards: 'اللوحات',
    brand: 'لوحة الهوية',
    open: 'مفتوحة',
    finance: 'لوحة المالية',
    noAccess: 'تحتاج صلاحية من المشرف',
  },
} as const;

interface InboxProps {
  lang?: 'en' | 'ar';
  variant?: ListVariant;
  mail?: Mail[];
  /** Which sides carry actions. */
  sides?: 'both' | 'end';
  /** Archive at the start edge runs on a full swipe. */
  fullStart?: boolean;
  /** A mouse may drag the rows too. */
  pointer?: boolean;
  label?: string;
}

/** A small inbox whose swipe actions work: delete and archive remove the row, the rest say what ran. */
function Inbox({ lang = 'en', variant = 'inset', mail = lang === 'ar' ? inboxAr : inboxEn, sides = 'both', fullStart = false, pointer = false, label }: InboxProps) {
  const w = words[lang];
  const [rows, setRows] = useState(mail);
  const [last, setLast] = useState('');
  const remove = (m: Mail, verb: string) => {
    setRows((all) => all.filter((r) => r.id !== m.id));
    setLast(w.done(verb, m.from));
  };
  const note = (m: Mail, verb: string) => setLast(w.done(verb, m.from));
  const start = (m: Mail): SwipeAction[] => [
    { label: w.archive, icon: 'inbox', tone: 'accent', undoable: true, onSelect: () => remove(m, w.archive) },
    { label: w.read, icon: 'mail', onSelect: () => note(m, w.read) },
  ];
  const end = (m: Mail): SwipeAction[] => [
    { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => remove(m, w.del) },
    { label: w.pin, icon: 'star', tone: 'warning', onSelect: () => note(m, w.pin) },
    { label: w.mute, icon: 'bell-off', onSelect: () => note(m, w.mute) },
  ];
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-xs)' }}>
      <List variant={variant} aria-label={label ?? w.inbox}>
        {rows.map((m) => (
          <ListItem
            key={m.id}
            href={`#${m.id}`}
            start="mail"
            title={<span dir="auto">{m.from}</span>}
            description={<span dir="auto">{m.subject}</span>}
            end={m.time}
            swipe={
              <SwipeActions
                start={sides === 'both' ? start(m) : undefined}
                end={end(m)}
                fullSwipe={fullStart ? 'start' : undefined}
                pointer={pointer}
                menuLabel={w.menu(m.from)}
              />
            }
          />
        ))}
      </List>
      <p role="status" style={{ margin: 0, minBlockSize: '1.5em', color: 'var(--ds-color-text-muted)' }}>
        {last}
      </p>
      {rows.length < mail.length && (
        <div>
          <Button size="sm" onClick={() => setRows(mail)}>
            {w.reset}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SwipeActionsDemo() {
  const [note, setNote] = useState('');
  const lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  const w = words[lang];
  const inbox = lang === 'ar' ? inboxAr : inboxEn;
  const said = (verb: string) => setNote(`${verb}: ${w.draft}`);
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: actions on both sides in an inset list, end only in a divided list, and content outside a list">
        <DemoGrid min="20rem">
          <Inbox lang={lang} label={w.inset} />
          <Inbox lang={lang} variant="divided" sides="end" label={w.divided} pointer />
          <div style={{ display: 'grid', gap: 'var(--ds-space-xs)', alignContent: 'start' }}>
            <SwipeActions
              menuLabel={w.draftMenu}
              end={[
                { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => said(w.del) },
                { label: w.pin, icon: 'star', tone: 'warning', onSelect: () => said(w.pin) },
              ]}
              start={[{ label: w.send, icon: 'send', tone: 'accent', onSelect: () => said(w.send) }]}
            >
              <div style={{ padding: 'var(--ds-space-s)' }}>
                <strong>{w.draft}</strong>
                <div style={{ color: 'var(--ds-color-text-muted)' }}>{w.draftMeta}</div>
              </div>
            </SwipeActions>
            <p role="status" style={{ margin: 0, color: 'var(--ds-color-text-muted)' }}>
              {note}
            </p>
          </div>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One row">
        <div style={{ maxInlineSize: '24rem' }}>
          <Inbox lang={lang} mail={inbox.slice(0, 1)} />
        </div>
      </DemoCase>

      <DemoCase id="many" title="Many: delete removes the row, a full swipe toward the start archives it">
        <div style={{ maxInlineSize: '26rem' }}>
          <Inbox lang={lang} fullStart mail={[...inbox, w.extra]} />
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: four end actions given, three kept">
        <div style={{ maxInlineSize: '24rem' }}>
          <List variant="inset" aria-label={w.saved}>
            <ListItem
              href="#saved-1"
              start="file"
              title={w.guide}
              description={w.guideMeta}
              swipe={
                <SwipeActions
                  menuLabel={w.itemMenu(w.guide)}
                  end={[
                    { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => undefined },
                    { label: w.pin, icon: 'star', tone: 'warning', onSelect: () => undefined },
                    { label: w.mute, icon: 'bell-off', onSelect: () => undefined },
                    { label: w.share, icon: 'send', onSelect: () => undefined },
                  ]}
                />
              }
            />
          </List>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <div style={{ maxInlineSize: '22rem' }}>
          <List variant="inset" aria-label={w.longRows}>
            <ListItem
              href="#long-1"
              start="mail"
              title={w.longTitle}
              description={w.longDescription}
              end="12:40"
              swipe={
                <SwipeActions
                  menuLabel={w.longMenu}
                  start={[{ label: w.read, icon: 'mail', onSelect: () => undefined }]}
                  end={[
                    { label: w.del, icon: 'trash', tone: 'danger', onSelect: () => undefined },
                    { label: w.muteAll, icon: 'bell-off', onSelect: () => undefined },
                  ]}
                />
              }
            />
          </List>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ maxInlineSize: '26rem' }}>
          <Inbox
            lang="ar"
            mail={[
              ...inboxAr,
              {
                id: 'a4',
                from: 'لمى العتيبي من فريق المبيعات في المنطقة الشرقية',
                subject: 'صور زيارة الموقع مع ملاحظات الفريق عن الإضاءة وأماكن التصوير في المبنى الجديد',
                time: '12:40',
              },
            ]}
          />
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled row: no swipe and no menu">
        <div style={{ maxInlineSize: '24rem' }}>
          <List variant="inset" aria-label={w.boards}>
            <ListItem
              href="#board-open"
              start="grid"
              title={w.brand}
              description={w.open}
              swipe={<SwipeActions menuLabel={w.itemMenu(w.brand)} end={[{ label: w.del, icon: 'trash', tone: 'danger', onSelect: () => undefined }]} />}
            />
            <ListItem
              href="#board-locked"
              start="lock"
              title={w.finance}
              description={w.noAccess}
              disabled
              swipe={<SwipeActions menuLabel={w.itemMenu(w.finance)} end={[{ label: w.del, icon: 'trash', tone: 'danger', onSelect: () => undefined }]} />}
            />
          </List>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
