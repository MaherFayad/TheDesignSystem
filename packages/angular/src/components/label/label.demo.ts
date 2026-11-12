// The Label demo: the same cases, ids and copy as
// packages/react/src/components/Label/Label.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsInput } from '../input/input';
import { DsLabel } from './label';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsInput, DsLabel, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, required, optional">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="label-md">Board name</label>
            <div dsInput id="label-md"></div>
          </div>
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="label-sm" size="sm">Board name</label>
            <div dsInput id="label-sm" size="sm"></div>
          </div>
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="label-required" required>Email</label>
            <div dsInput id="label-required" type="email"></div>
          </div>
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="label-optional" optional="Optional">Company</label>
            <div dsInput id="label-optional"></div>
          </div>
        </div>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
            <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
              <label dsLabel for="label-ar" required>البريد الإلكتروني</label>
              <div dsInput id="label-ar" type="email"></div>
            </div>
            <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
              <label dsLabel for="label-ar-optional" optional="اختياري" size="sm">اسم الشركة</label>
              <div dsInput id="label-ar-optional" size="sm"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One label">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
          <label dsLabel for="label-one">Workspace name</label>
          <div dsInput id="label-one" value="Design team"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Labels in a row">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          @for (name of ['Width', 'Height', 'Rotation']; track name) {
            <div style="display: grid; gap: var(--ds-space-xs); align-content: start; inline-size: 8rem;">
              <label dsLabel [htmlFor]="'label-many-' + name" size="sm">{{ name }}</label>
              <div dsInput [id]="'label-many-' + name" size="sm" end="px" value="120"></div>
            </div>
          }
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long label">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start; max-inline-size: 20rem;">
          <label dsLabel for="label-long" required>The name people see on the board card, in shared links and in every email we send about this board</label>
          <div dsInput id="label-long"></div>
        </div>
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start; max-inline-size: 20rem;">
          <label dsLabel for="label-word">{{ sample.en.word }}</label>
          <div dsInput id="label-word"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start; max-inline-size: 20rem;">
          <label dsLabel for="label-long-ar" optional="اختياري">الاسم اللي يشوفه الفريق على بطاقة اللوحة وفي الروابط المشتركة وفي كل رسالة نرسلها عن اللوحة</label>
          <div dsInput id="label-long-ar"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Label of an invalid control">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
          <label dsLabel for="label-invalid" invalid required>Email</label>
          <div dsInput id="label-invalid" type="email" invalid value="sara@"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
          <label dsLabel for="label-disabled" disabled>Workspace</label>
          <div dsInput id="label-disabled" disabled value="Design team"></div>
        </div>
      </div>
    </section>
  `,
})
export default class LabelDemo {
  protected readonly sample = sample;
}
