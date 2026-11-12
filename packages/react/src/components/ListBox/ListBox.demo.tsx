import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { ListBox, type ListBoxSize } from './index';
import { cityOptions, citySections, sortOptions } from './samples';

const copy = {
  en: {
    sort: 'Sort by',
    cities: 'City',
    folders: 'Folders',
    noResults: 'No cities yet. Add one from Settings.',
    one: 'Riyadh',
  },
  ar: {
    sort: 'الترتيب حسب',
    cities: 'المدينة',
    folders: 'المجلدات',
    noResults: 'ما فيه مدن. أضف مدينة من الإعدادات.',
    one: 'الرياض',
  },
} as const;

function SortList({ size, lang = 'en' }: { size?: ListBoxSize; lang?: 'en' | 'ar' }) {
  const [value, setValue] = useState<string | null>('edited');
  return (
    <ListBox
      aria-label={copy[lang].sort}
      size={size}
      items={sortOptions(lang)}
      value={value}
      onValueChange={setValue}
      style={{ inlineSize: '16rem' }}
    />
  );
}

function FolderList({ lang = 'en' }: { lang?: 'en' | 'ar' }) {
  const [value, setValue] = useState<string[]>(lang === 'en' ? ['Inbox', 'Starred'] : ['الوارد', 'المميزة']);
  const items = sample[lang].items.slice(0, 6).map((label) => ({ value: label, label }));
  return (
    <ListBox
      aria-label={copy[lang].folders}
      selectionMode="multiple"
      items={items}
      value={value}
      onValueChange={setValue}
      style={{ inlineSize: '14rem' }}
    />
  );
}

export default function ListBoxDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="size sm, md">
          <SortList size="sm" />
          <SortList size="md" />
        </DemoRow>
        <DemoRow label="multiple, groups, a filtered list with marks">
          <FolderList />
          <ListBox
            aria-label={copy.en.cities}
            items={citySections('en').map((s) => ({ ...s, options: s.options.filter((o) => /a/i.test(o.label)).slice(0, 3) }))}
            defaultValue="jeddah"
            query="a"
            style={{ inlineSize: '14rem' }}
          />
        </DemoRow>
        <DemoRow label="horizontal">
          <ListBox
            aria-label={copy.en.sort}
            orientation="horizontal"
            items={sortOptions('en').slice(0, 3).map(({ description: _d, ...o }) => o)}
            defaultValue="name"
          />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="Arabic">
            <SortList lang="ar" />
            <FolderList lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <ListBox aria-label={copy.en.cities} items={[]} empty={copy.en.noResults} style={{ inlineSize: '16rem' }} />
      </DemoCase>

      <DemoCase id="one" title="One option">
        <ListBox aria-label={copy.en.cities} items={[{ value: 'riyadh', label: copy.en.one }]} style={{ inlineSize: '16rem' }} />
      </DemoCase>

      <DemoCase id="many" title="Many options">
        <ListBox aria-label={copy.en.cities} items={cityOptions('en', 'gulf')} defaultValue="doha" style={{ inlineSize: '16rem' }} />
      </DemoCase>

      <DemoCase id="too-many" title="Too many options, the list scrolls inside">
        <DemoGrid min="16rem">
          <ListBox aria-label={copy.en.cities} items={citySections('en')} defaultValue="abha" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <ListBox
          aria-label={copy.en.sort}
          items={[
            { value: 'long', label: sample.en.long, description: sample.en.short },
            { value: 'word', label: sample.en.word },
          ]}
          defaultValue="long"
          style={{ inlineSize: '18rem' }}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <ListBox
          aria-label={copy.ar.sort}
          items={[
            { value: 'long', label: sample.ar.long, description: sample.ar.short },
            { value: 'word', label: sample.ar.word },
          ]}
          defaultValue="long"
          style={{ inlineSize: '18rem' }}
        />
        <ListBox aria-label={copy.ar.cities} items={citySections('ar')} defaultValue="abha" query="ال" style={{ inlineSize: '16rem' }} />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <ListBox aria-label={copy.en.sort} items={sortOptions('en')} defaultValue="name" disabled style={{ inlineSize: '16rem' }} />
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <ListBox aria-label={copy.en.sort} items={sortOptions('en')} defaultValue="owner" readOnly style={{ inlineSize: '16rem' }} />
      </DemoCase>
    </DemoPage>
  );
}
