// The Autocomplete demo: the same cases, ids and copy as
// packages/react/src/components/Autocomplete/Autocomplete.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { citySections } from '../list-box/samples';
import { DsAutocomplete } from './autocomplete';

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

@Component({
  selector: 'ds-autocomplete-demo',
  imports: [DEMO, DsTheme, DsField, DsAutocomplete, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md, lg">
          <ng-container [ngTemplateOutlet]="tag" [ngTemplateOutletContext]="{ size: 'sm' }" />
          <ng-container [ngTemplateOutlet]="tag" [ngTemplateOutletContext]="{ size: 'md', value: 'Roadmap' }" />
          <ng-container [ngTemplateOutlet]="tag" [ngTemplateOutletContext]="{ size: 'lg' }" />
        </div>
        <div data-demo="row" label="shape pill">
          <ng-container [ngTemplateOutlet]="tag" [ngTemplateOutletContext]="{ shape: 'pill', value: 'A new tag' }" />
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsField [label]="copy.ar.tag" style="inline-size: 16rem;">
              <div dsAutocomplete [items]="tagsAr" defaultValue="البحث"></div>
            </div>
            <div dsField [label]="copy.ar.tag" style="inline-size: 16rem;">
              <div dsAutocomplete shape="pill" [items]="tagsAr"></div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty, no suggestions yet">
        <div dsField [label]="copy.en.tag" [description]="copy.en.tagHint" style="inline-size: 16rem;">
          <div dsAutocomplete [items]="[]"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One suggestion">
        <div dsField [label]="copy.en.tag" style="inline-size: 16rem;">
          <div dsAutocomplete [items]="oneTag"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many suggestions">
        <div dsField [label]="copy.en.tag" [description]="copy.en.tagHint" style="inline-size: 16rem;">
          <div dsAutocomplete [items]="tagsEn" defaultValue="Design"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many suggestions, grouped">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          <div dsField [label]="copy.en.city" [description]="copy.en.cityHint">
            <div dsAutocomplete [items]="cities"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsField [label]="copy.en.tag" style="inline-size: 18rem;">
          <div dsAutocomplete [items]="longEn" [defaultValue]="sample.en.long"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <div dsField [label]="copy.ar.city" [description]="copy.ar.cityHint" style="inline-size: 18rem;">
            <div dsAutocomplete [items]="longAr" [defaultValue]="sample.ar.long"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div dsField [label]="copy.en.city" style="inline-size: 16rem;">
          <div dsAutocomplete [items]="[]" loading [loadingLabel]="copy.en.loading" defaultValue="Ri"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Error">
        <div dsField [label]="copy.en.city" [error]="copy.en.error" required style="inline-size: 16rem;">
          <div dsAutocomplete [items]="cities"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsField [label]="copy.en.tag" disabled style="inline-size: 16rem;">
          <div dsAutocomplete [items]="tagsEn" defaultValue="Research"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsField [label]="copy.en.tag" readOnly style="inline-size: 16rem;">
          <div dsAutocomplete [items]="tagsEn" defaultValue="Research"></div>
        </div>
      </section>
    </div>
    <ng-template #tag let-size="size" let-shape="shape" let-value="value">
      <div dsField [label]="copy.en.tag" style="inline-size: 16rem;">
        <div dsAutocomplete [size]="size ?? 'md'" [shape]="shape ?? 'default'" [items]="tagsEn" [defaultValue]="value ?? ''"></div>
      </div>
    </ng-template>
  `,
})
export default class AutocompleteDemo {
  protected readonly copy = copy;
  protected readonly sample = sample;
  protected readonly tagsEn = tagItems('en');
  protected readonly tagsAr = tagItems('ar');
  protected readonly oneTag = tagItems('en').slice(0, 1);
  protected readonly cities = citySections('en');
  protected readonly longEn = [
    { value: 'long', label: sample.en.long },
    { value: 'word', label: sample.en.word },
  ];
  protected readonly longAr = [
    { value: 'long', label: sample.ar.long },
    { value: 'word', label: sample.ar.word },
  ];
}
