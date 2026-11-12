// The TagField demo: the same cases, ids and copy as
// packages/react/src/components/TagField/TagField.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DemoBidi } from '../field/demo-bidi';
import type { ListBoxOption } from '../list-box/list-box';
import { DsTagField } from './tag-field';

const copy = {
  en: {
    tags: 'Tags',
    placeholder: 'Add a tag',
    hint: 'Press Enter or type a comma to add a tag.',
    error: 'Add at least one tag.',
  },
  ar: {
    tags: 'الوسوم',
    placeholder: 'إضافة وسم',
    hint: 'اضغط Enter أو اكتب فاصلة لإضافة وسم.',
    error: 'أضف وسما واحدا على الأقل.',
  },
} as const;

function suggestions(lang: 'en' | 'ar'): ListBoxOption[] {
  const words =
    lang === 'en'
      ? ['Design', 'Research', 'Copy', 'Bug', 'Onboarding', 'Payments', 'Search', 'Settings']
      : ['تصميم', 'بحث', 'محتوى', 'خلل', 'تسجيل الدخول', 'المدفوعات', 'البحث', 'الإعدادات'];
  return words.map((label, i) => ({ value: `s${i}`, label }));
}

@Component({
  selector: 'ds-tag-field-demo',
  imports: [DEMO, DemoBidi, DsTheme, DsField, DsTagField, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" label="size sm, md, lg">
          <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ size: 'sm', value: ['Design'] }" />
          <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ size: 'md', value: ['Design', 'Copy'], suggest: true }" />
          <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ size: 'lg', value: ['Research'] }" />
        </div>
        <div data-demo="row" label="shape pill">
          <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ shape: 'pill', value: ['Bug'] }" />
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="Arabic">
            <div dsField [label]="copy.ar.tags" style="inline-size: 18rem;">
              <div dsTagField [defaultValue]="['تصميم', 'بحث']" [placeholder]="copy.ar.placeholder" [suggestions]="suggestAr"></div>
            </div>
            <div dsField [label]="copy.ar.tags" style="inline-size: 18rem;">
              <div dsTagField shape="pill" [placeholder]="copy.ar.placeholder"></div>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Empty">
        <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ suggest: true }" />
      </section>

      <section data-demo="case" data-demo-case="one" heading="One tag">
        <ng-container [ngTemplateOutlet]="tagsTpl" [ngTemplateOutletContext]="{ value: ['Design'] }" />
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many tags">
        <div dsField [label]="copy.en.tags" [description]="copy.en.hint" style="inline-size: 18rem;">
          <div dsTagField [defaultValue]="['Design', 'Research', 'Copy', 'Bug']" [placeholder]="copy.en.placeholder" [suggestions]="suggestEn"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many tags, wrapping">
        <div dsField [label]="copy.en.tags" style="inline-size: 18rem;">
          <div dsTagField [defaultValue]="tooMany" [placeholder]="copy.en.placeholder" [max]="12"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div dsField [label]="copy.en.tags" style="inline-size: 18rem;">
          <div dsTagField [defaultValue]="[sample.en.long, sample.en.word]" [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme lang="ar" data-demo="content">
          <!-- The Latin run "Enter" sits inside Arabic copy, so the hint goes through Bidi, as React. -->
          <ng-template #arHint><span data-ds="bidi" [text]="copy.ar.hint"></span></ng-template>
          <div dsField [label]="copy.ar.tags" [description]="arHint" style="inline-size: 18rem;">
            <div dsTagField [defaultValue]="[sample.ar.long, sample.ar.word]" [placeholder]="copy.ar.placeholder"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Error">
        <div dsField [label]="copy.en.tags" [error]="copy.en.error" style="inline-size: 18rem;">
          <div dsTagField [placeholder]="copy.en.placeholder"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsField [label]="copy.en.tags" disabled style="inline-size: 18rem;">
          <div dsTagField [defaultValue]="['Design', 'Copy']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div dsField [label]="copy.en.tags" readOnly style="inline-size: 18rem;">
          <div dsTagField [defaultValue]="['Design', 'Copy']"></div>
        </div>
      </section>
    </div>
    <ng-template #tagsTpl let-size="size" let-shape="shape" let-value="value" let-suggest="suggest">
      <div dsField [label]="copy.en.tags" style="inline-size: 18rem;">
        <div dsTagField [size]="size ?? 'md'" [shape]="shape ?? 'default'" [defaultValue]="value ?? []" [placeholder]="copy.en.placeholder" [suggestions]="suggest ? suggestEn : undefined"></div>
      </div>
    </ng-template>
  `,
})
export default class TagFieldDemo {
  protected readonly copy = copy;
  protected readonly sample = sample;
  protected readonly suggestEn = suggestions('en');
  protected readonly suggestAr = suggestions('ar');
  protected readonly tooMany = ['Design', 'Research', 'Copy', 'Bug', 'Onboarding', 'Payments', 'Search', 'Settings', 'Billing', 'Reports'];
}
