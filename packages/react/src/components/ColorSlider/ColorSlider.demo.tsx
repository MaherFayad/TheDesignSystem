// ColorSlider demo. Cases: variants (hue, saturation, lightness, opacity,
// red; sizes sm, md and lg), one (a hue and an opacity slider on one colour,
// with a field beside them for typing, the path that needs no drag),
// long-text (a long label), long-arabic (the gradient, the thumb and the
// arrow keys mirror; digits stay Western), disabled. The colours are demo
// data. No empty, many, loading, error or readonly: a slider always has a
// value, holds one channel, and has no wrong value. The copy and the
// locale follow the page language: with lang=ar every case reads Arabic.
import { useState } from 'react';
import { parseColor, type Color } from 'react-aria-components';
import { colorName } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
import { ColorField } from '../ColorField';
import { ColorSwatch } from '../ColorSwatch';
import { Field } from '../Field';
import { ColorSlider, type ColorSliderSize } from './index';

const sizes: ColorSliderSize[] = ['sm', 'md', 'lg'];
const column = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%', maxInlineSize: 'calc(var(--ds-size-control-lg) * 8)' } as const;

/** One colour edited by a hue slider, an opacity slider and a hex field. */
function Editor({ locale, words }: { locale: string; words: { field: string } }) {
  const [color, setColor] = useState<Color>(() => parseColor('hsla(214, 76%, 48%, 0.8)'));
  const hexa = color.toString('hexa');
  return (
    <div style={column}>
      <ColorSlider channel="hue" locale={locale} value={color} onChange={(_, c) => setColor(c)} />
      <ColorSlider channel="alpha" locale={locale} value={color} onChange={(_, c) => setColor(c)} />
      <div style={{ display: 'flex', gap: 'var(--ds-space-s)', alignItems: 'end' }}>
        <ColorSwatch color={color} locale={locale} size="lg" />
        <Field label={words.field} style={{ flex: '1 1 auto' }}>
          <ColorField locale={locale} value={color} onChange={(_, c) => c && setColor(c.toFormat('hsla'))} preview={false} />
        </Field>
      </div>
      <p style={{ margin: 0 }}>
        {colorName(hexa, locale)} <span dir="ltr">{hexa}</span>
      </p>
    </div>
  );
}

const words = {
  en: { locale: 'en', tagHue: 'Hue of the tag', field: 'Hex', long: 'Opacity of the background behind the weekly report card' },
  ar: { locale: 'ar', tagHue: 'درجة لون الوسم', field: 'رمز اللون', long: 'عتامة الخلفية ورا بطاقة التقرير الأسبوعي' },
} as const;

export default function ColorSliderDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Channels hue, saturation, lightness, opacity and red; sizes">
        <div style={column}>
          <ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" locale={w.locale} />
          <ColorSlider channel="saturation" defaultValue="hsl(214, 76%, 48%)" locale={w.locale} />
          <ColorSlider channel="lightness" defaultValue="hsl(214, 76%, 48%)" locale={w.locale} />
          <ColorSlider channel="alpha" defaultValue="#1e6fd980" locale={w.locale} />
          <ColorSlider channel="red" defaultValue="#1e6fd9" locale={w.locale} />
          {sizes.map((size) => (
            <DemoRow key={size} label={size}>
              <ColorSlider channel="hue" defaultValue="hsl(30, 90%, 50%)" size={size} locale={w.locale} style={{ flex: '1 1 auto' }} />
            </DemoRow>
          ))}
          <ColorSlider channel="hue" defaultValue="hsl(140, 70%, 45%)" hideLabel aria-label={w.tagHue} locale={w.locale} />
        </div>
      </DemoCase>

      <DemoCase id="one" title="One colour: hue, opacity and a hex field to type">
        <Editor locale={w.locale} words={w} />
      </DemoCase>

      <DemoCase id="long-text" title="A long label wraps; the value keeps its place">
        <div style={column}>
          <ColorSlider channel="alpha" defaultValue="#0e9384b3" label={w.long} locale={w.locale} />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the slider mirrors, digits stay Western" lang="ar">
        <Editor locale="ar" words={{ field: 'رمز اللون' }} />
        <div style={column}>
          <ColorSlider channel="lightness" defaultValue="hsl(214, 76%, 48%)" label="إضاءة لون خلفية بطاقة التقرير الأسبوعي" locale="ar" />
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <div style={column}>
          <ColorSlider channel="hue" defaultValue="hsl(214, 76%, 48%)" disabled locale={w.locale} />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
