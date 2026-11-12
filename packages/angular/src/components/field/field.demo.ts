// The Field demo: the same cases, ids and copy as
// packages/react/src/components/Field/Field.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsFieldError } from '../field-error/field-error';
import { DsInput } from '../input/input';
import { DsLabel } from '../label/label';
import { DemoBidi } from './demo-bidi';
import { DsField, DsFieldDescription } from './field';

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

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoBidi, DsField, DsFieldDescription, DsFieldError, DsInput, DsLabel, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Orientations, required, compound parts">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));">
          <div dsField label="Board name" description="Shown on the board card.">
            <div dsInput placeholder="For example, spring launch"></div>
          </div>
          <!-- A horizontal field shares its row with the label: it spans the grid, so the input has room for the placeholder. -->
          <div style="grid-column: 1 / -1;">
            <div dsField label="Board name" description="Shown on the board card." orientation="horizontal">
              <div dsInput placeholder="For example, spring launch"></div>
            </div>
          </div>
          <div dsField required>
            <label dsFieldLabel>Email</label>
            <div dsInput type="email" placeholder="name@example.com"></div>
            <p dsFieldDescription>Sign in links go here.</p>
          </div>
          <div dsField>
            <label dsFieldLabel>Board size</label>
            <div dsInput type="number" end="px" value="1440" size="sm" shape="pill"></div>
            <p dsFieldDescription>The width of the first frame.</p>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Label only">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Board name">
          <div dsInput></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Workspace name" description="Everyone in the workspace sees this name.">
          <div dsInput value="Design team"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A short form">
      <div dsTheme [lang]="'en'" data-demo="content">
        <p data-demo="label">Fields marked * are required.</p>
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));">
          <div dsField label="First name" required>
            <div dsInput autoComplete="given-name"></div>
          </div>
          <div dsField label="Last name" required>
            <div dsInput autoComplete="family-name"></div>
          </div>
          <div dsField label="Company" description="Shown on invoices.">
            <div dsInput autoComplete="organization"></div>
          </div>
          <div dsField label="Website">
            <div dsInput type="url" placeholder="https://example.com"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long form in a narrow container">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-l);">
          @for (f of formFields; track f[0]; let i = $index) {
            <div dsField [label]="f[0]" [description]="i % 4 === 0 ? 'Shown on invoices.' : undefined" [required]="i < 2">
              <div dsInput size="sm" [value]="f[1]"></div>
            </div>
          }
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long label, description and error">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div
          dsField
          label="The name people see on the board card, in shared links and in every email we send about this board"
          [description]="sample.en.long"
          error="Use 60 characters or fewer, so the name fits on the board card."
          required
        >
          <div dsInput [value]="sample.en.word + ' ' + sample.en.long"></div>
        </div>
        <div dsField orientation="horizontal" [label]="sample.en.word" [description]="sample.en.long">
          <div dsInput [value]="sample.en.word"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <p data-demo="label">الحقول اللي عليها * مطلوبة.</p>
        <div dsField label="اسم مساحة العمل" required [description]="sample.ar.long">
          <div dsInput value="فريق التصميم والمحتوى"></div>
        </div>
        <div dsField label="البريد الإلكتروني" required [error]="arError">
          <div dsInput type="email" value="sara@"></div>
        </div>
        <ng-template #arError><span data-ds="bidi" text="البريد ناقص. اكتبه كامل كذا: name@example.com"></span></ng-template>
        <div dsField orientation="horizontal" label="المدينة" description="تظهر في الفواتير بس.">
          <div dsInput value="الرياض"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Value being checked">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Workspace address">
          <div dsInput value="design-team" end="loader"></div>
          <p dsFieldDescription>Checking if this address is free.</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField invalid>
          <label dsFieldLabel>Board name</label>
          <div dsInput value="" placeholder="For example, spring launch"></div>
          <p dsFieldError>Add a name, so people can find the board.</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Workspace" disabled description="Only owners can rename the workspace.">
          <div dsInput value="Design team"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Workspace ID" readOnly description="Support asks for this when you write in.">
          <div dsInput value="ws_4f9a21"></div>
        </div>
      </div>
    </section>
  `,
})
export default class FieldDemo {
  protected readonly sample = sample;
  protected readonly formFields = formFields;
}
