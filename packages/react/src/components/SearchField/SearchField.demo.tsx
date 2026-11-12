import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { SearchField, type SearchFieldShape, type SearchFieldSize } from './index';

const sizes: SearchFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SearchFieldShape[] = ['default', 'pill'];

/** A search that filters a list as the person types. */
function FilteredList() {
  const [query, setQuery] = useState('dr');
  const shown = sample.en.items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
      <SearchField aria-label="Search folders" placeholder="Search folders" value={query} onValueChange={setQuery} />
      <p data-demo="label">{shown.length === 0 ? 'No folders match.' : shown.join(', ')}</p>
    </div>
  );
}

/** SearchField in every content case. */
export default function SearchFieldDemo() {
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
                aria-label={`Search boards, ${size}, ${shape}`}
                placeholder="Search boards"
                defaultValue={size === 'xs' || size === 'lg' ? 'launch' : ''}
              />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="14rem">
          <SearchField aria-label="Search members" placeholder="Search members" end={<IconButton icon="filter" label="Filter members" size="xs" shape="pill" />} />
          <SearchField aria-label="Search files" defaultValue="brand" end={<IconButton icon="filter" label="Filter files" size="xs" shape="pill" />} />
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <SearchField aria-label="البحث في اللوحات" placeholder="البحث في اللوحات" clearLabel="مسح البحث" />
            <SearchField aria-label="البحث في الملفات" defaultValue="الهوية" clearLabel="مسح البحث" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, placeholder only">
        <SearchField aria-label="Search boards" placeholder="Search boards" />
      </DemoCase>

      <DemoCase id="one" title="With a query">
        <SearchField aria-label="Search boards" defaultValue="spring launch" />
      </DemoCase>

      <DemoCase id="many" title="Filtering a list">
        <FilteredList />
      </DemoCase>

      <DemoCase id="too-many" title="Narrow container">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)', display: 'grid', gap: 'var(--ds-space-s)' }}>
          <SearchField size="sm" aria-label="Search layers" defaultValue="Rectangle 12 copy 4" />
          <SearchField
            size="sm"
            aria-label="Search assets"
            defaultValue="hero"
            end={<IconButton icon="filter" label="Filter assets" size="xs" shape="pill" />}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long query">
        <SearchField aria-label="Search boards" defaultValue={sample.en.long} />
        <SearchField aria-label="Search words" defaultValue={sample.en.word} />
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field label="البحث في اللوحات" description="ابحث بالاسم أو بالوسم، والنتائج تطلع لك وأنت تكتب.">
          <SearchField defaultValue={sample.ar.long} clearLabel="مسح البحث" />
        </Field>
        <SearchField aria-label="البحث" placeholder="ابحث في كل الملفات والمجلدات واللوحات المشتركة معك" clearLabel="مسح البحث" />
      </DemoCase>

      <DemoCase id="loading" title="Results on their way">
        <SearchField aria-label="Search boards" defaultValue="launch" loading />
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="Search members" error="Type at least 2 letters of a name or an email.">
          <SearchField defaultValue="s" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Search members" disabled description="Search opens once the team is set up.">
          <SearchField defaultValue="omar" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="Saved search" readOnly description="Shared by the team owner.">
          <SearchField defaultValue="status:open owner:me" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
