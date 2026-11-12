// The Combobox demo: the same cases, ids and copy as
// packages/react/src/components/Combobox/Combobox.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { cityOptions, citySections } from '../list-box/samples';
import { DsCombobox } from './combobox';

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

@Component({
  selector: 'ds-combobox-demo',
  imports: [DEMO, DsTheme, DsField, DsCombobox, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md, lg">
          <ng-container [ngTemplateOutlet]="city" [ngTemplateOutletContext]="{ size: 'sm' }" />
          <ng-container [ngTemplateOutlet]="city" [ngTemplateOutletContext]="{ size: 'md', value: 'jeddah' }" />
          <ng-container [ngTemplateOutlet]="city" [ngTemplateOutletContext]="{ size: 'lg' }" />
        </div>
        <div data-demo="row" label="shape pill">
          <ng-container [ngTemplateOutlet]="city" [ngTemplateOutletContext]="{ shape: 'pill', value: 'abha' }" />
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsField [label]="copy.ar.city" style="inline-size: 16rem;">
              <div dsCombobox [items]="sectionsAr" defaultValue="ahsa" [placeholder]="copy.ar.placeholder"></div>
            </div>
            <div dsField [label]="copy.ar.city" style="inline-size: 16rem;">
              <div dsCombobox shape="pill" [items]="sectionsAr" [placeholder]="copy.ar.placeholder"></div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty">
        <div dsField [label]="copy.en.city" style="inline-size: 16rem;">
          <div dsCombobox [items]="[]" [empty]="copy.en.noCities" [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One option">
        <div dsField [label]="copy.en.city" style="inline-size: 16rem;">
          <div dsCombobox [items]="oneCity" [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many options">
        <div dsField [label]="copy.en.city" [description]="copy.en.hint" style="inline-size: 16rem;">
          <div dsCombobox [items]="gulf" defaultValue="doha"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many options, grouped">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
          <ng-container [ngTemplateOutlet]="city" [ngTemplateOutletContext]="{ value: 'riyadh' }" />
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsField [label]="sample.en.long" style="inline-size: 18rem;">
          <div dsCombobox [items]="longEn" defaultValue="long"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <div dsField [label]="copy.ar.city" [description]="copy.ar.hint" style="inline-size: 18rem;">
            <div dsCombobox [items]="longAr" defaultValue="long"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div dsField [label]="copy.en.city" style="inline-size: 16rem;">
          <div dsCombobox [items]="[]" loading [loadingLabel]="copy.en.loading" [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Error">
        <div dsField [label]="copy.en.city" [error]="copy.en.error" style="inline-size: 16rem;">
          <div dsCombobox [items]="all" [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsField [label]="copy.en.city" disabled style="inline-size: 16rem;">
          <div dsCombobox [items]="all" defaultValue="riyadh"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsField [label]="copy.en.city" readOnly style="inline-size: 16rem;">
          <div dsCombobox [items]="all" defaultValue="riyadh"></div>
        </div>
      </section>
    </div>
    <ng-template #city let-size="size" let-shape="shape" let-lang="lang" let-value="value">
      @let t = copy[lang === 'ar' ? 'ar' : 'en'];
      <div dsField [label]="t.city" style="inline-size: 16rem;">
        <div dsCombobox [size]="size ?? 'md'" [shape]="shape ?? 'default'" [items]="lang === 'ar' ? sectionsAr : sectionsEn" [defaultValue]="value ?? null" [placeholder]="t.placeholder"></div>
      </div>
    </ng-template>
  `,
})
export default class ComboboxDemo {
  protected readonly sectionsEn = citySections('en');
  protected readonly sectionsAr = citySections('ar');
  protected readonly copy = copy;
  protected readonly sample = sample;
  protected readonly oneCity = cityOptions('en').slice(0, 1);
  protected readonly gulf = cityOptions('en', 'gulf');
  protected readonly all = cityOptions('en');
  protected readonly longEn = [
    { value: 'long', label: sample.en.long },
    { value: 'word', label: sample.en.word },
  ];
  protected readonly longAr = [
    { value: 'long', label: sample.ar.long },
    { value: 'word', label: sample.ar.word },
  ];
}
