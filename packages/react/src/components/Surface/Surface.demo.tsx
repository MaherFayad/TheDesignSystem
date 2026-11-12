import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Surface, type SurfaceLevel } from './index';

const levels: SurfaceLevel[] = ['body', 1, 2, 3, 4, 5];

export default function SurfaceDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: level, border, elevation, radius, padding">
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.5)">
          {levels.map((level) => (
            <Surface key={level} level={level} bordered={level === 'body'}>
              {level === 'body' ? 'Body' : `Surface ${level}`}
            </Surface>
          ))}
        </DemoGrid>
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.5)">
          <Surface level={2} bordered>
            Bordered
          </Surface>
          <Surface level={2} elevation="card">
            Card elevation
          </Surface>
          <Surface level={2} elevation="panel">
            Panel elevation
          </Surface>
          <Surface level={2} bordered elevation="panel">
            Bordered with panel elevation
          </Surface>
        </DemoGrid>
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.5)">
          <Surface level={2} radius="none">
            No radius
          </Surface>
          <Surface level={2} radius="sm">
            Radius sm
          </Surface>
          <Surface level={2} radius="panel">
            Radius panel
          </Surface>
          <Surface level={2} radius="pill" padding="s">
            Radius pill
          </Surface>
        </DemoGrid>
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.5)">
          <Surface level={2} padding="none">
            No padding
          </Surface>
          <Surface level={2} padding="s">
            Padding s
          </Surface>
          <Surface level={2} padding="3xl">
            Padding 3xl
          </Surface>
          <Surface level={2} padding="6xl">
            Padding 6xl
          </Surface>
        </DemoGrid>
        <DemoRow label="Arabic">
          <Surface level={2} lang="ar" dir="rtl" bordered>
            سطح بحد
          </Surface>
          <Surface level={3} lang="ar" dir="rtl" elevation="card">
            سطح مرفوع
          </Surface>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty: the box keeps its padding and edge">
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.5)">
          <Surface level={2} bordered style={{ minBlockSize: 'var(--ds-space-12xl)' }} />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One box with a short line">
        <Surface level={2}>{sample.en.short}</Surface>
      </DemoCase>

      <DemoCase id="many" title="Nested steps: each box one step above its parent">
        <Surface level="body" bordered padding="2xl">
          Body
          <Surface level={1} padding="2xl" style={{ marginBlockStart: 'var(--ds-space-m)' }}>
            Surface 1
            <Surface level={2} padding="2xl" style={{ marginBlockStart: 'var(--ds-space-m)' }}>
              Surface 2
              <Surface level={3} style={{ marginBlockStart: 'var(--ds-space-m)' }}>
                Surface 3
              </Surface>
            </Surface>
          </Surface>
        </Surface>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: a long list of boxes wraps in its grid">
        <DemoGrid min="calc(var(--ds-space-12xl) * 1.2)">
          {sample.en.items.map((item) => (
            <Surface key={item} level={2} padding="l">
              {item}
            </Surface>
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps inside the padding">
        <Surface level={2} as="article">
          <p style={{ margin: 0 }}>{sample.en.long}</p>
          <p style={{ margin: 0, overflowWrap: 'anywhere' }}>{sample.en.word}</p>
        </Surface>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Surface level={2} as="article" bordered>
          <p style={{ margin: 0 }}>{sample.ar.long}</p>
        </Surface>
      </DemoCase>
    </DemoPage>
  );
}
