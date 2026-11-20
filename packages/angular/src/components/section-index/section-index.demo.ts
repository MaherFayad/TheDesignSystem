// The SectionIndex demo: the same cases, ids and copy as
// packages/react/src/components/SectionIndex/SectionIndex.demo.tsx. Cases:
// variants (collapse auto and never in a short column), one, many (200
// contacts in English), too-many (the same list in a short frame, keys
// collapse into gap dots), long-arabic (200 contacts in Arabic, the column
// at the left). React's Contacts function is a component on the frame div
// itself, so the DOM has no extra element.
import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { groupByInitial, indexAlphabet, indexEntries } from '@the-system/shared';
import { DEMO } from '../../demo/demo';
import { consumeHostAttributes } from '../../internal/host';
import { DsTheme } from '../../theme/theme';
import { DsList, DsListItem, DsListSection } from '../list/list';
import { DsSectionIndex, type SectionIndexCollapse, type SectionIndexSection } from './section-index';

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

/** A sectioned contact list in a scrolling frame with the index at its inline end. The host is the frame. */
@Component({
  selector: 'div[dsDemoContacts]',
  imports: [DsList, DsListItem, DsListSection, DsSectionIndex],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'frame()',
  },
  template: `
    <!-- A scroller with no links inside is a Tab stop of its own, so keyboard people can scroll it (axe scrollable-region-focusable). -->
    <div
      style="overflow-y: auto; overscroll-behavior: contain; min-block-size: 0"
      [attr.tabindex]="linked() ? null : 0"
      [attr.role]="linked() ? null : 'region'"
      [attr.aria-label]="linked() ? null : label()"
    >
      <ul dsList variant="inset" [aria-label]="label()">
        @for (g of groups(); track g.key; let i = $index) {
          <li dsListSection [id]="prefix() + '-' + i" [header]="g.key">
            @for (name of g.items; track name; let k = $index) {
              <li dsListItem [title]="name" [href]="linked() ? '#' + prefix() + '-' + i + '-' + k : undefined"></li>
            }
          </li>
        }
      </ul>
    </div>
    <nav dsSectionIndex [sections]="sections()" [label]="locale() === 'ar' ? 'فهرس جهات الاتصال' : 'Contacts index'" [collapse]="collapse()"></nav>
  `,
})
class DemoContacts {
  /** Prefix of the section ids, unique per case. */
  readonly prefix = input.required<string>();
  readonly people = input.required<string[]>();
  readonly locale = input.required<'en' | 'ar'>();
  readonly height = input.required<string>();
  readonly label = input.required<string>();
  readonly collapse = input<SectionIndexCollapse>('auto');
  /** Rows that open a contact. Off in the long lists, which keeps the page light: the scroller is then the Tab stop. */
  readonly linked = input(false, { transform: booleanAttribute });

  constructor() {
    consumeHostAttributes(['dsDemoContacts', 'prefix', 'people', 'locale', 'height', 'label', 'collapse', 'linked']);
  }

  protected readonly frame = computed(
    () =>
      `display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--ds-space-2xs); block-size: ${this.height()}; min-block-size: 12rem; max-inline-size: 28rem`,
  );
  protected readonly groups = computed(() => groupByInitial(this.people(), (n) => n, this.locale()));
  protected readonly sections = computed<SectionIndexSection[]>(() => {
    const groups = this.groups();
    const ids = new Map(groups.map((g, i) => [g.key, `${this.prefix()}-${i}`]));
    return indexEntries(indexAlphabet(this.locale()), groups.map((g) => g.key)).map((e) => ({ key: e.key, target: ids.get(e.target)! }));
  });
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoContacts, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Collapse auto and never in a column 20rem tall">
      <div style="display: flex; flex-wrap: wrap; gap: var(--ds-space-l)">
        <div dsDemoContacts prefix="si-auto" [people]="first24" locale="en" height="20rem" label="Contacts, collapse auto"></div>
        <div dsDemoContacts prefix="si-never" [people]="first24" locale="en" height="20rem" label="Contacts, collapse never" collapse="never"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One section: every key goes to it">
      <div dsDemoContacts prefix="si-one" [people]="oneSection" locale="en" height="40rem" label="Contacts with one section" linked></div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Contacts: 200 rows with the index beside them">
      <div dsDemoContacts prefix="si-many" [people]="contactsEn" locale="en" height="calc(100svh - 8rem)" label="Contacts"></div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="80 contacts in a short frame: keys collapse into dots">
      <div dsDemoContacts prefix="si-short" [people]="first80" locale="en" height="22rem" label="Contacts in a short frame"></div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Arabic contacts: 200 rows, the index at the left">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsDemoContacts prefix="si-ar" [people]="contactsAr" locale="ar" height="calc(100svh - 8rem)" label="جهات الاتصال"></div>
      </div>
    </section>
  `,
})
export default class SectionIndexDemo {
  protected readonly contactsEn = contactsEn;
  protected readonly contactsAr = contactsAr;
  protected readonly first24 = contactsEn.slice(0, 24);
  protected readonly first80 = contactsEn.slice(0, 80);
  protected readonly oneSection = ['Sara Alqahtani', 'Saad Alharbi', 'Sami Alotaibi'];
}
