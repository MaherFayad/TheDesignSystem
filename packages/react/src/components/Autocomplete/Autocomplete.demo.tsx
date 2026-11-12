import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { citySections } from '../ListBox/samples';
import { Autocomplete, type AutocompleteShape, type AutocompleteSize } from './index';

const copy = {
  en: {
    tag: 'Tag',
    tagHint: 'Pick a tag or type a new one.',
    tags: ['Design', 'Design review', 'Research', 'Release notes', 'Roadmap', 'Accessibility', 'Arabic copy', 'Bug'],
    city: 'Destination',
    cityHint: 'Any city works. Suggestions come from your past trips.',
    error: 'Enter a destination.',
    loading: 'Loading suggestions',
  },
  ar: {
    tag: 'الوسم',
    tagHint: 'اختر وسم أو اكتب وسم جديد.',
    tags: ['التصميم', 'مراجعة التصميم', 'البحث', 'ملاحظات الإصدار', 'خطة العمل', 'إمكانية الوصول', 'النصوص العربية', 'خلل'],
    city: 'الوجهة',
    cityHint: 'تقدر تكتب أي مدينة. الاقتراحات من رحلاتك السابقة.',
    error: 'أدخل الوجهة.',
    loading: 'جار تحميل الاقتراحات',
  },
} as const;

const tagItems = (lang: 'en' | 'ar') => copy[lang].tags.map((label) => ({ value: label, label }));

function Tag({ size, shape, lang = 'en', defaultValue = '' }: { size?: AutocompleteSize; shape?: AutocompleteShape; lang?: 'en' | 'ar'; defaultValue?: string }) {
  const t = copy[lang];
  const [value, setValue] = useState(defaultValue);
  return (
    <Field label={t.tag} style={{ inlineSize: '16rem' }}>
      <Autocomplete size={size} shape={shape} items={tagItems(lang)} value={value} onValueChange={setValue} />
    </Field>
  );
}

export default function AutocompleteDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md, lg">
          <Tag size="sm" />
          <Tag size="md" defaultValue="Roadmap" />
          <Tag size="lg" />
        </DemoRow>
        <DemoRow label="shape pill">
          <Tag shape="pill" defaultValue="A new tag" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <Tag lang="ar" defaultValue="البحث" />
            <Tag lang="ar" shape="pill" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, no suggestions yet">
        <Field label={copy.en.tag} description={copy.en.tagHint} style={{ inlineSize: '16rem' }}>
          <Autocomplete items={[]} />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One suggestion">
        <Field label={copy.en.tag} style={{ inlineSize: '16rem' }}>
          <Autocomplete items={tagItems('en').slice(0, 1)} />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Many suggestions">
        <Field label={copy.en.tag} description={copy.en.tagHint} style={{ inlineSize: '16rem' }}>
          <Autocomplete items={tagItems('en')} defaultValue="Design" />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Too many suggestions, grouped">
        <DemoGrid min="16rem">
          <Field label={copy.en.city} description={copy.en.cityHint}>
            <Autocomplete items={citySections('en')} />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Field label={copy.en.tag} style={{ inlineSize: '18rem' }}>
          <Autocomplete items={[{ value: 'long', label: sample.en.long }, { value: 'word', label: sample.en.word }]} defaultValue={sample.en.long} />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Field label={copy.ar.city} description={copy.ar.cityHint} style={{ inlineSize: '18rem' }}>
          <Autocomplete items={[{ value: 'long', label: sample.ar.long }, { value: 'word', label: sample.ar.word }]} defaultValue={sample.ar.long} />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <Field label={copy.en.city} style={{ inlineSize: '16rem' }}>
          <Autocomplete items={[]} loading loadingLabel={copy.en.loading} defaultValue="Ri" />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Field label={copy.en.city} error={copy.en.error} required style={{ inlineSize: '16rem' }}>
          <Autocomplete items={citySections('en')} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={copy.en.tag} disabled style={{ inlineSize: '16rem' }}>
          <Autocomplete items={tagItems('en')} defaultValue="Research" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={copy.en.tag} readOnly style={{ inlineSize: '16rem' }}>
          <Autocomplete items={tagItems('en')} defaultValue="Research" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
