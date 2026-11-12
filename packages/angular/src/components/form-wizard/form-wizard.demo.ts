// The FormWizard demo: the same cases, ids and copy as
// packages/react/src/components/FormWizard/FormWizard.demo.tsx. React's
// Checkout component is the #checkout template here; each stamp of it holds
// its own step templates, which read the stamp's language and prefill.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, Injector, inject, type TemplateRef } from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFormWizard, type FormWizardErrors, type FormWizardStep, type FormWizardTemplateContext, type FormWizardValues } from './form-wizard';

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

type Content = TemplateRef<FormWizardTemplateContext>;

/**
 * Demo helper: exposes the injector of an element. DI follows declaration,
 * so the shared #checkout template, declared outside the Arabic themes,
 * would read the page theme. Stamped with this injector it reads the
 * Arabic theme, as React's Theme context does.
 */
@Directive({ selector: '[demoInjector]', exportAs: 'demoInjector' })
class DemoInjector {
  readonly injector = inject(Injector);

  constructor() {
    consumeHostAttributes(['demoInjector']);
  }
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, NgTemplateOutlet, DsTheme, DsField, DsInput, DsFormWizard, DemoInjector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #checkout let-lang="lang" let-size="size" let-vertical="vertical" let-longText="longText" let-defaultStep="defaultStep"
      let-defaultErrors="defaultErrors" let-prefill="prefill" let-label="label">
      <div
        dsFormWizard
        [steps]="stepsFor(lang ?? 'en', !!longText, account, address, delivery, review)"
        [size]="size ?? 'md'"
        [orientation]="vertical ? 'vertical' : 'horizontal'"
        [defaultStep]="defaultStep ?? 0"
        [defaultErrors]="defaultErrors"
        [stepsLabel]="label ?? t(lang).steps"
        [submitLabel]="t(lang).place"
        [doneTitle]="t(lang).placed"
        [done]="doneText"
        [formProps]="formProps"
        [onSubmit]="place"
      ></div>
      <ng-template #doneText><p>{{ t(lang).placedText }}</p></ng-template>
      <ng-template #account let-errors="errors">
        <div dsField [label]="t(lang).name" required [error]="errors.name">
          <div dsInput name="name" autoComplete="name" [value]="prefill ? pre(lang).name : undefined"></div>
        </div>
        <div dsField [label]="t(lang).email" required [error]="errors.email">
          <div dsInput name="email" type="email" autoComplete="email" [value]="prefill ? pre(lang).email : undefined"></div>
        </div>
      </ng-template>
      <ng-template #address let-errors="errors">
        <div dsField [label]="t(lang).street" required [error]="errors.street">
          <div dsInput name="street" autoComplete="address-line1" [value]="prefill ? pre(lang).street : undefined"></div>
        </div>
        <div dsField [label]="t(lang).city" required [error]="errors.city">
          <div dsInput name="city" autoComplete="address-level2" [value]="prefill ? pre(lang).city : undefined"></div>
        </div>
        <div dsField [label]="t(lang).postal" required [description]="t(lang).postalHint" [error]="errors.postal">
          <div dsInput name="postal" inputMode="numeric" autoComplete="postal-code" [value]="prefill ? pre(lang).postal : undefined"></div>
        </div>
      </ng-template>
      <ng-template #delivery>
        <div dsField [label]="t(lang).note" [description]="t(lang).noteHint">
          <div dsInput name="note" [value]="prefill ? pre(lang).note : undefined"></div>
        </div>
      </ng-template>
      <ng-template #review let-values="values">
        <dl style="display: grid; gap: var(--ds-space-s); margin: 0px;">
          @for (name of reviewNames; track name) {
            <div style="display: grid; gap: var(--ds-space-3xs);">
              <dt style="color: var(--ds-color-text-muted); font-size: var(--ds-font-size-xs);">{{ t(lang)[name] }}</dt>
              <dd style="margin: 0px;">{{ text(values, name) || t(lang).none }}</dd>
            </div>
          }
        </dl>
      </ng-template>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: size and Stepper orientation">
      <div data-demo="row" label="md, horizontal">
        <ng-container *ngTemplateOutlet="checkout; context: { label: 'Checkout steps, md' }" />
      </div>
      <div data-demo="row" label="sm, vertical">
        <ng-container *ngTemplateOutlet="checkout; context: { size: 'sm', vertical: true, label: 'Checkout steps, sm vertical' }" />
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content" demoInjector #ar1="demoInjector">
        <div data-demo="row" label="md, horizontal">
          <ng-container *ngTemplateOutlet="checkout; context: { lang: 'ar' }; injector: ar1.injector" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many steps, on the review step">
      <div data-demo="row">
        <ng-container *ngTemplateOutlet="checkout; context: { defaultStep: 3, prefill: true, label: 'Checkout steps, review' }" />
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content" demoInjector #ar2="demoInjector">
        <div data-demo="row" label="Arabic">
          <ng-container *ngTemplateOutlet="checkout; context: { lang: 'ar', defaultStep: 3, prefill: true, vertical: true }; injector: ar2.injector" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <div data-demo="row">
        <ng-container *ngTemplateOutlet="checkout; context: { longText: true, label: 'Checkout steps, long titles' }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content" demoInjector #ar3="demoInjector">
        <div data-demo="row">
          <ng-container *ngTemplateOutlet="checkout; context: { lang: 'ar', longText: true, vertical: true }; injector: ar3.injector" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Errors sent back by the server">
      <div data-demo="row">
        <ng-container *ngTemplateOutlet="checkout; context: { defaultStep: 1, defaultErrors: serverEn, prefill: true, label: 'Checkout steps with an error' }" />
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content" demoInjector #ar4="demoInjector">
        <div data-demo="row" label="Arabic">
          <ng-container *ngTemplateOutlet="checkout; context: { lang: 'ar', defaultStep: 1, prefill: true, defaultErrors: serverAr }; injector: ar4.injector" />
        </div>
      </div>
    </section>
  `,
})
export default class FormWizardDemo {
  protected readonly t = (lang: unknown) => (lang === 'ar' ? copy.ar : copy.en);
  protected readonly pre = (lang: unknown) => (lang === 'ar' ? prefills.ar : prefills.en);
  protected readonly text = text;
  protected readonly reviewNames = ['name', 'email', 'street', 'city', 'postal', 'note'] as const;
  protected readonly formProps = { autoComplete: 'on' };
  protected readonly serverEn: Record<number, FormWizardErrors> = { 1: { postal: copy.en.postalServer } };
  protected readonly serverAr: Record<number, FormWizardErrors> = { 1: { postal: copy.ar.postalServer } };
  protected readonly place = () => new Promise<void>((resolve) => setTimeout(resolve, 600));

  /** One steps array per stamp, kept so the wizard input does not change on every check. */
  private readonly made = new WeakMap<Content, FormWizardStep[]>();

  /** The four checkout steps, in one language. */
  protected stepsFor(lang: Lang, longText: boolean, account: Content, address: Content, delivery: Content, review: Content): FormWizardStep[] {
    const kept = this.made.get(account);
    if (kept) return kept;
    const t = copy[lang];
    const pad = (s: string, extra: string) => (longText ? `${s} ${extra}` : s);
    const steps: FormWizardStep[] = [
      {
        id: 'account',
        title: pad(t.account, lang === 'ar' ? 'وبيانات التواصل اللي نستخدمها للفاتورة والتحديثات' : 'and the contact details we use for the receipt and updates'),
        description: t.accountHint,
        nextLabel: t.saveAccount,
        content: account,
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
        content: address,
      },
      { id: 'delivery', title: t.delivery, description: t.deliveryHint, nextLabel: t.reviewOrder, backLabel: t.editAddress, content: delivery },
      { id: 'review', title: t.review, description: t.reviewHint, backLabel: t.editDelivery, content: review },
    ];
    this.made.set(account, steps);
    return steps;
  }
}
