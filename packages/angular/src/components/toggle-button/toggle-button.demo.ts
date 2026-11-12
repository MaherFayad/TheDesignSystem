// The ToggleButton demo: the same cases, ids and copy as
// packages/react/src/components/ToggleButton/ToggleButton.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import type { ButtonShape, ButtonSize, ButtonTone } from '../button/button-base';
import type { IconButtonEmphasis } from '../icon-button/icon-button';
import { DsToggleButton } from './toggle-button';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: IconButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

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

const settings = ['Bold', 'Italic', 'Underline', 'Grid view', 'Snap to grid', 'Show rulers', 'Show guides', 'Live preview', 'Auto save', 'Dark canvas', 'Pixel preview', 'Outline mode'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsToggleButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: each tone in solid, soft, outline and ghost, off then on">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            @for (emphasis of emphases; track emphasis) {
              <button dsToggleButton [tone]="tone" [emphasis]="emphasis">{{ toneLabel[tone] }}</button>
            }
            @for (emphasis of emphases; track emphasis) {
              <button dsToggleButton [tone]="tone" [emphasis]="emphasis" defaultPressed>{{ toneLabel[tone] }}</button>
            }
          </div>
        }
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <button dsToggleButton [size]="size" start="grid">Grid view</button>
            <button dsToggleButton [size]="size" start="grid" defaultPressed>Grid view</button>
            <button dsToggleButton [size]="size" icon="eye" label="Show guides"></button>
            <button dsToggleButton [size]="size" icon="eye" label="Show guides" defaultPressed></button>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <button dsToggleButton [shape]="shape" end="grid">Snap to grid</button>
            <button dsToggleButton [shape]="shape" defaultPressed>Snap to grid</button>
            <button dsToggleButton [shape]="shape" icon="lock" label="Lock layer" emphasis="ghost" defaultPressed></button>
          </div>
        }
        <div data-demo="row" [label]="'Icon only, ghost'">
          <button dsToggleButton icon="star" label="Add to favorites" emphasis="ghost"></button>
          <button dsToggleButton icon="star" label="Add to favorites" emphasis="ghost" defaultPressed></button>
          <button dsToggleButton icon="mic" label="Mute microphone" emphasis="ghost" defaultPressed></button>
          <button dsToggleButton icon="bell" label="Mute alerts" emphasis="ghost"></button>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (tone of tones; track tone) {
            <div data-demo="row" [label]="tone">
              <button dsToggleButton [tone]="tone">{{ toneLabelAr[tone] }}</button>
              <button dsToggleButton [tone]="tone" defaultPressed>{{ toneLabelAr[tone] }}</button>
              <button dsToggleButton [tone]="tone" emphasis="outline" defaultPressed start="check">{{ toneLabelAr[tone] }}</button>
            </div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One toggle">
        <div data-demo="row">
          <button dsToggleButton start="grid">Grid view</button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A formatting bar">
        <div data-demo="row">
          <button dsToggleButton emphasis="ghost" defaultPressed>Bold</button>
          <button dsToggleButton emphasis="ghost">Italic</button>
          <button dsToggleButton emphasis="ghost">Underline</button>
          <button dsToggleButton emphasis="ghost" icon="eye" label="Show guides" defaultPressed></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many toggles, the row wraps">
        <div data-demo="row">
          @for (label of settings; track label; let i = $index) {
            <button dsToggleButton [defaultPressed]="i % 3 === 0">{{ label }}</button>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <button dsToggleButton defaultPressed start="eye">Show every comment and every reference on the board while editing</button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <button dsToggleButton defaultPressed start="eye">عرض كل التعليقات والمراجع على اللوحة أثناء التعديل</button>
          <button dsToggleButton>الحفظ التلقائي</button>
          <button dsToggleButton icon="star" label="إضافة للمفضلة" emphasis="ghost" defaultPressed></button>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsToggleButton disabled>Grid view</button>
          <button dsToggleButton disabled defaultPressed>Grid view</button>
          <button dsToggleButton disabled icon="lock" label="Lock layer" defaultPressed></button>
        </div>
      </section>
  `,
})
export default class ToggleButtonDemo {
  protected readonly tones = tones;
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly toneLabel = toneLabel;
  protected readonly toneLabelAr = toneLabelAr;
  protected readonly settings = settings;
}
