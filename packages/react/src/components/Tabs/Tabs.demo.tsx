import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Tabs, TabsList, TabsPanel, TabsTrigger, type TabsEmphasis, type TabsSize } from './index';

const sizes: TabsSize[] = ['sm', 'md'];
const emphases: TabsEmphasis[] = ['ghost', 'soft'];

/** Board settings, a typical set of related panels. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    list: 'Board settings',
    tabs: ['General', 'Members', 'Comments', 'History'],
    panels: [
      'Name the board and pick who sees it first.',
      'Invite people by email and set what each one can do.',
      'Open comments on this board, newest first.',
      'Every saved version of the board, with who saved it.',
    ],
  },
  ar: {
    list: 'إعدادات اللوحة',
    tabs: ['عام', 'الأعضاء', 'التعليقات', 'السجل'],
    panels: [
      'اختر اسم اللوحة ومين يشوفها أول.',
      'ادع الأشخاص بالإيميل وحدد وش يقدر يسوي كل واحد.',
      'التعليقات المفتوحة على اللوحة، الأحدث أول.',
      'كل نسخة محفوظة من اللوحة، ومين حفظها.',
    ],
  },
} as const;

const icons = ['settings', 'user', 'mail', 'history'] as const;

function BoardTabs({
  lang = 'en',
  size,
  emphasis,
  orientation,
  withIcons = false,
  withCounts = false,
}: {
  lang?: 'en' | 'ar';
  size?: TabsSize;
  emphasis?: TabsEmphasis;
  orientation?: 'horizontal' | 'vertical';
  withIcons?: boolean;
  withCounts?: boolean;
}) {
  const c = copy[lang];
  return (
    <Tabs defaultValue="t0" size={size} emphasis={emphasis} orientation={orientation}>
      <TabsList aria-label={c.list}>
        {c.tabs.map((label, i) => (
          <TabsTrigger
            key={label}
            value={`t${i}`}
            start={withIcons ? icons[i] : undefined}
            count={withCounts && i === 2 ? 12 : undefined}
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {c.panels.map((text, i) => (
        <TabsPanel key={text} value={`t${i}`}>
          <p>{text}</p>
        </TabsPanel>
      ))}
    </Tabs>
  );
}

const many = ['Overview', 'Layers', 'Assets', 'Comments', 'History', 'Variables', 'Prototype', 'Export'];
const tooMany = [
  'Overview', 'Layers', 'Assets', 'Comments', 'History', 'Variables', 'Prototype', 'Export',
  'Plugins', 'Libraries', 'Styles', 'Tokens', 'Access', 'Billing', 'Activity', 'Archive',
];

export default function TabsDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: emphasis, size, icons, counts and orientation">
        {emphases.map((emphasis) =>
          sizes.map((size) => (
            <DemoRow key={`${emphasis}-${size}`} label={`${emphasis} ${size}`}>
              <BoardTabs emphasis={emphasis} size={size} withCounts />
            </DemoRow>
          )),
        )}
        <DemoRow label="Icons">
          <BoardTabs withIcons withCounts />
        </DemoRow>
        <DemoRow label="Vertical ghost">
          <BoardTabs orientation="vertical" withIcons />
        </DemoRow>
        <DemoRow label="Vertical soft">
          <BoardTabs orientation="vertical" emphasis="soft" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {emphases.map((emphasis) => (
            <DemoRow key={emphasis} label={emphasis}>
              <BoardTabs lang="ar" emphasis={emphasis} withIcons withCounts />
            </DemoRow>
          ))}
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty panel: say what to do next">
        <Tabs defaultValue="comments">
          <TabsList aria-label="Board activity">
            <TabsTrigger value="comments" count={0}>
              Comments
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsPanel value="comments">
            <p>No comments yet. Select a frame and press C to leave the first one.</p>
          </TabsPanel>
          <TabsPanel value="history">
            <p>No saved versions yet. Save the board to start its history.</p>
          </TabsPanel>
        </Tabs>
      </DemoCase>

      <DemoCase id="many" title="Eight tabs, the most a list should hold">
        <Tabs defaultValue="Overview">
          <TabsList aria-label="Board panels">
            {many.map((label) => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {many.map((label) => (
            <TabsPanel key={label} value={label}>
              <p>{`${label} of the board.`}</p>
            </TabsPanel>
          ))}
        </Tabs>
      </DemoCase>

      <DemoCase id="too-many" title="Too many tabs: the list scrolls inside, the page does not">
        <Tabs defaultValue="Tokens" emphasis="soft">
          <TabsList aria-label="Workspace panels">
            {tooMany.map((label) => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tooMany.map((label) => (
            <TabsPanel key={label} value={label}>
              <p>{`${label} of the workspace.`}</p>
            </TabsPanel>
          ))}
        </Tabs>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Tabs defaultValue="a">
          <TabsList aria-label="Export formats">
            <TabsTrigger value="a">Design tokens for every platform</TabsTrigger>
            <TabsTrigger value="b">Component code with stories</TabsTrigger>
            <TabsTrigger value="c" count={128}>
              Unresolved review comments
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="a">
            <p>Download the colors, sizes and type of this board as tokens for the web, iOS and Android, kept in sync with every change you save.</p>
          </TabsPanel>
          <TabsPanel value="b">
            <p>Component code.</p>
          </TabsPanel>
          <TabsPanel value="c">
            <p>Review comments.</p>
          </TabsPanel>
        </Tabs>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Tabs defaultValue="a">
          <TabsList aria-label="صيغ التصدير">
            <TabsTrigger value="a">متغيرات التصميم لكل المنصات</TabsTrigger>
            <TabsTrigger value="b">كود المكونات مع الأمثلة</TabsTrigger>
            <TabsTrigger value="c" count={128}>
              تعليقات المراجعة المفتوحة
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="a">
            <p>لو خلصت من تعديل الملف، احفظه وارجع للوحة عشان تشوف كل التغييرات في مكان واحد.</p>
          </TabsPanel>
          <TabsPanel value="b">
            <p>كود المكونات.</p>
          </TabsPanel>
          <TabsPanel value="c">
            <p>تعليقات المراجعة.</p>
          </TabsPanel>
        </Tabs>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled tab: skipped by the arrow keys">
        <p>Only the workspace owner can open Billing.</p>
        <Tabs defaultValue="general">
          <TabsList aria-label="Workspace settings">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing" disabled>
              Billing
            </TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsPanel value="general">
            <p>Workspace name and region.</p>
          </TabsPanel>
          <TabsPanel value="billing">
            <p>Billing is managed by the workspace owner.</p>
          </TabsPanel>
          <TabsPanel value="members">
            <p>People in this workspace.</p>
          </TabsPanel>
        </Tabs>
      </DemoCase>
    </DemoPage>
  );
}
