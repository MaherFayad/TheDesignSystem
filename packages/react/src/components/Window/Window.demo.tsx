import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Window, WindowLayer, type WindowKind } from './index';

/** A layer tall enough for a settings window and a canvas with its margin. */
const layerStyle: CSSProperties = { blockSize: 'calc(var(--ds-space-12xl) * 4)' };

const kindTitle: Record<WindowKind, string> = {
  canvas: 'checkout-flow.board',
  finder: 'Canvases',
  settings: 'Account settings',
};

const kindOpen: Record<WindowKind, string> = {
  canvas: 'Open board',
  finder: 'Open canvases',
  settings: 'Open settings',
};

function Paragraph({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0, maxInlineSize: '60ch', lineHeight: 'var(--ds-font-leading-normal)' }}>{children}</p>;
}

/** One kind in its own layer, opened from a trigger so it grows out of the button. */
function KindDemo({ kind }: { kind: WindowKind }) {
  const [open, setOpen] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DemoRow label={kind}>
        <Button ref={trigger} data-demo-trigger={kind} onClick={() => setOpen(true)} aria-expanded={open}>
          {kindOpen[kind]}
        </Button>
      </DemoRow>
      <WindowLayer style={layerStyle}>
        <Window
          kind={kind}
          title={kindTitle[kind]}
          open={open}
          onOpenChange={setOpen}
          zoomed={zoomed}
          onZoomedChange={setZoomed}
          origin={trigger}
          footer={
            kind === 'settings' ? (
              <>
                <Button onClick={() => setOpen(false)}>Cancel edit</Button>
                <Button tone="accent" emphasis="solid" onClick={() => setOpen(false)}>
                  Save changes
                </Button>
              </>
            ) : undefined
          }
        >
          {kind === 'canvas' ? (
            <div style={{ blockSize: '100%', display: 'grid', placeItems: 'center', color: 'var(--ds-color-text-muted)' }}>
              The board fills the window.
            </div>
          ) : (
            <Paragraph>{sample.en.long}</Paragraph>
          )}
        </Window>
      </WindowLayer>
    </>
  );
}

const many = [
  { id: 'demo-notes', title: 'notes.txt', frame: { x: 24, y: 24, width: 320, height: 200 } },
  { id: 'demo-brief', title: 'brief.md', frame: { x: 140, y: 80, width: 340, height: 220 } },
  { id: 'demo-tokens', title: 'tokens.json', frame: { x: 260, y: 140, width: 320, height: 200 } },
];

/** Three overlapping windows. A click or focus brings one to the front; minimize sends it to the dock row. */
function ManyDemo() {
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});
  return (
    <>
      <WindowLayer style={layerStyle}>
        {many.map((w) => (
          <Window
            key={w.id}
            id={w.id}
            kind="settings"
            title={w.title}
            defaultFrame={w.frame}
            minimized={minimized[w.id] ?? false}
            onMinimizedChange={(m) => setMinimized((s) => ({ ...s, [w.id]: m }))}
          >
            <Paragraph>{sample.en.short}</Paragraph>
          </Window>
        ))}
      </WindowLayer>
      <DemoRow label="Dock">
        {many.map((w) => (
          <Button
            key={w.id}
            size="sm"
            disabled={!minimized[w.id]}
            onClick={() => setMinimized((s) => ({ ...s, [w.id]: false }))}
          >
            {`Restore ${w.title}`}
          </Button>
        ))}
      </DemoRow>
    </>
  );
}

export default function WindowDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: canvas, finder and settings, each grown from its button">
        <KindDemo kind="settings" />
        <KindDemo kind="finder" />
        <KindDemo kind="canvas" />
      </DemoCase>

      <DemoCase id="one" title="One window, with an action in the title bar">
        <WindowLayer style={layerStyle}>
          <Window title="Share board" actions={<IconButton icon="more" label="Open menu" size="sm" />}>
            <Paragraph>Anyone with the link can view this board. Comments stay private to your team.</Paragraph>
          </Window>
        </WindowLayer>
      </DemoCase>

      <DemoCase id="many" title="Many windows: the one with focus comes to the front">
        <ManyDemo />
      </DemoCase>

      <DemoCase id="long-text" title="Long title: it truncates; keyboard focus on the title (the move handle) shows it in full">
        <WindowLayer style={{ ...layerStyle, maxInlineSize: 'calc(var(--ds-space-12xl) * 5)' }}>
          <Window title="Quarterly planning notes for the design system team, with every comment and reference.board">
            <Paragraph>{sample.en.long}</Paragraph>
            <Paragraph>{sample.en.word}</Paragraph>
          </Window>
        </WindowLayer>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <WindowLayer style={layerStyle}>
          <Window
            title="إعدادات الحساب والاشتراك والفواتير وكل أعضاء الفريق"
            closeLabel="إغلاق النافذة"
            minimizeLabel="تصغير النافذة"
            zoomLabel="تكبير النافذة"
            controlsLabel="أزرار النافذة"
            footer={
              <>
                <Button>إلغاء التعديل</Button>
                <Button tone="accent" emphasis="solid">
                  حفظ التغييرات
                </Button>
              </>
            }
          >
            <Paragraph>{sample.ar.long}</Paragraph>
          </Window>
        </WindowLayer>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled controls: a window that cannot move, zoom or minimize">
        <div style={{ maxInlineSize: 'calc(var(--ds-space-12xl) * 4)' }}>
          <Window title="Release notes" defaultOpen>
            <Paragraph>{sample.en.short}</Paragraph>
          </Window>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
