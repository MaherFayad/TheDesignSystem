// TabBar demo. The copy follows the page language: with lang=ar the
// English rows read Arabic too, and the Arabic rows stay as they are.
import type { IconName } from '@the-system/icons';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Theme } from '../../theme/Theme';
import { isArabic } from '../Popover/FloatingLayer';
import { SearchField } from '../SearchField';
import { Toolbar, ToolbarButton } from '../Toolbar';
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
  accessory = false,
  compact = false,
}: {
  lang?: 'en' | 'ar';
  size?: TabBarSize;
  count?: number;
  activeIndex?: number;
  placement?: TabBarPlacement;
  /** A search item after the tabs: a link, the current page, or the current page turned into its field. */
  search?: 'link' | 'active' | 'field';
  /** A mini player in the accessory part (order C2). */
  accessory?: boolean;
  /** The compact bar: the current item, the accessory, the search item. */
  compact?: boolean;
}) {
  // The search item takes the place of the Search tab.
  const tabs = search ? dests.filter((d) => d.icon !== 'search') : dests;
  // On ios the accessory of a bottom bar is its own capsule drawn above the
  // bar's box: the row keeps that room (one rail item and the gap) so the
  // capsule never covers the label or the case above it.
  const { platform } = useTheme();
  const room = platform === 'ios' && accessory && !compact && placement !== 'side';
  return (
    <div
      style={{
        inlineSize: '100%',
        maxInlineSize: 'calc(var(--ds-menu-width-min) * 2)',
        paddingBlockStart: room ? 'calc(var(--ds-size-touch-ios) + var(--ds-space-fixed-2xs) + var(--ds-space-fixed-m))' : undefined,
      }}
    >
      <TabBar
        aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main'}
        size={size}
        placement={placement}
        compact={compact}
        accessory={accessory ? <MiniPlayer lang={lang} /> : undefined}
      >
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

/** A mini player: the song opens the player; pause and next are its commands. */
function MiniPlayer({ lang }: { lang: 'en' | 'ar' }) {
  const w =
    lang === 'ar'
      ? { player: 'قيد التشغيل', song: 'مطر على الكثبان', pause: 'إيقاف مؤقت', next: 'الأغنية التالية' }
      : { player: 'Now playing', song: 'Rain on the dunes', pause: 'Pause', next: 'Next song' };
  return (
    <Toolbar aria-label={w.player} overflow="wrap" emphasis="ghost">
      <ToolbarButton start="music">{w.song}</ToolbarButton>
      <ToolbarButton icon="pause" label={w.pause} />
      <ToolbarButton icon="next-track" label={w.next} />
    </Toolbar>
  );
}

/**
 * A compact bar in the side column whose search item is the current page.
 * On ios the bar hides and its field is drawn beside the column's foot,
 * out of the bar's box, so each bar gets a block as tall as the field and
 * sits at its end: the field stays inside its own case.
 */
function SideSearch({ lang }: { lang: 'en' | 'ar' }) {
  const t =
    lang === 'ar'
      ? { bar: 'الموسيقى', home: 'الرئيسية', library: 'المكتبة', search: 'البحث', field: 'أغاني وفنانين' }
      : { bar: 'Music', home: 'Home', library: 'Library', search: 'Search', field: 'Songs and artists' };
  return (
    <div style={{ display: 'grid', alignContent: 'end', minBlockSize: 'calc(var(--ds-size-touch-ios) + var(--ds-space-fixed-2xs))' }}>
      <TabBar aria-label={t.bar} placement="side" compact>
        <TabBarItem href="#home" icon="home" label={t.home} />
        <TabBarItem href="#library" icon="library" label={t.library} />
        <TabBarSearch href="#search" label={t.search} active field={<SearchField shape="pill" placeholder={t.field} />} />
      </TabBar>
    </div>
  );
}

export default function TabBarDemo() {
  const lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, badges and the current item">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <AppBar lang={lang} size={size} />
          </DemoRow>
        ))}
        <DemoRow label="Badge on the current item">
          <AppBar lang={lang} activeIndex={2} />
        </DemoRow>
        <DemoRow label="Placement side: a column at the inline end on ios, arrow keys up and down">
          <AppBar lang={lang} size="lg" placement="side" />
        </DemoRow>
        <DemoRow label="Search item: last in the bar, a round item beside the capsule on ios">
          <AppBar lang={lang} size="lg" count={4} search="link" />
        </DemoRow>
        <DemoRow label="Search item, the current page">
          <AppBar lang={lang} size="lg" count={4} search="active" />
        </DemoRow>
        <DemoRow label="Search item turned into its field while current">
          <AppBar lang={lang} size="lg" count={4} search="field" />
        </DemoRow>
        <DemoRow label="Search item in the column: under the capsule on ios">
          <AppBar lang={lang} size="lg" count={4} placement="side" search="link" />
        </DemoRow>
        <DemoRow label="Accessory: a mini player above the items, first in the focus order">
          <AppBar lang={lang} size="lg" count={4} search="link" accessory />
        </DemoRow>
        <DemoRow label="Compact: the current item, the accessory, the search item">
          <AppBar lang={lang} size="lg" count={4} search="link" activeIndex={3} accessory compact />
        </DemoRow>
        <DemoRow label="Accessory in the column: at the block end of the content on ios">
          <AppBar lang={lang} size="lg" count={4} placement="side" search="link" accessory />
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
          <DemoRow label="عنصر البحث">
            <AppBar lang="ar" size="lg" count={4} search="link" />
          </DemoRow>
          <DemoRow label="خانة البحث">
            <AppBar lang="ar" size="lg" count={4} search="field" />
          </DemoRow>
          <DemoRow label="البحث في العمود">
            <AppBar lang="ar" size="lg" count={4} placement="side" search="active" />
          </DemoRow>
          <DemoRow label="مشغل مصغر">
            <AppBar lang="ar" size="lg" count={4} search="link" accessory />
          </DemoRow>
          <DemoRow label="شريط مختصر">
            <AppBar lang="ar" size="lg" count={4} search="link" activeIndex={3} accessory compact />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="many" title="Three destinations, the fewest a bar holds">
        <AppBar lang={lang} count={3} />
        <DemoRow label="Two destinations and the search item">
          <AppBar lang={lang} size="lg" count={2} search="link" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Five destinations at lg in 320px, the most a bar holds: past five, move the rest into a More page">
        <AppBar lang={lang} count={5} activeIndex={4} />
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

      <DemoCase id="search-side" title="The search field while the bar sits in the side column: on ios the field leaves the column for the foot of the content">
        <SideSearch lang={lang} />
        <Theme lang="ar" dir="rtl" data-demo="content">
          <SideSearch lang="ar" />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
