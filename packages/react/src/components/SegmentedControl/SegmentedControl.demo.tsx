import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { SegmentedControl, SegmentedControlItem, type SegmentedControlShape, type SegmentedControlSize } from './index';

const sizes: SegmentedControlSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SegmentedControlShape[] = ['default', 'pill', 'square'];

/** The calendar ranges: day, week, month. */
function RangeItems() {
  return (
    <>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </>
  );
}

/** The board views as icon only items. */
function ViewItems() {
  return (
    <>
      <SegmentedControlItem value="list" icon="list" label="List view" />
      <SegmentedControlItem value="grid" icon="grid" label="Grid view" />
      <SegmentedControlItem value="columns" icon="columns" label="Column view" />
    </>
  );
}

export default function SegmentedControlDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, shapes, icons and Arabic">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <SegmentedControl aria-label="Calendar range" size={size} defaultValue="week">
              <RangeItems />
            </SegmentedControl>
            <SegmentedControl aria-label="Board view" size={size} defaultValue="grid">
              <ViewItems />
            </SegmentedControl>
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <SegmentedControl aria-label="Calendar range" shape={shape} defaultValue="month">
              <RangeItems />
            </SegmentedControl>
            <SegmentedControl aria-label="Board view" shape={shape} defaultValue="list">
              <SegmentedControlItem value="list" start="list">
                List
              </SegmentedControlItem>
              <SegmentedControlItem value="grid" start="grid">
                Grid
              </SegmentedControlItem>
            </SegmentedControl>
          </DemoRow>
        ))}
        <DemoRow label="Full width">
          <div style={{ inlineSize: '100%', maxInlineSize: '28rem' }}>
            <SegmentedControl aria-label="Billing period" fullWidth defaultValue="yearly">
              <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
              <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
            </SegmentedControl>
          </div>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="text">
            <SegmentedControl aria-label="نطاق التقويم" defaultValue="day">
              <SegmentedControlItem value="day">يوم</SegmentedControlItem>
              <SegmentedControlItem value="week">أسبوع</SegmentedControlItem>
              <SegmentedControlItem value="month">شهر</SegmentedControlItem>
            </SegmentedControl>
          </DemoRow>
          <DemoRow label="icons">
            <SegmentedControl aria-label="عرض اللوحة" defaultValue="list">
              <SegmentedControlItem value="list" start="list">
                قائمة
              </SegmentedControlItem>
              <SegmentedControlItem value="grid" start="grid">
                شبكة
              </SegmentedControlItem>
            </SegmentedControl>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="Two options: the smallest control">
        <DemoRow>
          <SegmentedControl aria-label="Billing period" defaultValue="monthly">
            <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
            <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Five options: the most it takes">
        <DemoRow>
          <SegmentedControl aria-label="Chart range" defaultValue="30d">
            <SegmentedControlItem value="24h">24 hours</SegmentedControlItem>
            <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
            <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
            <SegmentedControlItem value="90d">90 days</SegmentedControlItem>
            <SegmentedControlItem value="1y">1 year</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Five options in a narrow column: labels end in an ellipsis">
        <div style={{ maxInlineSize: '18rem' }}>
          <SegmentedControl aria-label="Chart range" fullWidth defaultValue="7d">
            <SegmentedControlItem value="24h">24 hours</SegmentedControlItem>
            <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
            <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
            <SegmentedControlItem value="90d">90 days</SegmentedControlItem>
            <SegmentedControlItem value="1y">1 year</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <SegmentedControl aria-label="Comment scope" defaultValue="all">
            <SegmentedControlItem value="all">Every comment on the board</SegmentedControlItem>
            <SegmentedControlItem value="mine">Only the comments that mention me</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <SegmentedControl aria-label="نطاق التعليقات" defaultValue="mine">
            <SegmentedControlItem value="all">كل التعليقات على اللوحة</SegmentedControlItem>
            <SegmentedControlItem value="mine">التعليقات اللي فيها إشارة لي فقط</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
        <DemoRow>
          <SegmentedControl aria-label="فترة الفوترة" defaultValue="yearly">
            <SegmentedControlItem value="monthly">شهري</SegmentedControlItem>
            <SegmentedControlItem value="yearly">سنوي</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: the whole control, and one item">
        <DemoRow>
          <SegmentedControl aria-label="Calendar range" disabled defaultValue="week">
            <RangeItems />
          </SegmentedControl>
          <SegmentedControl aria-label="Calendar range" defaultValue="day">
            <SegmentedControlItem value="day">Day</SegmentedControlItem>
            <SegmentedControlItem value="week" disabled>
              Week
            </SegmentedControlItem>
            <SegmentedControlItem value="month">Month</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
