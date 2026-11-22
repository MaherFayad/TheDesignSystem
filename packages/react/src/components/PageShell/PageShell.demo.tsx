// PageShell demo. The copy follows the page language: with lang=ar the
// English cases read Arabic too, and the Arabic rows stay as they are.
import type { CSSProperties, ReactNode } from 'react';
import type { IconName } from '@the-system/icons/react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { sample } from '../../demo';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Navbar } from '../Navbar';
import { isArabic } from '../Popover/FloatingLayer';
import { TabBar, TabBarItem } from '../TabBar';
import { Rail, RailItem } from '../Rail';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';
import { PageShell, usePageShell, type PageShellProps, type PageShellSidebar } from './index';

/** A frame the height of a short app window, so each page preview sits in its own box. */
const frame: CSSProperties = {
  blockSize: 'calc(var(--ds-space-12xl) * 4)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-hairline)',
  borderRadius: 'var(--ds-radius-panel)',
  overflow: 'auto',
};

function Frame({ children }: { children: ReactNode }) {
  return <div style={frame}>{children}</div>;
}

const enNav: [IconName, string][] = [
  ['home', 'Home'],
  ['inbox', 'Inbox'],
  ['folder', 'Boards'],
  ['user', 'People'],
  ['settings', 'Settings'],
];

const arNav: [IconName, string][] = [
  ['home', 'الرئيسية'],
  ['inbox', 'الوارد'],
  ['folder', 'اللوحات'],
  ['user', 'الأعضاء'],
  ['settings', 'الإعدادات'],
];

const boards = ['Spring launch', 'Brand refresh', 'Mobile app', 'Annual report', 'Hiring plan', 'Customer research'];

const words = {
  en: {
    lang: 'en',
    nav: enNav,
    main: 'Main',
    studio: 'Northwind studio',
    create: 'Create board',
    footer: 'Northwind studio, 2026',
    skip: undefined,
    expanded: 'Expanded, with an aside',
    viewing: '3 people are viewing this board.',
    boardsTitle: 'Boards',
    pick: 'Pick a board to open it.',
    collapsed: 'Collapsed',
    icons: 'The column keeps only the icons.',
    hidden: 'Hidden: the menu button opens the navigation',
    drawer: 'The navigation opens in a drawer from the menu button.',
    rail: 'Rail',
    home: 'Home',
    wide: 'A rail keeps the page wide.',
    noBoards: 'No boards yet',
    start: 'Create a board to start. It shows here.',
    onlyMain: 'Only main: no header, navigation, aside or footer. The skip link still comes first.',
    filters: 'Filters and details go here.',
    boards,
    board: (n: number) => `Board ${n}`,
    longTitle: 'Northwind studio and the Spring launch planning workspace for the brand team',
    long: sample.en.long,
    word: sample.en.word,
  },
  ar: {
    lang: 'ar',
    nav: arNav,
    main: 'التنقل الرئيسي',
    studio: 'استوديو الشمال',
    create: 'إنشاء لوحة',
    footer: 'استوديو الشمال، 2026',
    skip: 'الانتقال للمحتوى الرئيسي',
    expanded: 'العمود مفتوح، مع عمود جانبي',
    viewing: '3 أعضاء يشوفون اللوحة الحين.',
    boardsTitle: 'اللوحات',
    pick: 'اختر لوحة عشان تفتحها.',
    collapsed: 'العمود مطوي',
    icons: 'العمود يبقي الأيقونات بس.',
    hidden: 'العمود مخفي: زر القائمة يفتح التنقل',
    drawer: 'التنقل ينفتح في درج من زر القائمة.',
    rail: 'شريط الأيقونات',
    home: 'الرئيسية',
    wide: 'شريط الأيقونات يخلي الصفحة عريضة.',
    noBoards: 'ما فيه لوحات للحين',
    start: 'أنشئ لوحة عشان تبدأ، وبتطلع هنا.',
    onlyMain: 'المحتوى الرئيسي بس: بدون رأس ولا تنقل ولا عمود جانبي ولا تذييل. رابط التخطي يبقى أول شي.',
    filters: 'الفلاتر والتفاصيل تكون هنا.',
    boards: ['إطلاق الربيع', 'تحديث الهوية', 'تطبيق الجوال', 'التقرير السنوي', 'خطة التوظيف', 'أبحاث العملاء'],
    board: (n: number) => `لوحة ${n}`,
    longTitle: 'استوديو الشمال ومساحة تخطيط إطلاق الربيع لفريق الهوية',
    long: sample.ar.long,
    word: sample.ar.word,
  },
} as const;

