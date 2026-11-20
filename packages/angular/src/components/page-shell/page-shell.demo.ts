// The PageShell demo: the same cases, ids and copy as
// packages/react/src/components/PageShell/PageShell.demo.tsx. The Angular
// package has no Sidebar, Rail or Navbar yet, so the column is a labelled
// nav of links with a collapse toggle wired to the shell (React's
// ShellSidebar through usePageShell), the rail case is the same nav of
// icon links, and the phone shell's header is a title with an icon button
// where React draws a Navbar. React's Frame and Shell functions are a
// component on the frame div itself.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { IconName } from '@the-system/icons';
import { DEMO, sample } from '../../demo/demo';
import { consumeHostAttributes } from '../../internal/host';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsTabBar, DsTabBarItem } from '../tab-bar/tab-bar';
import { DsPageShell, type PageShellSidebar } from './page-shell';

/** A frame the height of a short app window, so each page preview sits in its own box. */
const FRAME =
  'block-size: calc(var(--ds-space-12xl) * 4); border: var(--ds-border-width-default) solid var(--ds-color-border-hairline); border-radius: var(--ds-radius-panel); overflow: auto';

type NavItem = [IconName, string];

const enNav: NavItem[] = [
  ['home', 'Home'],
  ['inbox', 'Inbox'],
  ['folder', 'Boards'],
  ['user', 'People'],
  ['settings', 'Settings'],
];

const arNav: NavItem[] = [
  ['home', 'الرئيسية'],
  ['inbox', 'الوارد'],
  ['folder', 'اللوحات'],
  ['user', 'الأعضاء'],
  ['settings', 'الإعدادات'],
];

