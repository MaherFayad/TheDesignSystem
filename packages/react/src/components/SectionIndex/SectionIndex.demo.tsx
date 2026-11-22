// SectionIndex demo. Cases: variants (collapse auto and never in a short
// column), one, many (200 contacts in English), too-many (the same list in
// a short frame, keys collapse into gap dots), long-arabic (200 contacts in
// Arabic, the column at the left). No empty, loading, error, disabled or
// readonly: an index with no sections is not drawn, and it has no value.
// The names are made up from common first and family names. The copy and
// the alphabet follow the page language: with lang=ar every case reads
// Arabic. A name is user content, so it sits in a span with dir="auto".
import { useMemo, type CSSProperties } from 'react';
import { groupByInitial, indexAlphabet, indexEntries } from '@the-system/shared';
import { DemoCase, DemoPage } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { List, ListItem, ListSection } from '../List';
import { isArabic } from '../Popover/FloatingLayer';
import { SectionIndex, type SectionIndexSection } from './index';

const firstEn = [
  'Abdullah', 'Amal', 'Bader', 'Basma', 'Chris', 'Dana', 'Dalia', 'Ehab', 'Fahad', 'Farah', 'Ghada', 'Hassan', 'Hind', 'Ibrahim',
  'Jana', 'Jamal', 'Khalid', 'Lama', 'Layla', 'Majed', 'Maha', 'Nora', 'Nasser', 'Omar', 'Osama', 'Paula', 'Rana', 'Reem',
  'Saad', 'Sara', 'Tariq', 'Turki', 'Usman', 'Victor', 'Waleed', 'Wafa', 'Yara', 'Yousef', 'Zaid', 'Zainab',
];
const lastEn = ['Alqahtani', 'Alharbi', 'Alotaibi', 'Alghamdi', 'Alzahrani'];

const firstAr = [
  'أحمد', 'أمل', 'إبراهيم', 'بدر', 'بسمة', 'تركي', 'ثامر', 'جنى', 'جمال', 'حسن', 'حصة', 'خالد', 'دانة', 'ذياب', 'ريم', 'رنا', 'زياد',
  'زينب', 'سارة', 'سعد', 'شهد', 'صالح', 'ضاري', 'طارق', 'ظافر', 'عمر', 'عبير', 'غادة', 'فهد', 'فرح', 'قمر', 'كريم', 'لمى', 'ليلى',
  'ماجد', 'مها', 'نورة', 'ناصر', 'هند', 'هشام', 'وليد', 'وفاء', 'يارا', 'يوسف',
];
const lastAr = ['القحطاني', 'الحربي', 'العتيبي', 'الغامدي', 'الزهراني'];

/** Up to `count` names, each first name with each family name in turn. */
function names(first: string[], last: string[], count: number, extra: string[] = []): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < count - extra.length; i += 1) out.push(`${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}`);
  return [...out, ...extra];
}

const contactsEn = names(firstEn, lastEn, 200, ['3D print shop', '+966 Support line']);
const contactsAr = names(firstAr, lastAr, 200, ['Nora Smith', '911 الطوارئ']);

const frame = (height: string): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  columnGap: 'var(--ds-space-2xs)',
  blockSize: height,
  minBlockSize: '12rem',
  maxInlineSize: '28rem',
});

const scroller: CSSProperties = { overflowY: 'auto', overscrollBehavior: 'contain', minBlockSize: 0 };

interface ContactsProps {
  /** Prefix of the section ids, unique per case. */
  id: string;
  people: string[];
  locale: 'en' | 'ar';
  height: string;
  label: string;
  collapse?: 'auto' | 'never';
  /** Rows that open a contact. Off in the long lists, which keeps the page light: the scroller is then the Tab stop. */
  linked?: boolean;
}

/** A sectioned contact list in a scrolling frame with the index at its inline end. */
function Contacts({ id, people, locale, height, label, collapse, linked = false }: ContactsProps) {
  const groups = useMemo(() => groupByInitial(people, (n) => n, locale), [people, locale]);
  const sections = useMemo<SectionIndexSection[]>(() => {
    const ids = new Map(groups.map((g, i) => [g.key, `${id}-${i}`]));
    return indexEntries(indexAlphabet(locale), groups.map((g) => g.key)).map((e) => ({ key: e.key, target: ids.get(e.target)! }));
  }, [groups, id, locale]);
  return (
    <div style={frame(height)}>
      {/* A scroller with no links inside is a Tab stop of its own, so keyboard people can scroll it (axe scrollable-region-focusable). */}
      <div style={scroller} tabIndex={linked ? undefined : 0} role={linked ? undefined : 'region'} aria-label={linked ? undefined : label}>
        <List variant="inset" aria-label={label}>
          {groups.map((g, i) => (
            <ListSection key={g.key} id={`${id}-${i}`} header={g.key}>
              {g.items.map((name, k) => (
                <ListItem key={name} title={<span dir="auto">{name}</span>} href={linked ? `#${id}-${i}-${k}` : undefined} />
              ))}
            </ListSection>
          ))}
        </List>
      </div>
      <SectionIndex sections={sections} label={locale === 'ar' ? 'فهرس جهات الاتصال' : 'Contacts index'} collapse={collapse} />
    </div>
  );
}

const words = {
  en: {
    locale: 'en',
    contacts: contactsEn,
    one: ['Sara Alqahtani', 'Saad Alharbi', 'Sami Alotaibi'],
    auto: 'Contacts, collapse auto',
    never: 'Contacts, collapse never',
    oneLabel: 'Contacts with one section',
    label: 'Contacts',
    short: 'Contacts in a short frame',
  },
  ar: {
    locale: 'ar',
    contacts: contactsAr,
    one: ['سارة القحطاني', 'سعد الحربي', 'سامي العتيبي'],
    auto: 'جهات الاتصال، طي تلقائي',
    never: 'جهات الاتصال، بدون طي',
    oneLabel: 'جهات الاتصال في قسم واحد',
    label: 'جهات الاتصال',
    short: 'جهات الاتصال في إطار قصير',
  },
} as const;

export default function SectionIndexDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Collapse auto and never in a column 20rem tall">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-l)' }}>
          <Contacts id="si-auto" people={w.contacts.slice(0, 24)} locale={w.locale} height="20rem" label={w.auto} />
          <Contacts id="si-never" people={w.contacts.slice(0, 24)} locale={w.locale} height="20rem" label={w.never} collapse="never" />
        </div>
      </DemoCase>

      <DemoCase id="one" title="One section: every key goes to it">
        <Contacts id="si-one" people={[...w.one]} locale={w.locale} height="40rem" label={w.oneLabel} linked />
      </DemoCase>

      <DemoCase id="many" title="Contacts: 200 rows with the index beside them">
        <Contacts id="si-many" people={w.contacts} locale={w.locale} height="calc(100svh - 8rem)" label={w.label} />
      </DemoCase>

      <DemoCase id="too-many" title="80 contacts in a short frame: keys collapse into dots">
        <Contacts id="si-short" people={w.contacts.slice(0, 80)} locale={w.locale} height="22rem" label={w.short} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic contacts: 200 rows, the index at the left" lang="ar">
        <Contacts id="si-ar" people={contactsAr} locale="ar" height="calc(100svh - 8rem)" label="جهات الاتصال" />
      </DemoCase>
    </DemoPage>
  );
}
