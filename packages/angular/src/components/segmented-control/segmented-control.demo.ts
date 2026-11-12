// The SegmentedControl demo: the same cases, ids and copy as
// packages/react/src/components/SegmentedControl/SegmentedControl.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsSegmentedControl, DsSegmentedControlItem, type SegmentedControlShape, type SegmentedControlSize } from './segmented-control';

const sizes: SegmentedControlSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SegmentedControlShape[] = ['default', 'pill', 'square'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsSegmentedControl, DsSegmentedControlItem, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: sizes, shapes, icons and Arabic">
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <div dsSegmentedControl aria-label="Calendar range" [size]="size" defaultValue="week">
              <button dsSegmentedControlItem value="day">Day</button>
              <button dsSegmentedControlItem value="week">Week</button>
              <button dsSegmentedControlItem value="month">Month</button>
            </div>
            <div dsSegmentedControl aria-label="Board view" [size]="size" defaultValue="grid">
              <button dsSegmentedControlItem value="list" icon="list" label="List view"></button>
              <button dsSegmentedControlItem value="grid" icon="grid" label="Grid view"></button>
              <button dsSegmentedControlItem value="columns" icon="columns" label="Column view"></button>
            </div>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <div dsSegmentedControl aria-label="Calendar range" [shape]="shape" defaultValue="month">
              <button dsSegmentedControlItem value="day">Day</button>
              <button dsSegmentedControlItem value="week">Week</button>
              <button dsSegmentedControlItem value="month">Month</button>
            </div>
            <div dsSegmentedControl aria-label="Board view" [shape]="shape" defaultValue="list">
              <button dsSegmentedControlItem value="list" start="list">List</button>
              <button dsSegmentedControlItem value="grid" start="grid">Grid</button>
            </div>
          </div>
        }
        <div data-demo="row" label="Full width">
          <div style="inline-size: 100%; max-inline-size: 28rem;">
            <div dsSegmentedControl aria-label="Billing period" fullWidth defaultValue="yearly">
              <button dsSegmentedControlItem value="monthly">Monthly</button>
              <button dsSegmentedControlItem value="yearly">Yearly</button>
            </div>
          </div>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" label="text">
            <div dsSegmentedControl aria-label="نطاق التقويم" defaultValue="day">
              <button dsSegmentedControlItem value="day">يوم</button>
              <button dsSegmentedControlItem value="week">أسبوع</button>
              <button dsSegmentedControlItem value="month">شهر</button>
            </div>
          </div>
          <div data-demo="row" label="icons">
            <div dsSegmentedControl aria-label="عرض اللوحة" defaultValue="list">
              <button dsSegmentedControlItem value="list" start="list">قائمة</button>
              <button dsSegmentedControlItem value="grid" start="grid">شبكة</button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="Two options: the smallest control">
        <div data-demo="row">
          <div dsSegmentedControl aria-label="Billing period" defaultValue="monthly">
            <button dsSegmentedControlItem value="monthly">Monthly</button>
            <button dsSegmentedControlItem value="yearly">Yearly</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Five options: the most it takes">
        <div data-demo="row">
          <div dsSegmentedControl aria-label="Chart range" defaultValue="30d">
            <button dsSegmentedControlItem value="24h">24 hours</button>
            <button dsSegmentedControlItem value="7d">7 days</button>
            <button dsSegmentedControlItem value="30d">30 days</button>
            <button dsSegmentedControlItem value="90d">90 days</button>
            <button dsSegmentedControlItem value="1y">1 year</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Five options in a narrow column: labels end in an ellipsis">
        <div style="max-inline-size: 18rem;">
          <div dsSegmentedControl aria-label="Chart range" fullWidth defaultValue="7d">
            <button dsSegmentedControlItem value="24h">24 hours</button>
            <button dsSegmentedControlItem value="7d">7 days</button>
            <button dsSegmentedControlItem value="30d">30 days</button>
            <button dsSegmentedControlItem value="90d">90 days</button>
            <button dsSegmentedControlItem value="1y">1 year</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <div dsSegmentedControl aria-label="Comment scope" defaultValue="all">
            <button dsSegmentedControlItem value="all">Every comment on the board</button>
            <button dsSegmentedControlItem value="mine">Only the comments that mention me</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row">
            <div dsSegmentedControl aria-label="نطاق التعليقات" defaultValue="mine">
              <button dsSegmentedControlItem value="all">كل التعليقات على اللوحة</button>
              <button dsSegmentedControlItem value="mine">التعليقات اللي فيها إشارة لي فقط</button>
            </div>
          </div>
          <div data-demo="row">
            <div dsSegmentedControl aria-label="فترة الفوترة" defaultValue="yearly">
              <button dsSegmentedControlItem value="monthly">شهري</button>
              <button dsSegmentedControlItem value="yearly">سنوي</button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled: the whole control, and one item">
        <div data-demo="row">
          <div dsSegmentedControl aria-label="Calendar range" disabled defaultValue="week">
            <button dsSegmentedControlItem value="day">Day</button>
            <button dsSegmentedControlItem value="week">Week</button>
            <button dsSegmentedControlItem value="month">Month</button>
          </div>
          <div dsSegmentedControl aria-label="Calendar range" defaultValue="day">
            <button dsSegmentedControlItem value="day">Day</button>
            <button dsSegmentedControlItem value="week" disabled>Week</button>
            <button dsSegmentedControlItem value="month">Month</button>
          </div>
        </div>
      </section>
  `,
})
export default class SegmentedControlDemo {
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
}
