import { useState } from 'react';
import { DemoCase, DemoRow, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { cityOptions, citySections, sortOptions } from '../ListBox/samples';
import { Select, type SelectItem, type SelectShape, type SelectSize } from './index';

const copy = {
  en: {
    sort: 'Sort by',
    status: 'Status',
    city: 'City',
    hint: 'The board shows tasks in this order.',
    error: 'Choose a status for the task.',
    noStatus: 'No statuses yet. Add one from Settings.',
    loading: 'Loading statuses',
  },
  ar: {
    sort: 'الترتيب حسب',
    status: 'الحالة',
    city: 'المدينة',
    hint: 'تظهر المهام في اللوحة بهذا الترتيب.',
    error: 'اختر حالة للمهمة.',
    noStatus: 'ما فيه حالات. أضف حالة من الإعدادات.',
    loading: 'جار تحميل الحالات',
  },
} as const;

function statusOptions(lang: 'en' | 'ar'): SelectItem[] {
  return lang === 'en'
    ? [
        { value: 'todo', label: 'To do' },
        { value: 'doing', label: 'In progress' },
        { value: 'review', label: 'In review' },
        { value: 'done', label: 'Done' },
      ]
    : [
        { value: 'todo', label: 'جديدة' },
        { value: 'doing', label: 'قيد التنفيذ' },
        { value: 'review', label: 'قيد المراجعة' },
        { value: 'done', label: 'مكتملة' },
      ];
}

function Sort({
  size,
  shape,
  lang = 'en',
  defaultValue = null,
  trigger = false,
}: {
  size?: SelectSize;
  shape?: SelectShape;
  lang?: 'en' | 'ar';
  defaultValue?: string | null;
  trigger?: boolean;
}) {
  const t = copy[lang];
  const [value, setValue] = useState<string | null>(defaultValue);
  return (
    <Field label={t.sort} style={{ inlineSize: '14rem' }}>
      <Select
        size={size}
        shape={shape}
        items={sortOptions(lang)}
        value={value}
        onValueChange={setValue}
        data-demo-trigger={trigger ? '' : undefined}
      />
    </Field>
  );
}

export default function SelectDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md, lg">
          <Sort size="sm" />
          <Sort size="md" defaultValue="edited" trigger />
          <Sort size="lg" />
        </DemoRow>
        <DemoRow label="shape pill">
          <Sort shape="pill" defaultValue="name" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <Sort lang="ar" defaultValue="owner" />
            <Sort lang="ar" shape="pill" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label={copy.en.status} style={{ inlineSize: '14rem' }}>
          <Select items={[]} empty={copy.en.noStatus} />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One option">
        <Field label={copy.en.status} style={{ inlineSize: '14rem' }}>
          <Select items={statusOptions('en').slice(0, 1)} />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Many options">
        <Field label={copy.en.status} description={copy.en.hint} style={{ inlineSize: '14rem' }}>
          <Select items={statusOptions('en')} defaultValue="doing" />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Too many options, grouped">
        <Field label={copy.en.city} style={{ inlineSize: '14rem' }}>
          <Select items={citySections('en')} defaultValue="riyadh" />
        </Field>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Field label={sample.en.long} style={{ inlineSize: '16rem' }}>
          <Select
            items={[
              { value: 'long', label: sample.en.long },
              { value: 'word', label: sample.en.word },
            ]}
            defaultValue="long"
          />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Field label={copy.ar.status} description={copy.ar.hint} style={{ inlineSize: '16rem' }}>
          <Select
            items={[
              { value: 'long', label: sample.ar.long },
              { value: 'word', label: sample.ar.word },
            ]}
            defaultValue="long"
          />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <Field label={copy.en.status} style={{ inlineSize: '14rem' }}>
          <Select items={[]} loading loadingLabel={copy.en.loading} />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Field label={copy.en.status} error={copy.en.error} style={{ inlineSize: '14rem' }}>
          <Select items={statusOptions('en')} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={copy.en.city} disabled style={{ inlineSize: '14rem' }}>
          <Select items={cityOptions('en', 'gulf')} defaultValue="doha" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={copy.en.city} readOnly style={{ inlineSize: '14rem' }}>
          <Select items={cityOptions('en', 'gulf')} defaultValue="doha" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
