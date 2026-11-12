import type { CSSProperties, ReactNode } from 'react';
import type { IconName } from '@the-system/icons/react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Rail, RailItem } from './index';
import type { RailSize } from './index';

const sizes: RailSize[] = ['sm', 'md'];

/** A frame the height of a short app window, so the rail fills it and the end sits at the bottom. */
const frame: CSSProperties = {
  display: 'flex',
  blockSize: 'calc(var(--ds-space-12xl) * 3.5)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-hairline)',
  borderRadius: 'var(--ds-radius-panel)',
  overflow: 'hidden',
};

function Frame({ children }: { children: ReactNode }) {
  return <div style={frame}>{children}</div>;
}

type Entry = [IconName, string, (number | boolean)?];

const en: Entry[] = [
  ['home', 'Home'],
  ['inbox', 'Inbox', 3],
  ['folder', 'Files'],
  ['grid', 'Boards', true],
  ['search', 'Search'],
];

const ar: Entry[] = [
  ['home', 'الرئيسية'],
  ['inbox', 'الوارد', 3],
  ['folder', 'الملفات'],
  ['grid', 'اللوحات', true],
  ['search', 'البحث'],
];

function Mark({ children }: { children: string }) {
  return <strong aria-hidden="true">{children}</strong>;
}

function AppRail({
  entries,
  size,
  hideLabels,
  label = 'Main',
  settings = 'Settings',
  mark = 'N',
  newActivity = 'New activity',
}: {
  entries: Entry[];
  size?: RailSize;
  hideLabels?: boolean;
  label?: string;
  settings?: string;
  mark?: string;
  newActivity?: string;
}) {
  return (
    <Rail
      label={label}
      size={size}
      hideLabels={hideLabels}
      start={<Mark>{mark}</Mark>}
      end={<RailItem href="#settings" icon="settings" label={settings} />}
    >
      {entries.map(([icon, text, badge], i) => (
        <RailItem
          key={text}
          href={`#rail-${i}`}
          icon={icon}
          label={text}
          badge={badge}
          badgeLabel={badge === true ? newActivity : undefined}
          active={i === 0}
        />
      ))}
    </Rail>
  );
}

export default function RailDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, labels shown and hidden, badges">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Frame>
              <AppRail entries={en} size={size} />
            </Frame>
            <Frame>
              <AppRail entries={en} size={size} hideLabels />
            </Frame>
          </DemoRow>
        ))}
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow>
            <Frame>
              <AppRail entries={ar} label="أقسام التطبيق" settings="الإعدادات" mark="ش" newActivity="نشاط جديد" />
            </Frame>
            <Frame>
              <AppRail entries={ar} label="أقسام التطبيق" settings="الإعدادات" mark="ش" newActivity="نشاط جديد" size="sm" hideLabels />
            </Frame>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <Frame>
          <Rail label="Main">
            <RailItem href="#home" icon="home" label="Home" active />
          </Rail>
        </Frame>
      </DemoCase>

      <DemoCase id="many" title="Many items with a start and an end">
        <Frame>
          <AppRail entries={en} />
        </Frame>
      </DemoCase>

      <DemoCase id="too-many" title="Too many items, the rail scrolls and badges cap at 99+">
        <Frame>
          <Rail label="Tools" size="sm" end={<RailItem href="#help" icon="help" label="Help" />}>
            {(
              [
                'home', 'inbox', 'folder', 'grid', 'search', 'calendar', 'user', 'bell', 'star', 'tag', 'image', 'list', 'columns', 'history',
              ] as IconName[]
            ).map((icon, i) => (
              <RailItem key={icon} href={`#tool-${i}`} icon={icon} label={icon.charAt(0).toUpperCase() + icon.slice(1)} badge={i === 1 ? 250 : undefined} active={i === 0} />
            ))}
          </Rail>
        </Frame>
      </DemoCase>

      <DemoCase id="long-text" title="Long labels end in an ellipsis">
        <Frame>
          <Rail label="Main">
            <RailItem href="#a" icon="folder" label="Documents" active />
            <RailItem href="#b" icon="user" label="Supercalifragilisticexpialidocious" />
          </Rail>
        </Frame>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic labels" lang="ar">
        <Frame>
          <Rail label="أقسام التطبيق">
            <RailItem href="#ar-a" icon="folder" label="المستندات المشتركة" active />
            <RailItem href="#ar-b" icon="user" label="الاشتراكات" badge={12} />
            <RailItem href="#ar-c" icon="settings" label="Settings" />
          </Rail>
        </Frame>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled items">
        <Frame>
          <Rail label="Main">
            <RailItem href="#a" icon="home" label="Home" active />
            <RailItem href="#b" icon="lock" label="Admin" disabled />
            <RailItem href="#c" icon="inbox" label="Inbox" disabled badge={4} />
          </Rail>
        </Frame>
      </DemoCase>
    </DemoPage>
  );
}
