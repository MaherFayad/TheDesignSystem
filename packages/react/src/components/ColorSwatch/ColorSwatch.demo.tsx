// ColorSwatch demo. Cases: variants (sizes and shapes), one (a swatch with
// its name under it), many (a set of label colours, each named), long-text
// (a see through colour, and a swatch with what it is for), long-arabic
// (the same names in Arabic). The colours here are demo data: the one place
// a raw colour value appears, passed as the color prop. No empty, loading,
// error, disabled or readonly: a swatch shows one value and takes no input.
import { colorName } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { ColorSwatch, type ColorSwatchShape, type ColorSwatchSize } from './index';

const sizes: ColorSwatchSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ColorSwatchShape[] = ['default', 'pill', 'square'];
const labels = ['#d92d20', '#f79009', '#fdb022', '#12b76a', '#0ba5ec', '#2e90fa', '#7a5af8', '#ee46bc', '#667085', '#ffffff'];
const caption = { margin: 0, marginBlockStart: 'var(--ds-space-3xs)', fontSize: 'var(--ds-font-size-xs)' } as const;

/** A swatch with its name drawn under it, so the colour is never told by colour alone. */
function Named({ color, locale, label }: { color: string; locale: string; label?: string }) {
  return (
    <figure style={{ margin: 0, display: 'grid', justifyItems: 'center', inlineSize: 'var(--ds-size-control-lg)' }}>
      <ColorSwatch color={color} locale={locale} aria-label={label} size="lg" shape="pill" />
      <figcaption style={caption} aria-hidden="true">
        {colorName(color, locale)}
      </figcaption>
    </figure>
  );
}

export default function ColorSwatchDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes xs to lg; shapes default, pill and square">
        {shapes.map((shape) => (
          <DemoRow key={shape} label={shape}>
            {sizes.map((size) => (
              <ColorSwatch key={size} color="#2e90fa" size={size} shape={shape} locale="en" />
            ))}
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="one" title="One colour with its name">
        <Named color="#0d4289" locale="en" />
      </DemoCase>

      <DemoCase id="many" title="Label colours, each named; white keeps its edge">
        <DemoRow>
          {labels.map((c) => (
            <Named key={c} color={c} locale="en" />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="A see through colour, and what a colour is for">
        <DemoRow>
          <Named color="#0d428966" locale="en" />
          <Named color="#00000000" locale="en" />
          <ColorSwatch color="#12b76a" locale="en" aria-label="Background of the weekly report card" size="lg" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic names: the colour, then the shade" lang="ar">
        <DemoRow>
          {labels.map((c) => (
            <Named key={c} color={c} locale="ar" />
          ))}
          <Named color="#0d428966" locale="ar" label="لون خلفية بطاقة التقرير الأسبوعي" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
