// Stepper demo. The copy follows the page language: with lang=ar every case
// reads Arabic.
import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
import { Stepper, type StepperMode, type StepperOrientation, type StepperSize, type StepperStep } from './index';

/** A checkout in four steps. Titles are nouns. */
const checkout: StepperStep[] = [
  { title: 'Account', description: 'Email and password' },
  { title: 'Address', description: 'Where we send the order' },
  { title: 'Payment', description: 'Card or bank transfer' },
  { title: 'Review', description: 'Check and place the order' },
];

/** The same steps in Arabic: noun form, no diacritics. */
const checkoutAr: StepperStep[] = [
  { title: 'الحساب', description: 'البريد وكلمة المرور' },
  { title: 'العنوان', description: 'وين نوصل الطلب' },
  { title: 'الدفع', description: 'بطاقة أو تحويل بنكي' },
  { title: 'المراجعة', description: 'تأكد من الطلب قبل إرساله' },
];

const many: StepperStep[] = [
  { title: 'Workspace' },
  { title: 'Team' },
  { title: 'Roles' },
  { title: 'Billing' },
  { title: 'Review' },
];

const tooMany: StepperStep[] = [
  'Account',
  'Profile',
  'Company',
  'Team',
  'Roles',
  'Billing',
  'Tax details',
  'Integrations',
  'Notifications',
  'Security',
  'Data import',
  'Review',
].map((title) => ({ title }));

const manyAr: StepperStep[] = [{ title: 'مساحة العمل' }, { title: 'الفريق' }, { title: 'الأدوار' }, { title: 'الفوترة' }, { title: 'المراجعة' }];

const tooManyAr: StepperStep[] = [
  'الحساب',
  'الملف الشخصي',
  'الشركة',
  'الفريق',
  'الأدوار',
  'الفوترة',
  'بيانات الضريبة',
  'التكاملات',
  'الإشعارات',
  'الأمان',
  'استيراد البيانات',
  'المراجعة',
].map((title) => ({ title }));

const words = {
  en: {
    checkout,
    many,
    tooMany,
    steps: (size: string, orientation: string) => `Checkout steps, ${size} ${orientation}`,
    links: 'Checkout steps as links',
    one: [{ title: 'Review', description: 'Check and place the order' }],
    order: 'Order steps',
    setup: 'Setup steps',
    setupVertical: 'Setup steps, vertical',
    company: 'Company setup steps, vertical',
    long: [
      { title: 'Account and sign in details for every member of the team', description: 'Email, password and the way each person signs in' },
      { title: 'Delivery address and the times someone is there to receive it', description: 'We send the order to this address' },
      { title: 'Payment' },
    ],
    longLabel: 'Order steps with long titles',
    postal: 'Add a postal code',
    errorLabel: 'Checkout steps with an error',
    notNeeded: 'Not needed for free orders',
    skipped: 'Checkout steps with a step skipped',
  },
  ar: {
    checkout: checkoutAr,
    many: manyAr,
    tooMany: tooManyAr,
    steps: (size: string, orientation: string) => `خطوات الطلب، ${size} ${orientation === 'vertical' ? 'عمودي' : 'أفقي'}`,
    links: 'خطوات الطلب كروابط',
    one: [{ title: 'المراجعة', description: 'تأكد من الطلب قبل إرساله' }],
    order: 'خطوات الطلب',
    setup: 'خطوات الإعداد',
    setupVertical: 'خطوات الإعداد، عمودي',
    company: 'خطوات إعداد الشركة، عمودي',
    long: [
      { title: 'بيانات الحساب وطريقة تسجيل الدخول لكل عضو في الفريق', description: 'البريد وكلمة المرور وطريقة الدخول لكل شخص' },
      { title: 'عنوان التوصيل والأوقات اللي فيها أحد يستلم الطلب', description: 'نوصل الطلب لهذا العنوان' },
      { title: 'الدفع' },
    ],
    longLabel: 'خطوات الطلب بعناوين طويلة',
    postal: 'أضف الرمز البريدي',
    errorLabel: 'خطوات الطلب مع خطأ',
    notNeeded: 'ما تحتاجها الطلبات المجانية',
    skipped: 'خطوات الطلب مع خطوة متخطاة',
  },
};

