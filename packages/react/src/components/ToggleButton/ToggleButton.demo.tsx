import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from '../Button';
import { ToggleButton } from './index';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: Exclude<ButtonEmphasis, 'link'>[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** Settings a toggle names: a noun for the state it turns on. */
const toneLabel: Record<ButtonTone, string> = {
  neutral: 'Grid view',
  accent: 'Live preview',
  danger: 'Mute alerts',
  success: 'Auto save',
  warning: 'Strict mode',
  info: 'Show hints',
};

const toneLabelAr: Record<ButtonTone, string> = {
  neutral: 'عرض الشبكة',
  accent: 'المعاينة المباشرة',
  danger: 'كتم التنبيهات',
  success: 'الحفظ التلقائي',
  warning: 'الوضع الصارم',
  info: 'عرض التلميحات',
};

const settings = [
  'Bold',
  'Italic',
  'Underline',
  'Grid view',
  'Snap to grid',
  'Show rulers',
  'Show guides',
  'Live preview',
  'Auto save',
  'Dark canvas',
  'Pixel preview',
  'Outline mode',
];

export default function ToggleButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in solid, soft, outline and ghost, off then on">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {emphases.map((emphasis) => (
              <ToggleButton key={`${emphasis}-off`} tone={tone} emphasis={emphasis}>
                {toneLabel[tone]}
              </ToggleButton>
            ))}
            {emphases.map((emphasis) => (
              <ToggleButton key={`${emphasis}-on`} tone={tone} emphasis={emphasis} defaultPressed>
                {toneLabel[tone]}
              </ToggleButton>
            ))}
          </DemoRow>
        ))}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <ToggleButton size={size} start="grid">
              Grid view
            </ToggleButton>
            <ToggleButton size={size} start="grid" defaultPressed>
              Grid view
            </ToggleButton>
            <ToggleButton size={size} icon="eye" label="Show guides" />
            <ToggleButton size={size} icon="eye" label="Show guides" defaultPressed />
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <ToggleButton shape={shape} end="grid">
              Snap to grid
            </ToggleButton>
            <ToggleButton shape={shape} defaultPressed>
              Snap to grid
            </ToggleButton>
            <ToggleButton shape={shape} icon="lock" label="Lock layer" emphasis="ghost" defaultPressed />
          </DemoRow>
        ))}
        <DemoRow label="Icon only, ghost">
          <ToggleButton icon="star" label="Add to favorites" emphasis="ghost" />
          <ToggleButton icon="star" label="Add to favorites" emphasis="ghost" defaultPressed />
          <ToggleButton icon="mic" label="Mute microphone" emphasis="ghost" defaultPressed />
          <ToggleButton icon="bell" label="Mute alerts" emphasis="ghost" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {tones.map((tone) => (
            <DemoRow key={tone} label={tone}>
              <ToggleButton tone={tone}>{toneLabelAr[tone]}</ToggleButton>
              <ToggleButton tone={tone} defaultPressed>
                {toneLabelAr[tone]}
              </ToggleButton>
              <ToggleButton tone={tone} emphasis="outline" defaultPressed start="check">
                {toneLabelAr[tone]}
              </ToggleButton>
            </DemoRow>
          ))}
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One toggle">
        <DemoRow>
          <ToggleButton start="grid">Grid view</ToggleButton>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="A formatting bar">
        <DemoRow>
          <ToggleButton emphasis="ghost" defaultPressed>
            Bold
          </ToggleButton>
          <ToggleButton emphasis="ghost">Italic</ToggleButton>
          <ToggleButton emphasis="ghost">Underline</ToggleButton>
          <ToggleButton emphasis="ghost" icon="eye" label="Show guides" defaultPressed />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many toggles, the row wraps">
        <DemoRow>
          {settings.map((label, i) => (
            <ToggleButton key={label} defaultPressed={i % 3 === 0}>
              {label}
            </ToggleButton>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <ToggleButton defaultPressed start="eye">
            Show every comment and every reference on the board while editing
          </ToggleButton>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ToggleButton defaultPressed start="eye">
            عرض كل التعليقات والمراجع على اللوحة أثناء التعديل
          </ToggleButton>
          <ToggleButton>الحفظ التلقائي</ToggleButton>
          <ToggleButton icon="star" label="إضافة للمفضلة" emphasis="ghost" defaultPressed />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <ToggleButton disabled>Grid view</ToggleButton>
          <ToggleButton disabled defaultPressed>
            Grid view
          </ToggleButton>
          <ToggleButton disabled icon="lock" label="Lock layer" defaultPressed />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
