import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from '../Button';
import { CopyButton } from './index';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

const command = 'npx the-system add button';

export default function CopyButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in solid, soft, outline, ghost and link">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {emphases.map((emphasis) => (
              <CopyButton key={emphasis} value={command} tone={tone} emphasis={emphasis} label="Copy command" />
            ))}
            <CopyButton value={command} tone={tone} iconOnly label="Copy command" />
          </DemoRow>
        ))}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <CopyButton size={size} value={command} label="Copy command" emphasis="soft" />
            <CopyButton size={size} value={command} iconOnly label="Copy command" />
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <CopyButton shape={shape} value={command} label="Copy link" emphasis="outline" />
            <CopyButton shape={shape} value={command} iconOnly label="Copy link" emphasis="soft" />
          </DemoRow>
        ))}
        <DemoRow label="Beside its value">
          <code id="copy-demo-command">{command}</code>
          <CopyButton value={command} target="copy-demo-command" iconOnly label="Copy command" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Default words">
            <CopyButton value={command} emphasis="soft" />
            <CopyButton value={command} label="نسخ الأمر" emphasis="outline" />
            <CopyButton value={command} iconOnly />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One copy button">
        <DemoRow>
          <CopyButton value={command} label="Copy command" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many values, one copy each">
        <DemoRow>
          <CopyButton value="https://example.com/board/42" label="Copy link" emphasis="soft" />
          <CopyButton value="board_42" label="Copy board id" emphasis="soft" />
          <CopyButton value="#ffd84d" label="Copy color" emphasis="soft" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <CopyButton
            value={command}
            label="Copy the full install command with every flag and the registry address"
            emphasis="soft"
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <CopyButton value={command} label="نسخ أمر التثبيت كامل مع كل الخيارات وعنوان المستودع" emphasis="soft" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <CopyButton value={command} disabled label="Copy command" emphasis="soft" />
          <CopyButton value={command} disabled iconOnly label="Copy command" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
