// Slider demo. The copy follows the page language: with lang=ar every case
// reads Arabic.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field/Field';
import { isArabic } from '../Popover/FloatingLayer';
import { Slider, type SliderSize } from './index';

const sizes: SliderSize[] = ['sm', 'md', 'lg'];

const tooMany = Array.from({ length: 11 }, (_, i) => i * 10);

const words = {
  en: {
    opacity: 'Opacity',
    saved: (n: number) => `Saved at ${n}%`,
    volume: (size: string) => `Volume, ${size}`,
    radius: 'Corner radius',
    zoom: 'Zoom',
    level: 'Level',
    blur: 'Blur',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    lineHeight: 'Line height',
    progress: 'Progress',
    long: 'The most a single person on the team can spend each month before an owner has to approve it',
    sar: 'SAR',
    exportError: 'Pick 5 or more, so the export stays readable.',
    exportScale: 'Export scale',
    thumb: 'Thumbnail scale',
    thumbError: 'Pick 10 or more, so the thumbnails stay readable.',
    volumeLabel: 'Volume',
  },
  ar: {
    opacity: 'العتامة',
    saved: (n: number) => `محفوظ على ${n}%`,
    volume: (size: string) => `مستوى الصوت، ${size}`,
    radius: 'استدارة الزوايا',
    zoom: 'التكبير',
    level: 'المستوى',
    blur: 'التمويه',
    brightness: 'السطوع',
    contrast: 'التباين',
    saturation: 'التشبع',
    lineHeight: 'ارتفاع السطر',
    progress: 'التقدم',
    long: 'أعلى مبلغ يقدر يصرفه الشخص الواحد في الفريق كل شهر قبل ما يحتاج موافقة المالك',
    sar: 'ريال',
    exportError: 'اختر 5 أو أكثر عشان يبقى التصدير واضح.',
    exportScale: 'مقياس التصدير',
    thumb: 'مقياس الصور المصغرة',
    thumbError: 'اختر 10 أو أكثر عشان تبقى الصور المصغرة واضحة.',
    volumeLabel: 'مستوى الصوت',
  },
};

type Words = (typeof words)['en'];

function Controlled({ w }: { w: Words }) {
  const [value, setValue] = useState(40);
  const [saved, setSaved] = useState(40);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
      <Slider label={w.opacity} unit="%" value={value} onValueChange={setValue} onValueCommit={setSaved} />
      <p data-demo="label">{w.saved(saved)}</p>
    </div>
  );
}

/** Slider in every content case. Arrows move by one step, PageUp and PageDown by ten, Home and End to the ends. */
export default function SliderDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, marks and orientation">
        <DemoGrid min="16rem">
          {sizes.map((size) => (
            <Slider key={size} size={size} label={w.volume(size)} unit="%" defaultValue={60} />
          ))}
          <Slider label={w.radius} unit="px" min={0} max={24} step={4} defaultValue={8} marks={[0, 8, 16, 24]} />
          <Slider label={w.zoom} unit="%" min={25} max={200} step={25} defaultValue={100} marks={[{ value: 25, label: '25%' }, { value: 100, label: '100%' }, { value: 200, label: '200%' }]} />
          <Slider label={w.level} orientation="vertical" defaultValue={30} />
          <Theme lang="ar">
            <Slider label="مستوى الصوت" unit="%" defaultValue={60} marks={[{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }]} />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="At the minimum, no visible label">
        <Slider aria-label={w.blur} unit="px" max={40} defaultValue={0} />
      </DemoCase>

      <DemoCase id="one" title="Controlled, saved when the drag ends">
        <Controlled w={w} />
      </DemoCase>

      <DemoCase id="many" title="A settings panel">
        <div style={{ display: 'grid', gap: 'var(--ds-space-l)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Slider label={w.brightness} unit="%" defaultValue={70} size="sm" />
          <Slider label={w.contrast} unit="%" defaultValue={50} size="sm" />
          <Slider label={w.saturation} unit="%" defaultValue={45} size="sm" />
          <Slider label={w.lineHeight} min={1} max={2} step={0.05} defaultValue={1.5} size="sm" />
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Many marks">
        <Slider label={w.progress} unit="%" step={10} defaultValue={70} marks={tooMany.map((value) => ({ value, label: String(value) }))} />
      </DemoCase>

      <DemoCase id="long-text" title="Long label and value">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Slider
            label={w.long}
            unit={w.sar}
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
        <Field error={w.exportError}>
          <Slider label={w.exportScale} unit="%" min={1} max={100} defaultValue={2} />
        </Field>
        <Field label={w.thumb} error={w.thumbError}>
          <Slider unit="%" min={1} max={100} defaultValue={4} showValue />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Slider label={w.volumeLabel} unit="%" defaultValue={40} disabled />
        <Theme lang="ar">
          <Slider label="مستوى الصوت" unit="%" defaultValue={40} disabled />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
