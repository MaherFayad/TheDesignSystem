// The TabBar demo: the same cases, ids and copy as
// packages/react/src/components/TabBar/TabBar.demo.tsx. The mini player is a
// named group of icon buttons (the song opens the player): the Angular
// package has no Toolbar yet, so the accessory's content differs from React's.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { IconName } from '@the-system/icons';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButtonGroup } from '../button-group/button-group';
import { DsIconButton } from '../icon-button/icon-button';
import { DsSearchField } from '../search-field/search-field';
import { DsTabBar, DsTabBarItem, DsTabBarSearch, type TabBarPlacement, type TabBarSize } from './tab-bar';

interface Dest {
  icon: IconName;
  en: string;
  ar: string;
  badge?: number | boolean;
}

/** Destinations of a phone app. Arabic: noun form labels, no diacritics. */
const dests: Dest[] = [
  { icon: 'home', en: 'Home', ar: 'الرئيسية' },
  { icon: 'search', en: 'Search', ar: 'البحث' },
  { icon: 'inbox', en: 'Inbox', ar: 'الوارد', badge: 3 },
  { icon: 'bell', en: 'Alerts', ar: 'التنبيهات', badge: true },
  { icon: 'user', en: 'Profile', ar: 'الحساب' },
];

interface Bar {
  lang: 'en' | 'ar';
  size?: TabBarSize;
  placement?: TabBarPlacement;
  search?: 'link' | 'active' | 'field';
  accessory: boolean;
  compact: boolean;
  tabs: Array<Dest & { active: boolean }>;
}

interface BarOptions {
  lang?: 'en' | 'ar';
  size?: TabBarSize;
  count?: number;
  activeIndex?: number;
  placement?: TabBarPlacement;
  search?: 'link' | 'active' | 'field';
  accessory?: boolean;
  compact?: boolean;
}

const made = new Map<string, Bar>();

/**
 * The same bar as React's AppBar: the search item takes the place of the
 * Search tab. Kept per options, so a change detection pass hands the
 * template outlet the same context and nothing renders again.
 */
function bar(o: BarOptions = {}): Bar {
  const key = JSON.stringify(o);
  const known = made.get(key);
  if (known) return known;
  const value = makeBar(o);
  made.set(key, value);
  return value;
}

function makeBar(o: BarOptions): Bar {
  const all = o.search ? dests.filter((d) => d.icon !== 'search') : dests;
  const activeIndex = o.activeIndex ?? 0;
  return {
    lang: o.lang ?? 'en',
    size: o.size,
    placement: o.placement,
    search: o.search,
    accessory: o.accessory ?? false,
    compact: o.compact ?? false,
    tabs: all.slice(0, o.count ?? 5).map((d, i) => ({ ...d, active: (o.search === undefined || o.search === 'link') && i === activeIndex })),
  };
}

