// The IconButton demo: the same cases, ids and copy as
// packages/react/src/components/IconButton/IconButton.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { IconName } from '@the-system/icons';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import type { ButtonShape, ButtonSize, ButtonTone } from '../button/button-base';
import { DsIconButton, type IconButtonEmphasis } from './icon-button';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: IconButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

const toneAction: Record<ButtonTone, [IconName, string]> = {
  neutral: ['settings', 'Open settings'],
  accent: ['plus', 'Add page'],
  danger: ['trash', 'Delete file'],
  success: ['check', 'Approve change'],
  warning: ['warning', 'Show warnings'],
  info: ['info', 'Show details'],
};

const toneActionAr: Record<ButtonTone, string> = {
  neutral: 'فتح الإعدادات',
  accent: 'إضافة صفحة',
  danger: 'حذف الملف',
  success: 'اعتماد التعديل',
  warning: 'عرض التنبيهات',
  info: 'عرض التفاصيل',
};

const toolbar: [IconName, string, string][] = [
  ['plus', 'Add page', 'إضافة صفحة'],
  ['copy', 'Copy link', 'نسخ الرابط'],
  ['edit', 'Rename page', 'تغيير الاسم'],
  ['download', 'Download file', 'تنزيل الملف'],
  ['upload', 'Upload file', 'رفع ملف'],
  ['search', 'Search board', 'البحث في اللوحة'],
  ['filter', 'Filter items', 'تصفية العناصر'],
  ['sort', 'Sort items', 'ترتيب العناصر'],
  ['star', 'Add to favorites', 'إضافة للمفضلة'],
  ['link', 'Share link', 'مشاركة الرابط'],
  ['bell', 'Open alerts', 'فتح التنبيهات'],
  ['settings', 'Open settings', 'فتح الإعدادات'],
  ['more', 'Show more actions', 'إجراءات إضافية'],
  ['trash', 'Delete page', 'حذف الصفحة'],
  ['close', 'Close panel', 'إغلاق اللوحة'],
  ['chevron-back', 'Open previous page', 'الصفحة السابقة'],
  ['chevron-forward', 'Open next page', 'الصفحة التالية'],
  ['help', 'Open help', 'فتح المساعدة'],
];

@Component({
  // The host is the demo page element itself, so the gallery adds no wrapper.
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsIconButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: each tone in solid, soft, outline and ghost">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            @for (emphasis of emphases; track emphasis) {
              <button dsIconButton [icon]="toneAction[tone][0]" [label]="toneAction[tone][1]" [tone]="tone" [emphasis]="emphasis"></button>
            }
          </div>
        }
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            <button dsIconButton [size]="size" icon="plus" label="Add page" tone="accent" emphasis="solid"></button>
            <button dsIconButton [size]="size" icon="settings" label="Open settings" emphasis="soft"></button>
            <button dsIconButton [size]="size" icon="more" label="Show more actions" emphasis="outline"></button>
            <button dsIconButton [size]="size" icon="close" label="Close panel"></button>
          </div>
        }
        @for (shape of shapes; track shape) {
          <div data-demo="row" [label]="'Shape ' + shape">
            <button dsIconButton [shape]="shape" icon="plus" label="Add page" tone="accent" emphasis="solid"></button>
            <button dsIconButton [shape]="shape" icon="edit" label="Rename page" emphasis="soft"></button>
            <button dsIconButton [shape]="shape" icon="copy" label="Copy link" emphasis="outline"></button>
          </div>
        }
        <div data-demo="row" [label]="'As a link'">
          <a dsIconButton href="#docs" icon="external" label="Open docs" emphasis="outline"></a>
        </div>
        <div data-demo="row" [label]="'Mirrors in Arabic'">
          <button dsIconButton icon="chevron-back" label="Open previous page" emphasis="soft"></button>
          <button dsIconButton icon="chevron-forward" label="Open next page" emphasis="soft"></button>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (tone of tones; track tone) {
            <div data-demo="row" [label]="tone">
              @for (emphasis of emphases; track emphasis) {
                <button dsIconButton [icon]="toneAction[tone][0]" [label]="toneActionAr[tone]" [tone]="tone" [emphasis]="emphasis"></button>
              }
            </div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One icon button">
        <div data-demo="row">
          <button dsIconButton icon="close" label="Close panel"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A toolbar">
        <div data-demo="row">
          @for (item of toolbar.slice(0, 6); track item[1]) {
            <button dsIconButton [icon]="item[0]" [label]="item[1]"></button>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many icon buttons, the row wraps">
        <div data-demo="row">
          @for (item of twice; track $index) {
            <button dsIconButton [icon]="item[0]" [label]="item[1]" emphasis="soft"></button>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long label, read by screen readers only">
        <div data-demo="row">
          <button dsIconButton icon="download" label="Download every file on this board as one archive with the comments and references" emphasis="soft"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Arabic toolbar and a long Arabic label">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          @for (item of toolbar; track item[2]) {
            <button dsIconButton [icon]="item[0]" [label]="item[2]" emphasis="soft"></button>
          }
        </div>
        <div data-demo="row">
          <button dsIconButton icon="download" label="تنزيل كل ملفات اللوحة في ملف واحد مع التعليقات والمراجع" size="lg"></button>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="loading" heading="Loading">
        <div data-demo="row">
          <button dsIconButton loading icon="upload" label="Upload file" tone="accent" emphasis="solid"></button>
          <button dsIconButton loading icon="download" label="Download file" emphasis="soft"></button>
          <button dsIconButton loading icon="trash" label="Delete file" tone="danger" emphasis="soft"></button>
          <button dsIconButton loading icon="send" label="Send message" size="lg"></button>
          <button dsIconButton loading loadingLabel="Sending message" icon="send" label="Send message" emphasis="outline"></button>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <button dsIconButton disabled icon="plus" label="Add page" tone="accent" emphasis="solid"></button>
          <button dsIconButton disabled icon="settings" label="Open settings" emphasis="soft"></button>
          <button dsIconButton disabled icon="trash" label="Delete file" tone="danger" emphasis="ghost"></button>
          <button dsIconButton disabled icon="close" label="Close panel"></button>
        </div>
      </section>
  `,
})
export default class IconButtonDemo {
  protected readonly tones = tones;
  protected readonly emphases = emphases;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly toneAction = toneAction;
  protected readonly toneActionAr = toneActionAr;
  protected readonly toolbar = toolbar;
  protected readonly twice = [...toolbar, ...toolbar];
}
