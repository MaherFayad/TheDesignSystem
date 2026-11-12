import { Theme } from '../../theme';
import { Bidi } from '../../theme/Bidi';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Label } from '../Label/Label';
import { FieldError } from './index';

const stack = {
  display: 'grid',
  gap: 'var(--ds-space-xs)',
  alignContent: 'start',
} as const;

/** FieldError alone, tied to a control with aria-describedby, and as the error part of Field. */
export default function FieldErrorDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, alone and in a Field" lang="en">
        <DemoGrid min="16rem">
          <div style={stack}>
            <Label htmlFor="fe-md">Board name</Label>
            <Input id="fe-md" invalid aria-describedby="fe-md-error" />
            <FieldError id="fe-md-error">Add a name, so people can find the board.</FieldError>
          </div>
          <div style={stack}>
            <Label htmlFor="fe-sm" size="sm">
              Width
            </Label>
            <Input id="fe-sm" size="sm" end="px" invalid defaultValue="0" aria-describedby="fe-sm-error" />
            <FieldError id="fe-sm-error" size="sm">
              Use 1 px or more.
            </FieldError>
          </div>
          <Field label="Email" error="Add the part after the @, for example name@example.com.">
            <Input type="email" defaultValue="sara@" />
          </Field>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="16rem">
            <div style={stack}>
              <Label htmlFor="fe-ar">اسم اللوحة</Label>
              <Input id="fe-ar" invalid aria-describedby="fe-ar-error" />
              <FieldError id="fe-ar-error">اكتب اسم للوحة عشان يلقاها الفريق.</FieldError>
            </div>
            <div style={stack}>
              <Label htmlFor="fe-ar-sm" size="sm">
                العرض
              </Label>
              <Input id="fe-ar-sm" size="sm" end="px" invalid defaultValue="0" aria-describedby="fe-ar-sm-error" />
              <FieldError id="fe-ar-sm-error" size="sm">
                أقل قيمة 1 بكسل.
              </FieldError>
            </div>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No message: nothing renders" lang="en">
        <Field label="Board name">
          <Input defaultValue="Spring launch" />
          <FieldError />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One error" lang="en">
        <Field label="Workspace address" error="This address is taken. Add a word or a number, for example design-team-2.">
          <Input defaultValue="design-team" />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Several errors after submit" lang="en">
        <DemoGrid min="16rem">
          <Field label="First name" required error="Add a first name.">
            <Input autoComplete="given-name" />
          </Field>
          <Field label="Email" required error="Add the part after the @, for example name@example.com.">
            <Input type="email" defaultValue="sara@" />
          </Field>
          <Field label="Website" error="Start the link with https://">
            <Input type="url" defaultValue="example.com" />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long message" lang="en">
        <div style={{ maxInlineSize: '20rem' }}>
          <Field label="Board name" error="Use 60 characters or fewer, so the whole name fits on the board card, in shared links and in the subject of every email we send about this board.">
            <Input defaultValue={sample.en.word} />
          </Field>
        </div>
        <div style={{ maxInlineSize: '20rem' }}>
          <Field label="Tag" error={`Split ${sample.en.word} into shorter words.`}>
            <Input defaultValue={sample.en.word} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: '20rem' }}>
          <Field label="البريد الإلكتروني" error={<Bidi>البريد ناقص. اكتبه كامل كذا: name@example.com، وبعدها احفظ التغييرات عشان نرسل لك رابط الدخول.</Bidi>}>
            <Input type="email" defaultValue="sara@" />
          </Field>
        </div>
      </DemoCase>
    </DemoPage>
  );
}
