import { Bidi } from '../../theme/Bidi';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Input } from '../Input/Input';
import { Field, FieldDescription, FieldError, FieldLabel } from './index';

const formFields: [string, string][] = [
  ['First name', 'Sara'],
  ['Last name', 'Ahmed'],
  ['Job title', 'Product designer'],
  ['Company', 'Northwind'],
  ['Street address', '12 King Fahd Road'],
  ['City', 'Riyadh'],
  ['Postal code', '12211'],
  ['Country', 'Saudi Arabia'],
  ['Time zone', 'Arabia Standard Time'],
  ['Website', 'northwind.example.com'],
  ['Team name', 'Design'],
  ['Billing contact', 'Omar Khalid'],
];

/** Field with the one line API and the compound API, in every content case. */
export default function FieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Orientations, required, compound parts" lang="en">
        <DemoGrid min="18rem">
          <Field label="Board name" description="Shown on the board card.">
            <Input placeholder="For example, spring launch" />
          </Field>
          {/* A horizontal field shares its row with the label: it spans the grid, so the input has room for the placeholder. */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Board name" description="Shown on the board card." orientation="horizontal">
              <Input placeholder="For example, spring launch" />
            </Field>
          </div>
          <Field required>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" placeholder="name@example.com" />
            <FieldDescription>Sign in links go here.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Board size</FieldLabel>
            <Input type="number" end="px" defaultValue="1440" size="sm" shape="pill" />
            <FieldDescription>The width of the first frame.</FieldDescription>
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="Label only" lang="en">
        <Field label="Board name">
          <Input />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One field" lang="en">
        <Field label="Workspace name" description="Everyone in the workspace sees this name.">
          <Input defaultValue="Design team" />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="A short form" lang="en">
        <p data-demo="label">Fields marked * are required.</p>
        <DemoGrid min="16rem">
          <Field label="First name" required>
            <Input autoComplete="given-name" />
          </Field>
          <Field label="Last name" required>
            <Input autoComplete="family-name" />
          </Field>
          <Field label="Company" description="Shown on invoices.">
            <Input autoComplete="organization" />
          </Field>
          <Field label="Website">
            <Input type="url" placeholder="https://example.com" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="A long form in a narrow container" lang="en">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-l)' }}>
          {formFields.map(([label, value], i) => (
            <Field key={label} label={label} description={i % 4 === 0 ? 'Shown on invoices.' : undefined} required={i < 2}>
              <Input size="sm" defaultValue={value} />
            </Field>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long label, description and error" lang="en">
        <Field
          label="The name people see on the board card, in shared links and in every email we send about this board"
          description={sample.en.long}
          error="Use 60 characters or fewer, so the name fits on the board card."
          required
        >
          <Input defaultValue={`${sample.en.word} ${sample.en.long}`} />
        </Field>
        <Field orientation="horizontal" label={sample.en.word} description={sample.en.long}>
          <Input defaultValue={sample.en.word} />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <p data-demo="label">الحقول اللي عليها * مطلوبة.</p>
        <Field label="اسم مساحة العمل" required description={sample.ar.long}>
          <Input defaultValue="فريق التصميم والمحتوى" />
        </Field>
        <Field label="البريد الإلكتروني" required error={<Bidi>البريد ناقص. اكتبه كامل كذا: name@example.com</Bidi>}>
          <Input type="email" defaultValue="sara@" />
        </Field>
        <Field orientation="horizontal" label="المدينة" description="تظهر في الفواتير بس.">
          <Input defaultValue="الرياض" />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Value being checked" lang="en">
        <Field label="Workspace address">
          <Input defaultValue="design-team" end="loader" />
          <FieldDescription>Checking if this address is free.</FieldDescription>
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message" lang="en">
        <Field invalid>
          <FieldLabel>Board name</FieldLabel>
          <Input defaultValue="" placeholder="For example, spring launch" />
          <FieldError>Add a name, so people can find the board.</FieldError>
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled" lang="en">
        <Field label="Workspace" disabled description="Only owners can rename the workspace.">
          <Input defaultValue="Design team" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only" lang="en">
        <Field label="Workspace ID" readOnly description="Support asks for this when you write in.">
          <Input defaultValue="ws_4f9a21" />
        </Field>
      </DemoCase>

      {/* Floating labels: empty fields rest the label in the box at every size; a filled one and an invalid one show it above. */}
      <DemoCase id="floating" title="Floating label" lang="en">
        <DemoGrid min="14rem">
          <Field label="Team name" floating>
            <Input size="sm" />
          </Field>
          <Field label="Board name" floating description="Shown on the board card.">
            <Input />
          </Field>
          <Field label="Work email" floating>
            <Input size="lg" type="email" />
          </Field>
          <Field label="City" floating>
            <Input defaultValue="Riyadh" />
          </Field>
          <Field label="Email" floating error="Enter an email address, like name@example.com.">
            <Input type="email" defaultValue="sara@" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="floating-arabic" title="عنوان عائم" lang="ar">
        <DemoGrid min="14rem">
          <Field label="اسم الفريق" floating>
            <Input />
          </Field>
          <Field label="المدينة" floating>
            <Input defaultValue="الرياض" />
          </Field>
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
