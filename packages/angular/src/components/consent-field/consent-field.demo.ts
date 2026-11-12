// The ConsentField demo: the same cases, ids and copy as
// packages/react/src/components/ConsentField/ConsentField.demo.tsx.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsFieldset } from '../fieldset/fieldset';
import { DsForm } from '../form/form';
import { DsFormSubmit } from '../form/form-submit';
import { DsConsentField, type ConsentRecord } from './consent-field';

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

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsFieldset, DsForm, DsFormSubmit, DsConsentField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, checkbox and switch, and an Arabic row">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsConsentField [size]="size" purpose="Send me offers by email." [detailsHref]="privacy" meta="Text version 2.1, updated 1 November 2026."></div>
          }
        </div>
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          <div
            dsConsentField
            control="switch"
            purpose="Send me offers by email."
            [(checked)]="granted"
            (decision)="record.set($event)"
            version="2.1"
            [detailsHref]="privacy"
            [meta]="settingsMeta()"
          ></div>
          <div dsConsentField control="switch" purpose="Use my location to show stores near me." [detailsHref]="privacy"></div>
          <div dsTheme [lang]="'ar'">
            <div dsConsentField purpose="أوافق على استلام العروض على بريدي الإلكتروني." [detailsHref]="privacy" meta="الإصدار 2.1، آخر تحديث 1 نوفمبر 2026."></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Purpose only">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsConsentField purpose="Send me a survey after each order."></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One consent in a form">
      <div dsTheme [lang]="'en'" data-demo="content">
        <form dsForm [actions]="oneActions">
          <div dsConsentField name="marketing" purpose="Send me offers by email." [detailsHref]="privacy" meta="Optional. You can withdraw it any time in Settings."></div>
          <ng-template #oneActions><button dsFormSubmit>Create account</button></ng-template>
        </form>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="One purpose per consent">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="How we may use your data" description="Each choice is separate. Leave any of them off.">
          @for (p of purposes.slice(0, 3); track p) {
            <div dsConsentField [purpose]="p" [detailsHref]="privacy"></div>
          }
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long settings list">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <fieldset dsFieldset legend="Privacy settings" size="sm">
            @for (p of purposes; track p) {
              <div dsConsentField size="sm" control="switch" [purpose]="p"></div>
            }
          </fieldset>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long purpose">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div
          dsConsentField
          [purpose]="longPurpose"
          [detailsHref]="privacy"
          detailsLabel="Read who the delivery partner is, what they keep and for how long"
          meta="You agreed to text version 2.1 on 3 November 2026 at 10:42 from this device. We keep this record for as long as your account is open, and you can withdraw at any time in Settings."
        ></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div
          dsConsentField
          purpose="أوافق على مشاركة سجل طلباتي وعنوان التوصيل ورقم جوالي مع شريك التوصيل، عشان يرتب مواعيد التوصيل ويتصل علي لما يقرب المندوب."
          [detailsHref]="privacy"
          meta="الإصدار 2.1، آخر تحديث 1 نوفمبر 2026. تقدر تلغي الموافقة متى ما تبي من الإعدادات."
        ></div>
        <div
          dsConsentField
          required
          purpose="أوافق على مشاركة سجلي الطبي مع العيادة اللي أحجز عندها."
          [detailsHref]="privacy"
          error="الحجز يحتاج موافقتك على المشاركة. حدد المربع أو احجز بالاتصال."
        ></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Required for the service, left off">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div
          dsConsentField
          required
          purpose="Share my medical history with the clinic I book with."
          [detailsHref]="privacy"
          error="The booking needs this consent. Tick the box, or book by phone instead."
        ></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled until a parent consent is on">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsConsentField disabled purpose="Send me birthday offers." meta="Tick offers by email first."></div>
      </div>
    </section>
  `,
})
export default class ConsentFieldDemo {
  protected readonly privacy = '#privacy';
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly purposes = purposes;
  protected readonly longPurpose = `Share my order history, delivery address and phone number with the delivery partner, so they can plan delivery times and call me when the driver is near. ${sample.en.word}`;
  protected readonly granted = signal(true);
  protected readonly record = signal<ConsentRecord | null>(null);
  protected readonly settingsMeta = computed(() => {
    const r = this.record();
    return r ? `You ${r.granted ? 'agreed' : 'withdrew'} just now. Text version 2.1.` : 'You agreed on 3 November 2026. Text version 2.1.';
  });
}
