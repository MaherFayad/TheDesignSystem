// The InlineEdit demo: the same cases, ids and copy as
// packages/react/src/components/InlineEdit/InlineEdit.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsInlineEdit, type InlineEditSize } from './inline-edit';

const sizes: InlineEditSize[] = ['xs', 'sm', 'md', 'lg'];

const required = (value: string) => (value.trim() === '' ? 'Add a name of at least 1 letter.' : undefined);
const requiredAr = (value: string) => (value.trim() === '' ? 'اكتب اسم من حرف واحد على الأقل.' : undefined);

const boards = ['Spring launch', 'Brand refresh', 'Pricing page', 'Onboarding emails', 'Q3 roadmap', 'Team offsite'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsInlineEdit, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes">
      <div data-demo="row">
        @for (size of sizes; track size) {
          <div dsInlineEdit [size]="size" label="Board name" [value]="'Spring launch, ' + size" [validate]="required"></div>
        }
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="عربي">
          <div
            dsInlineEdit
            label="اسم اللوحة"
            value="إطلاق الربيع"
            [validate]="requiredAr"
            editLabel="تعديل اسم اللوحة"
            saveLabel="حفظ التغييرات"
            cancelLabel="إلغاء التغييرات"
            savedLabel="تم الحفظ"
            placeholder="إضافة اسم"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, shows the placeholder">
      <div dsInlineEdit label="Board name" placeholder="Add a board name"></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One value">
      <div dsInlineEdit label="Board name" value="Spring launch" [validate]="required"></div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A list of names">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
        @for (board of boards; track board) {
          <div dsInlineEdit size="sm" label="Board name" [value]="board" [validate]="required"></div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long value in a narrow container">
      <div style="max-inline-size: var(--ds-dialog-width-sm);">
        <div dsInlineEdit label="Board name" [value]="sample.en.long"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div
            dsInlineEdit
            label="اسم اللوحة"
            [value]="sample.ar.long"
            editLabel="تعديل اسم اللوحة"
            saveLabel="حفظ التغييرات"
            cancelLabel="إلغاء التغييرات"
            savedLabel="تم الحفظ"
            placeholder="إضافة اسم"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message, open and closed">
      <div dsInlineEdit label="Board name" value="Spring launch" defaultEditing error="A board with this name exists. Add a word, for example Spring launch 2."></div>
      <div dsInlineEdit label="Board name" value="Spring launch" error="A board with this name exists. Add a word, for example Spring launch 2."></div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsInlineEdit label="Board name" value="Spring launch" disabled></div>
    </section>
  `,
})
export default class InlineEditDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly boards = boards;
  protected readonly required = required;
  protected readonly requiredAr = requiredAr;
}
