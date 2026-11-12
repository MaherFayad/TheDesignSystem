import { Theme } from '../../theme';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Input } from '../Input/Input';
import { Label } from './index';

const stack = {
  display: 'grid',
  gap: 'var(--ds-space-xs)',
  alignContent: 'start',
} as const;

/** Label alone, pointed at a control with htmlFor, in every content case that applies. */
export default function LabelDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, required, optional" lang="en">
        <DemoGrid min="14rem">
          <div style={stack}>
            <Label htmlFor="label-md">Board name</Label>
            <Input id="label-md" />
          </div>
          <div style={stack}>
            <Label htmlFor="label-sm" size="sm">
              Board name
            </Label>
            <Input id="label-sm" size="sm" />
          </div>
          <div style={stack}>
            <Label htmlFor="label-required" required>
              Email
            </Label>
            <Input id="label-required" type="email" />
          </div>
          <div style={stack}>
            <Label htmlFor="label-optional" optional="Optional">
              Company
            </Label>
            <Input id="label-optional" />
          </div>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="14rem">
            <div style={stack}>
              <Label htmlFor="label-ar" required>
                البريد الإلكتروني
              </Label>
              <Input id="label-ar" type="email" />
            </div>
            <div style={stack}>
              <Label htmlFor="label-ar-optional" optional="اختياري" size="sm">
                اسم الشركة
              </Label>
              <Input id="label-ar-optional" size="sm" />
            </div>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One label" lang="en">
        <div style={stack}>
          <Label htmlFor="label-one">Workspace name</Label>
          <Input id="label-one" defaultValue="Design team" />
        </div>
      </DemoCase>

      <DemoCase id="many" title="Labels in a row" lang="en">
        <DemoRow>
          {['Width', 'Height', 'Rotation'].map((name) => (
            <div key={name} style={{ ...stack, inlineSize: '8rem' }}>
              <Label htmlFor={`label-many-${name}`} size="sm">
                {name}
              </Label>
              <Input id={`label-many-${name}`} size="sm" end="px" defaultValue="120" />
            </div>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long label" lang="en">
        <div style={{ ...stack, maxInlineSize: '20rem' }}>
          <Label htmlFor="label-long" required>
            The name people see on the board card, in shared links and in every email we send about this board
          </Label>
          <Input id="label-long" />
        </div>
        <div style={{ ...stack, maxInlineSize: '20rem' }}>
          <Label htmlFor="label-word">{sample.en.word}</Label>
          <Input id="label-word" />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ ...stack, maxInlineSize: '20rem' }}>
          <Label htmlFor="label-long-ar" optional="اختياري">
            الاسم اللي يشوفه الفريق على بطاقة اللوحة وفي الروابط المشتركة وفي كل رسالة نرسلها عن اللوحة
          </Label>
          <Input id="label-long-ar" />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Label of an invalid control" lang="en">
        <div style={stack}>
          <Label htmlFor="label-invalid" invalid required>
            Email
          </Label>
          <Input id="label-invalid" type="email" invalid defaultValue="sara@" />
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled" lang="en">
        <div style={stack}>
          <Label htmlFor="label-disabled" disabled>
            Workspace
          </Label>
          <Input id="label-disabled" disabled defaultValue="Design team" />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
