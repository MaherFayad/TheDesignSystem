// The Button demo: the same cases, ids and copy as
// packages/react/src/components/Button/Button.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from './button';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from './button-base';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** The tone labels as noun forms in white Saudi dialect, no diacritics. */
const toneLabelAr: Record<ButtonTone, string> = {
  neutral: 'حفظ المسودة',
  accent: 'نشر الصفحة',
  danger: 'حذف المشروع',
  success: 'اعتماد التعديل',
  warning: 'إعادة الترتيب',
  info: 'فتح الدليل',
};

const toneLabel: Record<ButtonTone, string> = {
  neutral: 'Save draft',
  accent: 'Publish page',
  danger: 'Delete project',
  success: 'Approve change',
  warning: 'Reset layout',
  info: 'Open guide',
};

const actions = [
  'Save changes',
  'Add file',
  'Share board',
  'Invite people',
  'Export kit',
  'Rename page',
  'Move folder',
  'Copy link',
  'Archive thread',
  'Download report',
  'Open settings',
  'Delete project',
];

const actionsAr = [
  'حفظ التغييرات',
  'إضافة ملف',
  'مشاركة اللوحة',
  'دعوة الفريق',
  'تصدير الحزمة',
  'تغيير الاسم',
  'نقل المجلد',
  'نسخ الرابط',
  'أرشفة المحادثة',
  'تنزيل التقرير',
  'فتح الإعدادات',
  'حذف المشروع',
];

@Component({
  // The host is the demo page element itself, so the gallery adds no wrapper.
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: each tone in solid, soft, outline, ghost and link">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            @for (emphasis of emphases; track emphasis) {
              <button dsButton [tone]="tone" [emphasis]="emphasis">{{ toneLabel[tone] }}</button>
            }
          </div>
        }
        <div data-demo="row" [label]="'Primary action'">
          <button dsButton tone="accent" emphasis="solid" end="arrow-forward">Create board</button>
          <button dsButton>Cancel edit</button>
          <button dsButton emphasis="ghost">Skip step</button>
        </div>
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <button dsButton [size]="size" tone="accent" emphasis="solid">Publish page</button>
            <button dsButton [size]="size">Save draft</button>
            <button dsButton [size]="size" emphasis="outline" start="plus">Add file</button>
            <button dsButton [size]="size" emphasis="ghost" end="chevron-down">Sort items</button>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <button dsButton [shape]="shape" tone="accent" emphasis="solid">Publish page</button>
            <button dsButton [shape]="shape">Save draft</button>
            <button dsButton [shape]="shape" emphasis="outline">Share board</button>
          </div>
        }
        <div data-demo="row" [label]="'With icons'">
          <button dsButton start="download">Download report</button>
          <button dsButton end="external" emphasis="outline">Open docs</button>
          <button dsButton start="chevron-back" emphasis="ghost">Open previous page</button>
          <button dsButton end="chevron-forward" tone="accent" emphasis="solid">Open next page</button>
          <button dsButton start="trash" tone="danger">Delete file</button>
        </div>
        <div data-demo="row" [label]="'As a link'">
          <a dsButton href="#pricing" tone="accent" emphasis="solid" end="arrow-forward">See pricing</a>
          <a dsButton href="#docs" emphasis="link">Read the guide</a>
        </div>
        <div data-demo="row" [label]="'Full width'">
          <button dsButton fullWidth tone="accent" emphasis="solid">Create account</button>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (tone of tones; track tone) {
            <div data-demo="row" [label]="tone">
              @for (emphasis of emphases; track emphasis) {
                <button dsButton [tone]="tone" [emphasis]="emphasis">{{ toneLabelAr[tone] }}</button>
              }
            </div>
          }
          <div data-demo="row" [label]="'Sizes'">
            @for (size of sizes; track size) {
              <button dsButton [size]="size" tone="accent" emphasis="solid" start="plus">إضافة ملف</button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One button">
        <div data-demo="row">
          <button dsButton tone="accent" emphasis="solid">Save changes</button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many buttons">
        <div data-demo="row">
          <button dsButton tone="accent" emphasis="solid">Save changes</button>
          <button dsButton>Preview page</button>
          <button dsButton emphasis="outline">Share board</button>
          <button dsButton emphasis="ghost">Discard edits</button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many buttons, the row wraps">
        <div data-demo="row">
          @for (label of actions; track label; let i = $index) {
            <button dsButton [tone]="i === 0 ? 'accent' : 'neutral'" [emphasis]="i === 0 ? 'solid' : 'soft'">{{ label }}</button>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <button dsButton tone="accent" emphasis="solid" start="upload">Upload every file in this folder and replace the older versions on the board</button>
        </div>
        <div data-demo="row" [label]="'Squeezed, ends in an ellipsis'">
          <div style="max-inline-size: var(--ds-menu-width-min);">
            <button dsButton end="arrow-forward">Download the full report with every comment and reference</button>
          </div>
        </div>
        <div data-demo="row" [label]="'wrap'">
          <div style="max-inline-size: var(--ds-menu-width-min);">
            <button dsButton wrap end="arrow-forward">Download the full report with every comment and reference</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          @for (label of actionsAr.slice(0, 4); track label; let i = $index) {
            <button dsButton [tone]="i === 0 ? 'accent' : 'neutral'" [emphasis]="i === 0 ? 'solid' : 'soft'">{{ label }}</button>
          }
        </div>
        <div data-demo="row">
          <button dsButton tone="accent" emphasis="solid" size="lg" end="arrow-forward">حفظ التغييرات ومشاركة اللوحة مع كل أعضاء الفريق</button>
          <button dsButton size="lg" start="chevron-back">رجوع</button>
        </div>
        <div data-demo="row">
          @for (label of actionsAr; track label) {
            <button dsButton size="sm">{{ label }}</button>
          }
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div data-demo="row">
          <span dsTheme [lang]="'ar'">
            <button dsButton loading loadingLabel="جار الحفظ" tone="accent" emphasis="solid">حفظ التغييرات</button>
          </span>
          <button dsButton loading tone="accent" emphasis="solid">Save changes</button>
          <button dsButton loading>Export kit</button>
          <button dsButton loading emphasis="outline" start="upload">Upload file</button>
          <button dsButton loading tone="danger" emphasis="solid">Delete project</button>
          <button dsButton loading size="lg" tone="accent" emphasis="solid">Create board</button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Result: success and error">
        <div data-demo="row">
          <button dsButton result="success" resultLabel="Saved" tone="accent" emphasis="solid">Save changes</button>
          <button dsButton result="error" resultLabel="Could not save">Save changes</button>
          <span dsTheme [lang]="'ar'">
            <button dsButton result="success" resultLabel="تم الحفظ" tone="accent" emphasis="solid">حفظ التغييرات</button>
          </span>
          <span dsTheme [lang]="'ar'">
            <button dsButton result="error" resultLabel="تعذر الحفظ" size="lg">حفظ التغييرات</button>
          </span>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsButton disabled tone="accent" emphasis="solid">Publish page</button>
          <button dsButton disabled>Save draft</button>
          <button dsButton disabled emphasis="outline">Share board</button>
          <button dsButton disabled emphasis="ghost">Skip step</button>
          <button dsButton disabled tone="danger">Delete project</button>
        </div>
      </section>
  `,
})
export default class ButtonDemo {
  protected readonly tones = tones;
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly toneLabel = toneLabel;
  protected readonly toneLabelAr = toneLabelAr;
  protected readonly actions = actions;
  protected readonly actionsAr = actionsAr;
}
