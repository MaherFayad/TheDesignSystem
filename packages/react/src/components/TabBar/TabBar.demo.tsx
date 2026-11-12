import type { IconName } from '@the-system/icons';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { TabBar, TabBarItem, type TabBarSize } from './index';

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

function AppBar({ lang = 'en', size, count = 5, activeIndex = 0 }: { lang?: 'en' | 'ar'; size?: TabBarSize; count?: number; activeIndex?: number }) {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 'calc(var(--ds-menu-width-min) * 2)' }}>
      <TabBar aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main'} size={size}>
        {dests.slice(0, count).map((d, i) => (
          <TabBarItem key={d.en} href={`#${d.en.toLowerCase()}`} icon={d.icon} label={d[lang]} badge={d.badge} active={i === activeIndex} />
        ))}
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
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {sizes.map((size) => (
            <DemoRow key={size} label={size}>
              <AppBar lang="ar" size={size} />
            </DemoRow>
          ))}
        </Theme>
      </DemoCase>

      <DemoCase id="many" title="Three destinations, the fewest a bar holds">
        <AppBar count={3} />
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
      </DemoCase>
    </DemoPage>
  );
}
