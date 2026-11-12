import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Link } from '../Link';
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
      { label: 'التسليم', href: '#handoff', description: 'تصدير الرموز والملفات للمطورين', start: 'download' },
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
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <Navbar
            label="الرئيسية"
            brand={<Brand>الشمال</Brand>}
            items={ar}
            end={
              <Button tone="accent" emphasis="solid">
                تجربة مجانية
              </Button>
            }
          />
        </Theme>
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
          label="الرئيسية"
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
