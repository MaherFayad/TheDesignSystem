import { useState, type CSSProperties, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Sidebar, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem, useSidebar } from './index';
import type { SidebarSize } from './index';
import type { IconName } from '@the-system/icons/react';

const sizes: SidebarSize[] = ['sm', 'md'];

/** A frame the height of a short app window, so the sidebar fills it and the footer sits at the bottom. */
const frame: CSSProperties = {
  display: 'flex',
  blockSize: 'calc(var(--ds-space-12xl) * 3.5)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-hairline)',
  borderRadius: 'var(--ds-radius-panel)',
  overflow: 'hidden',
};

/** tall fits a full sidebar with nothing under the sticky footer. */
function Frame({ tall = false, children }: { tall?: boolean; children: ReactNode }) {
  return <div style={tall ? { ...frame, blockSize: 'calc(var(--ds-space-12xl) * 5)' } : frame}>{children}</div>;
}

interface Copy {
  label: string;
  brand: string;
  brandShort: string;
  workspace: string;
  projects: string;
  items: [IconName, string, number?][];
  projectItems: string[];
  settings: string;
  help: string;
  unread: (n: number) => string;
}

const en: Copy = {
  label: 'Main',
  brand: 'Northwind studio',
  brandShort: 'N',
  workspace: 'Workspace',
  projects: 'Projects',
  items: [
    ['home', 'Home'],
    ['inbox', 'Inbox', 12],
    ['calendar', 'Calendar'],
    ['folder', 'Files', 240],
    ['user', 'People'],
  ],
  projectItems: ['Brand refresh', 'Mobile app', 'Annual report'],
  settings: 'Settings',
  help: 'Help center',
  unread: (n) => `${n} unread`,
};

const ar: Copy = {
  // The landmark name differs from the Home item, so a screen reader does not say the same word twice.
  label: 'التنقل الجانبي',
  brand: 'استوديو الشمال',
  brandShort: 'ش',
  workspace: 'مساحة العمل',
  projects: 'المشاريع',
  items: [
    ['home', 'الرئيسية'],
    ['inbox', 'الوارد', 12],
    ['calendar', 'التقويم'],
    ['folder', 'الملفات', 240],
    ['user', 'الأشخاص'],
  ],
  projectItems: ['تحديث الهوية', 'تطبيق الجوال', 'التقرير السنوي'],
  settings: 'الإعدادات',
  help: 'مركز المساعدة',
  unread: (n) => `${n} غير مقروءة`,
};

/** The folders of the too many case, each with its own icon. */
const tooMany: [IconName, string][] = [
  ...en.items.map(([icon, label]): [IconName, string] => [icon, label]),
  ['edit', 'Drafts'],
  ['send', 'Sent'],
  ['download', 'Archive'],
  ['trash', 'Trash'],
  ['warning', 'Spam'],
  ['star', 'Starred'],
  ['alert-circle', 'Important'],
  ['clock', 'Scheduled'],
  ['copy', 'Templates'],
  ['bell-off', 'Snoozed'],
];

function Brand({ copy }: { copy: Copy }) {
  const { collapsed } = useSidebar();
  return <strong>{collapsed ? copy.brandShort : copy.brand}</strong>;
}

