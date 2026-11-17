// ColorArea demo. Cases: variants (saturation and brightness, the default;
// hue across and lightness up in hsl; red and green in rgb), one (an area
// over a hue slider with a hex field, the paths that need no drag), long-text
// (a long name), long-arabic (the channel across runs from the right and the
// arrow keys follow it; digits stay Western), disabled. The colours are demo
// data. No empty, many, loading, error or readonly: an area always has a
// value, holds two channels, and has no wrong value.
import { useState } from 'react';
import { parseColor, type Color } from 'react-aria-components';
import { colorName } from '@the-system/shared';
import { DemoCase, DemoPage } from '../../demo';
import { ColorField } from '../ColorField';
import { ColorSlider } from '../ColorSlider';
import { Field } from '../Field';
import { ColorArea } from './index';

const column = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%', maxInlineSize: 'calc(var(--ds-size-control-lg) * 8)' } as const;

/** One colour edited by an area, a hue slider and a hex field. */
function Editor({ locale, words }: { locale: string; words: { field: string } }) {
  const [color, setColor] = useState<Color>(() => parseColor('hsb(214, 60%, 80%)'));
  const hex = color.toString('hex');
  return (
    <div style={column}>
      <ColorArea locale={locale} value={color} onChange={(_, c) => setColor(c)} />
      <ColorSlider channel="hue" colorSpace="hsb" locale={locale} value={color} onChange={(_, c) => setColor(c)} />
      <Field label={words.field}>
        <ColorField locale={locale} value={color} onChange={(_, c) => c && setColor(c.toFormat('hsb'))} />
      </Field>
      <p style={{ margin: 0 }}>
        {colorName(hex, locale)} <span dir="ltr">{hex}</span>
      </p>
    </div>
  );
}

export default function ColorAreaDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Saturation and brightness; hue and lightness; red and green">
        <div style={column}>
          <ColorArea defaultValue="hsb(30, 80%, 90%)" locale="en" />
          <ColorArea defaultValue="hsl(160, 70%, 45%)" colorSpace="hsl" xChannel="hue" yChannel="lightness" aria-label="Hue and lightness" locale="en" />
          <ColorArea defaultValue="rgb(200, 60, 120)" colorSpace="rgb" xChannel="red" yChannel="green" aria-label="Red and green" locale="en" />
        </div>
      </DemoCase>

      <DemoCase id="one" title="One colour: the area, a hue slider and a hex field to type">
        <Editor locale="en" words={{ field: 'Hex' }} />
      </DemoCase>

      <DemoCase id="long-text" title="A long name">
        <div style={column}>
          <ColorArea defaultValue="hsb(280, 50%, 70%)" aria-label="Saturation and brightness of the weekly report card background" locale="en" />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the channel across runs from the right, digits stay Western" lang="ar">
        <Editor locale="ar" words={{ field: 'رمز اللون' }} />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <div style={column}>
          <ColorArea defaultValue="hsb(214, 60%, 80%)" disabled locale="en" />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
