import { useState } from 'react';
import { Theme } from '../../theme';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Fieldset } from '../Fieldset/Fieldset';
import { Form, FormSubmit } from '../Form/Form';
import { ConsentField, type ConsentRecord } from './index';

const privacy = '#privacy';

const purposes = [
  'Send me offers by email.',
  'Send me order updates by text message.',
  'Share my order history with the delivery partner to plan delivery times.',
  'Use my location to show stores near me.',
  'Use how I browse the app to suggest products.',
  'Share my contact details with the bank for instalment plans.',
  'Send me a survey after each order.',
  'Keep my card details for faster checkout.',
  'Use my voice notes to improve the support assistant.',
  'Send me birthday offers.',
  'Share my reviews with the seller.',
  'Call me about service updates.',
];

function SettingsRow() {
  const [granted, setGranted] = useState(true);
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  return (
    <ConsentField
      control="switch"
      purpose="Send me offers by email."
      checked={granted}
      onCheckedChange={setGranted}
      onDecision={setRecord}
      version="2.1"
      detailsHref={privacy}
      meta={record ? `You ${record.granted ? 'agreed' : 'withdrew'} just now. Text version 2.1.` : 'You agreed on 3 November 2026. Text version 2.1.'}
    />
  );
}

/** ConsentField in every content case that applies. Loading and read only do not apply: a consent is the person's own choice and is never locked for them. */
export default function ConsentFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, checkbox and switch, and an Arabic row" lang="en">
        <DemoGrid min="18rem">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <ConsentField key={size} size={size} purpose="Send me offers by email." detailsHref={privacy} meta="Text version 2.1, updated 1 November 2026." />
          ))}
        </DemoGrid>
        <DemoGrid min="18rem">
          <SettingsRow />
          <ConsentField control="switch" purpose="Use my location to show stores near me." detailsHref={privacy} />
          <Theme lang="ar">
            <ConsentField purpose="أوافق على استلام العروض على بريدي الإلكتروني." detailsHref={privacy} meta="الإصدار 2.1، آخر تحديث 1 نوفمبر 2026." />
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="Purpose only" lang="en">
        <ConsentField purpose="Send me a survey after each order." />
      </DemoCase>

      <DemoCase id="one" title="One consent in a form" lang="en">
        <Form actions={<FormSubmit>Create account</FormSubmit>}>
          <ConsentField name="marketing" purpose="Send me offers by email." detailsHref={privacy} meta="Optional. You can withdraw it any time in Settings." />
        </Form>
      </DemoCase>

      <DemoCase id="many" title="One purpose per consent" lang="en">
        <Fieldset legend="How we may use your data" description="Each choice is separate. Leave any of them off.">
          {purposes.slice(0, 3).map((p) => (
            <ConsentField key={p} purpose={p} detailsHref={privacy} />
          ))}
        </Fieldset>
      </DemoCase>

      <DemoCase id="too-many" title="A long settings list" lang="en">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Fieldset legend="Privacy settings" size="sm">
            {purposes.map((p) => (
              <ConsentField key={p} size="sm" control="switch" purpose={p} />
            ))}
          </Fieldset>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long purpose" lang="en">
        <ConsentField
          purpose={`Share my order history, delivery address and phone number with the delivery partner, so they can plan delivery times and call me when the driver is near. ${sample.en.word}`}
          detailsHref={privacy}
          detailsLabel="Read who the delivery partner is, what they keep and for how long"
          meta="You agreed to text version 2.1 on 3 November 2026 at 10:42 from this device. We keep this record for as long as your account is open, and you can withdraw at any time in Settings."
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <ConsentField
          purpose="أوافق على مشاركة سجل طلباتي وعنوان التوصيل ورقم جوالي مع شريك التوصيل، عشان يرتب مواعيد التوصيل ويتصل علي لما يقرب المندوب."
          detailsHref={privacy}
          meta="الإصدار 2.1، آخر تحديث 1 نوفمبر 2026. تقدر تلغي الموافقة متى ما تبي من الإعدادات."
        />
        <ConsentField
          required
          purpose="أوافق على مشاركة سجلي الطبي مع العيادة اللي أحجز عندها."
          detailsHref={privacy}
          error="الحجز يحتاج موافقتك على المشاركة. حدد المربع أو احجز بالاتصال."
        />
      </DemoCase>

      <DemoCase id="error" title="Required for the service, left off" lang="en">
        <ConsentField
          required
          purpose="Share my medical history with the clinic I book with."
          detailsHref={privacy}
          error="The booking needs this consent. Tick the box, or book by phone instead."
        />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled until a parent consent is on" lang="en">
        <ConsentField disabled purpose="Send me birthday offers." meta="Tick offers by email first." />
      </DemoCase>
    </DemoPage>
  );
}
