import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { cityOptions, citySections } from '../ListBox/samples';
import type { ListBoxOption } from '../ListBox';
import { MultiSelect, type MultiSelectShape, type MultiSelectSize, type MultiSelectSummary } from './index';

const copy = {
  en: {
    labels: 'Labels',
    cities: 'Cities',
    hint: 'Tasks with any of these labels show on the board.',
    error: 'Choose at least one city.',
    noLabels: 'No labels yet. Add one from Settings.',
    loading: 'Loading labels',
  },
  ar: {
    labels: 'التصنيفات',
    cities: 'المدن',
    hint: 'تظهر في اللوحة المهام اللي فيها أي تصنيف من هذي.',
    error: 'اختر مدينة وحدة على الأقل.',
    noLabels: 'ما فيه تصنيفات. أضف تصنيف من الإعدادات.',
    loading: 'جار تحميل التصنيفات',
  },
} as const;

function labelOptions(lang: 'en' | 'ar'): ListBoxOption[] {
  return lang === 'en'
    ? [
        { value: 'design', label: 'Design' },
        { value: 'research', label: 'Research' },
        { value: 'copy', label: 'Copy' },
        { value: 'bug', label: 'Bug' },
        { value: 'legal', label: 'Legal review', disabled: true },
      ]
    : [
        { value: 'design', label: 'تصميم' },
        { value: 'research', label: 'بحث' },
        { value: 'copy', label: 'محتوى' },
        { value: 'bug', label: 'خلل' },
        { value: 'legal', label: 'مراجعة قانونية', disabled: true },
      ];
}

function Labels({
  size,
  shape,
  summary,
  lang = 'en',
  defaultValue = [],
  trigger = false,
}: {
  size?: MultiSelectSize;
  shape?: MultiSelectShape;
  summary?: MultiSelectSummary;
  lang?: 'en' | 'ar';
  defaultValue?: string[];
  trigger?: boolean;
}) {
  const t = copy[lang];
  const [value, setValue] = useState<string[]>(defaultValue);
  return (
    <Field label={t.labels} style={{ inlineSize: '16rem' }}>
      <MultiSelect
        size={size}
        shape={shape}
        summary={summary}
        items={labelOptions(lang)}
        value={value}
        onValueChange={setValue}
        data-demo-trigger={trigger ? '' : undefined}
      />
    </Field>
  );
}

export default function MultiSelectDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md, lg">
          <Labels size="sm" />
          <Labels size="md" defaultValue={['design', 'copy']} trigger />
          <Labels size="lg" defaultValue={['research']} />
        </DemoRow>
        <DemoRow label="shape pill, summary count">
          <Labels shape="pill" defaultValue={['design']} />
          <Labels summary="count" defaultValue={['design', 'research', 'bug']} />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <Labels lang="ar" defaultValue={['design', 'bug']} />
            <Labels lang="ar" summary="count" defaultValue={['design', 'research', 'copy']} />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label={copy.en.labels} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={[]} empty={copy.en.noLabels} />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One option">
        <Field label={copy.en.labels} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={labelOptions('en').slice(0, 1)} />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Many options">
        <Field label={copy.en.cities} description={copy.en.hint} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={cityOptions('en', 'gulf')} defaultValue={['doha', 'dubai']} />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Too many values, grouped options with search">
        <Field label={copy.en.cities} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={citySections('en')} defaultValue={['riyadh', 'jeddah', 'abha', 'dammam', 'doha', 'muscat']} />
        </Field>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Field label={sample.en.long} style={{ inlineSize: '18rem' }}>
          <MultiSelect
            items={[
              { value: 'long', label: sample.en.long },
              { value: 'word', label: sample.en.word },
            ]}
            defaultValue={['long', 'word']}
          />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Field label={copy.ar.labels} description={copy.ar.hint} style={{ inlineSize: '18rem' }}>
          <MultiSelect
            items={[
              { value: 'long', label: sample.ar.long },
              { value: 'word', label: sample.ar.word },
            ]}
            defaultValue={['long']}
          />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <Field label={copy.en.labels} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={[]} loading loadingLabel={copy.en.loading} />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Field label={copy.en.cities} error={copy.en.error} style={{ inlineSize: '16rem' }}>
          <MultiSelect items={cityOptions('en', 'gulf')} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={copy.en.labels} disabled style={{ inlineSize: '16rem' }}>
          <MultiSelect items={labelOptions('en')} defaultValue={['design']} />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={copy.en.labels} readOnly style={{ inlineSize: '16rem' }}>
          <MultiSelect items={labelOptions('en')} defaultValue={['design', 'bug']} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
