// The Select demo: the same cases, ids and copy as
// packages/react/src/components/Select/Select.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { cityOptions, citySections, sortOptions } from '../list-box/samples';
import { DsSelect, type SelectItem } from './select';

const copy = {
  en: {
    sort: 'Sort by',
    status: 'Status',
    city: 'City',
    hint: 'The board shows tasks in this order.',
    error: 'Choose a status for the task.',
    noStatus: 'No statuses yet. Add one from Settings.',
    loading: 'Loading statuses',
  },
  ar: {
    sort: 'الترتيب حسب',
    status: 'الحالة',
    city: 'المدينة',
    hint: 'تظهر المهام في اللوحة بهذا الترتيب.',
    error: 'اختر حالة للمهمة.',
    noStatus: 'ما فيه حالات. أضف حالة من الإعدادات.',
    loading: 'جار تحميل الحالات',
  },
} as const;

function statusOptions(lang: 'en' | 'ar'): SelectItem[] {
  return lang === 'en'
    ? [
        { value: 'todo', label: 'To do' },
        { value: 'doing', label: 'In progress' },
        { value: 'review', label: 'In review' },
        { value: 'done', label: 'Done' },
      ]
    : [
        { value: 'todo', label: 'جديدة' },
        { value: 'doing', label: 'قيد التنفيذ' },
        { value: 'review', label: 'قيد المراجعة' },
        { value: 'done', label: 'مكتملة' },
      ];
}

@Component({
  selector: 'ds-select-demo',
  imports: [DEMO, DsTheme, DsField, DsSelect, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md, lg">
          <ng-container [ngTemplateOutlet]="sortTpl" [ngTemplateOutletContext]="{ size: 'sm' }" />
          <div dsField [label]="copy.en.sort" style="inline-size: 14rem;">
            <button dsSelect size="md" [items]="sortEn" defaultValue="edited" data-demo-trigger=""></button>
          </div>
          <ng-container [ngTemplateOutlet]="sortTpl" [ngTemplateOutletContext]="{ size: 'lg' }" />
        </div>
        <div data-demo="row" label="shape pill">
          <ng-container [ngTemplateOutlet]="sortTpl" [ngTemplateOutletContext]="{ shape: 'pill', value: 'name' }" />
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsField [label]="copy.ar.sort" style="inline-size: 14rem;">
              <button dsSelect [items]="sortAr" defaultValue="owner"></button>
            </div>
            <div dsField [label]="copy.ar.sort" style="inline-size: 14rem;">
              <button dsSelect shape="pill" [items]="sortAr"></button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty">
        <div dsField [label]="copy.en.status" style="inline-size: 14rem;">
          <button dsSelect [items]="[]" [empty]="copy.en.noStatus"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One option">
        <div dsField [label]="copy.en.status" style="inline-size: 14rem;">
          <button dsSelect [items]="statusOne"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many options">
        <div dsField [label]="copy.en.status" [description]="copy.en.hint" style="inline-size: 14rem;">
          <button dsSelect [items]="statusEn" defaultValue="doing"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many options, grouped">
        <div dsField [label]="copy.en.city" style="inline-size: 14rem;">
          <button dsSelect [items]="cities" defaultValue="riyadh"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsField [label]="sample.en.long" style="inline-size: 16rem;">
          <button dsSelect [items]="longEn" defaultValue="long"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <div dsField [label]="copy.ar.status" [description]="copy.ar.hint" style="inline-size: 16rem;">
            <button dsSelect [items]="longAr" defaultValue="long"></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div dsField [label]="copy.en.status" style="inline-size: 14rem;">
          <button dsSelect [items]="[]" loading [loadingLabel]="copy.en.loading"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Error">
        <div dsField [label]="copy.en.status" [error]="copy.en.error" style="inline-size: 14rem;">
          <button dsSelect [items]="statusEn"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsField [label]="copy.en.city" disabled style="inline-size: 14rem;">
          <button dsSelect [items]="gulf" defaultValue="doha"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsField [label]="copy.en.city" readOnly style="inline-size: 14rem;">
          <button dsSelect [items]="gulf" defaultValue="doha"></button>
        </div>
      </section>
    </div>
    <ng-template #sortTpl let-size="size" let-shape="shape" let-value="value">
      <div dsField [label]="copy.en.sort" style="inline-size: 14rem;">
        <button dsSelect [size]="size ?? 'md'" [shape]="shape ?? 'default'" [items]="sortEn" [defaultValue]="value ?? null"></button>
      </div>
    </ng-template>
  `,
})
export default class SelectDemo {
  protected readonly copy = copy;
  protected readonly sample = sample;
  protected readonly sortEn = sortOptions('en');
  protected readonly sortAr = sortOptions('ar');
  protected readonly statusEn = statusOptions('en');
  protected readonly statusOne = statusOptions('en').slice(0, 1);
  protected readonly cities = citySections('en');
  protected readonly gulf = cityOptions('en', 'gulf');
  protected readonly longEn = [
    { value: 'long', label: sample.en.long },
    { value: 'word', label: sample.en.word },
  ];
  protected readonly longAr = [
    { value: 'long', label: sample.ar.long },
    { value: 'word', label: sample.ar.word },
  ];
}
