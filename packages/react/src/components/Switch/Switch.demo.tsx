import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { Switch, type SwitchSize } from './index';

const sizes: SwitchSize[] = ['sm', 'md', 'lg'];

const settings = [
  'Dark mode',
  'Show comments',
  'Snap to grid',
  'Show rulers',
  'Auto save',
  'Sounds',
  'Show hidden layers',
  'Spell check',
  'Keep the inspector open',
  'Show frame names',
  'Pixel grid',
  'Reduce motion',
];

function Controlled() {
  const [on, setOn] = useState(true);
  return (
    <Switch
      label="Auto save"
      description={on ? 'Changes save as you work.' : 'Save changes yourself with Command S.'}
      checked={on}
      onCheckedChange={setOn}
    />
  );
}

/** Switch in every content case. Space and Enter toggle; the setting takes effect at once. */
export default function SwitchDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes and states">
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            <Switch size={size} aria-label={`Show rulers, ${size}`} />
            <Switch size={size} aria-label={`Auto save, ${size}`} defaultChecked />
            <Switch size={size} label="Snap to grid" defaultChecked stateText={{ on: 'On', off: 'Off' }} />
          </DemoRow>
        ))}
        <Theme lang="ar">
          <DemoRow label="عربي">
            <Switch label="المحاذاة للشبكة" defaultChecked />
            <Switch label="الوضع الداكن" stateText={{ on: 'مفعل', off: 'غير مفعل' }} />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No visible label">
        <DemoRow>
          <Switch aria-label="Show comments" />
          <Switch aria-label="Show rulers" defaultChecked />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One switch with a description">
        <Controlled />
      </DemoCase>

      <DemoCase id="many" title="A short settings list">
        <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
          {settings.slice(0, 4).map((label, i) => (
            <Switch key={label} label={label} defaultChecked={i % 2 === 0} />
          ))}
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="A long settings list">
        <DemoGrid min="14rem">
          {settings.map((label, i) => (
            <Switch key={label} size="sm" label={label} defaultChecked={i % 3 === 0} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long label and description">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          <Switch label={sample.en.long} description={sample.en.long} stateText={{ on: 'On', off: 'Off' }} defaultChecked />
          <Switch label={sample.en.word} size="lg" />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          <Switch label="الحفظ التلقائي" description={sample.ar.long} defaultChecked stateText={{ on: 'مفعل', off: 'غير مفعل' }} />
          <Switch label="مشاركة بيانات الاستخدام مع فريق الدعم لتحسين الخدمة" size="lg" />
          <Switch label={sample.ar.word} />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field error="Turn on two step sign in. Your workspace asks for it.">
          <Switch label="Two step sign in" />
        </Field>
        <Theme lang="ar">
          <Field error="لازم تشغل التحقق بخطوتين، مساحة العمل تطلبه.">
            <Switch label="التحقق بخطوتين" />
          </Field>
        </Theme>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <Switch label="Show rulers" disabled />
          <Switch label="Auto save" disabled defaultChecked />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow>
            <Switch label="الإشعارات" disabled defaultChecked />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <DemoRow>
          <Switch label="Single sign on" readOnly defaultChecked description="Set by your workspace." />
          <Switch label="Guest access" readOnly />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow>
            <Switch label="الدخول الموحد" readOnly defaultChecked />
          </DemoRow>
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
