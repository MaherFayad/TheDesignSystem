import type { CSSProperties, ReactNode } from 'react';
import type { IconName } from '@the-system/icons/react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { sample } from '../../demo';
import { Button } from '../Button';
import { Rail, RailItem } from '../Rail';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';
import { PageShell, usePageShell, type PageShellProps, type PageShellSidebar } from './index';

/** A frame the height of a short app window, so each page preview sits in its own box. */
const frame: CSSProperties = {
  blockSize: 'calc(var(--ds-space-12xl) * 4)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-hairline)',
  borderRadius: 'var(--ds-radius-panel)',
  overflow: 'auto',
};

function Frame({ children }: { children: ReactNode }) {
  return <div style={frame}>{children}</div>;
}

const enNav: [IconName, string][] = [
  ['home', 'Home'],
  ['inbox', 'Inbox'],
  ['folder', 'Boards'],
  ['user', 'People'],
  ['settings', 'Settings'],
];

const arNav: [IconName, string][] = [
  ['home', 'الرئيسية'],
  ['inbox', 'الوارد'],
  ['folder', 'اللوحات'],
  ['user', 'الأعضاء'],
  ['settings', 'الإعدادات'],
];

/** A Sidebar that follows the shell's column state, so its toggle and the shell agree. */
function ShellSidebar({ items, label, prefix }: { items: [IconName, string][]; label: string; prefix: string }) {
  const { sidebar, setSidebar } = usePageShell();
  return (
    <Sidebar
      label={label}
      collapsed={sidebar === 'collapsed'}
      onCollapsedChange={(collapsed) => setSidebar(collapsed ? 'collapsed' : 'expanded')}
    >
      <SidebarGroup label={label}>
        {items.map(([icon, text], i) => (
          <SidebarItem key={text} href={`#${prefix}-${i}`} start={icon} active={i === 2}>
            {text}
          </SidebarItem>
        ))}
      </SidebarGroup>
    </Sidebar>
  );
}

function Header({ title, action }: { title: string; action?: string }) {
  return (
    <DemoRow>
      <strong>{title}</strong>
      {action && (
        <Button size="sm" start="plus">
          {action}
        </Button>
      )}
    </DemoRow>
  );
}

function Shell({ id, sidebar, ...props }: Omit<PageShellProps, 'mainId' | 'embedded'> & { id: string }) {
  return (
    <Frame>
      <PageShell
        embedded
        mainId={id}
        defaultSidebar={sidebar as PageShellSidebar | undefined}
        nav={<ShellSidebar items={enNav} label="Main" prefix={id} />}
        header={<Header title="Northwind studio" action="Create board" />}
        footer="Northwind studio, 2026"
        {...props}
      />
    </Frame>
  );
}

const boards = ['Spring launch', 'Brand refresh', 'Mobile app', 'Annual report', 'Hiring plan', 'Customer research'];

export default function PageShellDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="Expanded, with an aside">
          <span />
        </DemoRow>
        <Shell id="shell-expanded" aside={<p>3 people are viewing this board.</p>}>
          <h3>Boards</h3>
          <p>Pick a board to open it.</p>
        </Shell>
        <DemoRow label="Collapsed">
          <span />
        </DemoRow>
        <Shell id="shell-collapsed" sidebar="collapsed">
          <h3>Boards</h3>
          <p>The column keeps only the icons.</p>
        </Shell>
        <DemoRow label="Hidden: the menu button opens the navigation">
          <span />
        </DemoRow>
        <Shell id="shell-hidden" sidebar="hidden">
          <h3>Boards</h3>
          <p>The navigation opens in a drawer from the menu button.</p>
        </Shell>
        <DemoRow label="Rail">
          <span />
        </DemoRow>
        <Shell
          id="shell-rail"
          nav={
            <Rail label="Main">
              {enNav.map(([icon, text], i) => (
                <RailItem key={text} href={`#rail-${i}`} icon={icon} label={text} active={i === 0} />
              ))}
            </Rail>
          }
        >
          <h3>Home</h3>
          <p>A rail keeps the page wide.</p>
        </Shell>
        <DemoRow label="Arabic">
          <span />
        </DemoRow>
        <Frame>
          <PageShell
            embedded
            mainId="shell-ar"
            nav={<ShellSidebar items={arNav} label="الرئيسية" prefix="shell-ar" />}
            header={<Header title="استوديو الشمال" action="إنشاء لوحة" />}
            aside={<p>3 أعضاء يشوفون اللوحة الحين.</p>}
            footer="استوديو الشمال، 2026"
            skipLabel="الانتقال للمحتوى الرئيسي"
          >
            <h3>اللوحات</h3>
            <p>اختر لوحة عشان تفتحها.</p>
          </PageShell>
        </Frame>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Shell id="shell-empty">
          <h3>No boards yet</h3>
          <p>Create a board to start. It shows here.</p>
          <Button start="plus">Create board</Button>
        </Shell>
      </DemoCase>

      <DemoCase id="one" title="One region">
        <Frame>
          <PageShell embedded mainId="shell-one">
            <p>Only main: no header, navigation, aside or footer. The skip link still comes first.</p>
          </PageShell>
        </Frame>
      </DemoCase>

      <DemoCase id="many" title="Many">
        <Shell id="shell-many" aside={<p>Filters and details go here.</p>}>
          <h3>Boards</h3>
          <ul>
            {boards.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Shell>
      </DemoCase>

      <DemoCase id="too-many" title="Too many">
        <Shell
          id="shell-too-many"
          nav={
            <Sidebar label="Main">
              <SidebarGroup label="Boards">
                {Array.from({ length: 40 }, (_, i) => (
                  <SidebarItem key={i} href={`#too-many-${i}`} start="file">
                    {`Board ${i + 1}`}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            </Sidebar>
          }
        >
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>{sample.en.long}</p>
          ))}
        </Shell>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Shell
          id="shell-long"
          header={<Header title="Northwind studio and the Spring launch planning workspace for the brand team" action="Create board" />}
          aside={<p>{sample.en.long}</p>}
          footer={sample.en.long}
        >
          <h3>{sample.en.word}</h3>
          <p>{sample.en.long}</p>
        </Shell>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic" lang="ar">
        <Frame>
          <PageShell
            embedded
            mainId="shell-long-ar"
            nav={<ShellSidebar items={arNav} label="الرئيسية" prefix="shell-long-ar" />}
            header={<Header title="استوديو الشمال ومساحة تخطيط إطلاق الربيع لفريق الهوية" action="إنشاء لوحة" />}
            aside={<p>{sample.ar.long}</p>}
            footer={sample.ar.long}
          >
            <h3>{sample.ar.word}</h3>
            <p>{sample.ar.long}</p>
          </PageShell>
        </Frame>
      </DemoCase>
    </DemoPage>
  );
}
