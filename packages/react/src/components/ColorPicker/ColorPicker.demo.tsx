// ColorPicker demo. Cases: variants (the compact trigger in sizes sm, md
// and lg; it opens a Popover on web and a Sheet on ios and android), one
// (the panel inline on the spectrum view, with one saved colour), many (the
// sliders view with ten saved colours that wrap), long-text (a long label),
// long-arabic (the panel inline on the grid view in Arabic: the tabs and
// the footer follow reading order, the grid keeps its hue order, digits stay
// Western), disabled. The colours are demo data. The cases stay light (one
// grid on the page) so the contract suite's page reloads stay quick. No
// empty, loading, error or readonly: a picker always has a colour and has no
// wrong one. The copy and the locale follow the page language: with
// lang=ar every case reads Arabic.
import { useState } from 'react';
import { colorName, colorSwatchGrid } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
import { ColorPicker, type ColorPickerSize } from './index';

const sizes: ColorPickerSize[] = ['sm', 'md', 'lg'];
const saved = ['#12b76a', '#fdb022', '#f79009', '#d92d20', '#c11574', '#2e90fa', '#7a5af8', '#e31b54', '#93370d', '#0e9384'];
/** A colour of the system grid, so the grid view opens with it picked. */
const gridPick = colorSwatchGrid()[4]![4]!;
const note = { margin: 0, fontSize: 'var(--ds-font-size-s)' } as const;

/** A controlled picker with the picked colour's name and hex beside it. */
function Named({ locale, ...props }: Parameters<typeof ColorPicker>[0] & { locale: string }) {
  const [value, setValue] = useState(String(props.defaultValue ?? '#2e90fa'));
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', minInlineSize: 0 }}>
      <ColorPicker {...props} locale={locale} defaultValue={undefined} value={value} onChange={setValue} />
      <p style={note}>
        {colorName(value, locale)} <span dir="ltr">{value}</span>
      </p>
    </div>
  );
}

const words = {
  en: { locale: 'en', note: 'Note colour', tag: 'Tag colour', card: 'Card colour', long: 'Background colour of the weekly report card' },
  ar: { locale: 'ar', note: 'لون الملاحظة', tag: 'لون الوسم', card: 'لون البطاقة', long: 'لون خلفية بطاقة التقرير الأسبوعي' },
} as const;

export default function ColorPickerDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Compact trigger in sizes sm, md and lg">
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            <ColorPicker size={size} label={w.note} defaultValue="#2e90fa" defaultView="spectrum" defaultSavedColors={saved.slice(0, 3)} locale={w.locale} />
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="one" title="Inline, spectrum view, one saved colour">
        <Named variant="inline" label={w.tag} defaultValue="#7a5af8" defaultView="spectrum" defaultSavedColors={['#7a5af8']} locale={w.locale} />
      </DemoCase>

      <DemoCase id="many" title="Inline, sliders view, ten saved colours">
        <Named variant="inline" label={w.card} defaultValue="#0e9384cc" defaultView="sliders" defaultSavedColors={saved} locale={w.locale} />
      </DemoCase>

      <DemoCase id="long-text" title="A long label names the trigger and titles the panel">
        <ColorPicker label={w.long} defaultValue="#fdb022" defaultView="spectrum" locale={w.locale} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: grid view, the footer follows reading order" lang="ar">
        <Named variant="inline" label="لون الملاحظة" defaultValue={gridPick} defaultView="grid" defaultSavedColors={saved.slice(0, 5)} locale="ar" />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <ColorPicker label={w.note} defaultValue="#2e90fa" disabled locale={w.locale} />
      </DemoCase>
    </DemoPage>
  );
}
