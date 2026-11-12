import type { CSSProperties } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { ScrubInput, type ScrubInputSize } from './index';

const sizes: ScrubInputSize[] = ['xs', 'sm', 'md'];

/** A Studio inspector panel: two fields a row, the inspector gutter. */
const panel: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--ds-inspector-field-gap)',
  maxInlineSize: 'var(--ds-dialog-width-sm)',
};

const layers: [string, number][] = [
  ['Header', 64],
  ['Hero', 520],
  ['Title', 48],
  ['Subtitle', 24],
  ['Button', 40],
  ['Card grid', 880],
  ['Card', 280],
  ['Footer', 120],
  ['Logo', 32],
  ['Divider', 1],
  ['Badge', 20],
  ['Avatar', 36],
];

/** ScrubInput on its own, in an inspector panel and in a Field, in every content case. */
export default function ScrubInputDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, labels, units and mixed">
        <DemoGrid min="9rem">
          {sizes.map((size) => (
            <ScrubInput key={size} size={size} label="W" aria-label={`Width, ${size}`} defaultValue={320} unit="px" min={0} />
          ))}
        </DemoGrid>
        <DemoGrid min="9rem">
          <ScrubInput label="refresh" aria-label="Rotation" defaultValue={45} unit="deg" min={-360} max={360} />
          <ScrubInput label="eye" aria-label="Opacity" defaultValue={80} unit="%" min={0} max={100} />
          <ScrubInput label="X" aria-label="Position X" defaultValue={-12.5} />
          <ScrubInput label="H" aria-label="Height" mixed unit="px" />
        </DemoGrid>
        <Theme lang="ar">
          <DemoGrid min="9rem">
            <ScrubInput label="ع" aria-label="العرض" defaultValue={320} unit="px" min={0} />
            <ScrubInput label="refresh" aria-label="الدوران" defaultValue={45} unit="deg" />
            <ScrubInput label="ط" aria-label="الطول" mixed mixedLabel="متعدد" unit="px" />
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <div style={panel}>
          <ScrubInput label="W" aria-label="Width" unit="px" placeholder="Auto" min={0} />
        </div>
      </DemoCase>

      <DemoCase id="one" title="One field">
        <div style={panel}>
          <ScrubInput label="W" aria-label="Width" defaultValue={1440} unit="px" min={0} />
        </div>
      </DemoCase>

      <DemoCase id="many" title="An inspector section, one value mixed">
        <div style={panel}>
          <ScrubInput label="X" aria-label="Position X" defaultValue={120} size="sm" />
          <ScrubInput label="Y" aria-label="Position Y" defaultValue={48} size="sm" />
          <ScrubInput label="W" aria-label="Width" defaultValue={320} unit="px" min={0} size="sm" />
          <ScrubInput label="H" aria-label="Height" mixed unit="px" min={0} size="sm" />
          <ScrubInput label="refresh" aria-label="Rotation" defaultValue={0} unit="deg" size="sm" />
          <ScrubInput label="eye" aria-label="Opacity" defaultValue={100} unit="%" min={0} max={100} size="sm" />
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Every layer height in a narrow panel">
        <div style={panel}>
          {layers.map(([name, height]) => (
            <ScrubInput key={name} label="H" aria-label={`${name} height`} defaultValue={height} unit="px" min={0} size="xs" />
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="A long value in a narrow field">
        <div style={{ ...panel, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <ScrubInput label="W" aria-label="Canvas width" defaultValue={123456789.25} unit="px" />
          <ScrubInput label="X" aria-label="Offset X" defaultValue={-98765.43} unit="px" />
          <ScrubInput label="refresh" aria-label="Rotation" defaultValue={359.99} unit="deg" />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic, in a Field with a long label" lang="ar">
        <div style={{ ...panel, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <Field label="المسافة بين العناصر داخل المجموعة" description="اسحب الحرف لتغيير القيمة، أو اكتب رقم أو عملية مثل 12*2.">
            <ScrubInput label="م" defaultValue={24} unit="px" min={0} />
          </Field>
          <Field label="الطول">
            <ScrubInput label="ط" mixed mixedLabel="متعدد" unit="px" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid">
        <div style={panel}>
          <Field label="Width" error="Enter a width of 1 px or more.">
            <ScrubInput label="W" defaultValue={0} unit="px" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <div style={panel}>
          <ScrubInput label="W" aria-label="Width" defaultValue={320} unit="px" disabled />
          <ScrubInput label="H" aria-label="Height" defaultValue={240} unit="px" disabled />
        </div>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <div style={panel}>
          <ScrubInput label="W" aria-label="Width" defaultValue={320} unit="px" readOnly />
          <ScrubInput label="H" aria-label="Height" defaultValue={240} unit="px" readOnly />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
