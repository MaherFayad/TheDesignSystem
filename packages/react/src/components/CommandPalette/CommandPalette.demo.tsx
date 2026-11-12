import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Kbd } from '../Kbd';
import {
  CommandPalette,
  CommandPaletteTrigger,
  type CommandPaletteCommand,
  type CommandPaletteItem,
  type CommandPaletteProps,
} from './index';

const enItems: CommandPaletteItem[] = [
  {
    label: 'Boards',
    commands: [
      { value: 'create-board', label: 'Create board', start: 'plus', shortcut: 'Mod+Shift+N', keywords: ['new'] },
      { value: 'open-board', label: 'Open board', start: 'folder', shortcut: 'Mod+O' },
      { value: 'duplicate-board', label: 'Duplicate board', start: 'copy', description: 'Makes a copy with every frame and comment' },
      { value: 'export-pdf', label: 'Export as PDF', start: 'download', keywords: ['download', 'print'] },
    ],
  },
  {
    label: 'Team',
    commands: [
      { value: 'invite', label: 'Invite people', start: 'user-plus', description: 'Send an invite link by email' },
      { value: 'share', label: 'Share board', start: 'link', shortcut: 'Mod+Shift+S' },
    ],
  },
  {
    label: 'Account',
    commands: [
      { value: 'settings', label: 'Open settings', start: 'settings', shortcut: 'Mod+,' },
      { value: 'shortcuts', label: 'Show keyboard shortcuts', start: 'keyboard', shortcut: 'Mod+/' },
      { value: 'sign-out', label: 'Sign out', start: 'log-out' },
    ],
  },
];

const arItems: CommandPaletteItem[] = [
  {
    label: 'اللوحات',
    commands: [
      { value: 'create-board', label: 'إنشاء لوحة', start: 'plus', shortcut: 'Mod+Shift+N', keywords: ['جديدة'] },
      { value: 'open-board', label: 'فتح لوحة', start: 'folder', shortcut: 'Mod+O' },
      { value: 'duplicate-board', label: 'نسخ اللوحة', start: 'copy', description: 'نسخة فيها كل الإطارات والتعليقات' },
      { value: 'export-pdf', label: 'تصدير PDF', start: 'download' },
    ],
  },
  {
    label: 'الفريق',
    commands: [
      { value: 'invite', label: 'دعوة أعضاء', start: 'user-plus', description: 'إرسال رابط الدعوة بالإيميل' },
      { value: 'share', label: 'مشاركة اللوحة', start: 'link' },
    ],
  },
  {
    label: 'الحساب',
    commands: [
      { value: 'settings', label: 'فتح الإعدادات', start: 'settings', shortcut: 'Mod+,' },
      { value: 'sign-out', label: 'تسجيل الخروج', start: 'log-out' },
    ],
  },
];

/** Fifty commands: the list scrolls inside the panel. */
const manyCommands: CommandPaletteCommand[] = Array.from({ length: 50 }, (_, i) => ({
  value: `board-${i + 1}`,
  label: `Open board ${i + 1}`,
  start: 'folder',
  description: i % 5 === 0 ? `Updated ${i + 1} days ago` : undefined,
}));

/** A palette with its trigger. Only the variants palette listens for Mod+K, so one palette opens. */
function Palette({
  trigger,
  label,
  shortcut = null,
  ...props
}: Omit<CommandPaletteProps, 'children'> & { trigger: string; label: string }) {
  const [last, setLast] = useState<string | null>(null);
  return (
    <DemoRow>
      <CommandPalette {...props} shortcut={shortcut} onRun={(_value, command) => setLast(command.label)}>
        <CommandPaletteTrigger>
          <Button data-demo-trigger={trigger} start="search">
            {label}
          </Button>
        </CommandPaletteTrigger>
      </CommandPalette>
      {last !== null && <span>Ran: {last}</span>}
    </DemoRow>
  );
}

function LoadingPalette() {
  return <Palette trigger="loading" label="Search commands" items={[]} loading />;
}

function ErrorPalette() {
  const [loading, setLoading] = useState(false);
  return (
    <Palette
      trigger="error"
      label="Search commands"
      items={[]}
      loading={loading}
      empty={
        <>
          <p>Commands could not load. Check your connection.</p>
          <Button
            size="sm"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1200);
            }}
          >
            Load commands
          </Button>
        </>
      }
    />
  );
}

export default function CommandPaletteDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="Shortcut">
          <Kbd>Mod+K</Kbd>
        </DemoRow>
        <Palette trigger="md" label="Search commands" items={enItems} recent={['share', 'export-pdf']} shortcut="Mod+K" />
        <Palette trigger="lg" label="Search commands, large" items={enItems} size="lg" />
        <Theme lang="ar" dir="rtl">
          <Palette trigger="ar" label="بحث في الأوامر" items={arItems} recent={['invite']} />
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Palette trigger="empty" label="Search commands" items={enItems} defaultQuery="Archive" />
      </DemoCase>

      <DemoCase id="one" title="One">
        <Palette trigger="one" label="Search commands" items={[{ value: 'create-board', label: 'Create board', start: 'plus' }]} />
      </DemoCase>

      <DemoCase id="many" title="Many">
        <Palette trigger="many" label="Search commands" items={enItems} defaultQuery="board" />
      </DemoCase>

      <DemoCase id="too-many" title="Too many">
        <Palette trigger="too-many" label="Open a board" items={manyCommands} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Palette
          trigger="long-text"
          label="Search commands"
          items={[
            {
              value: 'export',
              label: 'Export every board in the Spring launch project as one PDF file with comments',
              start: 'download',
              shortcut: 'Mod+Shift+E',
              description: 'The file is sent to your email when it is ready. Large projects can take a few minutes, and the link stays valid for 7 days.',
            },
            { value: 'word', label: 'Supercalifragilisticexpialidocious', start: 'info' },
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic" lang="ar">
        <Palette
          trigger="long-arabic"
          label="بحث في الأوامر"
          items={[
            {
              value: 'export',
              label: 'تصدير كل لوحات مشروع إطلاق الربيع في ملف PDF واحد مع التعليقات',
              start: 'download',
              shortcut: 'Mod+Shift+E',
              description: 'يوصلك الملف على الإيميل لما يجهز. المشاريع الكبيرة تاخذ كم دقيقة، والرابط يشتغل 7 أيام.',
            },
            ...arItems,
          ]}
        />
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <LoadingPalette />
      </DemoCase>

      <DemoCase id="error" title="Error">
        <ErrorPalette />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled commands">
        <Palette
          trigger="disabled"
          label="Search commands"
          items={[
            { value: 'create-board', label: 'Create board', start: 'plus' },
            { value: 'delete-board', label: 'Delete board', start: 'trash', disabled: true, description: 'Only the owner can delete this board' },
            { value: 'share', label: 'Share board', start: 'link' },
          ]}
        />
      </DemoCase>
    </DemoPage>
  );
}
