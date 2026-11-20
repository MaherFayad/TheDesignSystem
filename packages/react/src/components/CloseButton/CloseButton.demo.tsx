import type { ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import type { ButtonShape, ButtonSize } from '../Button';
import { CloseButton } from './index';

const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** Things that close, to name the control when a screen has more than one. */
const closables = ['Close panel', 'Close dialog', 'Close banner', 'Close drawer', 'Remove filter', 'Close preview'];

/** Stand ins for a picture under the raised close: a light one, a dark one and a busy one, from tokens. */
const pictures = [
  'linear-gradient(135deg, var(--ds-color-bg-surface), var(--ds-color-state-warning-tint-10))',
  'linear-gradient(135deg, var(--ds-color-glass-backdrop-dark), var(--ds-color-primary-fill))',
  'linear-gradient(135deg, var(--ds-color-state-danger-solid), var(--ds-color-primary-fill) 50%, var(--ds-color-state-warning-solid))',
];

function OverPicture({ background, children }: { background: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'flex-end',
        inlineSize: 'calc(var(--ds-size-touch-ios) * 4)',
        blockSize: 'calc(var(--ds-size-touch-ios) * 2)',
        padding: 'var(--ds-space-s)',
        boxSizing: 'border-box',
        borderRadius: 'var(--ds-radius-card)',
        backgroundImage: background,
      }}
    >
      {children}
    </div>
  );
}

export default function CloseButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes, shapes and emphasis">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            {shapes.map((shape) => (
              <CloseButton key={shape} size={size} shape={shape} />
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Raised (emphasis solid)">
          {shapes.map((shape) => (
            <CloseButton key={shape} shape={shape} emphasis="solid" />
          ))}
        </DemoRow>
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

      <DemoCase id="raised" title="Raised (emphasis solid): a filled disc over a picture">
        <DemoRow label="Over a light, a dark and a busy picture">
          {pictures.map((background) => (
            <OverPicture key={background} background={background}>
              <CloseButton emphasis="solid" label="Close preview" />
            </OverPicture>
          ))}
        </DemoRow>
        <DemoRow label="Sizes">
          {sizes.map((size) => (
            <CloseButton key={size} size={size} emphasis="solid" />
          ))}
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="فوق صورة">
            <OverPicture background={pictures[2] ?? ''}>
              <CloseButton emphasis="solid" label="إغلاق المعاينة" />
            </OverPicture>
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
