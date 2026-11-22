// ColorField demo. Cases: variants (sizes, the pill shape, a channel as a
// number), empty (a placeholder hint under a label), one (a value committed
// on blur or Enter, the hex under it), long-text (a long label and hint),
// long-arabic (the value stays left to right, digits stay Western), error,
// disabled, readonly. The colours are demo data. No many, too-many or
// loading: a field holds one colour and has nothing to load. The copy and
// the locale follow the page language: with lang=ar every case reads Arabic.
import { useState } from 'react';
import type { Size } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field';
import { isArabic } from '../Popover/FloatingLayer';
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

const words = {
  en: {
    locale: 'en',
    size: (size: string) => `Hex, size ${size}`,
    pill: 'Hex, pill',
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    brand: 'Brand colour',
    hint: 'Six hex digits, such as #1E6FD9.',
    text: 'Text colour',
    longLabel: 'Colour of the background behind the weekly report card',
    longHint: 'Type the hex code from the brand book. Arrow keys step through the values.',
    error: 'This colour is too light for text on white. Pick a darker one.',
  },
  ar: {
    locale: 'ar',
    size: (size: string) => `رمز اللون، المقاس ${size}`,
    pill: 'رمز اللون، شكل كبسولة',
    red: 'الأحمر',
    green: 'الأخضر',
    blue: 'الأزرق',
    brand: 'لون الهوية',
    hint: 'رمز من 6 خانات، مثل #1E6FD9.',
    text: 'لون النص',
    longLabel: 'لون الخلفية ورا بطاقة التقرير الأسبوعي',
    longHint: 'اكتب رمز اللون من دليل الهوية. الأسهم تنقلك بين القيم.',
    error: 'هذا اللون فاتح مرة على نص فوق الأبيض. اختر لون أغمق.',
  },
} as const;

export default function ColorFieldDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes xs to lg, pill, and channels as numbers">
        <div style={column}>
          {sizes.map((size) => (
            <ColorField key={size} size={size} defaultValue="#0e9384" aria-label={w.size(size)} locale={w.locale} />
          ))}
          <ColorField shape="pill" defaultValue="#7a5af8" aria-label={w.pill} locale={w.locale} />
          <DemoRow>
            <Field label={w.red}>
              <ColorField channel="red" defaultValue="#1e6fd9" locale={w.locale} />
            </Field>
            <Field label={w.green}>
              <ColorField channel="green" defaultValue="#1e6fd9" locale={w.locale} />
            </Field>
            <Field label={w.blue}>
              <ColorField channel="blue" defaultValue="#1e6fd9" locale={w.locale} />
            </Field>
          </DemoRow>
        </div>
      </DemoCase>

      <DemoCase id="empty" title="Empty, with a hint">
        <div style={column}>
          <Field label={w.brand} description={w.hint}>
            <ColorField placeholder="#RRGGBB" locale={w.locale} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="one" title="A value commits on blur and on Enter">
        <Committed locale={w.locale} label={w.text} />
      </DemoCase>

      <DemoCase id="long-text" title="A long label and a long hint">
        <div style={column}>
          <Field label={w.longLabel} description={w.longHint}>
            <ColorField defaultValue="#fdb022" locale={w.locale} />
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
          <Field label={w.text} error={w.error}>
            <ColorField defaultValue="#fdb022" locale={w.locale} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <div style={column}>
          <Field label={w.brand} disabled>
            <ColorField defaultValue="#1e6fd9" locale={w.locale} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <div style={column}>
          <Field label={w.brand} readOnly>
            <ColorField defaultValue="#1e6fd9" locale={w.locale} />
          </Field>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
