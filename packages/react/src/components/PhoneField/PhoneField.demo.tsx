import { Bidi } from '../../theme/Bidi';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Field } from '../Field/Field';
import { PhoneField, type PhoneFieldShape, type PhoneFieldSize } from './index';

const sizes: PhoneFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: PhoneFieldShape[] = ['default', 'pill'];

/** PhoneField on its own and inside a Field, in every content case. */
export default function PhoneFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, shapes and Gulf countries">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="16rem">
            {sizes.map((size) => (
              <PhoneField key={size} size={size} shape={shape} defaultValue="+966501234567" aria-label={`Mobile number, ${size}, ${shape}`} />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="16rem">
          <PhoneField defaultValue="+97141234567" aria-label="Office number in the UAE" />
          <PhoneField defaultValue="+96550001234" aria-label="Mobile number in Kuwait" />
          <PhoneField defaultValue="+97433123456" aria-label="Mobile number in Qatar" />
          <PhoneField defaultValue="+97336001234" aria-label="Mobile number in Bahrain" />
          <PhoneField defaultValue="+96892123456" aria-label="Mobile number in Oman" />
          <PhoneField defaultCountry="EG" defaultValue="+201012345678" aria-label="Mobile number in Egypt" />
        </DemoGrid>
        <DemoRow label="عربي">
          <div lang="ar" dir="rtl" style={{ inlineSize: '18rem' }}>
            <PhoneField defaultValue="+966501234567" locale="ar" aria-label="رقم الجوال" />
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label="Mobile number" description="We send a sign in code to this number.">
          <PhoneField name="mobile" />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One number">
        <Field label="Mobile number">
          <PhoneField name="mobile" defaultValue="+966501234567" />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="A short contact form">
        <DemoGrid min="16rem">
          <Field label="Mobile number" required>
            <PhoneField defaultValue="+966551234567" />
          </Field>
          <Field label="Office number" description="Landline with the area code.">
            <PhoneField defaultCountry="AE" defaultValue="+97141234567" />
          </Field>
          <Field label="Emergency contact">
            <PhoneField defaultCountry="KW" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="A long number in a narrow container">
        <div style={{ maxInlineSize: '16rem' }}>
          <Field label="Office number in Germany">
            <PhoneField defaultCountry="DE" defaultValue="+4930123456789012" size="sm" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long label and description">
        <Field
          label="The mobile number we text when a delivery is on its way or a courier cannot find the address"
          description={sample.en.long}
        >
          <PhoneField />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field
          label="رقم الجوال"
          required
          description={<Bidi>نرسل لك رمز الدخول على هذا الرقم في رسالة نصية. اكتب الرقم بدون الصفر في البداية، مثل 50 123 4567، أو الصقه كامل مع رمز الدولة.</Bidi>}
        >
          <PhoneField defaultValue="+966501234567" />
        </Field>
        <Field label="رقم المكتب">
          <PhoneField defaultCountry="AE" />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Number being checked">
        <Field label="Mobile number" description="Checking that this number can get text messages.">
          <PhoneField defaultValue="+966501234567" aria-busy="true" />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="Mobile number" error="Enter the 9 digits after +966, for example 50 123 4567.">
          <PhoneField defaultValue="+9665012345" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Mobile number" disabled description="Verify your email first.">
          <PhoneField defaultValue="+966501234567" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="Account phone" readOnly description="Contact support to change it.">
          <PhoneField defaultValue="+97336001234" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
