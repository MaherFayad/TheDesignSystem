// The ScrubInput demo: the same cases, ids and copy as
// packages/react/src/components/ScrubInput/ScrubInput.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsScrubInput, type ScrubInputSize } from './scrub-input';

const sizes: ScrubInputSize[] = ['xs', 'sm', 'md'];

const layers: [string, number][] = [
  ['Header', 64],
  ['Hero', 520],
  ['Title', 48],
  ['Subtitle', 24],
  ['Button', 40],
  ['Card grid', 880],
  ['Card', 280],
  ['Footer', 120],
  ['Logo', 32],
  ['Divider', 1],
  ['Badge', 20],
  ['Avatar', 36],
];

/**
 * A Studio inspector panel: two fields a row, the inspector gutter. The style
 * text is the one React writes for its style object, so the DOM is the same.
 */
const panel = 'display: grid; grid-template-columns: repeat(2, minmax(0px, 1fr)); gap: var(--ds-inspector-field-gap); max-inline-size: var(--ds-dialog-width-sm);';

/** ScrubInput on its own, in an inspector panel and in a Field, in every content case. */
@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsField, DsScrubInput, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, labels, units and mixed">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(9rem, 100%), 1fr));">
        @for (size of sizes; track size) {
          <div dsScrubInput [size]="size" label="W" [aria-label]="'Width, ' + size" [value]="320" unit="px" [min]="0"></div>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(9rem, 100%), 1fr));">
        <div dsScrubInput label="refresh" aria-label="Rotation" [value]="45" unit="deg" [min]="-360" [max]="360"></div>
        <div dsScrubInput label="eye" aria-label="Opacity" [value]="80" unit="%" [min]="0" [max]="100"></div>
        <div dsScrubInput label="X" aria-label="Position X" [value]="-12.5"></div>
        <div dsScrubInput label="H" aria-label="Height" mixed unit="px"></div>
      </div>
      <div dsTheme lang="ar">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(9rem, 100%), 1fr));">
          <div dsScrubInput label="ع" aria-label="العرض" [value]="320" unit="px" [min]="0"></div>
          <div dsScrubInput label="refresh" aria-label="الدوران" [value]="45" unit="deg"></div>
          <div dsScrubInput label="ط" aria-label="الطول" mixed mixedLabel="متعدد" unit="px"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty">
      <div [attr.style]="panel">
        <div dsScrubInput label="W" aria-label="Width" unit="px" placeholder="Auto" [min]="0"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One field">
      <div [attr.style]="panel">
        <div dsScrubInput label="W" aria-label="Width" [value]="1440" unit="px" [min]="0"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="An inspector section, one value mixed">
      <div [attr.style]="panel">
        <div dsScrubInput label="X" aria-label="Position X" [value]="120" size="sm"></div>
        <div dsScrubInput label="Y" aria-label="Position Y" [value]="48" size="sm"></div>
        <div dsScrubInput label="W" aria-label="Width" [value]="320" unit="px" [min]="0" size="sm"></div>
        <div dsScrubInput label="H" aria-label="Height" mixed unit="px" [min]="0" size="sm"></div>
        <div dsScrubInput label="refresh" aria-label="Rotation" [value]="0" unit="deg" size="sm"></div>
        <div dsScrubInput label="eye" aria-label="Opacity" [value]="100" unit="%" [min]="0" [max]="100" size="sm"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Every layer height in a narrow panel">
      <div [attr.style]="panel">
        @for (layer of layers; track layer[0]) {
          <div dsScrubInput label="H" [aria-label]="layer[0] + ' height'" [value]="layer[1]" unit="px" [min]="0" size="xs"></div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="A long value in a narrow field">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0px, 1fr)); gap: var(--ds-inspector-field-gap); max-inline-size: var(--ds-dialog-width-sm);">
        <div dsScrubInput label="W" aria-label="Canvas width" [value]="123456789.25" unit="px"></div>
        <div dsScrubInput label="X" aria-label="Offset X" [value]="-98765.43" unit="px"></div>
        <div dsScrubInput label="refresh" aria-label="Rotation" [value]="359.99" unit="deg"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Arabic, in a Field with a long label">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="display: grid; grid-template-columns: minmax(0px, 1fr); gap: var(--ds-inspector-field-gap); max-inline-size: var(--ds-dialog-width-sm);">
          <div dsField label="المسافة بين العناصر داخل المجموعة" description="اسحب الحرف لتغيير القيمة، أو اكتب رقم أو عملية مثل 12*2.">
            <div dsScrubInput label="م" [value]="24" unit="px" [min]="0"></div>
          </div>
          <div dsField label="الطول">
            <div dsScrubInput label="ط" mixed mixedLabel="متعدد" unit="px"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid">
      <div [attr.style]="panel">
        <div dsField label="Width" error="Enter a width of 1 px or more.">
          <div dsScrubInput label="W" [value]="0" unit="px"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div [attr.style]="panel">
        <div dsScrubInput label="W" aria-label="Width" [value]="320" unit="px" disabled></div>
        <div dsScrubInput label="H" aria-label="Height" [value]="240" unit="px" disabled></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div [attr.style]="panel">
        <div dsScrubInput label="W" aria-label="Width" [value]="320" unit="px" readOnly></div>
        <div dsScrubInput label="H" aria-label="Height" [value]="240" unit="px" readOnly></div>
      </div>
    </section>
  `,
})
export default class ScrubInputDemo {
  protected readonly sizes = sizes;
  protected readonly layers = layers;
  protected readonly panel = panel;
}
