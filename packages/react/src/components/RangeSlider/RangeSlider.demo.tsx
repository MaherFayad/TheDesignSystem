import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { RangeSlider, type RangeSliderValue } from './index';

const priceLabels: [string, string] = ['Minimum price', 'Maximum price'];
const priceLabelsAr: [string, string] = ['أقل سعر', 'أعلى سعر'];

function Controlled() {
  const [value, setValue] = useState<RangeSliderValue>([200, 800]);
  const [saved, setSaved] = useState<RangeSliderValue>([200, 800]);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
      <RangeSlider
        label="Price"
        unit="SAR"
        min={0}
        max={1000}
        step={50}
        thumbLabels={priceLabels}
        value={value}
        onValueChange={setValue}
        onValueCommit={setSaved}
      />
      <p data-demo="label">
        Saved range: {saved.map((v) => v.toLocaleString('en')).join(' to ')} SAR
      </p>
    </div>
  );
}

/** RangeSlider in every content case. Each thumb is a tab stop with the Slider keys; the thumbs never cross. */
export default function RangeSliderDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, marks and orientation">
        <DemoGrid min="16rem">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <RangeSlider key={size} size={size} label={`Price, ${size}`} unit="SAR" max={1000} step={50} defaultValue={[200, 700]} thumbLabels={priceLabels} />
          ))}
          <RangeSlider
            label="Hours"
            min={0}
            max={24}
            defaultValue={[9, 17]}
            marks={[{ value: 0, label: '0' }, { value: 12, label: '12' }, { value: 24, label: '24' }]}
            thumbLabels={['Start hour', 'End hour']}
          />
          <RangeSlider label="Range" orientation="vertical" defaultValue={[20, 60]} thumbLabels={['Lowest level', 'Highest level']} />
          <Theme lang="ar">
            <RangeSlider label="السعر" unit="ريال" max={1000} step={50} defaultValue={[200, 700]} thumbLabels={priceLabelsAr} />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="The full range, no visible label">
        <RangeSlider thumbLabels={['Minimum size', 'Maximum size']} unit="px" max={64} />
      </DemoCase>

      <DemoCase id="one" title="Controlled, saved when the drag ends">
        <Controlled />
      </DemoCase>

      <DemoCase id="many" title="A filter panel">
        <div style={{ display: 'grid', gap: 'var(--ds-space-l)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RangeSlider label="Price" unit="SAR" max={1000} step={50} defaultValue={[100, 600]} size="sm" thumbLabels={priceLabels} />
          <RangeSlider label="Rating" min={1} max={5} defaultValue={[3, 5]} size="sm" thumbLabels={['Lowest rating', 'Highest rating']} />
          <RangeSlider label="Distance" unit="km" max={50} defaultValue={[0, 10]} size="sm" thumbLabels={['Nearest distance', 'Farthest distance']} />
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Thumbs side by side">
        <RangeSlider
          label="Year"
          min={2000}
          max={2026}
          defaultValue={[2019, 2020]}
          formatOptions={{ useGrouping: false }}
          marks={[2000, 2005, 2010, 2015, 2020, 2025].map((value) => ({ value, label: String(value) }))}
          thumbLabels={['First year', 'Last year']}
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long label and values">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <RangeSlider
            label="The budget each team can spend this quarter before finance has to approve the plan"
            unit="SAR"
            max={2000000}
            step={10000}
            defaultValue={[250000, 1500000]}
            thumbLabels={['Minimum budget', 'Maximum budget']}
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
        <Field error="Leave at least 100 SAR between the two prices.">
          <RangeSlider label="Price" unit="SAR" max={1000} step={50} minStepsBetweenThumbs={2} defaultValue={[450, 500]} thumbLabels={priceLabels} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <RangeSlider label="Price" unit="SAR" max={1000} defaultValue={[200, 600]} disabled thumbLabels={priceLabels} />
        <Theme lang="ar">
          <RangeSlider label="السعر" unit="ريال" max={1000} defaultValue={[200, 600]} disabled thumbLabels={priceLabelsAr} />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
