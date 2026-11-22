import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { IconButton } from '../IconButton';
import { Link } from '../Link';
import { PageShell } from '../PageShell';
import { Navbar } from './index';
import type { NavbarItem, NavbarSize } from './index';

const sizes: NavbarSize[] = ['md', 'lg'];

const en: NavbarItem[] = [
  { label: 'Overview', href: '#overview', start: 'home' },
  {
    label: 'Product',
    links: [
      { label: 'Boards', href: '#boards', description: 'Plan work on one shared canvas', start: 'grid' },
      { label: 'Docs', href: '#docs', description: 'Write specs next to the designs', start: 'file', active: true },
      { label: 'Handoff', href: '#handoff', description: 'Export tokens and assets for code', start: 'download' },
      { label: 'Reviews', href: '#reviews', description: 'Collect comments in one place', start: 'edit' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Guides', href: '#guides', description: 'Step by step for new teams', start: 'list' },
      { label: 'Changelog', href: '#changelog', description: 'What changed in each release', start: 'history' },
    ],
  },
  { label: 'Pricing', href: '#pricing', start: 'tag' },
];

const ar: NavbarItem[] = [
  { label: 'نظرة عامة', href: '#overview', start: 'home' },
  {
    label: 'المنتج',
    links: [
      { label: 'اللوحات', href: '#boards', description: 'خطة العمل على مساحة مشتركة', start: 'grid' },
      { label: 'المستندات', href: '#docs', description: 'المواصفات جنب التصاميم', start: 'file', active: true },
      { label: 'التسليم', href: '#handoff', description: 'تصدير القيم والملفات للمطورين', start: 'download' },
      { label: 'المراجعات', href: '#reviews', description: 'كل التعليقات في مكان واحد', start: 'edit' },
    ],
  },
  {
    label: 'المصادر',
    links: [
      { label: 'الأدلة', href: '#guides', description: 'خطوات البداية للفرق الجديدة', start: 'list' },
      { label: 'سجل التحديثات', href: '#changelog', description: 'التغييرات في كل إصدار', start: 'history' },
    ],
  },
  { label: 'الأسعار', href: '#pricing', start: 'tag' },
];

function Brand({ children }: { children: string }) {
  return (
    <Link href="#home" standalone size="lg">
      {children}
    </Link>
  );
}

/** A narrow phone shell, 320 wide, whose main scrolls: the large title wraps and collapses on ios. */
const narrowShell = { boxSizing: 'border-box', inlineSize: 'min(100%, 20rem)', blockSize: '26rem', overflow: 'clip', border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)' } as const;

function NarrowShell({ lang }: { lang: 'en' | 'ar' }) {
  const t =
    lang === 'ar'
      ? { label: 'رحلة الليل', back: 'المكتبة', heading: 'أغاني رحلة الليل من الرياض إلى أبها', row: (n: number) => `أغنية ${n}` }
      : { label: 'Night drive', back: 'Library', heading: 'Songs for the night drive to Abha', row: (n: number) => `Song ${n}` };
  return (
    <div style={narrowShell}>
      <PageShell
        embedded
        mainId={`title-wrap-${lang}`}
        header={<Navbar label={t.label} items={[]} back={{ label: t.back, href: '#library' }} heading={t.heading} />}
      >
        {Array.from({ length: 14 }, (_, i) => (
          <p key={i}>{t.row(i + 1)}</p>
        ))}
      </PageShell>
    </div>
  );
}

export default function NavbarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, a menu holding the current page, actions at the end">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Navbar
              label="Main"
              size={size}
              brand={<Brand>Northwind</Brand>}
              items={en}
              end={
                <>
                  <IconButton icon="search" label="Search the site" size={size} />
                  <Button size={size} tone="accent" emphasis="solid">
                    Start a trial
                  </Button>
                </>
              }
            />
          </DemoRow>
        ))}
        <DemoRow label="Placement side: the end actions go to a column at the inline end on ios">
          <Navbar
            label="Board"
            placement="side"
            brand={<Brand>Spring launch</Brand>}
            items={[]}
            end={
              <>
                <IconButton icon="search" label="Search the board" size="lg" />
                <IconButton icon="plus" label="Add a card" size="lg" />
              </>
            }
          />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <Navbar
            label="التنقل الرئيسي"
            brand={<Brand>الشمال</Brand>}
            items={ar}
            end={
              <Button tone="accent" emphasis="solid">
                تجربة مجانية
              </Button>
            }
          />
          <DemoRow label="عمود جانبي">
            <Navbar
              label="اللوحة"
              placement="side"
              brand={<Brand>إطلاق الربيع</Brand>}
              items={[]}
              end={
                <>
                  <IconButton icon="search" label="البحث في اللوحة" size="lg" />
                  <IconButton icon="plus" label="إضافة بطاقة" size="lg" />
                </>
              }
            />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="pushed" title="Pushed screen: a back button and a group of bar buttons on one row, the large title under it">
        <DemoRow label="Back, a group of two in end, the heading">
          <Navbar
            label="Songs"
            items={[]}
            back={{ label: 'Library', href: '#library' }}
            heading="Songs"
            end={
              <ButtonGroup attached aria-label="Song actions">
                <IconButton icon="sort" label="Sort songs" />
                <IconButton icon="more" label="More options" />
              </ButtonGroup>
            }
          />
        </DemoRow>
        <DemoRow label="A group in start, one button in end, a long heading">
          <Navbar
            label="Playlist"
            items={[]}
            back={{ label: 'Playlists', href: '#playlists' }}
            start={
              <ButtonGroup attached aria-label="Playlist tools">
                <IconButton icon="shuffle" label="Shuffle playlist" />
                <IconButton icon="share" label="Share playlist" />
              </ButtonGroup>
            }
            heading="Songs for a long drive from Riyadh to Abha with the family"
            end={<IconButton icon="plus" label="Add songs" />}
          />
        </DemoRow>
        <DemoRow label="A heading with no back: the title under a row of actions">
          <Navbar
            label="Library"
            items={[]}
            heading="Library"
            end={
              <ButtonGroup attached aria-label="Library actions">
                <IconButton icon="search" label="Search the library" />
                <IconButton icon="user" label="Open account" />
                <IconButton icon="more" label="More options" />
              </ButtonGroup>
            }
          />
        </DemoRow>
        <h3 data-demo="title">Pushed screen in Arabic: the back glyph points to the inline start</h3>
        <Theme lang="ar" data-demo="content">
          <Navbar
            label="الأغاني"
            items={[]}
            back={{ label: 'المكتبة', href: '#library' }}
            heading="الأغاني"
            end={
              <ButtonGroup attached aria-label="خيارات الأغاني">
                <IconButton icon="sort" label="ترتيب الأغاني" />
                <IconButton icon="more" label="خيارات إضافية" />
              </ButtonGroup>
            }
          />
        </Theme>
      </DemoCase>

      <DemoCase id="title-wrap" title="A long large title on a 320 wide shell: two lines, not an ellipsis; scroll to collapse it">
        {/* A grid cell, not a flex row: the Arabic Theme takes the cell's width, so its shell is 320 wide and not squeezed to its content. */}
        <DemoGrid min="20rem">
          <NarrowShell lang="en" />
          <Theme lang="ar" dir="rtl" data-demo="content">
            <NarrowShell lang="ar" />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="No links yet: brand and actions only, no menu button">
        <Navbar label="Main" brand={<Brand>Northwind</Brand>} items={[]} end={<Button emphasis="outline">Sign in</Button>} />
      </DemoCase>

      <DemoCase id="one" title="One link, sticky">
        <Navbar label="Docs" sticky brand={<Brand>Northwind</Brand>} items={[{ label: 'Docs', href: '#docs', active: true }]} />
      </DemoCase>

      <DemoCase id="many" title="Many links and menus">
        <Navbar
          label="Main"
          brand={<Brand>Northwind</Brand>}
          items={[...en, { label: 'Customers', href: '#customers' }, { label: 'Careers', href: '#careers' }]}
          end={<Button emphasis="outline">Sign in</Button>}
        />
      </DemoCase>

      <DemoCase id="too-many" title="Too many links, the list wraps">
        <Navbar
          label="Main"
          brand={<Brand>Northwind</Brand>}
          items={['Overview', 'Boards', 'Docs', 'Handoff', 'Reviews', 'Guides', 'Changelog', 'Pricing', 'Customers', 'Careers', 'Security', 'Status'].map(
            (label, i) => ({ label, href: `#link-${i}`, active: i === 2 }),
          )}
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Navbar
          label="Main"
          brand={<Brand>Northwind design studio</Brand>}
          items={[
            { label: 'Accessibility statement', href: '#a11y' },
            {
              label: 'Resources for teams',
              links: [
                {
                  label: 'Supercalifragilisticexpialidocious',
                  href: '#long',
                  description: 'A guide to sharing boards with people outside your organization and keeping comments private',
                },
              ],
            },
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text, a panel open at first render" lang="ar">
        <Navbar
          label="التنقل الرئيسي"
          defaultOpenMenu="مصادر الفرق"
          brand={<Brand>استوديو الشمال للتصميم</Brand>}
          items={[
            { label: 'بيان سهولة الوصول', href: '#a11y' },
            {
              label: 'مصادر الفرق',
              links: [
                {
                  label: 'دليل مشاركة اللوحات',
                  href: '#long',
                  description: 'طريقة مشاركة اللوحات مع أشخاص من خارج المنظمة مع إبقاء التعليقات خاصة',
                },
              ],
            },
          ]}
        />
      </DemoCase>
    </DemoPage>
  );
}
