// The Switch demo: the same cases, ids and copy as
// packages/react/src/components/Switch/Switch.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsSwitch, type SwitchSize } from './switch';

const settings = [
  'Dark mode',
  'Show comments',
  'Snap to grid',
  'Show rulers',
  'Auto save',
  'Sounds',
  'Show hidden layers',
  'Spell check',
  'Keep the inspector open',
  'Show frame names',
  'Pixel grid',
  'Reduce motion',
];

@Component({
  selector: 'ds-switch-demo',
  imports: [DEMO, DsTheme, DsField, DsSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes and states">
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="size">
            <div dsSwitch [size]="size" [aria-label]="'Show rulers, ' + size"></div>
            <div dsSwitch [size]="size" [aria-label]="'Auto save, ' + size" defaultChecked></div>
            <div dsSwitch [size]="size" label="Snap to grid" defaultChecked [stateText]="onOff"></div>
          </div>
        }
        <div dsTheme lang="ar">
          <div data-demo="row" label="عربي">
            <div dsSwitch label="المحاذاة للشبكة" defaultChecked></div>
            <div dsSwitch label="الوضع الداكن" [stateText]="onOffAr"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="No visible label">
        <div data-demo="row">
          <div dsSwitch aria-label="Show comments"></div>
          <div dsSwitch aria-label="Show rulers" defaultChecked></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One switch with a description">
        <div dsSwitch
          label="Auto save"
          [description]="autoSave() ? 'Changes save as you work.' : 'Save changes yourself with Command S.'"
          [(checked)]="autoSave"></div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A short settings list">
        <div style="display: grid; gap: var(--ds-space-2xs);">
          @for (label of settings.slice(0, 4); track label; let i = $index) {
            <div dsSwitch [label]="label" [defaultChecked]="i % 2 === 0"></div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="A long settings list">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
          @for (label of settings; track label; let i = $index) {
            <div dsSwitch size="sm" [label]="label" [defaultChecked]="i % 3 === 0"></div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long label and description">
        <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
          <div dsSwitch [label]="sample.en.long" [description]="sample.en.long" [stateText]="onOff" defaultChecked></div>
          <div dsSwitch [label]="sample.en.word" size="lg"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
            <div dsSwitch label="الحفظ التلقائي" [description]="sample.ar.long" defaultChecked [stateText]="onOffAr"></div>
            <div dsSwitch label="مشاركة بيانات الاستخدام مع فريق الدعم لتحسين الخدمة" size="lg"></div>
            <div dsSwitch [label]="sample.ar.word"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div dsField error="Turn on two step sign in. Your workspace asks for it.">
          <div dsSwitch label="Two step sign in"></div>
        </div>
        <div dsTheme lang="ar">
          <div dsField error="لازم تشغل التحقق بخطوتين، مساحة العمل تطلبه.">
            <div dsSwitch label="التحقق بخطوتين"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <div dsSwitch label="Show rulers" disabled></div>
          <div dsSwitch label="Auto save" disabled defaultChecked></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row">
            <div dsSwitch label="الإشعارات" disabled defaultChecked></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div data-demo="row">
          <div dsSwitch label="Single sign on" readOnly defaultChecked description="Set by your workspace."></div>
          <div dsSwitch label="Guest access" readOnly></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row">
            <div dsSwitch label="الدخول الموحد" readOnly defaultChecked></div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class SwitchDemo {
  protected readonly sizes: SwitchSize[] = ['sm', 'md', 'lg'];
  protected readonly settings = settings;
  protected readonly sample = sample;
  protected readonly onOff = { on: 'On', off: 'Off' };
  protected readonly onOffAr = { on: 'مفعل', off: 'غير مفعل' };
  protected readonly autoSave = signal<boolean | undefined>(true);
}
