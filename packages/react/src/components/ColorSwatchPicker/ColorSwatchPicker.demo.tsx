// ColorSwatchPicker demo. Cases: variants (the grid, and the row in three
// sizes), empty (a row with nothing picked), one (one saved colour and
// the add button), many (ten saved colours), too-many (thirty saved colours
// that wrap), long-text (swatches with their own long names), long-arabic
// (the grid keeps its hue order in right to left; the row follows reading
// order), disabled. The saved colours are demo data: the one place a raw
// colour value appears. No loading, error or readonly: a palette is always
// there, has no wrong pick and is never shown without a way to pick.
import { useState } from 'react';
import { colorName } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { ColorSwatchPicker, type ColorSwatchPickerSize } from './index';

const saved = ['#12b76a', '#fdb022', '#f79009', '#d92d20', '#c11574', '#2e90fa', '#7a5af8', '#e31b54', '#93370d', '#0e9384'];
const sizes: ColorSwatchPickerSize[] = ['sm', 'md', 'lg'];
const note = { margin: 0, marginBlockStart: 'var(--ds-space-xs)', fontSize: 'var(--ds-font-size-s)' } as const;

/** A controlled grid with the picked colour's name and hex under it. */
function Grid({ locale, label }: { locale: string; label: string }) {
  const [value, setValue] = useState('#ffffff');
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-xs)', minInlineSize: 0 }}>
      <ColorSwatchPicker aria-label={label} locale={locale} value={value} onChange={setValue} />
      <p style={note}>
        {colorName(value, locale)} <span dir="ltr">{value}</span>
      </p>
    </div>
  );
}

/** Saved colours with an add button that saves one more. */
function Saved({ start, locale, size, label }: { start: string[]; locale: string; size?: ColorSwatchPickerSize; label: string }) {
  const [colors, setColors] = useState(start);
  const [value, setValue] = useState(start[0] ?? '');
  const extra = ['#4e5ba6', '#66c61c', '#ff692e', '#155eef'];
  return (
    <ColorSwatchPicker
      layout="row"
      aria-label={label}
      locale={locale}
      size={size}
      colors={colors}
      value={value}
      onChange={setValue}
      onAdd={() => {
        const next = extra[colors.length % extra.length]!;
        if (!colors.includes(next)) setColors([...colors, next]);
        setValue(next);
      }}
    />
  );
}

const many = Array.from({ length: 30 }, (_, i) => `hsl(${(i * 12) % 360}, 70%, ${40 + (i % 3) * 12}%)`);

export default function ColorSwatchPickerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Grid of the system palette; row in sizes sm, md and lg">
        <Grid locale="en" label="Note colour" />
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            <Saved start={saved.slice(0, 5)} locale="en" size={size} label={`Saved colours, ${size}`} />
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="empty" title="Nothing picked yet">
        <ColorSwatchPicker layout="row" aria-label="Highlight colour" locale="en" colors={saved.slice(0, 6)} />
      </DemoCase>

      <DemoCase id="one" title="One saved colour and the add button">
        <Saved start={saved.slice(0, 1)} locale="en" label="Saved colours" />
      </DemoCase>

      <DemoCase id="many" title="Ten saved colours">
        <Saved start={saved} locale="en" label="Saved colours" />
      </DemoCase>

      <DemoCase id="too-many" title="Thirty colours wrap onto more rows">
        <ColorSwatchPicker layout="row" aria-label="Tag colours" locale="en" colors={many} defaultValue={many[7]} />
      </DemoCase>

      <DemoCase id="long-text" title="Swatches with their own names">
        <ColorSwatchPicker
          layout="row"
          aria-label="Brand colours"
          locale="en"
          defaultValue="#155eef"
          colors={[
            { color: '#155eef', name: 'Primary blue for buttons and links' },
            { color: '#0e9384', name: 'Secondary teal for charts and highlights' },
            { color: '#93370d', name: 'Warm brown for print and packaging', disabled: true },
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the grid keeps its hue order, the row follows reading order" lang="ar">
        <Grid locale="ar" label="لون الملاحظة" />
        <Saved start={saved} locale="ar" label="الألوان المحفوظة" />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <ColorSwatchPicker layout="row" aria-label="Saved colours" locale="en" colors={saved.slice(0, 5)} defaultValue={saved[0]} disabled onAdd={() => {}} />
      </DemoCase>
    </DemoPage>
  );
}
