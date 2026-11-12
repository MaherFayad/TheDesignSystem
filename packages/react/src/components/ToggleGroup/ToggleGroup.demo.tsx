import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { ToggleGroup, ToggleGroupItem, type ToggleGroupEmphasis, type ToggleGroupShape, type ToggleGroupSize } from './index';

const emphases: ToggleGroupEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ToggleGroupSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ToggleGroupShape[] = ['default', 'pill', 'square'];

const filters = [
  'Open',
  'Assigned to me',
  'Has comments',
  'Due this week',
  'Blocked',
  'Design',
  'Engineering',
  'Research',
  'High priority',
  'Archived',
  'Shared with me',
  'Starred',
];

const filtersAr = ['مفتوحة', 'مسندة لي', 'فيها تعليقات', 'تنتهي هذا الأسبوع', 'متوقفة'];

/** The board views: list, grid and columns, as icon only items. */
function ViewItems() {
  return (
    <>
      <ToggleGroupItem value="list" icon="list" label="List view" />
      <ToggleGroupItem value="grid" icon="grid" label="Grid view" />
      <ToggleGroupItem value="columns" icon="columns" label="Column view" />
    </>
  );
}

export default function ToggleGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each emphasis spaced and attached, sizes, shapes and a column">
        {emphases.map((emphasis) => (
          <DemoRow key={emphasis} label={emphasis}>
            <ToggleGroup type="multiple" aria-label="Text style" emphasis={emphasis} defaultValue={['bold']}>
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
              <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
              <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" aria-label="Board view" emphasis={emphasis} attached defaultValue="grid">
              <ViewItems />
            </ToggleGroup>
          </DemoRow>
        ))}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <ToggleGroup type="single" aria-label="Board view" size={size} attached defaultValue="list">
              <ToggleGroupItem value="list" start="list">
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" start="grid">
                Grid
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" aria-label="Text style" size={size} emphasis="ghost" defaultValue={['italic']}>
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
              <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
            </ToggleGroup>
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <ToggleGroup type="multiple" aria-label="Task filters" shape={shape} emphasis="outline" defaultValue={['open']}>
              <ToggleGroupItem value="open">Open</ToggleGroupItem>
              <ToggleGroupItem value="mine">Assigned to me</ToggleGroupItem>
              <ToggleGroupItem value="comments">Has comments</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" aria-label="Board view" shape={shape} attached emphasis="outline" defaultValue="columns">
              <ViewItems />
            </ToggleGroup>
          </DemoRow>
        ))}
        <DemoRow label="Vertical">
          <ToggleGroup type="single" aria-label="Panel side" orientation="vertical" attached defaultValue="start">
            <ToggleGroupItem value="start" start="panel-start">
              Start panel
            </ToggleGroupItem>
            <ToggleGroupItem value="end" start="panel-end">
              End panel
            </ToggleGroupItem>
            <ToggleGroupItem value="none" start="sidebar">
              No panel
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="multiple" aria-label="Show on canvas" orientation="vertical" emphasis="ghost" defaultValue={['rulers']}>
            <ToggleGroupItem value="rulers">Rulers</ToggleGroupItem>
            <ToggleGroupItem value="guides">Guides</ToggleGroupItem>
            <ToggleGroupItem value="grid">Pixel grid</ToggleGroupItem>
          </ToggleGroup>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="spaced">
            <ToggleGroup type="multiple" aria-label="فلاتر المهام" emphasis="outline" defaultValue={['open', 'mine']}>
              <ToggleGroupItem value="open">مفتوحة</ToggleGroupItem>
              <ToggleGroupItem value="mine">مسندة لي</ToggleGroupItem>
              <ToggleGroupItem value="comments">فيها تعليقات</ToggleGroupItem>
            </ToggleGroup>
          </DemoRow>
          <DemoRow label="attached">
            <ToggleGroup type="single" aria-label="عرض اللوحة" attached defaultValue="list">
              <ToggleGroupItem value="list" start="list">
                قائمة
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" start="grid">
                شبكة
              </ToggleGroupItem>
              <ToggleGroupItem value="columns" start="columns">
                أعمدة
              </ToggleGroupItem>
            </ToggleGroup>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Nothing on: a single group with no value">
        <DemoRow>
          <ToggleGroup type="single" aria-label="Board view" attached>
            <ViewItems />
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One item on">
        <DemoRow>
          <ToggleGroup type="single" aria-label="Board view" attached defaultValue="list">
            <ViewItems />
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Several filters on">
        <DemoRow>
          <ToggleGroup type="multiple" aria-label="Task filters" emphasis="outline" shape="pill" defaultValue={['open', 'mine', 'week']}>
            {filters.slice(0, 5).map((label, i) => (
              <ToggleGroupItem key={label} value={['open', 'mine', 'comments', 'week', 'blocked'][i] ?? label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many filters, the row wraps">
        <DemoRow>
          <ToggleGroup type="multiple" aria-label="Task filters" emphasis="outline" shape="pill" defaultValue={['Open', 'Blocked', 'Starred']}>
            {filters.map((label) => (
              <ToggleGroupItem key={label} value={label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <ToggleGroup type="single" aria-label="Comment scope" attached defaultValue="all">
            <ToggleGroupItem value="all">Every comment and every reference on the board</ToggleGroupItem>
            <ToggleGroupItem value="mine">Only the comments that mention me</ToggleGroupItem>
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ToggleGroup type="single" aria-label="نطاق التعليقات" attached defaultValue="all">
            <ToggleGroupItem value="all">كل التعليقات والمراجع على اللوحة</ToggleGroupItem>
            <ToggleGroupItem value="mine">التعليقات اللي فيها إشارة لي فقط</ToggleGroupItem>
          </ToggleGroup>
        </DemoRow>
        <DemoRow>
          <ToggleGroup type="multiple" aria-label="فلاتر المهام" emphasis="outline" shape="pill" defaultValue={[filtersAr[0] ?? '']}>
            {filtersAr.map((label) => (
              <ToggleGroupItem key={label} value={label}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: the whole group, and one item">
        <DemoRow>
          <ToggleGroup type="single" aria-label="Board view" attached disabled defaultValue="grid">
            <ViewItems />
          </ToggleGroup>
          <ToggleGroup type="multiple" aria-label="Text style" defaultValue={['bold']}>
            <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
            <ToggleGroupItem value="italic" disabled>
              Italic
            </ToggleGroupItem>
            <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
          </ToggleGroup>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
