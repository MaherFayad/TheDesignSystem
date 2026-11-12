// The FieldError demo: the same cases, ids and copy as
// packages/react/src/components/FieldError/FieldError.demo.tsx.
//
// The empty case: React renders nothing for a FieldError without a message.
// The Angular form of that is no dsFieldError at all (see field-error.ts),
// so the case holds the field and its input only.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DemoBidi } from '../field/demo-bidi';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsLabel } from '../label/label';
import { DsFieldError } from './field-error';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoBidi, DsField, DsFieldError, DsInput, DsLabel, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, alone and in a Field">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="fe-md">Board name</label>
            <div dsInput id="fe-md" invalid aria-describedby="fe-md-error"></div>
            <p dsFieldError id="fe-md-error">Add a name, so people can find the board.</p>
          </div>
          <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
            <label dsLabel for="fe-sm" size="sm">Width</label>
            <div dsInput id="fe-sm" size="sm" end="px" invalid value="0" aria-describedby="fe-sm-error"></div>
            <p dsFieldError id="fe-sm-error" size="sm">Use 1 px or more.</p>
          </div>
          <div dsField label="Email" error="Add the part after the @, for example name@example.com.">
            <div dsInput type="email" value="sara@"></div>
          </div>
        </div>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
            <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
              <label dsLabel for="fe-ar">اسم اللوحة</label>
              <div dsInput id="fe-ar" invalid aria-describedby="fe-ar-error"></div>
              <p dsFieldError id="fe-ar-error">اكتب اسم للوحة عشان يلقاها الفريق.</p>
            </div>
            <div style="display: grid; gap: var(--ds-space-xs); align-content: start;">
              <label dsLabel for="fe-ar-sm" size="sm">العرض</label>
              <div dsInput id="fe-ar-sm" size="sm" end="px" invalid value="0" aria-describedby="fe-ar-sm-error"></div>
              <p dsFieldError id="fe-ar-sm-error" size="sm">أقل قيمة 1 بكسل.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="No message: nothing renders">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Board name">
          <div dsInput value="Spring launch"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One error">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Workspace address" error="This address is taken. Add a word or a number, for example design-team-2.">
          <div dsInput value="design-team"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Several errors after submit">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
          <div dsField label="First name" required error="Add a first name.">
            <div dsInput autoComplete="given-name"></div>
          </div>
          <div dsField label="Email" required error="Add the part after the @, for example name@example.com.">
            <div dsInput type="email" value="sara@"></div>
          </div>
          <div dsField label="Website" error="Start the link with https://">
            <div dsInput type="url" value="example.com"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long message">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: 20rem;">
          <div dsField label="Board name" error="Use 60 characters or fewer, so the whole name fits on the board card, in shared links and in the subject of every email we send about this board.">
            <div dsInput [value]="sample.en.word"></div>
          </div>
        </div>
        <div style="max-inline-size: 20rem;">
          <div dsField label="Tag" [error]="'Split ' + sample.en.word + ' into shorter words.'">
            <div dsInput [value]="sample.en.word"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: 20rem;">
          <div dsField label="البريد الإلكتروني" [error]="arError">
            <div dsInput type="email" value="sara@"></div>
          </div>
          <ng-template #arError><span data-ds="bidi" text="البريد ناقص. اكتبه كامل كذا: name@example.com، وبعدها احفظ التغييرات عشان نرسل لك رابط الدخول."></span></ng-template>
        </div>
      </div>
    </section>
  `,
})
export default class FieldErrorDemo {
  protected readonly sample = sample;
}
