// ColorField demo. Cases: variants (sizes, the pill shape, a channel as a
// number), empty (a placeholder hint under a label), one (a value committed
// on blur or Enter, the hex under it), long-text (a long label and hint),
// long-arabic (the value stays left to right, digits stay Western), error,
// disabled, readonly. The colours are demo data. No many, too-many or
// loading: a field holds one colour and has nothing to load.
import { useState } from 'react';
import type { Size } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Field } from '../Field';
import { ColorField } from './index';

const sizes: Size[] = ['xs', 'sm', 'md', 'lg'];
const column = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%', maxInlineSize: 'calc(var(--ds-size-control-lg) * 7)' } as const;

function Committed({ locale, label }: { locale: string; label: string }) {
  const [value, setValue] = useState<string | null>('#1e6fd9');
  return (
    <div style={column}>
      <Field label={label}>
        <ColorField locale={locale} value={value} onChange={(v) => setValue(v)} />
      </Field>
      <p style={{ margin: 0 }} dir="ltr">
        {value ?? 'none'}
      </p>
    </div>
  );
}

export default function ColorFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes xs to lg, pill, and channels as numbers">
        <div style={column}>
          {sizes.map((size) => (
            <ColorField key={size} size={size} defaultValue="#0e9384" aria-label={`Hex, size ${size}`} />
          ))}
          <ColorField shape="pill" defaultValue="#7a5af8" aria-label="Hex, pill" />
          <DemoRow>
            <Field label="Red">
              <ColorField channel="red" defaultValue="#1e6fd9" />
            </Field>
            <Field label="Green">
              <ColorField channel="green" defaultValue="#1e6fd9" />
            </Field>
            <Field label="Blue">
              <ColorField channel="blue" defaultValue="#1e6fd9" />
            </Field>
          </DemoRow>
        </div>
      </DemoCase>

      <DemoCase id="empty" title="Empty, with a hint">
        <div style={column}>
          <Field label="Brand colour" description="Six hex digits, such as #1E6FD9.">
            <ColorField placeholder="#RRGGBB" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="one" title="A value commits on blur and on Enter">
        <Committed locale="en" label="Text colour" />
      </DemoCase>

      <DemoCase id="long-text" title="A long label and a long hint">
        <div style={column}>
          <Field label="Colour of the background behind the weekly report card" description="Type the hex code from the brand book. Arrow keys step through the values.">
            <ColorField defaultValue="#fdb022" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the value stays left to right" lang="ar">
        <Committed locale="ar" label="لون خلفية بطاقة التقرير الأسبوعي" />
        <div style={column}>
          <Field label="العتامة">
            <ColorField channel="alpha" defaultValue="#1e6fd9cc" locale="ar" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid">
        <div style={column}>
          <Field label="Text colour" error="This colour is too light for text on white. Pick a darker one.">
            <ColorField defaultValue="#fdb022" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <div style={column}>
          <Field label="Brand colour" disabled>
            <ColorField defaultValue="#1e6fd9" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <div style={column}>
          <Field label="Brand colour" readOnly>
            <ColorField defaultValue="#1e6fd9" />
          </Field>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
