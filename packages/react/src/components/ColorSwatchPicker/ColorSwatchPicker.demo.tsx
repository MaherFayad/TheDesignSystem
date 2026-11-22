// ColorSwatchPicker demo. Cases: variants (the grid, and the row in three
// sizes), empty (a row with nothing picked), one (one saved colour and
// the add button), many (ten saved colours), too-many (thirty saved colours
// that wrap), long-text (swatches with their own long names), long-arabic
// (the grid keeps its hue order in right to left; the row follows reading
// order), disabled. The saved colours are demo data: the one place a raw
// colour value appears. No loading, error or readonly: a palette is always
// there, has no wrong pick and is never shown without a way to pick. The
// copy and the locale follow the page language: with lang=ar every case
// reads Arabic.
import { useState } from 'react';
import { colorName } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
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

const words = {
  en: {
    locale: 'en',
    note: 'Note colour',
    savedSize: (size: string) => `Saved colours, ${size}`,
    highlight: 'Highlight colour',
    saved: 'Saved colours',
    tags: 'Tag colours',
    brand: 'Brand colours',
    names: ['Primary blue for buttons and links', 'Secondary teal for charts and highlights', 'Warm brown for print and packaging'],
  },
  ar: {
    locale: 'ar',
    note: 'لون الملاحظة',
    savedSize: (size: string) => `الألوان المحفوظة، ${size}`,
    highlight: 'لون التمييز',
    saved: 'الألوان المحفوظة',
    tags: 'ألوان الوسوم',
    brand: 'ألوان الهوية',
    names: ['الأزرق الأساسي للأزرار والروابط', 'الأخضر المزرق الثانوي للرسوم والتمييز', 'البني الدافي للطباعة والتغليف'],
  },
} as const;

export default function ColorSwatchPickerDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Grid of the system palette; row in sizes sm, md and lg">
        <Grid locale={w.locale} label={w.note} />
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            <Saved start={saved.slice(0, 5)} locale={w.locale} size={size} label={w.savedSize(size)} />
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="empty" title="Nothing picked yet">
        <ColorSwatchPicker layout="row" aria-label={w.highlight} locale={w.locale} colors={saved.slice(0, 6)} />
      </DemoCase>

      <DemoCase id="one" title="One saved colour and the add button">
        <Saved start={saved.slice(0, 1)} locale={w.locale} label={w.saved} />
      </DemoCase>

      <DemoCase id="many" title="Ten saved colours">
        <Saved start={saved} locale={w.locale} label={w.saved} />
      </DemoCase>

      <DemoCase id="too-many" title="Thirty colours wrap onto more rows">
        <ColorSwatchPicker layout="row" aria-label={w.tags} locale={w.locale} colors={many} defaultValue={many[7]} />
      </DemoCase>

      <DemoCase id="long-text" title="Swatches with their own names">
        <ColorSwatchPicker
          layout="row"
          aria-label={w.brand}
          locale={w.locale}
          defaultValue="#155eef"
          colors={[
            { color: '#155eef', name: w.names[0] },
            { color: '#0e9384', name: w.names[1] },
            { color: '#93370d', name: w.names[2], disabled: true },
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the grid keeps its hue order, the row follows reading order" lang="ar">
        <Grid locale="ar" label="لون الملاحظة" />
        <Saved start={saved} locale="ar" label="الألوان المحفوظة" />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <ColorSwatchPicker layout="row" aria-label={w.saved} locale={w.locale} colors={saved.slice(0, 5)} defaultValue={saved[0]} disabled onAdd={() => {}} />
      </DemoCase>
    </DemoPage>
  );
}
