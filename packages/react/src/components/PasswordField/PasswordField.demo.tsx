import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { PasswordField, type PasswordFieldShape, type PasswordFieldSize } from './index';

const sizes: PasswordFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: PasswordFieldShape[] = ['default', 'pill'];

/** PasswordField in every content case. */
export default function PasswordFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, shapes, hidden and shown">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="14rem">
            {sizes.map((size) => (
              <PasswordField
                key={size}
                size={size}
                shape={shape}
                aria-label={`Password, ${size}, ${shape}`}
                defaultValue="spring-launch-26"
                defaultVisible={size === 'lg'}
              />
            ))}
          </DemoGrid>
        ))}
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <PasswordField aria-label="كلمة المرور" defaultValue="spring-launch-26" showLabel="إظهار كلمة المرور" hideLabel="إخفاء كلمة المرور" />
            <PasswordField
              aria-label="كلمة المرور الجديدة"
              autoComplete="new-password"
              defaultValue="spring-launch-26"
              defaultVisible
              showLabel="إظهار كلمة المرور"
              hideLabel="إخفاء كلمة المرور"
            />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <Field label="Password">
          <PasswordField />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One field in a sign in form">
        <form
          style={{ display: 'grid', gap: 'var(--ds-space-m)', maxInlineSize: 'var(--ds-dialog-width-sm)' }}
          onSubmit={(event) => event.preventDefault()}
        >
          <Field label="Email">
            <Input type="email" autoComplete="username" defaultValue="sara@example.com" />
          </Field>
          <Field label="Password">
            <PasswordField defaultValue="spring-launch-26" />
          </Field>
          <Button type="submit" emphasis="solid" tone="accent">
            Sign in
          </Button>
        </form>
      </DemoCase>

      <DemoCase id="many" title="Change password">
        <DemoGrid min="16rem">
          <Field label="Current password">
            <PasswordField defaultValue="spring-launch-26" />
          </Field>
          <Field label="New password" description="At least 12 characters. A phrase of four words works well.">
            <PasswordField autoComplete="new-password" defaultValue="blue kettle river 42" defaultVisible />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long value">
        <Field label="Recovery phrase" description={sample.en.long}>
          <PasswordField autoComplete="off" defaultValue="orbit velvet cactus lantern meadow harbor pencil quartz violin ember canyon glacier" defaultVisible />
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field label="كلمة المرور الجديدة" description="لا تقل عن 12 حرف. جملة من أربع كلمات تحفظها بسهولة وتكون أقوى من كلمة وحدة مع رموز.">
          <PasswordField
            autoComplete="new-password"
            defaultValue="قهوة الصباح مع الفريق كل أحد"
            defaultVisible
            showLabel="إظهار كلمة المرور"
            hideLabel="إخفاء كلمة المرور"
          />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="New password" error="Use at least 12 characters. Add a word or two to make it longer.">
          <PasswordField autoComplete="new-password" defaultValue="short" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Password" disabled description="Your company signs you in. Ask your admin to reset it.">
          <PasswordField defaultValue="spring-launch-26" />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="API key" readOnly description="Show it to copy it. It never changes here.">
          <PasswordField autoComplete="off" defaultValue="demo-key-4f8a2c91" showLabel="Show key" hideLabel="Hide key" />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
