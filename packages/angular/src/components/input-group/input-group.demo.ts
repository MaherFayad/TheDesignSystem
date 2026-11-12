// The InputGroup demo: the same cases, ids and copy as
// packages/react/src/components/InputGroup/InputGroup.demo.tsx.
//
// React fills an action's size, shape, emphasis (outline) and disabled from
// the group. The Angular group cannot set another directive's inputs, so
// the demo writes them on each action (see input-group.ts).
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInput } from '../input/input';
import { DS_INPUT_GROUP, type InputGroupShape, type InputGroupSize } from './input-group';

const sizes: InputGroupSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: InputGroupShape[] = ['default', 'pill'];

const longPath = 'team/design/reviews/2026/november/landing-page-hero-directions-final-round';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_INPUT_GROUP, DsButton, DsField, DsIconButton, DsInput, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes and shapes">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsInputGroup [size]="size" [shape]="shape">
              <span dsInputGroupAddon>https://</span>
              <div dsInput [aria-label]="'Board address, ' + size + ', ' + shape" value="boards.example.com" type="url"></div>
              <button dsIconButton icon="copy" label="Copy address" [size]="size" [shape]="shape" emphasis="outline"></button>
            </div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
        <div dsInputGroup>
          <span dsInputGroupAddon>SAR</span>
          <div dsInput aria-label="Price" type="number" value="249"></div>
        </div>
        <div dsInputGroup>
          <div dsInput aria-label="Width" type="number" value="320"></div>
          <span dsInputGroupAddon>px</span>
        </div>
        <div dsInputGroup>
          <div dsInput aria-label="Email" type="email" placeholder="name@example.com"></div>
          <button dsButton emphasis="outline">Send invite</button>
        </div>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="عربي">
          <div dsInputGroup dir="ltr">
            <span dsInputGroupAddon>https://</span>
            <div dsInput aria-label="رابط اللوحة" type="url" value="boards.example.com"></div>
            <button dsIconButton icon="copy" label="نسخ الرابط" emphasis="outline"></button>
          </div>
          <div dsInputGroup>
            <div dsInput aria-label="السعر" type="number" value="249"></div>
            <span dsInputGroupAddon>ريال</span>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, placeholder only">
      <div dsField label="Workspace address">
        <div dsInputGroup>
          <span dsInputGroupAddon>https://</span>
          <div dsInput placeholder="your-team"></div>
          <span dsInputGroupAddon>.example.com</span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One add on">
      <div dsField label="Budget" description="Before VAT.">
        <div dsInputGroup>
          <span dsInputGroupAddon>SAR</span>
          <div dsInput type="number" value="12000"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Add ons and actions">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
        <div dsField label="Share link">
          <div dsInputGroup>
            <span dsInputGroupAddon>https://</span>
            <div dsInput type="url" readOnly value="boards.example.com/b/42"></div>
            <button dsIconButton icon="copy" label="Copy link" emphasis="outline"></button>
            <button dsIconButton icon="external" label="Open link" emphasis="outline"></button>
          </div>
        </div>
        <div dsField label="Invite people">
          <div dsInputGroup>
            <div dsInput type="email" placeholder="name@example.com"></div>
            <button dsButton emphasis="solid" tone="accent">Send invite</button>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Many groups in a narrow container">
      <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-m);">
        @for (label of ['Width', 'Height', 'Gap', 'Padding', 'Radius', 'Border']; track label; let i = $index) {
          <div dsField [label]="label" orientation="horizontal">
            <div dsInputGroup size="sm">
              <div dsInput type="number" [value]="'' + (i + 1) * 8"></div>
              <span dsInputGroupAddon>px</span>
            </div>
          </div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long value and long add on">
      <div dsField label="Board address" [description]="sample.en.long">
        <div dsInputGroup>
          <span dsInputGroupAddon>https://boards.example.com/</span>
          <div dsInput [value]="longPath"></div>
          <button dsButton emphasis="outline">Copy link</button>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="رابط مساحة العمل" [description]="sample.ar.long">
          <div dsInputGroup dir="ltr">
            <span dsInputGroupAddon>https://</span>
            <div dsInput type="url" value="boards.example.com/team/design"></div>
            <button dsButton emphasis="outline">نسخ الرابط</button>
          </div>
        </div>
        <div dsField label="الميزانية الشهرية للفريق قبل ضريبة القيمة المضافة">
          <div dsInputGroup>
            <div dsInput type="number" value="12000"></div>
            <span dsInputGroupAddon>ريال سعودي</span>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Action in flight">
      <div dsField label="Invite people">
        <div dsInputGroup>
          <div dsInput type="email" value="omar@example.com"></div>
          <button dsButton loading loadingLabel="Sending invite" emphasis="outline">Send invite</button>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="Workspace address" error="Use only letters, digits and dashes, for example spring-launch.">
        <div dsInputGroup>
          <span dsInputGroupAddon>https://</span>
          <div dsInput value="spring launch"></div>
          <span dsInputGroupAddon>.example.com</span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Workspace address" disabled description="Only owners can change the address.">
        <div dsInputGroup>
          <span dsInputGroupAddon>https://</span>
          <div dsInput value="design-team"></div>
          <button dsButton emphasis="outline" disabled>Check address</button>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="Board link" readOnly description="Copy it to share the board.">
        <div dsInputGroup>
          <span dsInputGroupAddon>https://</span>
          <div dsInput type="url" value="boards.example.com/b/42"></div>
          <button dsIconButton icon="copy" label="Copy link" emphasis="outline"></button>
        </div>
      </div>
    </section>
  `,
})
export default class InputGroupDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly longPath = longPath;
}
