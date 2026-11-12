// The Checkbox demo: the same cases, ids and copy as
// packages/react/src/components/Checkbox/Checkbox.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsCheckbox, type CheckboxCheckedState, type CheckboxSize, type CheckboxTone } from './checkbox';

const settings = [
  'Email me a weekly summary',
  'Show comments on the canvas',
  'Snap frames to the grid',
  'Show rulers',
  'Open links in a new tab',
  'Play sounds for mentions',
  'Show hidden layers',
  'Use system fonts in previews',
  'Keep the inspector open',
  'Ask before closing a board',
  'Show frame names',
  'Show the pixel grid',
];

@Component({
  selector: 'ds-checkbox-demo',
  imports: [DEMO, DsTheme, DsField, DsCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, tones and states">
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="size">
            @for (tone of tones; track tone) {
              @for (state of states; track $index) {
                <div dsCheckbox [size]="size" [tone]="tone" [defaultChecked]="state" [aria-label]="tone + ' ' + size + ' ' + state"></div>
              }
            }
          </div>
        }
        <div data-demo="row" label="Label">
          <div dsCheckbox label="Snap frames to the grid" [defaultChecked]="true"></div>
          <div dsCheckbox label="Show rulers" tone="accent" [defaultChecked]="true"></div>
          <div dsCheckbox label="Delete the old versions" tone="danger" defaultChecked="indeterminate"></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row" label="عربي">
            <div dsCheckbox label="محاذاة الإطارات للشبكة" [defaultChecked]="true"></div>
            <div dsCheckbox label="عرض المساطر" tone="accent" [defaultChecked]="true"></div>
            <div dsCheckbox label="حذف النسخ القديمة" tone="danger" defaultChecked="indeterminate"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="No visible label">
        <div data-demo="row">
          <div dsCheckbox aria-label="Select the row"></div>
          <div dsCheckbox aria-label="Select every row" defaultChecked="indeterminate"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One checkbox with a description">
        <div dsCheckbox label="Email me a weekly summary" description="One email on Sunday with the boards you follow." [defaultChecked]="true"></div>
        <div dsCheckbox label="Send me product news" [(checked)]="news"></div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A short list">
        <div style="display: grid; gap: var(--ds-space-2xs);">
          @for (label of settings.slice(0, 4); track label; let i = $index) {
            <div dsCheckbox [label]="label" [defaultChecked]="i % 2 === 0"></div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="A long list in two columns">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
          @for (label of settings; track label; let i = $index) {
            <div dsCheckbox size="sm" [label]="label" [defaultChecked]="i % 3 === 0"></div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long label and description">
        <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
          <div dsCheckbox [label]="sample.en.long" [description]="sample.en.long" [defaultChecked]="true"></div>
          <div dsCheckbox [label]="sample.en.word" size="lg"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
            <div dsCheckbox label="ملخص أسبوعي على البريد" [description]="sample.ar.long" [defaultChecked]="true"></div>
            <div dsCheckbox label="الموافقة على شروط الاستخدام وسياسة الخصوصية" tone="accent" size="lg"></div>
            <div dsCheckbox [label]="sample.ar.word" defaultChecked="indeterminate"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div dsField error="Agree to the terms to create the workspace." required>
          <div dsCheckbox label="I agree to the terms of use"></div>
        </div>
        <div dsTheme lang="ar">
          <div dsField error="لازم توافق على الشروط عشان تنشئ مساحة العمل." required>
            <div dsCheckbox label="الموافقة على شروط الاستخدام"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <div dsCheckbox label="Off" disabled></div>
          <div dsCheckbox label="On" disabled [defaultChecked]="true" tone="accent"></div>
          <div dsCheckbox label="Some" disabled defaultChecked="indeterminate"></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row">
            <div dsCheckbox label="الإشعارات" disabled [defaultChecked]="true"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div data-demo="row">
          <div dsCheckbox label="Two step sign in" readOnly [defaultChecked]="true"></div>
          <div dsCheckbox label="Single sign on" readOnly></div>
          <div dsCheckbox label="Some members" readOnly defaultChecked="indeterminate" tone="accent"></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row">
            <div dsCheckbox label="التحقق بخطوتين" readOnly [defaultChecked]="true"></div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class CheckboxDemo {
  protected readonly sizes: CheckboxSize[] = ['sm', 'md', 'lg'];
  protected readonly tones: CheckboxTone[] = ['neutral', 'accent', 'danger'];
  protected readonly states: CheckboxCheckedState[] = [false, true, 'indeterminate'];
  protected readonly settings = settings;
  protected readonly sample = sample;
  protected readonly news = signal<CheckboxCheckedState | undefined>(true);
}
