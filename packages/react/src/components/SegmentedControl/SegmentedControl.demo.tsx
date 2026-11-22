// SegmentedControl demo. The copy follows the page language: with lang=ar
// every case reads Arabic.
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
import { SegmentedControl, SegmentedControlItem, type SegmentedControlShape, type SegmentedControlSize } from './index';

const sizes: SegmentedControlSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SegmentedControlShape[] = ['default', 'pill', 'square'];

const words = {
  en: {
    day: 'Day',
    week: 'Week',
    month: 'Month',
    listView: 'List view',
    gridView: 'Grid view',
    columnView: 'Column view',
    range: 'Calendar range',
    view: 'Board view',
    list: 'List',
    grid: 'Grid',
    billing: 'Billing period',
    monthly: 'Monthly',
    yearly: 'Yearly',
    chart: 'Chart range',
    spans: ['24 hours', '7 days', '30 days', '90 days', '1 year'],
    scope: 'Comment scope',
    all: 'Every comment on the board',
    mine: 'Only the comments that mention me',
  },
  ar: {
    day: 'يوم',
    week: 'أسبوع',
    month: 'شهر',
    listView: 'عرض القائمة',
    gridView: 'عرض الشبكة',
    columnView: 'عرض الأعمدة',
    range: 'نطاق التقويم',
    view: 'عرض اللوحة',
    list: 'قائمة',
    grid: 'شبكة',
    billing: 'فترة الفوترة',
    monthly: 'شهري',
    yearly: 'سنوي',
    chart: 'نطاق الرسم',
    spans: ['24 ساعة', '7 أيام', '30 يوم', '90 يوم', 'سنة'],
    scope: 'نطاق التعليقات',
    all: 'كل التعليقات على اللوحة',
    mine: 'التعليقات اللي فيها إشارة لي بس',
  },
};

type Words = (typeof words)['en'];

const spanValues = ['24h', '7d', '30d', '90d', '1y'];

/** The calendar ranges: day, week, month. */
function RangeItems({ w }: { w: Words }) {
  return (
    <>
      <SegmentedControlItem value="day">{w.day}</SegmentedControlItem>
      <SegmentedControlItem value="week">{w.week}</SegmentedControlItem>
      <SegmentedControlItem value="month">{w.month}</SegmentedControlItem>
    </>
  );
}

/** The board views as icon only items. */
function ViewItems({ w }: { w: Words }) {
  return (
    <>
      <SegmentedControlItem value="list" icon="list" label={w.listView} />
      <SegmentedControlItem value="grid" icon="grid" label={w.gridView} />
      <SegmentedControlItem value="columns" icon="columns" label={w.columnView} />
    </>
  );
}

/** Five chart ranges. */
function SpanItems({ w }: { w: Words }) {
  return (
    <>
      {spanValues.map((value, i) => (
        <SegmentedControlItem key={value} value={value}>
          {w.spans[i]}
        </SegmentedControlItem>
      ))}
    </>
  );
}

export default function SegmentedControlDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, shapes, icons and Arabic">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <SegmentedControl aria-label={w.range} size={size} defaultValue="week">
              <RangeItems w={w} />
            </SegmentedControl>
            <SegmentedControl aria-label={w.view} size={size} defaultValue="grid">
              <ViewItems w={w} />
            </SegmentedControl>
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <SegmentedControl aria-label={w.range} shape={shape} defaultValue="month">
              <RangeItems w={w} />
            </SegmentedControl>
            <SegmentedControl aria-label={w.view} shape={shape} defaultValue="list">
              <SegmentedControlItem value="list" start="list">
                {w.list}
              </SegmentedControlItem>
              <SegmentedControlItem value="grid" start="grid">
                {w.grid}
              </SegmentedControlItem>
            </SegmentedControl>
          </DemoRow>
        ))}
        <DemoRow label="Full width">
          <div style={{ inlineSize: '100%', maxInlineSize: '28rem' }}>
            <SegmentedControl aria-label={w.billing} fullWidth defaultValue="yearly">
              <SegmentedControlItem value="monthly">{w.monthly}</SegmentedControlItem>
              <SegmentedControlItem value="yearly">{w.yearly}</SegmentedControlItem>
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
          <SegmentedControl aria-label={w.billing} defaultValue="monthly">
            <SegmentedControlItem value="monthly">{w.monthly}</SegmentedControlItem>
            <SegmentedControlItem value="yearly">{w.yearly}</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Five options: the most it takes">
        <DemoRow>
          <SegmentedControl aria-label={w.chart} defaultValue="30d">
            <SpanItems w={w} />
          </SegmentedControl>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Five options in a narrow column: labels wrap">
        <div style={{ maxInlineSize: '18rem' }}>
          <SegmentedControl aria-label={w.chart} fullWidth defaultValue="7d">
            <SpanItems w={w} />
          </SegmentedControl>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <SegmentedControl aria-label={w.scope} defaultValue="all">
            <SegmentedControlItem value="all">{w.all}</SegmentedControlItem>
            <SegmentedControlItem value="mine">{w.mine}</SegmentedControlItem>
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
          <SegmentedControl aria-label={w.range} disabled defaultValue="week">
            <RangeItems w={w} />
          </SegmentedControl>
          <SegmentedControl aria-label={w.range} defaultValue="day">
            <SegmentedControlItem value="day">{w.day}</SegmentedControlItem>
            <SegmentedControlItem value="week" disabled>
              {w.week}
            </SegmentedControlItem>
            <SegmentedControlItem value="month">{w.month}</SegmentedControlItem>
          </SegmentedControl>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
