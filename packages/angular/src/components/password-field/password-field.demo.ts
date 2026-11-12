// The PasswordField demo: the same cases, ids and copy as
// packages/react/src/components/PasswordField/PasswordField.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsPasswordField, type PasswordFieldShape, type PasswordFieldSize } from './password-field';

const sizes: PasswordFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: PasswordFieldShape[] = ['default', 'pill'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsField, DsInput, DsPasswordField, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, shapes, hidden and shown">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
          @for (size of sizes; track size) {
            <div
              dsPasswordField
              [size]="size"
              [shape]="shape"
              [aria-label]="'Password, ' + size + ', ' + shape"
              value="spring-launch-26"
              [visible]="size === 'lg'"
            ></div>
          }
        </div>
      }
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="عربي">
          <div dsPasswordField aria-label="كلمة المرور" value="spring-launch-26" showLabel="إظهار كلمة المرور" hideLabel="إخفاء كلمة المرور"></div>
          <div
            dsPasswordField
            aria-label="كلمة المرور الجديدة"
            autoComplete="new-password"
            value="spring-launch-26"
            [visible]="true"
            showLabel="إظهار كلمة المرور"
            hideLabel="إخفاء كلمة المرور"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div dsField label="Password">
        <div dsPasswordField></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field in a sign in form">
      <form style="display: grid; gap: var(--ds-space-m); max-inline-size: var(--ds-dialog-width-sm);" (submit)="$event.preventDefault()">
        <div dsField label="Email">
          <div dsInput type="email" autoComplete="username" value="sara@example.com"></div>
        </div>
        <div dsField label="Password">
          <div dsPasswordField value="spring-launch-26"></div>
        </div>
        <button dsButton type="submit" emphasis="solid" tone="accent">Sign in</button>
      </form>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Change password">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsField label="Current password">
          <div dsPasswordField value="spring-launch-26"></div>
        </div>
        <div dsField label="New password" description="At least 12 characters. A phrase of four words works well.">
          <div dsPasswordField autoComplete="new-password" value="blue kettle river 42" [visible]="true"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long value">
      <div dsField label="Recovery phrase" [description]="sample.en.long">
        <div dsPasswordField autoComplete="off" value="orbit velvet cactus lantern meadow harbor pencil quartz violin ember canyon glacier" [visible]="true"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="كلمة المرور الجديدة" description="لا تقل عن 12 حرف. جملة من أربع كلمات تحفظها بسهولة وتكون أقوى من كلمة وحدة مع رموز.">
          <div
            dsPasswordField
            autoComplete="new-password"
            value="قهوة الصباح مع الفريق كل أحد"
            [visible]="true"
            showLabel="إظهار كلمة المرور"
            hideLabel="إخفاء كلمة المرور"
          ></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="New password" error="Use at least 12 characters. Add a word or two to make it longer.">
        <div dsPasswordField autoComplete="new-password" value="short"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Password" disabled description="Your company signs you in. Ask your admin to reset it.">
        <div dsPasswordField value="spring-launch-26"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="API key" readOnly description="Show it to copy it. It never changes here.">
        <div dsPasswordField autoComplete="off" value="demo-key-4f8a2c91" showLabel="Show key" hideLabel="Hide key"></div>
      </div>
    </section>
  `,
})
export default class PasswordFieldDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
}
