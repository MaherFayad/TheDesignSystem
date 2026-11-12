import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import { Checkbox, type CheckboxCheckedState, type CheckboxSize, type CheckboxTone } from './index';

const sizes: CheckboxSize[] = ['sm', 'md', 'lg'];
const tones: CheckboxTone[] = ['neutral', 'accent', 'danger'];
const states: CheckboxCheckedState[] = [false, true, 'indeterminate'];

const settings = [
  'Email me a weekly summary',
  'Show comments on the canvas',
  'Snap frames to the grid',
  'Show rulers',
  'Open links in a new tab',
  'Play sounds for mentions',
  'Show hidden layers',
  'Use system fonts in previews',
  'Keep the inspector open',
  'Ask before closing a board',
  'Show frame names',
  'Show the pixel grid',
];

function Controlled() {
  const [checked, setChecked] = useState<CheckboxCheckedState>(true);
  return (
    <Checkbox
      label="Send me product news"
      checked={checked}
      onCheckedChange={setChecked}
    />
  );
}

/** Checkbox in every content case. Space toggles; the label is part of the target. */
export default function CheckboxDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, tones and states">
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            {tones.map((tone) =>
              states.map((state) => (
                <Checkbox
                  key={`${tone}-${String(state)}`}
                  size={size}
                  tone={tone}
                  defaultChecked={state}
                  aria-label={`${tone} ${size} ${String(state)}`}
                />
              )),
            )}
          </DemoRow>
        ))}
        <DemoRow label="Label">
          <Checkbox label="Snap frames to the grid" defaultChecked />
          <Checkbox label="Show rulers" tone="accent" defaultChecked />
          <Checkbox label="Delete the old versions" tone="danger" defaultChecked="indeterminate" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow label="عربي">
            <Checkbox label="محاذاة الإطارات للشبكة" defaultChecked />
            <Checkbox label="عرض المساطر" tone="accent" defaultChecked />
            <Checkbox label="حذف النسخ القديمة" tone="danger" defaultChecked="indeterminate" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No visible label">
        <DemoRow>
          <Checkbox aria-label="Select the row" />
          <Checkbox aria-label="Select every row" defaultChecked="indeterminate" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One checkbox with a description">
        <Checkbox
          label="Email me a weekly summary"
          description="One email on Sunday with the boards you follow."
          defaultChecked
        />
        <Controlled />
      </DemoCase>

      <DemoCase id="many" title="A short list">
        <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)' }}>
          {settings.slice(0, 4).map((label, i) => (
            <Checkbox key={label} label={label} defaultChecked={i % 2 === 0} />
          ))}
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="A long list in two columns">
        <DemoGrid min="14rem">
          {settings.map((label, i) => (
            <Checkbox key={label} size="sm" label={label} defaultChecked={i % 3 === 0} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long label and description">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          <Checkbox label={sample.en.long} description={sample.en.long} defaultChecked />
          <Checkbox label={sample.en.word} size="lg" />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          <Checkbox label="ملخص أسبوعي على البريد" description={sample.ar.long} defaultChecked />
          <Checkbox label="الموافقة على شروط الاستخدام وسياسة الخصوصية" tone="accent" size="lg" />
          <Checkbox label={sample.ar.word} defaultChecked="indeterminate" />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field error="Agree to the terms to create the workspace." required>
          <Checkbox label="I agree to the terms of use" />
        </Field>
        <Theme lang="ar">
          <Field error="لازم توافق على الشروط عشان تنشئ مساحة العمل." required>
            <Checkbox label="الموافقة على شروط الاستخدام" />
          </Field>
        </Theme>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <Checkbox label="Off" disabled />
          <Checkbox label="On" disabled defaultChecked tone="accent" />
          <Checkbox label="Some" disabled defaultChecked="indeterminate" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow>
            <Checkbox label="الإشعارات" disabled defaultChecked />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <DemoRow>
          <Checkbox label="Two step sign in" readOnly defaultChecked />
          <Checkbox label="Single sign on" readOnly />
          <Checkbox label="Some members" readOnly defaultChecked="indeterminate" tone="accent" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow>
            <Checkbox label="التحقق بخطوتين" readOnly defaultChecked />
          </DemoRow>
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
