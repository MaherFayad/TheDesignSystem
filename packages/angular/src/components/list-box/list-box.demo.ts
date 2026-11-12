// The ListBox demo: the same cases, ids and copy as
// packages/react/src/components/ListBox/ListBox.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsListBox, type ListBoxItem, type ListBoxValue } from './list-box';
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

@Component({
  selector: 'ds-list-box-demo',
  imports: [DEMO, DsTheme, DsListBox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md">
          <div dsListBox [attr.aria-label]="copy.en.sort" size="sm" [items]="sortEn" [(value)]="sortSm" style="inline-size: 16rem;"></div>
          <div dsListBox [attr.aria-label]="copy.en.sort" size="md" [items]="sortEn" [(value)]="sortMd" style="inline-size: 16rem;"></div>
        </div>
        <div data-demo="row" label="multiple, groups, a filtered list with marks">
          <div dsListBox [attr.aria-label]="copy.en.folders" selectionMode="multiple" [items]="foldersEn" [(value)]="folders" style="inline-size: 14rem;"></div>
          <div dsListBox [attr.aria-label]="copy.en.cities" [items]="filteredCities" defaultValue="jeddah" query="a" style="inline-size: 14rem;"></div>
        </div>
        <div data-demo="row" label="horizontal">
          <div dsListBox [attr.aria-label]="copy.en.sort" orientation="horizontal" [items]="sortShort" defaultValue="name"></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsListBox [attr.aria-label]="copy.ar.sort" [items]="sortAr" [(value)]="sortArValue" style="inline-size: 16rem;"></div>
            <div dsListBox [attr.aria-label]="copy.ar.folders" selectionMode="multiple" [items]="foldersAr" [(value)]="foldersArValue" style="inline-size: 14rem;"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty">
        <div dsListBox [attr.aria-label]="copy.en.cities" [items]="[]" [empty]="copy.en.noResults" style="inline-size: 16rem;"></div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One option">
        <div dsListBox [attr.aria-label]="copy.en.cities" [items]="one" style="inline-size: 16rem;"></div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many options">
        <div dsListBox [attr.aria-label]="copy.en.cities" [items]="gulfEn" defaultValue="doha" style="inline-size: 16rem;"></div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many options, the list scrolls inside">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
          <div dsListBox [attr.aria-label]="copy.en.cities" [items]="sectionsEn" defaultValue="abha"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsListBox [attr.aria-label]="copy.en.sort" [items]="longEn" defaultValue="long" style="inline-size: 18rem;"></div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <div dsListBox [attr.aria-label]="copy.ar.sort" [items]="longAr" defaultValue="long" style="inline-size: 18rem;"></div>
          <div dsListBox [attr.aria-label]="copy.ar.cities" [items]="sectionsAr" defaultValue="abha" query="ال" style="inline-size: 16rem;"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsListBox [attr.aria-label]="copy.en.sort" [items]="sortEn" defaultValue="name" disabled style="inline-size: 16rem;"></div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsListBox [attr.aria-label]="copy.en.sort" [items]="sortEn" defaultValue="owner" readOnly style="inline-size: 16rem;"></div>
      </section>
    </div>
  `,
})
export default class ListBoxDemo {
  protected readonly copy = copy;
  protected readonly sortEn = sortOptions('en');
  protected readonly sortAr = sortOptions('ar');
  protected readonly sortShort = sortOptions('en')
    .slice(0, 3)
    .map(({ description: _d, ...o }) => o);
  protected readonly foldersEn = sample.en.items.slice(0, 6).map((label) => ({ value: label, label }));
  protected readonly foldersAr = sample.ar.items.slice(0, 6).map((label) => ({ value: label, label }));
  protected readonly filteredCities: ListBoxItem[] = citySections('en').map((s) => ({
    ...s,
    options: s.options.filter((o) => /a/i.test(o.label)).slice(0, 3),
  }));
  protected readonly one = [{ value: 'riyadh', label: copy.en.one }];
  protected readonly gulfEn = cityOptions('en', 'gulf');
  protected readonly sectionsEn = citySections('en');
  protected readonly sectionsAr = citySections('ar');
  protected readonly longEn = [
    { value: 'long', label: sample.en.long, description: sample.en.short },
    { value: 'word', label: sample.en.word },
  ];
  protected readonly longAr = [
    { value: 'long', label: sample.ar.long, description: sample.ar.short },
    { value: 'word', label: sample.ar.word },
  ];
  protected readonly sortSm = signal<ListBoxValue | undefined>('edited');
  protected readonly sortMd = signal<ListBoxValue | undefined>('edited');
  protected readonly sortArValue = signal<ListBoxValue | undefined>('edited');
  protected readonly folders = signal<ListBoxValue | undefined>(['Inbox', 'Starred']);
  protected readonly foldersArValue = signal<ListBoxValue | undefined>(['الوارد', 'المميزة']);
}
