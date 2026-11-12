import type { CSSProperties } from 'react';
import { DemoCase, DemoPage } from '../../demo';
import { Theme } from '../../theme';
import { TableOfContents, type TocHeading } from './index';

/** An article beside its contents list. The list sticks while the article scrolls past. On a narrow screen the list wraps below. */
const layout: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ds-space-4xl)',
  alignItems: 'flex-start',
};

const article: CSSProperties = { display: 'grid', gap: 'var(--ds-space-m)', maxInlineSize: '60ch', flex: '999 1 30ch', minInlineSize: 0 };
const side: CSSProperties = { flex: '1 1 var(--ds-menu-width-min)', minInlineSize: 0 };
const heading: CSSProperties = { margin: 0, scrollMarginBlockStart: 'var(--ds-space-l)' };

interface Section {
  id: string;
  label: string;
  level: 2 | 3;
  body: string;
}

const en: Section[] = [
  { id: 'toc-start', label: 'Get started', level: 2, body: 'Create a board, add references and invite your team. Each board keeps its own history.' },
  { id: 'toc-boards', label: 'Boards', level: 2, body: 'A board holds frames, notes and references. Drag items to arrange them, or use the arrow keys.' },
  { id: 'toc-frames', label: 'Frames', level: 3, body: 'Frames group items and export as one image. Name a frame to find it in search.' },
  { id: 'toc-notes', label: 'Notes', level: 3, body: 'Notes hold plain text and links. Mention a person to send them a notification.' },
  { id: 'toc-sharing', label: 'Sharing', level: 2, body: 'Share a link with view or edit access. People outside your organization see the board as guests.' },
  { id: 'toc-export', label: 'Export', level: 2, body: 'Export a board as images, a PDF or a kit of tokens and components.' },
];

const ar: Section[] = [
  { id: 'toc-ar-start', label: 'البداية', level: 2, body: 'ابدأ بلوحة جديدة، ضيف فيها المراجع وشاركها مع فريقك. كل لوحة تحفظ سجلها.' },
  { id: 'toc-ar-boards', label: 'اللوحات', level: 2, body: 'اللوحة فيها إطارات وملاحظات ومراجع. اسحب العناصر عشان ترتبها، أو استخدم الأسهم.' },
  { id: 'toc-ar-frames', label: 'الإطارات', level: 3, body: 'الإطار يجمع العناصر، وتقدر تصدره كصورة وحدة.' },
  { id: 'toc-ar-sharing', label: 'المشاركة', level: 2, body: 'شارك الرابط، وحدد إذا يقدرون يشوفون بس أو يعدلون.' },
  { id: 'toc-ar-export', label: 'التصدير', level: 2, body: 'صدر اللوحة كصور أو كملف PDF.' },
];

const toItems = (sections: Section[]): TocHeading[] => sections.map(({ id, label, level }) => ({ id, label, level }));

function Article({ sections }: { sections: Section[] }) {
  return (
    <div style={article}>
      {sections.map((s) => {
        const H = s.level === 2 ? 'h3' : 'h4';
        return (
          <section key={s.id} style={{ display: 'grid', gap: 'var(--ds-space-s)' }}>
            <H id={s.id} style={heading}>
              {s.label}
            </H>
            <p>{s.body}</p>
            <p>{s.body}</p>
          </section>
        );
      })}
    </div>
  );
}

const flat = (labels: string[], prefix: string): TocHeading[] => labels.map((label, i) => ({ id: `${prefix}-${i}`, label, level: 1 }));

const many: TocHeading[] = [
  { id: 'many-0', label: 'Install', level: 1 },
  { id: 'many-1', label: 'With npm', level: 2 },
  { id: 'many-2', label: 'With a script tag', level: 2 },
  { id: 'many-3', label: 'Theming', level: 1 },
  { id: 'many-4', label: 'Styles', level: 2 },
  { id: 'many-5', label: 'Dark and light', level: 2 },
  { id: 'many-6', label: 'Density', level: 3 },
  { id: 'many-7', label: 'Right to left', level: 1 },
];

const tooMany = flat(
  Array.from({ length: 40 }, (_, i) => `Release notes for version ${i + 1}.0`),
  'too-many',
);

export default function TableOfContentsDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: scroll the article, the list marks the section in view">
        <div style={layout}>
          <Article sections={en} />
          <TableOfContents items={toItems(en)} sticky style={side} />
        </div>
        <div style={layout}>
          <p>Size sm</p>
          <TableOfContents size="sm" items={toItems(en)} style={side} />
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <div style={layout}>
            <Article sections={ar} />
            <TableOfContents items={toItems(ar)} sticky style={side} />
          </div>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: no headings, nothing renders">
        <p>This page has no headings, so there is no contents list.</p>
        <TableOfContents items={[]} />
      </DemoCase>

      <DemoCase id="one" title="One heading">
        <TableOfContents items={[{ id: 'one-0', label: 'Overview', level: 1 }]} active="one-0" />
      </DemoCase>

      <DemoCase id="many" title="Many headings, three levels">
        <TableOfContents items={many} active="many-5" />
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the sticky list scrolls inside">
        <div style={{ blockSize: 'calc(8 * var(--ds-size-control-lg))', display: 'grid' }}>
          <TableOfContents items={tooMany} sticky active="too-many-3" />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
          <TableOfContents
            active="long-1"
            items={[
              { id: 'long-0', label: 'Overview', level: 1 },
              { id: 'long-1', label: 'How the export kit maps tokens and components to every framework you ship', level: 1 },
              { id: 'long-2', label: 'Supercalifragilisticexpialidocious', level: 2 },
            ]}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
          <TableOfContents
            active="long-ar-1"
            items={[
              { id: 'long-ar-0', label: 'نظرة عامة', level: 1 },
              { id: 'long-ar-1', label: 'طريقة ربط الرموز والمكونات في حزمة التصدير مع كل إطار عمل تستخدمه', level: 1 },
              { id: 'long-ar-2', label: 'إعدادات الألوان والخطوط', level: 2 },
            ]}
          />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
