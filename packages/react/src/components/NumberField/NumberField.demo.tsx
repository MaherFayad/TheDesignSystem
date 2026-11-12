import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { NumberField, type NumberFieldShape, type NumberFieldSize } from './index';

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

/** NumberField on its own and inside a Field, in every content case. */
export default function NumberFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, shapes, units and formats">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="10rem">
            {sizes.map((size) => (
              // English copy names its steppers in English too, in an Arabic page (the stepper word follows locale).
              <NumberField key={size} size={size} shape={shape} locale="en" aria-label={`Quantity, ${size}, ${shape}`} defaultValue={4} min={0} />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="12rem">
          <NumberField aria-label="Width" defaultValue={320} end="px" min={0} />
          <NumberField aria-label="Price" defaultValue={1299.5} formatOptions={{ style: 'currency', currency: 'SAR' }} step={0.5} />
          <NumberField aria-label="Discount" defaultValue={0.15} formatOptions={{ style: 'percent' }} min={0} max={1} />
          <NumberField aria-label="Weight" defaultValue={2.5} formatOptions={{ style: 'unit', unit: 'kilogram' }} step={0.1} />
          <NumberField aria-label="Guests" defaultValue={2} start="user" min={1} max={8} steppers={false} />
        </DemoGrid>
        <Theme lang="ar">
          <DemoGrid min="12rem">
            <NumberField aria-label="الكمية" defaultValue={4} min={0} />
            <NumberField aria-label="السعر" defaultValue={1299.5} formatOptions={{ style: 'currency', currency: 'SAR' }} />
            <NumberField aria-label="الخصم" defaultValue={0.15} formatOptions={{ style: 'percent' }} shape="pill" />
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, placeholder only">
        <Field label="Team size">
          <NumberField placeholder="For example, 12" min={1} />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One field with bounds">
        <Field label="Seats" description="Between 1 and 50. PageUp and PageDown move by 10.">
          <NumberField defaultValue={10} min={1} max={50} />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="A short form">
        <DemoGrid min="12rem">
          <Field label="Width" required>
            <NumberField defaultValue={1440} end="px" min={0} />
          </Field>
          <Field label="Height" required>
            <NumberField defaultValue={900} end="px" min={0} />
          </Field>
          <Field label="Opacity">
            <NumberField defaultValue={0.8} formatOptions={{ style: 'percent' }} min={0} max={1} step={0.01} />
          </Field>
          <Field label="Rotation">
            <NumberField defaultValue={0} end="deg" min={-360} max={360} />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="A long order in a narrow container">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-s)' }}>
          {lineItems.map(([label, count]) => (
            <Field key={label} label={label} orientation="horizontal">
              <NumberField defaultValue={count} min={0} size="sm" />
            </Field>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="A long value and a long label">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Field label="Total budget for the spring launch campaign across every region and channel">
            <NumberField defaultValue={987654321012.75} formatOptions={{ style: 'currency', currency: 'SAR' }} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic, long label and value" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          <Field label="الميزانية الكاملة لحملة الإطلاق في كل المناطق والقنوات" description="الأرقام تنكتب بالأرقام الغربية، والعربية مقبولة بالكتابة.">
            <NumberField defaultValue={987654321012.75} formatOptions={{ style: 'currency', currency: 'SAR' }} />
          </Field>
          <Field label="عدد المقاعد">
            <NumberField defaultValue={12} min={1} max={50} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid">
        <Field label="Seats" error="Enter a number from 1 to 50.">
          <NumberField defaultValue={0} min={0} max={50} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Seats" disabled description="Seats are set by your plan.">
          <NumberField defaultValue={10} />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="Seats" readOnly description="Ask an admin to change it.">
          <NumberField defaultValue={10} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
