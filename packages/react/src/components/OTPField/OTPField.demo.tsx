import { Bidi } from '../../theme/Bidi';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Field } from '../Field/Field';
import { OTPField, type OTPFieldShape, type OTPFieldSize } from './index';

const sizes: OTPFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: OTPFieldShape[] = ['default', 'pill'];

/** OTPField on its own and inside a Field, in every content case. */
export default function OTPFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, shapes and groups">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="min(100%, 22rem)">
            {sizes.map((size) => (
              <OTPField key={size} size={size} shape={shape} defaultValue="48" aria-label={`Verification code, ${size}, ${shape}`} />
            ))}
          </DemoGrid>
        ))}
        <DemoRow label="Two groups">
          <OTPField groups={[3, 3]} defaultValue="482913" aria-label="Verification code in two groups" />
        </DemoRow>
        <DemoRow label="Letters and digits">
          <OTPField length={8} groups={[4, 4]} charset="alphanumeric" defaultValue="K7QD" aria-label="Backup code" />
        </DemoRow>
        <DemoRow label="عربي">
          <div lang="ar" dir="rtl">
            <OTPField groups={[3, 3]} defaultValue="1234" aria-label="رمز التحقق" />
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label="Verification code" description="We sent a 6 digit code to the number ending in 1234.">
          <OTPField />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One digit typed">
        <Field label="Verification code">
          <OTPField defaultValue="4" />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="A full code">
        <Field label="Verification code" description="The code is checked as soon as the last digit is in.">
          <OTPField defaultValue="482913" groups={[3, 3]} />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="An 8 character code in a narrow container">
        <div style={{ maxInlineSize: '20rem' }}>
          <Field label="Backup code" description="Letters and digits from your saved list of backup codes.">
            <OTPField length={8} groups={[4, 4]} charset="alphanumeric" size="sm" defaultValue="K7QD2M" />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long label and description">
        <Field
          label="The 6 digit code from the text message we just sent to the phone number on your account"
          description={sample.en.long}
        >
          <OTPField />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field
          label="رمز التحقق"
          description={<Bidi>أرسلنا لك رمز من 6 أرقام في رسالة نصية على جوالك اللي ينتهي بـ 1234. الرمز صالح لمدة 10 دقائق، وإذا ما وصلك تقدر تطلب رمز جديد.</Bidi>}
        >
          <OTPField groups={[3, 3]} defaultValue="7310" />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Code being checked">
        <Field label="Verification code" description="Checking the code." readOnly>
          <OTPField defaultValue="482913" aria-busy="true" />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="Verification code" error="This code has expired. Send a new code and enter it here.">
          <OTPField defaultValue="482913" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Verification code" disabled description="Send a code first.">
          <OTPField />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="Pairing code" readOnly description="Enter this code on the other device.">
          <OTPField defaultValue="5820" length={4} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
