// The MultiSelect demo: the same cases, ids and copy as
// packages/react/src/components/MultiSelect/MultiSelect.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import type { ListBoxOption } from '../list-box/list-box';
import { cityOptions, citySections } from '../list-box/samples';
import { DsMultiSelect } from './multi-select';

const copy = {
  en: {
    labels: 'Labels',
    cities: 'Cities',
    hint: 'Tasks with any of these labels show on the board.',
    cityHint: 'The report covers sales in these cities.',
    error: 'Choose at least one city.',
    noLabels: 'No labels yet. Add one from Settings.',
    loading: 'Loading labels',
  },
  ar: {
    labels: 'التصنيفات',
    cities: 'المدن',
    hint: 'تظهر في اللوحة المهام اللي فيها أي تصنيف من هذي.',
    cityHint: 'التقرير يشمل المبيعات في هذي المدن.',
    error: 'اختر مدينة وحدة على الأقل.',
    noLabels: 'ما فيه تصنيفات. أضف تصنيف من الإعدادات.',
    loading: 'جار تحميل التصنيفات',
  },
} as const;

function labelOptions(lang: 'en' | 'ar'): ListBoxOption[] {
  return lang === 'en'
    ? [
        { value: 'design', label: 'Design' },
        { value: 'research', label: 'Research' },
        { value: 'copy', label: 'Copy' },
        { value: 'bug', label: 'Bug' },
        { value: 'legal', label: 'Legal review', disabled: true },
      ]
    : [
        { value: 'design', label: 'تصميم' },
        { value: 'research', label: 'بحث' },
        { value: 'copy', label: 'محتوى' },
        { value: 'bug', label: 'خلل' },
        { value: 'legal', label: 'مراجعة قانونية', disabled: true },
      ];
}

@Component({
  selector: 'ds-multi-select-demo',
  imports: [DEMO, DsTheme, DsField, DsMultiSelect, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md, lg">
          <ng-container [ngTemplateOutlet]="labelsTpl" [ngTemplateOutletContext]="{ size: 'sm' }" />
          <div dsField [label]="copy.en.labels" style="inline-size: 16rem;">
            <div dsMultiSelect size="md" [items]="labelsEn" [defaultValue]="['design', 'copy']" data-demo-trigger=""></div>
          </div>
          <ng-container [ngTemplateOutlet]="labelsTpl" [ngTemplateOutletContext]="{ size: 'lg', value: ['research'] }" />
        </div>
        <div data-demo="row" label="shape pill, summary count">
          <ng-container [ngTemplateOutlet]="labelsTpl" [ngTemplateOutletContext]="{ shape: 'pill', value: ['design'] }" />
          <ng-container [ngTemplateOutlet]="labelsTpl" [ngTemplateOutletContext]="{ summary: 'count', value: ['design', 'research', 'bug'] }" />
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsField [label]="copy.ar.labels" style="inline-size: 16rem;">
              <div dsMultiSelect [items]="labelsAr" [defaultValue]="['design', 'bug']"></div>
            </div>
            <div dsField [label]="copy.ar.labels" style="inline-size: 16rem;">
              <div dsMultiSelect summary="count" [items]="labelsAr" [defaultValue]="['design', 'research', 'copy']"></div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty">
        <div dsField [label]="copy.en.labels" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="[]" [empty]="copy.en.noLabels"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One option">
        <div dsField [label]="copy.en.labels" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="labelOne"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many options">
        <div dsField [label]="copy.en.cities" [description]="copy.en.cityHint" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="gulf" [defaultValue]="['doha', 'dubai']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many values, grouped options with search">
        <div dsField [label]="copy.en.cities" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="cities" [defaultValue]="['riyadh', 'jeddah', 'abha', 'dammam', 'doha', 'muscat']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsField [label]="sample.en.long" style="inline-size: 18rem;">
          <div dsMultiSelect [items]="longEn" [defaultValue]="['long', 'word']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <div dsField [label]="copy.ar.labels" [description]="copy.ar.hint" style="inline-size: 18rem;">
            <div dsMultiSelect [items]="longAr" [defaultValue]="['long']"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div dsField [label]="copy.en.labels" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="[]" loading [loadingLabel]="copy.en.loading"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Error">
        <div dsField [label]="copy.en.cities" [error]="copy.en.error" style="inline-size: 16rem;">
          <div dsMultiSelect [items]="gulf"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsField [label]="copy.en.labels" disabled style="inline-size: 16rem;">
          <div dsMultiSelect [items]="labelsEn" [defaultValue]="['design']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsField [label]="copy.en.labels" readOnly style="inline-size: 16rem;">
          <div dsMultiSelect [items]="labelsEn" [defaultValue]="['design', 'bug']"></div>
        </div>
      </section>
    </div>
    <ng-template #labelsTpl let-size="size" let-shape="shape" let-summary="summary" let-value="value">
      <div dsField [label]="copy.en.labels" style="inline-size: 16rem;">
        <div dsMultiSelect [size]="size ?? 'md'" [shape]="shape ?? 'default'" [summary]="summary ?? 'tags'" [items]="labelsEn" [defaultValue]="value ?? []"></div>
      </div>
    </ng-template>
  `,
})
export default class MultiSelectDemo {
  protected readonly copy = copy;
  protected readonly sample = sample;
  protected readonly labelsEn = labelOptions('en');
  protected readonly labelsAr = labelOptions('ar');
  protected readonly labelOne = labelOptions('en').slice(0, 1);
  protected readonly gulf = cityOptions('en', 'gulf');
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
