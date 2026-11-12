// The PhoneField demo: the same cases, ids and copy as
// packages/react/src/components/PhoneField/PhoneField.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsPhoneField, type PhoneFieldShape, type PhoneFieldSize } from './phone-field';

const sizes: PhoneFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: PhoneFieldShape[] = ['default', 'pill'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsField, DsPhoneField, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, shapes and Gulf countries">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsPhoneField [size]="size" [shape]="shape" value="+966501234567" [aria-label]="'Mobile number, ' + size + ', ' + shape"></div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsPhoneField value="+97141234567" aria-label="Office number in the UAE"></div>
        <div dsPhoneField value="+96550001234" aria-label="Mobile number in Kuwait"></div>
        <div dsPhoneField value="+97433123456" aria-label="Mobile number in Qatar"></div>
        <div dsPhoneField value="+97336001234" aria-label="Mobile number in Bahrain"></div>
        <div dsPhoneField value="+96892123456" aria-label="Mobile number in Oman"></div>
        <div dsPhoneField country="EG" value="+201012345678" aria-label="Mobile number in Egypt"></div>
      </div>
      <div data-demo="row" label="عربي">
        <div lang="ar" dir="rtl" style="inline-size: 18rem;">
          <div dsPhoneField value="+966501234567" locale="ar" aria-label="رقم الجوال"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div dsField label="Mobile number" description="We send a sign in code to this number.">
        <div dsPhoneField name="mobile"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One number">
      <div dsField label="Mobile number">
        <div dsPhoneField name="mobile" value="+966501234567"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A short contact form">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsField label="Mobile number" required>
          <div dsPhoneField value="+966551234567"></div>
        </div>
        <div dsField label="Office number" description="Landline with the area code.">
          <div dsPhoneField country="AE" value="+97141234567"></div>
        </div>
        <div dsField label="Emergency contact">
          <div dsPhoneField country="KW"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long number in a narrow container">
      <div style="max-inline-size: 16rem;">
        <div dsField label="Office number in Germany">
          <div dsPhoneField country="DE" value="+49301234567890" size="sm"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long label and description">
      <div dsField label="The mobile number we text when a delivery is on its way or a courier cannot find the address" [description]="sample.en.long">
        <div dsPhoneField></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="رقم الجوال" required [description]="arDescription">
          <div dsPhoneField value="+966501234567"></div>
        </div>
        <ng-template #arDescription>نرسل لك رمز الدخول على هذا الرقم في رسالة نصية. اكتب الرقم بدون الصفر في البداية، مثل <bdi dir="ltr">50 123 4567</bdi>، أو الصقه كامل مع رمز الدولة.</ng-template>
        <div dsField label="رقم المكتب">
          <div dsPhoneField country="AE"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Number being checked">
      <div dsField label="Mobile number" description="Checking that this number can get text messages.">
        <div dsPhoneField value="+966501234567" aria-busy="true"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="Mobile number" error="Enter the 9 digits after +966, for example 50 123 4567.">
        <div dsPhoneField value="+9665012345"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Mobile number" disabled description="Verify your email first.">
        <div dsPhoneField value="+966501234567"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="Account phone" readOnly description="Contact support to change it.">
        <div dsPhoneField value="+97336001234"></div>
      </div>
    </section>
  `,
})
export default class PhoneFieldDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
}
