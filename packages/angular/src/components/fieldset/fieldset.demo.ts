// The Fieldset demo: the same cases, ids and copy as
// packages/react/src/components/Fieldset/Fieldset.demo.tsx. Checkbox and
// Switch are the private stand ins of the ConsentField folder until the A3
// port merges.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsCheckbox } from '../checkbox/checkbox';
import { DsSwitch } from '../switch/switch';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DsFieldset } from './fieldset';

const addressFields: [string, string, string][] = [
  ['Street address', 'address-line1', '12 King Fahd Road'],
  ['District', 'address-level3', 'Al Olaya'],
  ['City', 'address-level2', 'Riyadh'],
  ['Postal code', 'postal-code', '12211'],
];

const manyFields: [string, string][] = [
  ['First name', 'given-name'],
  ['Last name', 'family-name'],
  ['Job title', 'organization-title'],
  ['Company', 'organization'],
  ['Work email', 'email'],
  ['Work phone', 'tel'],
  ['Street address', 'address-line1'],
  ['City', 'address-level2'],
  ['Postal code', 'postal-code'],
  ['Country', 'country-name'],
  ['Website', 'url'],
  ['Billing contact', 'name'],
];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsFieldset, DsField, DsInput, DsTheme, DsCheckbox, DsSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, and an Arabic row">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <fieldset dsFieldset [size]="size" legend="Delivery address" description="Where we send the printed boards.">
              <div dsField label="City"><div dsInput autoComplete="address-level2" value="Riyadh"></div></div>
              <div dsField label="Postal code"><div dsInput autoComplete="postal-code" value="12211"></div></div>
            </fieldset>
          }
        </div>
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          <fieldset dsFieldset legend="Email notifications" description="Pick what lands in your inbox.">
            <div dsCheckbox label="Comments on my boards" [defaultChecked]="true"></div>
            <div dsCheckbox label="Weekly summary"></div>
          </fieldset>
          <div dsTheme [lang]="'ar'">
            <fieldset dsFieldset legend="عنوان التوصيل" description="المكان اللي نرسل له اللوحات المطبوعة.">
              <div dsField label="المدينة"><div dsInput autoComplete="address-level2" value="الرياض"></div></div>
              <div dsField label="الرمز البريدي"><div dsInput autoComplete="postal-code" value="12211"></div></div>
            </fieldset>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Legend with one empty field">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="Company details">
          <div dsField label="Company"><div dsInput autoComplete="organization"></div></div>
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One group">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="Delivery address" description="Where we send the printed boards.">
          @for (f of addressFields; track f[0]) {
            <div dsField [label]="f[0]"><div dsInput [autoComplete]="f[1]" [value]="f[2]"></div></div>
          }
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Several groups in one form">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          <fieldset dsFieldset legend="Contact">
            <div dsField label="Full name"><div dsInput autoComplete="name"></div></div>
            <div dsField label="Email"><div dsInput type="email" autoComplete="email"></div></div>
          </fieldset>
          <fieldset dsFieldset legend="Delivery address">
            <div dsField label="City"><div dsInput autoComplete="address-level2"></div></div>
            <div dsField label="Postal code"><div dsInput autoComplete="postal-code"></div></div>
          </fieldset>
          <fieldset dsFieldset legend="Updates">
            <div dsSwitch label="Order updates by text message"></div>
            <div dsSwitch label="Product news by email"></div>
          </fieldset>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long group in a narrow container">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <fieldset dsFieldset legend="Billing details" size="sm">
            @for (f of manyFields; track f[0]) {
              <div dsField [label]="f[0]"><div dsInput size="sm" [autoComplete]="f[1]"></div></div>
            }
          </fieldset>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long legend and description">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset
          dsFieldset
          legend="The address we print on every invoice, every receipt and every shipping label we send for this workspace"
          [description]="sample.en.long"
        >
          <div dsField [label]="sample.en.word"><div dsInput [value]="sample.en.word"></div></div>
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <fieldset dsFieldset legend="العنوان اللي يظهر في كل فاتورة وكل إيصال وكل ملصق شحن نرسله لمساحة العمل هذي" [description]="sample.ar.long">
          <div dsField label="المدينة"><div dsInput autoComplete="address-level2" value="الرياض"></div></div>
          <div dsField label="الحي"><div dsInput autoComplete="address-level3" value="العليا"></div></div>
        </fieldset>
        <fieldset dsFieldset legend="تنبيهات البريد" error="اختر طريقة وحدة على الأقل عشان نوصلك.">
          <div dsCheckbox label="التعليقات على لوحاتي"></div>
          <div dsCheckbox label="الملخص الأسبوعي"></div>
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="A group error">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="How should we reach you" error="Pick at least one way to reach you.">
          <div dsCheckbox label="Email"></div>
          <div dsCheckbox label="Text message"></div>
          <div dsCheckbox label="Phone call"></div>
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="Billing address" description="Only owners can change billing details." disabled>
          <div dsField label="City"><div dsInput autoComplete="address-level2" value="Riyadh"></div></div>
          <div dsCheckbox label="Use this address for shipping" [defaultChecked]="true"></div>
        </fieldset>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only fields">
      <div dsTheme [lang]="'en'" data-demo="content">
        <fieldset dsFieldset legend="Workspace" description="Support asks for these when you write in.">
          <div dsField label="Workspace ID" readOnly><div dsInput value="ws_4f9a21"></div></div>
          <div dsField label="Region" readOnly><div dsInput value="Middle East (Riyadh)"></div></div>
        </fieldset>
      </div>
    </section>
  `,
})
export default class FieldsetDemo {
  protected readonly sample = sample;
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly addressFields = addressFields;
  protected readonly manyFields = manyFields;
}
