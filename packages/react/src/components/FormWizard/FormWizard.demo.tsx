import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Field } from '../Field';
import { Input } from '../Input';
import {
  FormWizard,
  type FormWizardErrors,
  type FormWizardSize,
  type FormWizardStep,
  type FormWizardValues,
} from './index';

type Lang = 'en' | 'ar';

/** Checkout copy. English: buttons are a verb plus a noun. Arabic: noun forms, white Saudi dialect, no diacritics. */
const copy = {
  en: {
    account: 'Account',
    accountHint: 'Where we send the receipt',
    address: 'Address',
    addressHint: 'Where we deliver the order',
    delivery: 'Delivery',
    deliveryHint: 'A note for the driver',
    review: 'Review',
    reviewHint: 'Check the order before you place it',
    name: 'Full name',
    email: 'Email',
    street: 'Street and building',
    city: 'City',
    postal: 'Postal code',
    postalHint: 'Five digits',
    postalError: 'Enter the five digit postal code',
    postalServer: 'We do not deliver to this postal code yet. Pick another address.',
    note: 'Note for the driver',
    noteHint: 'Optional. A gate code or a landmark.',
    saveAccount: 'Save account',
    saveAddress: 'Save address',
    reviewOrder: 'Review order',
    editAccount: 'Edit account',
    editAddress: 'Edit address',
    editDelivery: 'Edit delivery',
    place: 'Place order',
    placed: 'Order placed',
    placedText: 'We sent the receipt to your email.',
    none: 'None',
    steps: 'Checkout steps',
  },
  ar: {
    account: 'الحساب',
    accountHint: 'وين نرسل الفاتورة',
    address: 'العنوان',
    addressHint: 'وين نوصل الطلب',
    delivery: 'التوصيل',
    deliveryHint: 'ملاحظة للمندوب',
    review: 'المراجعة',
    reviewHint: 'تأكد من الطلب قبل إرساله',
    name: 'الاسم الكامل',
    email: 'الإيميل',
    street: 'الشارع والمبنى',
    city: 'المدينة',
    postal: 'الرمز البريدي',
    postalHint: 'خمسة أرقام',
    postalError: 'اكتب الرمز البريدي من خمسة أرقام',
    postalServer: 'ما نوصل لهذا الرمز البريدي حاليا. اختر عنوان ثاني.',
    note: 'ملاحظة للمندوب',
    noteHint: 'اختياري. رمز البوابة أو معلم قريب.',
    saveAccount: 'حفظ الحساب',
    saveAddress: 'حفظ العنوان',
    reviewOrder: 'مراجعة الطلب',
    editAccount: 'تعديل الحساب',
    editAddress: 'تعديل العنوان',
    editDelivery: 'تعديل التوصيل',
    place: 'إرسال الطلب',
    placed: 'تم إرسال الطلب',
    placedText: 'أرسلنا الفاتورة على إيميلك.',
    none: 'لا يوجد',
    steps: 'خطوات الطلب',
  },
} as const;

/** Answers already given, for the cases that open on a later step. Western digits in both languages. */
const prefills = {
  en: { name: 'Sara Alharbi', email: 'sara@example.com', street: '12 King Fahd Road, building 4', city: 'Riyadh', postal: '12271', note: 'Gate code 4410' },
  ar: { name: 'سارة الحربي', email: 'sara@example.com', street: 'طريق الملك فهد 12، مبنى 4', city: 'الرياض', postal: '12271', note: 'رمز البوابة 4410' },
} as const;

function text(values: FormWizardValues, name: string): string {
  const v = values[name];
  return typeof v === 'string' ? v : '';
}