/** The copy of the page language. */
function useWords() {
  return words[isArabic(useTheme().lang) ? 'ar' : 'en'];
}

/** A Sidebar that follows the shell's column state, so its toggle and the shell agree. */
function ShellSidebar({ items, label, prefix }: { items: [IconName, string][]; label: string; prefix: string }) {
  const { sidebar, setSidebar } = usePageShell();
  return (
    <Sidebar
      label={label}
      collapsed={sidebar === 'collapsed'}
      onCollapsedChange={(collapsed) => setSidebar(collapsed ? 'collapsed' : 'expanded')}
    >
      <SidebarGroup label={label}>
        {items.map(([icon, text], i) => (
          <SidebarItem key={text} href={`#${prefix}-${i}`} start={icon} active={i === 2}>
            {text}
          </SidebarItem>
        ))}
      </SidebarGroup>
    </Sidebar>
  );
}

function Header({ title, action }: { title: string; action?: string }) {
  return (
    <DemoRow>
      <strong>{title}</strong>
      {action && (
        <Button size="sm" start="plus">
          {action}
        </Button>
      )}
    </DemoRow>
  );
}

function Shell({ id, sidebar, ...props }: Omit<PageShellProps, 'mainId' | 'embedded'> & { id: string }) {
  const w = useWords();
  return (
    <Frame>
      <PageShell
        embedded
        mainId={id}
        defaultSidebar={sidebar as PageShellSidebar | undefined}
        nav={<ShellSidebar items={[...w.nav]} label={w.main} prefix={id} />}
        header={<Header title={w.studio} action={w.create} />}
        footer={w.footer}
        skipLabel={w.skip}
        {...props}
      />
    </Frame>
  );
}

const phoneTabs: Record<'en' | 'ar', [IconName, string][]> = {
  en: [
    ['home', 'Home'],
    ['inbox', 'Inbox'],
    ['user', 'Profile'],
  ],
  ar: [
    ['home', 'الرئيسية'],
    ['inbox', 'الوارد'],
    ['user', 'الحساب'],
  ],
};

/** A phone shell: a Navbar with actions on top, a TabBar in the footer. placement side puts both in the column on ios. */
function PhoneShell({ id, lang }: { id: string; lang: 'en' | 'ar' }) {
  const ar = lang === 'ar';
  return (
    <Frame>
      <PageShell
        embedded
        mainId={id}
        placement="side"
        header={
          <Navbar
            label={ar ? 'اللوحة' : 'Board'}
            brand={<strong>{ar ? 'إطلاق الربيع' : 'Spring launch'}</strong>}
            items={[]}
            end={<IconButton icon="plus" size="lg" label={ar ? 'إضافة بطاقة' : 'Add a card'} />}
          />
        }
        footer={
          <TabBar aria-label={ar ? 'أقسام التطبيق' : 'Sections'} size="lg">
            {phoneTabs[lang].map(([icon, text], i) => (
              <TabBarItem key={text} href={`#${id}-${i}`} icon={icon} label={text} active={i === 0} />
            ))}
          </TabBar>
        }
      >
        <h3>{ar ? 'البطاقات' : 'Cards'}</h3>
        <p>{ar ? 'الأزرار والتبويبات في عمود جنب المحتوى.' : 'The actions and the tabs sit in a column beside the content.'}</p>
      </PageShell>
    </Frame>
  );
}