const phoneTabs: Record<'en' | 'ar', NavItem[]> = {
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

const boards = ['Spring launch', 'Brand refresh', 'Mobile app', 'Annual report', 'Hiring plan', 'Customer research'];
const manyItems: NavItem[] = Array.from({ length: 40 }, (_, i): NavItem => ['file', `Board ${i + 1}`]);

/** A shell in a frame, with the column, the header and the footer of React's Shell. The host is the frame. */
@Component({
  selector: 'div[dsDemoShell]',
  imports: [DsPageShell, DsButton, DsIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: FRAME },
  template: `
    <div dsPageShell #shell="dsPageShell" embedded [mainId]="id()" [defaultSidebar]="sidebar()" [nav]="navTemplate"
      [header]="headerTemplate" [aside]="asideText() !== undefined ? asideTemplate : undefined" [footer]="footerTemplate"
      [asideLabel]="asideLabel()" [skipLabel]="skipLabel()">
      <ng-template #navTemplate>
        <!-- The column follows the shell's state, so its toggle and the shell agree. -->
        <nav [attr.aria-label]="navLabel()" style="display: grid; align-content: start; gap: var(--ds-space-2xs); padding: var(--ds-space-s)">
          @if (!rail()) {
            <button dsIconButton [icon]="'sidebar'" [attr.aria-pressed]="shell.shownSidebar() === 'collapsed' ? 'true' : 'false'"
              [label]="collapseLabel()" (click)="shell.setSidebar(shell.shownSidebar() === 'collapsed' ? 'expanded' : 'collapsed')"></button>
          }
          @for (item of items(); track item[1]; let i = $index) {
            <a dsButton emphasis="ghost" [href]="'#' + id() + '-' + i" [start]="item[0]"
              [attr.aria-current]="i === (rail() ? 0 : 2) ? 'page' : null" [attr.aria-label]="shell.shownSidebar() === 'collapsed' || rail() ? item[1] : null">
              @if (shell.shownSidebar() !== 'collapsed' && !rail()) {
                {{ item[1] }}
              }
            </a>
          }
        </nav>
      </ng-template>
      <ng-template #headerTemplate>
        <div data-demo="row">
          <strong>{{ title() }}</strong>
          <button dsButton size="sm" start="plus">{{ action() }}</button>
        </div>
      </ng-template>
      <ng-template #asideTemplate><p>{{ asideText() }}</p></ng-template>
      <ng-template #footerTemplate>{{ footer() }}</ng-template>
      <ng-content />
    </div>
  `,
})
class DemoShell {
  readonly id = input.required<string>();
  readonly sidebar = input<PageShellSidebar>('expanded');
  readonly items = input<NavItem[]>(enNav);
  readonly navLabel = input('Main');
  readonly rail = input(false);
  readonly title = input('Northwind studio');
  readonly action = input('Create board');
  readonly asideText = input<string | undefined>(undefined);
  readonly asideLabel = input<string | undefined>(undefined);
  readonly footer = input('Northwind studio, 2026');
  readonly skipLabel = input<string | undefined>(undefined);
  readonly collapseLabel = input('Collapse navigation');

  constructor() {
    consumeHostAttributes([
      'dsDemoShell', 'id', 'sidebar', 'items', 'navLabel', 'rail', 'title', 'action', 'asideText', 'asideLabel', 'footer',
      'skipLabel', 'collapseLabel',
    ]);
  }
}

/** A phone shell: a title and an action on top, a TabBar in the footer, placement side. The host is the frame. */
@Component({
  selector: 'div[dsDemoPhoneShell]',
  imports: [DsPageShell, DsIconButton, DsTabBar, DsTabBarItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: FRAME },
  template: `
    <div dsPageShell embedded [mainId]="id()" placement="side" [header]="headerTemplate" [footer]="footerTemplate">
      <ng-template #headerTemplate>
        <strong>{{ ar() ? 'إطلاق الربيع' : 'Spring launch' }}</strong>
        <button dsIconButton icon="plus" size="lg" [label]="ar() ? 'إضافة بطاقة' : 'Add a card'"></button>
      </ng-template>
      <ng-template #footerTemplate>
        <nav dsTabBar [attr.aria-label]="ar() ? 'أقسام التطبيق' : 'Sections'" size="lg">
          @for (tab of tabs(); track tab[1]; let i = $index) {
            <a dsTabBarItem [href]="'#' + id() + '-' + i" [icon]="tab[0]" [label]="tab[1]" [active]="i === 0"></a>
          }
        </nav>
      </ng-template>
      <h3>{{ ar() ? 'البطاقات' : 'Cards' }}</h3>
      <p>{{ ar() ? 'الأزرار والتبويبات في عمود جنب المحتوى.' : 'The actions and the tabs sit in a column beside the content.' }}</p>
    </div>
  `,
})
class DemoPhoneShell {
  readonly id = input.required<string>();
  readonly ar = input(false);
  protected tabs() {
    return phoneTabs[this.ar() ? 'ar' : 'en'];
  }

  constructor() {
    consumeHostAttributes(['dsDemoPhoneShell', 'id', 'ar']);
  }
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoShell, DemoPhoneShell, DsPageShell, DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants">
      <p data-demo="label">Expanded, with an aside</p>
      <div dsDemoShell id="shell-expanded" asideText="3 people are viewing this board.">
        <h3>Boards</h3>
        <p>Pick a board to open it.</p>
      </div>
      <p data-demo="label">Collapsed</p>
      <div dsDemoShell id="shell-collapsed" sidebar="collapsed">
        <h3>Boards</h3>
        <p>The column keeps only the icons.</p>
      </div>
      <p data-demo="label">Hidden: the menu button opens the navigation</p>
      <div dsDemoShell id="shell-hidden" sidebar="hidden">
        <h3>Boards</h3>
        <p>The navigation opens in a drawer from the menu button.</p>
      </div>
      <p data-demo="label">Rail</p>
      <div dsDemoShell id="shell-rail" [rail]="true">
        <h3>Home</h3>
        <p>A rail keeps the page wide.</p>
      </div>
      <p data-demo="label">Placement side: the actions and the TabBar in a column at the inline end on ios</p>
      <div dsDemoPhoneShell id="shell-side"></div>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <div dsDemoPhoneShell id="shell-side-ar" [ar]="true"></div>
      </div>
      <p data-demo="label">Arabic</p>
      <div dsTheme [lang]="'ar'" [dir]="'rtl'">
        <div dsDemoShell id="shell-ar" [items]="arNav" navLabel="التنقل الرئيسي" title="استوديو الشمال" action="إنشاء لوحة"
          asideText="3 أعضاء يشوفون اللوحة الحين." footer="استوديو الشمال، 2026" skipLabel="الانتقال للمحتوى الرئيسي"
          collapseLabel="طي التنقل">
          <h3>اللوحات</h3>
          <p>اختر لوحة عشان تفتحها.</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div dsDemoShell id="shell-empty">
        <h3>No boards yet</h3>
        <p>Create a board to start. It shows here.</p>
        <button dsButton start="plus">Create board</button>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One region">
      <div [style]="frame">
        <div dsPageShell embedded mainId="shell-one">
          <p>Only main: no header, navigation, aside or footer. The skip link still comes first.</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many">
      <div dsDemoShell id="shell-many" asideText="Filters and details go here.">
        <h3>Boards</h3>
        <ul>
          @for (b of boards; track b) {
            <li>{{ b }}</li>
          }
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many">
      <div dsDemoShell id="shell-too-many" [items]="manyItems">
        @for (i of twelve; track i) {
          <p>{{ sample.en.long }}</p>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <div dsDemoShell id="shell-long" title="Northwind studio and the Spring launch planning workspace for the brand team"
        [asideText]="sample.en.long" [footer]="sample.en.long">
        <h3>{{ sample.en.word }}</h3>
        <p>{{ sample.en.long }}</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsDemoShell id="shell-long-ar" [items]="arNav" navLabel="التنقل الرئيسي"
          title="استوديو الشمال ومساحة تخطيط إطلاق الربيع لفريق الهوية" action="إنشاء لوحة"
          [asideText]="sample.ar.long" [footer]="sample.ar.long" collapseLabel="طي التنقل">
          <h3>{{ sample.ar.word }}</h3>
          <p>{{ sample.ar.long }}</p>
        </div>
      </div>
    </section>
  `,
})
export default class PageShellDemo {
  protected readonly frame = FRAME;
  protected readonly sample = sample;
  protected readonly arNav = arNav;
  protected readonly boards = boards;
  protected readonly manyItems = manyItems;
  protected readonly twelve = Array.from({ length: 12 }, (_, i) => i);
}
