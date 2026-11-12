import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { InputGroup, InputGroupAddon, type InputGroupShape, type InputGroupSize } from './index';

const sizes: InputGroupSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: InputGroupShape[] = ['default', 'pill'];

const longPath = 'team/design/reviews/2026/november/landing-page-hero-directions-final-round';

/** InputGroup with add ons and actions, in every content case. */
export default function InputGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes and shapes">
        {shapes.map((shape) => (
          <DemoGrid key={shape} min="16rem">
            {sizes.map((size) => (
              <InputGroup key={size} size={size} shape={shape}>
                <InputGroupAddon>https://</InputGroupAddon>
                <Input aria-label={`Board address, ${size}, ${shape}`} defaultValue="boards.example.com" type="url" />
                <IconButton icon="copy" label="Copy address" />
              </InputGroup>
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="16rem">
          <InputGroup>
            <InputGroupAddon>SAR</InputGroupAddon>
            <Input aria-label="Price" type="number" defaultValue="249" />
          </InputGroup>
          <InputGroup>
            <Input aria-label="Width" type="number" defaultValue="320" />
            <InputGroupAddon>px</InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <Input aria-label="Email" type="email" placeholder="name@example.com" />
            <Button>Send invite</Button>
          </InputGroup>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <InputGroup dir="ltr">
              <InputGroupAddon>https://</InputGroupAddon>
              <Input aria-label="رابط اللوحة" type="url" defaultValue="boards.example.com" />
              <IconButton icon="copy" label="نسخ الرابط" />
            </InputGroup>
            <InputGroup>
              <Input aria-label="السعر" type="number" defaultValue="249" />
              <InputGroupAddon>ريال</InputGroupAddon>
            </InputGroup>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, placeholder only">
        <Field label="Workspace address">
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <Input placeholder="your-team" />
            <InputGroupAddon>.example.com</InputGroupAddon>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One add on">
        <Field label="Budget" description="Before VAT.">
          <InputGroup>
            <InputGroupAddon>SAR</InputGroupAddon>
            <Input type="number" defaultValue="12000" />
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Add ons and actions">
        <DemoGrid min="18rem">
          <Field label="Share link">
            <InputGroup>
              <InputGroupAddon>https://</InputGroupAddon>
              <Input type="url" readOnly defaultValue="boards.example.com/b/42" />
              <IconButton icon="copy" label="Copy link" />
              <IconButton icon="external" label="Open link" />
            </InputGroup>
          </Field>
          <Field label="Invite people">
            <InputGroup>
              <Input type="email" placeholder="name@example.com" />
              <Button emphasis="solid" tone="accent">
                Send invite
              </Button>
            </InputGroup>
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="Many groups in a narrow container">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-m)' }}>
          {['Width', 'Height', 'Gap', 'Padding', 'Radius', 'Border'].map((label, i) => (
            <Field key={label} label={label} orientation="horizontal">
              <InputGroup size="sm">
                <Input type="number" defaultValue={String((i + 1) * 8)} />
                <InputGroupAddon>px</InputGroupAddon>
              </InputGroup>
            </Field>
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long value and long add on">
        <Field label="Board address" description={sample.en.long}>
          <InputGroup>
            <InputGroupAddon>https://boards.example.com/</InputGroupAddon>
            <Input defaultValue={longPath} />
            <Button>Copy link</Button>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field label="رابط مساحة العمل" description={sample.ar.long}>
          <InputGroup dir="ltr">
            <InputGroupAddon>https://</InputGroupAddon>
            <Input type="url" defaultValue="boards.example.com/team/design" />
            <Button>نسخ الرابط</Button>
          </InputGroup>
        </Field>
        <Field label="الميزانية الشهرية للفريق قبل ضريبة القيمة المضافة">
          <InputGroup>
            <Input type="number" defaultValue="12000" />
            <InputGroupAddon>ريال سعودي</InputGroupAddon>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="loading" title="Action in flight">
        <Field label="Invite people">
          <InputGroup>
            <Input type="email" defaultValue="omar@example.com" />
            <Button loading loadingLabel="Sending invite">
              Send invite
            </Button>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message">
        <Field label="Workspace address" error="Use only letters, digits and dashes, for example spring-launch.">
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <Input defaultValue="spring launch" />
            <InputGroupAddon>.example.com</InputGroupAddon>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Field label="Workspace address" disabled description="Only owners can change the address.">
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <Input defaultValue="design-team" />
            <Button>Check address</Button>
          </InputGroup>
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <Field label="Board link" readOnly description="Copy it to share the board.">
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <Input type="url" defaultValue="boards.example.com/b/42" />
            <IconButton icon="copy" label="Copy link" />
          </InputGroup>
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
