import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import type { ButtonShape, ButtonSize } from '../Button';
import { CloseButton } from './index';

const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** Things that close, to name the control when a screen has more than one. */
const closables = ['Close panel', 'Close dialog', 'Close banner', 'Close drawer', 'Remove filter', 'Close preview'];

export default function CloseButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes and shapes; emphasis is always ghost">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            {shapes.map((shape) => (
              <CloseButton key={shape} size={size} shape={shape} />
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Named">
          <CloseButton label="Close panel" />
          <CloseButton label="Remove filter" size="xs" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic, the default name is إغلاق</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Sizes">
            {sizes.map((size) => (
              <CloseButton key={size} size={size} />
            ))}
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One close button">
        <DemoRow>
          <CloseButton />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many, each named for what it closes">
        <DemoRow>
          {closables.map((label) => (
            <CloseButton key={label} label={label} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long name, read by screen readers only">
        <DemoRow>
          <CloseButton label="Close the panel with every comment and reference on this board" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic name" lang="ar">
        <DemoRow>
          <CloseButton />
          <CloseButton label="إغلاق لوحة التعليقات والمراجع" size="lg" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <CloseButton disabled />
          <CloseButton disabled size="lg" shape="pill" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
