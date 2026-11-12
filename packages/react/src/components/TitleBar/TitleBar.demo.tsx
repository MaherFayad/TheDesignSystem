import { DemoCase, DemoPage } from '../../demo';
import { IconButton } from '../IconButton';
import { WindowControls } from '../WindowControls';
import { TitleBar } from './index';

const lights = <WindowControls onClose={() => undefined} onMinimize={() => undefined} onZoom={() => undefined} />;

export default function TitleBarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: with lights, with a close button, inactive">
        <TitleBar title="brief.md" controls={lights} />
        <TitleBar title="Layers" actions={<IconButton icon="close" label="Close panel" size="sm" />} />
        <TitleBar title="tokens.json" active={false} controls={<WindowControls active={false} onClose={() => undefined} />} />
      </DemoCase>

      <DemoCase id="one" title="Title only">
        <TitleBar title="Release notes" />
      </DemoCase>

      <DemoCase id="many" title="Many actions">
        <TitleBar
          title="Canvases"
          controls={lights}
          actions={
            <>
              <IconButton icon="search" label="Search canvases" size="sm" />
              <IconButton icon="plus" label="Add canvas" size="sm" />
              <IconButton icon="more" label="Open menu" size="sm" />
            </>
          }
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long title: one line with an ellipsis">
        <div style={{ maxInlineSize: 'calc(var(--ds-space-12xl) * 3)' }}>
          <TitleBar
            title="Quarterly planning notes for the design system team, with every comment.board"
            controls={lights}
            actions={<IconButton icon="more" label="Open menu" size="sm" />}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text: the lights stay at the left, the title in the middle" lang="ar">
        <TitleBar
          title="إعدادات الحساب والاشتراك والفواتير وكل أعضاء الفريق"
          controls={
            <WindowControls
              label="أزرار النافذة"
              closeLabel="إغلاق النافذة"
              minimizeLabel="تصغير النافذة"
              zoomLabel="تكبير النافذة"
              onClose={() => undefined}
              onMinimize={() => undefined}
              onZoom={() => undefined}
            />
          }
        />
        <TitleBar title="الطبقات" actions={<IconButton icon="close" label="إغلاق اللوحة" size="sm" />} />
      </DemoCase>

      <DemoCase id="disabled" title="Lights with no handlers">
        <TitleBar title="Picture of a window" controls={<WindowControls />} />
      </DemoCase>
    </DemoPage>
  );
}
