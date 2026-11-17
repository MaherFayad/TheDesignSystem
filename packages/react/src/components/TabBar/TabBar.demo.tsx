import type { IconName } from '@the-system/icons';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { SearchField } from '../SearchField';
import { TabBar, TabBarItem, TabBarSearch, type TabBarSize } from './index';
import type { TabBarPlacement } from './TabBar';

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

const sizes: TabBarSize[] = ['md', 'lg'];

function AppBar({
  lang = 'en',
  size,
  count = 5,
  activeIndex = 0,
  placement,
  search,
}: {
  lang?: 'en' | 'ar';
  size?: TabBarSize;
  count?: number;
  activeIndex?: number;
  placement?: TabBarPlacement;
  /** A search item after the tabs: a link, the current page, or the current page turned into its field. */
  search?: 'link' | 'active' | 'field';
}) {
  // The search item takes the place of the Search tab.
  const tabs = search ? dests.filter((d) => d.icon !== 'search') : dests;
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 'calc(var(--ds-menu-width-min) * 2)' }}>
      <TabBar aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main'} size={size} placement={placement}>
        {tabs.slice(0, count).map((d, i) => (
          <TabBarItem key={d.en} href={`#${d.en.toLowerCase()}`} icon={d.icon} label={d[lang]} badge={d.badge} active={(search === undefined || search === 'link') && i === activeIndex} />
        ))}
        {search && (
          <TabBarSearch
            href="#search"
            label={lang === 'ar' ? 'بحث' : 'Search'}
            active={search !== 'link'}
            field={search === 'field' ? <SearchField placeholder={lang === 'ar' ? 'أغاني وفنانين وقوائم' : 'Songs, artists and lists'} shape="pill" /> : undefined}
          />
        )}
      </TabBar>
    </div>
  );
}

export default function TabBarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, badges and the current item">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <AppBar size={size} />
          </DemoRow>
        ))}
        <DemoRow label="Badge on the current item">
          <AppBar activeIndex={2} />
        </DemoRow>
        <DemoRow label="Placement side: a column at the inline end on ios, arrow keys up and down">
          <AppBar size="lg" placement="side" />
        </DemoRow>
        <DemoRow label="Search item: last in the bar, a round item beside the capsule on ios">
          <AppBar size="lg" count={4} search="link" />
        </DemoRow>
        <DemoRow label="Search item, the current page">
          <AppBar size="lg" count={4} search="active" />
        </DemoRow>
        <DemoRow label="Search item turned into its field while current">
          <AppBar size="lg" count={4} search="field" />
        </DemoRow>
        <DemoRow label="Search item in the column: under the capsule on ios">
          <AppBar size="lg" count={4} placement="side" search="link" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {sizes.map((size) => (
            <DemoRow key={size} label={size}>
              <AppBar lang="ar" size={size} />
            </DemoRow>
          ))}
          <DemoRow label="عمود جانبي">
            <AppBar lang="ar" size="lg" placement="side" />
          </DemoRow>
          <DemoRow label="البحث">
            <AppBar lang="ar" size="lg" count={4} search="link" />
          </DemoRow>
          <DemoRow label="خانة البحث">
            <AppBar lang="ar" size="lg" count={4} search="field" />
          </DemoRow>
          <DemoRow label="البحث في العمود">
            <AppBar lang="ar" size="lg" count={4} placement="side" search="active" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="many" title="Three destinations, the fewest a bar holds">
        <AppBar count={3} />
        <DemoRow label="Two destinations and the search item">
          <AppBar size="lg" count={2} search="link" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Five destinations at lg in 320px, the most a bar holds: past five, move the rest into a More page">
        <AppBar count={5} activeIndex={4} />
        <Theme lang="ar" data-demo="content">
          <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.6)' }}>
            <TabBar aria-label="التنقل الرئيسي" size="lg">
              <TabBarItem href="#home" icon="home" label="الرئيسية" active />
              <TabBarItem href="#library" icon="folder" label="المكتبات المشتركة" />
              <TabBarItem href="#inbox" icon="inbox" label="الرسائل الواردة" badge={12} />
              <TabBarItem href="#alerts" icon="bell" label="الإشعارات" badge />
              <TabBarItem href="#settings" icon="settings" label="إعدادات الحساب" />
            </TabBar>
          </div>
        </Theme>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the label ends in an ellipsis, the full name stays in the link" lang="en">
        <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.6)' }}>
          <TabBar aria-label="Main">
            <TabBarItem href="#home" icon="home" label="Home" active />
            <TabBarItem href="#library" icon="folder" label="Shared libraries" />
            <TabBarItem href="#notifications" icon="bell" label="Notifications" badge={128} />
            <TabBarItem href="#settings" icon="settings" label="Workspace settings" />
          </TabBar>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.6)' }}>
          <TabBar aria-label="التنقل الرئيسي">
            <TabBarItem href="#home" icon="home" label="الرئيسية" active />
            <TabBarItem href="#library" icon="folder" label="المكتبات المشتركة" />
            <TabBarItem href="#notifications" icon="bell" label="الإشعارات" badge={128} />
            <TabBarItem href="#settings" icon="settings" label="إعدادات مساحة العمل" />
          </TabBar>
        </div>
        <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.6)' }}>
          <TabBar aria-label="تنقل المكتبة" size="lg">
            <TabBarItem href="#home" icon="home" label="الرئيسية" />
            <TabBarItem href="#library" icon="folder" label="المكتبات المشتركة" />
            <TabBarItem href="#notifications" icon="bell" label="الإشعارات" badge={128} />
            <TabBarSearch
              href="#search"
              label="البحث في المكتبات"
              active
              field={<SearchField placeholder="ملفات ومجلدات وأعضاء الفريق" shape="pill" defaultValue="تقرير المبيعات الشهري" />}
            />
          </TabBar>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
