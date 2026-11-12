// The CopyButton demo: the same cases, ids and copy as
// packages/react/src/components/CopyButton/CopyButton.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from '../button/button-base';
import { DsCopyButton } from './copy-button';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsCopyButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: each tone in solid, soft, outline, ghost and link">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            @for (emphasis of emphases; track emphasis) {
              <button dsCopyButton [value]="command" [tone]="tone" [emphasis]="emphasis" label="Copy command"></button>
            }
            <button dsCopyButton [value]="command" [tone]="tone" iconOnly label="Copy command"></button>
          </div>
        }
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <button dsCopyButton [size]="size" [value]="command" label="Copy command" emphasis="soft"></button>
            <button dsCopyButton [size]="size" [value]="command" iconOnly label="Copy command"></button>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <button dsCopyButton [shape]="shape" [value]="command" label="Copy link" emphasis="outline"></button>
            <button dsCopyButton [shape]="shape" [value]="command" iconOnly label="Copy link" emphasis="soft"></button>
          </div>
        }
        <div data-demo="row" [label]="'Beside its value'">
          <code id="copy-demo-command">{{ command }}</code>
          <button dsCopyButton [value]="command" target="copy-demo-command" iconOnly label="Copy command"></button>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" [label]="'Default words'">
            <button dsCopyButton [value]="command" emphasis="soft"></button>
            <button dsCopyButton [value]="command" label="نسخ الأمر" emphasis="outline"></button>
            <button dsCopyButton [value]="command" iconOnly></button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One copy button">
        <div data-demo="row">
          <button dsCopyButton [value]="command" label="Copy command"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many values, one copy each">
        <div data-demo="row">
          <button dsCopyButton value="https://example.com/board/42" label="Copy link" emphasis="soft"></button>
          <button dsCopyButton value="board_42" label="Copy board id" emphasis="soft"></button>
          <button dsCopyButton value="#ffd84d" label="Copy color" emphasis="soft"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <button dsCopyButton [value]="command" label="Copy the full install command with every flag and the registry address" emphasis="soft"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <button dsCopyButton [value]="command" label="نسخ أمر التثبيت كامل مع كل الخيارات وعنوان المستودع" emphasis="soft"></button>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsCopyButton [value]="command" disabled label="Copy command" emphasis="soft"></button>
          <button dsCopyButton [value]="command" disabled iconOnly label="Copy command"></button>
        </div>
      </section>
  `,
})
export default class CopyButtonDemo {
  protected readonly tones = tones;
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly command = 'npx the-system add button';
}