function AppSidebar({
  copy,
  size,
  defaultCollapsed,
  collapsibleGroups = false,
  activeIndex = 1,
}: {
  copy: Copy;
  size?: SidebarSize;
  defaultCollapsed?: boolean;
  collapsibleGroups?: boolean;
  activeIndex?: number;
}) {
  return (
    <Sidebar label={copy.label} size={size} defaultCollapsed={defaultCollapsed}>
      <SidebarHeader>
        <Brand copy={copy} />
      </SidebarHeader>
      <SidebarGroup label={copy.workspace}>
        {copy.items.map(([icon, label, count], i) => (
          <SidebarItem
            key={label}
            href={`#item-${i}`}
            start={icon}
            count={count}
            countLabel={count === 12 ? copy.unread(count) : undefined}
            active={i === activeIndex}
          >
            {label}
          </SidebarItem>
        ))}
      </SidebarGroup>
      <SidebarGroup label={copy.projects} collapsible={collapsibleGroups}>
        {copy.projectItems.map((label, i) => (
          <SidebarItem key={label} href={`#project-${i}`} start="file">
            {label}
          </SidebarItem>
        ))}
      </SidebarGroup>
      <SidebarFooter>
        <SidebarItem href="#settings" start="settings">
          {copy.settings}
        </SidebarItem>
        <SidebarItem href="#help" start="help">
          {copy.help}
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}

function ControlledSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <Frame>
      <Sidebar label="Settings" collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <SidebarGroup>
          <SidebarItem href="#profile" start="user" active>
            Profile
          </SidebarItem>
          <SidebarItem href="#security" start="lock">
            Security
          </SidebarItem>
          <SidebarItem href="#alerts" start="bell" count={3}>
            Notifications
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>
    </Frame>
  );
}

export default function SidebarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, expanded and collapsed, collapsible groups">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Frame tall>
              <AppSidebar copy={en} size={size} collapsibleGroups />
            </Frame>
            <Frame tall>
              <AppSidebar copy={en} size={size} defaultCollapsed />
            </Frame>
          </DemoRow>
        ))}
        <DemoRow label="Controlled, starts collapsed">
          <ControlledSidebar />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow>
            <Frame tall>
              <AppSidebar copy={ar} collapsibleGroups />
            </Frame>
            <Frame tall>
              <AppSidebar copy={ar} defaultCollapsed />
            </Frame>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <Frame>
          <Sidebar label="Main">
            <SidebarGroup>
              <SidebarItem href="#home" start="home" active>
                Home
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        </Frame>
      </DemoCase>

      <DemoCase id="many" title="Many items in groups">
        <Frame tall>
          <AppSidebar copy={en} collapsibleGroups activeIndex={0} />
        </Frame>
      </DemoCase>

      <DemoCase id="too-many" title="Too many items, the sidebar scrolls and the header and footer stay">
        <Frame>
          <Sidebar label="Mail">
            <SidebarHeader>
              <strong>Mail</strong>
            </SidebarHeader>
            <SidebarGroup label="Folders">
              {tooMany.map(([icon, label], i) => (
                <SidebarItem key={label} href={`#folder-${i}`} start={icon} count={i === 2 ? 1500 : i * 7}>
                  {label}
                </SidebarItem>
              ))}
            </SidebarGroup>
            <SidebarFooter>
              <SidebarItem href="#settings" start="settings">
                Settings
              </SidebarItem>
            </SidebarFooter>
          </Sidebar>
        </Frame>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps">
        <Frame>
          <Sidebar label="Reports">
            <SidebarGroup label="Quarterly reports for the finance and operations teams" collapsible>
              <SidebarItem href="#r1" start="file" count={4}>
                Revenue by region and channel for the third quarter
              </SidebarItem>
              <SidebarItem href="#r2" start="file">
                Supercalifragilisticexpialidocious
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        </Frame>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Frame>
          <Sidebar label="التقارير">
            <SidebarGroup label="التقارير الربعية لفريق المالية وفريق العمليات" collapsible>
              <SidebarItem href="#ar-r1" start="file" count={4}>
                الإيرادات حسب المنطقة والقناة للربع الثالث من السنة
              </SidebarItem>
              <SidebarItem href="#ar-r2" start="file" active>
                الاشتراكات
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        </Frame>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled items">
        <Frame>
          <Sidebar label="Billing">
            <SidebarGroup label="Billing">
              <SidebarItem href="#plan" start="star" active>
                Plan
              </SidebarItem>
              <SidebarItem href="#invoices" start="file" disabled>
                Invoices
              </SidebarItem>
              <SidebarItem href="#cards" start="key" disabled count={2}>
                Payment methods
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        </Frame>
      </DemoCase>
    </DemoPage>
  );
}
