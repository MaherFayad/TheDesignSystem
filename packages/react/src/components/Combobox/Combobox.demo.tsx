import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { cityOptions, citySections } from '../ListBox/samples';
import { Combobox, type ComboboxShape, type ComboboxSize } from './index';

const copy = {
  en: {
    city: 'City',
    placeholder: 'Search cities',
    hint: 'Type a city name or an airport code.',
    error: 'Choose a city from the list.',
    noCities: 'No cities to choose from yet. Add one from Settings.',
    loading: 'Loading cities',
  },
  ar: {
    city: 'المدينة',
    placeholder: 'البحث عن مدينة',
    hint: 'اكتب اسم المدينة أو رمز المطار.',
    error: 'اختر مدينة من القائمة.',
    noCities: 'ما فيه مدن للاختيار. أضف مدينة من الإعدادات.',
    loading: 'جار تحميل المدن',
  },
} as const;

function City({
  size,
  shape,
  lang = 'en',
  defaultValue = null,
}: {
  size?: ComboboxSize;
  shape?: ComboboxShape;
  lang?: 'en' | 'ar';
  defaultValue?: string | null;
}) {
  const t = copy[lang];
  const [value, setValue] = useState<string | null>(defaultValue);
  return (
    <Field label={t.city} style={{ inlineSize: '16rem' }}>
      <Combobox
        size={size}
        shape={shape}
        items={citySections(lang)}
        value={value}
        onValueChange={setValue}
        placeholder={t.placeholder}
      />
    </Field>
  );
}

export default function ComboboxDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md, lg">
          <City size="sm" />
          <City size="md" defaultValue="jeddah" />
          <City size="lg" />
        </DemoRow>
        <DemoRow label="shape pill">
          <City shape="pill" defaultValue="abha" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <City lang="ar" defaultValue="ahsa" />
            <City lang="ar" shape="pill" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label={copy.en.city} style={{ inlineSize: '16rem' }}>
          <Combobox items={[]} empty={copy.en.noCities} placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One option">
        <Field label={copy.en.city} style={{ inlineSize: '16rem' }}>
          <Combobox items={cityOptions('en').slice(0, 1)} placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Many options">
        <Field label={copy.en.city} description={copy.en.hint} style={{ inlineSize: '16rem' }}>
          <Combobox items={cityOptions('en', 'gulf')} defaultValue="doha" />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Too many options, grouped">
        <DemoGrid min="16rem">
          <City defaultValue="riyadh" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Field label={sample.en.long} style={{ inlineSize: '18rem' }}>
          <Combobox
            items={[
              { value: 'long', label: sample.en.long },
              { value: 'word', label: sample.en.word },
            ]}
            defaultValue="long"
          />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Field label={copy.ar.city} description={copy.ar.hint} style={{ inlineSize: '18rem' }}>
          <Combobox
            items={[
              { value: 'long', label: sample.ar.long },
              { value: 'word', label: sample.ar.word },
            ]}
            defaultValue="long"
          />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <Field label={copy.en.city} style={{ inlineSize: '16rem' }}>
          <Combobox items={[]} loading loadingLabel={copy.en.loading} placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Field label={copy.en.city} error={copy.en.error} style={{ inlineSize: '16rem' }}>
          <Combobox items={cityOptions('en')} placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={copy.en.city} disabled style={{ inlineSize: '16rem' }}>
          <Combobox items={cityOptions('en')} defaultValue="riyadh" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={copy.en.city} readOnly style={{ inlineSize: '16rem' }}>
          <Combobox items={cityOptions('en')} defaultValue="riyadh" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
