// The Stepper demo: the same cases, ids and copy as
// packages/react/src/components/Stepper/Stepper.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsStepper, type StepperOrientation, type StepperSize, type StepperStep } from './stepper';

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

const many: StepperStep[] = [{ title: 'Workspace' }, { title: 'Team' }, { title: 'Roles' }, { title: 'Billing' }, { title: 'Review' }];

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

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: size, orientation and step states">
      @for (size of sizes; track size) {
        @for (orientation of orientations; track orientation) {
          <div data-demo="row" [label]="size + ', ' + orientation">
            <ol dsStepper [steps]="checkout" [current]="2" [size]="size" [orientation]="orientation" [aria-label]="'Checkout steps, ' + size + ' ' + orientation"></ol>
          </div>
        }
      }
      <div data-demo="row" label="Linear, steps can be picked">
        <ol dsStepper [steps]="checkout" [current]="linear()" mode="linear" [onStepSelect]="pickLinear" aria-label="Checkout steps, linear"></ol>
      </div>
      <div data-demo="row" label="Free, any step can be picked">
        <ol dsStepper [steps]="checkout" [current]="free()" [completed]="[0, 1]" mode="free" [onStepSelect]="pickFree" aria-label="Checkout steps, free"></ol>
      </div>
      <div data-demo="row" label="Steps as links">
        <ol dsStepper [steps]="linked" [current]="2" aria-label="Checkout steps as links"></ol>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        @for (orientation of orientations; track orientation) {
          <div data-demo="row" [label]="orientation">
            <ol dsStepper [steps]="checkoutAr" [current]="1" [orientation]="orientation" aria-label="خطوات الطلب"></ol>
          </div>
        }
        <div data-demo="row" label="Navigable">
          <ol dsStepper [steps]="checkoutAr" [current]="arabic()" mode="linear" [onStepSelect]="pickArabic" aria-label="خطوات الطلب"></ol>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One step">
      <div data-demo="row">
        <ol dsStepper [steps]="one" aria-label="Order steps"></ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many steps">
      <div data-demo="row">
        <ol dsStepper [steps]="many" [current]="3" aria-label="Setup steps"></ol>
      </div>
      <div data-demo="row">
        <ol dsStepper [steps]="many" [current]="3" orientation="vertical" size="sm" aria-label="Setup steps, vertical"></ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many steps: twelve do not fit in a row, so they take the vertical form">
      <div data-demo="row">
        <ol dsStepper [steps]="tooMany" [current]="6" size="sm" orientation="vertical" aria-label="Company setup steps, vertical"></ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <div data-demo="row">
        <ol dsStepper [steps]="longText" [current]="1" aria-label="Order steps with long titles"></ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <ol dsStepper [steps]="longArabic" [current]="1" aria-label="خطوات الطلب"></ol>
        </div>
        <div data-demo="row">
          <ol dsStepper [steps]="checkoutAr" [current]="3" orientation="vertical" aria-label="خطوات الطلب، عمودي"></ol>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="A step with errors">
      <div data-demo="row">
        <ol dsStepper [steps]="withError" [current]="2" aria-label="Checkout steps with an error"></ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="A step that cannot be reached">
      <div data-demo="row">
        <ol dsStepper [steps]="withDisabled" [current]="1" [completed]="[0]" mode="free" [onStepSelect]="noop" aria-label="Checkout steps with a step skipped"></ol>
      </div>
    </section>
  `,
})
export default class StepperDemo {
  protected readonly sizes = sizes;
  protected readonly orientations = orientations;
  protected readonly checkout = checkout;
  protected readonly checkoutAr = checkoutAr;
  protected readonly many = many;
  protected readonly tooMany = tooMany;
  protected readonly linked = checkout.map((s, i) => ({ ...s, href: `#checkout-${i + 1}` }));
  protected readonly one: StepperStep[] = [{ title: 'Review', description: 'Check and place the order' }];
  protected readonly longText: StepperStep[] = [
    { title: 'Account and sign in details for every member of the team', description: 'Email, password and the way each person signs in' },
    { title: 'Delivery address and the times someone is there to receive it', description: 'We send the order to this address' },
    { title: 'Payment' },
  ];
  protected readonly longArabic: StepperStep[] = [
    { title: 'بيانات الحساب وطريقة تسجيل الدخول لكل عضو في الفريق', description: 'الإيميل وكلمة المرور وطريقة الدخول لكل شخص' },
    { title: 'عنوان التوصيل والأوقات اللي فيها أحد يستلم الطلب', description: 'نوصل الطلب لهذا العنوان' },
    { title: 'الدفع' },
  ];
  protected readonly withError = checkout.map((s, i) => (i === 1 ? { ...s, invalid: true, description: 'Add a postal code' } : s));
  protected readonly withDisabled = checkout.map((s, i) => (i === 2 ? { ...s, disabled: true, description: 'Not needed for free orders' } : s));

  protected readonly linear = signal(2);
  protected readonly free = signal(2);
  protected readonly arabic = signal(2);
  protected readonly pickLinear = (i: number) => this.linear.set(i);
  protected readonly pickFree = (i: number) => this.free.set(i);
  protected readonly pickArabic = (i: number) => this.arabic.set(i);
  protected readonly noop = () => undefined;
}
