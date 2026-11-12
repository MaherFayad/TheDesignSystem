import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import type { ListBoxOption } from '../ListBox';
import { TagField, type TagFieldShape, type TagFieldSize } from './index';

const copy = {
  en: {
    tags: 'Tags',
    placeholder: 'Add a tag',
    hint: 'Press Enter or type a comma to add a tag.',
    error: 'Add at least one tag.',
  },
  ar: {
    tags: 'الوسوم',
    placeholder: 'إضافة وسم',
    hint: 'اضغط Enter أو اكتب فاصلة لإضافة وسم.',
    error: 'أضف وسم واحد على الأقل.',
  },
} as const;

function suggestions(lang: 'en' | 'ar'): ListBoxOption[] {
  const words =
    lang === 'en'
      ? ['Design', 'Research', 'Copy', 'Bug', 'Onboarding', 'Payments', 'Search', 'Settings']
      : ['تصميم', 'بحث', 'محتوى', 'خلل', 'تسجيل الدخول', 'المدفوعات', 'البحث', 'الإعدادات'];
  return words.map((label, i) => ({ value: `s${i}`, label }));
}

function Tags({
  size,
  shape,
  lang = 'en',
  defaultValue = [],
  withSuggestions = false,
}: {
  size?: TagFieldSize;
  shape?: TagFieldShape;
  lang?: 'en' | 'ar';
  defaultValue?: string[];
  withSuggestions?: boolean;
}) {
  const t = copy[lang];
  const [value, setValue] = useState<string[]>(defaultValue);
  return (
    <Field label={t.tags} style={{ inlineSize: '18rem' }}>
      <TagField
        size={size}
        shape={shape}
        value={value}
        onValueChange={setValue}
        placeholder={t.placeholder}
        suggestions={withSuggestions ? suggestions(lang) : undefined}
      />
    </Field>
  );
}

export default function TagFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md, lg">
          <Tags size="sm" defaultValue={['Design']} />
          <Tags size="md" defaultValue={['Design', 'Copy']} withSuggestions />
          <Tags size="lg" defaultValue={['Research']} />
        </DemoRow>
        <DemoRow label="shape pill">
          <Tags shape="pill" defaultValue={['Bug']} />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <Tags lang="ar" defaultValue={['تصميم', 'بحث']} withSuggestions />
            <Tags lang="ar" shape="pill" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Tags withSuggestions />
      </DemoCase>

      <DemoCase id="one" title="One tag">
        <Tags defaultValue={['Design']} />
      </DemoCase>

      <DemoCase id="many" title="Many tags">
        <Field label={copy.en.tags} description={copy.en.hint} style={{ inlineSize: '18rem' }}>
          <TagField defaultValue={['Design', 'Research', 'Copy', 'Bug']} placeholder={copy.en.placeholder} suggestions={suggestions('en')} />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Too many tags, wrapping">
        <Field label={copy.en.tags} style={{ inlineSize: '18rem' }}>
          <TagField
            defaultValue={['Design', 'Research', 'Copy', 'Bug', 'Onboarding', 'Payments', 'Search', 'Settings', 'Billing', 'Reports']}
            placeholder={copy.en.placeholder}
            max={12}
          />
        </Field>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Field label={copy.en.tags} style={{ inlineSize: '18rem' }}>
          <TagField defaultValue={[sample.en.long, sample.en.word]} placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Field label={copy.ar.tags} description={copy.ar.hint} style={{ inlineSize: '18rem' }}>
          <TagField defaultValue={[sample.ar.long, sample.ar.word]} placeholder={copy.ar.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Field label={copy.en.tags} error={copy.en.error} style={{ inlineSize: '18rem' }}>
          <TagField placeholder={copy.en.placeholder} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={copy.en.tags} disabled style={{ inlineSize: '18rem' }}>
          <TagField defaultValue={['Design', 'Copy']} />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={copy.en.tags} readOnly style={{ inlineSize: '18rem' }}>
          <TagField defaultValue={['Design', 'Copy']} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
