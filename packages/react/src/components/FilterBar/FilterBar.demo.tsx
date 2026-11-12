import { useMemo, useState } from 'react';
import { Theme } from '../../theme';
import { DemoCase, DemoPage, sample } from '../../demo';
import { IconButton } from '../IconButton';
import { FilterBar, type FilterBarFilter, type FilterBarSize } from './index';

const kinds: FilterBarFilter[] = [
  { value: 'boards', label: 'Boards' },
  { value: 'images', label: 'Images' },
  { value: 'videos', label: 'Videos' },
  { value: 'shared', label: 'Shared with me' },
];

const more: FilterBarFilter[] = [
  { value: 'starred', label: 'Starred' },
  { value: 'archived', label: 'Archived' },
  { value: 'this-week', label: 'Edited this week' },
];

const files = [
  { name: 'Spring launch', tags: ['boards', 'shared', 'this-week'] },
  { name: 'Hero photo', tags: ['images', 'starred'] },
  { name: 'Product tour', tags: ['videos', 'shared'] },
  { name: 'Moodboard', tags: ['boards', 'images'] },
  { name: 'Old campaign', tags: ['boards', 'archived'] },
  { name: 'Logo sketches', tags: ['images', 'this-week'] },
];

/** Grid or list: one pressed at a time, wired to state so the demo does not show a toggle that lies. */
function ViewToggles({ size = 'md' }: { size?: FilterBarSize }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  return (
    <>
      <IconButton icon="grid" label="Show as grid" size={size} emphasis="ghost" aria-pressed={view === 'grid'} onClick={() => setView('grid')} />
      <IconButton icon="list" label="Show as list" size={size} emphasis="ghost" aria-pressed={view === 'list'} onClick={() => setView('list')} />
    </>
  );
}

function LiveBar({ size, initial = [] }: { size?: FilterBarSize; initial?: string[] }) {
  const [value, setValue] = useState<string[]>(initial);
  const [query, setQuery] = useState('');
  const count = useMemo(
    () => files.filter((f) => value.every((v) => f.tags.includes(v)) && f.name.toLowerCase().includes(query.trim().toLowerCase())).length,
    [value, query],
  );
  return (
    <FilterBar
      size={size}
      search={{ 'aria-label': 'Search files', placeholder: 'Search files', value: query, onValueChange: setQuery }}
      filters={kinds}
      more={more}
      value={value}
      onValueChange={setValue}
      resultCount={count}
      end={<ViewToggles size={size} />}
    />
  );
}

/** FilterBar in every content case that applies. Error and read only do not apply: a filter row has no invalid value and is never locked. */
export default function FilterBarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, and an Arabic row" lang="en">
        <LiveBar size="sm" />
        <LiveBar size="md" initial={['boards']} />
        <Theme lang="ar">
          <FilterBar
            search={{ 'aria-label': 'بحث في الملفات', placeholder: 'بحث في الملفات' }}
            filters={[
              { value: 'boards', label: 'اللوحات' },
              { value: 'images', label: 'الصور' },
              { value: 'videos', label: 'الفيديوهات' },
              { value: 'shared', label: 'المشاركة معي' },
            ]}
            more={[
              { value: 'starred', label: 'المميزة' },
              { value: 'archived', label: 'المؤرشفة' },
            ]}
            defaultValue={['images']}
            resultCount={12}
            end={<ViewToggles />}
          />
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Nothing on" lang="en">
        <FilterBar search={{ 'aria-label': 'Search files', placeholder: 'Search files' }} filters={kinds} resultCount={48} />
      </DemoCase>

      <DemoCase id="one" title="One filter on" lang="en">
        <FilterBar filters={kinds} defaultValue={['images']} resultCount={9} />
      </DemoCase>

      <DemoCase id="many" title="Chips and menu filters on" lang="en">
        <FilterBar
          search={{ 'aria-label': 'Search files', placeholder: 'Search files', defaultValue: 'launch' }}
          filters={kinds}
          more={more}
          defaultValue={['boards', 'shared', 'starred', 'this-week']}
          resultCount={1}
          end={<ViewToggles />}
        />
      </DemoCase>

      <DemoCase id="too-many" title="More chips than fit, in a narrow container" lang="en">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <FilterBar
            size="sm"
            search={{ 'aria-label': 'Search mail', placeholder: 'Search mail' }}
            filters={sample.en.items.map((item) => ({ value: item, label: item }))}
            defaultValue={['Inbox']}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long labels" lang="en">
        <FilterBar
          filters={[
            { value: 'a', label: 'Shared with me by people outside my workspace' },
            { value: 'b', label: sample.en.word },
            { value: 'c', label: 'Edited in the last thirty days' },
          ]}
          defaultValue={['a']}
          resultCount={1204}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <FilterBar
          search={{ 'aria-label': 'بحث في البريد', placeholder: 'بحث في البريد' }}
          filters={sample.ar.items.map((item) => ({ value: item, label: item }))}
          defaultValue={['الوارد', 'المهمة']}
          resultCount={3}
        />
      </DemoCase>

      <DemoCase id="loading" title="Results on their way" lang="en">
        <FilterBar search={{ 'aria-label': 'Search files', placeholder: 'Search files', defaultValue: 'tour', loading: true }} filters={kinds} />
      </DemoCase>

      <DemoCase id="disabled" title="A filter that does not apply" lang="en">
        <FilterBar filters={[...kinds.slice(0, 3), { value: 'shared', label: 'Shared with me', disabled: true }]} resultCount={48} />
      </DemoCase>
    </DemoPage>
  );
}