const sizes: StepperSize[] = ['sm', 'md'];
const orientations: StepperOrientation[] = ['horizontal', 'vertical'];

/** A stepper the user can move through by picking a step. */
function Navigable({ steps, mode, lang }: { steps: StepperStep[]; mode: StepperMode; lang?: 'en' | 'ar' }) {
  const [current, setCurrent] = useState(2);
  return (
    <Stepper
      steps={steps}
      current={current}
      completed={mode === 'free' ? [0, 1] : undefined}
      mode={mode}
      onStepSelect={setCurrent}
      aria-label={lang === 'ar' ? `خطوات الطلب، ${mode === 'free' ? 'بأي ترتيب' : 'بالترتيب'}` : `Checkout steps, ${mode}`}
    />
  );
}

export default function StepperDemo() {
  const lang = isArabic(useTheme().lang) ? 'ar' : 'en';
  const w = words[lang];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, orientation and step states">
        {sizes.map((size) =>
          orientations.map((orientation) => (
            <DemoRow key={`${size}-${orientation}`} label={`${size}, ${orientation}`}>
              <Stepper
                steps={w.checkout}
                current={2}
                size={size}
                orientation={orientation}
                aria-label={w.steps(size, orientation)}
              />
            </DemoRow>
          )),
        )}
        <DemoRow label="Linear, steps can be picked">
          <Navigable steps={w.checkout} mode="linear" lang={lang} />
        </DemoRow>
        <DemoRow label="Free, any step can be picked">
          <Navigable steps={w.checkout} mode="free" lang={lang} />
        </DemoRow>
        <DemoRow label="Steps as links">
          <Stepper
            steps={w.checkout.map((s, i) => ({ ...s, href: `#checkout-${i + 1}` }))}
            current={2}
            aria-label={w.links}
          />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {orientations.map((orientation) => (
            <DemoRow key={orientation} label={orientation}>
              <Stepper steps={checkoutAr} current={1} orientation={orientation} aria-label="خطوات الطلب" />
            </DemoRow>
          ))}
          <DemoRow label="Navigable">
            <Navigable steps={checkoutAr} mode="linear" lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One step">
        <DemoRow>
          <Stepper steps={w.one} aria-label={w.order} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many steps">
        <DemoRow>
          <Stepper steps={w.many} current={3} aria-label={w.setup} />
        </DemoRow>
        <DemoRow>
          <Stepper steps={w.many} current={3} orientation="vertical" size="sm" aria-label={w.setupVertical} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many steps: twelve do not fit in a row, so they take the vertical form">
        <DemoRow>
          <Stepper steps={w.tooMany} current={6} size="sm" orientation="vertical" aria-label={w.company} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <Stepper steps={w.long} current={1} aria-label={w.longLabel} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Stepper
            steps={[
              { title: 'بيانات الحساب وطريقة تسجيل الدخول لكل عضو في الفريق', description: 'البريد وكلمة المرور وطريقة الدخول لكل شخص' },
              { title: 'عنوان التوصيل والأوقات اللي فيها أحد يستلم الطلب', description: 'نوصل الطلب لهذا العنوان' },
              { title: 'الدفع' },
            ]}
            current={1}
            aria-label="خطوات الطلب"
          />
        </DemoRow>
        <DemoRow>
          <Stepper steps={checkoutAr} current={3} orientation="vertical" aria-label="خطوات الطلب، عمودي" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="A step with errors">
        <DemoRow>
          <Stepper
            steps={w.checkout.map((s, i) => (i === 1 ? { ...s, invalid: true, description: w.postal } : s))}
            current={2}
            aria-label={w.errorLabel}
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="A step that cannot be reached">
        <DemoRow>
          <Stepper
            steps={w.checkout.map((s, i) => (i === 2 ? { ...s, disabled: true, description: w.notNeeded } : s))}
            current={1}
            completed={[0]}
            mode="free"
            onStepSelect={() => undefined}
            aria-label={w.skipped}
          />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
