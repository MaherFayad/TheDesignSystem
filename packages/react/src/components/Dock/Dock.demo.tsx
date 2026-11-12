import type { IconName } from '@the-system/icons';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Dock, DockItem, DockSeparator, type DockSize } from './index';

interface App {
  icon: IconName;
  en: string;
  ar: string;
  open?: boolean;
}

/** App names. Arabic: noun form labels, no diacritics. */
const apps: App[] = [
  { icon: 'folder', en: 'Files', ar: 'الملفات', open: true },
  { icon: 'mail', en: 'Mail', ar: 'البريد', open: true },
  { icon: 'calendar', en: 'Calendar', ar: 'التقويم' },
  { icon: 'image', en: 'Photos', ar: 'الصور' },
  { icon: 'grid', en: 'Boards', ar: 'اللوحات' },
  { icon: 'settings', en: 'Settings', ar: 'الإعدادات' },
];

const sizes: DockSize[] = ['md', 'lg'];

function AppDock({ lang = 'en', size, count = apps.length }: { lang?: 'en' | 'ar'; size?: DockSize; count?: number }) {
  const list = apps.slice(0, count);
  return (
    <Dock aria-label={lang === 'ar' ? 'التطبيقات' : 'Apps'} size={size}>
      {list.map((a, i) => (
        <DockItem key={a.en} href={`#${a.en.toLowerCase()}`} icon={a.icon} label={a[lang]} open={a.open} active={i === 0} />
      ))}
      {count > 4 && (
        <>
          <DockSeparator />
          <DockItem href="#trash" icon="trash" label={lang === 'ar' ? 'سلة المحذوفات' : 'Trash'} />
        </>
      )}
    </Dock>
  );
}

const many: App[] = [
  ...apps,
  { icon: 'globe', en: 'Browser', ar: 'المتصفح' },
  { icon: 'clock', en: 'Clock', ar: 'الساعة' },
  { icon: 'mic', en: 'Voice notes', ar: 'الملاحظات الصوتية' },
  { icon: 'star', en: 'Favorites', ar: 'المفضلة' },
  { icon: 'history', en: 'Activity', ar: 'النشاط' },
  { icon: 'key', en: 'Passwords', ar: 'كلمات المرور' },
  { icon: 'phone', en: 'Calls', ar: 'المكالمات' },
  { icon: 'keyboard', en: 'Shortcuts', ar: 'الاختصارات' },
];

export default function DockDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, open apps, the current app and a separator">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <AppDock size={size} />
          </DemoRow>
        ))}
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="md">
            <AppDock lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One app">
        <div>
          <Dock aria-label="Apps">
            <DockItem href="#files" icon="folder" label="Files" open />
          </Dock>
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many apps: the dock wraps, the page does not scroll sideways">
        <div>
          <Dock aria-label="Apps">
            {many.map((a) => (
              <DockItem key={a.en} href={`#${a.en.toLowerCase()}`} icon={a.icon} label={a.en} open={a.open} />
            ))}
          </Dock>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the name shows on hover and focus">
        <div>
          <Dock aria-label="Apps">
            <DockItem href="#review" icon="check-circle" label="Design review for the spring release" />
            <DockItem href="#notes" icon="edit" label="Notes" />
          </Dock>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div>
          <Dock aria-label="التطبيقات">
            <DockItem href="#review" icon="check-circle" label="مراجعة التصميم لإصدار الربيع" />
            <DockItem href="#notes" icon="edit" label="الملاحظات" />
          </Dock>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
