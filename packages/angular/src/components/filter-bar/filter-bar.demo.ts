// The FilterBar demo: the same cases, ids and copy as
// packages/react/src/components/FilterBar/FilterBar.demo.tsx. React's LiveBar
// is a template here, with its state in signals of the page.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsIconButton } from '../icon-button/icon-button';
import { DsFilterBar, type FilterBarFilter, type FilterBarSearch } from './filter-bar';

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

/** The state of one live bar: its value, its query and the count they leave. */
function live(initial: string[]) {
  const value = signal<readonly string[] | undefined>(initial);
  const query = signal('');
  const count = computed(() => {
    const on = value() ?? [];
    const q = query().trim().toLowerCase();
    return files.filter((f) => on.every((v) => f.tags.includes(v)) && f.name.toLowerCase().includes(q)).length;
  });
  const search = computed<FilterBarSearch>(() => ({
    'aria-label': 'Search files',
    placeholder: 'Search files',
    value: query(),
    onValueChange: (v: string) => query.set(v),
  }));
  return { value, count, search };
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsIconButton, DsFilterBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #toggles>
      <button dsIconButton icon="grid" label="Show as grid" size="md" emphasis="ghost" aria-pressed="true"></button>
      <button dsIconButton icon="list" label="Show as list" size="md" emphasis="ghost" aria-pressed="false"></button>
    </ng-template>
    <ng-template #togglesSm>
      <button dsIconButton icon="grid" label="Show as grid" size="sm" emphasis="ghost" aria-pressed="true"></button>
      <button dsIconButton icon="list" label="Show as list" size="sm" emphasis="ghost" aria-pressed="false"></button>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes, and an Arabic row">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar size="sm" [search]="small.search()" [filters]="kinds" [more]="more" [(value)]="small.value" [resultCount]="small.count()" [end]="togglesSm"></div>
        <div dsFilterBar size="md" [search]="medium.search()" [filters]="kinds" [more]="more" [(value)]="medium.value" [resultCount]="medium.count()" [end]="toggles"></div>
        <div dsTheme [lang]="'ar'">
          <div dsFilterBar [search]="arSearch" [filters]="arKinds" [more]="arMore" [defaultValue]="['images']" [resultCount]="12" [end]="toggles"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Nothing on">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [search]="filesSearch" [filters]="kinds" [resultCount]="48"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One filter on">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [filters]="kinds" [defaultValue]="['images']" [resultCount]="9"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Chips and menu filters on">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [search]="launchSearch" [filters]="kinds" [more]="more" [defaultValue]="['boards', 'shared', 'starred', 'this-week']" [resultCount]="1" [end]="toggles"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="More chips than fit, in a narrow container">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsFilterBar size="sm" [search]="mailSearch" [filters]="mail" [defaultValue]="['Inbox']"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long labels">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [filters]="longFilters" [defaultValue]="['a']" [resultCount]="1204"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsFilterBar [search]="arMailSearch" [filters]="arMail" [defaultValue]="['الوارد', 'المهمة']" [resultCount]="3"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Results on their way">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [search]="loadingSearch" [filters]="kinds"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="A filter that does not apply">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsFilterBar [filters]="withDisabled" [resultCount]="48"></div>
      </div>
    </section>
  `,
})
export default class FilterBarDemo {
  protected readonly kinds = kinds;
  protected readonly more = more;
  protected readonly small = live([]);
  protected readonly medium = live(['boards']);
  protected readonly arSearch: FilterBarSearch = { 'aria-label': 'بحث في الملفات', placeholder: 'بحث في الملفات' };
  protected readonly arKinds: FilterBarFilter[] = [
    { value: 'boards', label: 'اللوحات' },
    { value: 'images', label: 'الصور' },
    { value: 'videos', label: 'الفيديوهات' },
    { value: 'shared', label: 'المشاركة معي' },
  ];
  protected readonly arMore: FilterBarFilter[] = [
    { value: 'starred', label: 'المميزة' },
    { value: 'archived', label: 'المؤرشفة' },
  ];
  protected readonly filesSearch: FilterBarSearch = { 'aria-label': 'Search files', placeholder: 'Search files' };
  protected readonly launchSearch: FilterBarSearch = { 'aria-label': 'Search files', placeholder: 'Search files', defaultValue: 'launch' };
  protected readonly mailSearch: FilterBarSearch = { 'aria-label': 'Search mail', placeholder: 'Search mail' };
  protected readonly mail: FilterBarFilter[] = sample.en.items.map((item) => ({ value: item, label: item }));
  protected readonly longFilters: FilterBarFilter[] = [
    { value: 'a', label: 'Shared with me by people outside my workspace' },
    { value: 'b', label: sample.en.word },
    { value: 'c', label: 'Edited in the last thirty days' },
  ];
  protected readonly arMailSearch: FilterBarSearch = { 'aria-label': 'بحث في البريد', placeholder: 'بحث في البريد' };
  protected readonly arMail: FilterBarFilter[] = sample.ar.items.map((item) => ({ value: item, label: item }));
  protected readonly loadingSearch: FilterBarSearch = { 'aria-label': 'Search files', placeholder: 'Search files', defaultValue: 'tour', loading: true };
  protected readonly withDisabled: FilterBarFilter[] = [...kinds.slice(0, 3), { value: 'shared', label: 'Shared with me', disabled: true }];
}
