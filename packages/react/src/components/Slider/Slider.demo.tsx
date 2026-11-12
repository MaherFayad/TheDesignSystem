import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { Slider, type SliderSize } from './index';

const sizes: SliderSize[] = ['sm', 'md', 'lg'];

const tooMany = Array.from({ length: 11 }, (_, i) => i * 10);

function Controlled() {
  const [value, setValue] = useState(40);
  const [saved, setSaved] = useState(40);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
      <Slider label="Opacity" unit="%" value={value} onValueChange={setValue} onValueCommit={setSaved} />
      <p data-demo="label">Saved at {saved}%</p>
    </div>
  );
}

/** Slider in every content case. Arrows move by one step, PageUp and PageDown by ten, Home and End to the ends. */
export default function SliderDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, marks and orientation">
        <DemoGrid min="16rem">
          {sizes.map((size) => (
            <Slider key={size} size={size} label={`Volume, ${size}`} unit="%" defaultValue={60} />
          ))}
          <Slider label="Corner radius" unit="px" min={0} max={24} step={4} defaultValue={8} marks={[0, 8, 16, 24]} />
          <Slider label="Zoom" unit="%" min={25} max={200} step={25} defaultValue={100} marks={[{ value: 25, label: '25%' }, { value: 100, label: '100%' }, { value: 200, label: '200%' }]} />
          <Slider label="Level" orientation="vertical" defaultValue={30} />
          <Theme lang="ar">
            <Slider label="مستوى الصوت" unit="%" defaultValue={60} marks={[{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }]} />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="At the minimum, no visible label">
        <Slider aria-label="Blur" unit="px" max={40} defaultValue={0} />
      </DemoCase>

      <DemoCase id="one" title="Controlled, saved when the drag ends">
        <Controlled />
      </DemoCase>

      <DemoCase id="many" title="A settings panel">
        <div style={{ display: 'grid', gap: 'var(--ds-space-l)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Slider label="Brightness" unit="%" defaultValue={70} size="sm" />
          <Slider label="Contrast" unit="%" defaultValue={50} size="sm" />
          <Slider label="Saturation" unit="%" defaultValue={45} size="sm" />
          <Slider label="Line height" min={1} max={2} step={0.05} defaultValue={1.5} size="sm" />
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Many marks">
        <Slider label="Progress" unit="%" step={10} defaultValue={70} marks={tooMany.map((value) => ({ value, label: String(value) }))} />
      </DemoCase>

      <DemoCase id="long-text" title="Long label and value">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Slider
            label="The most a single person on the team can spend each month before an owner has to approve it"
            unit="SAR"
            min={0}
            max={1000000}
            step={1000}
            defaultValue={250000}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Slider label="الحد الأعلى للصرف الشهري لكل عضو في الفريق قبل موافقة المالك" unit="ريال" min={0} max={50000} step={500} defaultValue={12500} />
          <p data-demo="label">{sample.ar.short}</p>
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field error="Pick 5 or more, so the export stays readable.">
          <Slider label="Export scale" unit="%" min={1} max={100} defaultValue={2} />
        </Field>
        <Field label="Thumbnail scale" error="Pick 10 or more, so the thumbnails stay readable.">
          <Slider unit="%" min={1} max={100} defaultValue={4} showValue />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Slider label="Volume" unit="%" defaultValue={40} disabled />
        <Theme lang="ar">
          <Slider label="مستوى الصوت" unit="%" defaultValue={40} disabled />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
