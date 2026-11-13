import { Bidi } from '../../theme/Bidi';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Field } from '../Field/Field';
import { Input, type InputShape, type InputSize } from './index';

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

/** Input on its own and inside a Field, in every content case. */
export default function InputDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, shapes and adornments">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="12rem">
            {sizes.map((size) => (
              <Input key={size} size={size} shape={shape} aria-label={`Board name, ${size}, ${shape}`} placeholder={`${size}, ${shape}`} />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="14rem">
          <Input start="search" placeholder="Search boards" aria-label="Search boards" type="search" />
          <Input start="$" end="USD" defaultValue="29" aria-label="Price" type="number" />
          <Input end="px" defaultValue="320" aria-label="Width" type="number" size="sm" />
          <Input start="link" end="external" defaultValue="example.com/board" aria-label="Board link" type="url" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="empty" title="Empty, placeholder only">
        <Field label="Board name">
          <Input placeholder="For example, spring launch" />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One field">
        <Field label="Board name" description="Shown on the board card and in shared links.">
          <Input defaultValue="Spring launch" />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="A short form">
        <p data-demo="label">Fields marked * are required.</p>
        <DemoGrid min="16rem">
          <Field label="Full name" required>
            <Input autoComplete="name" defaultValue="Sara Ahmed" />
          </Field>
          <Field label="Email" required description="Sign in links go here.">
            <Input type="email" autoComplete="email" placeholder="name@example.com" />
          </Field>
          <Field label="Phone">
            <Input type="tel" autoComplete="tel" placeholder="+966 5x xxx xxxx" />
          </Field>
          <Field label="Password" required description="At least 12 characters.">
            <Input type="password" autoComplete="new-password" start="lock" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="A long form in a narrow container">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          {formFields.map(([label, value]) => (
            <Field key={label} label={label} orientation="horizontal">
              <Input size="sm" defaultValue={value} />
            </Field>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long value and long label">
        <Field
          label="The address people open to see this board, including every filter and the sort order"
          description={sample.en.long}
        >
          <Input type="url" defaultValue={longValue} />
        </Field>
        <Field label={sample.en.word}>
          <Input defaultValue={`${sample.en.word} ${sample.en.word} ${sample.en.word}`} />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <p data-demo="label">الحقول اللي عليها * مطلوبة.</p>
        <Field label="اسم اللوحة" description={sample.ar.long}>
          <Input defaultValue="إطلاق الربيع، الاتجاهات النهائية للواجهة الرئيسية وصفحة الأسعار" />
        </Field>
        <Field label="البريد الإلكتروني" required description="يوصلك عليه رابط الدخول، وما يشوفه أحد غيرك.">
          <Input type="email" placeholder="name@example.com" />
        </Field>
        <Field
          label="رابط اللوحة"
          error={<Bidi>الرابط ناقص. ابدأه بـ https:// وبعده اسم الموقع.</Bidi>}
        >
          <Input type="url" defaultValue="boards.example.com" />
        </Field>
        <Field label="رقم الجوال" orientation="horizontal">
          <Input type="tel" placeholder="05x xxx xxxx" />
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Value being checked">
        <Field label="Workspace address" description="Checking if this address is free.">
          <Input defaultValue="spring-launch" start="globe" end="loader" />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="Email" required error="Add the part after the @, for example name@example.com.">
          <Input type="email" defaultValue="sara@" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoGrid min="16rem">
          <Field label="Workspace" disabled description="Only owners can rename the workspace.">
            <Input defaultValue="Design team" />
          </Field>
          <Field label="Search" disabled>
            <Input start="search" placeholder="Search boards" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <DemoGrid min="16rem">
          <Field label="Board link" readOnly description="Copy it to share the board.">
            <Input type="url" start="link" defaultValue="https://boards.example.com/b/42" />
          </Field>
          <Field label="Plan" readOnly>
            <Input defaultValue="Team, yearly" />
          </Field>
        </DemoGrid>
      </DemoCase>
      {/* variant: a platform may draw a field filled or outlined (Android draws filled when no variant is passed). */}
      <DemoCase id="variant" title="Outlined and filled">
        <DemoGrid min="14rem">
          <Field label="Board name">
            <Input variant="outlined" defaultValue="Spring launch" />
          </Field>
          <Field label="Team name">
            <Input variant="filled" defaultValue="Design" />
          </Field>
          <Field label="اسم اللوحة" lang="ar" dir="rtl">
            <Input variant="filled" defaultValue="إطلاق الربيع" />
          </Field>
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
