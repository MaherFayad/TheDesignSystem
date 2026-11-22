// RangeSlider demo. The copy follows the page language: with lang=ar every
// case reads Arabic.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field/Field';
import { isArabic } from '../Popover/FloatingLayer';
import { RangeSlider, type RangeSliderValue } from './index';

const priceLabels: [string, string] = ['Minimum price', 'Maximum price'];
const priceLabelsAr: [string, string] = ['أقل سعر', 'أعلى سعر'];

const words = {
  en: {
    price: 'Price',
    sar: 'SAR',
    prices: priceLabels,
    saved: (range: RangeSliderValue) => `Saved range: ${range.map((v) => v.toLocaleString('en')).join(' to ')} SAR`,
    priceSize: (size: string) => `Price, ${size}`,
    hours: 'Hours',
    hourThumbs: ['Start hour', 'End hour'] as [string, string],
    range: 'Range',
    levels: ['Lowest level', 'Highest level'] as [string, string],
    sizes: ['Minimum size', 'Maximum size'] as [string, string],
    rating: 'Rating',
    ratings: ['Lowest rating', 'Highest rating'] as [string, string],
    distance: 'Distance',
    km: 'km',
    distances: ['Nearest distance', 'Farthest distance'] as [string, string],
    year: 'Year',
    years: ['First year', 'Last year'] as [string, string],
    long: 'The budget each team can spend this quarter before finance has to approve the plan',
    budgets: ['Minimum budget', 'Maximum budget'] as [string, string],
    error: 'Leave at least 150 SAR between the two prices.',
  },
  ar: {
    price: 'السعر',
    sar: 'ريال',
    prices: priceLabelsAr,
    saved: (range: RangeSliderValue) => `النطاق المحفوظ: من ${range[0].toLocaleString('en')} إلى ${range[1].toLocaleString('en')} ريال`,
    priceSize: (size: string) => `السعر، ${size}`,
    hours: 'الساعات',
    hourThumbs: ['ساعة البداية', 'ساعة النهاية'] as [string, string],
    range: 'النطاق',
    levels: ['أقل مستوى', 'أعلى مستوى'] as [string, string],
    sizes: ['أصغر مقاس', 'أكبر مقاس'] as [string, string],
    rating: 'التقييم',
    ratings: ['أقل تقييم', 'أعلى تقييم'] as [string, string],
    distance: 'المسافة',
    km: 'كم',
    distances: ['أقرب مسافة', 'أبعد مسافة'] as [string, string],
    year: 'السنة',
    years: ['أول سنة', 'آخر سنة'] as [string, string],
    long: 'الميزانية اللي يقدر يصرفها كل فريق هذا الربع قبل ما تحتاج الخطة موافقة الإدارة المالية',
    budgets: ['أقل ميزانية', 'أعلى ميزانية'] as [string, string],
    error: 'خل بين السعرين 150 ريال على الأقل.',
  },
};

type Words = (typeof words)['en'];

function Controlled({ w }: { w: Words }) {
  const [value, setValue] = useState<RangeSliderValue>([200, 800]);
  const [saved, setSaved] = useState<RangeSliderValue>([200, 800]);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
      <RangeSlider
        label={w.price}
        unit={w.sar}
        min={0}
        max={1000}
        step={50}
        thumbLabels={w.prices}
        value={value}
        onValueChange={setValue}
        onValueCommit={setSaved}
      />
      <p data-demo="label">{w.saved(saved)}</p>
    </div>
  );
}

/** RangeSlider in every content case. Each thumb is a tab stop with the Slider keys; the thumbs never cross. */
export default function RangeSliderDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, marks and orientation">
        <DemoGrid min="16rem">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <RangeSlider key={size} size={size} label={w.priceSize(size)} unit={w.sar} max={1000} step={50} defaultValue={[200, 700]} thumbLabels={w.prices} />
          ))}
          <RangeSlider
            label={w.hours}
            min={0}
            max={24}
            defaultValue={[9, 17]}
            marks={[{ value: 0, label: '0' }, { value: 12, label: '12' }, { value: 24, label: '24' }]}
            thumbLabels={w.hourThumbs}
          />
          <RangeSlider label={w.range} orientation="vertical" defaultValue={[20, 60]} thumbLabels={w.levels} />
          <Theme lang="ar">
            <RangeSlider label="السعر" unit="ريال" max={1000} step={50} defaultValue={[200, 700]} thumbLabels={priceLabelsAr} />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="The full range, no visible label">
        <RangeSlider thumbLabels={w.sizes} unit="px" max={64} />
      </DemoCase>

      <DemoCase id="one" title="Controlled, saved when the drag ends">
        <Controlled w={w} />
      </DemoCase>

      <DemoCase id="many" title="A filter panel">
        <div style={{ display: 'grid', gap: 'var(--ds-space-l)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RangeSlider label={w.price} unit={w.sar} max={1000} step={50} defaultValue={[100, 600]} size="sm" thumbLabels={w.prices} />
          <RangeSlider label={w.rating} min={1} max={5} defaultValue={[3, 5]} size="sm" thumbLabels={w.ratings} />
          <RangeSlider label={w.distance} unit={w.km} max={50} defaultValue={[0, 10]} size="sm" thumbLabels={w.distances} />
        </div>
      </DemoCase>

      {/* Three steps keep the thumb centers 24px apart on a 320px screen, so neither target is hidden (WCAG 2.5.8). */}
      <DemoCase id="too-many" title="Thumbs side by side">
        <RangeSlider
          label={w.year}
          min={2000}
          max={2026}
          defaultValue={[2019, 2022]}
          minStepsBetweenThumbs={3}
          formatOptions={{ useGrouping: false }}
          marks={[2000, 2005, 2010, 2015, 2020, 2025].map((value) => ({ value, label: String(value) }))}
          thumbLabels={w.years}
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long label and values">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RangeSlider
            label={w.long}
            unit={w.sar}
            max={2000000}
            step={10000}
            defaultValue={[250000, 1500000]}
            thumbLabels={w.budgets}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RangeSlider
            label="ميزانية الفريق لهذا الربع قبل موافقة الإدارة المالية"
            unit="ريال"
            max={2000000}
            step={10000}
            defaultValue={[250000, 1500000]}
            thumbLabels={['أقل ميزانية', 'أعلى ميزانية']}
          />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        {/* 100 SAR apart keeps the thumb centers 24px apart at 320px (WCAG 2.5.8). */}
        <Field error={w.error}>
          <RangeSlider label={w.price} unit={w.sar} max={1000} step={50} defaultValue={[400, 500]} thumbLabels={w.prices} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <RangeSlider label={w.price} unit={w.sar} max={1000} defaultValue={[200, 600]} disabled thumbLabels={w.prices} />
        <Theme lang="ar">
          <RangeSlider label="السعر" unit="ريال" max={1000} defaultValue={[200, 600]} disabled thumbLabels={priceLabelsAr} />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
