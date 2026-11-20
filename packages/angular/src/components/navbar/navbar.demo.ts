// The Navbar demo: the same cases, ids and copy as
// packages/react/src/components/Navbar/Navbar.demo.tsx. Node props are
// templates; the Arabic bars are declared inside the Arabic theme.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsButtonGroup } from '../button-group/button-group';
import { DsIconButton } from '../icon-button/icon-button';
import { DsLink } from '../link/link';
import { DsPageShell } from '../page-shell/page-shell';
import { DsNavbar, type NavbarItem, type NavbarSize } from './navbar';

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

const many: NavbarItem[] = [...en, { label: 'Customers', href: '#customers' }, { label: 'Careers', href: '#careers' }];
const tooMany: NavbarItem[] = ['Overview', 'Boards', 'Docs', 'Handoff', 'Reviews', 'Guides', 'Changelog', 'Pricing', 'Customers', 'Careers', 'Security', 'Status'].map(
  (label, i) => ({ label, href: `#link-${i}`, active: i === 2 }),
);
const longText: NavbarItem[] = [
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
];
const longArabic: NavbarItem[] = [
  { label: 'بيان سهولة الوصول', href: '#a11y' },
  {
    label: 'مصادر الفرق',
    links: [{ label: 'دليل مشاركة اللوحات', href: '#long', description: 'طريقة مشاركة اللوحات مع أشخاص من خارج المنظمة مع إبقاء التعليقات خاصة' }],
  },
];
const narrow = {
  en: { label: 'Night drive', back: 'Library', heading: 'Songs for the night drive to Abha', rows: Array.from({ length: 14 }, (_, i) => `Song ${i + 1}`) },
  ar: { label: 'رحلة الليل', back: 'المكتبة', heading: 'أغاني رحلة الليل من الرياض إلى أبها', rows: Array.from({ length: 14 }, (_, i) => `أغنية ${i + 1}`) },
};

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsButtonGroup, DsIconButton, DsLink, DsNavbar, DsPageShell, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: size, a menu holding the current page, actions at the end">
      @for (size of sizes; track size) {
        <div data-demo="row" [label]="'Size ' + size">
          <ng-template #brand><a dsLink href="#home" standalone size="lg">Northwind</a></ng-template>
          <ng-template #end>
            <button dsIconButton icon="search" label="Search the site" [size]="size"></button>
            <button dsButton [size]="size" tone="accent" emphasis="solid">Start a trial</button>
          </ng-template>
          <nav dsNavbar label="Main" [size]="size" [brand]="brand" [items]="en" [end]="end"></nav>
        </div>
      }
      <div data-demo="row" label="Placement side: the end actions go to a column at the inline end on ios">
        <ng-template #boardBrand><a dsLink href="#home" standalone size="lg">Spring launch</a></ng-template>
        <ng-template #boardEnd>
          <button dsIconButton icon="search" label="Search the board" size="lg"></button>
          <button dsIconButton icon="plus" label="Add a card" size="lg"></button>
        </ng-template>
        <nav dsNavbar label="Board" placement="side" [brand]="boardBrand" [items]="[]" [end]="boardEnd"></nav>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arBrand><a dsLink href="#home" standalone size="lg">الشمال</a></ng-template>
        <ng-template #arEnd><button dsButton tone="accent" emphasis="solid">تجربة مجانية</button></ng-template>
        <nav dsNavbar label="التنقل الرئيسي" [brand]="arBrand" [items]="ar" [end]="arEnd"></nav>
        <div data-demo="row" label="عمود جانبي">
          <ng-template #arBoardBrand><a dsLink href="#home" standalone size="lg">إطلاق الربيع</a></ng-template>
          <ng-template #arBoardEnd>
            <button dsIconButton icon="search" label="البحث في اللوحة" size="lg"></button>
            <button dsIconButton icon="plus" label="إضافة بطاقة" size="lg"></button>
          </ng-template>
          <nav dsNavbar label="اللوحة" placement="side" [brand]="arBoardBrand" [items]="[]" [end]="arBoardEnd"></nav>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="pushed" heading="Pushed screen: a back button and a group of bar buttons on one row, the large title under it">
      <div data-demo="row" label="Back, a group of two in end, the heading">
        <ng-template #songEnd>
          <div dsButtonGroup attached aria-label="Song actions">
            <button dsIconButton icon="sort" label="Sort songs"></button>
            <button dsIconButton icon="more" label="More options"></button>
          </div>
        </ng-template>
        <nav dsNavbar label="Songs" [items]="[]" [back]="{ label: 'Library', href: '#library' }" heading="Songs" [end]="songEnd"></nav>
      </div>
      <div data-demo="row" label="A group in start, one button in end, a long heading">
        <ng-template #playStart>
          <div dsButtonGroup attached aria-label="Playlist tools">
            <button dsIconButton icon="shuffle" label="Shuffle playlist"></button>
            <button dsIconButton icon="share" label="Share playlist"></button>
          </div>
        </ng-template>
        <ng-template #playEnd><button dsIconButton icon="plus" label="Add songs"></button></ng-template>
        <nav dsNavbar label="Playlist" [items]="[]" [back]="{ label: 'Playlists', href: '#playlists' }" [start]="playStart"
          heading="Songs for a long drive from Riyadh to Abha with the family" [end]="playEnd"></nav>
      </div>
      <div data-demo="row" label="A heading with no back: the title under a row of actions">
        <ng-template #libEnd>
          <div dsButtonGroup attached aria-label="Library actions">
            <button dsIconButton icon="search" label="Search the library"></button>
            <button dsIconButton icon="user" label="Open account"></button>
            <button dsIconButton icon="more" label="More options"></button>
          </div>
        </ng-template>
        <nav dsNavbar label="Library" [items]="[]" heading="Library" [end]="libEnd"></nav>
      </div>
      <h3 data-demo="title">Pushed screen in Arabic: the back glyph points to the inline start</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arSongEnd>
          <div dsButtonGroup attached aria-label="خيارات الأغاني">
            <button dsIconButton icon="sort" label="ترتيب الأغاني"></button>
            <button dsIconButton icon="more" label="خيارات إضافية"></button>
          </div>
        </ng-template>
        <nav dsNavbar label="الأغاني" [items]="[]" [back]="{ label: 'المكتبة', href: '#library' }" heading="الأغاني" [end]="arSongEnd"></nav>
      </div>
    </section>

    <section data-demo="case" data-demo-case="title-wrap" heading="A long large title on a 320 wide shell: two lines, not an ellipsis; scroll to collapse it">
      <div data-demo="row">
        <div style="box-sizing: border-box; inline-size: min(100%, 20rem); block-size: 26rem; overflow: clip; border: var(--ds-border-width-default) solid var(--ds-color-border-default)">
          <div dsPageShell embedded mainId="title-wrap-en" [header]="enHeader">
            <ng-template #enHeader>
              <nav dsNavbar [label]="narrow.en.label" [items]="[]" [back]="{ label: narrow.en.back, href: '#library' }" [heading]="narrow.en.heading"></nav>
            </ng-template>
            @for (row of narrow.en.rows; track row) {
              <p>{{ row }}</p>
            }
          </div>
        </div>
        <div dsTheme [lang]="'ar'" [dir]="'rtl'" data-demo="content">
          <div style="box-sizing: border-box; inline-size: min(100%, 20rem); block-size: 26rem; overflow: clip; border: var(--ds-border-width-default) solid var(--ds-color-border-default)">
            <div dsPageShell embedded mainId="title-wrap-ar" [header]="arHeader">
              <ng-template #arHeader>
                <nav dsNavbar [label]="narrow.ar.label" [items]="[]" [back]="{ label: narrow.ar.back, href: '#library' }" [heading]="narrow.ar.heading"></nav>
              </ng-template>
              @for (row of narrow.ar.rows; track row) {
                <p>{{ row }}</p>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <ng-template #northwind><a dsLink href="#home" standalone size="lg">Northwind</a></ng-template>
    <ng-template #signIn><button dsButton emphasis="outline">Sign in</button></ng-template>

    <section data-demo="case" data-demo-case="empty" heading="No links yet: brand and actions only, no menu button">
      <nav dsNavbar label="Main" [brand]="northwind" [items]="[]" [end]="signIn"></nav>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One link, sticky">
      <nav dsNavbar label="Docs" sticky [brand]="northwind" [items]="[{ label: 'Docs', href: '#docs', active: true }]"></nav>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many links and menus">
      <nav dsNavbar label="Main" [brand]="northwind" [items]="many" [end]="signIn"></nav>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many links, the list wraps">
      <nav dsNavbar label="Main" [brand]="northwind" [items]="tooMany"></nav>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <ng-template #studio><a dsLink href="#home" standalone size="lg">Northwind design studio</a></ng-template>
      <nav dsNavbar label="Main" [brand]="studio" [items]="longText"></nav>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text, a panel open at first render">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arStudio><a dsLink href="#home" standalone size="lg">استوديو الشمال للتصميم</a></ng-template>
        <nav dsNavbar label="التنقل الرئيسي" defaultOpenMenu="مصادر الفرق" [brand]="arStudio" [items]="longArabic"></nav>
      </div>
    </section>
  `,
})
export default class NavbarDemo {
  protected readonly sizes = sizes;
  protected readonly en = en;
  protected readonly ar = ar;
  protected readonly many = many;
  protected readonly tooMany = tooMany;
  protected readonly longText = longText;
  protected readonly longArabic = longArabic;
  protected readonly narrow = narrow;
}
