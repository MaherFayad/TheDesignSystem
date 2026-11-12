// The CloseButton demo: the same cases, ids and copy as
// packages/react/src/components/CloseButton/CloseButton.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import type { ButtonShape, ButtonSize } from '../button/button-base';
import { DsCloseButton } from './close-button';

const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];
const closables = ['Close panel', 'Close dialog', 'Close banner', 'Close drawer', 'Remove filter', 'Close preview'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsCloseButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: sizes and shapes; emphasis is always ghost">
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            @for (shape of shapes; track shape) {
              <button dsCloseButton [size]="size" [shape]="shape"></button>
            }
          </div>
        }
        <div data-demo="row" [label]="'Named'">
          <button dsCloseButton label="Close panel"></button>
          <button dsCloseButton label="Remove filter" size="xs"></button>
        </div>
        <h3 data-demo="title">Variants in Arabic, the default name is إغلاق</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" [label]="'Sizes'">
            @for (size of sizes; track size) {
              <button dsCloseButton [size]="size"></button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One close button">
        <div data-demo="row">
          <button dsCloseButton></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many, each named for what it closes">
        <div data-demo="row">
          @for (label of closables; track label) {
            <button dsCloseButton [label]="label"></button>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long name, read by screen readers only">
        <div data-demo="row">
          <button dsCloseButton label="Close the panel with every comment and reference on this board"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic name">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <button dsCloseButton></button>
          <button dsCloseButton label="إغلاق لوحة التعليقات والمراجع" size="lg"></button>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsCloseButton disabled></button>
          <button dsCloseButton disabled size="lg" shape="pill"></button>
        </div>
      </section>
  `,
})
export default class CloseButtonDemo {
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly closables = closables;
}
