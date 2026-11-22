import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { isArabic } from '../Popover/FloatingLayer';
import { SearchField, type SearchFieldShape, type SearchFieldSize } from './index';

const sizes: SearchFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SearchFieldShape[] = ['default', 'pill'];

const words = {
  en: {
    items: sample.en.items,
    start: 'dr',
    folders: 'Search folders',
    none: 'No folders match.',
    sep: ', ',
    boards: 'Search boards',
    boardsAt: (size: string, shape: string) => `Search boards, ${size}, ${shape}`,
    launch: 'launch',
    members: 'Search members',
    filterMembers: 'Filter members',
    files: 'Search files',
    brand: 'brand',
    filterFiles: 'Filter files',
    spring: 'spring launch',
    layers: 'Search layers',
    layer: 'Rectangle 12 copy 4',
    assets: 'Search assets',
    hero: 'hero',
    filterAssets: 'Filter assets',
    long: sample.en.long,
    wordsLabel: 'Search words',
    word: sample.en.word,
    short: 's',
    minError: 'Type at least 2 letters of a name or an email.',
    omar: 'omar',
    later: 'Search opens once the team is set up.',
    saved: 'Saved search',
    savedQuery: 'status:open owner:me',
    shared: 'Shared by the team owner.',
  },
  ar: {
    items: sample.ar.items,
    start: 'الم',
    folders: 'البحث في المجلدات',
    none: 'ما فيه مجلدات مطابقة.',
    sep: '، ',
    boards: 'البحث في اللوحات',
    boardsAt: (size: string, shape: string) => `البحث في اللوحات، ${size}، ${shape === 'pill' ? 'كبسولة' : 'عادي'}`,
    launch: 'الإطلاق',
    members: 'البحث في الأعضاء',
    filterMembers: 'فلترة الأعضاء',
    files: 'البحث في الملفات',
    brand: 'الهوية',
    filterFiles: 'فلترة الملفات',
    spring: 'إطلاق الربيع',
    layers: 'البحث في الطبقات',
    layer: 'مستطيل 12 نسخة 4',
    assets: 'البحث في الأصول',
    hero: 'الواجهة',
    filterAssets: 'فلترة الأصول',
    long: sample.ar.long,
    wordsLabel: 'البحث في الكلمات',
    word: sample.ar.word,
    short: 'س',
    minError: 'اكتب حرفين على الأقل من الاسم أو البريد.',
    omar: 'عمر',
    later: 'البحث يشتغل بعد ما يجهز الفريق.',
    saved: 'البحث المحفوظ',
    savedQuery: 'الحالة:مفتوحة المالك:أنا',
    shared: 'شاركه مالك الفريق.',
  },
};

type Words = (typeof words)[keyof typeof words];

/** A search that filters a list as the person types. */
function FilteredList({ w }: { w: Words }) {
  const [query, setQuery] = useState(w.start);
  const shown = w.items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
      <SearchField aria-label={w.folders} placeholder={w.folders} value={query} onValueChange={setQuery} />
      <p data-demo="label">{shown.length === 0 ? w.none : shown.join(w.sep)}</p>
    </div>
  );
}

/** SearchField in every content case. The copy follows the page language: with lang=ar every case reads Arabic. */
export default function SearchFieldDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes and shapes">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="14rem">
            {sizes.map((size) => (
              <SearchField
                key={size}
                size={size}
                shape={shape}
                aria-label={w.boardsAt(size, shape)}
                placeholder={w.boards}
                defaultValue={size === 'xs' || size === 'lg' ? w.launch : ''}
              />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="14rem">
          <SearchField aria-label={w.members} placeholder={w.members} end={<IconButton icon="filter" label={w.filterMembers} size="xs" shape="pill" />} />
          <SearchField aria-label={w.files} defaultValue={w.brand} end={<IconButton icon="filter" label={w.filterFiles} size="xs" shape="pill" />} />
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <SearchField aria-label="البحث في اللوحات" placeholder="البحث في اللوحات" clearLabel="مسح البحث" />
            <SearchField aria-label="البحث في الملفات" defaultValue="الهوية" clearLabel="مسح البحث" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, placeholder only">
        <SearchField aria-label={w.boards} placeholder={w.boards} />
      </DemoCase>

      <DemoCase id="one" title="With a query">
        <SearchField aria-label={w.boards} defaultValue={w.spring} />
      </DemoCase>

      <DemoCase id="many" title="Filtering a list">
        <FilteredList w={w} />
      </DemoCase>

      <DemoCase id="too-many" title="Narrow container">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)', display: 'grid', gap: 'var(--ds-space-s)' }}>
          <SearchField size="sm" aria-label={w.layers} defaultValue={w.layer} />
          <SearchField size="sm" aria-label={w.assets} defaultValue={w.hero} end={<IconButton icon="filter" label={w.filterAssets} size="xs" shape="pill" />} />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long query">
        <SearchField aria-label={w.boards} defaultValue={w.long} />
        <SearchField aria-label={w.wordsLabel} defaultValue={w.word} />
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field label="البحث في اللوحات" description="ابحث بالاسم أو بالوسم، والنتائج تطلع لك وأنت تكتب.">
          <SearchField defaultValue={sample.ar.long} clearLabel="مسح البحث" />
        </Field>
        <SearchField aria-label="البحث" placeholder="ابحث في كل الملفات والمجلدات واللوحات المشتركة معك" clearLabel="مسح البحث" />
      </DemoCase>

      <DemoCase id="loading" title="Results on their way">
        <SearchField aria-label={w.boards} defaultValue={w.launch} loading />
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label={w.members} error={w.minError}>
          <SearchField defaultValue={w.short} />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label={w.members} disabled description={w.later}>
          <SearchField defaultValue={w.omar} />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label={w.saved} readOnly description={w.shared}>
          <SearchField defaultValue={w.savedQuery} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
