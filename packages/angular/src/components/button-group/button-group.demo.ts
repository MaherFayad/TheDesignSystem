// The ButtonGroup demo: the same cases, ids and copy as
// packages/react/src/components/ButtonGroup/ButtonGroup.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsButtonGroup } from './button-group';
import type { ButtonGroupEmphasis, ButtonGroupShape, ButtonGroupSize } from './button-group-context';

const emphases: ButtonGroupEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonGroupSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonGroupShape[] = ['default', 'pill', 'square'];

const actions = ['Copy link', 'Share board', 'Export kit', 'Rename page', 'Move folder', 'Archive thread', 'Download report', 'Open settings'];
const actionsAr = ['نسخ الرابط', 'مشاركة اللوحة', 'تصدير الحزمة', 'تغيير الاسم', 'نقل المجلد', 'أرشفة المحادثة', 'تنزيل التقرير', 'فتح الإعدادات'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsButton, DsIconButton, DsButtonGroup, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <ng-template #viewSwitch let-size>
        <div dsButtonGroup attached [size]="size" emphasis="outline" aria-label="Board view">
          <button dsIconButton icon="list" label="Show as list"></button>
          <button dsIconButton icon="grid" label="Show as grid"></button>
          <button dsIconButton icon="columns" label="Show as columns"></button>
        </div>
      </ng-template>

      <section data-demo="case" data-demo-case="variants" heading="Variants: attached in each emphasis, sizes, shapes and orientation">
        @for (emphasis of emphases; track emphasis) {
          <div data-demo="row" [label]="'Attached ' + emphasis">
            <div dsButtonGroup attached [emphasis]="emphasis" aria-label="Page actions">
              <button dsButton>Save draft</button>
              <button dsButton>Preview page</button>
              <button dsButton>Share board</button>
            </div>
            <div dsButtonGroup attached [emphasis]="emphasis" aria-label="Pages">
              <button dsIconButton icon="chevron-back" label="Open previous page"></button>
              <button dsIconButton icon="chevron-forward" label="Open next page"></button>
            </div>
          </div>
        }
        <div data-demo="row" [label]="'Accent child'">
          <div dsButtonGroup attached emphasis="solid" aria-label="Publish actions">
            <button dsButton tone="accent">Publish page</button>
            <button dsButton tone="accent">Schedule post</button>
          </div>
          <div dsButtonGroup attached aria-label="Delete actions">
            <button dsButton tone="danger">Delete file</button>
            <button dsButton tone="danger">Delete folder</button>
          </div>
        </div>
        <div data-demo="row" [label]="'Spaced'">
          <div dsButtonGroup aria-label="Form actions">
            <button dsButton tone="accent" emphasis="solid">Save changes</button>
            <button dsButton>Preview page</button>
            <button dsButton emphasis="ghost">Discard edits</button>
          </div>
        </div>
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <div dsButtonGroup attached [size]="size" emphasis="soft" aria-label="File actions">
              <button dsButton start="plus">Add file</button>
              <button dsButton>Copy link</button>
              <button dsIconButton icon="more" label="Open more actions"></button>
            </div>
            <ng-container [ngTemplateOutlet]="viewSwitch" [ngTemplateOutletContext]="{ $implicit: size }" />
            <div dsButtonGroup [size]="size" aria-label="Zoom">
              <button dsIconButton icon="zoom-out" label="Zoom out" emphasis="soft"></button>
              <button dsIconButton icon="zoom-in" label="Zoom in" emphasis="soft"></button>
            </div>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <div dsButtonGroup attached [shape]="shape" aria-label="Page actions">
              <button dsButton>Save draft</button>
              <button dsButton>Preview page</button>
              <button dsButton>Share board</button>
            </div>
            <div dsButtonGroup [shape]="shape" emphasis="outline" aria-label="Board actions">
              <button dsButton>Copy link</button>
              <button dsButton>Export kit</button>
            </div>
          </div>
        }
        <div data-demo="row" [label]="'Vertical'">
          <div dsButtonGroup attached orientation="vertical" aria-label="Arrange">
            <button dsButton start="arrow-up">Bring forward</button>
            <button dsButton start="arrow-down">Send backward</button>
            <button dsButton start="refresh">Reset order</button>
          </div>
          <div dsButtonGroup attached orientation="vertical" emphasis="outline" aria-label="Zoom">
            <button dsIconButton icon="zoom-in" label="Zoom in"></button>
            <button dsIconButton icon="zoom-out" label="Zoom out"></button>
          </div>
          <div dsButtonGroup orientation="vertical" aria-label="Export">
            <button dsButton start="download">Download report</button>
            <button dsButton start="copy">Copy link</button>
          </div>
        </div>
        <div data-demo="row" [label]="'Full width'">
          <div dsButtonGroup attached fullWidth aria-label="Billing period">
            <button dsButton>Pay monthly</button>
            <button dsButton>Pay yearly</button>
          </div>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (emphasis of emphases; track emphasis) {
            <div data-demo="row" [label]="emphasis">
              <div dsButtonGroup attached [emphasis]="emphasis" aria-label="إجراءات الصفحة">
                <button dsButton>حفظ المسودة</button>
                <button dsButton>معاينة الصفحة</button>
                <button dsButton>مشاركة اللوحة</button>
              </div>
              <div dsButtonGroup attached [emphasis]="emphasis" aria-label="الصفحات">
                <button dsIconButton icon="chevron-back" label="الصفحة السابقة"></button>
                <button dsIconButton icon="chevron-forward" label="الصفحة التالية"></button>
              </div>
            </div>
          }
          <div data-demo="row" [label]="'Sizes'">
            @for (size of sizes; track size) {
              <div dsButtonGroup attached [size]="size" aria-label="إجراءات الملف">
                <button dsButton start="plus">إضافة ملف</button>
                <button dsButton>نسخ الرابط</button>
              </div>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One group">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="Page actions">
            <button dsButton>Save draft</button>
            <button dsButton>Preview page</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Five actions, the most a group holds">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="Board actions">
            @for (label of actions.slice(0, 5); track label) {
              <button dsButton>{{ label }}</button>
            }
          </div>
        </div>
        <div data-demo="row">
          <div dsButtonGroup aria-label="Board actions">
            @for (label of actions.slice(0, 5); track label) {
              <button dsButton emphasis="outline">{{ label }}</button>
            }
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many actions: a spaced group wraps; past five, move the rest to a menu">
        <div data-demo="row">
          <div dsButtonGroup aria-label="Board actions">
            @for (label of actions; track label) {
              <button dsButton>{{ label }}</button>
            }
          </div>
        </div>
        <div data-demo="row" [label]="'Squeezed, attached labels end in an ellipsis'">
          <div style="max-inline-size: var(--ds-menu-width-min)">
            <div dsButtonGroup attached aria-label="Board actions">
              @for (label of actions.slice(0, 3); track label) {
                <button dsButton>{{ label }}</button>
              }
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="Upload actions">
            <button dsButton start="upload">Upload every file in this folder</button>
            <button dsButton>Replace the older versions on the board</button>
          </div>
        </div>
        <div data-demo="row" [label]="'Vertical, wrap'">
          <div style="max-inline-size: var(--ds-menu-width-min)">
            <div dsButtonGroup attached fullWidth orientation="vertical" aria-label="Download actions">
              <button dsButton wrap>Download the full report with every comment</button>
              <button dsButton wrap>Download only the summary page</button>
            </div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="إجراءات اللوحة">
            @for (label of actionsAr.slice(0, 5); track label) {
              <button dsButton>{{ label }}</button>
            }
          </div>
        </div>
        <div data-demo="row">
          <div dsButtonGroup aria-label="إجراءات اللوحة">
            @for (label of actionsAr.slice(3); track label) {
              <button dsButton size="sm">{{ label }}</button>
            }
          </div>
        </div>
        <div data-demo="row">
          <div dsButtonGroup attached size="lg" emphasis="soft" aria-label="إجراءات الرفع">
            <button dsButton start="upload">رفع كل ملفات المجلد واستبدال النسخ القديمة</button>
            <button dsIconButton icon="more" label="إجراءات أكثر"></button>
          </div>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading: one child at a time">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="Page actions">
            <button dsButton loading loadingLabel="Saving draft">Save draft</button>
            <button dsButton>Preview page</button>
            <button dsButton>Share board</button>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled children stay in the tab order">
        <div data-demo="row">
          <div dsButtonGroup attached aria-label="Page actions">
            <button dsButton>Save draft</button>
            <button dsButton disabled>Preview page</button>
            <button dsButton>Share board</button>
          </div>
          <div dsButtonGroup attached emphasis="outline" aria-label="Pages">
            <button dsIconButton icon="chevron-back" label="Open previous page" disabled></button>
            <button dsIconButton icon="chevron-forward" label="Open next page"></button>
          </div>
        </div>
      </section>
  `,
})
export default class ButtonGroupDemo {
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly actions = actions;
  protected readonly actionsAr = actionsAr;
}
