// The SplitButton demo: the same cases, ids and copy as
// packages/react/src/components/SplitButton/SplitButton.demo.tsx. React's
// Items component is the @for inside each dsSplitButtonMenu template.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsButtonGroup } from '../button-group/button-group';
import { DsDropdownMenuItem } from '../dropdown-menu/dropdown-menu';
import { DsSplitButton, DsSplitButtonMenu, type SplitButtonEmphasis, type SplitButtonShape, type SplitButtonSize, type SplitButtonTone } from './split-button';

const emphases: SplitButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const tones: SplitButtonTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const sizes: SplitButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SplitButtonShape[] = ['default', 'pill', 'square'];

const copy = {
  en: {
    label: 'Publish page',
    menu: 'More publish options',
    many: ['Schedule publish', 'Publish to staging', 'Save as draft', 'Publish to production', 'Publish and notify team', 'Publish as unlisted page', 'Publish with comments off'],
  },
  ar: {
    label: 'نشر الصفحة',
    menu: 'خيارات النشر الأخرى',
    many: ['جدولة النشر', 'النشر للتجربة', 'الحفظ كمسودة', 'النشر للإنتاج', 'النشر مع تنبيه الفريق', 'النشر كصفحة غير مدرجة', 'النشر بدون تعليقات'],
  },
} as const;

const icons = ['clock', 'upload', 'file', 'globe', 'bell', 'eye-off', 'lock'] as const;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsButton, DsButtonGroup, DsDropdownMenuItem, DsSplitButton, DsSplitButtonMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: emphasis by tone, sizes, shapes, in a group">
        @for (emphasis of emphases; track emphasis) {
          <div data-demo="row" [label]="emphasis">
            @for (tone of tones; track tone) {
              <div dsSplitButton [emphasis]="emphasis" [tone]="tone" [label]="copy.en.label" [menuLabel]="copy.en.menu">
                <ng-template dsSplitButtonMenu>
                  @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
                </ng-template>
              </div>
            }
          </div>
        }
        <div data-demo="row" [label]="'Sizes'">
          @for (size of sizes; track size) {
            <div dsSplitButton [size]="size" tone="accent" emphasis="solid" start="upload" [label]="copy.en.label" [menuLabel]="copy.en.menu">
              <ng-template dsSplitButtonMenu>
                @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
              </ng-template>
            </div>
          }
        </div>
        <div data-demo="row" [label]="'Shapes'">
          @for (shape of shapes; track shape) {
            <div dsSplitButton [shape]="shape" [label]="copy.en.label" [menuLabel]="copy.en.menu">
              <ng-template dsSplitButtonMenu>
                @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
              </ng-template>
            </div>
          }
        </div>
        <div data-demo="row" [label]="'In an attached group'">
          <div dsButtonGroup attached emphasis="outline" aria-label="Page actions">
            <button dsButton>Preview page</button>
            <div dsSplitButton [label]="copy.en.label" [menuLabel]="copy.en.menu">
              <ng-template dsSplitButtonMenu>
                @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
              </ng-template>
            </div>
          </div>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (emphasis of emphases; track emphasis) {
            <div data-demo="row" [label]="emphasis">
              <div dsSplitButton [emphasis]="emphasis" tone="accent" start="upload" [label]="copy.ar.label" [menuLabel]="copy.ar.menu">
                <ng-template dsSplitButtonMenu>
                  @for (item of ar3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
                </ng-template>
              </div>
              <div dsSplitButton [emphasis]="emphasis" [label]="copy.ar.label" [menuLabel]="copy.ar.menu">
                <ng-template dsSplitButtonMenu>
                  @for (item of ar3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
                </ng-template>
              </div>
            </div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One related action">
        <div data-demo="row">
          <div dsSplitButton tone="accent" emphasis="solid" label="Save changes" menuLabel="More save options">
            <ng-template dsSplitButtonMenu>
              <div dsDropdownMenuItem start="copy">Save as copy</div>
            </ng-template>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Seven related actions, the most a menu holds">
        <div data-demo="row">
          <div dsSplitButton tone="accent" emphasis="solid" [label]="copy.en.label" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of copy.en.many; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text: the action label ends in an ellipsis, the trigger keeps its square">
        <div style="max-inline-size: var(--ds-menu-width-min)">
          <div dsSplitButton [label]="sample.en.long" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: var(--ds-menu-width-min)">
          <div dsSplitButton [label]="sample.ar.long" [menuLabel]="copy.ar.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of ar3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading: the action blocks, the menu stays usable">
        <div data-demo="row">
          <div dsSplitButton loading tone="accent" emphasis="solid" [label]="copy.en.label" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
          <div dsSplitButton loading [label]="copy.en.label" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled: both halves stay focusable with aria-disabled">
        <div data-demo="row">
          <div dsSplitButton disabled tone="accent" emphasis="solid" [label]="copy.en.label" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
          <div dsSplitButton disabled emphasis="outline" [label]="copy.en.label" [menuLabel]="copy.en.menu">
            <ng-template dsSplitButtonMenu>
              @for (item of en3; track item; let i = $index) { <div dsDropdownMenuItem [start]="icons[i]">{{ item }}</div> }
            </ng-template>
          </div>
        </div>
      </section>
  `,
})
export default class SplitButtonDemo {
  protected readonly emphases = emphases;
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly copy = copy;
  protected readonly icons = icons;
  protected readonly sample = sample;
  protected readonly en3 = copy.en.many.slice(0, 3);
  protected readonly ar3 = copy.ar.many.slice(0, 3);
}
