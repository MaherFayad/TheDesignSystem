import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
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
  { title: 'الحساب', description: 'الإيميل وكلمة المرور' },
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

const sizes: StepperSize[] = ['sm', 'md'];
const orientations: StepperOrientation[] = ['horizontal', 'vertical'];

/** A stepper the user can move through by picking a step. */
function Navigable({ steps, mode, lang }: { steps: StepperStep[]; mode: StepperMode; lang?: 'ar' }) {
  const [current, setCurrent] = useState(2);
  return (
    <Stepper
      steps={steps}
      current={current}
      completed={mode === 'free' ? [0, 1] : undefined}
      mode={mode}
      onStepSelect={setCurrent}
      aria-label={lang === 'ar' ? 'خطوات الطلب' : `Checkout steps, ${mode}`}
    />
  );
}

export default function StepperDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size, orientation and step states">
        {sizes.map((size) =>
          orientations.map((orientation) => (
            <DemoRow key={`${size}-${orientation}`} label={`${size}, ${orientation}`}>
              <Stepper
                steps={checkout}
                current={2}
                size={size}
                orientation={orientation}
                aria-label={`Checkout steps, ${size} ${orientation}`}
              />
            </DemoRow>
          )),
        )}
        <DemoRow label="Linear, steps can be picked">
          <Navigable steps={checkout} mode="linear" />
        </DemoRow>
        <DemoRow label="Free, any step can be picked">
          <Navigable steps={checkout} mode="free" />
        </DemoRow>
        <DemoRow label="Steps as links">
          <Stepper
            steps={checkout.map((s, i) => ({ ...s, href: `#checkout-${i + 1}` }))}
            current={2}
            aria-label="Checkout steps as links"
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
          <Stepper steps={[{ title: 'Review', description: 'Check and place the order' }]} aria-label="Order steps" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many steps">
        <DemoRow>
          <Stepper steps={many} current={3} aria-label="Setup steps" />
        </DemoRow>
        <DemoRow>
          <Stepper steps={many} current={3} orientation="vertical" size="sm" aria-label="Setup steps, vertical" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many steps: twelve do not fit in a row, so they take the vertical form">
        <DemoRow>
          <Stepper steps={tooMany} current={6} size="sm" orientation="vertical" aria-label="Company setup steps, vertical" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <Stepper
            steps={[
              { title: 'Account and sign in details for every member of the team', description: 'Email, password and the way each person signs in' },
              { title: 'Delivery address and the times someone is there to receive it', description: 'We send the order to this address' },
              { title: 'Payment' },
            ]}
            current={1}
            aria-label="Order steps with long titles"
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Stepper
            steps={[
              { title: 'بيانات الحساب وطريقة تسجيل الدخول لكل عضو في الفريق', description: 'الإيميل وكلمة المرور وطريقة الدخول لكل شخص' },
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
            steps={checkout.map((s, i) => (i === 1 ? { ...s, invalid: true, description: 'Add a postal code' } : s))}
            current={2}
            aria-label="Checkout steps with an error"
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="A step that cannot be reached">
        <DemoRow>
          <Stepper
            steps={checkout.map((s, i) => (i === 2 ? { ...s, disabled: true, description: 'Not needed for free orders' } : s))}
            current={1}
            completed={[0]}
            mode="free"
            onStepSelect={() => undefined}
            aria-label="Checkout steps with a step skipped"
          />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