export default function PageShellDemo() {
  const w = useWords();
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <p data-demo="label">{w.expanded}</p>
        <Shell id="shell-expanded" aside={<p>{w.viewing}</p>}>
          <h3>{w.boardsTitle}</h3>
          <p>{w.pick}</p>
        </Shell>
        <p data-demo="label">{w.collapsed}</p>
        <Shell id="shell-collapsed" sidebar="collapsed">
          <h3>{w.boardsTitle}</h3>
          <p>{w.icons}</p>
        </Shell>
        <p data-demo="label">{w.hidden}</p>
        <Shell id="shell-hidden" sidebar="hidden">
          <h3>{w.boardsTitle}</h3>
          <p>{w.drawer}</p>
        </Shell>
        <p data-demo="label">{w.rail}</p>
        <Shell
          id="shell-rail"
          nav={
            <Rail label={w.main}>
              {w.nav.map(([icon, text], i) => (
                <RailItem key={text} href={`#rail-${i}`} icon={icon} label={text} active={i === 0} />
              ))}
            </Rail>
          }
        >
          <h3>{w.home}</h3>
          <p>{w.wide}</p>
        </Shell>
        <p data-demo="label">Placement side: the Navbar actions and the TabBar in a column at the inline end on ios</p>
        <PhoneShell id="shell-side" lang={w.lang} />
        <Theme lang="ar" dir="rtl">
          <PhoneShell id="shell-side-ar" lang="ar" />
        </Theme>
        <p data-demo="label">Arabic</p>
        <Theme lang="ar" dir="rtl">
          <Frame>
            <PageShell
              embedded
              mainId="shell-ar"
              nav={<ShellSidebar items={arNav} label="التنقل الرئيسي" prefix="shell-ar" />}
              header={<Header title="استوديو الشمال" action="إنشاء لوحة" />}
              aside={<p>3 أعضاء يشوفون اللوحة الحين.</p>}
              footer="استوديو الشمال، 2026"
              skipLabel="الانتقال للمحتوى الرئيسي"
            >
              <h3>اللوحات</h3>
              <p>اختر لوحة عشان تفتحها.</p>
            </PageShell>
          </Frame>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Shell id="shell-empty">
          <h3>{w.noBoards}</h3>
          <p>{w.start}</p>
          <Button start="plus">{w.create}</Button>
        </Shell>
      </DemoCase>

      <DemoCase id="one" title="One region">
        <Frame>
          <PageShell embedded mainId="shell-one" skipLabel={w.skip}>
            <p>{w.onlyMain}</p>
          </PageShell>
        </Frame>
      </DemoCase>

      <DemoCase id="many" title="Many">
        <Shell id="shell-many" aside={<p>{w.filters}</p>}>
          <h3>{w.boardsTitle}</h3>
          <ul>
            {w.boards.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Shell>
      </DemoCase>

      <DemoCase id="too-many" title="Too many">
        <Shell
          id="shell-too-many"
          nav={
            <ShellSidebar
              items={Array.from({ length: 40 }, (_, i): [IconName, string] => ['file', w.board(i + 1)])}
              label={w.main}
              prefix="too-many"
            />
          }
        >
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>{w.long}</p>
          ))}
        </Shell>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Shell
          id="shell-long"
          header={
            <Header title={w.longTitle} action={w.create} />
          }
          aside={<p>{w.long}</p>}
          footer={w.long}
        >
          <h3>{w.word}</h3>
          <p>{w.long}</p>
        </Shell>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic" lang="ar">
        <Frame>
          <PageShell
            embedded
            mainId="shell-long-ar"
            nav={<ShellSidebar items={arNav} label="التنقل الرئيسي" prefix="shell-long-ar" />}
            header={<Header title="استوديو الشمال ومساحة تخطيط إطلاق الربيع لفريق الهوية" action="إنشاء لوحة" />}
            aside={<p>{sample.ar.long}</p>}
            footer={sample.ar.long}
          >
            <h3>{sample.ar.word}</h3>
            <p>{sample.ar.long}</p>
          </PageShell>
        </Frame>
      </DemoCase>
    </DemoPage>
  );
}
