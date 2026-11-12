// The FloatingActionButton demo: the same cases, ids and copy as
// packages/react/src/components/FloatingActionButton/FloatingActionButton.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import type { ButtonShape, ButtonTone } from '../button/button-base';
import { DsFloatingActionButton, type FloatingActionButtonSize } from './floating-action-button';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const sizes: FloatingActionButtonSize[] = ['md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

// The "screen" boxes are a small screen stand in: the FAB floats at their
// inline end and block end. A static style string in the order of the React
// style object, because a [style] object binding sorts the keys.
@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsFloatingActionButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: tones, sizes, shapes, extended">
        <div data-demo="row" [label]="'Tones'">
          @for (tone of tones; track tone) {
            <button dsFloatingActionButton position="static" [tone]="tone" icon="plus" label="Create board"></button>
          }
        </div>
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <button dsFloatingActionButton position="static" [size]="size" icon="plus" label="Create board"></button>
            <button dsFloatingActionButton position="static" [size]="size" icon="plus" label="Create board" extended></button>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <button dsFloatingActionButton position="static" [shape]="shape" icon="edit" label="Write note"></button>
            <button dsFloatingActionButton position="static" [shape]="shape" icon="edit" label="Write note" extended></button>
          </div>
        }
        <div data-demo="row" [label]="'Floating in a screen'">
          <div style="position: relative; inline-size: 100%; block-size: var(--ds-dialog-width-sm); max-inline-size: var(--ds-dialog-width-md); border: var(--ds-border-width-default) solid var(--ds-color-border-default); border-radius: var(--ds-radius-card); background: var(--ds-color-bg-surface); overflow: hidden">
            <button dsFloatingActionButton position="absolute" icon="plus" label="Create board" extended></button>
          </div>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" [label]="'Extended'">
            <button dsFloatingActionButton position="static" icon="plus" label="إنشاء لوحة" extended></button>
            <button dsFloatingActionButton position="static" icon="plus" label="إنشاء لوحة"></button>
          </div>
          <div data-demo="row" [label]="'Floating in a screen'">
            <div style="position: relative; inline-size: 100%; block-size: var(--ds-dialog-width-sm); max-inline-size: var(--ds-dialog-width-md); border: var(--ds-border-width-default) solid var(--ds-color-border-default); border-radius: var(--ds-radius-card); background: var(--ds-color-bg-surface); overflow: hidden">
              <button dsFloatingActionButton position="absolute" icon="edit" label="كتابة ملاحظة" extended></button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One action, floating">
        <div style="position: relative; inline-size: 100%; block-size: var(--ds-dialog-width-sm); max-inline-size: var(--ds-dialog-width-md); border: var(--ds-border-width-default) solid var(--ds-color-border-default); border-radius: var(--ds-radius-card); background: var(--ds-color-bg-surface); overflow: hidden">
          <button dsFloatingActionButton position="absolute" icon="plus" label="Create board"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text, extended">
        <div data-demo="row">
          <button dsFloatingActionButton position="static" icon="plus" label="Create a board from every reference in this folder" extended></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <button dsFloatingActionButton position="static" icon="plus" label="إنشاء لوحة من كل المراجع في المجلد" extended></button>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div data-demo="row">
          <button dsFloatingActionButton position="static" icon="send" label="Send message" loading></button>
          <button dsFloatingActionButton position="static" icon="send" label="Send message" extended loading></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsFloatingActionButton position="static" icon="plus" label="Create board" disabled></button>
          <button dsFloatingActionButton position="static" icon="plus" label="Create board" extended disabled></button>
        </div>
      </section>
  `,
})
export default class FloatingActionButtonDemo {
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
}
