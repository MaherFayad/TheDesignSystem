// The ToggleGroup demo: the same cases, ids and copy as
// packages/react/src/components/ToggleGroup/ToggleGroup.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsToggleGroup, DsToggleGroupItem, type ToggleGroupEmphasis, type ToggleGroupShape, type ToggleGroupSize } from './toggle-group';

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

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsToggleGroup, DsToggleGroupItem, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: each emphasis spaced and attached, sizes, shapes and a column">
        @for (emphasis of emphases; track emphasis) {
          <div data-demo="row" [label]="emphasis">
            <div dsToggleGroup type="multiple" aria-label="Text style" [emphasis]="emphasis" [defaultValue]="['bold']">
              <button dsToggleGroupItem value="bold">Bold</button>
              <button dsToggleGroupItem value="italic">Italic</button>
              <button dsToggleGroupItem value="underline">Underline</button>
            </div>
            <div dsToggleGroup type="single" aria-label="Board view" [emphasis]="emphasis" attached defaultValue="grid">
              <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
              <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
              <button dsToggleGroupItem value="columns" icon="columns" label="Column view"></button>
            </div>
          </div>
        }
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <div dsToggleGroup type="single" aria-label="Board view" [size]="size" attached defaultValue="list">
              <button dsToggleGroupItem value="list" start="list">List</button>
              <button dsToggleGroupItem value="grid" start="grid">Grid</button>
            </div>
            <div dsToggleGroup type="multiple" aria-label="Text style" [size]="size" emphasis="ghost" [defaultValue]="['italic']">
              <button dsToggleGroupItem value="bold">Bold</button>
              <button dsToggleGroupItem value="italic">Italic</button>
            </div>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <div dsToggleGroup type="multiple" aria-label="Task filters" [shape]="shape" emphasis="outline" [defaultValue]="['open']">
              <button dsToggleGroupItem value="open">Open</button>
              <button dsToggleGroupItem value="mine">Assigned to me</button>
              <button dsToggleGroupItem value="comments">Has comments</button>
            </div>
            <div dsToggleGroup type="single" aria-label="Board view" [shape]="shape" attached emphasis="outline" defaultValue="columns">
              <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
              <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
              <button dsToggleGroupItem value="columns" icon="columns" label="Column view"></button>
            </div>
          </div>
        }
        <div data-demo="row" label="Vertical">
          <div dsToggleGroup type="single" aria-label="Panel side" orientation="vertical" attached defaultValue="start">
            <button dsToggleGroupItem value="start" start="panel-start">Start panel</button>
            <button dsToggleGroupItem value="end" start="panel-end">End panel</button>
            <button dsToggleGroupItem value="none" start="sidebar">No panel</button>
          </div>
          <div dsToggleGroup type="multiple" aria-label="Show on canvas" orientation="vertical" emphasis="ghost" [defaultValue]="['rulers']">
            <button dsToggleGroupItem value="rulers">Rulers</button>
            <button dsToggleGroupItem value="guides">Guides</button>
            <button dsToggleGroupItem value="grid">Pixel grid</button>
          </div>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" label="spaced">
            <div dsToggleGroup type="multiple" aria-label="فلاتر المهام" emphasis="outline" [defaultValue]="['open', 'mine']">
              <button dsToggleGroupItem value="open">مفتوحة</button>
              <button dsToggleGroupItem value="mine">مسندة لي</button>
              <button dsToggleGroupItem value="comments">فيها تعليقات</button>
            </div>
          </div>
          <div data-demo="row" label="attached">
            <div dsToggleGroup type="single" aria-label="عرض اللوحة" attached defaultValue="list">
              <button dsToggleGroupItem value="list" start="list">قائمة</button>
              <button dsToggleGroupItem value="grid" start="grid">شبكة</button>
              <button dsToggleGroupItem value="columns" start="columns">أعمدة</button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Nothing on: a single group with no value">
        <div data-demo="row">
          <div dsToggleGroup type="single" aria-label="Board view" attached>
            <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
            <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
            <button dsToggleGroupItem value="columns" icon="columns" label="Column view"></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One item on">
        <div data-demo="row">
          <div dsToggleGroup type="single" aria-label="Board view" attached defaultValue="list">
            <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
            <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
            <button dsToggleGroupItem value="columns" icon="columns" label="Column view"></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Several filters on">
        <div data-demo="row">
          <div dsToggleGroup type="multiple" aria-label="Task filters" emphasis="outline" shape="pill" [defaultValue]="['Open', 'Assigned to me', 'Due this week']">
            @for (label of filters.slice(0, 5); track label) {
              <button dsToggleGroupItem [value]="label">{{ label }}</button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many filters, the row wraps">
        <div data-demo="row">
          <div dsToggleGroup type="multiple" aria-label="Task filters" emphasis="outline" shape="pill" [defaultValue]="['Open', 'Blocked', 'Starred']">
            @for (label of filters; track label) {
              <button dsToggleGroupItem [value]="label">{{ label }}</button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <div dsToggleGroup type="single" aria-label="Comment scope" attached defaultValue="all">
            <button dsToggleGroupItem value="all">Every comment and every reference on the board</button>
            <button dsToggleGroupItem value="mine">Only the comments that mention me</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row">
            <div dsToggleGroup type="single" aria-label="نطاق التعليقات" attached defaultValue="all">
              <button dsToggleGroupItem value="all">كل التعليقات والمراجع على اللوحة</button>
              <button dsToggleGroupItem value="mine">التعليقات اللي فيها إشارة لي فقط</button>
            </div>
          </div>
          <div data-demo="row">
            <div dsToggleGroup type="multiple" aria-label="فلاتر المهام" emphasis="outline" shape="pill" [defaultValue]="[filtersAr[0] ?? '']">
              @for (label of filtersAr; track label) {
                <button dsToggleGroupItem [value]="label">{{ label }}</button>
              }
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled: the whole group, and one item">
        <div data-demo="row">
          <div dsToggleGroup type="single" aria-label="Board view" attached disabled defaultValue="grid">
            <button dsToggleGroupItem value="list" icon="list" label="List view"></button>
            <button dsToggleGroupItem value="grid" icon="grid" label="Grid view"></button>
            <button dsToggleGroupItem value="columns" icon="columns" label="Column view"></button>
          </div>
          <div dsToggleGroup type="multiple" aria-label="Text style" [defaultValue]="['bold']">
            <button dsToggleGroupItem value="bold">Bold</button>
            <button dsToggleGroupItem value="italic" disabled>Italic</button>
            <button dsToggleGroupItem value="underline">Underline</button>
          </div>
        </div>
      </section>
  `,
})
export default class ToggleGroupDemo {
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly filters = filters;
  protected readonly filtersAr = filtersAr;
}
