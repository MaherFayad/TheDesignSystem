// The NumberField demo: the same cases, ids and copy as
// packages/react/src/components/NumberField/NumberField.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsNumberField, type NumberFieldShape, type NumberFieldSize } from './number-field';

const sizes: NumberFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: NumberFieldShape[] = ['default', 'pill'];

const lineItems: [string, number][] = [
  ['Desk chairs', 12],
  ['Standing desks', 8],
  ['Monitors', 24],
  ['Keyboards', 30],
  ['Headsets', 18],
  ['Webcams', 10],
  ['Docking stations', 16],
  ['Whiteboards', 4],
  ['Lamps', 20],
  ['Plants', 6],
  ['Coat racks', 3],
  ['Lockers', 40],
];

const sar: Intl.NumberFormatOptions = { style: 'currency', currency: 'SAR' };
const percent: Intl.NumberFormatOptions = { style: 'percent' };
const kilogram: Intl.NumberFormatOptions = { style: 'unit', unit: 'kilogram' };

/** NumberField on its own and inside a Field, in every content case. */
@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsField, DsNumberField, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, shapes, units and formats">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(10rem, 100%), 1fr));">
          @for (size of sizes; track size) {
            <div dsNumberField [size]="size" [shape]="shape" [aria-label]="'Quantity, ' + size + ', ' + shape" [value]="4" [min]="0"></div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr));">
        <div dsNumberField aria-label="Width" [value]="320" end="px" [min]="0"></div>
        <div dsNumberField aria-label="Price" [value]="1299.5" [formatOptions]="sar" [step]="0.5"></div>
        <div dsNumberField aria-label="Discount" [value]="0.15" [formatOptions]="percent" [min]="0" [max]="1"></div>
        <div dsNumberField aria-label="Weight" [value]="2.5" [formatOptions]="kilogram" [step]="0.1"></div>
        <div dsNumberField aria-label="Guests" [value]="2" start="user" [min]="1" [max]="8" [steppers]="false"></div>
      </div>
      <div dsTheme lang="ar">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr));">
          <div dsNumberField aria-label="الكمية" [value]="4" [min]="0"></div>
          <div dsNumberField aria-label="السعر" [value]="1299.5" [formatOptions]="sar"></div>
          <div dsNumberField aria-label="الخصم" [value]="0.15" [formatOptions]="percent" shape="pill"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, placeholder only">
      <div dsField label="Team size">
        <div dsNumberField placeholder="For example, 12" [min]="1"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field with bounds">
      <div dsField label="Seats" description="Between 1 and 50. PageUp and PageDown move by 10.">
        <div dsNumberField [value]="10" [min]="1" [max]="50"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A short form">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr));">
        <div dsField label="Width" required>
          <div dsNumberField [value]="1440" end="px" [min]="0"></div>
        </div>
        <div dsField label="Height" required>
          <div dsNumberField [value]="900" end="px" [min]="0"></div>
        </div>
        <div dsField label="Opacity">
          <div dsNumberField [value]="0.8" [formatOptions]="percent" [min]="0" [max]="1" [step]="0.01"></div>
        </div>
        <div dsField label="Rotation">
          <div dsNumberField [value]="0" end="deg" [min]="-360" [max]="360"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long order in a narrow container">
      <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-s);">
        @for (item of lineItems; track item[0]) {
          <div dsField [label]="item[0]" orientation="horizontal">
            <div dsNumberField [value]="item[1]" [min]="0" size="sm"></div>
          </div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="A long value and a long label">
      <div style="max-inline-size: var(--ds-dialog-width-sm);">
        <div dsField label="Total budget for the spring launch campaign across every region and channel">
          <div dsNumberField [value]="987654321012.75" [formatOptions]="sar"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Arabic, long label and value">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
          <div dsField label="الميزانية الكاملة لحملة الإطلاق في كل المناطق والقنوات" description="الأرقام تنكتب بالأرقام الغربية، والعربية مقبولة بالكتابة.">
            <div dsNumberField [value]="987654321012.75" [formatOptions]="sar"></div>
          </div>
          <div dsField label="عدد المقاعد">
            <div dsNumberField [value]="12" [min]="1" [max]="50"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid">
      <div dsField label="Seats" error="Enter a number from 1 to 50.">
        <div dsNumberField [value]="0" [min]="0" [max]="50"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Seats" disabled description="Seats are set by your plan.">
        <div dsNumberField [value]="10"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="Seats" readOnly description="Ask an admin to change it.">
        <div dsNumberField [value]="10"></div>
      </div>
    </section>
  `,
})
export default class NumberFieldDemo {
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly lineItems = lineItems;
  protected readonly sar = sar;
  protected readonly percent = percent;
  protected readonly kilogram = kilogram;
}
