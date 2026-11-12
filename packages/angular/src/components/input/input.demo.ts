// The Input demo: the same cases, ids and copy as
// packages/react/src/components/Input/Input.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DemoBidi } from '../field/demo-bidi';
import { DsField } from '../field/field';
import { DsInput, type InputShape, type InputSize } from './input';

const sizes: InputSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: InputShape[] = ['default', 'pill'];

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

const longValue =
  'https://boards.example.com/team/design/reviews/2026/november/landing-page-hero-directions-final-round?view=grid&sort=recent';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoBidi, DsField, DsInput, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, shapes and adornments">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsInput [size]="size" [shape]="shape" [aria-label]="'Board name, ' + size + ', ' + shape" [placeholder]="size + ', ' + shape"></div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));">
        <div dsInput start="search" placeholder="Search boards" aria-label="Search boards" type="search"></div>
        <div dsInput start="$" end="USD" value="29" aria-label="Price" type="number"></div>
        <div dsInput end="px" value="320" aria-label="Width" type="number" size="sm"></div>
        <div dsInput start="link" end="external" value="example.com/board" aria-label="Board link" type="url"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, placeholder only">
      <div dsField label="Board name">
        <div dsInput placeholder="For example, spring launch"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field">
      <div dsField label="Board name" description="Shown on the board card and in shared links.">
        <div dsInput value="Spring launch"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A short form">
      <p data-demo="label">Fields marked * are required.</p>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsField label="Full name" required>
          <div dsInput autoComplete="name" value="Sara Ahmed"></div>
        </div>
        <div dsField label="Email" required description="Sign in links go here.">
          <div dsInput type="email" autoComplete="email" placeholder="name@example.com"></div>
        </div>
        <div dsField label="Phone">
          <div dsInput type="tel" autoComplete="tel" placeholder="+966 5x xxx xxxx"></div>
        </div>
        <div dsField label="Password" required description="At least 12 characters.">
          <div dsInput type="password" autoComplete="new-password" start="lock"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="A long form in a narrow container">
      <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
        @for (f of formFields; track f[0]) {
          <div dsField [label]="f[0]" orientation="horizontal">
            <div dsInput size="sm" [value]="f[1]"></div>
          </div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long value and long label">
      <div dsField label="The address people open to see this board, including every filter and the sort order" [description]="sample.en.long">
        <div dsInput type="url" [value]="longValue"></div>
      </div>
      <div dsField [label]="sample.en.word">
        <div dsInput [value]="sample.en.word + ' ' + sample.en.word + ' ' + sample.en.word"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <p data-demo="label">الحقول اللي عليها * مطلوبة.</p>
        <div dsField label="اسم اللوحة" [description]="sample.ar.long">
          <div dsInput value="إطلاق الربيع، الاتجاهات النهائية للواجهة الرئيسية وصفحة الأسعار"></div>
        </div>
        <div dsField label="البريد الإلكتروني" required description="يوصلك عليه رابط الدخول، وما يشوفه أحد غيرك.">
          <div dsInput type="email" placeholder="name@example.com"></div>
        </div>
        <div dsField label="رابط اللوحة" [error]="arError">
          <div dsInput type="url" value="boards.example.com"></div>
        </div>
        <ng-template #arError><span data-ds="bidi" text="الرابط ناقص. ابدأه بـ https:// وبعده اسم الموقع."></span></ng-template>
        <div dsField label="رقم الجوال" orientation="horizontal">
          <div dsInput type="tel" placeholder="05x xxx xxxx"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Value being checked">
      <div dsField label="Workspace address" description="Checking if this address is free.">
        <div dsInput value="spring-launch" start="globe" end="loader"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="Email" required error="Add the part after the @, for example name@example.com.">
        <div dsInput type="email" value="sara@"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsField label="Workspace" disabled description="Only owners can rename the workspace.">
          <div dsInput value="Design team"></div>
        </div>
        <div dsField label="Search" disabled>
          <div dsInput start="search" placeholder="Search boards"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsField label="Board link" readOnly description="Copy it to share the board.">
          <div dsInput type="url" start="link" value="https://boards.example.com/b/42"></div>
        </div>
        <div dsField label="Plan" readOnly>
          <div dsInput value="Team, yearly"></div>
        </div>
      </div>
    </section>
  `,
})
export default class InputDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly formFields = formFields;
  protected readonly longValue = longValue;
}