const sizes: TabBarSize[] = ['md', 'lg'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsTabBar, DsTabBarItem, DsTabBarSearch, DsSearchField, DsButtonGroup, DsIconButton, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #appBar let-b>
      <div style="inline-size: 100%; max-inline-size: calc(var(--ds-menu-width-min) * 2)">
        <nav
          dsTabBar
          [attr.aria-label]="b.lang === 'ar' ? 'التنقل الرئيسي' : 'Main'"
          [size]="b.size ?? 'md'"
          [placement]="b.placement"
          [compact]="b.compact"
          [accessory]="b.accessory ? (b.lang === 'ar' ? playerAr : playerEn) : undefined"
        >
          @for (d of b.tabs; track d.en) {
            <a dsTabBarItem [href]="'#' + d.en.toLowerCase()" [icon]="d.icon" [label]="b.lang === 'ar' ? d.ar : d.en" [badge]="d.badge" [active]="d.active"></a>
          }
          @if (b.search) {
            <ng-container
              dsTabBarSearch
              href="#search"
              [label]="b.lang === 'ar' ? 'بحث' : 'Search'"
              [active]="b.search !== 'link'"
              [field]="b.search === 'field' ? (b.lang === 'ar' ? fieldAr : fieldEn) : undefined"
            />
          }
        </nav>
      </div>
    </ng-template>
    <ng-template #fieldEn let-label><div dsSearchField shape="pill" placeholder="Songs, artists and lists" [aria-label]="label"></div></ng-template>
    <ng-template #fieldAr let-label><div dsSearchField shape="pill" placeholder="أغاني وفنانين وقوائم" [aria-label]="label"></div></ng-template>
    <ng-template #playerEn>
      <div dsButtonGroup role="group" aria-label="Now playing" emphasis="ghost">
        <button dsIconButton icon="music" label="Rain on the dunes"></button>
        <button dsIconButton icon="pause" label="Pause"></button>
        <button dsIconButton icon="next-track" label="Next song"></button>
      </div>
    </ng-template>
    <ng-template #playerAr>
      <div dsButtonGroup role="group" aria-label="قيد التشغيل" emphasis="ghost">
        <button dsIconButton icon="music" label="مطر على الكثبان"></button>
        <button dsIconButton icon="pause" label="إيقاف مؤقت"></button>
        <button dsIconButton icon="next-track" label="الأغنية التالية"></button>
      </div>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: sizes, badges and the current item">
      @for (size of sizes; track size) {
        <div data-demo="row" [label]="'Size ' + size"><ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size }) }" /></div>
      }
      <div data-demo="row" [label]="'Badge on the current item'"><ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ activeIndex: 2 }) }" /></div>
      <div data-demo="row" [label]="'Placement side: a column at the inline end on ios, arrow keys up and down'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', placement: 'side' }) }" />
      </div>
      <div data-demo="row" [label]="'Search item: last in the bar, a round item beside the capsule on ios'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, search: 'link' }) }" />
      </div>
      <div data-demo="row" [label]="'Search item, the current page'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, search: 'active' }) }" />
      </div>
      <div data-demo="row" [label]="'Search item turned into its field while current'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, search: 'field' }) }" />
      </div>
      <div data-demo="row" [label]="'Search item in the column: under the capsule on ios'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, placement: 'side', search: 'link' }) }" />
      </div>
      <div data-demo="row" [label]="'Accessory: a mini player above the items, first in the focus order'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, search: 'link', accessory: true }) }" />
      </div>
      <div data-demo="row" [label]="'Compact: the current item, the accessory, the search item'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, search: 'link', activeIndex: 3, accessory: true, compact: true }) }" />
      </div>
      <div data-demo="row" [label]="'Accessory in the column: at the block end of the content on ios'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 4, placement: 'side', search: 'link', accessory: true }) }" />
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="size"><ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size }) }" /></div>
        }
        <div data-demo="row" [label]="'عمود جانبي'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', placement: 'side' }) }" />
        </div>
        <div data-demo="row" [label]="'عنصر البحث'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', count: 4, search: 'link' }) }" />
        </div>
        <div data-demo="row" [label]="'خانة البحث'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', count: 4, search: 'field' }) }" />
        </div>
        <div data-demo="row" [label]="'البحث في العمود'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', count: 4, placement: 'side', search: 'active' }) }" />
        </div>
        <div data-demo="row" [label]="'مشغل مصغر'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', count: 4, search: 'link', accessory: true }) }" />
        </div>
        <div data-demo="row" [label]="'شريط مختصر'">
          <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ lang: 'ar', size: 'lg', count: 4, search: 'link', activeIndex: 3, accessory: true, compact: true }) }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Three destinations, the fewest a bar holds">
      <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ count: 3 }) }" />
      <div data-demo="row" [label]="'Two destinations and the search item'">
        <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ size: 'lg', count: 2, search: 'link' }) }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Five destinations at lg in 320px, the most a bar holds: past five, move the rest into a More page">
      <ng-container *ngTemplateOutlet="appBar; context: { $implicit: bar({ count: 5, activeIndex: 4 }) }" />
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: calc(var(--ds-menu-width-min) * 1.6)">
          <nav dsTabBar aria-label="التنقل الرئيسي" size="lg">
            <a dsTabBarItem href="#home" icon="home" label="الرئيسية" active></a>
            <a dsTabBarItem href="#library" icon="folder" label="المكتبات المشتركة"></a>
            <a dsTabBarItem href="#inbox" icon="inbox" label="الرسائل الواردة" [badge]="12"></a>
            <a dsTabBarItem href="#alerts" icon="bell" label="الإشعارات" [badge]="true"></a>
            <a dsTabBarItem href="#settings" icon="settings" label="إعدادات الحساب"></a>
          </nav>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: the label ends in an ellipsis, the full name stays in the link">
      <div style="max-inline-size: calc(var(--ds-menu-width-min) * 1.6)">
        <nav dsTabBar aria-label="Main">
          <a dsTabBarItem href="#home" icon="home" label="Home" active></a>
          <a dsTabBarItem href="#library" icon="folder" label="Shared libraries"></a>
          <a dsTabBarItem href="#notifications" icon="bell" label="Notifications" [badge]="128"></a>
          <a dsTabBarItem href="#settings" icon="settings" label="Workspace settings"></a>
        </nav>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: calc(var(--ds-menu-width-min) * 1.6)">
          <nav dsTabBar aria-label="التنقل الرئيسي">
            <a dsTabBarItem href="#home" icon="home" label="الرئيسية" active></a>
            <a dsTabBarItem href="#library" icon="folder" label="المكتبات المشتركة"></a>
            <a dsTabBarItem href="#notifications" icon="bell" label="الإشعارات" [badge]="128"></a>
            <a dsTabBarItem href="#settings" icon="settings" label="إعدادات مساحة العمل"></a>
          </nav>
        </div>
        <div style="max-inline-size: calc(var(--ds-menu-width-min) * 1.6)">
          <nav dsTabBar aria-label="تنقل المكتبة" size="lg">
            <a dsTabBarItem href="#home" icon="home" label="الرئيسية"></a>
            <a dsTabBarItem href="#library" icon="folder" label="المكتبات المشتركة"></a>
            <a dsTabBarItem href="#notifications" icon="bell" label="الإشعارات" [badge]="128"></a>
            <ng-container dsTabBarSearch href="#search" label="البحث في المكتبات" [active]="true" [field]="longField" />
          </nav>
        </div>
      </div>
      <ng-template #longField let-label>
        <div dsSearchField shape="pill" placeholder="ملفات ومجلدات وأعضاء الفريق" value="تقرير المبيعات الشهري" [aria-label]="label"></div>
      </ng-template>
    </section>
  `,
})
export default class TabBarDemo {
  protected readonly sizes = sizes;
  protected readonly bar = bar;
}
