// The OTPField demo: the same cases, ids and copy as
// packages/react/src/components/OTPField/OTPField.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DemoBidi } from '../field/demo-bidi';
import { DsField } from '../field/field';
import { DsOTPField, type OTPFieldShape, type OTPFieldSize } from './otp-field';

const sizes: OTPFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: OTPFieldShape[] = ['default', 'pill'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoBidi, DsField, DsOTPField, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, shapes and groups">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsOTPField [size]="size" [shape]="shape" value="48" [aria-label]="'Verification code, ' + size + ', ' + shape"></div>
          }
        </div>
      }
      <div data-demo="row" label="Two groups">
        <div dsOTPField [groups]="[3, 3]" value="482913" aria-label="Verification code in two groups"></div>
      </div>
      <div data-demo="row" label="Letters and digits">
        <div dsOTPField [length]="8" [groups]="[4, 4]" charset="alphanumeric" value="K7QD" aria-label="Backup code"></div>
      </div>
      <div data-demo="row" label="عربي">
        <div lang="ar" dir="rtl">
          <div dsOTPField [groups]="[3, 3]" value="1234" aria-label="رمز التحقق"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div dsField label="Verification code" description="We sent a 6 digit code to the number ending in 1234.">
        <div dsOTPField></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One digit typed">
      <div dsField label="Verification code">
        <div dsOTPField value="4"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A full code">
      <div dsField label="Verification code" description="The code is checked as soon as the last digit is in.">
        <div dsOTPField value="482913" [groups]="[3, 3]"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="An 8 character code in a narrow container">
      <div style="max-inline-size: 20rem;">
        <div dsField label="Backup code" description="Letters and digits from your saved list of backup codes.">
          <div dsOTPField [length]="8" [groups]="[4, 4]" charset="alphanumeric" size="sm" value="K7QD2M"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long label and description">
      <div dsField label="The 6 digit code from the text message we just sent to the phone number on your account" [description]="sample.en.long">
        <div dsOTPField></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="رمز التحقق" [description]="arDescription">
          <div dsOTPField [groups]="[3, 3]" value="7310"></div>
        </div>
        <ng-template #arDescription><span data-ds="bidi" text="أرسلنا لك رمز من 6 أرقام في رسالة نصية على جوالك اللي ينتهي بـ 1234. الرمز صالح لمدة 10 دقائق، وإذا ما وصلك تقدر تطلب رمز جديد."></span></ng-template>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Code being checked">
      <div dsField label="Verification code" description="Checking the code." readOnly>
        <div dsOTPField value="482913" aria-busy="true"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="Verification code" error="This code has expired. Send a new code and enter it here.">
        <div dsOTPField value="482913"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Verification code" disabled description="Send a code first.">
        <div dsOTPField></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="Pairing code" readOnly description="Enter this code on the other device.">
        <div dsOTPField value="5820" [length]="4"></div>
      </div>
    </section>
  `,
})
export default class OTPFieldDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
}
