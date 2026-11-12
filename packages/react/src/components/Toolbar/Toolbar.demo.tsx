import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  type ToolbarEmphasis,
  type ToolbarSize,
} from './index';

const sizes: ToolbarSize[] = ['xs', 'sm', 'md', 'lg'];
const emphases: ToolbarEmphasis[] = ['ghost', 'soft', 'outline'];

/** A canvas toolbar in both languages. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    toolbar: 'Canvas tools',
    view: 'View',
    list: 'Show as list',
    grid: 'Show as grid',
    zoom: 'Zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to screen',
    add: 'Add frame',
    copy: 'Copy link',
    delete: 'Delete frame',
    docs: 'Open the guide',
  },
  ar: {
    toolbar: 'أدوات اللوحة',
    view: 'العرض',
    list: 'عرض كقائمة',
    grid: 'عرض كشبكة',
    zoom: 'التكبير',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    fit: 'ملاءمة الشاشة',
    add: 'إضافة إطار',
    copy: 'نسخ الرابط',
    delete: 'حذف الإطار',
    docs: 'فتح الدليل',
  },
} as const;

function CanvasToolbar({
  lang = 'en',
  size,
  emphasis,
  orientation,
  overflow,
  withText = true,
}: {
  lang?: 'en' | 'ar';
  size?: ToolbarSize;
  emphasis?: ToolbarEmphasis;
  orientation?: 'horizontal' | 'vertical';
  overflow?: 'menu' | 'wrap';
  withText?: boolean;
}) {
  const c = copy[lang];
  return (
    <Toolbar aria-label={c.toolbar} size={size} emphasis={emphasis} orientation={orientation} overflow={overflow}>
      <ToolbarToggleGroup type="single" defaultValue="grid" aria-label={c.view}>
        <ToolbarToggleItem value="list" icon="list" label={c.list} />
        <ToolbarToggleItem value="grid" icon="grid" label={c.grid} />
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label={c.zoom}>
        <ToolbarButton icon="zoom-out" label={c.zoomOut} />
        <ToolbarButton icon="zoom-in" label={c.zoomIn} />
        <ToolbarButton icon="maximize" label={c.fit} />
      </ToolbarGroup>
      <ToolbarSeparator />
      {withText ? <ToolbarButton start="plus">{c.add}</ToolbarButton> : <ToolbarButton icon="plus" label={c.add} />}
      <ToolbarButton icon="link" label={c.copy} />
      <ToolbarButton icon="trash" label={c.delete} tone="danger" />
    </Toolbar>
  );
}

/** A text toolbar: toggles that are on or off on their own. */
function TextToolbar({ narrow = false }: { narrow?: boolean }) {
  return (
    <Toolbar aria-label="Text formatting" moreLabel="More text tools">
      <ToolbarToggleGroup type="multiple" defaultValue={['bold']} aria-label="Text style">
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
        <ToolbarToggleItem value="underline">Underline</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton icon="link" label="Add link" />
      <ToolbarButton icon="image" label="Add image" />
      <ToolbarButton icon="attach" label="Attach file" />
      <ToolbarSeparator />
      <ToolbarButton icon="list" label="Add list" />
      <ToolbarButton icon="tag" label="Add tag" />
      {!narrow && <ToolbarLink href="#guide">Open the guide</ToolbarLink>}
    </Toolbar>
  );
}

export default function ToolbarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, emphasis and orientation">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <CanvasToolbar size={size} />
          </DemoRow>
        ))}
        {emphases.map((emphasis) => (
          <DemoRow key={emphasis} label={`Emphasis ${emphasis}`}>
            <CanvasToolbar emphasis={emphasis} />
          </DemoRow>
        ))}
        <DemoRow label="Vertical">
          <CanvasToolbar orientation="vertical" withText={false} />
        </DemoRow>
        <DemoRow label="Text toggles and a link">
          <TextToolbar />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="ghost">
            <CanvasToolbar lang="ar" />
          </DemoRow>
          <DemoRow label="soft">
            <CanvasToolbar lang="ar" emphasis="soft" size="sm" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One group">
        <Toolbar aria-label="Zoom">
          <ToolbarButton icon="zoom-out" label="Zoom out" />
          <ToolbarButton icon="zoom-in" label="Zoom in" />
        </Toolbar>
      </DemoCase>

      <DemoCase id="many" title="Many tools in groups">
        <TextToolbar />
      </DemoCase>

      <DemoCase id="too-many" title="Too many tools: what does not fit moves into More tools">
        <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.5)' }}>
          <TextToolbar narrow />
        </div>
        <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.5)' }}>
          <CanvasToolbar />
        </div>
        <DemoRow label="Wrap instead">
          <div style={{ maxInlineSize: 'calc(var(--ds-menu-width-min) * 1.5)' }}>
            <CanvasToolbar overflow="wrap" />
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Toolbar aria-label="Review">
          <ToolbarButton start="check">Resolve every open comment on this board</ToolbarButton>
          <ToolbarButton start="send">Send the review to the whole team</ToolbarButton>
          <ToolbarButton icon="settings" label="Open review settings" />
        </Toolbar>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Toolbar aria-label="المراجعة">
          <ToolbarButton start="check">إغلاق كل التعليقات المفتوحة على اللوحة</ToolbarButton>
          <ToolbarButton start="send">إرسال المراجعة للفريق كامل</ToolbarButton>
          <ToolbarButton icon="settings" label="إعدادات المراجعة" />
        </Toolbar>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled items stay reachable by the arrow keys">
        <Toolbar aria-label="Frame actions">
          <ToolbarButton icon="copy" label="Duplicate frame" />
          <ToolbarButton icon="trash" label="Delete frame" disabled />
          <ToolbarToggleGroup type="multiple" aria-label="Frame options">
            <ToolbarToggleItem value="lock" icon="lock" label="Lock frame" disabled />
            <ToolbarToggleItem value="hide" icon="eye-off" label="Hide frame" />
          </ToolbarToggleGroup>
        </Toolbar>
      </DemoCase>
    </DemoPage>
  );
}
