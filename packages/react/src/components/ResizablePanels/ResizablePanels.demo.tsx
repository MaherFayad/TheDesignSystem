import { useState, type CSSProperties, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { ResizableHandle, ResizablePanel, ResizablePanels } from './index';

const frame = (blockSize = '14rem'): CSSProperties => ({
  blockSize,
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  borderRadius: 'var(--ds-radius-card)',
  overflow: 'hidden',
});

function Pane({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={{ padding: 'var(--ds-space-l)', blockSize: '100%', boxSizing: 'border-box' }}>
      <strong style={{ display: 'block', marginBlockEnd: 'var(--ds-space-xs)' }}>{title}</strong>
      {children}
    </div>
  );
}

function EditorLayout({ ar = false }: { ar?: boolean }) {
  const t = ar
    ? { layers: 'الطبقات', canvas: 'اللوحة', inspector: 'الخصائص', layersHandle: 'تغيير حجم الطبقات', inspectorHandle: 'تغيير حجم الخصائص', hint: 'اسحب الفاصل أو استخدم الأسهم' }
    : { layers: 'Layers', canvas: 'Canvas', inspector: 'Inspector', layersHandle: 'Resize layers', inspectorHandle: 'Resize inspector', hint: 'Drag a divider or use the arrow keys.' };
  return (
    <ResizablePanels style={frame()}>
      <ResizablePanel defaultSize={22} min={15} max={35} collapsible>
        <Pane title={t.layers} />
      </ResizablePanel>
      <ResizableHandle label={t.layersHandle} />
      <ResizablePanel min={30}>
        <Pane title={t.canvas}>{t.hint}</Pane>
      </ResizablePanel>
      <ResizableHandle label={t.inspectorHandle} />
      <ResizablePanel defaultSize={25} min={18} max={40} collapsible collapsedSize={6}>
        <Pane title={t.inspector} />
      </ResizablePanel>
    </ResizablePanels>
  );
}

/** Shows the layout an app would save from onLayout. */
function SavedLayout() {
  const [saved, setSaved] = useState<number[]>([40, 60]);
  return (
    <>
      <ResizablePanels orientation="vertical" defaultSizes={saved} onLayout={setSaved} style={frame('16rem')}>
        <ResizablePanel min={20}>
          <Pane title="Preview" />
        </ResizablePanel>
        <ResizableHandle label="Resize preview" />
        <ResizablePanel min={20} collapsible>
          <Pane title="Console" />
        </ResizablePanel>
      </ResizablePanels>
      <p data-demo="label">{`Saved layout: ${saved.map((s) => Math.round(s)).join(' and ')} percent`}</p>
    </>
  );
}

/** Starts with the layers collapsed and the inspector as a rail. Enter on a handle opens them. */
function CollapsedLayout() {
  return (
    <ResizablePanels defaultSizes={[0, 94, 6]} style={frame('8rem')}>
      <ResizablePanel min={15} max={35} collapsible>
        <Pane title="Layers" />
      </ResizablePanel>
      <ResizableHandle label="Resize layers" />
      <ResizablePanel min={30}>
        <Pane title="Canvas">Layers collapsed, inspector as a rail. Press Enter on a divider to open a panel.</Pane>
      </ResizablePanel>
      <ResizableHandle label="Resize inspector" />
      <ResizablePanel min={18} max={40} collapsible collapsedSize={6}>
        <Pane title="Inspector" />
      </ResizablePanel>
    </ResizablePanels>
  );
}

const many = ['Files', 'Outline', 'Editor', 'Preview'];
const tooMany = ['1', '2', '3', '4', '5', '6', '7', '8'];

/** ResizablePanels in every content case. */
export default function ResizablePanelsDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Horizontal and vertical">
        <EditorLayout />
        <SavedLayout />
        <CollapsedLayout />
        <Theme lang="ar">
          <DemoRow label="العربية">
            <div style={{ inlineSize: '100%' }}>
              <EditorLayout ar />
            </div>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty panels">
        <ResizablePanels style={frame('8rem')}>
          <ResizablePanel>
            <Pane title="Layers">No layers yet. Add a frame to start.</Pane>
          </ResizablePanel>
          <ResizableHandle label="Resize layers" />
          <ResizablePanel>
            <Pane title="Canvas">The canvas is empty.</Pane>
          </ResizablePanel>
        </ResizablePanels>
      </DemoCase>

      <DemoCase id="one" title="Two panels, one handle">
        <ResizablePanels style={frame('8rem')}>
          <ResizablePanel defaultSize={30} min={20}>
            <Pane title="Sidebar" />
          </ResizablePanel>
          <ResizableHandle label="Resize sidebar" />
          <ResizablePanel>
            <Pane title="Content" />
          </ResizablePanel>
        </ResizablePanels>
      </DemoCase>

      <DemoCase id="many" title="Four panels">
        <ResizablePanels style={frame('10rem')}>
          {many.map((name, i) => [
            i > 0 && <ResizableHandle key={`h-${name}`} label={`Resize ${many[i - 1]?.toLowerCase()}`} />,
            <ResizablePanel key={name} min={10}>
              <Pane title={name} />
            </ResizablePanel>,
          ])}
        </ResizablePanels>
      </DemoCase>

      <DemoCase id="too-many" title="Eight panels in a narrow row">
        <div style={{ maxInlineSize: '24rem' }}>
          <ResizablePanels style={frame('8rem')}>
            {tooMany.map((name, i) => [
              i > 0 && <ResizableHandle key={`h-${name}`} label={`Resize panel ${i}`} />,
              <ResizablePanel key={name} min={5}>
                <Pane title={name} />
              </ResizablePanel>,
            ])}
          </ResizablePanels>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <ResizablePanels style={frame('12rem')}>
          <ResizablePanel defaultSize={35} min={20}>
            <Pane title="Notes">
              <span style={{ overflowWrap: 'anywhere' }}>
                {sample.en.long} {sample.en.word}
              </span>
            </Pane>
          </ResizablePanel>
          <ResizableHandle label="Resize notes" />
          <ResizablePanel>
            <Pane title="Board">{sample.en.long}</Pane>
          </ResizablePanel>
        </ResizablePanels>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <ResizablePanels style={frame('12rem')}>
          <ResizablePanel defaultSize={35} min={20}>
            <Pane title="الملاحظات">{sample.ar.long}</Pane>
          </ResizablePanel>
          <ResizableHandle label="تغيير حجم الملاحظات" />
          <ResizablePanel>
            <Pane title="اللوحة">{sample.ar.long}</Pane>
          </ResizablePanel>
        </ResizablePanels>
      </DemoCase>
    </DemoPage>
  );
}
