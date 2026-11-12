import { Theme } from '../../theme';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Checkbox } from '../Checkbox/Checkbox';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Switch } from '../Switch/Switch';
import { Fieldset } from './index';

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

/** Fieldset in every content case that applies. Loading does not apply: a group has no pending state of its own. */
export default function FieldsetDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, and an Arabic row" lang="en">
        <DemoGrid min="16rem">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Fieldset key={size} size={size} legend="Delivery address" description="Where we send the printed boards.">
              <Field label="City">
                <Input autoComplete="address-level2" defaultValue="Riyadh" />
              </Field>
              <Field label="Postal code">
                <Input autoComplete="postal-code" defaultValue="12211" />
              </Field>
            </Fieldset>
          ))}
        </DemoGrid>
        <DemoGrid min="16rem">
          <Fieldset legend="Email notifications" description="Pick what lands in your inbox.">
            <Checkbox label="Comments on my boards" defaultChecked />
            <Checkbox label="Weekly summary" />
          </Fieldset>
          <Theme lang="ar">
            <Fieldset legend="عنوان التوصيل" description="المكان اللي نرسل له اللوحات المطبوعة.">
              <Field label="المدينة">
                <Input autoComplete="address-level2" defaultValue="الرياض" />
              </Field>
              <Field label="الرمز البريدي">
                <Input autoComplete="postal-code" defaultValue="12211" />
              </Field>
            </Fieldset>
          </Theme>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="Legend with one empty field" lang="en">
        <Fieldset legend="Company details">
          <Field label="Company">
            <Input autoComplete="organization" />
          </Field>
        </Fieldset>
      </DemoCase>

      <DemoCase id="one" title="One group" lang="en">
        <Fieldset legend="Delivery address" description="Where we send the printed boards.">
          {addressFields.map(([label, auto, value]) => (
            <Field key={label} label={label}>
              <Input autoComplete={auto} defaultValue={value} />
            </Field>
          ))}
        </Fieldset>
      </DemoCase>

      <DemoCase id="many" title="Several groups in one form" lang="en">
        <DemoGrid min="16rem">
          <Fieldset legend="Contact">
            <Field label="Full name">
              <Input autoComplete="name" />
            </Field>
            <Field label="Email">
              <Input type="email" autoComplete="email" />
            </Field>
          </Fieldset>
          <Fieldset legend="Delivery address">
            <Field label="City">
              <Input autoComplete="address-level2" />
            </Field>
            <Field label="Postal code">
              <Input autoComplete="postal-code" />
            </Field>
          </Fieldset>
          <Fieldset legend="Updates">
            <Switch label="Order updates by text message" />
            <Switch label="Product news by email" />
          </Fieldset>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="A long group in a narrow container" lang="en">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Fieldset legend="Billing details" size="sm">
            {manyFields.map(([label, auto]) => (
              <Field key={label} label={label}>
                <Input size="sm" autoComplete={auto} />
              </Field>
            ))}
          </Fieldset>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long legend and description" lang="en">
        <Fieldset
          legend="The address we print on every invoice, every receipt and every shipping label we send for this workspace"
          description={sample.en.long}
        >
          <Field label={sample.en.word}>
            <Input defaultValue={sample.en.word} />
          </Field>
        </Fieldset>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Fieldset legend="العنوان اللي يظهر في كل فاتورة وكل إيصال وكل ملصق شحن نرسله لمساحة العمل هذي" description={sample.ar.long}>
          <Field label="المدينة">
            <Input autoComplete="address-level2" defaultValue="الرياض" />
          </Field>
          <Field label="الحي">
            <Input autoComplete="address-level3" defaultValue="العليا" />
          </Field>
        </Fieldset>
        <Fieldset legend="تنبيهات البريد" error="اختر طريقة وحدة على الأقل عشان نوصلك.">
          <Checkbox label="التعليقات على لوحاتي" />
          <Checkbox label="الملخص الأسبوعي" />
        </Fieldset>
      </DemoCase>

      <DemoCase id="error" title="A group error" lang="en">
        <Fieldset legend="How should we reach you" error="Pick at least one way to reach you.">
          <Checkbox label="Email" />
          <Checkbox label="Text message" />
          <Checkbox label="Phone call" />
        </Fieldset>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled" lang="en">
        <Fieldset legend="Billing address" description="Only owners can change billing details." disabled>
          <Field label="City">
            <Input autoComplete="address-level2" defaultValue="Riyadh" />
          </Field>
          <Checkbox label="Use this address for shipping" defaultChecked />
        </Fieldset>
      </DemoCase>

      <DemoCase id="readonly" title="Read only fields" lang="en">
        <Fieldset legend="Workspace" description="Support asks for these when you write in.">
          <Field label="Workspace ID" readOnly>
            <Input defaultValue="ws_4f9a21" />
          </Field>
          <Field label="Region" readOnly>
            <Input defaultValue="Middle East (Riyadh)" />
          </Field>
        </Fieldset>
      </DemoCase>
    </DemoPage>
  );
}
