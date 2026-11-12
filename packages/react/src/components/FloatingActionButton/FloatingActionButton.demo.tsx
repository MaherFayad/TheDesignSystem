import type { CSSProperties } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import type { ButtonShape, ButtonTone } from '../Button';
import { FloatingActionButton } from './index';
import type { FloatingActionButtonSize } from './index';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const sizes: FloatingActionButtonSize[] = ['md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** A small screen stand in: the FAB floats at its inline end and block end. */
const screen: CSSProperties = {
  position: 'relative',
  inlineSize: '100%',
  blockSize: 'var(--ds-dialog-width-sm)',
  maxInlineSize: 'var(--ds-dialog-width-md)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  borderRadius: 'var(--ds-radius-card)',
  background: 'var(--ds-color-bg-surface)',
  overflow: 'hidden',
};

export default function FloatingActionButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: tones, sizes, shapes, extended">
        <DemoRow label="Tones">
          {tones.map((tone) => (
            <FloatingActionButton key={tone} position="static" tone={tone} icon="plus" label="Create board" />
          ))}
        </DemoRow>
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <FloatingActionButton position="static" size={size} icon="plus" label="Create board" />
            <FloatingActionButton position="static" size={size} icon="plus" label="Create board" extended />
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <FloatingActionButton position="static" shape={shape} icon="edit" label="Write note" />
            <FloatingActionButton position="static" shape={shape} icon="edit" label="Write note" extended />
          </DemoRow>
        ))}
        <DemoRow label="Floating in a screen">
          <div style={screen}>
            <FloatingActionButton position="absolute" icon="plus" label="Create board" extended />
          </div>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Extended">
            <FloatingActionButton position="static" icon="plus" label="إنشاء لوحة" extended />
            <FloatingActionButton position="static" icon="plus" label="إنشاء لوحة" />
          </DemoRow>
          <DemoRow label="Floating in a screen">
            <div style={screen}>
              <FloatingActionButton position="absolute" icon="edit" label="كتابة ملاحظة" extended />
            </div>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One action, floating">
        <div style={screen}>
          <FloatingActionButton position="absolute" icon="plus" label="Create board" />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text, extended">
        <DemoRow>
          <FloatingActionButton
            position="static"
            icon="plus"
            label="Create a board from every reference in this folder"
            extended
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <FloatingActionButton position="static" icon="plus" label="إنشاء لوحة من كل المراجع في المجلد" extended />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <DemoRow>
          <FloatingActionButton position="static" icon="send" label="Send message" loading />
          <FloatingActionButton position="static" icon="send" label="Send message" extended loading />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <FloatingActionButton position="static" icon="plus" label="Create board" disabled />
          <FloatingActionButton position="static" icon="plus" label="Create board" extended disabled />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