/** The four checkout steps, in one language. */
function checkout(lang: Lang, longText = false, prefill = false): FormWizardStep[] {
  const t = copy[lang];
  const sample = prefill ? prefills[lang] : undefined;
  const pad = (s: string, extra: string) => (longText ? `${s} ${extra}` : s);
  return [
    {
      id: 'account',
      title: pad(t.account, lang === 'ar' ? 'وبيانات التواصل اللي نستخدمها للفاتورة والتحديثات' : 'and the contact details we use for the receipt and updates'),
      description: t.accountHint,
      nextLabel: t.saveAccount,
      content: ({ errors }) => (
        <>
          <Field label={t.name} required error={errors.name}>
            <Input name="name" autoComplete="name" defaultValue={sample?.name} />
          </Field>
          <Field label={t.email} required error={errors.email}>
            <Input name="email" type="email" autoComplete="email" defaultValue={sample?.email} />
          </Field>
        </>
      ),
    },
    {
      id: 'address',
      title: t.address,
      description: t.addressHint,
      nextLabel: t.saveAddress,
      backLabel: t.editAccount,
      validate: (values): FormWizardErrors | void => {
        const postal = text(values, 'postal');
        if (postal && !/^\d{5}$/.test(postal)) return { postal: t.postalError };
      },
      content: ({ errors }) => (
        <>
          <Field label={t.street} required error={errors.street}>
            <Input name="street" autoComplete="address-line1" defaultValue={sample?.street} />
          </Field>
          <Field label={t.city} required error={errors.city}>
            <Input name="city" autoComplete="address-level2" defaultValue={sample?.city} />
          </Field>
          <Field label={t.postal} required description={t.postalHint} error={errors.postal}>
            <Input name="postal" inputMode="numeric" autoComplete="postal-code" defaultValue={sample?.postal} />
          </Field>
        </>
      ),
    },
    {
      id: 'delivery',
      title: t.delivery,
      description: t.deliveryHint,
      nextLabel: t.reviewOrder,
      backLabel: t.editAddress,
      content: (
        <Field label={t.note} description={t.noteHint}>
          <Input name="note" defaultValue={sample?.note} />
        </Field>
      ),
    },
    {
      id: 'review',
      title: t.review,
      description: t.reviewHint,
      backLabel: t.editDelivery,
      content: ({ values }) => (
        <dl style={{ display: 'grid', gap: 'var(--ds-space-s)', margin: 0 }}>
          {(['name', 'email', 'street', 'city', 'postal', 'note'] as const).map((name) => (
            <div key={name} style={{ display: 'grid', gap: 'var(--ds-space-3xs)' }}>
              <dt style={{ color: 'var(--ds-color-text-muted)', fontSize: 'var(--ds-font-size-xs)' }}>{t[name]}</dt>
              <dd style={{ margin: 0 }}>{text(values, name) || t.none}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ];
}

function Checkout({
  lang = 'en',
  size,
  vertical,
  longText,
  defaultStep,
  defaultErrors,
  prefill,
  label,
}: {
  prefill?: boolean;
  lang?: Lang;
  size?: FormWizardSize;
  vertical?: boolean;
  longText?: boolean;
  defaultStep?: number;
  defaultErrors?: Record<number, FormWizardErrors>;
  label?: string;
}) {
  const t = copy[lang];
  return (
    <FormWizard
      steps={checkout(lang, longText, prefill)}
      size={size}
      orientation={vertical ? 'vertical' : 'horizontal'}
      defaultStep={defaultStep}
      defaultErrors={defaultErrors}
      stepsLabel={label ?? t.steps}
      submitLabel={t.place}
      doneTitle={t.placed}
      done={<p>{t.placedText}</p>}
      formProps={{ autoComplete: 'on' }}
      onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 600))}
    />
  );
}

export default function FormWizardDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size and Stepper orientation">
        <DemoRow label="md, horizontal">
          <Checkout label="Checkout steps, md" />
        </DemoRow>
        <DemoRow label="sm, vertical">
          <Checkout size="sm" vertical label="Checkout steps, sm vertical" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="md, horizontal">
            <Checkout lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="many" title="Many steps, on the review step">
        <DemoRow>
          <Checkout defaultStep={3} prefill label="Checkout steps, review" />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Arabic">
            <Checkout lang="ar" defaultStep={3} prefill vertical />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <Checkout longText label="Checkout steps, long titles" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Checkout lang="ar" longText vertical />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Errors sent back by the server">
        <DemoRow>
          <Checkout
            defaultStep={1}
            defaultErrors={{ 1: { postal: copy.en.postalServer } }}
            prefill
            label="Checkout steps with an error"
          />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Arabic">
            <Checkout lang="ar" defaultStep={1} prefill defaultErrors={{ 1: { postal: copy.ar.postalServer } }} />
          </DemoRow>
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
